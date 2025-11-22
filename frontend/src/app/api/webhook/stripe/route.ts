import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { recalculateBookingBalance } from '@/lib/booking/balance';
import { updateBillingStatus } from '@/lib/booking/billing-status';
import { logger } from '@/lib/logger';
import {
  createStripeClient,
  getStripeSecretKey,
  getStripeWebhookSecret,
} from '@/lib/stripe/config';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const stripe = createStripeClient(await getStripeSecretKey());

  try {
    // Get webhook secret from Supabase secrets
    const webhookSecret = getStripeWebhookSecret();

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      logger.warn('Missing Stripe signature', {
        component: 'stripe-webhook-api',
        action: 'missing_signature',
      });

      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.error(
        'Webhook signature verification failed',
        {
          component: 'stripe-webhook-api',
          action: 'signature_verification_failed',
        },
        err as Error
      );

      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    logger.info('Stripe webhook received', {
      component: 'stripe-webhook-api',
      action: 'webhook_received',
      metadata: {
        type: event.type,
        eventId: event.id,
      },
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        logger.info('Unhandled webhook event type', {
          component: 'stripe-webhook-api',
          action: 'unhandled_event',
          metadata: { type: event.type },
        });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logger.error(
      'Webhook processing error',
      {
        component: 'stripe-webhook-api',
        action: 'processing_error',
      },
      error as Error
    );

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Handle successful checkout session completion
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Use service role client to bypass RLS (webhooks have no user session)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);
  const paymentId = session.metadata?.paymentId;
  const bookingId = session.metadata?.bookingId;

  if (!paymentId || !bookingId) {
    logger.warn('Checkout session completed but missing metadata', {
      component: 'stripe-webhook-api',
      action: 'missing_metadata',
      metadata: { sessionId: session.id },
    });
    return;
  }

  try {
    // Update payment record to completed
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        processedAt: new Date().toISOString(),
        stripePaymentIntentId: session.payment_intent as string,
        stripeMetadata: {
          stripeStatus: session.payment_status,
          amountTotal: session.amount_total,
          customerEmail: session.customer_email,
        },
      })
      .eq('id', paymentId);

    if (paymentError) {
      logger.error('Failed to update payment record', {
        component: 'stripe-webhook-api',
        action: 'payment_update_error',
        metadata: { paymentId, error: paymentError },
      });
    }

    // Check if this was the main payment (not deposit)
    const paymentType = session.metadata?.paymentType;
    if (paymentType === 'payment') {
      // Update booking status to 'paid'
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'paid',
        })
        .eq('id', bookingId);

      if (bookingError) {
        logger.error('Failed to update booking status', {
          component: 'stripe-webhook-api',
          action: 'booking_update_error',
          metadata: { bookingId, error: bookingError },
        });
      }
    }

    // Recalculate booking balance after payment completion
    const newBalance = await recalculateBookingBalance(bookingId);
    if (newBalance === null) {
      logger.warn('Balance recalculation failed after Stripe checkout session', {
        component: 'stripe-webhook-api',
        action: 'balance_recalculation_failed',
        metadata: { bookingId, paymentId, paymentType },
      });
    } else {
      // Update billing status after balance recalculation
      const newBillingStatus = await updateBillingStatus(bookingId);
      if (newBillingStatus === null) {
        logger.warn('Billing status update failed after Stripe checkout session', {
          component: 'stripe-webhook-api',
          action: 'billing_status_update_failed',
          metadata: { bookingId, paymentId, paymentType },
        });
      }

      // Update booking status to 'paid' if balance reaches 0
      if (newBalance === 0 && paymentType === 'payment') {
        const { error: statusUpdateError } = await supabase
          .from('bookings')
          .update({ status: 'paid' })
          .eq('id', bookingId);

        if (statusUpdateError) {
          logger.warn(
            'Failed to update booking status to paid',
            {
              component: 'stripe-webhook-api',
              action: 'booking_status_update_failed',
              metadata: {
                bookingId,
                paymentId,
                error: statusUpdateError.message,
              },
            },
            statusUpdateError
          );
        }
      }
    }

    logger.info('Checkout session payment processed successfully', {
      component: 'stripe-webhook-api',
      action: 'checkout_session_completed',
      metadata: {
        sessionId: session.id,
        paymentId,
        bookingId,
        amount: (session.amount_total || 0) / 100,
      },
    });

    // TODO: Send payment confirmation email
  } catch (error) {
    logger.error(
      'Error processing checkout session',
      {
        component: 'stripe-webhook-api',
        action: 'checkout_processing_error',
        metadata: { sessionId: session.id },
      },
      error as Error
    );
  }
}

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Use service role client to bypass RLS (webhooks have no user session)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    logger.warn('Payment succeeded but no bookingId in metadata', {
      component: 'stripe-webhook-api',
      action: 'missing_booking_id',
    });
    return;
  }

  try {
    // Update payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        processedAt: new Date().toISOString(),
        stripeChargeId: paymentIntent.latest_charge as string,
        stripeMetadata: {
          stripeStatus: paymentIntent.status,
          paymentMethod: paymentIntent.payment_method,
          receiptUrl: (paymentIntent as any).charges?.data?.[0]?.receipt_url,
        },
      })
      .eq('stripePaymentIntentId', paymentIntent.id);

    if (paymentError) {
      logger.error('Failed to update payment record', {
        component: 'stripe-webhook-api',
        action: 'payment_update_error',
      });
    }

    // Update booking status to 'paid'
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: 'paid',
        paymentStatus: 'paid',
      })
      .eq('id', bookingId);

    if (bookingError) {
      logger.error('Failed to update booking status', {
        component: 'stripe-webhook-api',
        action: 'booking_update_error',
      });
    }

    // Recalculate booking balance after payment intent succeeded
    const newBalance = await recalculateBookingBalance(bookingId);
    if (newBalance === null) {
      logger.warn('Balance recalculation failed after Stripe payment intent', {
        component: 'stripe-webhook-api',
        action: 'balance_recalculation_failed',
        metadata: { bookingId, paymentIntentId: paymentIntent.id },
      });
    } else {
      // Update billing status after balance recalculation
      const newBillingStatus = await updateBillingStatus(bookingId);
      if (newBillingStatus === null) {
        logger.warn('Billing status update failed after Stripe payment intent', {
          component: 'stripe-webhook-api',
          action: 'billing_status_update_failed',
          metadata: { bookingId, paymentIntentId: paymentIntent.id },
        });
      }

      // Update booking status to 'paid' if balance reaches 0
      if (newBalance === 0) {
        const { error: statusUpdateError } = await supabase
          .from('bookings')
          .update({ status: 'paid' })
          .eq('id', bookingId);

        if (statusUpdateError) {
          logger.warn(
            'Failed to update booking status to paid',
            {
              component: 'stripe-webhook-api',
              action: 'booking_status_update_failed',
              metadata: {
                bookingId,
                paymentIntentId: paymentIntent.id,
                error: statusUpdateError.message,
              },
            },
            statusUpdateError
          );
        }
      }
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      tableName: 'payments',
      recordId: paymentIntent.id,
      action: 'payment_succeeded',
      userId: paymentIntent.metadata.customerId,
      newValues: {
        amount: paymentIntent.amount / 100,
        status: 'succeeded',
        bookingId,
      },
    });

    logger.info('Payment processed successfully', {
      component: 'stripe-webhook-api',
      action: 'payment_succeeded',
      metadata: {
        paymentIntentId: paymentIntent.id,
        bookingId,
        amount: paymentIntent.amount / 100,
      },
    });

    // TODO: Send payment confirmation email
    // await sendPaymentConfirmationEmail(bookingId, paymentIntent);
  } catch (error) {
    logger.error(
      'Error handling payment success',
      {
        component: 'stripe-webhook-api',
        action: 'handle_success_error',
      },
      error as Error
    );
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const supabase = await createServerClient();
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    logger.warn('Payment failed but no bookingId in metadata', {
      component: 'stripe-webhook-api',
      action: 'missing_booking_id',
    });
    return;
  }

  try {
    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        metadata: {
          stripeStatus: paymentIntent.status,
          failureReason: paymentIntent.last_payment_error?.message || 'Unknown',
        },
      })
      .eq('stripePaymentIntentId', paymentIntent.id);

    // Update booking status
    await supabase
      .from('bookings')
      .update({
        paymentStatus: 'failed',
      })
      .eq('id', bookingId);

    // Create audit log
    await supabase.from('audit_logs').insert({
      tableName: 'payments',
      recordId: paymentIntent.id,
      action: 'payment_failed',
      userId: paymentIntent.metadata.customerId,
      newValues: {
        status: 'failed',
        reason: paymentIntent.last_payment_error?.message,
      },
    });

    logger.info('Payment failed processed', {
      component: 'stripe-webhook-api',
      action: 'payment_failed',
      metadata: {
        paymentIntentId: paymentIntent.id,
        bookingId,
        reason: paymentIntent.last_payment_error?.message,
      },
    });

    // TODO: Send payment failed email
    // await sendPaymentFailedEmail(bookingId, paymentIntent);
  } catch (error) {
    logger.error(
      'Error handling payment failure',
      {
        component: 'stripe-webhook-api',
        action: 'handle_failure_error',
      },
      error as Error
    );
  }
}

