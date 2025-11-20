/**
 * Stripe Webhook Handler
 *
 * Handles all Stripe events for the hold system:
 *   - setup_intent.succeeded (payment method saved)
 *   - payment_intent.succeeded (holds authorized)
 *   - payment_intent.canceled (holds released)
 *   - payment_intent.amount_capturable_updated (ready to capture)
 *   - charge.dispute.created (customer dispute - attach evidence)
 */
import Stripe from 'stripe';

import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { checkAndCompleteBookingIfReady } from '@/lib/check-and-complete-booking';
import { sendInvoicePaymentConfirmation } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import {
  broadcastInAppNotificationToAdmins,
  createInAppNotification,
} from '@/lib/notification-service';
import {
  createStripeClient,
  getStripeSecretKey,
  getStripeWebhookSecret,
} from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';

async function getStripeInstance() {
  return createStripeClient(await getStripeSecretKey());
}

type BookingNotificationContext = {
  id: string;
  bookingNumber: string;
  customerId: string | null;
};

type EquipmentRecord = {
  make?: string;
  model?: string;
  type?: string;
  unitId?: string;
};

const normalizeEquipmentRecord = (raw: unknown): EquipmentRecord | null => {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return normalizeEquipmentRecord(raw[0]);
  }
  if (typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const readString = (key: string): string | undefined =>
      typeof record[key] === 'string' ? (record[key] as string) : undefined;

    const normalized: EquipmentRecord = {};
    const make = readString('make');
    const model = readString('model');
    const type = readString('type');
    const unitId = readString('unitId');

    if (make) normalized.make = make;
    if (model) normalized.model = model;
    if (type) normalized.type = type;
    if (unitId) normalized.unitId = unitId;

    return Object.keys(normalized).length > 0 ? normalized : null;
  }

  return null;
};

const CONTRACT_SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour validity for evidence links

async function generateSignedContractUrl(
  supabase: unknown,
  path: string | null | undefined,
  fallbackUrl: string | null | undefined
): Promise<string | null> {
  if (path) {
    const { data, error } = await supabase.storage
      .from('signed-contracts')
      .createSignedUrl(path, CONTRACT_SIGNED_URL_TTL_SECONDS);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }

    logger.warn('Failed to generate signed URL for contract evidence', {
      component: 'stripe-webhook',
      action: 'evidence_signed_url_warning',
      metadata: {
        path,
        error: error?.message,
      },
    });
  }

  return fallbackUrl ?? null;
}

