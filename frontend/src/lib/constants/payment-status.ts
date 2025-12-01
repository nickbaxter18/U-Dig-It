/**
 * Payment Status Constants
 * Centralized constants for payment status values to ensure consistency across the application
 */

export const PAYMENT_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  PROCESSING: 'processing',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
} as const;

/**
 * Payment statuses that indicate a successful/completed payment
 * Used for balance calculations and revenue reporting
 *
 * NOTE: Only 'completed' is valid - 'succeeded' does not exist in the payments_status_enum
 */
export const COMPLETED_PAYMENT_STATUSES = [
  PAYMENT_STATUS.COMPLETED,
] as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

