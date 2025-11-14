import sgMail from '@sendgrid/mail';

import { logger } from './logger';

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

function ensureApiKeyConfigured() {
  if (apiKeyConfigured) return;

  const apiKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY;
  if (!apiKey) {
    throw new Error('SendGrid API key not configured');
  }

  sgMail.setApiKey(apiKey);
  apiKeyConfigured = true;
}

export async function sendAdminEmail(payload: SendAdminEmailPayload) {
  ensureApiKeyConfigured();

  try {
    await sgMail.send(payload);
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


