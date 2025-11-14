#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

import type { Database } from '../../supabase/types';
import { STRIPE_API_VERSION, getStripeSecretKey } from '../src/lib/stripe/config';
import {
  SUPABASE_SERVICE_ROLE_KEY as CONFIG_SERVICE_ROLE_KEY,
  SUPABASE_URL as CONFIG_SUPABASE_URL,
} from '../src/lib/supabase/config';

const SUPABASE_URL = process.env.SUPABASE_URL ?? CONFIG_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? CONFIG_SERVICE_ROLE_KEY;

const LOOKBACK_HOURS = Number.parseInt(process.env.STRIPE_RECON_LOOKBACK_HOURS ?? '24', 10);
const sinceDate = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type SupabasePayment = {
  id: string;
  booking_id: string;
  amount_cents: number;
  currency: string | null;
  status: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string | null;
};

async function fetchRecentPayments(): Promise<SupabasePayment[]> {
  const { data, error } = await supabase
    .from('booking_payments')
    .select('id, booking_id, amount_cents, currency, status, stripe_payment_intent_id, created_at')
    .gte('created_at', sinceDate.toISOString());

  if (error) {
    throw error;
  }
  return data ?? [];
}

async function fetchIntent(stripe: Stripe, intentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(intentId);
  } catch (error: any) {
    if (error && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

async function fetchRecentStripeIntents(
  stripe: Stripe
): Promise<Map<string, Stripe.Response<Stripe.PaymentIntent>>> {
  const intents = new Map<string, Stripe.Response<Stripe.PaymentIntent>>();
  let startingAfter: string | undefined;

  while (true) {
    const response = await stripe.paymentIntents.list({
      limit: 100,
      created: { gte: Math.floor(sinceDate.getTime() / 1000) },
      starting_after: startingAfter,
    });

    for (const intent of response.data) {
      intents.set(intent.id, intent);
    }

    if (!response.has_more) {
      break;
    }
    startingAfter = response.data[response.data.length - 1]?.id;
    if (!startingAfter) {
      break;
    }
  }
  return intents;
}

(async () => {
  try {
    // Get Stripe secret key from Supabase secrets
    const STRIPE_SECRET_KEY = await getStripeSecretKey();

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
      console.warn(
        '⚠️  Skipping Stripe reconciliation: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or STRIPE_SECRET_KEY not configured.'
      );
      process.exit(0);
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
    });

    console.log(
      `🔍 Reconciling Stripe payment intents against Supabase booking payments (last ${LOOKBACK_HOURS}h)`
    );

    const [supabasePayments, stripeIntentMap] = await Promise.all([
      fetchRecentPayments(),
      fetchRecentStripeIntents(stripe),
    ]);

    const mismatches: string[] = [];
    const missingStripeIntents: string[] = [];
    const unmatchedStripeIntents: string[] = [];

    const supabaseIntentIds = new Set(
      supabasePayments
        .map((payment) => payment.stripe_payment_intent_id)
        .filter((id): id is string => Boolean(id))
    );

    // Compare Supabase records to Stripe
    for (const payment of supabasePayments) {
      if (!payment.stripe_payment_intent_id) {
        mismatches.push(
          `Payment ${payment.id} (booking ${payment.booking_id}) missing stripe_payment_intent_id`
        );
        continue;
      }

      const intent = stripeIntentMap.get(payment.stripe_payment_intent_id);
      if (!intent) {
        missingStripeIntents.push(
          `Stripe intent ${payment.stripe_payment_intent_id} referenced by Supabase payment ${payment.id} not found`
        );
        continue;
      }

      if (intent.amount !== payment.amount_cents) {
        mismatches.push(
          `Amount mismatch for booking ${payment.booking_id}: Supabase ${payment.amount_cents} vs Stripe ${intent.amount}`
        );
      }

      const paymentCurrency = (payment.currency ?? '').toLowerCase();
      if (paymentCurrency && paymentCurrency !== intent.currency) {
        mismatches.push(
          `Currency mismatch for booking ${payment.booking_id}: Supabase ${paymentCurrency} vs Stripe ${intent.currency}`
        );
      }

      const normalizedSupabaseStatus = (payment.status ?? '').toLowerCase();
      const normalizedStripeStatus = intent.status?.toLowerCase();
      if (normalizedSupabaseStatus && normalizedSupabaseStatus !== normalizedStripeStatus) {
        mismatches.push(
          `Status mismatch for booking ${payment.booking_id}: Supabase ${normalizedSupabaseStatus} vs Stripe ${normalizedStripeStatus}`
        );
      }
    }

    // Surface Stripe intents that reference a booking but have no Supabase record
    for (const intent of stripeIntentMap.values()) {
      const referencedBookingId =
        typeof intent.metadata?.bookingId === 'string' ? intent.metadata.bookingId : undefined;

      if (!referencedBookingId) {
        continue;
      }

      if (!supabaseIntentIds.has(intent.id)) {
        unmatchedStripeIntents.push(
          `Stripe intent ${intent.id} (booking ${referencedBookingId}) has no matching Supabase booking_payment record`
        );
      }
    }

    if (
      mismatches.length === 0 &&
      missingStripeIntents.length === 0 &&
      unmatchedStripeIntents.length === 0
    ) {
      console.log('✅ Reconciliation successful – no discrepancies detected.');
      process.exit(0);
    }

    console.error('❌ Reconciliation discrepancies detected:');

    if (missingStripeIntents.length) {
      console.error('\n-- Missing Stripe PaymentIntents referenced in Supabase --');
      for (const line of missingStripeIntents) {
        console.error(` • ${line}`);
      }
    }

    if (mismatches.length) {
      console.error('\n-- Mismatched records --');
      for (const line of mismatches) {
        console.error(` • ${line}`);
      }
    }

    if (unmatchedStripeIntents.length) {
      console.error('\n-- Stripe intents without Supabase booking_payments --');
      for (const line of unmatchedStripeIntents) {
        console.error(` • ${line}`);
      }
    }

    process.exit(1);
  } catch (error) {
    console.error('❌ Reconciliation script failed:', error);
    process.exit(1);
  }
})();
