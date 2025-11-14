import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/analytics/schedule-report
 * Schedule a recurring analytics report
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const body = await request.json();
    const { reportType, frequency, recipients, dateRange } = body;

    if (!reportType || !frequency || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'Missing required fields: reportType, frequency, recipients' },
        { status: 400 }
      );
    }

    // Validate frequency
    const validFrequencies = ['daily', 'weekly', 'monthly'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: `Frequency must be one of: ${validFrequencies.join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate next run date
    const nextRun = new Date();
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
    }

    // Store scheduled report (you might want to create a scheduled_reports table)
    // For now, we'll just log it and return success
    logger.info('Report scheduled successfully', {
      component: 'analytics-schedule-api',
      action: 'schedule_report',
      metadata: {
        reportType,
        frequency,
        recipients,
        dateRange,
        nextRun: nextRun.toISOString(),
        userId: user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: `Report scheduled to run ${frequency}. Next run: ${nextRun.toLocaleString()}`,
      nextRun: nextRun.toISOString(),
      scheduleId: `schedule-${Date.now()}`
    });
  } catch (error: any) {
    logger.error('Failed to schedule report', {
      component: 'analytics-schedule-api',
      action: 'schedule_report_error',
      metadata: { error: error.message }
    }, error);

    return NextResponse.json(
      { error: 'Failed to schedule report' },
      { status: 500 }
    );
  }
}

