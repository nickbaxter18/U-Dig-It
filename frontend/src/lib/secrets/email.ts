/**
 * Email Secrets Loader
 *
 * Loads SendGrid API key from multiple sources:
 * 1. Supabase Edge Function secrets (process.env.EMAIL_API_KEY - when available)
 * 2. Environment variables (.env.local - for local development)
 * 3. system_config table (for database-stored secrets)
 */
import { logger } from '@/lib/logger';

import { getSecret } from './loader';

/**
 * Get SendGrid API key from Supabase secrets or environment
 * Priority: EMAIL_API_KEY (Supabase secrets) > SENDGRID_API_KEY (legacy env var) > system_config table
 */
export async function getSendGridApiKey(): Promise<string> {
  // Priority 1: Supabase Edge Function secrets (EMAIL_API_KEY)
  const emailApiKey = process.env.EMAIL_API_KEY?.trim();
  if (emailApiKey) {
    return emailApiKey;
  }

  // Priority 2: Legacy environment variable (SENDGRID_API_KEY)
  const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim();
  if (sendgridApiKey) {
    return sendgridApiKey;
  }

  // Priority 3: Unified secrets loader (checks system_config table)
  const secretResult = await getSecret('EMAIL_API_KEY', {
    required: false,
    logSource: false,
  });

  if (secretResult?.value) {
    return secretResult.value;
  }

  // No key found
  const error = new Error(
    'SendGrid API key not configured. Set EMAIL_API_KEY in Supabase Edge Function secrets, .env.local, or system_config table.'
  );
  logger.error(
    'SendGrid API key not found',
    {
      component: 'email-secrets',
      action: 'key_not_found',
      metadata: {
        checked: ['EMAIL_API_KEY', 'SENDGRID_API_KEY', 'system_config'],
      },
    },
    error
  );
  throw error;
}
