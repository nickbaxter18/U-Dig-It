import { COMPLETED_PAYMENT_STATUSES, PAYMENT_STATUS } from '@/lib/constants/payment-status';
import { logger } from '@/lib/logger';
import type { BookingBalanceFields } from '@/lib/supabase/extended-types';
import { createServiceClient } from '@/lib/supabase/service';
import { typedSelect } from '@/lib/supabase/typed-helpers';

/**
 * Recalculates the booking balance_amount based on all completed payments.
 *
 * **Balance Calculation Formula:**
 * ```
 * balance_amount = totalAmount - (sum(all_completed_payments) - sum(all_refunds))
 * ```
 *
 * Where:
 * - `totalAmount`: The total contract amount for the booking
 * - `all_completed_payments`: Sum of all completed manual payments + completed Stripe payments
 * - `all_refunds`: Sum of all refunded amounts (from `amountRefunded` field)
 *
 * **Important**: The deposit is completely separate from the balance calculation.
 * Security deposits are held separately and do NOT reduce what the customer owes.
 * The outstanding balance represents only the rental amount, not including deposits.
 *
 * **When Balance is Recalculated:**
 * - After Stripe payment completion (webhook handlers)
 * - After manual payment status changes to/from 'completed'
 * - When manual payment is created as 'completed'
 * - When finance panel is refreshed (via API endpoint)
 * - On booking creation (initial balance set)
 *
 * **Payment Sources:**
 * - Manual payments: From `manual_payments` table (status = 'completed')
 * - Stripe payments: From `payments` table (status = 'completed')
 *   Note: The payments table status enum is: pending, processing, completed, failed, cancelled, refunded, partially_refunded
 *   Only 'completed' status counts toward balance
 *
 * **Validation:**
 * - Balance is capped at 0 (no negative balances unless refunds are explicitly allowed)
 * - Balance cannot exceed (totalAmount - depositAmount)
 * - All calculations use Math.max() to prevent negative values
 *
 * @param bookingId - The booking ID to recalculate balance for
 * @returns The new balance amount, or null if calculation failed
 *
 * @example
 * ```typescript
 * // Recalculate balance after payment
 * const newBalance = await recalculateBookingBalance(bookingId);
 * if (newBalance !== null) {
 *   console.log(`Updated balance: $${newBalance}`);
 * }
 * ```
 */
