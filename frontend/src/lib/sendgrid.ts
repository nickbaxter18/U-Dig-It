import sgMail from '@sendgrid/mail';

import { logger } from './logger';
import { getSendGridApiKey } from './secrets/email';

interface SendAdminEmailPayload {
  to: string;
  from: {
    email: string;
    name?: string;
  };
  subject: string;
  text?: string;
  html?: string;
}

let apiKeyConfigured = false;
let cachedApiKey: string | null = null;

async function ensureApiKeyConfigured() {
  if (apiKeyConfigured && cachedApiKey) return;

  try {
    // Use the proper secrets loader that checks Supabase Edge Functions and system_config
    const apiKey = await getSendGridApiKey();

    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error(
        'SendGrid API key is empty. Please set a valid EMAIL_API_KEY in Supabase Edge Function secrets, .env.local, or system_config table.'
      );
    }

    sgMail.setApiKey(apiKey);
    cachedApiKey = apiKey;
    apiKeyConfigured = true;
  } catch (error) {
    logger.error(
      'Failed to configure SendGrid API key',
      {
        component: 'sendgrid',
        action: 'api_key_configure_failed',
      },
      error as Error
    );
    throw error;
  }
}

export async function sendAdminEmail(payload: SendAdminEmailPayload) {
  await ensureApiKeyConfigured();

  try {
    await sgMail.send(payload as any);
  } catch (error) {
    logger.error(
      'Failed to send admin email via SendGrid',
      {
        component: 'sendgrid',
        action: 'send_error',
        metadata: {
          to: payload.to,
          subject: payload.subject,
        },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    throw error;
  }
}
