import { COMPLETED_PAYMENT_STATUSES, PAYMENT_STATUS } from '@/lib/constants/payment-status';
import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Updates the booking billing_status based on payment state and balance.
 *
 * **Billing Status Values:**
 * - `pending`: No payments received, balance = totalAmount
 * - `deposit_paid`: Deposit received but balance > 0
 * - `balance_paid`: Balance is 0 (all payments complete)
 * - `overdue`: Balance > 0 and past `balance_due_at` date
 *
 * **When Billing Status is Updated:**
 * - After manual payment creation/update (if status = 'completed')
 * - After Stripe payment completion (webhook handlers)
 * - After balance recalculation
 * - When finance panel is refreshed
 *
 * **Logic:**
 * 1. Fetch booking: `totalAmount`, `depositAmount`, `balance_amount`, `balance_due_at`
 * 2. Fetch all completed payments (Stripe + manual)
 * 3. Calculate new `billing_status` based on payment state and dates
 * 4. Update `bookings.billing_status` column
 * 5. Return new status for logging
 *
 * @param bookingId - The booking ID to update billing status for
 * @returns The new billing status, or null if update failed
 *
 * @example
 * ```typescript
 * // Update billing status after payment
 * const newStatus = await updateBillingStatus(bookingId);
 * if (newStatus !== null) {
 *   console.log(`Updated billing status: ${newStatus}`);
 * }
 * ```
 */
export async function updateBillingStatus(bookingId: string): Promise<string | null> {
  const serviceClient = await createServiceClient();

  if (!serviceClient) {
    logger.error('Service client not available for billing status update', {
      component: 'billing-status-update',
      action: 'service_client_unavailable',
      metadata: { bookingId },
    });
    return null;
  }

  try {
    // Fetch booking details
    const { data: booking, error: bookingError } = await serviceClient
      .from('bookings')
      .select('id, totalAmount, depositAmount, balance_amount, balance_due_at, billing_status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      logger.error(
        'Failed to fetch booking for billing status update',
        {
          component: 'billing-status-update',
          action: 'booking_fetch_failed',
          metadata: { bookingId, error: bookingError?.message },
        },
        bookingError ?? new Error('Booking not found')
      );
      return null;
    }

    const totalAmount = Number(booking.totalAmount ?? 0);
    const depositAmount = Number(booking.depositAmount ?? 0);
    const balanceAmount = Number(booking.balance_amount ?? totalAmount);
    const balanceDueAt = booking.balance_due_at ? new Date(booking.balance_due_at) : null;
    const currentBillingStatus = booking.billing_status;

    // Fetch all completed payments to determine payment state
    // Note: payments table doesn't have deleted_at column, so we don't filter by it
    const [manualPaymentsResult, stripePaymentsResult, depositPaymentsResult] = await Promise.all([
      serviceClient
        .from('manual_payments')
        .select('id, amount, status')
        .eq('booking_id', bookingId)
        .eq('status', PAYMENT_STATUS.COMPLETED)
        .is('deleted_at', null),
      serviceClient
        .from('payments')
        .select('id, amount, status, type')
        .eq('bookingId', bookingId)
        .in('status', COMPLETED_PAYMENT_STATUSES)
        .or('and(type.is.null),and(type.eq.payment)'), // Grouped OR: (type IS NULL) OR (type = 'payment'), ANDed with status filter
      serviceClient
        .from('payments')
        .select('id, type')
        .eq('bookingId', bookingId)
        .eq('type', 'deposit')
        .in('status', COMPLETED_PAYMENT_STATUSES), // Check if deposit is paid
    ]);

    const manualPayments = manualPaymentsResult.data ?? [];
    const stripePayments = stripePaymentsResult.data ?? [];

    // Check if deposit has been paid (look for deposit payments separately)
    const depositPaid = (depositPaymentsResult.data ?? []).length > 0;

    // Calculate new billing status
    let newBillingStatus: string;

    if (balanceAmount <= 0) {
      // Balance is 0 or negative - all payments complete
      newBillingStatus = 'balance_paid';
    } else if (balanceDueAt && new Date() > balanceDueAt) {
      // Balance is overdue
      newBillingStatus = 'overdue';
    } else if (depositPaid && balanceAmount > 0) {
      // Deposit paid but balance remains
      newBillingStatus = 'deposit_paid';
    } else {
      // No payments or partial payments, not overdue
      newBillingStatus = 'pending';
    }

    // Only update if status changed
    if (currentBillingStatus === newBillingStatus) {
      logger.debug('Billing status unchanged', {
        component: 'billing-status-update',
        action: 'status_unchanged',
        metadata: {
          bookingId,
          billingStatus: newBillingStatus,
        },
      });
      return newBillingStatus;
    }

    // Update booking billing_status
    const { error: updateError } = await serviceClient
      .from('bookings')
      .update({ billing_status: newBillingStatus })
      .eq('id', bookingId);

    if (updateError) {
      logger.error(
        'Failed to update booking billing status',
        {
          component: 'billing-status-update',
          action: 'status_update_failed',
          metadata: {
            bookingId,
            newBillingStatus,
            oldBillingStatus: currentBillingStatus,
            error: updateError.message,
          },
        },
        updateError
      );
      return null;
    }

    logger.info('Booking billing status updated successfully', {
      component: 'billing-status-update',
      action: 'status_updated',
      metadata: {
        bookingId,
        oldBillingStatus: currentBillingStatus,
        newBillingStatus,
        totalAmount,
        depositAmount,
        balanceAmount,
        balanceDueAt: balanceDueAt?.toISOString() ?? null,
        manualPaymentsCount: manualPayments.length,
        stripePaymentsCount: stripePayments.length,
      },
    });

    return newBillingStatus;
  } catch (err) {
    logger.error(
      'Unexpected error updating billing status',
      {
        component: 'billing-status-update',
        action: 'update_unexpected',
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