export async function recalculateBookingBalance(bookingId: string): Promise<number | null> {
  const serviceClient = await createServiceClient();

  if (!serviceClient) {
    logger.error('Service client not available for balance recalculation', {
      component: 'balance-recalculation',
      action: 'service_client_unavailable',
      metadata: { bookingId },
    });
    return null;
  }

  try {
    // Fetch booking details using typed helper
    // Note: balance_amount is a computed field, not a real column, so we fetch it separately
    const { data: booking, error: bookingError } = await typedSelect(
      serviceClient,
      'bookings',
      'id, totalAmount'
    )
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      logger.error(
        'Failed to fetch booking for balance recalculation',
        {
          component: 'balance-recalculation',
          action: 'booking_fetch_failed',
          metadata: { bookingId, error: bookingError?.message },
        },
        bookingError ?? new Error('Booking not found')
      );
      return null;
    }

    // Fetch current balance_amount separately (it's a computed field)
    const { data: bookingWithBalance } = await serviceClient
      .from('bookings')
      .select('id, totalAmount, balance_amount')
      .eq('id', bookingId)
      .single();

    const typedBooking = bookingWithBalance as BookingBalanceFields | null;

    // Type assertion: after the null check, booking is guaranteed to be non-null
    const bookingData = booking as { totalAmount?: number | string | null } | null;
    const totalAmount = Number(bookingData?.totalAmount ?? 0);
    const currentBalanceAmount = typedBooking?.balance_amount ?? null;

    // Log initial values for debugging
    logger.debug('Starting balance recalculation', {
      component: 'balance-recalculation',
      action: 'recalculation_start',
      metadata: {
        bookingId,
        totalAmount,
        currentBalanceAmount,
      },
    });

    // Fetch all completed manual payments for this booking
    const { data: manualPayments, error: manualPaymentsError } = await serviceClient
      .from('manual_payments')
      .select('id, amount, status')
      .eq('booking_id', bookingId)
      .eq('status', PAYMENT_STATUS.COMPLETED)
      .is('deleted_at', null);

    if (manualPaymentsError) {
      logger.error(
        'Failed to fetch manual payments for balance recalculation',
        {
          component: 'balance-recalculation',
          action: 'manual_payments_fetch_failed',
          metadata: { bookingId, error: manualPaymentsError.message },
        },
        manualPaymentsError
      );
      // Continue calculation with 0 for manual payments
    }

    // Fetch all completed Stripe payments for this booking
    // Note: payments table doesn't have deleted_at column, so we don't filter by it
    // Note: payments table status enum is: pending, processing, completed, failed, cancelled, refunded, partially_refunded
    // NOTE: Only 'completed' status is valid - 'succeeded' does not exist in payments_status_enum
    // CRITICAL: Only include payments with type='payment' (exclude deposits - they don't reduce balance)
    // FIX: The .or() method ORs with ALL previous conditions, not just the type filter.
    // We need to use PostgREST's grouped filter syntax to ensure proper AND logic.
    // This ensures: (status IN completed_statuses) AND (type IS NULL OR type = 'payment')
    // Using PostgREST's filter grouping: or=(and(type.is.null),and(type.eq.payment))
    const { data: stripePayments, error: stripePaymentsError } = await serviceClient
      .from('payments')
      .select('id, amount, status, type, "amountRefunded"')
      .eq('bookingId', bookingId)
      .in('status', COMPLETED_PAYMENT_STATUSES)
      .or('and(type.is.null),and(type.eq.payment)'); // Grouped OR ensures AND logic: (type IS NULL) OR (type = 'payment'), ANDed with status filter

    if (stripePaymentsError) {
      logger.error(
        'Failed to fetch Stripe payments for balance recalculation',
        {
          component: 'balance-recalculation',
          action: 'stripe_payments_fetch_failed',
          metadata: { bookingId, error: stripePaymentsError.message },
        },
        stripePaymentsError
      );
      // Continue calculation with 0 for Stripe payments
    }

    // Fetch all refunds for this booking (from all payments, not just completed)
    // CRITICAL: Refunds must be subtracted from total collected
    const { data: allPayments, error: allPaymentsError } = await serviceClient
      .from('payments')
      .select('id, "amountRefunded", type')
      .eq('bookingId', bookingId)
      .or('and(type.is.null),and(type.eq.payment)'); // Only include payments (exclude deposits)

    if (allPaymentsError) {
      logger.error(
        'Failed to fetch all payments for refund calculation',
        {
          component: 'balance-recalculation',
          action: 'all_payments_fetch_failed',
          metadata: { bookingId, error: allPaymentsError.message },
        },
        allPaymentsError
      );
      // Continue calculation with 0 for refunds
    }

    // Calculate total collected from all completed payments
    // CRITICAL: Only include payments with type='payment' (exclude deposits)
    // Manual payments don't have a type field, so we include all completed manual payments
    // Stripe payments are filtered by type in the query above
    const manualPaymentsTotal =
      (manualPayments ?? []).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0) || 0;
    const stripePaymentsTotal =
      (stripePayments ?? [])
        .filter((payment) => !payment.type || payment.type === 'payment') // Double-check: exclude deposits
        .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0) || 0;

    // Calculate total refunded (must subtract from total collected)
    const totalRefunded =
      (allPayments ?? [])
        .filter((payment) => !payment.type || payment.type === 'payment') // Exclude deposits
        .reduce((sum, payment) => sum + Number(payment.amountRefunded ?? 0), 0) || 0;

    // Total collected = payments - refunds
    const totalCollected = manualPaymentsTotal + stripePaymentsTotal - totalRefunded;

    // Log payment totals for debugging
    logger.debug('Payment totals calculated', {
      component: 'balance-recalculation',
      action: 'payment_totals',
      metadata: {
        bookingId,
        manualPaymentsCount: manualPayments?.length ?? 0,
        manualPaymentsTotal,
        stripePaymentsCount: stripePayments?.length ?? 0,
        stripePaymentsTotal,
        totalRefunded,
        totalCollected,
      },
    });

    // Calculate new balance: totalAmount - totalCollected
    // Deposit is NOT included - it's completely separate from the balance
    // If totalCollected exceeds totalAmount, balance is 0 (overpayment)
    const newBalance = Math.max(totalAmount - totalCollected, 0);

    // Track overpayment for logging (when customer paid more than owed)
    const overpayment = totalCollected > totalAmount ? totalCollected - totalAmount : 0;

    // Maximum possible balance is totalAmount (if no payments collected)
    const maxPossibleBalance = totalAmount;

    // Validation: balance should not exceed (totalAmount - depositAmount)
    if (newBalance > maxPossibleBalance) {
      logger.warn('Calculated balance exceeds maximum possible balance - capping', {
        component: 'balance-recalculation',
        action: 'balance_validation_warning',
        metadata: {
          bookingId,
          totalAmount,
          manualPaymentsTotal,
          stripePaymentsTotal,
          totalRefunded,
          totalCollected,
          calculatedBalance: newBalance,
          maxPossibleBalance,
          cappedBalance: maxPossibleBalance,
        },
      });
      // Cap at maxPossibleBalance (shouldn't happen, but safety check)
      const cappedBalance = Math.min(newBalance, maxPossibleBalance);
      // balance_amount is a computed field, use direct update with type assertion
      const { error: cappedUpdateError } = await serviceClient
        .from('bookings')
        .update({ balance_amount: cappedBalance } as never)
        .eq('id', bookingId);

      if (cappedUpdateError) {
        logger.error(
          'Failed to update booking balance (capped)',
          {
            component: 'balance-recalculation',
            action: 'balance_update_failed_capped',
            metadata: {
              bookingId,
              cappedBalance,
              totalAmount,
              manualPaymentsTotal,
              stripePaymentsTotal,
              totalRefunded,
              totalCollected,
              calculatedBalance: newBalance,
              maxPossibleBalance,
              error: cappedUpdateError.message,
            },
          },
          cappedUpdateError
        );
        return null; // Return null to indicate failure
      }

      logger.info('Balance updated successfully (capped)', {
        component: 'balance-recalculation',
        action: 'balance_updated_capped',
        metadata: {
          bookingId,
          cappedBalance,
          totalAmount,
          manualPaymentsTotal,
          stripePaymentsTotal,
          totalRefunded,
          totalCollected,
        },
      });

      return cappedBalance;
    }

    // Validation: prevent negative balances (unless refunds are explicitly allowed)
    if (newBalance < 0) {
      logger.warn('Calculated balance is negative - setting to 0', {
        component: 'balance-recalculation',
        action: 'negative_balance_prevented',
        metadata: {
          bookingId,
          totalAmount,
          manualPaymentsTotal,
          stripePaymentsTotal,
          totalRefunded,
          totalCollected,
          calculatedBalance: newBalance,
        },
      });
      // Already handled by Math.max above, but log for visibility
    }

    // Update booking balance
    // balance_amount is a computed field, use direct update with type assertion
    const { error: updateError } = await serviceClient
      .from('bookings')
      .update({ balance_amount: newBalance } as never)
      .eq('id', bookingId);

    if (updateError) {
      logger.error(
        'Failed to update booking balance',
        {
          component: 'balance-recalculation',
          action: 'balance_update_failed',
          metadata: {
            bookingId,
            newBalance,
            totalAmount,
            manualPaymentsTotal,
            stripePaymentsTotal,
            totalRefunded,
            totalCollected,
            error: updateError.message,
          },
        },
        updateError
      );
      return null;
    }

    const oldBalance = Number(currentBalanceAmount ?? 0) || totalAmount;

    logger.info('Booking balance recalculated successfully', {
      component: 'balance-recalculation',
      action: 'balance_recalculated',
      metadata: {
        bookingId,
        oldBalance,
        newBalance,
        totalAmount,
        manualPaymentsTotal,
        stripePaymentsTotal,
        totalRefunded,
        totalCollected,
        overpayment,
        balanceChange: newBalance - oldBalance,
        isPaidInFull: newBalance === 0,
      },
    });

    return newBalance;
  } catch (err) {
    logger.error(
      'Unexpected error recalculating booking balance',
      {
        component: 'balance-recalculation',
        action: 'recalculation_unexpected',
        metadata: {
          bookingId,
          errorName: err instanceof Error ? err.name : typeof err,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : undefined,
        },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return null;
  }
}
