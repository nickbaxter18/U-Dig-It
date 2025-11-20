/**
 * Google Maps API Configuration
 *
 * Loads Google Maps API key from Supabase secrets or environment variables
 * Reference: @https://developers.google.com/maps/documentation
 */
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * Loads Google Maps API key from Supabase secrets
 * Priority: Supabase Edge Function secrets > Environment variable
 */
async function loadGoogleMapsApiKeyFromSupabaseSecrets(): Promise<string | null> {
  try {
    // Only run on server-side
    if (typeof window !== 'undefined') {
      return null;
    }

    const supabase = await createClient();

    // Try to fetch from Supabase secrets via Edge Function
    // Note: Edge Function secrets are accessed via process.env in Edge Functions
    // For Next.js API routes, we need to fetch from system_config or use env vars

    // Check if running in Supabase Edge Function context
    if (process.env.GOOGLE_MAPS_API_KEY) {
      logger.debug('Google Maps API key loaded from Supabase Edge Function secrets', {
        component: 'maps-config',
        action: 'load_from_secrets',
      });
      return process.env.GOOGLE_MAPS_API_KEY;
    }

    // Fallback: Try loading from system_config table
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'GOOGLE_MAPS_API_KEY')
      .single();

    if (error) {
      logger.warn('Failed to load Google Maps API key from system_config', {
        component: 'maps-config',
        action: 'load_from_db_failed',
        metadata: { error: error.message },
      });
      return null;
    }

    if (data?.value) {
      // Parse jsonb value - it might be a JSON string or object
      let apiKey: string | null = null;
      if (typeof data.value === 'string') {
        apiKey = data.value;
      } else if (typeof data.value === 'object' && data.value !== null) {
        // If stored as JSON, extract the string
        apiKey = String(data.value);
      }

      // Strip quotes if the value is a JSON-encoded string
      if (apiKey && apiKey.startsWith('"') && apiKey.endsWith('"')) {
        apiKey = apiKey.slice(1, -1);
      }

      if (apiKey && apiKey.length > 0) {
        logger.debug('Google Maps API key loaded from system_config table', {
          component: 'maps-config',
          action: 'load_from_db',
        });
        return apiKey;
      }
    }

    return null;
  } catch (err) {
    logger.error(
      'Failed to load Google Maps API key from Supabase',
      {
        component: 'maps-config',
        action: 'load_error',
      },
      err instanceof Error ? err : undefined
    );
    return null;
  }
}

/**
 * Gets Google Maps API key with priority:
 * 1. Supabase Edge Function secrets (GOOGLE_MAPS_API_KEY)
 * 2. System config table
 * 3. Environment variable (fallback)
 */
export async function getGoogleMapsApiKey(): Promise<string> {
  // Priority 1: Supabase secrets/system_config
  const supabaseKey = await loadGoogleMapsApiKeyFromSupabaseSecrets();
  if (supabaseKey) {
    return supabaseKey;
  }

  // Priority 2: Environment variable (for local development)
  const envKey = process.env.GOOGLE_MAPS_API_KEY;
  if (envKey) {
    logger.debug('Google Maps API key loaded from environment variable', {
      component: 'maps-config',
      action: 'load_from_env',
    });
    return envKey;
  }

  // No key found
  logger.error('Google Maps API key not configured', {
    component: 'maps-config',
    action: 'missing_api_key',
  });

  throw new Error(
    'GOOGLE_MAPS_API_KEY is not configured. Set it via Supabase Edge Function secrets or add to system_config table.'
  );
}

/**
 * Validates Google Maps API key is accessible
 */
export async function validateGoogleMapsApiKey(): Promise<boolean> {
  try {
    await getGoogleMapsApiKey();
    return true;
  } catch {
    return false;
  }
}
