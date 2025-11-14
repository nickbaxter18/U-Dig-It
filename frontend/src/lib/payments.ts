/**
 * Payment utilities shared across booking management components.
 */

type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | string;

export type PaymentRecord = {
  id: string;
  type?: string | null;
  status?: PaymentStatus | null;
  processedAt?: string | null;
  processed_at?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
};

/**
 * Booking statuses that indicate the invoice portion has been paid.
 */
const PAID_BOOKING_STATUSES = new Set(['paid', 'confirmed', 'active', 'completed']);

function getStatusPriority(status?: PaymentStatus | null): number {
  switch ((status || '').toLowerCase()) {
    case 'completed':
      return 4;
    case 'processing':
      return 3;
    case 'pending':
      return 2;
    case 'refunded':
      return 1;
    case 'failed':
      return 0;
    default:
      return -1;
  }
}

function getTimestamp(record: PaymentRecord): number {
  const raw =
    record.processedAt ??
    record.processed_at ??
    record.createdAt ??
    record.created_at ??
    null;

  if (!raw) {
    return 0;
  }

  const timestamp = Date.parse(raw);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/**
 * Selects the most relevant payment for display and status checks.
 * Preference order:
 *   1. Completed payments
 *   2. Processing payments
 *   3. Pending payments (most recent)
 *   4. Failed/refunded payments (most recent)
 */
export function selectRelevantPayment<T extends PaymentRecord>(
  payments: T[] | null | undefined,
  type: 'payment' | 'deposit'
): T | undefined {
  if (!Array.isArray(payments) || payments.length === 0) {
    return undefined;
  }

  const relevant = payments.filter((entry) => entry?.type === type);

  if (relevant.length === 0) {
    return undefined;
  }

  return relevant
    .slice()
    .sort((a, b) => {
      const statusDiff = getStatusPriority(b.status) - getStatusPriority(a.status);
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return getTimestamp(b) - getTimestamp(a);
    })[0];
}

/**
 * Determines whether the booking status implies the invoice has been paid.
 */
export function isBookingStatusConsideredPaid(status?: string | null): boolean {
  if (!status) {
    return false;
  }

  return PAID_BOOKING_STATUSES.has(status.toLowerCase());
}


