import { NextRequest, NextResponse } from 'next/server';

import { rateLimit } from '@/lib/rate-limiter';
import { RateLimitPresets } from '@/lib/rate-limiter';
import { requireAdminServer } from '@/lib/supabase/requireAdminServer';
import { runDailyBalanceReconciliation } from '@/lib/jobs/daily-balance-reconciliation';
import { getBalanceValidationLogs } from '@/lib/booking/balance-validator';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/payments/reconciliation-report
 *
 * Generates a reconciliation report by running validation on all bookings
 *
 * Request body (optional):
 * {
 *   limit?: number,         // Max bookings to validate (default: 1000)
 *   minDiscrepancy?: number // Minimum discrepancy to report (default: 0.01)
 *   autoCorrect?: boolean   // Whether to auto-correct small discrepancies (default: true)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Admin authentication
    const { supabase, user, error: authError } = await requireAdminServer();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      limit = 1000,
      minDiscrepancy = 0.01,
      autoCorrect = true,
    } = body;

    logger.info('Generating reconciliation report', {
      component: 'api-reconciliation-report',
      action: 'report_start',
      metadata: { limit, minDiscrepancy, autoCorrect },
    });

    // Run reconciliation
    const result = await runDailyBalanceReconciliation({
      limit,
      minDiscrepancy,
      autoCorrectThreshold: autoCorrect ? minDiscrepancy : 0,
    });

    // Get recent validation logs for context
    const recentLogs = await getBalanceValidationLogs(20, minDiscrepancy);

    const report = {
      ...result,
      recentLogs,
      generatedAt: new Date().toISOString(),
      generatedBy: user.id,
    };

    logger.info('Reconciliation report generated', {
      component: 'api-reconciliation-report',
      action: 'report_complete',
      metadata: {
        totalValidated: result.totalValidated,
        discrepancies: result.discrepancies,
        autoCorrected: result.autoCorrected,
      },
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    logger.error(
      'Error generating reconciliation report',
      {
        component: 'api-reconciliation-report',
        action: 'report_error',
      },
      error instanceof Error ? error : undefined
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/payments/reconciliation-report
 *
 * Get the most recent reconciliation report (if stored)
 * or generate a new one
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Admin authentication
    const { supabase, user, error: authError } = await requireAdminServer();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const generate = searchParams.get('generate') === 'true';

    if (generate) {
      // Generate new report
      return POST(request);
    }

    // Get recent validation logs as a simple report
    const recentLogs = await getBalanceValidationLogs(50, 0.01);

    return NextResponse.json({
      success: true,
      report: {
        recentLogs,
        summary: {
          totalLogs: recentLogs.length,
          autoCorrected: recentLogs.filter((log) => log.autoCorrected).length,
          requiresReview: recentLogs.filter((log) => !log.autoCorrected).length,
        },
      },
    });
  } catch (error) {
    logger.error(
      'Error fetching reconciliation report',
      {
        component: 'api-reconciliation-report',
        action: 'get_report_error',
      },
      error instanceof Error ? error : undefined
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


