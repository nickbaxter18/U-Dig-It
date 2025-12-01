/**
 * Unified Secrets Loader
 *
 * Loads secrets from multiple sources with priority:
 * 1. Supabase Vault (vault.decrypted_secrets) - HIGHEST PRIORITY
 * 2. system_config table (for database-stored secrets)
 * 3. Environment variables (.env.local - fallback for local development)
 * 4. Hardcoded fallbacks (development only)
 *
 * Vault takes precedence to ensure centralized secret management in Supabase.
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

  // Priority 1: Supabase Vault (server-side only) - HIGHEST PRIORITY
  // This ensures vault secrets take precedence over potentially stale env vars
  // Use a direct client to avoid circular dependency (service client needs secrets loader)
  if (typeof window === 'undefined') {
    try {
      const { createClient } = await import('@supabase/supabase-js');

      // Get service role key directly from env to avoid circular dependency
      // (createServiceClient calls getSupabaseServiceRoleKey which calls getSecret)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

      // Hardcoded fallback for development (same as in service.ts)
      const fallbackServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2NjQ5OSwiZXhwIjoyMDc1MzQyNDk5fQ.ZkwAdRCdTL0DKGPgJtkbcBllkvachJqTdomV7IcGH3I';
      const fallbackUrl = 'https://bnimazxnqligusckahab.supabase.co';

      const finalServiceKey = serviceRoleKey || (process.env.NODE_ENV !== 'production' ? fallbackServiceRoleKey : null);
      const finalUrl = supabaseUrl || fallbackUrl;

      if (!finalServiceKey || !finalUrl) {
        logger.debug(`[Secrets] Cannot create vault client - missing credentials`, {
          component: 'secrets-loader',
          action: 'vault_client_missing_creds',
          metadata: { secretName, hasUrl: !!finalUrl, hasKey: !!finalServiceKey },
        });
        // Fall through to env var check
      }

      const supabase = finalServiceKey && finalUrl ? createClient(finalUrl, finalServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }) : null;

      if (!supabase) {
        logger.debug(`[Secrets] Service client not available for ${secretName}`, {
          component: 'secrets-loader',
          action: 'service_client_unavailable',
          metadata: { secretName },
        });
        // Fall through to next priority
      } else {
        // Try Supabase Vault first via the get_vault_secret function
        // This function is in public schema and reads from vault.decrypted_secrets
        const { data: vaultSecret, error: vaultError } = await supabase
          .rpc('get_vault_secret', { secret_name: secretName });

        if (vaultError) {
          logger.debug(`[Secrets] Vault query for ${secretName} failed`, {
            component: 'secrets-loader',
            action: 'vault_query_error',
            metadata: {
              secretName,
              error: vaultError.message,
              code: vaultError.code,
              hint: vaultError.hint,
            },
          });
        }

        if (!vaultError && vaultSecret) {
          const value = String(vaultSecret).trim();
          if (value.length > 0) {
            const result = {
              value: value,
              source: { source: 'supabase_secrets' as const, key: secretName },
            };
            if (logSource) {
              logger.info(`[Secrets] Loaded ${secretName} from Supabase Vault`, {
                component: 'secrets-loader',
                action: 'load_from_vault',
                metadata: { secretName },
              });
            }
            return result;
          }
        }

        // Priority 2: system_config table (fallback for non-vault secrets)
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

          // Strip quotes if JSON-encoded string (handles both regular and escaped quotes)
          if (value) {
            // Remove surrounding quotes (handles both "value" and \"value\")
            value = value.replace(/^["']|["']$/g, '');
            // Remove escaped quotes
            value = value.replace(/\\"/g, '"').replace(/\\'/g, "'");
            // Trim whitespace
            value = value.trim();
          }

          if (value && value.length > 0) {
            const result = {
              value: value,
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
      logger.debug(`[Secrets] Failed to load ${secretName} from database/vault`, {
        component: 'secrets-loader',
        action: 'database_load_failed',
        metadata: { secretName, error: err instanceof Error ? err.message : 'Unknown error' },
      });
    }
  }

  // Priority 3: Environment variables (.env.local) - FALLBACK if not in vault
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
        logger.info(`[Secrets] Loaded ${secretName} from environment variable (fallback)`, {
          component: 'secrets-loader',
          action: 'load_from_env',
          metadata: { secretName, envVar },
        });
      }
      return result;
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