// Handle canceled payment
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const supabase = await createServerClient();
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) return;

  try {
    await supabase
      .from('payments')
      .update({
        status: 'cancelled',
      })
      .eq('stripePaymentIntentId', paymentIntent.id);

    logger.info('Payment canceled processed', {
      component: 'stripe-webhook-api',
      action: 'payment_canceled',
      metadata: { paymentIntentId: paymentIntent.id, bookingId },
    });
  } catch (error) {
    logger.error(
      'Error handling payment cancellation',
      {
        component: 'stripe-webhook-api',
        action: 'handle_cancel_error',
      },
      error as Error
    );
  }
}

// Handle refund
async function handleRefund(charge: Stripe.Charge) {
  const supabase = await createServerClient();

  try {
    // Find payment by charge ID
    const { data: payment } = await supabase
      .from('payments')
      .select('id, bookingId, amount')
      .eq('stripeChargeId', charge.id)
      .single();

    if (!payment) {
      logger.warn('Refund for unknown charge', {
        component: 'stripe-webhook-api',
        action: 'unknown_charge',
      });
      return;
    }

    // Get refund amount
    const refundAmount = charge.amount_refunded / 100;

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: refundAmount >= payment.amount ? 'refunded' : 'partially_refunded',
        refundedAt: new Date().toISOString(),
        refundAmount: refundAmount,
      })
      .eq('id', payment.id);

    // Create audit log
    await supabase.from('audit_logs').insert({
      tableName: 'payments',
      recordId: payment.id,
      action: 'refund_processed',
      newValues: {
        refundAmount,
        status: refundAmount >= payment.amount ? 'refunded' : 'partially_refunded',
      },
    });

    logger.info('Refund processed successfully', {
      component: 'stripe-webhook-api',
      action: 'refund_processed',
      metadata: {
        chargeId: charge.id,
        refundAmount,
        bookingId: payment.bookingId,
      },
    });

    // TODO: Send refund confirmation email
    // await sendRefundConfirmationEmail(payment.bookingId, refundAmount);
  } catch (error) {
    logger.error(
      'Error handling refund',
      {
        component: 'stripe-webhook-api',
        action: 'handle_refund_error',
      },
      error as Error
    );
  }
}