async function getBookingNotificationContext(supabase: unknown, bookingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, bookingNumber, customerId')
    .eq('id', bookingId)
    .maybeSingle();

  if (error) {
    logger.error(
      'Failed to load booking context for notification',
      {
        component: 'stripe-webhook',
        action: 'booking_context_error',
        metadata: { bookingId },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return null;
  }

  return (data as BookingNotificationContext | null) ?? null;
}

export async function POST(request: NextRequest) {
  const stripe = await getStripeInstance();

  try {
    // 1. Get webhook secret from Supabase secrets
    const webhookSecret = getStripeWebhookSecret();

    // 2. Verify webhook signature
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      logger.error('Missing Stripe signature', {
        component: 'stripe-webhook',
        action: 'signature_missing',
      });
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 3. Construct and verify event
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      logger.error('Webhook signature verification failed', {
        component: 'stripe-webhook',
        action: 'verification_failed',
        metadata: { error: err.message },
      });
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    logger.info('Webhook received', {
      component: 'stripe-webhook',
      action: 'received',
      metadata: { type: event.type, id: event.id },
    });

    // Use service role client for webhooks (no user session available)
    const supabase = createClient();

    // 3. Route to appropriate handler based on event type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
          supabase
        );
        break;

      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent, supabase);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case 'payment_intent.amount_capturable_updated':
        await handleAmountCapturableUpdated(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute, supabase);
        break;

      case 'charge.dispute.updated':
        await handleDisputeUpdated(event.data.object as Stripe.Dispute, supabase);
        break;

      case 'payout.paid':
        await handlePayoutPaid(event.data.object as Stripe.Payout, supabase);
        break;

      case 'payout.failed':
        await handlePayoutFailed(event.data.object as Stripe.Payout, supabase);
        break;

      case 'payout.created':
        await handlePayoutCreated(event.data.object as Stripe.Payout, supabase);
        break;

      default:
        logger.info('Unhandled webhook event type', {
          component: 'stripe-webhook',
          action: 'unhandled',
          metadata: { type: event.type },
        });
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    logger.error(
      'Webhook processing failed',
      {
        component: 'stripe-webhook',
        action: 'error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Handle checkout.session.completed
 * Payment completed successfully via Stripe Checkout
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: unknown) {
  const bookingId = session.metadata?.bookingId;
  const paymentId = session.metadata?.paymentId;
  const paymentType = session.metadata?.paymentType || 'payment';

  if (!bookingId || !paymentId) {
    logger.warn('Checkout session completed but missing metadata', {
      component: 'stripe-webhook',
      action: 'checkout_no_metadata',
      metadata: { sessionId: session.id },
    });
    return;
  }

  logger.info('Checkout session completed', {
    component: 'stripe-webhook',
    action: 'checkout_completed',
    metadata: {
      bookingId,
      paymentId,
      paymentType,
      amount: (session.amount_total || 0) / 100,
      sessionId: session.id,
    },
  });

  // Update payment status to completed
  logger.info('Attempting to update payment', {
    component: 'stripe-webhook',
    action: 'update_payment_start',
    metadata: { paymentId, sessionId: session.id },
  });

  const sessionData = session as any;
  const processedAt =
    sessionData.status_transitions?.paid_at != null
      ? new Date(sessionData.status_transitions.paid_at * 1000).toISOString()
      : new Date().toISOString();

  const metadata = {
    ...(session.metadata ?? {}),
    stripeSessionId: session.id,
    stripePaymentStatus: session.payment_status,
    stripeStatus: session.status,
    stripeMode: session.mode,
    stripeCustomerEmail: session.customer_details?.email,
  };

  const { data: updatedPayment, error: paymentUpdateError } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      stripePaymentIntentId: session.payment_intent,
      processedAt,
      stripeMetadata: metadata,
    })
    .eq('id', paymentId)
    .select();

  if (paymentUpdateError) {
    logger.error('Failed to update payment status', {
      component: 'stripe-webhook',
      action: 'payment_update_error',
      metadata: { paymentId, error: paymentUpdateError },
    });
  } else {
    logger.info('Payment updated successfully', {
      component: 'stripe-webhook',
      action: 'payment_updated',
      metadata: { paymentId, updatedCount: updatedPayment?.length || 0 },
    });
  }

  // Check if all payments are completed for this booking
  const { data: allPayments } = await supabase
    .from('payments')
    .select('type, status')
    .eq('bookingId', bookingId);

  const paymentCompleted = allPayments?.some(
    (p: unknown) => p.type === 'payment' && p.status === 'completed'
  );
  const depositCompleted = allPayments?.some(
    (p: unknown) => p.type === 'deposit' && p.status === 'completed'
  );

  // Update booking status if payment (not deposit) is completed
  if (paymentType === 'payment' && paymentCompleted) {
    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({ status: 'paid' })
      .eq('id', bookingId);

    if (bookingUpdateError) {
      logger.error('Failed to update booking status', {
        component: 'stripe-webhook',
        action: 'booking_update_error',
        metadata: { bookingId, error: bookingUpdateError },
      });
    } else {
      logger.info('Booking status updated to paid', {
        component: 'stripe-webhook',
        action: 'booking_paid',
        metadata: { bookingId },
      });

      // Send invoice payment confirmation email
      try {
        const { data: fullBooking } = await supabase
          .from('bookings')
          .select(
            `
            bookingNumber, createdAt, startDate, endDate, totalAmount, subtotal, taxes, floatFee,
            deliveryFee, distanceKm, dailyRate, customerId, securityDeposit,
            deliveryAddress, deliveryCity, deliveryProvince, deliveryPostalCode,
            waiver_selected, waiver_rate_cents,
            couponCode, couponType, couponValue, couponDiscount,
            equipment:equipmentId(make, model, type, unitId)
          `
          )
          .eq('id', bookingId)
          .single();

        const { data: customerData } = await supabase
          .from('users')
          .select('email, firstName, lastName, companyName, phone')
          .eq('id', fullBooking?.customerId)
          .single();

        if (fullBooking && customerData) {
          await sendInvoicePaymentConfirmation(
            {
              bookingNumber: fullBooking.bookingNumber,
              createdAt: fullBooking.createdAt,
              startDate: fullBooking.startDate,
              endDate: fullBooking.endDate,
              subtotal: fullBooking.subtotal,
              taxes: fullBooking.taxes,
              totalAmount: fullBooking.totalAmount,
              dailyRate: fullBooking.dailyRate,
              floatFee: fullBooking.floatFee,
              deliveryFee: fullBooking.deliveryFee,
              distanceKm: fullBooking.distanceKm,
              securityDeposit: fullBooking.securityDeposit,
              waiverSelected: fullBooking.waiver_selected,
              waiverRateCents: fullBooking.waiver_rate_cents,
              couponCode: fullBooking.couponCode,
              couponType: fullBooking.couponType,
              couponValue: fullBooking.couponValue,
              couponDiscount: fullBooking.couponDiscount,
              deliveryAddress: fullBooking.deliveryAddress,
              deliveryCity: fullBooking.deliveryCity,
              deliveryProvince: fullBooking.deliveryProvince,
              deliveryPostalCode: fullBooking.deliveryPostalCode,
              equipment: normalizeEquipmentRecord(fullBooking.equipment),
            },
            {
              amount: (session.amount_total || 0) / 100,
              method: 'Credit Card',
              paidAt: new Date().toISOString(),
              transactionId: session.payment_intent as string,
            },
            {
              email: customerData.email,
              firstName: customerData.firstName || '',
              lastName: customerData.lastName || '',
              company: customerData.companyName || '',
              phone: customerData.phone || '',
            }
          );

          logger.info('✅ Invoice payment confirmation email sent', {
            component: 'stripe-webhook',
            action: 'invoice_email_sent',
            metadata: {
              bookingNumber: fullBooking.bookingNumber,
              customerEmail: customerData.email,
            },
          });
        }
      } catch (emailError) {
        logger.error(
          'Failed to send invoice email',
          {
            component: 'stripe-webhook',
            action: 'invoice_email_error',
          },
          emailError as Error
        );
        // Don't fail webhook if email fails
      }
    }
  }

  // Check if all booking requirements are now complete
  try {
    await checkAndCompleteBookingIfReady(
      bookingId,
      paymentType === 'deposit' ? 'Security Deposit Paid' : 'Invoice Paid'
    );
  } catch (completionError) {
    logger.error(
      'Error checking booking completion',
      {
        component: 'stripe-webhook',
        action: 'completion_check_error',
        metadata: { bookingId },
      },
      completionError as Error
    );
    // Don't fail webhook if completion check fails
  }

  // If both payment and deposit are completed, update to confirmed
  if (paymentCompleted && depositCompleted) {
    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    if (bookingUpdateError) {
      logger.error('Failed to update booking to confirmed', {
        component: 'stripe-webhook',
        action: 'booking_confirmed_error',
        metadata: { bookingId, error: bookingUpdateError },
      });
    } else {
      logger.info('Booking status updated to confirmed', {
        component: 'stripe-webhook',
        action: 'booking_confirmed',
        metadata: { bookingId },
      });
    }
  }

  // TODO: Send payment receipt email
  // await supabase.functions.invoke('send-email', {
  //   body: {
  //     to: session.customer_email,
  //     template: 'payment_receipt',
  //     data: { bookingId, amount: (session.amount_total || 0) / 100 }
  //   }
  // });
}

/**
 * Handle setup_intent.succeeded
 * Save payment method ID to booking for future off_session charges
 */
async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent, supabase: unknown) {
  const bookingId = setupIntent.metadata?.bookingId;

  if (!bookingId) {
    logger.warn('SetupIntent succeeded but no bookingId in metadata', {
      component: 'stripe-webhook',
      action: 'setup_intent_no_booking',
      metadata: { setupIntentId: setupIntent.id },
    });
    return;
  }

  logger.info('Saving payment method from SetupIntent', {
    component: 'stripe-webhook',
    action: 'setup_intent_succeeded',
    metadata: { bookingId, setupIntentId: setupIntent.id },
  });

  // Save payment method ID for future use
  await supabase
    .from('bookings')
    .update({
      stripe_payment_method_id: setupIntent.payment_method as string,
      stripe_setup_intent_id: setupIntent.id,
    })
    .eq('id', bookingId);
}

