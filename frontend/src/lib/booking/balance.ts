import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Recalculates the booking balance_amount based on all completed payments.
 *
 * **Balance Calculation Formula:**
 * ```
 * balance_amount = totalAmount - sum(all_completed_payments)
 * ```
 *
 * Where:
 * - `totalAmount`: The total contract amount for the booking
 * - `all_completed_payments`: Sum of all completed manual payments + completed Stripe payments
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
 * - Stripe payments: From `payments` table (status IN ('completed', 'succeeded'))
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
  const serviceClient = createServiceClient();

  if (!serviceClient) {
    logger.error('Service client not available for balance recalculation', {
      component: 'balance-recalculation',
      action: 'service_client_unavailable',
      metadata: { bookingId },
    });
    return null;
  }

  try {
    // Fetch booking details
    const { data: booking, error: bookingError } = await serviceClient
      .from('bookings')
      .select('id, totalAmount, balance_amount')
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

    const totalAmount = Number(booking.totalAmount ?? 0);

    // Log initial values for debugging
    logger.debug('Starting balance recalculation', {
      component: 'balance-recalculation',
      action: 'recalculation_start',
      metadata: {
        bookingId,
        totalAmount,
        currentBalanceAmount: (booking as any).balance_amount ?? null,
      },
    });

    // Fetch all completed manual payments for this booking
    const { data: manualPayments, error: manualPaymentsError } = await serviceClient
      .from('manual_payments')
      .select('id, amount, status')
      .eq('booking_id', bookingId)
      .eq('status', 'completed')
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
    const { data: stripePayments, error: stripePaymentsError } = await serviceClient
      .from('payments')
      .select('id, amount, status')
      .eq('bookingId', bookingId)
      .in('status', ['completed', 'succeeded'])
      .is('deleted_at', null);

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

    // Calculate total collected from all completed payments
    const manualPaymentsTotal =
      (manualPayments ?? []).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0) || 0;
    const stripePaymentsTotal =
      (stripePayments ?? []).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0) || 0;
    const totalCollected = manualPaymentsTotal + stripePaymentsTotal;

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
        totalCollected,
      },
    });

    // Calculate new balance: totalAmount - totalCollected
    // Deposit is NOT included - it's completely separate from the balance
    const newBalance = Math.max(totalAmount - totalCollected, 0);

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
          totalCollected,
          calculatedBalance: newBalance,
          maxPossibleBalance,
          cappedBalance: maxPossibleBalance,
        },
      });
      // Cap at maxPossibleBalance (shouldn't happen, but safety check)
      const cappedBalance = Math.min(newBalance, maxPossibleBalance);
      await serviceClient
        .from('bookings')
        .update({ balance_amount: cappedBalance })
        .eq('id', bookingId);
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
          totalCollected,
          calculatedBalance: newBalance,
        },
      });
      // Already handled by Math.max above, but log for visibility
    }

    // Update booking balance
    const { error: updateError } = await serviceClient
      .from('bookings')
      .update({ balance_amount: newBalance })
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
            totalCollected,
            error: updateError.message,
          },
        },
        updateError
      );
      return null;
    }

    const oldBalance = Number((booking as any).balance_amount ?? 0) || totalAmount;

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
        totalCollected,
        balanceChange: newBalance - oldBalance,
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
