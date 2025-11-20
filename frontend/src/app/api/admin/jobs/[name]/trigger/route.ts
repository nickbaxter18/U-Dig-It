import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/admin/jobs/[name]/trigger
 * Manually trigger a background job
 */
export async function POST(request: NextRequest, { params }: { params: { name: string } }) {
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

    const supabaseAdmin = createServiceClient();
    if (!supabaseAdmin) {
      logger.error('Service client unavailable for job trigger', {
        component: 'admin-jobs-trigger',
        action: 'missing_client',
      });
      return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
    }

    const jobName = params.name;

    // Create job run record
    const { data: jobRun, error: createError } = await supabaseAdmin
      .from('job_runs')
      .insert({
        job_name: jobName,
        job_type: 'manual',
        status: 'running',
        triggered_by: user?.id || 'unknown',
        metadata: {
          triggered_by_email: user?.email || 'unknown',
          triggered_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (createError) {
      logger.error(
        'Failed to create job run record',
        {
          component: 'admin-jobs-trigger',
          action: 'create_run_failed',
          metadata: { jobName, adminId: user?.id || 'unknown' },
        },
        createError
      );
      return NextResponse.json({ error: 'Unable to create job run record' }, { status: 500 });
    }

    // Trigger the appropriate job based on name
    let result;
    try {
      switch (jobName) {
        case 'process_notifications': {
          // Call notification processor
          const notificationResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cron/process-notifications`,
            {
              method: 'GET',
              headers: {
                'x-cron-secret': process.env.CRON_SECRET || 'development-cron-secret',
              },
            }
          );
          result = await notificationResponse.json();
          break;
        }

        case 'generate_notifications': {
          // Call notification generator
          const generateResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cron/generate-notifications`,
            {
              method: 'GET',
              headers: {
                'x-cron-secret': process.env.CRON_SECRET || 'development-cron-secret',
              },
            }
          );
          result = await generateResponse.json();
          break;
        }

        case 'process_scheduled_reports': {
          // Call scheduled reports processor
          const reportsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cron/process-scheduled-reports`,
            {
              method: 'GET',
              headers: {
                'x-cron-secret': process.env.CRON_SECRET || 'development-cron-secret',
              },
            }
          );
          result = await reportsResponse.json();
          break;
        }

        case 'process_scheduled_jobs': {
          // Call scheduled jobs processor
          const jobsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/jobs/process`,
            {
              method: 'POST',
              headers: {
                'x-cron-secret': process.env.CRON_SECRET || 'development-cron-secret',
              },
            }
          );
          result = await jobsResponse.json();
          break;
        }

        case 'reconcile_stripe_payouts': {
          // Call payout reconciliation processor
          const payoutResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cron/reconcile-stripe-payouts`,
            {
              method: 'GET',
              headers: {
                'x-cron-secret': process.env.CRON_SECRET || 'development-cron-secret',
              },
            }
          );
          result = await payoutResponse.json();
          break;
        }

        default:
          throw new Error(`Unknown job name: ${jobName}`);
      }

      // Update job run with results
      await supabaseAdmin
        .from('job_runs')
        .update({
          status: result.success ? 'success' : 'failed',
          finished_at: new Date().toISOString(),
          processed_count: result.processed || result.processedCount || 0,
          success_count: result.successes || result.successCount || 0,
          failure_count: result.failures || result.failureCount || 0,
          error_message: result.error || null,
          metadata: {
            ...jobRun.metadata,
            result,
          },
        })
        .eq('id', jobRun.id);

      logger.info('Job triggered successfully', {
        component: 'admin-jobs-trigger',
        action: 'job_triggered',
        metadata: {
          jobName,
          jobRunId: jobRun.id,
          adminId: user?.id || 'unknown',
          result,
        },
      });

      return NextResponse.json({
        success: true,
        jobRunId: jobRun.id,
        result,
      });
    } catch (jobError) {
      // Update job run with error
      await supabaseAdmin
        .from('job_runs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_message: jobError instanceof Error ? jobError.message : String(jobError),
        })
        .eq('id', jobRun.id);

      throw jobError;
    }
  } catch (err) {
    logger.error(
      'Unexpected error triggering job',
      {
        component: 'admin-jobs-trigger',
        action: 'trigger_unexpected',
        metadata: { jobName: params.name },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