/**
 * Handle payment_intent.succeeded
 * Hold authorized successfully (either $50 verify or $500 security)
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: unknown
) {
  const bookingId = paymentIntent.metadata.bookingId;
  const purpose = paymentIntent.metadata.purpose;

  if (!bookingId) return;

  logger.info('PaymentIntent authorized', {
    component: 'stripe-webhook',
    action: 'payment_intent_succeeded',
    metadata: {
      bookingId,
      purpose,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status,
    },
  });

  // Update booking_payments status
  await supabase
    .from('booking_payments')
    .update({ status: 'succeeded' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  // If this is the security hold, update booking status
  if (purpose === 'security_hold') {
    await supabase
      .from('bookings')
      .update({ status: 'hold_placed' })
      .eq('security_hold_intent_id', paymentIntent.id);

    const booking = await getBookingNotificationContext(supabase, bookingId);

    if (booking?.customerId) {
      await createInAppNotification({
        supabase,
        userId: booking.customerId,
        category: 'payment',
        priority: 'medium',
        title: 'Security hold placed',
        message: `A ${formatCurrency(paymentIntent.amount / 100)} security hold is now on your card for booking ${booking.bookingNumber}.`,
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/booking/${booking.id}/manage`,
        ctaLabel: 'View booking',
        templateId: 'security_hold_authorized',
        templateData: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          amount: paymentIntent.amount / 100,
          amountFormatted: formatCurrency(paymentIntent.amount / 100),
        },
        metadata: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          amountFormatted: formatCurrency(paymentIntent.amount / 100),
        },
      });
    }
  }
}

/**
 * Handle payment_intent.canceled
 * Hold released (either $50 voided or $500 released)
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent, supabase: unknown) {
  const bookingId = paymentIntent.metadata.bookingId;
  const purpose = paymentIntent.metadata.purpose;

  if (!bookingId) return;

  logger.info('PaymentIntent canceled (hold released)', {
    component: 'stripe-webhook',
    action: 'payment_intent_canceled',
    metadata: {
      bookingId,
      purpose,
      releasedAmount: paymentIntent.amount / 100,
    },
  });

  // Update booking_payments status
  await supabase
    .from('booking_payments')
    .update({ status: 'canceled' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  // If this was the security hold, customer returned equipment clean
  if (purpose === 'security_hold') {
    const booking = await getBookingNotificationContext(supabase, bookingId);

    if (booking?.customerId) {
      await createInAppNotification({
        supabase,
        userId: booking.customerId,
        category: 'payment',
        priority: 'medium',
        title: 'Security hold released',
        message: `Your ${formatCurrency(paymentIntent.amount / 100)} security hold for booking ${booking.bookingNumber} has been released. Thanks for renting with U-Dig It!`,
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/booking/${booking.id}/manage`,
        ctaLabel: 'View receipt',
        templateId: 'security_hold_released',
        templateData: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          amount: paymentIntent.amount / 100,
          amountFormatted: formatCurrency(paymentIntent.amount / 100),
        },
        metadata: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          amountFormatted: formatCurrency(paymentIntent.amount / 100),
        },
      });
    }
  }
}

/**
 * Handle payment_intent.payment_failed
 * Hold authorization failed (card declined, insufficient funds, etc.)
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabase: unknown) {
  const bookingId = paymentIntent.metadata.bookingId;
  const purpose = paymentIntent.metadata.purpose;

  if (!bookingId) return;

  logger.error('PaymentIntent failed', {
    component: 'stripe-webhook',
    action: 'payment_intent_failed',
    metadata: {
      bookingId,
      purpose,
      amount: paymentIntent.amount / 100,
      failureCode: paymentIntent.last_payment_error?.code,
      failureMessage: paymentIntent.last_payment_error?.message,
    },
  });

  // Update booking_payments status
  await supabase
    .from('booking_payments')
    .update({
      status: 'failed',
      metadata: {
        failure_code: paymentIntent.last_payment_error?.code,
        failure_message: paymentIntent.last_payment_error?.message,
        failed_at: new Date().toISOString(),
      },
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  const booking = await getBookingNotificationContext(supabase, bookingId);

  if (booking?.customerId) {
    const commonPayload = {
      supabase,
      userId: booking.customerId,
      category: 'payment' as const,
      priority: purpose === 'security_hold' ? ('critical' as const) : ('high' as const),
      templateData: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        failureReason: paymentIntent.last_payment_error?.message,
      },
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        paymentIntentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message,
      },
    };

    if (purpose === 'verify_hold') {
      await createInAppNotification({
        ...commonPayload,
        title: 'Card verification failed',
        message: 'Card verification failed. Please update your payment method to continue.',
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/booking/${booking.id}/manage`,
        ctaLabel: 'Update card',
        templateId: 'verify_hold_failed_webhook',
      });
    } else if (purpose === 'security_hold') {
      await createInAppNotification({
        ...commonPayload,
        title: 'URGENT: Security hold failed',
        message: `We could not place the ${formatCurrency(500)} security hold. Update your card within 12 hours to avoid cancellation.`,
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/booking/${booking.id}/manage`,
        ctaLabel: 'Fix payment method',
        templateId: 'security_hold_failed_webhook',
      });
    }
  }

  if (purpose === 'security_hold') {
    await broadcastInAppNotificationToAdmins({
      supabase,
      category: 'system',
      priority: 'critical',
      title: `Security hold failed for ${booking?.bookingNumber ?? bookingId}`,
      message: 'Customer needs to update card ASAP. Pickup in <48h.',
      templateId: 'security_hold_failed_admin_webhook',
      templateData: {
        bookingId,
        failureReason: paymentIntent.last_payment_error?.message,
      },
      metadata: {
        bookingId,
        failureReason: paymentIntent.last_payment_error?.message,
        audience: 'admin',
      },
    });
  }
}

/**
 * Handle payment_intent.amount_capturable_updated
 * Hold is ready for capture (edge case logging)
 */
