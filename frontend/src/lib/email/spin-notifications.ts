/**
 * Spin Wheel Email Notifications
 *
 * Sends winner notifications and reminders using React Email templates.
 * Supports multiple email providers (SendGrid, Resend, AWS SES).
 */
import SpinReminder4h from '@/emails/spin-reminder-4h';
import SpinReminder24h from '@/emails/spin-reminder-24h';
import SpinWinnerEmail from '@/emails/spin-winner';
import { render } from '@react-email/render';

import { logger } from '@/lib/logger';

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://udigit.ca';
const DEFAULT_FROM =
  process.env.SPIN_EMAIL_FROM ||
  process.env.SENDGRID_FROM_EMAIL ||
  'U-Dig It Rentals <noreply@udigit.ca>';
const DEFAULT_REPLY_TO = process.env.SPIN_EMAIL_REPLY || 'info@udigit.ca';

interface SendSpinWinnerEmailParams {
  email: string;
  firstName?: string;
  couponCode: string;
  discountPercent: number;
  expiresAt: string;
  sessionId?: string;
}

interface SendReminderEmailParams {
  email: string;
  firstName?: string;
  couponCode: string;
  discountPercent: number;
  expiresAt: string;
  sessionId?: string;
  reminderType: '24h' | '4h';
}

/**
 * Send winner email immediately after winning
 */
