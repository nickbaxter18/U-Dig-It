import Stripe from 'stripe';

import { logger } from '@/lib/logger';

export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-09-30.clover' as Stripe.LatestApiVersion;

const STRIPE_TEST_FALLBACK_KEY = 'sk_test_placeholder_key_here';
const STRIPE_TEST_FALLBACK_PUBLISHABLE_KEY = 'pk_test_placeholder_key_here';

// Cache for database-loaded keys
const cachedStripeKeys: { secret?: string; publishable?: string } | null = null;

/**
 * Load Stripe keys from Supabase secrets (environment variables)
 * Supabase secrets are available as environment variables in Next.js
 * Priority: Supabase secrets > system_config table > legacy env vars > fallback
 */
async function loadStripeKeysFromSupabaseSecrets(): Promise<{
  secret?: string;
  publishable?: string;
}> {
  const keys: { secret?: string; publishable?: string } = {};

  // First priority: Supabase secrets (set via `supabase secrets set`)
  // These are available as environment variables
  const secretFromSupabase = process.env.STRIPE_SECRET_TEST_KEY?.trim();
  const publishableFromSupabase = process.env.STRIPE_PUBLIC_TEST_KEY?.trim();

  if (secretFromSupabase) {
    keys.secret = secretFromSupabase;
    logger.info('[Stripe] Loaded secret key from Supabase secrets', {
      component: 'stripe-config',
      action: 'supabase_secrets_load',
      metadata: { source: 'STRIPE_SECRET_TEST_KEY' },
    });
  }

  if (publishableFromSupabase) {
    keys.publishable = publishableFromSupabase;
    logger.info('[Stripe] Loaded publishable key from Supabase secrets', {
      component: 'stripe-config',
      action: 'supabase_secrets_load',
      metadata: { source: 'STRIPE_PUBLIC_TEST_KEY' },
    });
  }

  // If we got both keys from Supabase secrets, return early
  if (keys.secret && keys.publishable) {
    return keys;
  }

  // Second priority: system_config table (for backward compatibility)
  if (typeof window === 'undefined') {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = await import('@/lib/supabase/config');

      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data, error } = await supabase
          .from('system_config')
          .select('key, value')
          .in('key', ['stripe_secret_key', 'stripe_publishable_key']);

        if (!error && data) {
          for (const row of data) {
            // Parse value - it might be a JSON string or plain string
            let value: string | null = null;
            if (typeof row.value === 'string') {
              value = row.value;
            } else if (row.value && typeof row.value === 'object') {
              // If it's stored as JSON, extract the string
              value = String(row.value);
            }

            // Strip quotes if the value is a JSON-encoded string
            if (value && value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }

            if (row.key === 'stripe_secret_key' && value && !keys.secret) {
              keys.secret = value;
            } else if (row.key === 'stripe_publishable_key' && value && !keys.publishable) {
              keys.publishable = value;
            }
          }

          if (keys.secret || keys.publishable) {
            logger.info('[Stripe] Loaded keys from system_config table', {
              component: 'stripe-config',
              action: 'database_load',
              metadata: { hasSecret: !!keys.secret, hasPublishable: !!keys.publishable },
            });
          }
        }
      }
    } catch (error) {
      logger.warn('[Stripe] Failed to load keys from database', {
        component: 'stripe-config',
        action: 'database_fallback',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  return keys;
}

export function createStripeClient(secretKey: string, overrides: Stripe.StripeConfig = {}): Stripe {
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    ...overrides,
  });
}

