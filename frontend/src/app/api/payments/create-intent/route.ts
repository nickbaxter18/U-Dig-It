import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { REQUEST_LIMITS, validateRequest } from '@/lib/request-validator';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import { typedSelect } from '@/lib/supabase/typed-helpers';

export async function POST(request: NextRequest) {
  // Step 1: Rate limiting FIRST (prevents payment abuse)
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

  // Step 2: Validate request size and content type
  const requestValidation = await validateRequest(request, {
    maxSize: REQUEST_LIMITS.MAX_JSON_SIZE,
    allowedContentTypes: ['application/json'],
    timeout: REQUEST_LIMITS.DEFAULT_TIMEOUT,
  });

  if (!requestValidation.valid) {
    return requestValidation.error!;
  }

  // Initialize Stripe client (after rate limiting and validation)
  const stripe = createStripeClient(await getStripeSecretKey());

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

    // Get booking details with equipment relation
    const { data: booking, error: bookingError } = await typedSelect(
      supabase,
      'bookings',
      'id, bookingNumber, customerId, totalAmount, equipment:equipmentId(make, model)'
    )
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking is an error object (GenericStringError)
    if ('error' in booking && booking.error === true) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Type assert booking to ensure it has the required properties
    type BookingRow = {
      id: string;
      bookingNumber: string;
      customerId: string;
      equipment?: { make: string | null; model: string | null } | null | Array<{ make: string | null; model: string | null }>;
    };
    const typedBooking = booking as unknown as BookingRow;

    // Verify user owns this booking
    if (typedBooking.customerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Type the equipment relation properly
    type EquipmentRelation = { make: string | null; model: string | null } | null;
    const equipment = Array.isArray(typedBooking.equipment)
      ? (typedBooking.equipment[0] as EquipmentRelation)
      : (typedBooking.equipment as EquipmentRelation);
    const equipmentMake = equipment?.make || 'Equipment';
    const equipmentModel = equipment?.model || '';

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        bookingId: typedBooking.id,
        bookingNumber: typedBooking.bookingNumber,
        customerId: typedBooking.customerId,
        type,
      },
      description: `${type === 'deposit' ? 'Security Deposit' : 'Payment'} for ${equipmentMake} ${equipmentModel} - Booking #${typedBooking.bookingNumber}`,
    });

    // Idempotency check: Look for existing pending payment with same bookingId, amount, and type
    // This prevents duplicate payment intents from being created
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('id, stripePaymentIntentId, status')
      .eq('bookingId', typedBooking.id)
      .eq('amount', amount)
      .eq('type', type)
      .in('status', ['pending', 'processing'])
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError) {
      logger.warn('Error checking for existing payment (continuing anyway)', {
        component: 'api-create-intent',
        action: 'idempotency_check_error',
        metadata: { bookingId: typedBooking.id, error: checkError.message },
      });
    }

    // If we found an existing pending payment with the same amount and type, reuse it
    if (existingPayment && existingPayment.stripePaymentIntentId) {
      logger.info('Reusing existing pending payment intent', {
        component: 'api-create-intent',
        action: 'idempotency_reuse',
        metadata: {
          bookingId: typedBooking.id,
          existingPaymentId: existingPayment.id,
          paymentIntentId: existingPayment.stripePaymentIntentId,
        },
      });

      // Retrieve the existing payment intent to get client secret
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          existingPayment.stripePaymentIntentId
        );

        return NextResponse.json({
          clientSecret: existingIntent.client_secret,
          paymentIntentId: existingIntent.id,
          amount,
          currency,
          bookingId,
          reused: true,
        });
      } catch (stripeError) {
        logger.error(
          'Failed to retrieve existing payment intent, creating new one',
          {
            component: 'api-create-intent',
            action: 'existing_intent_retrieve_failed',
            metadata: {
              bookingId: typedBooking.id,
              paymentIntentId: existingPayment.stripePaymentIntentId,
              error: stripeError instanceof Error ? stripeError.message : String(stripeError),
            },
          },
          stripeError instanceof Error ? stripeError : undefined
        );
        // Continue to create new payment intent below
      }
    }

    // Generate payment number (consistent format with other payment creation flows)
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create payment record in database
    const { error: paymentError } = await supabase.from('payments').insert({
      bookingId: typedBooking.id,
      paymentNumber,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      'Payment intent creation error',
      {
        component: 'api-create-intent',
        action: 'error',
        metadata: { error: errorMessage },
      },
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      { error: errorMessage || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
