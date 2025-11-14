import { logger } from '@/lib/logger';

const LOCAL_HOST_REGEX = /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3})(?::\d+)?/i;

function sanitizeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.replace(/\/+$/, '');
}

const rawSupabaseUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const fallbackSupabaseUrl =
  sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_FALLBACK_URL) ??
  'https://bnimazxnqligusckahab.supabase.co';
const allowLocal =
  (process.env.NEXT_PUBLIC_SUPABASE_ALLOW_LOCAL ?? '').toLowerCase() === 'true';

const shouldFallback =
  !rawSupabaseUrl || (LOCAL_HOST_REGEX.test(rawSupabaseUrl) && !allowLocal);

if (shouldFallback && process.env.NODE_ENV !== 'production') {
  const source =
    rawSupabaseUrl && LOCAL_HOST_REGEX.test(rawSupabaseUrl)
      ? rawSupabaseUrl
      : 'environment';
  logger.warn(
    `[Supabase] Using fallback Supabase project because ${source} points to a local emulator or is undefined. ` +
      'Set NEXT_PUBLIC_SUPABASE_ALLOW_LOCAL=true if you intentionally want to use the local Supabase stack.',
    { component: 'supabase-config', action: 'fallback_warning' }
  );
}

export const SUPABASE_URL = sanitizeUrl(
  shouldFallback ? fallbackSupabaseUrl : rawSupabaseUrl
)!;

const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const fallbackAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_FALLBACK_ANON_KEY ?? rawAnonKey;

export const SUPABASE_ANON_KEY = (shouldFallback ? fallbackAnonKey : rawAnonKey)!;

const rawServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fallbackServiceRoleKey =
  process.env.SUPABASE_FALLBACK_SERVICE_ROLE_KEY ?? rawServiceRoleKey;

export const SUPABASE_SERVICE_ROLE_KEY = (
  shouldFallback ? fallbackServiceRoleKey : rawServiceRoleKey
)!;

if (!SUPABASE_URL) {
  throw new Error(
    'Supabase configuration error: missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_FALLBACK_URL.'
  );
}

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase configuration error: missing anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_FALLBACK_ANON_KEY.'
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV !== 'production') {
  logger.warn(
    '[Supabase] SUPABASE_SERVICE_ROLE_KEY is not defined. Admin/API routes relying on the service role may fail.',
    { component: 'supabase-config', action: 'missing_service_role_key' }
  );
}

export const SUPABASE_USING_FALLBACK = shouldFallback;
