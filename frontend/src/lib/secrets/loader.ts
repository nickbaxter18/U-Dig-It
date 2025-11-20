/**
 * Unified Secrets Loader
 *
 * Loads secrets from multiple sources with priority:
 * 1. Supabase Edge Function secrets (process.env - when running in Supabase environment)
 * 2. Environment variables (.env.local - for local development)
 * 3. system_config table (for database-stored secrets)
 * 4. Hardcoded fallbacks (development only)
 *
 * This eliminates the need for .env.local files and centralizes secret management.
 */
import { logger } from '@/lib/logger';

export interface SecretSource {
  source: 'supabase_secrets' | 'env_file' | 'database' | 'hardcoded_fallback';
  key: string;
}

/**
 * Get a secret value from multiple sources
 *
 * @param secretName - Name of the secret (e.g., 'SUPABASE_SERVICE_ROLE_KEY')
 * @param options - Configuration options
 * @returns The secret value and its source, or null if not found
 */
export async function getSecret(
  secretName: string,
  options: {
    /** Fallback value for development (only used if NODE_ENV !== 'production') */
    fallback?: string;
    /** Whether to throw error if secret not found (default: false in dev, true in prod) */
    required?: boolean;
    /** Whether to log the source of the secret */
    logSource?: boolean;
  } = {}
): Promise<{ value: string; source: SecretSource } | null> {
  const { fallback, required, logSource = true } = options;
  const isProduction = process.env.NODE_ENV === 'production';

  // Priority 1: Supabase Edge Function secrets
  // These are injected as environment variables when running in Supabase environment
  const supabaseSecret = process.env[secretName]?.trim();
  if (supabaseSecret) {
    const result = {
      value: supabaseSecret,
      source: { source: 'supabase_secrets' as const, key: secretName },
    };
    if (logSource) {
      logger.info(`[Secrets] Loaded ${secretName} from Supabase Edge Function secrets`, {
        component: 'secrets-loader',
        action: 'load_from_supabase',
        metadata: { secretName },
      });
    }
    return result;
  }

  // Priority 2: Environment variables (.env.local)
  // Check both the exact name and common variations
  const envVariations = [
    secretName,
    `NEXT_PUBLIC_${secretName}`,
    secretName.replace('_TEST_KEY', '_KEY'),
  ];

  for (const envVar of envVariations) {
    const envValue = process.env[envVar]?.trim();
    if (envValue) {
      const result = {
        value: envValue,
        source: { source: 'env_file' as const, key: envVar },
      };
      if (logSource) {
        logger.info(`[Secrets] Loaded ${secretName} from environment variable`, {
          component: 'secrets-loader',
          action: 'load_from_env',
          metadata: { secretName, envVar },
        });
      }
      return result;
    }
  }

  // Priority 3: system_config table (server-side only)
  if (typeof window === 'undefined') {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = await import('@/lib/supabase/config');

      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data, error } = await supabase
          .from('system_config')
          .select('value')
          .eq('key', secretName)
          .single();

        if (!error && data?.value) {
          let value: string | null = null;

          // Handle JSONB value field - can be string or object
          if (typeof data.value === 'string') {
            value = data.value;
          } else if (typeof data.value === 'object' && data.value !== null) {
            // If it's a JSON object, try to extract the value
            if ('value' in data.value && typeof data.value.value === 'string') {
              value = data.value.value;
            } else {
              // Otherwise stringify it
              value = JSON.stringify(data.value);
            }
          }

          // Strip quotes if JSON-encoded string
          if (value && value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }

          if (value && value.trim()) {
            const result = {
              value: value.trim(),
              source: { source: 'database' as const, key: secretName },
            };
            if (logSource) {
              logger.info(`[Secrets] Loaded ${secretName} from system_config table`, {
                component: 'secrets-loader',
                action: 'load_from_database',
                metadata: { secretName },
              });
            }
            return result;
          }
        }
      }
    } catch (err) {
      logger.debug(`[Secrets] Failed to load ${secretName} from database`, {
        component: 'secrets-loader',
        action: 'database_load_failed',
        metadata: { secretName, error: err instanceof Error ? err.message : 'Unknown error' },
      });
    }
  }

  // Priority 4: Hardcoded fallback (development only)
  if (!isProduction && fallback) {
    const result = {
      value: fallback,
      source: { source: 'hardcoded_fallback' as const, key: secretName },
    };
    if (logSource) {
      logger.warn(`[Secrets] Using hardcoded fallback for ${secretName}`, {
        component: 'secrets-loader',
        action: 'use_fallback',
        metadata: { secretName },
      });
    }
    return result;
  }

  // Secret not found
  if (required !== false && (isProduction || required === true)) {
    throw new Error(
      `${secretName} is not configured. Set it via Supabase Edge Function secrets, .env.local, or system_config table.`
    );
  }

  return null;
}

/**
 * Get a secret value (returns just the string, not the source)
 */
export async function getSecretValue(
  secretName: string,
  options?: Parameters<typeof getSecret>[1]
): Promise<string | null> {
  const result = await getSecret(secretName, options);
  return result?.value ?? null;
}

/**
 * Batch load multiple secrets
 */
export async function getSecrets(
  secretNames: string[],
  options?: Parameters<typeof getSecret>[1]
): Promise<Record<string, { value: string; source: SecretSource } | null>> {
  const results: Record<string, { value: string; source: SecretSource } | null> = {};

  await Promise.all(
    secretNames.map(async (name) => {
      results[name] = await getSecret(name, { ...options, logSource: false });
    })
  );

  // Log summary
  const sources = Object.values(results)
    .filter((r): r is { value: string; source: SecretSource } => r !== null)
    .map((r) => r.source.source);

  const sourceCounts = sources.reduce(
    (acc, source) => {
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  logger.info('[Secrets] Batch loaded secrets', {
    component: 'secrets-loader',
    action: 'batch_load',
    metadata: {
      total: secretNames.length,
      found: Object.values(results).filter((r) => r !== null).length,
      sources: sourceCounts,
    },
  });

  return results;
}
