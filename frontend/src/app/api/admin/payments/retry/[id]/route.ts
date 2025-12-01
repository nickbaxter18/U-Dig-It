import { NextRequest, NextResponse } from 'next/server';

import { recalculateBookingBalance } from '@/lib/booking/balance';
import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/admin/payments/retry/[id]
 * Retry a failed payment by creating a new Stripe checkout session
 *
 * Admin-only endpoint
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limit FIRST - strict for payment operations
  const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { id: paymentId } = await params;
    const stripe = createStripeClient(await getStripeSecretKey());

    // Get the failed payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, bookingId, amount, status, type, stripePaymentIntentId, stripeCheckoutSessionId')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      logger.error(
        'Payment not found for retry',
        {
          component: 'admin-payments-retry',
          action: 'payment_not_found',
          metadata: { paymentId, error: paymentError?.message },
        },
        paymentError || undefined
      );
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Only allow retry for failed payments
    if (payment.status !== 'failed' && payment.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot retry payment with status: ${payment.status}. Only failed or pending payments can be retried.` },
        { status: 400 }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        balance_amount,
        equipment:equipmentId(make, model, unitId),
        customer:customerId(email, firstName, lastName)
      `
      )
      .eq('id', payment.bookingId)
      .single();

    if (bookingError || !booking) {
      logger.error(
        'Booking not found for payment retry',
        {
          component: 'admin-payments-retry',
          action: 'booking_not_found',
          metadata: { paymentId, bookingId: payment.bookingId, error: bookingError?.message },
        },
        bookingError || undefined
      );
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get base URL
    const getBaseUrl = () => {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
      if (siteUrl) {
        try {
          const url = new URL(siteUrl);
          return url.origin;
        } catch {
          // Invalid URL, continue
        }
      }

      const origin = request.headers.get('origin') || request.headers.get('host');
      if (origin) {
        if (origin.startsWith('http://') || origin.startsWith('https://')) {
          try {
            const url = new URL(origin);
            return url.origin;
          } catch {
            // Invalid, continue
          }
        } else {
          const scheme = process.env.NODE_ENV === 'production' ? 'https' : 'http';
          return `${scheme}://${origin}`;
        }
      }

      return 'http://localhost:3000';
    };

    const baseUrl = getBaseUrl();

    // Determine payment type from payment record
    const paymentType = payment.type === 'deposit' ? 'deposit' : 'invoice';

    // Recalculate balance for invoice payments
    let recalculatedBalance: number | null = null;
    if (paymentType === 'invoice') {
      recalculatedBalance = await recalculateBookingBalance(booking.id);
      if (recalculatedBalance === null) {
        logger.warn('Balance recalculation failed, using existing balance_amount', {
          component: 'admin-payments-retry',
          action: 'balance_recalculation_failed',
          metadata: { bookingId: booking.id },
        });
        recalculatedBalance = Number(booking.balance_amount ?? booking.totalAmount);
      }
    }

    // Determine amount
    let amount: number;
    if (paymentType === 'deposit') {
      amount = Number(booking.securityDeposit);
    } else {
      const totalAmount = Number(booking.totalAmount);
      const balanceAmount =
        recalculatedBalance !== null
          ? recalculatedBalance
          : Number(booking.balance_amount ?? totalAmount);

      if (balanceAmount <= 0) {
        return NextResponse.json(
          { error: 'Booking balance is already paid in full' },
          { status: 400 }
        );
      }
      amount = balanceAmount < totalAmount ? balanceAmount : totalAmount;
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than 0' }, { status: 400 });
    }

    // Handle null equipment relation with fallback
    const equipmentMake = booking.equipment?.make || 'Equipment';
    const equipmentModel = booking.equipment?.model || 'Unknown';

    const description =
      paymentType === 'deposit'
        ? `Security Deposit: ${equipmentMake} ${equipmentModel} (${booking.bookingNumber})`
        : `Rental Invoice: ${equipmentMake} ${equipmentModel} (${booking.bookingNumber})`;

    logger.info('Creating retry checkout session', {
      component: 'admin-payments-retry',
      action: 'retry_checkout_creation',
      metadata: {
        paymentId,
        bookingId: booking.id,
        paymentType,
        amount,
        originalStatus: payment.status,
      },
    });

    // Create new Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: description,
              description: `Booking: ${booking.bookingNumber} (Retry Payment)`,
              metadata: {
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
                equipmentId: booking.equipmentId,
                paymentType,
                originalPaymentId: paymentId,
              },
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/admin/bookings?booking=${booking.id}&payment=success&type=${paymentType}&retry=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/admin/bookings?booking=${booking.id}&payment=cancelled&type=${paymentType}&retry=true`,
      customer_email: booking.customer?.email || undefined,
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        customerId: booking.customerId,
        equipmentId: booking.equipmentId,
        paymentType,
        originalPaymentId: paymentId,
      },
    });

    // Update the payment record with new checkout session ID
    const serviceClient = await createServiceClient();
    if (serviceClient) {
      const { error: updateError } = await serviceClient
        .from('payments')
        .update({
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: (session.payment_intent as string) || null,
          status: 'pending', // Reset to pending for retry
          updatedAt: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (updateError) {
        logger.error(
          'Failed to update payment record with new session',
          {
            component: 'admin-payments-retry',
            action: 'payment_update_failed',
            metadata: { paymentId, sessionId: session.id, error: updateError.message },
          },
          updateError
        );
        // Continue anyway - session is created
      }
    }

    logger.info('Retry checkout session created successfully', {
      component: 'admin-payments-retry',
      action: 'retry_success',
      metadata: {
        paymentId,
        bookingId: booking.id,
        sessionId: session.id,
        sessionUrl: session.url,
      },
    });

    return NextResponse.json({
      sessionUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    logger.error(
      'Payment retry error',
      {
        component: 'admin-payments-retry',
        action: 'retry_error',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retry payment',
      },
      { status: 500 }
    );
  }
}

