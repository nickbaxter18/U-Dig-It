/**
 * Cron Endpoint: Daily Balance Reconciliation
 *
 * Runs daily to validate all booking balances and report discrepancies.
 *
 * Schedule: Daily at 2:00 AM UTC (recommended)
 *
 * Authorization: Requires CRON_SECRET header
 */
import { NextRequest, NextResponse } from 'next/server';

import { runDailyBalanceReconciliation } from '@/lib/jobs/daily-balance-reconciliation';
import { logger } from '@/lib/logger';

// Verify cron secret to prevent unauthorized runs
const CRON_SECRET = process.env.CRON_SECRET || 'development-cron-secret';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');

    const isAuthorized =
      authHeader === `Bearer ${CRON_SECRET}` || cronSecret === CRON_SECRET;

    if (!isAuthorized) {
      logger.warn('Unauthorized daily balance reconciliation access', {
        component: 'cron-daily-balance-reconciliation',
        action: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Run reconciliation
    logger.info('Daily balance reconciliation cron triggered', {
      component: 'cron-daily-balance-reconciliation',
      action: 'cron_triggered',
      metadata: { timestamp: new Date().toISOString() },
    });

    const result = await runDailyBalanceReconciliation({
      limit: 1000, // Process up to 1000 bookings per day
      minDiscrepancy: 0.01, // Report discrepancies >= $0.01
      autoCorrectThreshold: 0.01, // Auto-correct discrepancies < $0.01
    });

    logger.info('Daily balance reconciliation cron completed', {
      component: 'cron-daily-balance-reconciliation',
      action: 'cron_complete',
      metadata: {
        totalValidated: result.totalValidated,
        discrepancies: result.discrepancies,
        autoCorrected: result.autoCorrected,
        requiresManualReview: result.requiresManualReview,
        durationMs: result.durationMs,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Daily balance reconciliation completed',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      'Daily balance reconciliation cron failed',
      {
        component: 'cron-daily-balance-reconciliation',
        action: 'cron_error',
      },
      error instanceof Error ? error : undefined
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Reconciliation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for external cron services
export async function POST(request: NextRequest) {
  return GET(request);
}


