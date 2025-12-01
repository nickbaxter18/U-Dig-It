import { z } from 'zod';
import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { sendAdminEmail } from '@/lib/sendgrid';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const sendEmailSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format'),
  recipientEmail: z.string().email('Invalid recipient email format'),
  recipientName: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(10000),
  templateId: z.string().uuid('Invalid template ID format').optional(),
});

export const POST = withRateLimit(RateLimitPresets.STRICT, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { user } = adminResult;

    // ✅ Parse and validate request body
    const body = await request.json();
    const validated = sendEmailSchema.parse(body);
    const { bookingId, recipientEmail, recipientName, subject, message, templateId } = validated;

    // ✅ Get booking to verify it exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, bookingNumber')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // ✅ Log email in database
    const { data: emailLog, error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          bookingId,
          bookingNumber: booking.bookingNumber,
          templateId,
          sentBy: user?.id || 'unknown',
          sentByEmail: user?.email || 'unknown',
        },
      })
      .select()
      .single();

    if (logError) {
      logger.error(
        'Failed to log email',
        {
          component: 'send-email-api',
          action: 'log_email_error',
          metadata: { bookingId, recipientEmail, error: logError.message },
        },
        logError
      );
      // Continue anyway - email logging failure shouldn't prevent email send
    }

    // ✅ Initialize SendGrid with API key and load email config from Supabase Vault
    const { getSendGridApiKey, getEmailFromAddress, getEmailFromName } = await import('@/lib/secrets/email');
    const sendgridApiKey = await getSendGridApiKey();

    let emailFrom: string;
    let emailFromName: string;
    try {
      emailFrom = await getEmailFromAddress();
      emailFromName = await getEmailFromName();
    } catch (emailConfigError) {
      logger.error('EMAIL_FROM not configured', {
        component: 'send-email-api',
        action: 'email_from_missing',
        metadata: { bookingId, error: emailConfigError instanceof Error ? emailConfigError.message : String(emailConfigError) },
      });
      return NextResponse.json({
        error: 'Email sender not configured. Set EMAIL_FROM in Supabase Vault or environment variables.',
        details: 'Visit https://app.sendgrid.com/settings/sender_auth to verify a sender.',
      }, { status: 500 });
    }

    // ✅ Get template HTML if templateId provided
    let emailHtml = message;
    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('html_content, text_content')
        .eq('id', templateId)
        .single();

      if (!templateError && template) {
        // Use HTML template with variable replacement
        emailHtml = (template.html_content || template.text_content || message)
          .replace(/\{\{bookingNumber\}\}/g, booking.bookingNumber)
          .replace(/\{\{customerName\}\}/g, recipientName)
          .replace(/\{\{customerEmail\}\}/g, recipientEmail);
      }
    }

    // ✅ Send email via SendGrid
    try {
      await sendAdminEmail({
        to: recipientEmail,
        from: {
          email: emailFrom,
          name: emailFromName,
        },
        subject,
        text: message, // Plain text version
        html: emailHtml, // HTML version (from template or plain)
      });

      logger.info('Email sent successfully via SendGrid', {
        component: 'send-email-api',
        action: 'email_sent',
        metadata: {
          bookingId,
          bookingNumber: booking.bookingNumber,
          recipientEmail,
          subject,
          templateId,
          emailLogId: emailLog?.id,
        },
      });

      // ✅ Update email log status to delivered
      if (emailLog?.id) {
        await supabase
          .from('email_logs')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString(),
          })
          .eq('id', emailLog.id);
      }

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        emailLogId: emailLog?.id,
      });
    } catch (sendError: unknown) {
      // ✅ Handle SendGrid errors
      logger.error(
        'SendGrid email send failed',
        {
          component: 'send-email-api',
          action: 'sendgrid_error',
          metadata: {
            bookingId,
            recipientEmail,
            error: sendError.message,
            code: sendError.code,
          },
        },
        sendError
      );

      // ✅ Update email log status to failed
      if (emailLog?.id) {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            error_message: sendError.message,
          })
          .eq('id', emailLog.id);
      }

      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: sendError.message,
        },
        { status: 500 }
      );
    }
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Failed to send email',
      {
        component: 'send-email-api',
        action: 'send_email_error',
      },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
});
