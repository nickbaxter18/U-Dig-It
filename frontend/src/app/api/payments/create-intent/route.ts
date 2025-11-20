import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { REQUEST_LIMITS, validateRequest } from '@/lib/request-validator';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const stripe = createStripeClient(await getStripeSecretKey());
  // Validate request size and content type
  const requestValidation = await validateRequest(request, {
    maxSize: REQUEST_LIMITS.MAX_JSON_SIZE,
    allowedContentTypes: ['application/json'],
    timeout: REQUEST_LIMITS.DEFAULT_TIMEOUT,
  });

  if (!requestValidation.valid) {
    return requestValidation.error!;
  }

  // Rate limiting: 5 requests per minute per user (prevents payment abuse)
  const rateLimitResult = await rateLimit(request, {
    ...RateLimitPresets.VERY_STRICT,
    skipAdmins: false, // Even admins should be rate limited for financial endpoints
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many payment attempts. Please wait before trying again.',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: rateLimitResult.headers,
      }
    );
  }

  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, bookingId, currency = 'cad', type = 'payment' } = await request.json();

    if (!amount || !bookingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        bookingNumber,
        customerId,
        totalAmount,
        equipment:equipmentId(make, model)
      `
      )
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user owns this booking
    if (booking.customerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        customerId: booking.customerId,
        type,
      },
      description: `${type === 'deposit' ? 'Security Deposit' : 'Payment'} for ${(booking.equipment as any)?.[0]?.make || 'Equipment'} ${(booking.equipment as any)?.[0]?.model || ''} - Booking #${booking.bookingNumber}`,
    });

    // Create payment record in database
    const { error: paymentError } = await supabase.from('payments').insert({
      bookingId: booking.id,
      paymentNumber: `PAY-${Date.now()}`,
      amount: amount,
      type: type,
      status: 'pending',
      method: 'credit_card',
      stripePaymentIntentId: paymentIntent.id,
      stripeMetadata: {
        clientSecret: paymentIntent.client_secret,
        createdAt: new Date().toISOString(),
      },
    });

    if (paymentError) {
      logger.error(
        'Error creating payment record',
        {
          component: 'api-create-intent',
          action: 'error',
          metadata: { error: paymentError.message },
        },
        paymentError
      );
      // Continue anyway - payment intent was created
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      bookingId,
    });
  } catch (error: unknown) {
    logger.error(
      'Payment intent creation error',
      {
        component: 'api-create-intent',
        action: 'error',
        metadata: { error: error.message },
      },
      error
    );
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
