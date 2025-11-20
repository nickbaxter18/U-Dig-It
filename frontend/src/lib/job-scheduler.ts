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
import _Stripe from 'stripe';

// Reserved for future Stripe type usage
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

import { logger } from './logger';
import { broadcastInAppNotificationToAdmins } from './notification-service';

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
      .select(
        `
        id,
        booking_id,
        job_type,
        run_at_utc,
        retry_count,
        max_retries,
        metadata
      `
      )
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
    const results = await Promise.allSettled(jobs.map((job) => processJob(job, supabase)));

    // 3. Count successes and failures
    const successes = results.filter((r) => r.status === 'fulfilled').length;
    const failures = results.filter((r) => r.status === 'rejected').length;

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
  } catch (error: unknown) {
    logger.error(
      'Job scheduler failed',
      {
        component: 'job-scheduler',
        action: 'error',
        metadata: { error: error.message },
      },
      error
    );

    return { success: false, error: error.message };
  }
}

/**
 * Process a single job
 */
async function processJob(job: unknown, supabase: unknown) {
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
    await supabase.from('schedules').update({ status: 'processing' }).eq('id', job.id);

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
  } catch (error: unknown) {
    logger.error(
      'Job processing failed',
      {
        component: 'job-scheduler',
        action: 'job_failed',
        metadata: {
          jobId: job.id,
          jobType: job.job_type,
          error: error.message,
        },
      },
      error
    );

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
async function processPlaceHoldJob(job: unknown, _supabase: unknown) {
  // Reserved for future Supabase usage
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
async function processReleaseHoldJob(job: unknown, supabase: unknown) {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const bookingId = job.booking_id;

  logger.info('Releasing hold via job', {
    component: 'job-scheduler',
    action: 'release_hold',
    metadata: { bookingId },
  });

  // Check if booking has been returned clean
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, security_hold_intent_id, customerId')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error(`Booking ${bookingId} not found: ${bookingError?.message}`);
  }

  // Only release if booking is returned_ok or completed
  if (booking.status !== 'returned_ok' && booking.status !== 'completed') {
    logger.info('Booking not ready for hold release', {
      component: 'job-scheduler',
      action: 'hold_release_skipped',
      metadata: { bookingId, status: booking.status },
    });
    return {
      skipped: true,
      reason: `Booking status is ${booking.status}, not returned_ok or completed`,
    };
  }

  // Check if hold was already released
  if (!booking.security_hold_intent_id) {
    logger.info('No security hold to release', {
      component: 'job-scheduler',
      action: 'hold_release_skipped',
      metadata: { bookingId },
    });
    return { skipped: true, reason: 'No security hold intent found' };
  }

  // Call the release endpoint
  const response = await fetch(`${apiUrl}/api/stripe/release-security-hold`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-service-key': INTERNAL_SERVICE_KEY,
    },
    body: JSON.stringify({ bookingId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to release security hold');
  }

  const result = await response.json();

  logger.info('Security hold released successfully via job', {
    component: 'job-scheduler',
    action: 'hold_released',
    metadata: {
      bookingId,
      paymentIntentId: result.paymentIntentId,
    },
  });

  return result;
}

/**
 * Process send_reminder job (remind customer about upcoming hold)
 */
async function processSendReminderJob(job: unknown, supabase: unknown) {
  const bookingId = job.booking_id;
  const reminderType = job.metadata?.reminderType || 'hold_reminder'; // 'hold_reminder' or 'insurance_reminder'

  logger.info('Sending reminder via job', {
    component: 'job-scheduler',
    action: 'send_reminder',
    metadata: { bookingId, reminderType },
  });

  // Fetch booking with customer info
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(
      `
      id,
      bookingNumber,
      startDate,
      customerId,
      customer:customerId(email, firstName, lastName)
    `
    )
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error(`Booking ${bookingId} not found: ${bookingError?.message}`);
  }

  if (!booking.customer || !booking.customer.email) {
    logger.warn('No customer email found for reminder', {
      component: 'job-scheduler',
      action: 'reminder_skipped',
      metadata: { bookingId },
    });
    return { skipped: true, reason: 'No customer email found' };
  }

  // Import email service dynamically
  const { sendSecurityHoldReminderEmail } = await import('./email-service');

  try {
    await sendSecurityHoldReminderEmail({
      email: booking.customer.email,
      firstName: booking.customer.firstName || undefined,
      bookingNumber: booking.bookingNumber,
      startDate: booking.startDate,
    });

    logger.info('Reminder email sent successfully', {
      component: 'job-scheduler',
      action: 'reminder_sent',
      metadata: { bookingId, email: booking.customer.email, reminderType },
    });

    return { success: true, emailSent: true };
  } catch (error) {
    logger.error(
      'Failed to send reminder email',
      {
        component: 'job-scheduler',
        action: 'reminder_error',
        metadata: { bookingId },
      },
      error as Error
    );
    throw error;
  }
}

/**
 * Process check_insurance job (verify insurance still valid)
 */
async function processCheckInsuranceJob(job: unknown, supabase: unknown) {
  const bookingId = job.booking_id;

  logger.info('Checking insurance via job', {
    component: 'job-scheduler',
    action: 'check_insurance',
    metadata: { bookingId },
  });

  // Fetch booking with insurance documents
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(
      `
      id,
      bookingNumber,
      startDate,
      customerId,
      insurance_documents(id, status, expiresAt, type)
    `
    )
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error(`Booking ${bookingId} not found: ${bookingError?.message}`);
  }

  const insuranceDocs = booking.insurance_documents || [];
  const now = new Date();

  // Check for expired or expiring soon insurance
  const expiredDocs = insuranceDocs.filter((doc: unknown) => {
    if (!doc.expiresAt) return false;
    const expiryDate = new Date(doc.expiresAt);
    return expiryDate < now;
  });

  const expiringSoonDocs = insuranceDocs.filter((doc: unknown) => {
    if (!doc.expiresAt) return false;
    const expiryDate = new Date(doc.expiresAt);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0; // Expiring within 30 days
  });

  // Check if any approved insurance exists
  const hasApprovedInsurance = insuranceDocs.some(
    (doc: unknown) => doc.status === 'approved' && (!doc.expiresAt || new Date(doc.expiresAt) > now)
  );

  if (expiredDocs.length > 0) {
    logger.warn('Expired insurance documents found', {
      component: 'job-scheduler',
      action: 'insurance_expired',
      metadata: {
        bookingId,
        expiredCount: expiredDocs.length,
        expiredIds: expiredDocs.map((d: unknown) => d.id),
      },
    });

    // Notify admins
    await broadcastInAppNotificationToAdmins({
      supabase,
      category: 'compliance',
      priority: 'high',
      title: 'Insurance Expired',
      message: `Booking ${booking.bookingNumber} has expired insurance documents. Please review.`,
      actionUrl: `/admin/bookings/${bookingId}`,
      metadata: {
        bookingId,
        bookingNumber: booking.bookingNumber,
        expiredCount: expiredDocs.length,
      },
    });
  }

  if (expiringSoonDocs.length > 0 && hasApprovedInsurance) {
    logger.info('Insurance expiring soon', {
      component: 'job-scheduler',
      action: 'insurance_expiring_soon',
      metadata: {
        bookingId,
        expiringCount: expiringSoonDocs.length,
      },
    });
    // Note: Customer reminder emails are handled separately via admin endpoint
  }

  return {
    success: true,
    hasApprovedInsurance,
    expiredCount: expiredDocs.length,
    expiringSoonCount: expiringSoonDocs.length,
  };
}
