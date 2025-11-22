import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

// import { ZodError } from 'zod'; // Reserved for future validation error handling

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const scheduledReportCreateSchema = z.object({
  name: z.string().min(1).max(200),
  reportType: z.enum(['dashboard', 'analytics', 'bookings', 'customers', 'equipment', 'payments']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  frequencyConfig: z.record(z.string(), z.unknown()).optional().nullable(),
  dateRange: z.enum(['7d', '30d', '90d', 'ytd', 'all']).default('30d'),
  format: z.enum(['csv', 'pdf', 'json']).default('csv'),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient email is required'),
  filters: z.record(z.string(), z.unknown()).optional().nullable(),
});

const _scheduledReportUpdateSchema = scheduledReportCreateSchema.partial().extend({
  is_active: z.boolean().optional(),
});

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

    // Get pagination parameters
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    let query = supabase
      .from('scheduled_reports')
      .select(
        'id, name, report_type, schedule_config, recipients, format, status, last_run_at, next_run_at, created_at, updated_at, created_by',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      logger.error('Failed to fetch scheduled reports', {
        component: 'admin-scheduled-reports',
        action: 'fetch_failed',
      });
      return NextResponse.json({ error: 'Unable to fetch scheduled reports' }, { status: 500 });
    }

    return NextResponse.json({
      reports: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching scheduled reports',
      { component: 'admin-scheduled-reports', action: 'fetch_unexpected' },
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
    const payload = scheduledReportCreateSchema.parse(body);

    // Calculate next run date based on frequency
    const { data: nextRunData, error: nextRunError } = await supabase.rpc(
      'calculate_next_run_date',
      {
        p_frequency: payload.frequency,
        p_frequency_config: payload.frequencyConfig || null,
        p_current_next_run: null,
      }
    );

    if (nextRunError) {
      logger.error('Failed to calculate next run date', {
        component: 'admin-scheduled-reports',
        action: 'calculate_next_run_failed',
      });
      // Fallback: calculate manually
      const nextRun = new Date();
      switch (payload.frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
        default:
          nextRun.setDate(nextRun.getDate() + 1);
      }

      const { data, error: insertError } = await supabase
        .from('scheduled_reports')
        .insert({
          name: payload.name,
          report_type: payload.reportType,
          frequency: payload.frequency,
          frequency_config: payload.frequencyConfig || null,
          date_range: payload.dateRange,
          format: payload.format,
          recipients: payload.recipients,
          filters: payload.filters || null,
          next_run_at: nextRun.toISOString(),
          created_by: user?.id || 'unknown',
        })
        .select()
        .single();

      if (insertError) {
        logger.error(
          'Failed to create scheduled report',
          {
            component: 'admin-scheduled-reports',
            action: 'create_failed',
            metadata: { name: payload.name, adminId: user?.id || 'unknown' },
          },
          insertError
        );
        return NextResponse.json({ error: 'Unable to create scheduled report' }, { status: 500 });
      }

      logger.info('Scheduled report created', {
        component: 'admin-scheduled-reports',
        action: 'report_created',
        metadata: { reportId: data?.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ report: data }, { status: 201 });
    }

    const { data, error: insertError } = await supabase
      .from('scheduled_reports')
      .insert({
        name: payload.name,
        report_type: payload.reportType,
        frequency: payload.frequency,
        frequency_config: payload.frequencyConfig || null,
        date_range: payload.dateRange,
        format: payload.format,
        recipients: payload.recipients,
        filters: payload.filters || null,
        next_run_at: nextRunData,
        created_by: user?.id || 'unknown',
      })
      .select()
      .single();

    if (insertError) {
      logger.error(
        'Failed to create scheduled report',
        {
          component: 'admin-scheduled-reports',
          action: 'create_failed',
          metadata: { name: payload.name, adminId: user?.id || 'unknown' },
        },
        insertError
      );
      return NextResponse.json({ error: 'Unable to create scheduled report' }, { status: 500 });
    }

    logger.info('Scheduled report created', {
      component: 'admin-scheduled-reports',
      action: 'report_created',
      metadata: { reportId: data?.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ report: data }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating scheduled report',
      { component: 'admin-scheduled-reports', action: 'create_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
