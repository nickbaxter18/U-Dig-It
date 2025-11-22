import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { insuranceReminderSchema } from '@/lib/validators/admin/support';

export const POST = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      const payload = insuranceReminderSchema.parse(await request.json());

      const reminder = {
        insurance_document_id: params.id,
        reminder_type: payload.reminderType,
        status: 'pending',
        scheduled_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from('insurance_reminders').insert(reminder);

      if (insertError) {
        logger.error(
          'Failed to schedule insurance reminder',
          {
            component: 'admin-insurance-reminder',
            action: 'reminder_failed',
            metadata: { insuranceId: params.id },
          },
          insertError
        );
        return NextResponse.json({ error: 'Unable to schedule reminder' }, { status: 500 });
      }

      await supabase.from('insurance_activity').insert({
        insurance_document_id: params.id,
        action: 'reminder_sent',
        actor_id: user?.id || 'unknown',
        details: { reminderType: payload.reminderType },
      });

      logger.info('Insurance reminder queued', {
        component: 'admin-insurance-reminder',
        action: 'reminder_queued',
        metadata: { insuranceId: params.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error scheduling insurance reminder',
        {
          component: 'admin-insurance-reminder',
          action: 'reminder_unexpected',
          metadata: { insuranceId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
