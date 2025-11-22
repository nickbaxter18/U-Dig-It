import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

// import { ZodError } from 'zod'; // Reserved for future validation error handling

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const notificationRuleCreateSchema = z.object({
  name: z.string().min(1).max(200),
  ruleType: z.enum([
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
  ]),
  triggerConditions: z.record(z.string(), z.unknown()),
  channels: z.array(z.enum(['email', 'sms', 'push', 'inapp'])).min(1),
  templateId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
});

const _notificationRuleUpdateSchema = notificationRuleCreateSchema.partial();

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const ruleType = searchParams.get('ruleType');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    let query = supabase
      .from('automated_notification_rules')
      .select(
        'id, name, rule_type, trigger_conditions, channels, template_id, is_active, priority, created_by, created_at, updated_at',
        { count: 'exact' }
      )
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (ruleType) {
      query = query.eq('rule_type', ruleType);
    }

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      logger.error('Failed to fetch notification rules', {
        component: 'admin-notification-rules',
        action: 'fetch_failed',
      });
      return NextResponse.json({ error: 'Unable to fetch notification rules' }, { status: 500 });
    }

    return NextResponse.json({
      rules: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching notification rules',
      { component: 'admin-notification-rules', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    const body = await request.json();
    const payload = notificationRuleCreateSchema.parse(body);

    const { data, error: insertError } = await supabase
      .from('automated_notification_rules')
      .insert({
        name: payload.name,
        rule_type: payload.ruleType,
        trigger_conditions: payload.triggerConditions,
        channels: payload.channels,
        template_id: payload.templateId || null,
        is_active: payload.isActive,
        priority: payload.priority,
        created_by: user?.id || 'unknown',
      })
      .select()
      .single();

    if (insertError) {
      logger.error(
        'Failed to create notification rule',
        {
          component: 'admin-notification-rules',
          action: 'create_failed',
          metadata: { name: payload.name, adminId: user?.id || 'unknown' },
        },
        insertError
      );
      return NextResponse.json({ error: 'Unable to create notification rule' }, { status: 500 });
    }

    logger.info('Notification rule created', {
      component: 'admin-notification-rules',
      action: 'rule_created',
      metadata: { ruleId: data?.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ rule: data }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating notification rule',
      { component: 'admin-notification-rules', action: 'create_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
