/**
 * Maps Secrets Loader
 *
 * Loads Google Maps API key from multiple sources:
 * 1. Supabase Edge Function secrets (process.env.GOOGLE_MAPS_API_KEY - when available)
 * 2. Environment variables (.env.local - for local development)
 * 3. system_config table (for database-stored secrets)
 */
import { logger } from '@/lib/logger';

import { getSecret } from './loader';

/**
 * Get Google Maps API key from Supabase secrets or environment
 * Priority: GOOGLE_MAPS_API_KEY (Supabase secrets) > legacy env var > system_config table
 */
export async function getGoogleMapsApiKey(): Promise<string> {
  // Priority 1: Supabase Edge Function secrets (GOOGLE_MAPS_API_KEY)
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (googleMapsApiKey) {
    return googleMapsApiKey;
  }

  // Priority 2: Unified secrets loader (checks system_config table)
  if (typeof window === 'undefined') {
    const secretResult = await getSecret('GOOGLE_MAPS_API_KEY', {
      required: false,
      logSource: false,
    });

    if (secretResult?.value) {
      return secretResult.value;
    }
  }

  // No key found
  const error = new Error(
    'Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY in Supabase Edge Function secrets, .env.local, or system_config table.'
  );
  logger.error(
    'Google Maps API key not found',
    {
      component: 'maps-secrets',
      action: 'key_not_found',
      metadata: {
        checked: ['GOOGLE_MAPS_API_KEY', 'system_config'],
      },
    },
    error
  );
  throw error;
}