export async function getStripeSecretKey(): Promise<string> {
  // Priority 1: Supabase secrets (STRIPE_SECRET_TEST_KEY)
  const keys = await loadStripeKeysFromSupabaseSecrets();
  if (keys.secret) {
    return keys.secret;
  }

  // Priority 2: Legacy environment variable (for backward compatibility)
  const envKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (envKey && envKey.length > 0) {
    const isLiveKey = envKey.startsWith('sk_live_');

    if (process.env.NODE_ENV !== 'production' && isLiveKey) {
      logger.warn(
        '[Stripe] Live STRIPE_SECRET_KEY detected in development. Using test key to avoid mixing live/test environments.',
        { component: 'stripe-config', action: 'prevent_live_in_dev' }
      );
    } else {
      logger.info('[Stripe] Using legacy STRIPE_SECRET_KEY environment variable', {
        component: 'stripe-config',
        action: 'legacy_env_fallback',
      });
      return envKey;
    }
  }

  // Priority 3: Development fallback
  if (process.env.NODE_ENV !== 'production') {
    logger.warn(
      '[Stripe] STRIPE_SECRET_TEST_KEY not found in Supabase secrets, environment, or database. Using test fallback key.',
      { component: 'stripe-config', action: 'fallback_secret' }
    );
    return STRIPE_TEST_FALLBACK_KEY;
  }

  throw new Error(
    'STRIPE_SECRET_TEST_KEY is not configured. Set it via `supabase secrets set STRIPE_SECRET_TEST_KEY=sk_test_...` or add to system_config table.'
  );
}

export async function getStripePublishableKey(): Promise<string> {
  // Priority 1: Supabase secrets (STRIPE_PUBLIC_TEST_KEY)
  // Note: This can be called client-side, but Supabase secrets are server-only
  // So we check for the environment variable which Supabase injects
  const supabaseSecretKey = process.env.STRIPE_PUBLIC_TEST_KEY?.trim();
  if (supabaseSecretKey) {
    return supabaseSecretKey;
  }

  // Priority 2: Load from Supabase secrets/database (server-side only)
  if (typeof window === 'undefined') {
    const keys = await loadStripeKeysFromSupabaseSecrets();
    if (keys.publishable) {
      return keys.publishable;
    }
  }

  // Priority 3: Legacy environment variable (for backward compatibility)
  const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (envKey && envKey.length > 0) {
    const isLiveKey = envKey.startsWith('pk_live_');

    if (process.env.NODE_ENV !== 'production' && isLiveKey) {
      logger.warn(
        '[Stripe] Live NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY detected in development. Using test key to avoid mixing live/test environments.',
        { component: 'stripe-config', action: 'prevent_live_in_dev' }
      );
    } else {
      logger.info('[Stripe] Using legacy NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable', {
        component: 'stripe-config',
        action: 'legacy_env_fallback',
      });
      return envKey;
    }
  }

  // Priority 4: Development fallback
  if (process.env.NODE_ENV !== 'production') {
    logger.warn(
      '[Stripe] STRIPE_PUBLIC_TEST_KEY not found in Supabase secrets, environment, or database. Using test fallback key.',
      { component: 'stripe-config', action: 'fallback_publishable' }
    );
    return STRIPE_TEST_FALLBACK_PUBLISHABLE_KEY;
  }

  throw new Error(
    'STRIPE_PUBLIC_TEST_KEY is not configured. Set it via `supabase secrets set STRIPE_PUBLIC_TEST_KEY=pk_test_...` or add to system_config table.'
  );
}

/**
 * Get Stripe webhook secret from Supabase secrets
 * Priority: Supabase secrets > legacy env var
 */
export function getStripeWebhookSecret(): string {
  // Priority 1: Supabase secrets (set via `supabase secrets set`)
  const secretFromSupabase = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (secretFromSupabase) {
    logger.info('[Stripe] Loaded webhook secret from Supabase secrets', {
      component: 'stripe-config',
      action: 'webhook_secret_load',
      metadata: { source: 'STRIPE_WEBHOOK_SECRET' },
    });
    return secretFromSupabase;
  }

  // No fallback for webhook secret - it's required
  throw new Error(
    'STRIPE_WEBHOOK_SECRET is not configured. Set it via `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`'
  );
}
