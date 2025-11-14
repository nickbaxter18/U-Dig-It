/**
 * Job Scheduler - T-48 Security Hold Placement
 *
 * Processes pending jobs from the schedules table.
 * Run this as a cron job (every 5 minutes) or Edge Function.
 *
 * Example cron setup:
 *   Every 5 minutes: curl -X POST https://yourdomain.com/api/jobs/process
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

import { broadcastInAppNotificationToAdmins } from './notification-service';
import { logger } from './logger';

const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY!;

/**
 * Process all pending jobs that are due to run
 */
export async function processScheduledJobs() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  logger.info('Job scheduler started', {
    component: 'job-scheduler',
    action: 'start',
    metadata: { timestamp: new Date().toISOString() },
  });

  try {
    // 1. Query pending jobs that are due
    const { data: jobs, error: jobsError } = await supabase
      .from('schedules')
      .select(`
        id,
        booking_id,
        job_type,
        run_at_utc,
        retry_count,
        max_retries,
        metadata
      `)
      .eq('status', 'pending')
      .lte('run_at_utc', new Date().toISOString())
      .order('run_at_utc')
      .limit(100); // Process max 100 jobs per run

    if (jobsError) {
      logger.error('Failed to query pending jobs', {
        component: 'job-scheduler',
        action: 'query_failed',
        metadata: { error: jobsError.message },
      });
      return { success: false, error: jobsError.message };
    }

    if (!jobs || jobs.length === 0) {
      logger.info('No pending jobs to process', {
        component: 'job-scheduler',
        action: 'no_jobs',
      });
      return { success: true, processed: 0 };
    }

    logger.info(`Processing ${jobs.length} pending jobs`, {
      component: 'job-scheduler',
      action: 'processing',
      metadata: { count: jobs.length },
    });

    // 2. Process each job
    const results = await Promise.allSettled(
      jobs.map(job => processJob(job, supabase))
    );

    // 3. Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    logger.info('Job processing completed', {
      component: 'job-scheduler',
      action: 'completed',
      metadata: {
        total: jobs.length,
        successes,
        failures,
      },
    });

    return {
      success: true,
      processed: jobs.length,
      successes,
      failures,
    };

  } catch (error: any) {
    logger.error('Job scheduler failed', {
      component: 'job-scheduler',
      action: 'error',
      metadata: { error: error.message },
    }, error);

    return { success: false, error: error.message };
  }
}

/**
 * Process a single job
 */
async function processJob(job: any, supabase: any) {
  logger.info('Processing job', {
    component: 'job-scheduler',
    action: 'process_job',
    metadata: {
      jobId: job.id,
      bookingId: job.booking_id,
      jobType: job.job_type,
    },
  });

  try {
    // Mark job as processing
    await supabase
      .from('schedules')
      .update({ status: 'processing' })
      .eq('id', job.id);

    // Route to appropriate handler
    switch (job.job_type) {
      case 'place_hold':
        await processPlaceHoldJob(job, supabase);
        break;

      case 'release_hold':
        await processReleaseHoldJob(job, supabase);
        break;

      case 'send_reminder':
        await processSendReminderJob(job, supabase);
        break;

      case 'check_insurance':
        await processCheckInsuranceJob(job, supabase);
        break;

      default:
        throw new Error(`Unknown job type: ${job.job_type}`);
    }

    // Mark job as completed
    await supabase
      .from('schedules')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    logger.info('Job completed successfully', {
      component: 'job-scheduler',
      action: 'job_completed',
      metadata: { jobId: job.id, jobType: job.job_type },
    });

  } catch (error: any) {
    logger.error('Job processing failed', {
      component: 'job-scheduler',
      action: 'job_failed',
      metadata: {
        jobId: job.id,
        jobType: job.job_type,
        error: error.message,
      },
    }, error);

    // Handle retry logic
    if (job.retry_count < job.max_retries) {
      // Increment retry count and reschedule
      await supabase
        .from('schedules')
        .update({
          status: 'pending',
          retry_count: job.retry_count + 1,
          error_message: error.message,
          run_at_utc: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Retry in 5 min
        })
        .eq('id', job.id);

      logger.info('Job rescheduled for retry', {
        component: 'job-scheduler',
        action: 'job_retried',
        metadata: {
          jobId: job.id,
          retryCount: job.retry_count + 1,
          maxRetries: job.max_retries,
        },
      });
    } else {
      // Max retries reached - mark failed
      await supabase
        .from('schedules')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', job.id);

      logger.error('Job failed after max retries', {
        component: 'job-scheduler',
        action: 'job_max_retries',
        metadata: {
          jobId: job.id,
          retryCount: job.retry_count,
        },
      });

      await broadcastInAppNotificationToAdmins({
        supabase,
        category: 'system',
        priority: 'high',
        title: `Job failed: ${job.job_type}`,
        message: `Booking ${job.booking_id} - ${error.message}`,
        templateId: 'job_failed_admin_alert',
        templateData: {
          jobId: job.id,
          jobType: job.job_type,
          bookingId: job.booking_id,
        },
        metadata: {
          jobId: job.id,
          bookingId: job.booking_id,
          error: error.message,
          audience: 'admin',
        },
      });
    }

    throw error;
  }
}

/**
 * Process place_hold job (T-48 security hold)
 */
async function processPlaceHoldJob(job: any, supabase: any) {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  logger.info('Placing security hold via API', {
    component: 'job-scheduler',
    action: 'place_security_hold',
    metadata: { bookingId: job.booking_id },
  });

  const response = await fetch(`${apiUrl}/api/stripe/place-security-hold`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-service-key': INTERNAL_SERVICE_KEY,
    },
    body: JSON.stringify({ bookingId: job.booking_id }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to place security hold');
  }

  const result = await response.json();

  logger.info('Security hold placed successfully via job', {
    component: 'job-scheduler',
    action: 'hold_placed',
    metadata: {
      bookingId: job.booking_id,
      paymentIntentId: result.paymentIntentId,
    },
  });

  return result;
}

/**
 * Process release_hold job (automated release after return)
 */
async function processReleaseHoldJob(job: any, supabase: any) {
  // TODO: Implement automated hold release
  logger.info('Releasing hold via job', {
    component: 'job-scheduler',
    action: 'release_hold',
    metadata: { bookingId: job.booking_id },
  });
}

/**
 * Process send_reminder job (remind customer about upcoming hold)
 */
async function processSendReminderJob(job: any, supabase: any) {
  // TODO: Implement reminder emails
  logger.info('Sending reminder via job', {
    component: 'job-scheduler',
    action: 'send_reminder',
    metadata: { bookingId: job.booking_id },
  });
}

/**
 * Process check_insurance job (verify insurance still valid)
 */
async function processCheckInsuranceJob(job: any, supabase: any) {
  // TODO: Implement insurance validation
  logger.info('Checking insurance via job', {
    component: 'job-scheduler',
    action: 'check_insurance',
    metadata: { bookingId: job.booking_id },
  });
}






