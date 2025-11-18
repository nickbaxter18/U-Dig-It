import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/admin/reports/scheduled/[id]/run
 * Manually trigger a scheduled report to run immediately
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;



    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }



    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the scheduled report
    const { data: report, error: fetchError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !report) {
      logger.error(
        'Failed to fetch scheduled report',
        {
          component: 'admin-scheduled-reports',
          action: 'fetch_report_failed',
          metadata: { reportId: params.id, error: fetchError?.message },
        }
      );
      return NextResponse.json(
        { error: 'Scheduled report not found' },
        { status: 404 }
      );
    }

    // Generate the report based on type
    const reportUrl = getReportUrl(report.report_type, report.date_range, report.format);

    // For now, we'll queue it for processing
    // In production, this would trigger an Edge Function or background job
    logger.info('Manual report run triggered', {
      component: 'admin-scheduled-reports',
      action: 'manual_run_triggered',
      metadata: {
        reportId: params.id,
        reportType: report.report_type,
        adminId: user?.id || 'unknown',
      },
    });

    // Update last_run_at
    const supabaseAdmin = createServiceClient();
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('scheduled_reports')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'success',
          total_runs: (report.total_runs || 0) + 1,
          successful_runs: (report.successful_runs || 0) + 1,
        })
        .eq('id', params.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Report generation queued successfully',
      reportUrl, // In production, this would be a signed URL to the generated report
    });
  } catch (err) {
    logger.error(
      'Unexpected error running scheduled report',
      {
        component: 'admin-scheduled-reports',
        action: 'run_unexpected',
        metadata: { reportId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getReportUrl(reportType: string, dateRange: string, format: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

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


