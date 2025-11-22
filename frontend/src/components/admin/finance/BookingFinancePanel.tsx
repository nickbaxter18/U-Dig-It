import { format } from 'date-fns';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Loader2,
  PenSquare,
  PlusCircle,
  RefreshCcw,
  Wallet,
} from 'lucide-react';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createInstallmentSchedule,
  createManualPayment,
  fetchInstallmentSchedule,
  fetchLedgerEntries,
  listManualPayments,
  updateInstallmentStatus,
  updateManualPayment,
} from '@/lib/api/admin/payments';
import type {
  InstallmentRecord,
  LedgerEntryRecord,
  ManualPaymentRecord,
} from '@/lib/api/admin/payments';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
});

const methodLabels: Record<string, string> = {
  cash: 'Cash',
  ach: 'ACH / EFT',
  check: 'Cheque',
  pos: 'POS Terminal',
  other: 'Other',
};

interface BookingFinancePanelProps {
  bookingId: string;
  bookingNumber: string;
  customerId: string;
  customerName?: string;
  totalAmount: number;
  depositAmount?: number | null;
  balanceAmount?: number | null;
  billingStatus?: string | null;
  balanceDueAt?: string | null;
}

interface ManualPaymentFormState {
  amount: string;
  method: 'cash' | 'ach' | 'check' | 'pos' | 'other';
  receivedAt: string;
  notes: string;
}

interface InstallmentDraft {
  count: number;
  firstDueDate: string;
  frequencyDays: number;
}

interface StripePayment {
  amount: number;
  status: string;
}

