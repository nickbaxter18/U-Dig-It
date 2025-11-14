/**
 * Create Stripe Checkout Session API
 * Creates a Stripe Checkout session for booking payments (invoice or deposit)
 */

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const stripe = createStripeClient(await getStripeSecretKey());

  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Authentication failed', {
        component: 'create-checkout-session',
        action: 'auth_failed',
        metadata: { error: authError?.message },
      }, authError || undefined);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, paymentType = 'invoice' } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    logger.info('Creating checkout session', {
      component: 'create-checkout-session',
      action: 'start',
      metadata: { bookingId, paymentType, userId: user.id },
    });

    // Get booking details with equipment and customer info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        equipment:equipmentId(make, model, unitId),
        customer:customerId(email, firstName, lastName)
      `
      )
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      logger.error('Booking not found', {
        component: 'create-checkout-session',
        action: 'booking_error',
        metadata: { bookingId, error: bookingError?.message },
      }, bookingError || undefined);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user owns this booking
    if (booking.customerId !== user.id) {
      logger.warn('Unauthorized booking access attempt', {
        component: 'create-checkout-session',
        action: 'unauthorized_access',
        metadata: { bookingId, userId: user.id, ownerId: booking.customerId },
      });
      return NextResponse.json({ error: 'Unauthorized access to booking' }, { status: 403 });
    }

    // Determine amount based on payment type
    const amount = paymentType === 'deposit'
      ? Number(booking.securityDeposit)
      : Number(booking.totalAmount);

    const description = paymentType === 'deposit'
      ? `Security Deposit: ${booking.equipment.make} ${booking.equipment.model} (${booking.bookingNumber})`
      : `Rental Invoice: ${booking.equipment.make} ${booking.equipment.model} (${booking.bookingNumber})`;

    logger.info('Creating Stripe checkout session', {
      component: 'create-checkout-session',
      action: 'stripe_create',
      metadata: {
        bookingId,
        paymentType,
        amount,
        customerEmail: booking.customer.email
      },
    });

    const sessionMetadata: Record<string, string> = {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      customerId: booking.customerId,
      equipmentId: booking.equipmentId,
      paymentType,
    };

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: description,
              description: `Booking: ${booking.bookingNumber}`,
              metadata: {
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
                equipmentId: booking.equipmentId,
                paymentType,
              },
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/${bookingId}/manage?payment=success&type=${paymentType}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/${bookingId}/manage?payment=cancelled&type=${paymentType}`,
      customer_email: booking.customer.email,
      metadata: sessionMetadata,
    });

    logger.info('Checkout session created successfully', {
      component: 'create-checkout-session',
      action: 'success',
      metadata: {
        bookingId,
        paymentType,
        sessionId: session.id,
        sessionUrl: session.url
      },
    });

    // Normalize payment type for database ('invoice' -> 'payment')
    const dbPaymentType = (paymentType === 'invoice') ? 'payment' : paymentType;

    // Generate payment number
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create payment record in database
    const { data: paymentRecord, error: paymentInsertError } = await supabase
      .from('payments')
      .insert({
        bookingId: booking.id,
        paymentNumber,
        amount,
        type: dbPaymentType,
        status: 'pending',
        method: 'credit_card',  // Required field - must match enum
        stripePaymentIntentId: session.payment_intent as string || null,
        stripeCheckoutSessionId: session.id,
      })
      .select('id')
      .single();

    if (paymentInsertError) {
      logger.error('Failed to create payment record', {
        component: 'create-checkout-session',
        action: 'payment_insert_failed',
        metadata: { bookingId, paymentType: dbPaymentType, error: paymentInsertError.message },
      }, paymentInsertError);
      // Don't fail the request - payment record can be created later via webhook
    } else if (paymentRecord?.id) {
      try {
        await stripe.checkout.sessions.update(session.id, {
          metadata: {
            ...sessionMetadata,
            paymentId: paymentRecord.id,
          },
        });
      } catch (metadataError) {
        const errorMessage = metadataError instanceof Error ? metadataError.message : 'Unknown error';
        logger.error('Failed to attach paymentId to checkout session metadata', {
          component: 'create-checkout-session',
          action: 'metadata_update_failed',
          metadata: {
            sessionId: session.id,
            paymentId: paymentRecord.id,
            error: errorMessage,
          },
        }, metadataError instanceof Error ? metadataError : undefined);
      }
    }

    return NextResponse.json({
      sessionUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    logger.error('Checkout session creation error', {
      component: 'create-checkout-session',
      action: 'error',
      metadata: {
        message: error.message,
        stack: error.stack,
      },
    }, error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
