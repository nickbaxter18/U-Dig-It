/**
 * Balance Validation Utilities
 *
 * Provides functions to validate booking balances and detect discrepancies.
 * Works with the database validation function and trigger system.
 */

import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

export interface BalanceValidationResult {
  bookingId: string;
  storedBalance: number;
  calculatedBalance: number;
  discrepancy: number;
  discrepancyPercentage: number;
  isValid: boolean;
}

/**
 * Validates a booking's balance by comparing stored balance with calculated balance
 *
 * Uses the database function `validate_booking_balance()` which:
 * - Calculates expected balance from all payments and refunds
 * - Compares with stored balance_amount
 * - Returns discrepancy details
 *
 * @param bookingId - The booking ID to validate
 * @returns Validation result with discrepancy details, or null if booking not found
 */
export async function validateBookingBalance(
  bookingId: string
): Promise<BalanceValidationResult | null> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase.rpc('validate_booking_balance', {
      p_booking_id: bookingId,
    });

    if (error) {
      logger.error(
        'Failed to validate booking balance',
        {
          component: 'balance-validator',
          action: 'validate_balance',
          metadata: { bookingId, error: error.message },
        },
        error
      );
      return null;
    }

    if (!data || data.length === 0) {
      logger.warn('Booking not found for balance validation', {
        component: 'balance-validator',
        action: 'validate_balance',
        metadata: { bookingId },
      });
      return null;
    }

    const result = data[0] as BalanceValidationResult;

    // Only log significant discrepancies (>= $0.01) to prevent excessive logging
    // Small rounding differences are expected and auto-corrected by triggers
    if (!result.isValid && Math.abs(result.discrepancy) >= 0.01) {
      logger.warn('Balance discrepancy detected', {
        component: 'balance-validator',
        action: 'discrepancy_detected',
        metadata: {
          bookingId,
          storedBalance: result.storedBalance,
          calculatedBalance: result.calculatedBalance,
          discrepancy: result.discrepancy,
          discrepancyPercentage: result.discrepancyPercentage,
        },
      });
    }

    return result;
  } catch (error) {
    logger.error(
      'Error validating booking balance',
      {
        component: 'balance-validator',
        action: 'validate_balance_error',
        metadata: { bookingId },
      },
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}

/**
 * Validates balances for multiple bookings
 *
 * @param bookingIds - Array of booking IDs to validate
 * @returns Array of validation results
 */
export async function validateMultipleBalances(
  bookingIds: string[]
): Promise<BalanceValidationResult[]> {
  const results: BalanceValidationResult[] = [];

  for (const bookingId of bookingIds) {
    const result = await validateBookingBalance(bookingId);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Gets recent balance validation logs
 *
 * @param limit - Maximum number of logs to return (default: 50)
 * @param minDiscrepancy - Minimum discrepancy amount to filter by (default: 0.01)
 * @returns Array of validation log entries
 */
export async function getBalanceValidationLogs(
  limit: number = 50,
  minDiscrepancy: number = 0.01
): Promise<Array<{
  id: string;
  bookingId: string;
  storedBalance: number;
  calculatedBalance: number;
  discrepancy: number;
  discrepancyPercentage: number;
  autoCorrected: boolean;
  createdAt: string;
}>> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('balance_validation_log')
      .select('id, booking_id, stored_balance, calculated_balance, discrepancy, discrepancy_percentage, auto_corrected, created_at')
      .gte('discrepancy', minDiscrepancy)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error(
        'Failed to fetch balance validation logs',
        {
          component: 'balance-validator',
          action: 'get_logs',
          metadata: { error: error.message },
        },
        error
      );
      return [];
    }

    return (data || []).map((log) => ({
      id: log.id,
      bookingId: log.booking_id,
      storedBalance: Number(log.stored_balance),
      calculatedBalance: Number(log.calculated_balance),
      discrepancy: Number(log.discrepancy),
      discrepancyPercentage: Number(log.discrepancy_percentage),
      autoCorrected: log.auto_corrected,
      createdAt: log.created_at,
    }));
  } catch (error) {
    logger.error(
      'Error fetching balance validation logs',
      {
        component: 'balance-validator',
        action: 'get_logs_error',
      },
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

