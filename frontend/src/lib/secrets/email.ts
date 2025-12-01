/**
 * Email Secrets Loader
 *
 * Loads email configuration from multiple sources:
 * 1. Supabase Vault (via decrypted_secrets view)
 * 2. Environment variables (.env.local)
 * 3. system_config table
 *
 * Secrets managed:
 * - EMAIL_API_KEY: SendGrid API key
 * - EMAIL_FROM: Sender email address (must be verified in SendGrid)
 * - EMAIL_FROM_NAME: Sender display name
 */
import { logger } from '@/lib/logger';

import { getSecret } from './loader';

// Cache for email config to avoid repeated database calls
let cachedEmailFrom: string | null = null;
let cachedEmailFromName: string | null = null;

/**
 * Get SendGrid API key from Supabase Vault/Edge Function secrets or environment
 * Priority:
 * 1. Supabase Edge Function secrets (EMAIL_API_KEY) via unified loader
 * 2. Legacy environment variable (SENDGRID_API_KEY - for backward compatibility)
 * 3. system_config table (via unified loader)
 */
export async function getSendGridApiKey(): Promise<string> {
  // Priority 1: Use unified secrets loader for EMAIL_API_KEY
  // This checks: Supabase Edge Function secrets > env vars > system_config table
  try {
    const secretResult = await getSecret('EMAIL_API_KEY', {
      required: false,
      logSource: true, // Log which source was used
    });

    if (secretResult?.value) {
      logger.info('[Email Secrets] Using EMAIL_API_KEY from secrets system', {
        component: 'email-secrets',
        action: 'key_loaded',
        metadata: {
          source: secretResult.source.source,
          key: secretResult.source.key,
        },
      });
      return secretResult.value;
    }
  } catch (error) {
    logger.warn('[Email Secrets] Failed to load EMAIL_API_KEY from secrets system', {
      component: 'email-secrets',
      action: 'secrets_load_warning',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    // Continue to try legacy env var
  }

  // Priority 2: Legacy environment variable (SENDGRID_API_KEY) - for backward compatibility
  const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim();
  if (sendgridApiKey) {
    logger.info('[Email Secrets] Using legacy SENDGRID_API_KEY environment variable', {
      component: 'email-secrets',
      action: 'legacy_env_used',
      metadata: {
        source: 'env_file',
      },
    });
    return sendgridApiKey;
  }

  // Priority 3: Direct check of process.env.EMAIL_API_KEY (in case it's set directly in deployment env)
  const emailApiKey = process.env.EMAIL_API_KEY?.trim();
  if (emailApiKey) {
    logger.info('[Email Secrets] Using EMAIL_API_KEY from process.env (direct)', {
      component: 'email-secrets',
      action: 'direct_env_used',
      metadata: {
        source: 'process.env',
      },
    });
    return emailApiKey;
  }

  // No key found
  const error = new Error(
    'SendGrid API key not configured. Set EMAIL_API_KEY in Supabase Vault, .env.local, or system_config table.'
  );
  logger.error(
    'SendGrid API key not found',
    {
      component: 'email-secrets',
      action: 'key_not_found',
      metadata: {
        checked: ['EMAIL_API_KEY (secrets loader)', 'SENDGRID_API_KEY (legacy)', 'EMAIL_API_KEY (direct env)', 'system_config'],
        hint: 'Set EMAIL_API_KEY in Supabase Vault or as environment variable in your deployment platform',
      },
    },
    error
  );
  throw error;
}

/**
 * Get the sender email address (EMAIL_FROM)
 * This must be a verified SendGrid Sender Identity.
 *
 * Priority:
 * 1. Supabase Vault (EMAIL_FROM)
 * 2. Environment variable (EMAIL_FROM)
 * 3. system_config table
 */
export async function getEmailFromAddress(): Promise<string> {
  // Return cached value if available
  if (cachedEmailFrom) {
    return cachedEmailFrom;
  }

  try {
    const secretResult = await getSecret('EMAIL_FROM', {
      required: false,
      logSource: true,
    });

    if (secretResult?.value) {
      cachedEmailFrom = secretResult.value;
      logger.info('[Email Secrets] Loaded EMAIL_FROM from secrets system', {
        component: 'email-secrets',
        action: 'email_from_loaded',
        metadata: {
          source: secretResult.source.source,
          // Don't log the actual email for privacy
        },
      });
      return secretResult.value;
    }
  } catch (error) {
    logger.warn('[Email Secrets] Failed to load EMAIL_FROM from secrets system', {
      component: 'email-secrets',
      action: 'email_from_load_warning',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }

  // Fallback: Direct process.env check
  const envEmailFrom = process.env.EMAIL_FROM?.trim();
  if (envEmailFrom) {
    cachedEmailFrom = envEmailFrom;
    return envEmailFrom;
  }

  // No EMAIL_FROM found - throw error with helpful message
  const error = new Error(
    'EMAIL_FROM not configured. This must be set to a verified SendGrid Sender Identity. ' +
    'Set it in Supabase Vault, .env.local, or system_config table. ' +
    'Visit https://app.sendgrid.com/settings/sender_auth to verify a sender.'
  );
  logger.error(
    'EMAIL_FROM not found',
    {
      component: 'email-secrets',
      action: 'email_from_not_found',
      metadata: {
        checked: ['Supabase Vault', 'process.env.EMAIL_FROM', 'system_config'],
        hint: 'Add EMAIL_FROM to Supabase Vault with your verified SendGrid sender email',
      },
    },
    error
  );
  throw error;
}

/**
 * Get the sender display name (EMAIL_FROM_NAME)
 *
 * Priority:
 * 1. Supabase Vault (EMAIL_FROM_NAME)
 * 2. Environment variable (EMAIL_FROM_NAME)
 * 3. Default: 'U-Dig It Rentals'
 */
export async function getEmailFromName(): Promise<string> {
  // Return cached value if available
  if (cachedEmailFromName) {
    return cachedEmailFromName;
  }

  try {
    const secretResult = await getSecret('EMAIL_FROM_NAME', {
      required: false,
      logSource: false, // Less verbose for non-sensitive config
    });

    if (secretResult?.value) {
      cachedEmailFromName = secretResult.value;
      return secretResult.value;
    }
  } catch {
    // Non-critical, fall through to defaults
  }

  // Fallback: Direct process.env check
  const envEmailFromName = process.env.EMAIL_FROM_NAME?.trim();
  if (envEmailFromName) {
    cachedEmailFromName = envEmailFromName;
    return envEmailFromName;
  }

  // Default value
  cachedEmailFromName = 'U-Dig It Rentals';
  return cachedEmailFromName;
}

/**
 * Clear cached email config (useful for testing or config refresh)
 */
export function clearEmailConfigCache(): void {
  cachedEmailFrom = null;
  cachedEmailFromName = null;
}
