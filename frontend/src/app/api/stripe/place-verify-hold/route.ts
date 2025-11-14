/**
 * API Route: Place and Void $50 Verification Hold
 *
 * Called after SetupIntent succeeds to:
 *   1. Create $50 PaymentIntent (manual capture, off_session)
 *   2. Immediately cancel it (void the hold)
 *   3. Update booking status to 'verify_hold_ok'
 *   4. Record in booking_payments
 *   5. Schedule T-48 security hold job
 */

import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/request-validator';
import { createClient } from '@/lib/supabase/server';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const VERIFY_HOLD_AMOUNT_CENTS = 5000; // $50
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

    // 2. Rate limiting - Use MODERATE for verification holds
    const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // 3. Auth verification
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Parse request
    const body = await request.json();
    const { bookingId, setupIntentId, paymentMethodId, customerId, startDate, totalAmount } = body;

    if (!bookingId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields (bookingId, paymentMethodId)' },
        { status: 400 }
      );
    }

    logger.info('Saving payment method from card verification', {
      component: 'place-verify-hold',
      action: 'start',
      metadata: { bookingId, setupIntentId: setupIntentId?.substring(0, 15) + '...', paymentMethodId: paymentMethodId.substring(0, 10) + '...' },
    });

    // 5. For temporary bookings, just return success
    if (bookingId === 'temporary' || bookingId === 'pending') {
      logger.info('Temporary booking - card verified', {
        component: 'place-verify-hold',
        action: 'temporary_success',
        metadata: { bookingId, paymentMethodId: paymentMethodId.substring(0, 10) + '...' },
      });

      return NextResponse.json({
        success: true,
        message: 'Card verified successfully',
        paymentMethodId,
        nextStep: 'Complete booking to schedule security hold',
      });
    }

    // 7. For real bookings, verify ownership
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        customerId,
        totalAmount,
        hold_verify_amount_cents,
        stripe_payment_method_id,
        stripe_customer_id,
        startDate
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking || booking.customerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 8. Check if already completed
    if (booking.stripe_payment_method_id) {
      return NextResponse.json({
        success: true,
        message: 'Card already verified',
        paymentMethodId: booking.stripe_payment_method_id,
      });
    }

    logger.info('Card verified with SetupIntent', {
      component: 'place-verify-hold',
      action: 'card_saved',
      metadata: {
        bookingId,
        setupIntentId: setupIntentId?.substring(0, 15) + '...',
        paymentMethodId: paymentMethodId.substring(0, 10) + '...',
      },
    });

    // 9. Generate idempotency key
    const idempotencyKey = `${bookingId}:card_verified:${Date.now()}`;

    // 10. Record in booking_payments
    await supabase.from('booking_payments').insert({
      booking_id: bookingId,
      purpose: 'verify_card',
      amount_cents: 0, // No charge - just saved card
      currency: CURRENCY,
      stripe_payment_intent_id: setupIntentId || null,
      idempotency_key: idempotencyKey,
      status: 'succeeded',
      metadata: {
        payment_method_id: paymentMethodId,
        saved_at: new Date().toISOString(),
      },
    });

    // 11. Update booking with payment method
    await supabase
      .from('bookings')
      .update({
        stripe_payment_method_id: paymentMethodId,
        status: 'verify_hold_ok', // Progress to next state
      })
      .eq('id', bookingId);

    // 12. Schedule T-48 security hold job
    const bookingStartDate = new Date(booking.startDate);
    const holdPlacementTime = new Date(bookingStartDate.getTime() - (48 * 60 * 60 * 1000)); // 48 hours before

    // Only schedule if start date is > 48 hours away
    const now = new Date();
    if (holdPlacementTime > now) {
      const scheduleIdempotencyKey = `${bookingId}:place_security_hold:${bookingStartDate.getTime()}`;

      await supabase.from('schedules').insert({
        booking_id: bookingId,
        job_type: 'place_hold',
        run_at_utc: holdPlacementTime.toISOString(),
        status: 'pending',
        idempotency_key: scheduleIdempotencyKey,
        metadata: {
          purpose: 'security_hold',
          amount_cents: booking.hold_verify_amount_cents || 50000,
        },
      });

      logger.info('Scheduled T-48 security hold job', {
        component: 'place-verify-hold',
        action: 'job_scheduled',
        metadata: {
          bookingId,
          runAt: holdPlacementTime.toISOString(),
        },
      });
    } else {
      // Booking is within 48h - we'll place security hold immediately
      logger.warn('Booking within 48h - security hold needs immediate placement', {
        component: 'place-verify-hold',
        action: 'immediate_hold_needed',
        metadata: { bookingId, startDate: booking.startDate },
      });
    }

    logger.info('Card verification completed successfully', {
      component: 'place-verify-hold',
      action: 'success',
      metadata: {
        bookingId,
        paymentMethodId: paymentMethodId.substring(0, 10) + '...',
        savedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Card verified and saved successfully.',
      paymentMethodId,
      nextStep: holdPlacementTime > now
        ? `$500 security hold will be placed on ${holdPlacementTime.toLocaleString()}`
        : 'Security hold placement needed (booking within 48h)',
    });

  } catch (error: any) {
    logger.error('Failed to place/void verification hold', {
      component: 'place-verify-hold',
      action: 'error',
      metadata: { error: error.message },
    }, error);

    return NextResponse.json(
      { error: 'Failed to process verification hold', details: error.message },
      { status: 500 }
    );
  }
}

