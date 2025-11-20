/**
 * API Route: Place $500 Security Hold (T-48)
 *
 * Called by job scheduler 48 hours before pickup to:
 *   1. Create $500 PaymentIntent (manual capture, off_session)
 *   2. Use saved payment method from SetupIntent
 *   3. Update booking status to 'hold_placed'
 *   4. Record in booking_payments
 *   5. Send notification email/SMS
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/request-validator';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

// // import Stripe from 'stripe'; // Reserved for future type usage // Unused - type only

const SECURITY_HOLD_AMOUNT_CENTS = 50000; // $500
const CURRENCY = 'cad';

export async function POST(request: NextRequest) {
  const stripe = createStripeClient(await getStripeSecretKey());

  try {
    // 1. Request validation
    const validation = await validateRequest(request, {
      maxSize: 10 * 1024,
      allowedContentTypes: ['application/json'],
    });
    if (!validation.valid) return validation.error!;

    // 2. Rate limiting - Use STRICT for security holds (with admin bypass)
    const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // 3. Auth verification (internal service or admin only)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Allow internal service calls (from job scheduler)
    const isInternalCall =
      request.headers.get('x-internal-service-key') === process.env.INTERNAL_SERVICE_KEY;

    if (!isInternalCall) {
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Verify admin role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
      }
    }

    // 4. Parse request
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    logger.info('Placing $500 security hold', {
      component: 'security-hold-api',
      action: 'start',
      metadata: { bookingId },
    });

    // 5. Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        customerId,
        startDate,
        endDate,
        totalAmount,
        hold_security_amount_cents,
        security_hold_intent_id,
        stripe_customer_id,
        stripe_payment_method_id,
        status
      `
      )
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      logger.error('Booking not found for security hold', {
        component: 'security-hold-api',
        action: 'not_found',
        metadata: { bookingId },
      });
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 6. Check if security hold already placed
    if (booking.security_hold_intent_id) {
      logger.info('Security hold already exists', {
        component: 'security-hold-api',
        action: 'already_exists',
        metadata: { bookingId, intentId: booking.security_hold_intent_id },
      });
      return NextResponse.json({
        success: true,
        message: 'Security hold already placed',
        intentId: booking.security_hold_intent_id,
      });
    }

    // 7. Verify payment method exists
    if (!booking.stripe_payment_method_id) {
      logger.error('No payment method saved for security hold', {
        component: 'security-hold-api',
        action: 'no_payment_method',
        metadata: { bookingId },
      });
      return NextResponse.json(
        { error: 'No payment method on file. Please complete card verification first.' },
        { status: 400 }
      );
    }

    // 8. Generate idempotency key
    const idempotencyKey = `${bookingId}:security_hold:${new Date(booking.startDate).getTime()}`;

    // 9. Create $500 PaymentIntent (manual capture, off_session)
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: booking.hold_security_amount_cents || SECURITY_HOLD_AMOUNT_CENTS,
        currency: CURRENCY,
        customer: booking.stripe_customer_id!,
        payment_method: booking.stripe_payment_method_id,
        capture_method: 'manual', // CRITICAL: Hold only, don't capture
        confirm: true, // Confirm immediately
        off_session: true, // Customer not present (scheduled job)
        description: `$500 security hold for booking ${bookingId}`,
        metadata: {
          bookingId,
          userId: booking.customerId,
          purpose: 'security_hold',
          pickup_date: booking.startDate,
        },
      },
      {
        idempotencyKey,
      }
    );

    logger.info('Security hold authorized', {
      component: 'security-hold-api',
      action: 'authorized',
      metadata: {
        bookingId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status,
      },
    });

    // 10. Record transaction in booking_payments
    await supabase.from('booking_payments').insert({
      booking_id: bookingId,
      purpose: 'security_hold',
      amount_cents: paymentIntent.amount,
      currency: CURRENCY,
      stripe_payment_intent_id: paymentIntent.id,
      idempotency_key: idempotencyKey,
      status: 'succeeded', // Hold is active
      metadata: {
        placed_at: new Date().toISOString(),
        payment_method_id: booking.stripe_payment_method_id,
        for_pickup_date: booking.startDate,
      },
    });

    // 11. Update booking with security_hold_intent_id and status
    await supabase
      .from('bookings')
      .update({
        security_hold_intent_id: paymentIntent.id,
        status: 'hold_placed', // Progress to hold_placed state
      })
      .eq('id', bookingId);

    // 12. Send notification to customer
    // TODO: Implement email/SMS notification
    // "A $500 hold is now on your card for booking #UD-{{id}} (not a charge)."

    logger.info('Security hold placed successfully', {
      component: 'security-hold-api',
      action: 'success',
      metadata: {
        bookingId,
        paymentIntentId: paymentIntent.id,
        placedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: '$500 security hold placed successfully',
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status,
    });
  } catch (error: unknown) {
    // Handle SCA (3D Secure) requirements
    if (error.type === 'StripeCardError' && error.code === 'authentication_required') {
      logger.warn('SCA required for security hold', {
        component: 'security-hold-api',
        action: 'sca_required',
        metadata: { error: error.message },
      });

      return NextResponse.json(
        {
          success: false,
          requiresAction: true,
          error: 'Additional authentication required',
          clientSecret: error.payment_intent?.client_secret,
          message: 'Please complete card authentication to proceed',
        },
        { status: 402 }
      ); // 402 Payment Required
    }

    logger.error(
      'Failed to place security hold',
      {
        component: 'security-hold-api',
        action: 'error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json(
      { error: 'Failed to place security hold', details: error.message },
      { status: 500 }
    );
  }
}
