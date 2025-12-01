/**
 * Create Stripe Checkout Session API
 * Creates a checkout session for booking payment
 */
import { NextRequest, NextResponse } from 'next/server';

import { PAYMENT_STATUS, type PaymentStatus } from '@/lib/constants/payment-status';
import { getErrorMessage } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

// import Stripe from 'stripe'; // Unused - type only

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, paymentType, returnUrl, cancelUrl } = await req.json();

    // Get base URL with proper fallback
    const getBaseUrl = () => {
      // Priority 1: Use provided returnUrl/cancelUrl base if available
      if (returnUrl) {
        try {
          const url = new URL(returnUrl);
          return url.origin;
        } catch {
          // Invalid URL, continue to next option
        }
      }

      // Priority 2: Use NEXT_PUBLIC_SITE_URL if set and valid
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
      if (siteUrl) {
        try {
          const url = new URL(siteUrl);
          return url.origin;
        } catch {
          // Invalid URL, continue to next option
        }
      }

      // Priority 3: Use request origin (from headers)
      const origin = req.headers.get('origin') || req.headers.get('host');
      if (origin) {
        // Check if origin already has scheme
        if (origin.startsWith('http://') || origin.startsWith('https://')) {
          try {
            const url = new URL(origin);
            return url.origin;
          } catch {
            // Invalid, continue
          }
        } else {
          // Add scheme based on environment
          const scheme = process.env.NODE_ENV === 'production' ? 'https' : 'http';
          return `${scheme}://${origin}`;
        }
      }

      // Priority 4: Default fallback for development
      return 'http://localhost:3000';
    };

    const baseUrl = getBaseUrl();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        equipment:equipmentId(make, model, unitId),
        customer:customerId(email, firstName, lastName),
        payments(id, type, status, amount)
      `
      )
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user owns this booking OR is an admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role && ['admin', 'super_admin'].includes(userData.role);

    if (booking.customerId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized access to booking' }, { status: 403 });
    }

    // Determine payment type and amount
    const isDeposit = paymentType === 'deposit';
    const amount = isDeposit
      ? parseFloat(booking.securityDeposit)
      : parseFloat(booking.totalAmount);
    const description = isDeposit
      ? `Security Deposit: ${booking.equipment.make} ${booking.equipment.model} (${booking.bookingNumber})`
      : `Rental Payment: ${booking.equipment.make} ${booking.equipment.model} (${booking.bookingNumber})`;

    // Check if this specific payment type is already paid
    // Type the payment relation properly
    type PaymentRelation = {
      id: string;
      type: string;
      status: PaymentStatus | string;
      amount: number | string;
    };
    const existingPayment = (booking.payments as PaymentRelation[] | undefined)?.find(
      (p) => p.type === paymentType && p.status === PAYMENT_STATUS.COMPLETED
    );
    if (existingPayment) {
      return NextResponse.json(
        {
          error: `${isDeposit ? 'Deposit' : 'Payment'} already completed`,
        },
        { status: 400 }
      );
    }

    logger.info('Creating Stripe checkout session', {
      component: 'api-create-checkout',
      action: 'create_session',
      metadata: { bookingId, paymentType, amount },
    });

    // Create payment record in database
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        bookingId: booking.id,
        amount: amount,
        type: paymentType,
        status: 'pending',
        method: 'credit_card',
        description: description,
      })
      .select()
      .single();

    if (paymentError) {
      logger.error('Failed to create payment record', {
        component: 'api-create-checkout',
        action: 'payment_record_error',
        metadata: { error: paymentError },
      });
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: description,
              description: `Booking: ${booking.bookingNumber}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: returnUrl || `${baseUrl}/booking/${bookingId}/manage?payment=success`,
      cancel_url: cancelUrl || `${baseUrl}/booking/${bookingId}/manage?payment=cancelled`,
      client_reference_id: booking.id,
      customer_email: booking.customer.email,
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        equipmentId: booking.equipmentId,
        customerId: booking.customerId,
        paymentId: paymentRecord.id,
        paymentType: paymentType,
      },
    });

    logger.info('Stripe checkout session created', {
      component: 'api-create-checkout',
      action: 'session_created',
      metadata: {
        bookingId,
        sessionId: session.id,
        paymentId: paymentRecord.id,
      },
    });

    // Update payment record with Stripe session ID
    await supabase
      .from('payments')
      .update({
        stripeCheckoutSessionId: session.id,
      })
      .eq('id', paymentRecord.id);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    logger.error(
      'Checkout creation error:',
      {
        component: 'api-create-checkout',
        action: 'error',
        metadata: { error: errorMessage },
      },
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      {
        error: errorMessage || 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