async function handleAmountCapturableUpdated(
  paymentIntent: Stripe.PaymentIntent,
  supabase: unknown
) {
  const bookingId = paymentIntent.metadata.bookingId;

  logger.info('Hold ready for capture', {
    component: 'stripe-webhook',
    action: 'capturable_updated',
    metadata: {
      bookingId,
      capturableAmount: paymentIntent.amount_capturable / 100,
      totalAmount: paymentIntent.amount / 100,
    },
  });
}

/**
 * Handle charge.dispute.created
 * Customer filed a dispute - attach evidence kit
 */
async function handleDisputeCreated(dispute: Stripe.Dispute, supabase: unknown) {
  const paymentIntentId = dispute.payment_intent as string;

  // Find booking from payment intent ID
  const { data: payment } = await supabase
    .from('booking_payments')
    .select('booking_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (!payment) {
    logger.warn('Dispute created but no booking found', {
      component: 'stripe-webhook',
      action: 'dispute_no_booking',
      metadata: { disputeId: dispute.id, paymentIntentId },
    });
    return;
  }

  const bookingId = payment.booking_id;

  logger.error('Dispute created - evidence needed', {
    component: 'stripe-webhook',
    action: 'dispute_created',
    metadata: {
      disputeId: dispute.id,
      bookingId,
      amount: dispute.amount / 100,
      reason: dispute.reason,
    },
  });

  // Get booking and contract details for evidence
  const { data: booking } = await supabase
    .from('bookings')
    .select(
      `
      *,
      customer:customerId(firstName, lastName, email),
      contract:contracts!contracts_bookingId_fkey(signedDocumentUrl, signedDocumentPath, signedAt)
    `
    )
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  const signedContractUrl = await generateSignedContractUrl(
    supabase,
    booking.contract?.signedDocumentPath ?? null,
    booking.contract?.signedDocumentUrl ?? null
  );

  // Prepare evidence kit
  const evidence: any = {
    customer_name: `${booking.customer.firstName} ${booking.customer.lastName}`,
    customer_email_address: booking.customer.email,
    customer_purchase_ip: booking.metadata?.bookingIp || null,
    receipt: signedContractUrl,
  };

  // Add dispute-specific evidence
  if (dispute.reason === 'fraudulent') {
    evidence.uncategorized_text = [
      `Customer signed rental agreement on ${booking.contract?.signedAt || 'N/A'}.`,
      `Equipment delivered to ${booking.deliveryAddress}.`,
      `Booking reference: ${booking.bookingNumber}.`,
      `Customer verified with driver's license and insurance certificate.`,
    ].join(' ');
  }

  // Submit evidence to Stripe
  const stripe = await getStripeInstance();
  try {
    await stripe.disputes.update(dispute.id, { evidence });

    logger.info('Dispute evidence submitted', {
      component: 'stripe-webhook',
      action: 'evidence_submitted',
      metadata: { disputeId: dispute.id, bookingId },
    });
  } catch (error: unknown) {
    logger.error('Failed to submit dispute evidence', {
      component: 'stripe-webhook',
      action: 'evidence_failed',
      metadata: { disputeId: dispute.id, error: error.message },
    });
  }

  // Alert admin for manual review
  await broadcastInAppNotificationToAdmins({
    supabase,
    category: 'system',
    priority: 'critical',
    title: `Dispute filed for booking ${booking.bookingNumber}`,
    message: `Customer disputed ${formatCurrency(dispute.amount / 100)}. Evidence auto-submitted. Manual review needed.`,
    templateId: 'stripe_dispute_admin_alert',
    templateData: {
      bookingNumber: booking.bookingNumber,
      disputeId: dispute.id,
      amount: dispute.amount / 100,
      amountFormatted: formatCurrency(dispute.amount / 100),
      reason: dispute.reason,
    },
    metadata: {
      bookingNumber: booking.bookingNumber,
      disputeId: dispute.id,
      amount: dispute.amount / 100,
      amountFormatted: formatCurrency(dispute.amount / 100),
      reason: dispute.reason,
      audience: 'admin',
    },
  });
}

