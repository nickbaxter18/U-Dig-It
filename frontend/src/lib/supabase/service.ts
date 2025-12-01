import { createClient } from '@supabase/supabase-js';

import { getSupabaseServiceRoleKey } from '@/lib/secrets/supabase';

import { SUPABASE_URL } from './config';

/**
 * Create a Supabase client with service role key
 * Loads the service role key from Supabase secrets or system_config table
 */
export async function createServiceClient() {
  try {
    let serviceRoleKey: string;

    try {
      serviceRoleKey = await getSupabaseServiceRoleKey();
    } catch (keyError) {
      // In development, use hardcoded fallback
      if (process.env.NODE_ENV !== 'production') {
        const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2NjQ5OSwiZXhwIjoyMDc1MzQyNDk5fQ.ZkwAdRCdTL0DKGPgJtkbcBllkvachJqTdomV7IcGH3I';
        console.warn('[createServiceClient] Using hardcoded fallback service role key', {
          error: keyError instanceof Error ? keyError.message : String(keyError),
        });
        serviceRoleKey = fallbackKey;
      } else {
        console.error('[createServiceClient] Service role key not available in production', {
          error: keyError instanceof Error ? keyError.message : String(keyError),
        });
        return null;
      }
    }

    if (!serviceRoleKey || serviceRoleKey.trim() === '') {
      console.error('[createServiceClient] Service role key is empty');
      return null;
    }

    if (!SUPABASE_URL) {
      console.error('[createServiceClient] SUPABASE_URL is not configured');
      return null;
    }

    const client = createClient(SUPABASE_URL, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.debug('[createServiceClient] Service client created successfully', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!serviceRoleKey,
      keyLength: serviceRoleKey.length,
    });

    return client;
  } catch (error) {
    console.error('[createServiceClient] Error creating service client', {
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // In development, try one more time with hardcoded fallback
    if (process.env.NODE_ENV !== 'production' && SUPABASE_URL) {
      try {
        const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2NjQ5OSwiZXhwIjoyMDc1MzQyNDk5fQ.ZkwAdRCdTL0DKGPgJtkbcBllkvachJqTdomV7IcGH3I';
        console.warn('[createServiceClient] Retrying with hardcoded fallback after error');
        return createClient(SUPABASE_URL, fallbackKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
      } catch (fallbackError) {
        console.error('[createServiceClient] Fallback also failed', {
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        });
      }
    }

    return null;
  }
}
