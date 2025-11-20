/**
 * API Route: Create Stripe Setup Session
 *
 * Creates a Checkout Session in 'setup' mode to collect and save payment method
 * This is the proper way to save a card for future use (not PaymentElement in modal)
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/request-validator';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Request validation
    const validation = await validateRequest(request, {
      maxSize: 10 * 1024,
      allowedContentTypes: ['application/json'],
    });
    if (!validation.valid) return validation.error!;

    // 2. Rate limiting - Use MODERATE for booking flow (not payment capture)
    const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // 3. Auth verification
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('Unauthorized setup session attempt', {
        component: 'create-setup-session',
        action: 'unauthorized',
        metadata: { authError: authError?.message },
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Parse request
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    logger.info('Creating Stripe Setup Session for card verification', {
      component: 'create-setup-session',
      action: 'start',
      metadata: { bookingId, userId: user.id },
    });

    // 5. Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, firstName, lastName, stripeCustomerId')
      .eq('id', user.id)
      .single();

    if (userError) {
      logger.error('Failed to fetch user data', {
        component: 'create-setup-session',
        action: 'user_fetch_error',
        metadata: { userId: user.id, error: userError.message, errorCode: userError.code },
      });
      return NextResponse.json(
        { error: 'Failed to fetch user data', details: userError.message },
        { status: 500 }
      );
    }

    if (!userData) {
      logger.error('User not found in users table', {
        component: 'create-setup-session',
        action: 'user_not_found',
        metadata: { userId: user.id, userEmail: user.email },
      });
      return NextResponse.json(
        { error: 'User profile not found. Please contact support.' },
        { status: 404 }
      );
    }

    // 6. Initialize Stripe client (after user validation)
    const stripe = createStripeClient(await getStripeSecretKey());

    // 7. Create or retrieve Stripe Customer
    let stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      try {
        const customer = await stripe.customers.create({
          email: userData.email,
          name: `${userData.firstName} ${userData.lastName}`,
          metadata: {
            userId: user.id,
            source: 'rental_platform',
          },
        });

        stripeCustomerId = customer.id;

        // Save to database
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripeCustomerId })
          .eq('id', user.id);

        if (updateError) {
          logger.error('Failed to save Stripe customer ID', {
            component: 'create-setup-session',
            action: 'customer_save_error',
            metadata: { userId: user.id, stripeCustomerId, error: updateError.message },
          });
          // Continue anyway - customer was created in Stripe
        }

        logger.info('Stripe customer created', {
          component: 'create-setup-session',
          action: 'customer_created',
          metadata: { userId: user.id, stripeCustomerId },
        });
      } catch (stripeError: unknown) {
        logger.error(
          'Failed to create Stripe customer',
          {
            component: 'create-setup-session',
            action: 'stripe_customer_error',
            metadata: { userId: user.id, error: stripeError.message },
          },
          stripeError
        );
        return NextResponse.json(
          { error: 'Failed to initialize payment processing', details: stripeError.message },
          { status: 500 }
        );
      }
    }

    // 8. Get the request origin for return URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // 9. Create Checkout Session in 'setup' mode
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      success_url: `${origin}/book/verify-card-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${origin}/book?verify_cancelled=true`,
      metadata: {
        bookingId,
        userId: user.id,
        purpose: 'card_verification',
      },
    });

    logger.info('Checkout Session created for card verification', {
      component: 'create-setup-session',
      action: 'session_created',
      metadata: { bookingId, sessionId: session.id },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: unknown) {
    logger.error(
      'Failed to create setup session',
      {
        component: 'create-setup-session',
        action: 'error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json(
      { error: 'Failed to create setup session', details: error.message },
      { status: 500 }
    );
  }
}