/**
 * Handle charge.dispute.updated
 * Dispute status changed (won, lost, under review)
 */
async function handleDisputeUpdated(dispute: Stripe.Dispute, supabase: unknown) {
  logger.info('Dispute updated', {
    component: 'stripe-webhook',
    action: 'dispute_updated',
    metadata: {
      disputeId: dispute.id,
      status: dispute.status,
      amount: dispute.amount / 100,
    },
  });

  // If dispute won, celebrate!
  if (dispute.status === 'won') {
    logger.info('🎉 Dispute won!', {
      component: 'stripe-webhook',
      action: 'dispute_won',
      metadata: { disputeId: dispute.id, amount: dispute.amount / 100 },
    });
  }

  // If dispute lost, record loss
  if (dispute.status === 'lost') {
    logger.error('Dispute lost', {
      component: 'stripe-webhook',
      action: 'dispute_lost',
      metadata: { disputeId: dispute.id, amount: dispute.amount / 100 },
    });

    // TODO: Record in financial_transactions as a loss
  }
}

/**
 * Handle payout.paid
 * Payout successfully transferred to bank account
 */
async function handlePayoutPaid(payout: Stripe.Payout, supabase: unknown) {
  logger.info('Payout paid', {
    component: 'stripe-webhook',
    action: 'payout_paid',
    metadata: {
      payoutId: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency,
      arrivalDate: payout.arrival_date,
    },
  });

  // Update or create payout reconciliation record
  const { error: upsertError } = await supabase.from('payout_reconciliations').upsert(
    {
      stripe_payout_id: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency?.toUpperCase() ?? 'CAD',
      arrival_date: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
      status: 'pending', // Will be reconciled manually or via cron
      details: {
        stripeStatus: payout.status,
        automatic: payout.automatic,
        balanceTransaction: payout.balance_transaction,
        method: payout.method,
        metadata: payout.metadata ?? {},
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_payout_id' }
  );

  if (upsertError) {
    logger.error(
      'Failed to update payout reconciliation',
      {
        component: 'stripe-webhook',
        action: 'payout_reconciliation_failed',
        metadata: { payoutId: payout.id },
      },
      upsertError
    );
  } else {
    // Notify admins about successful payout
    await broadcastInAppNotificationToAdmins({
      supabase,
      title: 'Payout Completed',
      message: `Payout of ${formatCurrency(payout.amount / 100, payout.currency?.toUpperCase() ?? 'CAD')} has been transferred to your bank account.`,
      category: 'payment',
      priority: 'medium',
      actionUrl: `/admin/payments?tab=reconciliation&payout=${payout.id}`,
      ctaLabel: 'View Payout',
      metadata: {
        payoutId: payout.id,
        amount: payout.amount / 100,
        currency: payout.currency,
      },
    });
  }
}

/**
 * Handle payout.failed
 * Payout failed to transfer
 */
async function handlePayoutFailed(payout: Stripe.Payout, supabase: unknown) {
  logger.error('Payout failed', {
    component: 'stripe-webhook',
    action: 'payout_failed',
    metadata: {
      payoutId: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency,
      failureCode: payout.failure_code,
      failureMessage: payout.failure_message,
    },
  });

  // Update payout reconciliation record
  const { error: upsertError } = await supabase.from('payout_reconciliations').upsert(
    {
      stripe_payout_id: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency?.toUpperCase() ?? 'CAD',
      arrival_date: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
      status: 'discrepancy', // Failed payouts are discrepancies
      details: {
        stripeStatus: payout.status,
        automatic: payout.automatic,
        balanceTransaction: payout.balance_transaction,
        failureCode: payout.failure_code,
        failureMessage: payout.failure_message,
        method: payout.method,
        metadata: payout.metadata ?? {},
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_payout_id' }
  );

  if (upsertError) {
    logger.error(
      'Failed to update payout reconciliation',
      {
        component: 'stripe-webhook',
        action: 'payout_reconciliation_failed',
        metadata: { payoutId: payout.id },
      },
      upsertError
    );
  } else {
    // Alert admins about failed payout
    await broadcastInAppNotificationToAdmins({
      supabase,
      title: '⚠️ Payout Failed',
      message: `Payout of ${formatCurrency(payout.amount / 100, payout.currency?.toUpperCase() ?? 'CAD')} failed: ${payout.failure_message || payout.failure_code || 'Unknown error'}`,
      category: 'payment',
      priority: 'high',
      actionUrl: `/admin/payments?tab=reconciliation&payout=${payout.id}`,
      ctaLabel: 'View Details',
      metadata: {
        payoutId: payout.id,
        amount: payout.amount / 100,
        failureCode: payout.failure_code,
        failureMessage: payout.failure_message,
      },
    });
  }
}

/**
 * Handle payout.created
 * New payout created (scheduled or manual)
 */
async function handlePayoutCreated(payout: Stripe.Payout, supabase: unknown) {
  logger.info('Payout created', {
    component: 'stripe-webhook',
    action: 'payout_created',
    metadata: {
      payoutId: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency,
      arrivalDate: payout.arrival_date,
      automatic: payout.automatic,
    },
  });

  // Create payout reconciliation record
  const { error: upsertError } = await supabase.from('payout_reconciliations').upsert(
    {
      stripe_payout_id: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency?.toUpperCase() ?? 'CAD',
      arrival_date: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
      status: 'pending',
      details: {
        stripeStatus: payout.status,
        automatic: payout.automatic,
        balanceTransaction: payout.balance_transaction,
        method: payout.method,
        metadata: payout.metadata ?? {},
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_payout_id' }
  );

  if (upsertError) {
    logger.error(
      'Failed to create payout reconciliation',
      {
        component: 'stripe-webhook',
        action: 'payout_reconciliation_failed',
        metadata: { payoutId: payout.id },
      },
      upsertError
    );
  }
}
