/**
 * API Route: Stripe Verification Hold ($50)
 *
 * Purpose: Place a $50 hold to verify the card, then immediately void it
 * Flow:
 *   1. Create/retrieve Stripe Customer
 *   2. Create SetupIntent to save payment method
 *   3. Create $50 PaymentIntent (manual capture)
 *   4. Immediately cancel the hold
 *   5. Update booking status to 'verify_hold_ok'
 *   6. Record transaction in booking_payments
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
      maxSize: 10 * 1024, // 10KB max
      allowedContentTypes: ['application/json'],
    });
    if (!validation.valid) return validation.error!;

    // 2. Rate limiting - Use MODERATE for verification (not actual charges)
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
      logger.warn('Unauthorized verify hold attempt', {
        component: 'verify-hold-api',
        action: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId' },
        { status: 400 }
      );
    }

    logger.info('Starting verification hold', {
      component: 'verify-hold-api',
      action: 'start',
      metadata: { bookingId, userId: user.id },
    });

    // 5. Check if this is a temporary booking (not yet persisted to database)
    const isTemporaryBooking = bookingId === 'temporary' || bookingId === 'pending' || bookingId.startsWith('temp-');

    if (!isTemporaryBooking) {
      // For real bookings, verify booking ownership
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, customerId, totalAmount, hold_verify_amount_cents, verify_hold_intent_id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking || booking.customerId !== user.id) {
        logger.warn('Unauthorized booking access for verify hold', {
          component: 'verify-hold-api',
          action: 'forbidden',
          metadata: { bookingId, userId: user.id, error: bookingError?.message },
        });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 6. Check if verify hold already placed
      if (booking.verify_hold_intent_id) {
        logger.info('Verify hold already exists', {
          component: 'verify-hold-api',
          action: 'already_exists',
          metadata: { bookingId, intentId: booking.verify_hold_intent_id },
        });
        return NextResponse.json({
          success: true,
          message: 'Verification hold already completed',
          intentId: booking.verify_hold_intent_id,
        });
      }
    } else {
      // For temporary bookings, just proceed with creating the PaymentIntent
      logger.info('Creating verification hold for temporary booking', {
        component: 'verify-hold-api',
        action: 'temporary_booking',
        metadata: { bookingId, userId: user.id },
      });
    }

    // 7. Get user email for Stripe customer
    const { data: userData } = await supabase
      .from('users')
      .select('email, firstName, lastName, stripeCustomerId')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 8. Create or retrieve Stripe Customer
    let stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        metadata: {
          userId: user.id,
          source: 'rental_platform',
        },
      });

      stripeCustomerId = customer.id;

      // Save Stripe Customer ID to database
      await supabase
        .from('users')
        .update({ stripeCustomerId })
        .eq('id', user.id);

      logger.info('Stripe customer created', {
        component: 'verify-hold-api',
        action: 'customer_created',
        metadata: { userId: user.id, stripeCustomerId },
      });
    }

    // 9. Create SetupIntent to save payment method (NOT PaymentIntent!)
    // SetupIntent is the correct way to save a card without charging
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session', // We'll use this card later for the $500 hold
      metadata: {
        bookingId,
        userId: user.id,
        purpose: 'verify_card',
      },
    });

    logger.info('SetupIntent created for card verification', {
      component: 'verify-hold-api',
      action: 'setup_intent_created',
      metadata: { bookingId, setupIntentId: setupIntent.id },
    });

    // 10. Generate idempotency key for verification hold
    const idempotencyKey = `${bookingId}:verify_hold:${Date.now()}`;

    // 11. Return SetupIntent client secret for frontend
    return NextResponse.json({
      success: true,
      setupIntentClientSecret: setupIntent.client_secret,
      stripeCustomerId,
      idempotencyKey,
      message: 'Ready to collect payment method',
    });

  } catch (error: any) {
    logger.error('Verification hold failed', {
      component: 'verify-hold-api',
      action: 'error',
      metadata: { error: error.message },
    }, error);

    return NextResponse.json(
      { error: 'Failed to process verification hold', details: error.message },
      { status: 500 }
    );
  }
}