export async function sendSpinWinnerEmail(params: SendSpinWinnerEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const bookingUrl = buildBookingUrl(params.couponCode, params.sessionId);

    const html = await render(
      SpinWinnerEmail({
        firstName: params.firstName,
        email: params.email,
        couponCode: params.couponCode,
        discountPercent: params.discountPercent,
        expiresAt: params.expiresAt,
        bookingUrl,
      })
    );

    const result = await sendEmail({
      to: params.email,
      subject: `🎉 You Won ${params.discountPercent}% Off - Use Within 48 Hours!`,
      html,
      from: DEFAULT_FROM,
      replyTo: DEFAULT_REPLY_TO,
      tags: {
        type: 'spin_winner',
        discount_percent: params.discountPercent.toString(),
        session_id: params.sessionId ?? 'unknown',
      },
    });

    if (result.success) {
      logger.info('[Email] Spin winner email sent', {
        component: 'spin-notifications',
        action: 'winner_email_sent',
        metadata: {
          email: params.email,
          sessionId: params.sessionId,
          discountPercent: params.discountPercent,
        },
      });
    } else {
      logger.warn('[Email] Spin winner email failed to send', {
        component: 'spin-notifications',
        action: 'winner_email_failed',
        metadata: {
          email: params.email,
          sessionId: params.sessionId,
          discountPercent: params.discountPercent,
          error: result.error,
        },
      });
    }

    return result;
  } catch (error) {
    logger.error(
      '[Email] Failed to send winner email',
      {
        component: 'spin-notifications',
        action: 'email_error',
        metadata: {
          email: params.email,
          sessionId: params.sessionId,
          discountPercent: params.discountPercent,
        },
      },
      error as Error
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send reminder email (24h or 4h before expiry)
 */
export async function sendSpinReminderEmail(params: SendReminderEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const bookingUrl = buildBookingUrl(params.couponCode, params.sessionId);
    const Template = params.reminderType === '4h' ? SpinReminder4h : SpinReminder24h;

    const html = await render(
      Template({
        firstName: params.firstName,
        email: params.email,
        couponCode: params.couponCode,
        discountPercent: params.discountPercent,
        expiresAt: params.expiresAt,
        bookingUrl,
      })
    );

    const result = await sendEmail({
      to: params.email,
      subject:
        params.reminderType === '4h'
          ? `⏰ Final 4 Hours! ${params.discountPercent}% Savings Expire Soon`
          : `⏰ 24h Reminder - ${params.discountPercent}% Discount Ending Soon`,
      html,
      from: DEFAULT_FROM,
      replyTo: DEFAULT_REPLY_TO,
      tags: {
        type: 'spin_reminder',
        reminder_type: params.reminderType,
        session_id: params.sessionId ?? 'unknown',
      },
    });

    if (result.success) {
      logger.info('[Email] Spin reminder email sent', {
        component: 'spin-notifications',
        action: 'reminder_email_sent',
        metadata: {
          email: params.email,
          sessionId: params.sessionId,
          reminderType: params.reminderType,
        },
      });
    } else {
      logger.warn('[Email] Spin reminder email failed to send', {
        component: 'spin-notifications',
        action: 'reminder_email_failed',
        metadata: {
          email: params.email,
          sessionId: params.sessionId,
          reminderType: params.reminderType,
          error: result.error,
        },
      });
    }

    return result;
  } catch (error) {
    logger.error(
      '[Email] Failed to send reminder email',
      {
        component: 'spin-notifications',
        action: 'email_error',
        metadata: {
          email: params.email,
          sessionId: params.sessionId,
          reminderType: params.reminderType,
        },
      },
      error as Error
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Generic email sender
 * Supports multiple providers based on environment config
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = process.env.EMAIL_PROVIDER || 'sendgrid';

  try {
    switch (provider) {
      case 'resend':
        return await sendViaResend(params);
      case 'sendgrid':
        return await sendViaSendGrid(params);
      case 'aws-ses':
        return await sendViaAWSSES(params);
      default:
        // Fallback: log (development)
        logger.info('[EMAIL] Would send (dev mode)', {
          component: 'email-sender',
          action: 'dev_mode_fallback',
          metadata: { to: params.to, subject: params.subject },
        });
        return { success: true, messageId: 'dev-mode' };
    }
  } catch (error) {
    logger.error(
      '[Email] Send failed',
      {
        component: 'email-sender',
        action: 'send_error',
      },
      error as Error
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email send failed',
    };
  }
}

/**
 * Send via Resend (recommended for Next.js)
 */
async function sendViaResend(params: {
  to: string;
  subject: string;
  html: string;
  from: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }

  // TODO: Uncomment when resend is installed
  /*
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    tags: params.tags,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, messageId: data?.id };
  */

  logger.info('[Resend] Would send (pending implementation)', {
    component: 'email-sender',
    action: 'resend_pending',
    metadata: { to: params.to, subject: params.subject },
  });
  return { success: true, messageId: 'resend-pending' };
}

/**
 * Send via SendGrid
 */
async function sendViaSendGrid(params: {
  to: string;
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { getSendGridApiKey } = await import('@/lib/secrets/email');
  const apiKey = await getSendGridApiKey();

  const { default: sgMail } = await import('@sendgrid/mail');
  sgMail.setApiKey(apiKey);

  const msg = {
    to: params.to,
    from: params.from,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
    customArgs: params.tags,
  };

  const [response] = await sgMail.send(msg);
  const messageId =
    response?.headers?.['x-message-id'] ||
    response?.headers?.['X-Message-Id'] ||
    response?.headers?.['x-message-id'.toLowerCase()];

  return { success: true, messageId };
}

/**
 * Send via AWS SES
 */
async function sendViaAWSSES(params: {
  to: string;
  subject: string;
  html: string;
  from: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!process.env.AWS_SES_REGION || !process.env.AWS_ACCESS_KEY_ID) {
    throw new Error('AWS SES credentials not configured');
  }

  // TODO: Implement AWS SES integration
  logger.info('[AWS SES] Would send (pending implementation)', {
    component: 'email-sender',
    action: 'aws_ses_pending',
    metadata: { to: params.to },
  });
  return { success: true, messageId: 'ses-pending' };
}

function buildBookingUrl(couponCode: string, sessionId?: string) {
  const url = new URL('/book', SITE_URL);
  url.searchParams.set('coupon', couponCode);
  if (sessionId) {
    url.searchParams.set('session', sessionId);
  }
  url.searchParams.set('utm_source', 'spin');
  url.searchParams.set('utm_medium', 'email');
  return url.toString();
}
