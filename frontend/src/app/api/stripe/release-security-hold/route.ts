/**
 * API Route: Release $500 Security Hold
 *
 * Called after clean return to:
 *   1. Cancel the security hold PaymentIntent
 *   2. Update booking status to 'returned_ok'
 *   3. Record release in booking_payments
 *   4. Send notification email/SMS
 */

import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/request-validator';
import { createClient } from '@/lib/supabase/server';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const stripe = createStripeClient(await getStripeSecretKey());
  
  try {
    // 1. Request validation
    const validation = await validateRequest(request, {
      maxSize: 10 * 1024,
      allowedContentTypes: ['application/json'],
    });
    if (!validation.valid) return validation.error!;

    // 2. Rate limiting - Use STRICT for hold releases (with admin bypass)
    const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // 3. Auth verification (admin only)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    logger.info('Releasing security hold', {
      component: 'release-hold-api',
      action: 'start',
      metadata: { bookingId, adminId: user.id },
    });

    // 5. Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, security_hold_intent_id, status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 6. Verify security hold exists
    if (!booking.security_hold_intent_id) {
      logger.warn('No security hold to release', {
        component: 'release-hold-api',
        action: 'no_hold',
        metadata: { bookingId },
      });
      return NextResponse.json(
        { error: 'No security hold found on this booking' },
        { status: 400 }
      );
    }

    // 7. Cancel the PaymentIntent (release the hold)
    const canceledIntent = await stripe.paymentIntents.cancel(
      booking.security_hold_intent_id
    );

    logger.info('Security hold released', {
      component: 'release-hold-api',
      action: 'released',
      metadata: {
        bookingId,
        paymentIntentId: canceledIntent.id,
        releasedAmount: canceledIntent.amount / 100,
      },
    });

    // 8. Generate idempotency key
    const idempotencyKey = `${bookingId}:release_hold:${Date.now()}`;

    // 9. Record release in booking_payments
    await supabase.from('booking_payments').insert({
      booking_id: bookingId,
      purpose: 'release',
      amount_cents: 0, // No charge, just release
      currency: 'cad',
      stripe_payment_intent_id: booking.security_hold_intent_id,
      idempotency_key: idempotencyKey,
      status: 'succeeded',
      metadata: {
        released_at: new Date().toISOString(),
        released_by: user.id,
        original_amount_cents: canceledIntent.amount,
      },
    });

    // 10. Update booking status
    await supabase
      .from('bookings')
      .update({
        status: 'returned_ok',
      })
      .eq('id', bookingId);

    // 11. Send notification to customer
    // TODO: Implement email/SMS
    // "Your $500 hold has been released. Thanks for renting with U-Dig It!"

    logger.info('Security hold release completed', {
      component: 'release-hold-api',
      action: 'success',
      metadata: {
        bookingId,
        releasedAt: new Date().toISOString(),
        releasedBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: '$500 security hold released successfully',
      paymentIntentId: booking.security_hold_intent_id,
      status: canceledIntent.status,
    });

  } catch (error: any) {
    logger.error('Failed to release security hold', {
      component: 'release-hold-api',
      action: 'error',
      metadata: { error: error.message },
    }, error);

    return NextResponse.json(
      { error: 'Failed to release security hold', details: error.message },
      { status: 500 }
    );
  }
}














