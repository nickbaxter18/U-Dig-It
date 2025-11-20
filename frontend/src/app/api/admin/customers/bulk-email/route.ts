import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const bulkEmailSchema = z.object({
  customerIds: z.array(z.string().uuid()).min(1),
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
    const { customerIds, subject, message, emailType } = payload;

    // Fetch customers with emails
    const { data: customers, error: fetchError } = await supabase
      .from('users')
      .select('id, firstName, lastName, email')
      .in('id', customerIds)
      .not('role', 'in', '("admin","super_admin")');

    if (fetchError) {
      throw fetchError;
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: 'No customers found' }, { status: 404 });
    }

    // Send emails via SendGrid API
    const emailResults = await Promise.allSettled(
      customers.map(async (customer: unknown) => {
        if (!customer.email) {
          return { customerId: customer.id, success: false, error: 'No email address' };
        }

        try {
          const emailResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/communications/send-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: customer.email,
                subject: subject.replace(
                  '{{customerName}}',
                  `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                ),
                html: message
                  .replace(
                    '{{customerName}}',
                    `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                  )
                  .replace('{{customerEmail}}', customer.email),
                emailType,
              }),
            }
          );

          if (!emailResponse.ok) {
            throw new Error('Email send failed');
          }

          return { customerId: customer.id, success: true };
        } catch (emailError) {
          logger.error(
            'Failed to send bulk email',
            {
              component: 'admin-customers-bulk-email',
              action: 'email_send_error',
              metadata: { customerId: customer.id, customerEmail: customer.email },
            },
            emailError instanceof Error ? emailError : new Error(String(emailError))
          );
          return { customerId: customer.id, success: false, error: 'Email send failed' };
        }
      })
    );

    const successful = emailResults.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = emailResults.length - successful;

    logger.info('Bulk customer email completed', {
      component: 'admin-customers-bulk-email',
      action: 'bulk_email_sent',
      metadata: { adminId: user?.id || 'unknown', total: customers.length, successful, failed },
    });

    return NextResponse.json({
      success: true,
      total: customers.length,
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
      'Failed to perform customer bulk email',
      { component: 'admin-customers-bulk-email', action: 'error' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Failed to perform bulk email' }, { status: 500 });
  }
}
