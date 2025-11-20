/**
 * API Route: Capture Security Hold (Partial or Full)
 *
 * Called when damage/fees need to be charged:
 *   1. Capture partial or full amount from $500 hold
 *   2. Update booking status to 'captured'
 *   3. Record in booking_payments
 *   4. Send notification with amount captured
 *
 * Note: Can only capture ONCE. Remainder releases automatically.
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/request-validator';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

// import Stripe from 'stripe'; // Unused - type only

export async function POST(request: NextRequest) {
  const stripe = createStripeClient(await getStripeSecretKey());

  try {
    // 1. Request validation
    const validation = await validateRequest(request, {
      maxSize: 10 * 1024,
      allowedContentTypes: ['application/json'],
    });
    if (!validation.valid) return validation.error!;

    // 2. Rate limiting - Keep VERY_STRICT for actual money capture (but allow admin bypass)
    const rateLimitResult = await rateLimit(request, RateLimitPresets.VERY_STRICT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // 3. Auth verification (admin only)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // 4. Parse request
    const body = await request.json();
    const { bookingId, amountCents, reason } = body;

    if (!bookingId || !amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid bookingId or amountCents' },
        { status: 400 }
      );
    }

    logger.info('Capturing security hold', {
      component: 'capture-hold-api',
      action: 'start',
      metadata: { bookingId, amountCents, reason, adminId: user.id },
    });

    // 5. Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, security_hold_intent_id, hold_security_amount_cents, status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 6. Verify security hold exists
    if (!booking.security_hold_intent_id) {
      return NextResponse.json(
        { error: 'No security hold found on this booking' },
        { status: 400 }
      );
    }

    // 7. Validate capture amount doesn't exceed hold amount
    const maxAmount = booking.hold_security_amount_cents || 50000;
    if (amountCents > maxAmount) {
      return NextResponse.json(
        {
          error: `Capture amount ($${amountCents / 100}) exceeds hold amount ($${maxAmount / 100})`,
        },
        { status: 400 }
      );
    }

    // 8. Capture the payment intent
    const capturedIntent = await stripe.paymentIntents.capture(booking.security_hold_intent_id, {
      amount_to_capture: amountCents,
    });

    logger.info('Security hold captured', {
      component: 'capture-hold-api',
      action: 'captured',
      metadata: {
        bookingId,
        paymentIntentId: capturedIntent.id,
        capturedAmount: amountCents / 100,
        totalHoldAmount: maxAmount / 100,
        remainderReleased: (maxAmount - amountCents) / 100,
      },
    });

    // 9. Generate idempotency key
    const idempotencyKey = `${bookingId}:capture:${Date.now()}`;

    // 10. Record capture in booking_payments
    await supabase.from('booking_payments').insert({
      booking_id: bookingId,
      purpose: 'capture',
      amount_cents: amountCents,
      currency: 'cad',
      stripe_payment_intent_id: booking.security_hold_intent_id,
      stripe_charge_id: capturedIntent.latest_charge as string,
      idempotency_key: idempotencyKey,
      status: 'succeeded',
      metadata: {
        captured_at: new Date().toISOString(),
        captured_by: user.id,
        reason,
        original_hold_amount: maxAmount,
        remainder_released: maxAmount - amountCents,
      },
    });

    // 11. Update booking status
    await supabase
      .from('bookings')
      .update({
        status: 'captured',
        additionalCharges: amountCents / 100,
      })
      .eq('id', bookingId);

    // 12. Send notification to customer
    // TODO: Implement email/SMS
    // "We've charged $X from your security hold for: {{reason}}. Remainder released."

    logger.info('Security hold capture completed', {
      component: 'capture-hold-api',
      action: 'success',
      metadata: {
        bookingId,
        capturedAmount: amountCents / 100,
        capturedBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Captured $${amountCents / 100} from security hold`,
      paymentIntentId: booking.security_hold_intent_id,
      chargeId: capturedIntent.latest_charge,
      capturedAmount: amountCents / 100,
      remainderReleased: (maxAmount - amountCents) / 100,
    });
  } catch (error: unknown) {
    logger.error(
      'Failed to capture security hold',
      {
        component: 'capture-hold-api',
        action: 'error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json(
      { error: 'Failed to capture security hold', details: error.message },
      { status: 500 }
    );
  }
}
