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

    // Get job status summary - query job_runs table directly
    const { data: allRuns, error: runsError } = await supabase
      .from('job_runs')
      .select('job_name, status, started_at, duration_ms')
      .order('started_at', { ascending: false });

    if (runsError) {
      logger.error(
        'Failed to fetch job runs for summary',
        { component: 'admin-jobs-status', action: 'summary_failed' },
        runsError
      );
      return NextResponse.json({ error: 'Unable to fetch job status summary' }, { status: 500 });
    }

    // Aggregate job status summary from the data
    const jobMap = new Map<
      string,
      {
        job_name: string;
        last_run_at: string | null;
        last_status: string | null;
        success_rate: number | null;
        avg_duration_ms: number | null;
        total_runs: number;
        running_count: number;
        failed_count: number;
      }
    >();

    if (allRuns) {
      for (const run of allRuns) {
        if (!jobMap.has(run.job_name)) {
          jobMap.set(run.job_name, {
            job_name: run.job_name,
            last_run_at: null,
            last_status: null,
            success_rate: null,
            avg_duration_ms: null,
            total_runs: 0,
            running_count: 0,
            failed_count: 0,
          });
        }

        const job = jobMap.get(run.job_name)!;
        job.total_runs++;

        if (run.status === 'running') {
          job.running_count++;
        } else if (run.status === 'failed') {
          job.failed_count++;
        }

        // Track last run
        if (!job.last_run_at || (run.started_at && run.started_at > job.last_run_at)) {
          job.last_run_at = run.started_at;
          job.last_status = run.status;
        }
      }

      // Calculate success rate and average duration for each job
      for (const [jobName, job] of jobMap.entries()) {
        const jobRuns = allRuns.filter((r) => r.job_name === jobName);
        const successCount = jobRuns.filter((r) => r.status === 'success').length;
        job.success_rate =
          jobRuns.length > 0 ? Math.round((successCount / jobRuns.length) * 100 * 100) / 100 : null;

        const durations = jobRuns
          .filter((r) => r.duration_ms !== null)
          .map((r) => r.duration_ms as number);
        job.avg_duration_ms =
          durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : null;
      }
    }

    const summary = Array.from(jobMap.values());

    // Get recent job runs if jobName is specified
    let recentRuns = null;
    if (jobName) {
      const query = supabase
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
