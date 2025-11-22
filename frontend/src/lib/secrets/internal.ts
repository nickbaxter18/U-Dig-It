/**
 * Internal Service Secrets Loader
 *
 * Loads internal service keys from multiple sources:
 * 1. Supabase Edge Function secrets (process.env.INTERNAL_SERVICE_KEY - when available)
 * 2. Environment variables (.env.local - for local development)
 * 3. system_config table (for database-stored secrets)
 */
import { logger } from '@/lib/logger';

import { getSecret } from './loader';

/**
 * Get internal service key from Supabase secrets or environment
 * Priority: INTERNAL_SERVICE_KEY (Supabase secrets) > legacy env var > system_config table
 */
export async function getInternalServiceKey(): Promise<string> {
  // Priority 1: Supabase Edge Function secrets (INTERNAL_SERVICE_KEY)
  const internalServiceKey = process.env.INTERNAL_SERVICE_KEY?.trim();
  if (internalServiceKey) {
    return internalServiceKey;
  }

  // Priority 2: Unified secrets loader (checks system_config table)
  if (typeof window === 'undefined') {
    const secretResult = await getSecret('INTERNAL_SERVICE_KEY', {
      required: false,
      logSource: false,
    });

    if (secretResult?.value) {
      return secretResult.value;
    }
  }

  // No key found
  const error = new Error(
    'Internal service key not configured. Set INTERNAL_SERVICE_KEY in Supabase Edge Function secrets, .env.local, or system_config table.'
  );
  logger.error(
    'Internal service key not found',
    {
      component: 'internal-secrets',
      action: 'key_not_found',
      metadata: {
        checked: ['INTERNAL_SERVICE_KEY', 'system_config'],
      },
    },
    error
  );
  throw error;
}
