import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createInAppNotification } from '@/lib/notification-service';
import { sendAdminEmail } from '@/lib/sendgrid';
import { createServiceClient } from '@/lib/supabase/service';

const JOB_NAME = 'process_notifications';

// Verify cron secret to prevent unauthorized runs
const CRON_SECRET = process.env.CRON_SECRET || 'development-cron-secret';

/**
 * GET /api/cron/process-notifications
 * Process queued notifications that are due to be sent
 * Should be called by cron service every minute
 */
export async function GET(request: NextRequest) {
  let jobRun: any = null;
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');

    const isAuthorized =
      authHeader === `Bearer ${CRON_SECRET}` ||
      cronSecret === CRON_SECRET ||
      request.headers.get('x-vercel-cron') === 'true';

    if (!isAuthorized) {
      logger.warn('Unauthorized notification processor access', {
        component: 'cron-process-notifications',
        action: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceClient();
    if (!supabaseAdmin) {
      logger.error('Service client unavailable for notification processing', {
        component: 'cron-process-notifications',
        action: 'missing_client',
      });
      return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
    }

    // Create job run record
    const { data: jobRunData, error: jobRunError } = await supabaseAdmin
      .from('job_runs')
      .insert({
        job_name: JOB_NAME,
        job_type: 'cron',
        status: 'running',
        metadata: {
          triggered_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (jobRunError) {
      logger.error(
        'Failed to create job run record',
        {
          component: 'cron-process-notifications',
          action: 'create_run_failed',
        },
        jobRunError
      );
      // Continue anyway, but log the error
    } else {
      jobRun = jobRunData;
    }

    // Fetch queued notifications that are due
    const now = new Date().toISOString();
    const { data: queuedNotifications, error: fetchError } = await supabaseAdmin
      .from('notification_queue')
      .select('id, user_id, channel, template_name, data, scheduled_at, retry_count, max_retries')
      .eq('status', 'queued')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(100); // Process max 100 notifications per run

    if (fetchError) {
      logger.error(
        'Failed to fetch queued notifications',
        {
          component: 'cron-process-notifications',
          action: 'fetch_failed',
        },
        fetchError
      );
      return NextResponse.json({ error: 'Failed to fetch queued notifications' }, { status: 500 });
    }

    if (!queuedNotifications || queuedNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No notifications queued for processing',
      });
    }

    logger.info(`Processing ${queuedNotifications.length} queued notifications`, {
      component: 'cron-process-notifications',
      action: 'processing',
      metadata: { count: queuedNotifications.length },
    });

    const results = await Promise.allSettled(
      queuedNotifications.map((notification) => processNotification(notification, supabaseAdmin))
    );

    const successes = results.filter((r) => r.status === 'fulfilled').length;
    const failures = results.filter((r) => r.status === 'rejected').length;

    logger.info('Notification processing completed', {
      component: 'cron-process-notifications',
      action: 'completed',
      metadata: {
        total: queuedNotifications.length,
        successes,
        failures,
      },
    });

    // Update job run record
    if (jobRun) {
      await supabaseAdmin
        .from('job_runs')
        .update({
          status: failures === 0 ? 'success' : 'failed',
          finished_at: new Date().toISOString(),
          processed_count: queuedNotifications.length,
          success_count: successes,
          failure_count: failures,
        })
        .eq('id', jobRun.id);
    }

    return NextResponse.json({
      success: true,
      processed: queuedNotifications.length,
      successes,
      failures,
    });
  } catch (error) {
    logger.error(
      'Unexpected error processing notifications',
      {
        component: 'cron-process-notifications',
        action: 'unexpected_error',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    // Update job run record with error
    if (jobRun) {
      const supabaseAdmin = createServiceClient();
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('job_runs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : String(error),
          })
          .eq('id', jobRun.id);
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processNotification(notification: unknown, supabaseAdmin: unknown) {
  try {
    // Mark as processing
    await supabaseAdmin
      .from('notification_queue')
      .update({
        status: 'processing',
        attempts: notification.attempts + 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', notification.id);

    let success = false;

    switch (notification.channel) {
      case 'email':
        success = await processEmailNotification(notification, supabaseAdmin);
        break;
      case 'inapp':
        success = await processInAppNotification(notification, supabaseAdmin);
        break;
      case 'sms':
        // TODO: Implement SMS processing
        logger.warn('SMS notifications not yet implemented', {
          component: 'cron-process-notifications',
          action: 'sms_not_implemented',
          metadata: { notificationId: notification.id },
        });
        success = false;
        break;
      case 'push':
        // TODO: Implement push notification processing
        logger.warn('Push notifications not yet implemented', {
          component: 'cron-process-notifications',
          action: 'push_not_implemented',
          metadata: { notificationId: notification.id },
        });
        success = false;
        break;
      default:
        throw new Error(`Unknown notification channel: ${notification.channel}`);
    }

    if (success) {
      // Mark as sent
      await supabaseAdmin
        .from('notification_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id);
    } else {
      throw new Error('Notification processing failed');
    }
  } catch (error) {
    const attempts = notification.attempts + 1;
    const maxAttempts = notification.max_attempts || 3;

    if (attempts >= maxAttempts) {
      // Mark as failed after max attempts
      await supabaseAdmin
        .from('notification_queue')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        })
        .eq('id', notification.id);
    } else {
      // Retry later with exponential backoff
      const retryDelay = Math.pow(2, attempts) * 60; // 2^attempts minutes
      const retryAt = new Date(Date.now() + retryDelay * 1000);

      await supabaseAdmin
        .from('notification_queue')
        .update({
          status: 'queued',
          scheduled_at: retryAt.toISOString(),
          error: error instanceof Error ? error.message : String(error),
        })
        .eq('id', notification.id);
    }

    throw error;
  }
}

async function processEmailNotification(
  notification: unknown,
  supabaseAdmin: unknown
): Promise<boolean> {
  try {
    const to = notification.to;
    let emailAddress: string;

    if (to.email) {
      emailAddress = to.email;
    } else if (to.admin) {
      // Fetch admin emails
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('email')
        .in('role', ['admin', 'super_admin'])
        .eq('status', 'active');

      if (!admins || admins.length === 0) {
        throw new Error('No admin emails found');
      }

      // For now, send to first admin. In production, you might want to send to all
      emailAddress = admins[0].email;
    } else if (to.userId) {
      // Fetch user email
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', to.userId)
        .single();

      if (!user) {
        throw new Error(`User ${to.userId} not found`);
      }

      emailAddress = user.email;
    } else {
      throw new Error('Invalid email recipient format');
    }

    const fromEmail = process.env.EMAIL_FROM || 'NickBaxter@udigit.ca';
    const subject = notification.subject || 'Notification from U-Dig It Rentals';

    // Build email body from payload
    const payload = notification.payload || {};
    let htmlBody = payload.html || payload.message || 'You have a new notification.';

    // If template data is provided, you could render a template here
    if (payload.templateData) {
      // Simple template replacement
      Object.keys(payload.templateData).forEach((key) => {
        htmlBody = htmlBody.replace(new RegExp(`{{${key}}}`, 'g'), payload.templateData[key]);
      });
    }

    await sendAdminEmail({
      to: emailAddress,
      from: {
        email: fromEmail,
        name: 'U-Dig It Rentals',
      },
      subject,
      html: htmlBody,
    });

    return true;
  } catch (error) {
    logger.error(
      'Failed to process email notification',
      {
        component: 'cron-process-notifications',
        action: 'email_failed',
        metadata: { notificationId: notification.id },
      },
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

async function processInAppNotification(
  notification: unknown,
  supabaseAdmin: unknown
): Promise<boolean> {
  try {
    const to = notification.to;
    let userId: string;

    if (to.userId) {
      userId = to.userId;
    } else if (to.email) {
      // Look up user by email
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', to.email)
        .single();

      if (!user) {
        throw new Error(`User with email ${to.email} not found`);
      }

      userId = user.id;
    } else {
      throw new Error('Invalid in-app notification recipient format');
    }

    const payload = notification.payload || {};
    const title = payload.title || notification.subject || 'Notification';
    const message = payload.message || payload.body || 'You have a new notification.';

    await createInAppNotification({
      supabase: supabaseAdmin,
      userId,
      title,
      message,
      category: payload.category || 'system',
      priority: payload.priority || 'medium',
      actionUrl: payload.actionUrl || null,
      ctaLabel: payload.ctaLabel || null,
      templateId: notification.template_id || null,
      templateData: payload.templateData || null,
      metadata: notification.metadata || null,
    });

    return true;
  } catch (error) {
    logger.error(
      'Failed to process in-app notification',
      {
        component: 'cron-process-notifications',
        action: 'inapp_failed',
        metadata: { notificationId: notification.id },
      },
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}
