/**
 * Daily Balance Reconciliation Job
 *
 * Runs daily to validate all booking balances and report discrepancies.
 * Can be triggered manually or scheduled via cron.
 */

import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';
import { validateMultipleBalances } from '@/lib/booking/balance-validator';

export interface ReconciliationResult {
  totalValidated: number;
  valid: number;
  invalid: number;
  discrepancies: number;
  totalDiscrepancy: number;
  autoCorrected: number;
  requiresManualReview: number;
  results: Array<{
    bookingId: string;
    storedBalance: number;
    calculatedBalance: number;
    discrepancy: number;
    discrepancyPercentage: number;
  }>;
  startTime: string;
  endTime: string;
  durationMs: number;
}

/**
 * Runs daily balance reconciliation for all bookings
 *
 * @param options - Reconciliation options
 * @returns Reconciliation result with summary
 */
export async function runDailyBalanceReconciliation(options: {
  limit?: number;
  minDiscrepancy?: number;
  autoCorrectThreshold?: number;
} = {}): Promise<ReconciliationResult> {
  const startTime = new Date();
  const {
    limit = 1000,
    minDiscrepancy = 0.01,
    autoCorrectThreshold = 0.01,
  } = options;

  logger.info('Starting daily balance reconciliation', {
    component: 'daily-balance-reconciliation',
    action: 'reconciliation_start',
    metadata: { limit, minDiscrepancy, autoCorrectThreshold },
  });

  try {
    // Fetch all bookings (or up to limit)
    const supabase = createServiceClient();
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id')
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch bookings: ${fetchError.message}`);
    }

    const bookingIds = (bookings || []).map((b) => b.id);
    logger.info(`Validating ${bookingIds.length} bookings`, {
      component: 'daily-balance-reconciliation',
      action: 'validation_start',
      metadata: { bookingCount: bookingIds.length },
    });

    // Validate all bookings
    const results = await validateMultipleBalances(bookingIds);

    // Filter by minimum discrepancy
    const discrepancies = results.filter(
      (r) => Math.abs(r.discrepancy) >= minDiscrepancy
    );

    // Auto-correct small discrepancies
    let autoCorrected = 0;
    const requiresManualReview: string[] = [];

    for (const result of discrepancies) {
      if (Math.abs(result.discrepancy) < autoCorrectThreshold) {
        // Auto-correct small discrepancies
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ balance_amount: result.calculatedBalance })
          .eq('id', result.bookingId);

        if (!updateError) {
          autoCorrected++;
          logger.info('Auto-corrected balance discrepancy', {
            component: 'daily-balance-reconciliation',
            action: 'auto_correct',
            metadata: {
              bookingId: result.bookingId,
              oldBalance: result.storedBalance,
              newBalance: result.calculatedBalance,
              discrepancy: result.discrepancy,
            },
          });
        }
      } else {
        // Flag for manual review
        requiresManualReview.push(result.bookingId);
        logger.warn('Balance discrepancy requires manual review', {
          component: 'daily-balance-reconciliation',
          action: 'manual_review_required',
          metadata: {
            bookingId: result.bookingId,
            discrepancy: result.discrepancy,
            discrepancyPercentage: result.discrepancyPercentage,
          },
        });
      }
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    const summary: ReconciliationResult = {
      totalValidated: results.length,
      valid: results.filter((r) => r.isValid).length,
      invalid: results.filter((r) => !r.isValid).length,
      discrepancies: discrepancies.length,
      totalDiscrepancy: discrepancies.reduce(
        (sum, r) => sum + Math.abs(r.discrepancy),
        0
      ),
      autoCorrected,
      requiresManualReview: requiresManualReview.length,
      results: discrepancies.map((r) => ({
        bookingId: r.bookingId,
        storedBalance: r.storedBalance,
        calculatedBalance: r.calculatedBalance,
        discrepancy: r.discrepancy,
        discrepancyPercentage: r.discrepancyPercentage,
      })),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMs,
    };

    logger.info('Daily balance reconciliation completed', {
      component: 'daily-balance-reconciliation',
      action: 'reconciliation_complete',
      metadata: {
        totalValidated: summary.totalValidated,
        invalid: summary.invalid,
        discrepancies: summary.discrepancies,
        autoCorrected: summary.autoCorrected,
        requiresManualReview: summary.requiresManualReview,
        durationMs: summary.durationMs,
      },
    });

    return summary;
  } catch (error) {
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    logger.error(
      'Daily balance reconciliation failed',
      {
        component: 'daily-balance-reconciliation',
        action: 'reconciliation_error',
        metadata: { durationMs },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    throw error;
  }
}


