import { ZodError } from 'zod';
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const notificationRuleUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  ruleType: z
    .enum([
      'booking_deposit_due',
      'booking_pickup_reminder',
      'booking_return_reminder',
      'booking_confirmation',
      'maintenance_due',
      'maintenance_overdue',
      'payment_due',
      'payment_overdue',
      'insurance_expiring',
      'contract_pending_signature',
      'equipment_available',
      'custom',
    ])
    .optional(),
  triggerConditions: z.record(z.string(), z.unknown()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'inapp'])).optional(),
  templateId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
});

export const PATCH = withRateLimit(
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

      const body = await request.json();
      const payload = notificationRuleUpdateSchema.parse(body);

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.ruleType !== undefined) updateData.rule_type = payload.ruleType;
      if (payload.triggerConditions !== undefined)
        updateData.trigger_conditions = payload.triggerConditions;
      if (payload.channels !== undefined) updateData.channels = payload.channels;
      if (payload.templateId !== undefined) updateData.template_id = payload.templateId;
      if (payload.isActive !== undefined) updateData.is_active = payload.isActive;
      if (payload.priority !== undefined) updateData.priority = payload.priority;

      const { data, error: updateError } = await supabase
        .from('automated_notification_rules')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

      if (updateError) {
        logger.error(
          'Failed to update notification rule',
          {
            component: 'admin-notification-rules',
            action: 'update_failed',
            metadata: { ruleId: params.id, adminId: user?.id || 'unknown' },
          },
          updateError
        );
        return NextResponse.json({ error: 'Unable to update notification rule' }, { status: 500 });
      }

      logger.info('Notification rule updated', {
        component: 'admin-notification-rules',
        action: 'rule_updated',
        metadata: { ruleId: params.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ rule: data });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error updating notification rule',
        {
          component: 'admin-notification-rules',
          action: 'update_unexpected',
          metadata: { ruleId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const DELETE = withRateLimit(
  RateLimitPresets.VERY_STRICT,
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

      const { error: deleteError } = await supabase
        .from('automated_notification_rules')
        .delete()
        .eq('id', params.id);

      if (deleteError) {
        logger.error(
          'Failed to delete notification rule',
          {
            component: 'admin-notification-rules',
            action: 'delete_failed',
            metadata: { ruleId: params.id, adminId: user?.id || 'unknown' },
          },
          deleteError
        );
        return NextResponse.json({ error: 'Unable to delete notification rule' }, { status: 500 });
      }

      logger.info('Notification rule deleted', {
        component: 'admin-notification-rules',
        action: 'rule_deleted',
        metadata: { ruleId: params.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      logger.error(
        'Unexpected error deleting notification rule',
        {
          component: 'admin-notification-rules',
          action: 'delete_unexpected',
          metadata: { ruleId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
