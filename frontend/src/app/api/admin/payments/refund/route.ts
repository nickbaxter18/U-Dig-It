import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/payments/refund
 * Process a refund for a payment
 *
 * Admin-only endpoint with strict security
 */
export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    

    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    const stripe = createStripeClient(await getStripeSecretKey());

    // Parse and validate request body
    const body = await request.json();
    const { paymentId, amount, reason } = body;

    if (!paymentId || !amount || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId, amount, reason' },
        { status: 400 },
      );
    }

    const refundAmount = parseFloat(amount);
    if (Number.isNaN(refundAmount) || refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 },
      );
    }

    // Get payment details from database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(
        'id, amount, status, "stripePaymentIntentId", "amountRefunded", "refundedAt", "refundReason", bookingId',
      )
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      logger.error('Payment not found for refund', {
        component: 'admin-refund-api',
        action: 'payment_not_found',
        metadata: { paymentId, error: paymentError?.message },
      });
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Validate refund amount
    const currentAmount = parseFloat(payment.amount);
    const alreadyRefunded = parseFloat(payment.amountRefunded || '0');
    const availableToRefund = currentAmount - alreadyRefunded;

    if (refundAmount > availableToRefund) {
      return NextResponse.json(
        { error: `Maximum refundable amount is $${availableToRefund.toFixed(2)}` },
        { status: 400 },
      );
    }

    // Process refund via Stripe if linked
    let stripeRefund;
    if (payment.stripePaymentIntentId) {
      try {
        stripeRefund = await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: Math.round(refundAmount * 100),
          reason: 'requested_by_customer',
          metadata: {
            admin_user_id: user?.id || 'unknown',
            refund_reason: reason,
            booking_id: payment.bookingId,
          },
        });

        logger.info('Stripe refund created', {
          component: 'admin-refund-api',
          action: 'stripe_refund_success',
          metadata: {
            refundId: stripeRefund.id,
            amount: refundAmount,
            paymentIntentId: payment.stripePaymentIntentId,
          },
        });
      } catch (stripeError: any) {
        logger.error('Stripe refund failed', {
          component: 'admin-refund-api',
          action: 'stripe_error',
          metadata: {
            paymentIntentId: payment.stripePaymentIntentId,
            amount: refundAmount,
            error: stripeError.message,
          },
        }, stripeError);
        return NextResponse.json(
          { error: `Stripe error: ${stripeError.message}` },
          { status: 500 },
        );
      }
    }

    // Update payment record in database
    const newRefundedAmount = alreadyRefunded + refundAmount;
    const isFullRefund = newRefundedAmount >= currentAmount;

    const refundTimestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        amountRefunded: newRefundedAmount,
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        refundedAt: refundTimestamp,
        refundReason: reason,
      })
      .eq('id', paymentId);

    if (updateError) {
      logger.error('Failed to update payment record after refund', {
        component: 'admin-refund-api',
        action: 'db_update_error',
        metadata: { error: updateError.message, stripeRefundId: stripeRefund?.id },
      }, updateError);
      return NextResponse.json(
        {
          error:
            'Refund processed in Stripe but database update failed. Manual reconciliation required.',
          stripeRefundId: stripeRefund?.id,
        },
        { status: 500 },
      );
    }

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      table_name: 'payments',
      record_id: paymentId,
      action: 'update',
      user_id: user?.id || 'unknown',
      old_values: {
        status: payment.status,
        amountRefunded: alreadyRefunded,
        refundedAt: payment.refundedAt,
        refundReason: payment.refundReason,
      },
      new_values: {
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        amountRefunded: newRefundedAmount,
        refundedAt: refundTimestamp,
        refundReason: reason,
      },
      metadata: {
        action_type: 'refund',
        stripe_refund_id: stripeRefund?.id,
        refund_amount: refundAmount,
      },
    });

    logger.info('Refund completed successfully', {
      component: 'admin-refund-api',
      action: 'refund_complete',
      metadata: {
        paymentId,
        refundAmount,
        stripeRefundId: stripeRefund?.id,
      },
    });

    return NextResponse.json({
      success: true,
      refundId: stripeRefund?.id ?? null,
      amount: refundAmount,
      status: isFullRefund ? 'refunded' : 'partially_refunded',
    });
  } catch (error: any) {
    logger.error('Refund API error', {
      component: 'admin-refund-api',
      action: 'error',
      metadata: { error: error?.message },
    }, error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 },
    );
  }
}








