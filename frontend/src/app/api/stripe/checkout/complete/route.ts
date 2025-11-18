import { NextRequest, NextResponse } from 'next/server';

import { checkAndCompleteBookingIfReady } from '@/lib/check-and-complete-booking';
import { logger } from '@/lib/logger';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

type FinalizePayload = {
  sessionId?: string;
  bookingId?: string;
  paymentType?: string;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as FinalizePayload;

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId. Unable to finalize payment.' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error(
      'Unauthorized payment finalization attempt',
      {
        component: 'checkout-complete-api',
        action: 'auth_failed',
        metadata: { sessionId: payload.sessionId },
      },
      authError || undefined
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = createStripeClient(await getStripeSecretKey());

  try {
    logger.info('Retrieving Stripe checkout session', {
      component: 'checkout-complete-api',
      action: 'retrieve_session_start',
      metadata: { sessionId: payload.sessionId, userId: user.id },
    });

    const session = await stripe.checkout.sessions.retrieve(payload.sessionId);

    const paymentId = session.metadata?.paymentId;
    const bookingId = session.metadata?.bookingId ?? payload.bookingId;
    const paymentType = session.metadata?.paymentType ?? payload.paymentType ?? 'payment';

    if (!paymentId) {
      logger.error('Checkout session missing paymentId metadata', {
        component: 'checkout-complete-api',
        action: 'missing_payment_metadata',
        metadata: { sessionId: payload.sessionId, bookingId },
      });
      return NextResponse.json(
        {
          error:
            'Unable to finalize payment. Stripe session is missing the payment reference metadata.',
        },
        { status: 422 }
      );
    }

    const sessionData = session as any;
    const processedAt =
      sessionData.status_transitions?.paid_at != null
        ? new Date(sessionData.status_transitions.paid_at * 1000).toISOString()
        : session.payment_status === 'paid'
          ? new Date().toISOString()
          : null;

    const metadata = {
      ...session.metadata,
      stripeSessionId: session.id,
      stripePaymentStatus: session.payment_status,
      stripeStatus: session.status,
      stripeMode: session.mode,
      stripeCustomerEmail: session.customer_details?.email,
    };

    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: session.payment_status === 'paid' ? 'completed' : 'pending',
        stripePaymentIntentId: (session.payment_intent as string) ?? null,
        processedAt: processedAt ?? new Date().toISOString(),
        stripeMetadata: metadata,
      })
      .eq('id', paymentId)
      .select('id, bookingId, type, status, amount')
      .maybeSingle();

    if (updateError) {
      logger.error(
        'Failed to update payment during checkout finalization',
        {
          component: 'checkout-complete-api',
          action: 'payment_update_failed',
          metadata: { sessionId: payload.sessionId, paymentId, error: updateError.message },
        },
        updateError
      );

      return NextResponse.json(
        { error: 'Failed to update payment record after checkout.' },
        { status: 500 }
      );
    }

    logger.info('Payment finalized after Stripe checkout redirect', {
      component: 'checkout-complete-api',
      action: 'payment_updated',
      metadata: {
        paymentId,
        bookingId,
        sessionId: payload.sessionId,
        status: updatedPayment?.status,
      },
    });

    if (bookingId) {
      try {
        await checkAndCompleteBookingIfReady(
          bookingId,
          paymentType === 'deposit' ? 'Security Deposit Paid' : 'Invoice Paid'
        );
      } catch (completionError) {
        logger.error(
          'Booking completion check failed after checkout finalization',
          {
            component: 'checkout-complete-api',
            action: 'booking_completion_failed',
            metadata: { bookingId, paymentId, sessionId: payload.sessionId },
          },
          completionError instanceof Error ? completionError : new Error(String(completionError))
        );
      }
    }

    return NextResponse.json({
      success: true,
      paymentId,
      bookingId,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    logger.error(
      'Stripe checkout finalization failed',
      {
        component: 'checkout-complete-api',
        action: 'stripe_error',
        metadata: { sessionId: payload.sessionId, message: err.message },
      },
      err
    );

    return NextResponse.json(
      { error: 'Unable to finalize checkout session. Please try again or contact support.' },
      { status: 500 }
    );
  }
}