function formatDate(iso?: string | null) {
  if (!iso) return 'N/A';
  try {
    return format(new Date(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

function manualPaymentStatusBadge(status: ManualPaymentRecord['status']) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'voided':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function installmentStatusBadge(status: InstallmentRecord['status']) {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-200 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function BookingFinancePanel(props: BookingFinancePanelProps) {
  const {
    bookingId,
    bookingNumber,
    customerId,
    customerName,
    totalAmount,
    depositAmount,
    balanceAmount,
    billingStatus,
    balanceDueAt,
  } = props;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualPayments, setManualPayments] = useState<ManualPaymentRecord[]>([]);
  const [installments, setInstallments] = useState<InstallmentRecord[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntryRecord[]>([]);
  const [stripePayments, setStripePayments] = useState<StripePayment[]>([]);
  const [creatingManualPayment, setCreatingManualPayment] = useState(false);
  const [updatingInstallment, setUpdatingInstallment] = useState<string | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [manualPaymentForm, setManualPaymentForm] = useState<ManualPaymentFormState>({
    amount: '',
    method: 'cash',
    receivedAt: '',
    notes: '',
  });
  const [installmentDraft, setInstallmentDraft] = useState<InstallmentDraft>({
    count: 3,
    firstDueDate: '',
    frequencyDays: 7,
  });
  const [creatingSchedule, setCreatingSchedule] = useState(false);

  const refreshFinance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Trigger balance recalculation in database to ensure it's in sync
      // This ensures the database balance_amount is accurate before we fetch data
      try {
        const recalcResponse = await fetch(`/api/admin/bookings/${bookingId}/recalculate-balance`, {
          method: 'POST',
        });
        if (!recalcResponse.ok) {
          logger.warn('Balance recalculation request failed', {
            component: 'BookingFinancePanel',
            action: 'balance_recalc_request_failed',
            metadata: { bookingId, status: recalcResponse.status },
          });
        }
      } catch (recalcError) {
        // Non-critical - continue with refresh even if recalculation fails
        logger.debug('Balance recalculation request error (non-critical)', {
          component: 'BookingFinancePanel',
          action: 'balance_recalc_request_error',
          metadata: { bookingId },
        });
      }

      const [manual, schedule, ledger] = await Promise.all([
        listManualPayments({ bookingId }),
        fetchInstallmentSchedule(bookingId),
        fetchLedgerEntries({ bookingId, limit: 50 }),
      ]);

      setManualPayments(manual);
      setInstallments(schedule);
      setLedgerEntries(ledger);

      // Fetch all Stripe payments for this booking (including pending/completed)
      // We filter by status in the useMemo to calculate completed payments
      const { data: stripeData, error: stripeError } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('bookingId', bookingId);

      if (stripeError) {
        logger.error(
          'Failed to fetch Stripe payments',
          {
            component: 'BookingFinancePanel',
            action: 'stripe_payments_fetch',
            metadata: { bookingId, error: stripeError.message },
          },
          stripeError
        );
        // Fallback to empty array - calculation will use 0 for Stripe payments
        setStripePayments([]);
      } else {
        const payments = ((stripeData ?? []) as unknown[]).map((payment: unknown) => ({
          amount: Number(payment.amount ?? 0),
          status: payment.status ?? 'pending',
        }));

        setStripePayments(payments);

        // Log payment fetch for debugging
        logger.debug('Stripe payments fetched', {
          component: 'BookingFinancePanel',
          action: 'stripe_payments_fetched',
          metadata: {
            bookingId,
            paymentCount: payments.length,
            totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
          },
        });
      }
    } catch (err) {
      logger.error(
        'Failed to load booking finance panel',
        { component: 'BookingFinancePanel', action: 'refresh_failed', metadata: { bookingId } },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    refreshFinance();
  }, [bookingId, refreshFinance]);

  const manualPaymentsCompleted = useMemo(
    () =>
      manualPayments
        .filter((payment) => payment.status === 'completed')
        .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
    [manualPayments]
  );

  const stripePaymentsCompleted = useMemo(
    () =>
      stripePayments
        .filter((payment) => payment.status === 'completed' || payment.status === 'succeeded')
        .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
    [stripePayments]
  );

  const totalCollected = manualPaymentsCompleted + stripePaymentsCompleted;

  /**
   * Calculate outstanding balance using the formula:
   * outstandingBalance = totalAmount - collected payments
   *
   * Important: The deposit is completely separate from the balance calculation.
   * Security deposits are held separately and do not reduce what the customer owes.
   *
   * This calculation is performed in real-time based on fetched payment data
   * to ensure accuracy. The database balance_amount is kept in sync via
   * recalculateBookingBalance() calls, but we prioritize the calculated value
   * here for immediate accuracy.
   */
  // Cap collected at totalAmount to prevent overpayment display issues
  const cappedCollected = Math.min(totalCollected, totalAmount);

  // Formula: balance = totalAmount - collected payments
  // Deposit is NOT included - it's completely separate
  const calculatedBalance = Math.max(totalAmount - cappedCollected, 0);

  // Always use calculated value for accuracy - it's based on real-time payment data
  // The database balance_amount is recalculated on refresh, but we show the calculated
  // value immediately for better UX
  const outstandingBalance = calculatedBalance;

  const nextInstallment = useMemo(() => {
    const upcoming = installments
      .filter((installment) => installment.status === 'pending')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [installments]);

  const handleManualPaymentChange = (field: keyof ManualPaymentFormState, value: string) => {
    setManualPaymentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateManualPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingManualPayment(true);
    setError(null);

    try {
      const amountValue = Number.parseFloat(manualPaymentForm.amount);
      if (Number.isNaN(amountValue) || amountValue <= 0) {
        throw new Error('Please enter a valid payment amount.');
      }

      await createManualPayment({
        bookingId,
        customerId,
        amount: amountValue,
        currency: 'cad',
        method: manualPaymentForm.method,
        receivedAt: manualPaymentForm.receivedAt || undefined,
        notes: manualPaymentForm.notes || undefined,
      });

      setManualPaymentForm({
        amount: '',
        method: manualPaymentForm.method,
        receivedAt: '',
        notes: '',
      });
      await refreshFinance();
    } catch (err) {
      logger.error(
        'Failed to record manual payment',
        {
          component: 'BookingFinancePanel',
          action: 'manual_payment_create',
          metadata: { bookingId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Unable to record manual payment');
    } finally {
      setCreatingManualPayment(false);
    }
  };

  const handleCompleteManualPayment = async (manualPaymentId: string) => {
    try {
      await updateManualPayment(manualPaymentId, { status: 'completed' });
      await refreshFinance();
    } catch (err) {
      logger.error(
        'Failed to update manual payment status',
        {
          component: 'BookingFinancePanel',
          action: 'manual_payment_update',
          metadata: { manualPaymentId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Unable to update manual payment');
    }
  };

  const handleCreateInstallmentSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!installmentDraft.firstDueDate) {
      setError('Select a due date for the first installment');
      return;
    }

    const count = Math.max(1, installmentDraft.count);
    const frequency = Math.max(1, installmentDraft.frequencyDays);
    const balanceToSchedule = outstandingBalance;

    if (balanceToSchedule <= 0) {
      setError('Outstanding balance is already settled.');
      return;
    }

    setCreatingSchedule(true);
    setError(null);

    try {
      const baseAmount = Math.round((balanceToSchedule / count) * 100) / 100;
      const installmentsPayload = Array.from({ length: count }).map((_, index) => {
        const dueDate = new Date(installmentDraft.firstDueDate);
        dueDate.setDate(dueDate.getDate() + index * frequency);

        const amount =
          index === count - 1
            ? Math.round((balanceToSchedule - baseAmount * (count - 1)) * 100) / 100
            : baseAmount;

        return {
          dueDate: dueDate.toISOString(),
          amount,
        };
      });

      await createInstallmentSchedule(bookingId, {
        installments: installmentsPayload,
      });

      await refreshFinance();
    } catch (err) {
      logger.error(
        'Failed to create installment schedule',
        {
          component: 'BookingFinancePanel',
          action: 'installment_schedule_create',
          metadata: { bookingId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Unable to create installment schedule');
    } finally {
      setCreatingSchedule(false);
    }
  };

  const handleMarkInstallmentPaid = async (installment: InstallmentRecord) => {
    setUpdatingInstallment(installment.id);
    try {
      await updateInstallmentStatus(installment.id, {
        status: 'paid',
        paidAt: new Date().toISOString(),
      });
      await refreshFinance();
    } catch (err) {
      logger.error(
        'Failed to update installment status',
        {
          component: 'BookingFinancePanel',
          action: 'installment_status_update',
          metadata: { installmentId: installment.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Unable to update installment');
    } finally {
      setUpdatingInstallment(null);
    }
  };

  const handleCreateStripeInvoice = async () => {
    if (outstandingBalance <= 0) {
      setError('No outstanding balance to invoice');
      return;
    }

    setCreatingInvoice(true);
    setError(null);

    try {
      logger.info('Creating Stripe invoice for remaining balance', {
        component: 'BookingFinancePanel',
        action: 'create_stripe_invoice',
        metadata: { bookingId, outstandingBalance },
      });

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          paymentType: 'invoice',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create Stripe invoice');
      }

      const { sessionUrl } = await response.json();

      if (sessionUrl) {
        // Open Stripe checkout in new window
        window.open(sessionUrl, '_blank', 'noopener,noreferrer');
        logger.info('Stripe invoice checkout opened', {
          component: 'BookingFinancePanel',
          action: 'stripe_invoice_opened',
          metadata: { bookingId },
        });
      } else {
        throw new Error('No checkout session URL returned');
      }
    } catch (err) {
      logger.error(
        'Failed to create Stripe invoice',
        {
          component: 'BookingFinancePanel',
          action: 'create_stripe_invoice_failed',
          metadata: { bookingId, outstandingBalance },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Unable to create Stripe invoice');
    } finally {
      setCreatingInvoice(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Finance Overview</h2>
            <p className="text-sm text-gray-600">
              Booking {bookingNumber} • {customerName ?? 'Customer'}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshFinance}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Contract</span>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
              {currencyFormatter.format(totalAmount)}
            </div>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Collected</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-green-700">
              {currencyFormatter.format(totalCollected)}
            </div>
            <p className="text-xs text-gray-500">
              Stripe: {currencyFormatter.format(stripePaymentsCompleted)} • Manual:{' '}
              {currencyFormatter.format(manualPaymentsCompleted)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Outstanding</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-red-600">
              {currencyFormatter.format(outstandingBalance)}
            </div>
            <p className="text-xs text-gray-500">
              Balance due {balanceDueAt ? formatDate(balanceDueAt) : 'N/A'}
            </p>
            {outstandingBalance > 0 && (
              <button
                type="button"
                onClick={handleCreateStripeInvoice}
                disabled={creatingInvoice}
                className="mt-3 w-full rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingInvoice ? (
                  <>
                    <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-1 inline h-3 w-3" />
                    Create Stripe Invoice
                  </>
                )}
              </button>
            )}
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Billing Status</span>
              <Wallet className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 rounded-full bg-blue-100 px-3 py-1 text-center text-sm font-medium text-blue-700">
              {(billingStatus ?? 'Pending').replace('_', ' ')}
            </div>
            {nextInstallment && (
              <p className="mt-2 text-xs text-gray-500">
                Next installment {formatDate(nextInstallment.due_date)} (
                {currencyFormatter.format(nextInstallment.amount)})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Manual Payments */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Manual Payments</h3>
            <p className="text-sm text-gray-600">
              Record cash, cheque, or ACH payments collected outside Stripe.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreateManualPayment}
          className="grid grid-cols-1 gap-4 rounded-md border border-gray-100 bg-gray-50 p-4 md:grid-cols-5"
        >
          <div className="md:col-span-1">
            <label
              htmlFor="manual-amount"
              className="block text-xs font-medium uppercase text-gray-500"
            >
              Amount (CAD)
            </label>
            <input
              id="manual-amount"
              type="number"
              step="0.01"
              min="0"
              required
              value={manualPaymentForm.amount}
              onChange={(event) => handleManualPaymentChange('amount', event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="md:col-span-1">
            <label
              htmlFor="manual-method"
              className="block text-xs font-medium uppercase text-gray-500"
            >
              Method
            </label>
            <select
              id="manual-method"
              value={manualPaymentForm.method}
              onChange={(event) =>
                handleManualPaymentChange(
                  'method',
                  event.target.value as ManualPaymentFormState['method']
                )
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {Object.entries(methodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label
              htmlFor="manual-received"
              className="block text-xs font-medium uppercase text-gray-500"
            >
              Received Date
            </label>
            <input
              id="manual-received"
              type="date"
              value={manualPaymentForm.receivedAt}
              onChange={(event) => handleManualPaymentChange('receivedAt', event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="manual-notes"
              className="block text-xs font-medium uppercase text-gray-500"
            >
              Notes
            </label>
            <input
              id="manual-notes"
              type="text"
              value={manualPaymentForm.notes}
              onChange={(event) => handleManualPaymentChange('notes', event.target.value)}
              placeholder="Receipt number, reference, etc."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="md:col-span-5 flex justify-end">
            <button
              type="submit"
              disabled={creatingManualPayment}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {creatingManualPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Record Manual Payment
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Recorded
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Method
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Notes
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {manualPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(payment.received_at ?? payment.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {methodLabels[payment.method] ?? payment.method}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {currencyFormatter.format(Number(payment.amount ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${manualPaymentStatusBadge(payment.status)}`}
                    >
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{payment.notes ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    {payment.status !== 'completed' ? (
                      <button
                        type="button"
                        onClick={() => handleCompleteManualPayment(payment.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-green-200 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Mark Completed
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
              {manualPayments.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No manual payments recorded yet.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading finance data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Installment Schedule */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Installment Schedule</h3>
            <p className="text-sm text-gray-600">
              Split outstanding balance into automated installment reminders.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreateInstallmentSchedule}
          className="grid grid-cols-1 gap-4 rounded-md border border-gray-100 bg-gray-50 p-4 md:grid-cols-4"
        >
          <div>
            <label
              htmlFor="installment-count"
              className="block text-xs font-medium uppercase text-gray-500"
            >
              Installments
            </label>
            <input
              id="installment-count"
              type="number"
              min={1}
              value={installmentDraft.count}
              onChange={(event) =>
                setInstallmentDraft((prev) => ({
                  ...prev,
                  count: Number.parseInt(event.target.value, 10) || 1,
                }))
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label
              htmlFor="installment-first"
              className="block text-xs font-medium uppercase text-gray-500"
            >
              First Due Date
            </label>
            <input
              id="installment-first"
              type="date"
              required
              value={installmentDraft.firstDueDate}
              onChange={(event) =>
                setInstallmentDraft((prev) => ({
                  ...prev,
                  firstDueDate: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label
              htmlFor="installment-frequency"
              className="block text-xs font-medium uppercase text-gray-500"
            >
              Frequency (days)
            </label>
            <input
              id="installment-frequency"
              type="number"
              min={1}
              value={installmentDraft.frequencyDays}
              onChange={(event) =>
                setInstallmentDraft((prev) => ({
                  ...prev,
                  frequencyDays: Number.parseInt(event.target.value, 10) || 7,
                }))
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-end justify-end">
            <button
              type="submit"
              disabled={creatingSchedule}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60"
            >
              {creatingSchedule ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving schedule...
                </>
              ) : (
                <>
                  <PenSquare className="h-4 w-4" />
                  Save Schedule
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Installment
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Due Date
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Status
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {installments.map((installment) => (
                <tr key={installment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    #{installment.installment_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(installment.due_date)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {currencyFormatter.format(Number(installment.amount ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${installmentStatusBadge(installment.status)}`}
                    >
                      {installment.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {installment.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleMarkInstallmentPaid(installment)}
                        disabled={updatingInstallment === installment.id}
                        className="inline-flex items-center gap-1 rounded-md border border-green-200 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        {updatingInstallment === installment.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Mark Paid
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
              {installments.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No installments scheduled. Create a plan to split the outstanding balance.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading installment schedule...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ledger Timeline */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Ledger Timeline</h3>
        <p className="text-sm text-gray-600">
          Immutable record of all financial entries associated with this booking.
        </p>

        <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Timestamp
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Source
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Description
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {ledgerEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(entry.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {entry.entry_type.replace('_', ' ').toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.source ?? 'system'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.description ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {currencyFormatter.format(Number(entry.amount ?? 0))}
                  </td>
                </tr>
              ))}
              {ledgerEntries.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No ledger entries yet. Entries will appear as payments, refunds, or adjustments
                    are recorded.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading ledger entries...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
