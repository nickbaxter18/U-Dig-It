import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

/**
 * GET /api/admin/jobs/status
 * Get status summary for all background jobs
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
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get job status summary
    const { data: summary, error: summaryError } = await supabase.rpc('get_job_status_summary');

    if (summaryError) {
      logger.error(
        'Failed to fetch job status summary',
        { component: 'admin-jobs-status', action: 'summary_failed' });
      return NextResponse.json(
        { error: 'Unable to fetch job status summary' },
        { status: 500 }
      );
    }

    // Get recent job runs if jobName is specified
    let recentRuns = null;
    if (jobName) {
      let query = supabase
        .from('job_runs')
        .select('*')
        .eq('job_name', jobName)
        .order('started_at', { ascending: false })
        .limit(limit);

      const { data, error: runsError } = await query;

      if (runsError) {
        logger.error(
          'Failed to fetch job runs',
          {
            component: 'admin-jobs-status',
            action: 'runs_failed',
            metadata: { jobName },
          },
          runsError
        );
      } else {
        recentRuns = data;
      }
    }

    return NextResponse.json({
      summary: summary || [],
      recentRuns: recentRuns || null,
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching job status',
      { component: 'admin-jobs-status', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


