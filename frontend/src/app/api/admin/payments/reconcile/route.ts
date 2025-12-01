import { NextRequest, NextResponse } from 'next/server';

import { rateLimit } from '@/lib/rate-limiter';
import { RateLimitPresets } from '@/lib/rate-limiter';
import { requireAdminServer } from '@/lib/supabase/requireAdminServer';
import { runDailyBalanceReconciliation } from '@/lib/jobs/daily-balance-reconciliation';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/payments/reconcile
 *
 * Manually trigger balance reconciliation
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
    // Rate limiting (stricter for reconciliation)
    const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
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

    logger.info('Manual balance reconciliation triggered', {
      component: 'api-reconcile',
      action: 'reconciliation_triggered',
      metadata: {
        triggeredBy: user.id,
        limit,
        minDiscrepancy,
        autoCorrect,
      },
    });

    // Run reconciliation
    const result = await runDailyBalanceReconciliation({
      limit,
      minDiscrepancy,
      autoCorrectThreshold: autoCorrect ? minDiscrepancy : 0,
    });

    logger.info('Manual balance reconciliation completed', {
      component: 'api-reconcile',
      action: 'reconciliation_complete',
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
      message: 'Reconciliation completed successfully',
      result,
    });
  } catch (error) {
    logger.error(
      'Error running balance reconciliation',
      {
        component: 'api-reconcile',
        action: 'reconciliation_error',
      },
      error instanceof Error ? error : undefined
    );

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
