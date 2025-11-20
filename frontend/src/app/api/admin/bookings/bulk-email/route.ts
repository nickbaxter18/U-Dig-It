import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const bulkEmailSchema = z.object({
  bookingIds: z.array(z.string().uuid()).min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
  emailType: z.enum(['confirmation', 'reminder', 'custom']).default('custom'),
});

export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const payload = bulkEmailSchema.parse(await request.json());
    const { bookingIds, subject, message, emailType } = payload;

    // Fetch bookings with customer emails
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        bookingNumber,
        customer:customerId (
          id,
          firstName,
          lastName,
          email
        )
      `
      )
      .in('id', bookingIds);

    if (fetchError) {
      throw fetchError;
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ error: 'No bookings found' }, { status: 404 });
    }

    // Send emails via SendGrid API
    const emailResults = await Promise.allSettled(
      bookings.map(async (booking: unknown) => {
        if (!booking.customer?.email) {
          return { bookingId: booking.id, success: false, error: 'No email address' };
        }

        try {
          const emailResponse = await fetch('/api/admin/communications/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: booking.customer.email,
              subject: subject.replace('{{bookingNumber}}', booking.bookingNumber || ''),
              html: message
                .replace(
                  '{{customerName}}',
                  `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim()
                )
                .replace('{{bookingNumber}}', booking.bookingNumber || ''),
              emailType,
            }),
          });

          if (!emailResponse.ok) {
            throw new Error('Email send failed');
          }

          return { bookingId: booking.id, success: true };
        } catch (emailError) {
          logger.error(
            'Failed to send bulk email',
            {
              component: 'admin-bookings-bulk-email',
              action: 'email_send_error',
              metadata: { bookingId: booking.id, customerEmail: booking.customer.email },
            },
            emailError instanceof Error ? emailError : new Error(String(emailError))
          );
          return { bookingId: booking.id, success: false, error: 'Email send failed' };
        }
      })
    );

    const successful = emailResults.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = emailResults.length - successful;

    logger.info('Bulk booking email completed', {
      component: 'admin-bookings-bulk-email',
      action: 'bulk_email_sent',
      metadata: { adminId: user?.id || 'unknown', total: bookings.length, successful, failed },
    });

    return NextResponse.json({
      success: true,
      total: bookings.length,
      successful,
      failed,
      results: emailResults.map((r) =>
        r.status === 'fulfilled' ? r.value : { success: false, error: 'Unknown error' }
      ),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Failed to perform booking bulk email',
      { component: 'admin-bookings-bulk-email', action: 'error' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Failed to perform bulk email' }, { status: 500 });
  }
}
