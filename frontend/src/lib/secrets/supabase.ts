/**
 * Supabase-specific secrets loader
 *
 * Loads Supabase configuration from Supabase Edge Function secrets
 * with fallback to environment variables and hardcoded values.
 */
import { getSecretValue } from './loader';

const HARDCODED_FALLBACK_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2NjQ5OSwiZXhwIjoyMDc1MzQyNDk5fQ.ZkwAdRCdTL0DKGPgJtkbcBllkvachJqTdomV7IcGH3I';

/**
 * Get Supabase service role key from Supabase secrets
 * Priority: Supabase secrets > env vars > hardcoded fallback
 */
export async function getSupabaseServiceRoleKey(): Promise<string> {
  const secret = await getSecretValue('SUPABASE_SERVICE_ROLE_KEY', {
    fallback: HARDCODED_FALLBACK_SERVICE_ROLE_KEY,
    required: false,
  });

  if (secret) {
    return secret;
  }

  // Fallback to hardcoded for development
  if (process.env.NODE_ENV !== 'production') {
    return HARDCODED_FALLBACK_SERVICE_ROLE_KEY;
  }

  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is not configured. Set it via Supabase Edge Function secrets or .env.local'
  );
}
