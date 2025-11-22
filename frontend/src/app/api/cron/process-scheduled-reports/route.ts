import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { sendAdminEmail } from '@/lib/sendgrid';
import { createServiceClient } from '@/lib/supabase/service';

// Verify cron secret to prevent unauthorized runs
const CRON_SECRET = process.env.CRON_SECRET || 'development-cron-secret';

/**
 * GET /api/cron/process-scheduled-reports
 * Process scheduled reports that are due to run
 * Should be called by cron service every hour
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');

    const isAuthorized =
      authHeader === `Bearer ${CRON_SECRET}` ||
      cronSecret === CRON_SECRET ||
      request.headers.get('x-vercel-cron') === 'true'; // Vercel cron header

    if (!isAuthorized) {
      logger.warn('Unauthorized scheduled reports processor access', {
        component: 'cron-scheduled-reports',
        action: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceClient();
    if (!supabaseAdmin) {
      logger.error('Service client unavailable for scheduled reports', {
        component: 'cron-scheduled-reports',
        action: 'missing_client',
      });
      return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
    }

    // Fetch scheduled reports that are due to run
    const now = new Date().toISOString();
    const { data: dueReports, error: fetchError } = await supabaseAdmin
      .from('scheduled_reports')
      .select('id, name, report_type, parameters, created_by, next_run_at, frequency')
      .eq('is_active', true)
      .lte('next_run_at', now)
      .order('next_run_at', { ascending: true })
      .limit(50); // Process max 50 reports per run

    if (fetchError) {
      logger.error(
        'Failed to fetch due scheduled reports',
        {
          component: 'cron-scheduled-reports',
          action: 'fetch_failed',
        },
        fetchError
      );
      return NextResponse.json({ error: 'Failed to fetch scheduled reports' }, { status: 500 });
    }

    if (!dueReports || dueReports.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No scheduled reports due to run',
      });
    }

    logger.info(`Processing ${dueReports.length} scheduled reports`, {
      component: 'cron-scheduled-reports',
      action: 'processing',
      metadata: { count: dueReports.length },
    });

    const results = await Promise.allSettled(
      dueReports.map((report) => processScheduledReport(report, supabaseAdmin))
    );

    const successes = results.filter((r) => r.status === 'fulfilled').length;
    const failures = results.filter((r) => r.status === 'rejected').length;

    logger.info('Scheduled reports processing completed', {
      component: 'cron-scheduled-reports',
      action: 'completed',
      metadata: {
        total: dueReports.length,
        successes,
        failures,
      },
    });

    return NextResponse.json({
      success: true,
      processed: dueReports.length,
      successes,
      failures,
    });
  } catch (error) {
    logger.error(
      'Unexpected error processing scheduled reports',
      {
        component: 'cron-scheduled-reports',
        action: 'unexpected_error',
      },
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processScheduledReport(report: unknown, supabaseAdmin: unknown) {
  try {
    logger.info('Processing scheduled report', {
      component: 'cron-scheduled-reports',
      action: 'process_report',
      metadata: {
        reportId: report.id,
        reportType: report.report_type,
        name: report.name,
      },
    });

    // Generate the report URL
    const reportUrl = getReportUrl(report.report_type, report.date_range, report.format);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://udigitrentals.com';
    const fullReportUrl = reportUrl.startsWith('http') ? reportUrl : `${baseUrl}${reportUrl}`;

    // For now, we'll generate a simple email with a link to download
    // In production, you'd generate the report file, upload to storage, and send signed URL
    const emailSubject = `Scheduled Report: ${report.name}`;
    const emailBody = `
      <h2>Scheduled Report: ${report.name}</h2>
      <p>Your scheduled ${report.frequency} report is ready.</p>
      <p><strong>Report Type:</strong> ${report.report_type}</p>
      <p><strong>Date Range:</strong> ${report.date_range}</p>
      <p><strong>Format:</strong> ${report.format.toUpperCase()}</p>
      <p><a href="${fullReportUrl}" style="display: inline-block; padding: 10px 20px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 5px;">Download Report</a></p>
      <p><small>This is an automated report. If you no longer wish to receive these reports, please update your scheduled reports settings.</small></p>
    `;

    // Send email to all recipients
    const fromEmail = process.env.EMAIL_FROM || 'NickBaxter@udigit.ca';
    const emailPromises = report.recipients.map((email: string) =>
      sendAdminEmail({
        to: email,
        from: {
          email: fromEmail,
          name: 'U-Dig It Rentals',
        },
        subject: emailSubject,
        html: emailBody,
      }).catch((err) => {
        logger.error(
          'Failed to send scheduled report email',
          {
            component: 'cron-scheduled-reports',
            action: 'email_failed',
            metadata: { reportId: report.id, recipient: email },
          },
          err
        );
        throw err;
      })
    );

    await Promise.all(emailPromises);

    // Calculate next run date
    const { data: nextRunData } = await supabaseAdmin.rpc('calculate_next_run_date', {
      p_frequency: report.frequency,
      p_frequency_config: report.frequency_config || null,
      p_current_next_run: report.next_run_at,
    });

    const nextRun = nextRunData || calculateNextRunFallback(report.frequency, report.next_run_at);

    // Update report status
    await supabaseAdmin
      .from('scheduled_reports')
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRun,
        last_run_status: 'success',
        total_runs: (report.total_runs || 0) + 1,
        successful_runs: (report.successful_runs || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', report.id);

    logger.info('Scheduled report processed successfully', {
      component: 'cron-scheduled-reports',
      action: 'report_processed',
      metadata: {
        reportId: report.id,
        recipients: report.recipients.length,
        nextRun,
      },
    });
  } catch (error) {
    // Update report with failure status
    await supabaseAdmin
      .from('scheduled_reports')
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: 'failed',
        last_run_error: error instanceof Error ? error.message : String(error),
        total_runs: (report.total_runs || 0) + 1,
        failed_runs: (report.failed_runs || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', report.id);

    throw error;
  }
}

function getReportUrl(reportType: string, dateRange: string, format: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://udigitrentals.com';

  switch (reportType) {
    case 'dashboard':
      return `${baseUrl}/api/admin/dashboard/export?range=${dateRange}&format=${format}`;
    case 'analytics':
      return `${baseUrl}/api/admin/analytics/export?dateRange=${dateRange}&format=${format}`;
    case 'bookings':
      return `${baseUrl}/api/admin/bookings/bulk-export?dateRange=${dateRange}&format=${format}`;
    case 'customers':
      return `${baseUrl}/api/admin/customers/bulk-export?format=${format}`;
    case 'equipment':
      return `${baseUrl}/api/admin/equipment/bulk-export?format=${format}`;
    case 'payments':
      return `${baseUrl}/api/admin/payments/export?dateRange=${dateRange}&format=${format}`;
    default:
      return `${baseUrl}/api/admin/dashboard/export?range=${dateRange}&format=${format}`;
  }
}

function calculateNextRunFallback(frequency: string, currentNextRun: string): string {
  const nextRun = new Date(currentNextRun || new Date());

  switch (frequency) {
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

  return nextRun.toISOString();
}
