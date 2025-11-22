import { createClient } from '@supabase/supabase-js';

import { getSupabaseServiceRoleKey } from '@/lib/secrets/supabase';

import { SUPABASE_URL } from './config';

/**
 * Create a Supabase client with service role key
 * Loads the service role key from Supabase secrets or system_config table
 */
export async function createServiceClient() {
  try {
    const serviceRoleKey = await getSupabaseServiceRoleKey();

    if (!serviceRoleKey) {
      console.warn('[createServiceClient] Service role key not available');
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
    });
    return null;
  }
}
