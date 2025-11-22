import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import {
  logisticsTaskCreateSchema,
  logisticsTaskFilterSchema,
} from '@/lib/validators/admin/bookings';

function parseFilters(searchParams: URLSearchParams) {
  const filterInput: Record<string, unknown> = {};

  if (searchParams.has('taskType')) {
    filterInput.taskType = searchParams.get('taskType') ?? undefined;
  }
  if (searchParams.has('status')) {
    filterInput.status = searchParams.get('status') ?? undefined;
  }
  if (searchParams.has('driverId')) {
    filterInput.driverId = searchParams.get('driverId') ?? undefined;
  }
  if (searchParams.has('bookingId')) {
    filterInput.bookingId = searchParams.get('bookingId') ?? undefined;
  }
  if (searchParams.has('from')) {
    filterInput.from = searchParams.get('from') ?? undefined;
  }
  if (searchParams.has('to')) {
    filterInput.to = searchParams.get('to') ?? undefined;
  }

  return logisticsTaskFilterSchema.parse(filterInput);
}

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const filters = parseFilters(searchParams);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    let query = supabase
      .from('logistics_tasks')
      .select(
        `
        id,
        booking_id,
        task_type,
        status,
        scheduled_at,
        address,
        driver_id,
        route_url,
        eta_minutes,
        special_instructions,
        notes,
        completed_at,
        created_at,
        updated_at,
        booking:booking_id (
          bookingNumber,
          customerId,
          startDate,
          endDate
        )
      `,
        { count: 'exact' }
      )
      .order('scheduled_at', { ascending: true })
      .range(rangeStart, rangeEnd);

    if (filters.taskType) query = query.eq('task_type', filters.taskType);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.driverId) query = query.eq('driver_id', filters.driverId);
    if (filters.bookingId) query = query.eq('booking_id', filters.bookingId);
    if (filters.from) query = query.gte('scheduled_at', filters.from);
    if (filters.to) query = query.lte('scheduled_at', filters.to);

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      logger.error('Failed to fetch logistics tasks', {
        component: 'admin-logistics-tasks',
        action: 'fetch_failed',
        metadata: filters,
      });
      return NextResponse.json({ error: 'Unable to load logistics tasks' }, { status: 500 });
    }

    return NextResponse.json({
      tasks: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error fetching logistics tasks',
      { component: 'admin-logistics-tasks', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json(
      { error: 'Internal server error while loading logistics tasks' },
      { status: 500 }
    );
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

    const payload = logisticsTaskCreateSchema.parse(await request.json());

    const { data, error: insertError } = await supabase
      .from('logistics_tasks')
      .insert({
        booking_id: payload.bookingId,
        task_type: payload.taskType,
        status: 'pending',
        scheduled_at: payload.scheduledAt,
        address: payload.address ?? null,
        driver_id: payload.driverId ?? null,
        route_url: payload.routeUrl ?? null,
        eta_minutes: payload.etaMinutes ?? null,
        special_instructions: payload.specialInstructions ?? null,
        notes: payload.notes ?? null,
      })
      .select()
      .single();

    if (insertError) {
      logger.error(
        'Failed to create logistics task',
        {
          component: 'admin-logistics-tasks',
          action: 'insert_failed',
          metadata: { bookingId: payload.bookingId },
        },
        insertError
      );
      return NextResponse.json({ error: 'Unable to create logistics task' }, { status: 500 });
    }

    logger.info('Logistics task created', {
      component: 'admin-logistics-tasks',
      action: 'task_created',
      metadata: { taskId: data.id, bookingId: payload.bookingId, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ task: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating logistics task',
      { component: 'admin-logistics-tasks', action: 'insert_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json(
      { error: 'Internal server error while creating logistics task' },
      { status: 500 }
    );
  }
});
