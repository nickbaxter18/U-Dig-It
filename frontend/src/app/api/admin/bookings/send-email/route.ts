import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { sendAdminEmail } from '@/lib/sendgrid';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    

    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    // ✅ Parse request body
    const body = await request.json();
    const { bookingId, recipientEmail, recipientName, subject, message, templateId } = body;

    if (!bookingId || !recipientEmail || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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
      logger.error('Failed to log email', {
        component: 'send-email-api',
        action: 'log_email_error',
        metadata: { bookingId, recipientEmail, error: logError.message },
      }, logError);
      // Continue anyway - email logging failure shouldn't prevent email send
    }

    // ✅ Initialize SendGrid with API key
    const sendgridApiKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || 'NickBaxter@udigit.ca';
    const emailFromName = process.env.EMAIL_FROM_NAME || 'U-Dig It Rentals';

    if (!sendgridApiKey) {
      logger.error('SendGrid API key not configured', {
        component: 'send-email-api',
        action: 'missing_api_key',
      });
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
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
    } catch (sendError: any) {
      // ✅ Handle SendGrid errors
      logger.error('SendGrid email send failed', {
        component: 'send-email-api',
        action: 'sendgrid_error',
        metadata: {
          bookingId,
          recipientEmail,
          error: sendError.message,
          code: sendError.code,
        },
      }, sendError);

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
  } catch (error) {
    logger.error('Failed to send email', {
      component: 'send-email-api',
      action: 'send_email_error',
    }, error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

