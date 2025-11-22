import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

/**
 * GET /api/admin/jobs/runs
 * Get recent job runs with filtering
 */
export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const jobName = searchParams.get('jobName');
    const status = searchParams.get('status');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    let query = supabase
      .from('job_runs')
      .select(
        'id, job_name, job_type, status, started_at, finished_at, duration_ms, processed_count, success_count, failure_count, error_message, metadata, triggered_by, created_at',
        { count: 'exact' }
      )
      .order('started_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (jobName) {
      query = query.eq('job_name', jobName);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      logger.error(
        'Failed to fetch job runs',
        {
          component: 'admin-jobs-runs',
          action: 'fetch_failed',
          metadata: { jobName, status },
        },
        fetchError
      );
      return NextResponse.json({ error: 'Unable to fetch job runs' }, { status: 500 });
    }

    return NextResponse.json({
      runs: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching job runs',
      { component: 'admin-jobs-runs', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
