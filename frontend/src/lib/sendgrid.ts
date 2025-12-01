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

    // Validate API key format (should start with SG.)
    const trimmedKey = apiKey.trim();
    if (!trimmedKey.startsWith('SG.')) {
      logger.warn('SendGrid API key format may be invalid - should start with SG.', {
        component: 'sendgrid',
        action: 'api_key_format_warning',
        metadata: {
          keyPrefix: trimmedKey.substring(0, 10) + '...',
          keyLength: trimmedKey.length,
        },
      });
    }

    sgMail.setApiKey(trimmedKey);
    cachedApiKey = trimmedKey;
    apiKeyConfigured = true;

    logger.debug('SendGrid API key configured successfully', {
      component: 'sendgrid',
      action: 'api_key_configured',
      metadata: {
        keyPrefix: trimmedKey.substring(0, 10) + '...',
        keyLength: trimmedKey.length,
        startsWithSG: trimmedKey.startsWith('SG.'),
      },
    });
  } catch (error) {
    logger.error(
      'Failed to configure SendGrid API key',
      {
        component: 'sendgrid',
        action: 'api_key_configure_failed',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
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
  } catch (error: any) {
    // Extract detailed SendGrid error information
    const sendgridError = {
      message: error?.message || 'Unknown error',
      code: error?.code,
      response: error?.response?.body || error?.response,
      errors: error?.response?.body?.errors || error?.response?.errors,
      statusCode: error?.response?.statusCode || error?.statusCode,
    };

    logger.error(
      'Failed to send admin email via SendGrid',
      {
        component: 'sendgrid',
        action: 'send_error',
        metadata: {
          to: payload.to,
          subject: payload.subject,
          sendgridErrorCode: sendgridError.code,
          sendgridStatusCode: sendgridError.statusCode,
          sendgridMessage: sendgridError.message,
          sendgridErrors: sendgridError.errors,
          // Log API key prefix for debugging (first 10 chars only)
          apiKeyConfigured: apiKeyConfigured,
          apiKeyPrefix: cachedApiKey ? cachedApiKey.substring(0, 10) + '...' : 'not cached',
        },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    // Create a more detailed error message
    let errorMessage = 'Failed to send email via SendGrid';
    if (sendgridError.statusCode === 401) {
      errorMessage = 'SendGrid API key is invalid or expired. Please check your EMAIL_API_KEY configuration.';
    } else if (sendgridError.errors && Array.isArray(sendgridError.errors) && sendgridError.errors.length > 0) {
      const firstError = sendgridError.errors[0];
      errorMessage = firstError.message || errorMessage;

      // Check for quota/credit limit errors
      if (firstError.message && (
        firstError.message.includes('Maximum credits exceeded') ||
        firstError.message.includes('quota') ||
        firstError.message.includes('limit')
      )) {
        errorMessage = `SendGrid quota exceeded: ${firstError.message}. Your SendGrid account has reached its monthly email sending limit. Please upgrade your plan or wait for the quota to reset.`;
      }
    } else if (sendgridError.message) {
      errorMessage = sendgridError.message;

      // Check for quota/credit limit in general message
      if (sendgridError.message.includes('Maximum credits exceeded') ||
          sendgridError.message.includes('quota') ||
          sendgridError.message.includes('limit')) {
        errorMessage = `SendGrid quota exceeded: ${sendgridError.message}. Your SendGrid account has reached its monthly email sending limit.`;
      }
    }

    const detailedError = new Error(errorMessage);
    (detailedError as any).code = sendgridError.code;
    (detailedError as any).statusCode = sendgridError.statusCode;
    (detailedError as any).sendgridErrors = sendgridError.errors;

    throw detailedError;
  }
}