// Handle dispute created
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const supabase = await createServerClient();

  try {
    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

    if (!chargeId) return;

    // Find payment by charge ID
    const { data: payment } = await supabase
      .from('payments')
      .select('id, bookingId')
      .eq('stripeChargeId', chargeId)
      .single();

    if (!payment) return;

    // Update payment with dispute info
    await supabase
      .from('payments')
      .update({
        metadata: {
          disputeId: dispute.id,
          disputeReason: dispute.reason,
          disputeStatus: dispute.status,
          disputeAmount: dispute.amount / 100,
        },
      })
      .eq('id', payment.id);

    // Create audit log
    await supabase.from('audit_logs').insert({
      tableName: 'payments',
      recordId: payment.id,
      action: 'dispute_created',
      newValues: {
        disputeId: dispute.id,
        reason: dispute.reason,
        amount: dispute.amount / 100,
      },
    });

    logger.warn('Dispute created', {
      component: 'stripe-webhook-api',
      action: 'dispute_created',
      metadata: {
        disputeId: dispute.id,
        chargeId,
        reason: dispute.reason,
        amount: dispute.amount / 100,
      },
    });

    // TODO: Notify admin team about dispute
    // await notifyAdminAboutDispute(payment.bookingId, dispute);
  } catch (error) {
    logger.error(
      'Error handling dispute',
      {
        component: 'stripe-webhook-api',
        action: 'handle_dispute_error',
      },
      error as Error
    );
  }
}
