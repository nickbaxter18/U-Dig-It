import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

/**
 * GET /api/admin/jobs/runs
 * Get recent job runs with filtering
 */
export async function GET(request: NextRequest) {
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
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('job_runs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

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
      return NextResponse.json(
        { error: 'Unable to fetch job runs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      runs: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching job runs',
      { component: 'admin-jobs-runs', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


