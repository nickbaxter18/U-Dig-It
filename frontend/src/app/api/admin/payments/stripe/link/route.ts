import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';

export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('paymentId');

  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
  }

  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, "stripePaymentIntentId", "stripeCheckoutSessionId"')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      logger.error('Stripe link payment lookup failed', {
        component: 'admin-stripe-link-api',
        action: 'payment_not_found',
        metadata: { paymentId, error: paymentError?.message },
      });
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (!payment.stripePaymentIntentId && !payment.stripeCheckoutSessionId) {
      return NextResponse.json(
        { error: 'Payment is not linked to Stripe (missing payment intent and checkout session)' },
        { status: 400 },
      );
    }

    let dashboardUrl: string | null = null;
    const secretKey = await getStripeSecretKey();
    const stripe = createStripeClient(secretKey);

    try {
      if (payment.stripePaymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.stripePaymentIntentId,
        );
        const baseUrl = paymentIntent.livemode
          ? 'https://dashboard.stripe.com'
          : 'https://dashboard.stripe.com/test';
        dashboardUrl = `${baseUrl}/payments/${paymentIntent.id}`;

        logger.info('Stripe dashboard link generated', {
          component: 'admin-stripe-link-api',
          action: 'link_success',
          metadata: {
            paymentId,
            paymentIntentId: paymentIntent.id,
            livemode: paymentIntent.livemode,
          },
        });
      } else if (payment.stripeCheckoutSessionId) {
        const session = await stripe.checkout.sessions.retrieve(
          payment.stripeCheckoutSessionId,
        );

        const baseUrl = session.livemode
          ? 'https://dashboard.stripe.com'
          : 'https://dashboard.stripe.com/test';

        if (session.payment_intent && typeof session.payment_intent === 'string') {
          dashboardUrl = `${baseUrl}/payments/${session.payment_intent}`;
        } else {
          dashboardUrl = `${baseUrl}/checkout/sessions/${session.id}`;
        }

        logger.info('Stripe dashboard link generated via checkout session', {
          component: 'admin-stripe-link-api',
          action: 'link_success_checkout_session',
          metadata: {
            paymentId,
            checkoutSessionId: session.id,
            paymentIntentId: session.payment_intent,
            livemode: session.livemode,
          },
        });
      }
    } catch (stripeError: any) {
      logger.warn('Unable to retrieve Stripe resource, falling back to heuristic URL', {
        component: 'admin-stripe-link-api',
        action: 'stripe_lookup_fallback',
        metadata: {
          paymentId,
          paymentIntentId: payment.stripePaymentIntentId,
          checkoutSessionId: payment.stripeCheckoutSessionId,
          error: stripeError?.message,
        },
      });

      const fallbackBase = (() => {
        const identifier = payment.stripePaymentIntentId || payment.stripeCheckoutSessionId || '';
        return identifier.includes('test') || identifier.startsWith('pi_test_') || identifier.startsWith('cs_test_')
          ? 'https://dashboard.stripe.com/test'
          : 'https://dashboard.stripe.com';
      })();

      if (payment.stripePaymentIntentId) {
        dashboardUrl = `${fallbackBase}/payments/${payment.stripePaymentIntentId}`;
      } else if (payment.stripeCheckoutSessionId) {
        dashboardUrl = `${fallbackBase}/checkout/sessions/${payment.stripeCheckoutSessionId}`;
      }
    }

    return NextResponse.json({ url: dashboardUrl });
  } catch (error: any) {
    logger.error('Stripe dashboard link error', {
      component: 'admin-stripe-link-api',
      action: 'error',
      metadata: { paymentId, error: error?.message },
    }, error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}



