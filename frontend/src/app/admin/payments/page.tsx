'use client';

import { DisputesSection } from '@/components/admin/DisputesSection';
import { FinancialReportsSection } from '@/components/admin/FinancialReportsSection';
import { RefundModal } from '@/components/admin/RefundModal';
import { AdvancedFilters, type DateRange } from '@/components/admin/AdvancedFilters';
import {
  listManualPayments,
  updateManualPayment,
  fetchLedgerEntries,
  fetchPayoutReconciliations,
  triggerPayoutReconciliation,
  updatePayoutReconciliation,
  requestFinancialExport,
  listFinancialExports,
} from '@/lib/api/admin/payments';
import type {
  FinancialExportRecord,
  LedgerEntryRecord,
  ManualPaymentRecord,
  PayoutReconciliationRecord,
} from '@/lib/api/admin/payments';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

interface Payment {
  id: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod: 'card' | 'bank_transfer' | 'cash' | 'check';
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  createdAt: Date;
  processedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string | null;
  amountRefundedToDate?: number;
  failureReason?: string;
}

interface UpcomingInstallment {
  id: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  dueDate: string;
  amount: number;
  status: string;
}

const formatDateTime = (value?: string | null, withTime = false) => {
  if (!value) return 'N/A';
  try {
    const date = new Date(value);
    return withTime ? format(date, 'MMM d, yyyy • h:mm a') : format(date, 'MMM d, yyyy');
  } catch {
    return value;
  }
};

const manualPaymentBadge = (status: ManualPaymentRecord['status']) => {
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
};

const payoutStatusBadge = (status: PayoutReconciliationRecord['status']) => {
  switch (status) {
    case 'reconciled':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'discrepancy':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [stripeLinkLoadingId, setStripeLinkLoadingId] = useState<string | null>(null);
  const [manualPaymentsAdmin, setManualPaymentsAdmin] = useState<ManualPaymentRecord[]>([]);
  const [manualPaymentsLoading, setManualPaymentsLoading] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntryRecord[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [payouts, setPayouts] = useState<PayoutReconciliationRecord[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [exportsList, setExportsList] = useState<FinancialExportRecord[]>([]);
  const [exportsLoading, setExportsLoading] = useState(false);
  const [exportType, setExportType] = useState<
    'payments_summary' | 'manual_payments' | 'accounts_receivable' | 'payout_summary'
  >('payments_summary');
  const [exportSubmitting, setExportSubmitting] = useState(false);
  const [upcomingInstallments, setUpcomingInstallments] = useState<UpcomingInstallment[]>([]);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<{
    dateRange?: DateRange;
    operators?: any[];
    multiSelects?: Record<string, string[]>;
  }>({});

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, searchTerm, dateFilter]);

  useEffect(() => {
    loadManualPayments();
    loadLedgerEntries();
    loadPayouts();
    loadExports();
    loadUpcomingInstallments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // MIGRATED: Fetch payments from Supabase
      let query = supabase.from('payments').select(`
          id,
          amount,
          "amountRefunded",
          "stripePaymentIntentId",
          "stripeCheckoutSessionId",
          "processedAt",
          "failedAt",
          "failureReason",
          "createdAt",
          "refundedAt",
          "refundReason",
          type,
          status,
          method,
          booking:bookingId (
            id,
            bookingNumber,
            customer:customerId (
              id,
              firstName,
              lastName,
              email
            )
          )
        `);

      // Apply status filter
      if (statusFilter !== 'all') {
        // Map frontend status to database status
        const statusMap: { [key: string]: string } = {
          succeeded: 'completed',
          pending: 'pending',
          failed: 'failed',
          refunded: 'refunded',
          partially_refunded: 'partially_refunded',
        };
        const dbStatus = statusMap[statusFilter] || statusFilter;
        query = query.eq('status', dbStatus);
      }

      // Apply search filter
      if (searchTerm) {
        // Search in payment number (ID substring) - we'll filter client-side for booking number
        query = query.or(`id.ilike.%${searchTerm}%`);
      }

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte('createdAt', startDate.toISOString());
      }

      const { data, error: queryError } = await query.order('createdAt', { ascending: false });

      if (queryError) throw queryError;

      // Transform Supabase data to Payment interface
      const paymentsData: Payment[] = (data || []).map((payment: any) => {
        const firstName = payment.booking?.customer?.firstName || '';
        const lastName = payment.booking?.customer?.lastName || '';
        const customerName =
          `${firstName} ${lastName}`.trim() ||
          payment.booking?.customer?.email ||
          'Unknown Customer';

        // Map database status to frontend status
        let frontendStatus: Payment['status'] = 'pending';
        switch (payment.status) {
          case 'completed':
            frontendStatus = 'succeeded';
            break;
          case 'pending':
          case 'processing':
            frontendStatus = 'pending';
            break;
          case 'failed':
          case 'cancelled':
            frontendStatus = 'failed';
            break;
          case 'refunded':
            frontendStatus = 'refunded';
            break;
          case 'partially_refunded':
            frontendStatus = 'partially_refunded';
            break;
        }

        // Map database payment method to frontend format
        let paymentMethod: Payment['paymentMethod'] = 'card';
        switch (payment.method) {
          case 'credit_card':
          case 'debit_card':
            paymentMethod = 'card';
            break;
          case 'bank_transfer':
            paymentMethod = 'bank_transfer';
            break;
          case 'cash':
            paymentMethod = 'cash';
            break;
          case 'check':
            paymentMethod = 'check';
            break;
        }

        return {
          id: payment.id,
          bookingId: payment.booking?.id || '',
          bookingNumber: payment.booking?.bookingNumber || 'N/A',
          customerName,
          amount: parseFloat(payment.amount || '0'),
          status: frontendStatus,
          paymentMethod,
          stripePaymentIntentId: payment.stripePaymentIntentId,
          stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
          createdAt: new Date(payment.createdAt),
          processedAt: payment.processedAt ? new Date(payment.processedAt) : undefined,
          refundedAt: payment.refundedAt
            ? new Date(payment.refundedAt)
            : payment.failedAt &&
              (payment.status === 'refunded' || payment.status === 'partially_refunded')
              ? new Date(payment.failedAt)
              : undefined,
          refundAmount: parseFloat(payment.amountRefunded || '0'),
          refundReason: payment.refundReason,
          amountRefundedToDate: parseFloat(payment.amountRefunded || '0'),
          failureReason: payment.failureReason,
        };
      });

      // Client-side filter by booking number if search term provided
      const filtered = searchTerm
        ? paymentsData.filter(
            p =>
              p.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.id.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : paymentsData;

      setPayments(filtered);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to fetch payments:', { component: 'app-page', action: 'error' }, err instanceof Error ? err : new Error(String(err)));
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
      setPayments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadManualPayments = async () => {
    try {
      setManualPaymentsLoading(true);
      const data = await listManualPayments();
      setManualPaymentsAdmin(data);
    } catch (err) {
      logger.error(
        'Failed to fetch manual payments',
        { component: 'payments-page', action: 'manual_payments_fetch' },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setManualPaymentsLoading(false);
    }
  };

  const loadLedgerEntries = async () => {
    try {
      setLedgerLoading(true);
      const data = await fetchLedgerEntries({ limit: 25 });
      setLedgerEntries(data);
    } catch (err) {
      logger.error(
        'Failed to fetch ledger entries',
        { component: 'payments-page', action: 'ledger_fetch' },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setLedgerLoading(false);
    }
  };

  const loadPayouts = async () => {
    try {
      setPayoutsLoading(true);
      const data = await fetchPayoutReconciliations({ limit: 25 });
      setPayouts(data);
    } catch (err) {
      logger.error(
        'Failed to fetch payout reconciliations',
        { component: 'payments-page', action: 'reconciliation_fetch' },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setPayoutsLoading(false);
    }
  };

  const loadExports = async () => {
    try {
      setExportsLoading(true);
      const data = await listFinancialExports({ limit: 20 });
      setExportsList(data);
    } catch (err) {
      logger.error(
        'Failed to fetch financial exports',
        { component: 'payments-page', action: 'exports_fetch' },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setExportsLoading(false);
    }
  };

  const loadUpcomingInstallments = async () => {
    try {
      setInstallmentsLoading(true);
      const { data, error: upcomingError } = await supabase
        .from('installment_schedules')
        .select(
          `
          id,
          booking_id,
          due_date,
          amount,
          status,
          booking:booking_id (
            bookingNumber,
            customer:customerId (
              firstName,
              lastName
            )
          )
        `
        )
        .eq('status', 'pending')
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(20);

      if (upcomingError) throw upcomingError;

      const rows: UpcomingInstallment[] = (data ?? []).map((row: any) => ({
        id: row.id,
        bookingId: row.booking_id,
        bookingNumber: row.booking?.bookingNumber ?? row.booking_id,
        customerName: `${row.booking?.customer?.firstName ?? ''} ${
          row.booking?.customer?.lastName ?? ''
        }`.trim(),
        dueDate: row.due_date,
        amount: Number(row.amount ?? 0),
        status: row.status,
      }));

      setUpcomingInstallments(rows);
    } catch (err) {
      logger.error(
        'Failed to fetch upcoming installments',
        { component: 'payments-page', action: 'installments_fetch' },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setInstallmentsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'partially_refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'refunded':
      case 'partially_refunded':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = new Date();
      const paymentDate = new Date(payment.createdAt);

      switch (dateFilter) {
        case 'today':
          matchesDate = paymentDate.toDateString() === now.toDateString();
          break;
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= weekAgo;
          break;
        }
        case 'month': {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= monthAgo;
          break;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleExportPayments = () => {
    if (filteredPayments.length === 0) {
      return;
    }

    const header = [
      'Payment ID',
      'Booking Number',
      'Customer',
      'Amount',
      'Amount Refunded',
      'Status',
      'Payment Method',
      'Created At',
      'Processed At',
      'Refunded At',
      'Refund Reason',
    ];

    const rows = filteredPayments.map(payment => [
      payment.id,
      payment.bookingNumber,
      payment.customerName,
      payment.amount.toFixed(2),
      (payment.refundAmount ?? 0).toFixed(2),
      payment.status,
      payment.paymentMethod,
      payment.createdAt.toISOString(),
      payment.processedAt ? payment.processedAt.toISOString() : '',
      payment.refundedAt ? payment.refundedAt.toISOString() : '',
      payment.refundReason ?? '',
    ]);

    const csvContent = [header, ...rows]
      .map(row =>
        row
          .map(value => {
            const needsEscaping = /[",\n]/.test(value);
            if (needsEscaping) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      if (!payment?.id) {
        alert('Unable to download receipt: missing payment ID.');
        return;
      }

      const response = await fetchWithAuth(`/api/admin/payments/receipt/${payment.id}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${payment.bookingNumber}.html`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download receipt');
    }
  };

  const handleViewReceipt = (payment: Payment) => {
    if (!payment?.id) {
      alert('Unable to open receipt: missing payment ID.');
      return;
    }

    const viewUrl = `/api/admin/payments/receipt/${payment.id}?mode=inline`;
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleViewInStripe = async (payment: Payment) => {
    if (!payment.stripePaymentIntentId && !payment.stripeCheckoutSessionId) {
      alert('No Stripe Payment Intent or Checkout Session ID available for this payment.');
      return;
    }

    try {
      setStripeLinkLoadingId(payment.id);
      const response = await fetchWithAuth(
        `/api/admin/payments/stripe/link?paymentId=${payment.id}`,
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to generate Stripe dashboard link');
      }
      const { url } = await response.json();
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('Stripe dashboard link was not provided');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open Stripe dashboard');
    } finally {
      setStripeLinkLoadingId(null);
    }
  };

  const handleCompleteManualPayment = async (manualPaymentId: string) => {
    try {
      await updateManualPayment(manualPaymentId, { status: 'completed' });
      await loadManualPayments();
    } catch (err: any) {
      alert(err.message ?? 'Failed to update manual payment');
    }
  };

  const handleTriggerReconciliation = async () => {
    try {
      setPayoutsLoading(true);
      await triggerPayoutReconciliation();
      await loadPayouts();
    } catch (err: any) {
      alert(err.message ?? 'Failed to trigger Stripe reconciliation');
    } finally {
      setPayoutsLoading(false);
    }
  };

  const handleUpdatePayoutStatus = async (
    payout: PayoutReconciliationRecord,
    status: 'reconciled' | 'discrepancy'
  ) => {
    try {
      let notes: string | undefined;
      if (status === 'discrepancy') {
        notes = window.prompt('Describe the discrepancy for this payout.') ?? undefined;
      }
      await updatePayoutReconciliation(payout.stripe_payout_id, { status, notes });
      await loadPayouts();
    } catch (err: any) {
      alert(err.message ?? 'Failed to update payout reconciliation');
    }
  };

  const handleGenerateExport = async () => {
    try {
      setExportSubmitting(true);
      const response = await requestFinancialExport({
        exportType,
        filters: {
          dateFilter,
          statusFilter,
        },
      });
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank', 'noopener,noreferrer');
      }
      await loadExports();
    } catch (err: any) {
      alert(err.message ?? 'Failed to generate export');
    } finally {
      setExportSubmitting(false);
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum: any, p: any) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum: any, p: any) => sum + p.amount, 0);

  const refundedAmount = payments
    .filter(p => p.status === 'refunded' || p.status === 'partially_refunded')
    .reduce((sum: any, p: any) => sum + (p.refundAmount || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">
            Monitor payment transactions, process refunds, and track financial performance.
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading payments</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disputes Section (if any) */}
      <DisputesSection />

      {/* Advanced Filters */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <AdvancedFilters
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          availableFields={[
            { label: 'Payment ID', value: 'id', type: 'text' },
            { label: 'Booking Number', value: 'bookingNumber', type: 'text' },
            { label: 'Customer Name', value: 'customerName', type: 'text' },
            { label: 'Amount', value: 'amount', type: 'number' },
            { label: 'Created Date', value: 'createdAt', type: 'date' },
            { label: 'Status', value: 'status', type: 'select', options: [
              { label: 'Succeeded', value: 'succeeded' },
              { label: 'Pending', value: 'pending' },
              { label: 'Failed', value: 'failed' },
              { label: 'Refunded', value: 'refunded' },
              { label: 'Partially Refunded', value: 'partially_refunded' },
            ]},
            { label: 'Payment Method', value: 'paymentMethod', type: 'select', options: [
              { label: 'Card', value: 'card' },
              { label: 'Bank Transfer', value: 'bank_transfer' },
              { label: 'Cash', value: 'cash' },
              { label: 'Check', value: 'check' },
            ]},
          ]}
          multiSelectFields={[
            {
              label: 'Payment Status',
              value: 'status',
              options: [
                { label: 'Succeeded', value: 'succeeded' },
                { label: 'Pending', value: 'pending' },
                { label: 'Failed', value: 'failed' },
                { label: 'Refunded', value: 'refunded' },
                { label: 'Partially Refunded', value: 'partially_refunded' },
              ],
            },
            {
              label: 'Payment Method',
              value: 'paymentMethod',
              options: [
                { label: 'Card', value: 'card' },
                { label: 'Bank Transfer', value: 'bank_transfer' },
                { label: 'Cash', value: 'cash' },
                { label: 'Check', value: 'check' },
              ],
            },
          ]}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${pendingAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {payments.filter(p => p.status === 'failed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Refunded</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${refundedAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="focus:ring-kubota-orange rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="all">All Status</option>
          <option value="succeeded">Succeeded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="partially_refunded">Partially Refunded</option>
        </select>

        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>

        <button
          onClick={handleExportPayments}
          disabled={filteredPayments.length === 0}
          className={`focus:ring-kubota-orange flex items-center space-x-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            filteredPayments.length === 0
              ? 'cursor-not-allowed bg-gray-100 text-gray-400'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Financial Reports */}
      <FinancialReportsSection dateRange={dateFilter as any} />

      {/* Manual Payments */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Manual Payments</h2>
            <p className="text-sm text-gray-600">Cash, cheque, and ACH payments recorded outside Stripe.</p>
          </div>
          <button
            onClick={loadManualPayments}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Booking</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Received</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Method</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Notes</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {manualPaymentsAdmin.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {payment.booking?.bookingNumber ?? payment.booking_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(payment.received_at ?? payment.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {payment.method.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    ${Number(payment.amount ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${manualPaymentBadge(payment.status)}`}
                    >
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{payment.notes ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    {payment.status !== 'completed' ? (
                      <button
                        onClick={() => handleCompleteManualPayment(payment.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-green-200 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Mark Completed
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
              {manualPaymentsAdmin.length === 0 && !manualPaymentsLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    No manual payments recorded yet.
                  </td>
                </tr>
              )}
              {manualPaymentsLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading manual payments...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Installments */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Installments</h2>
            <p className="text-sm text-gray-600">Monitor pending installments across all bookings.</p>
          </div>
          <button
            onClick={loadUpcomingInstallments}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Booking</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Due Date</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {upcomingInstallments.map(installment => (
                <tr key={installment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{installment.bookingNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {installment.customerName || 'Customer'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(installment.dueDate)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    ${installment.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {installment.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {upcomingInstallments.length === 0 && !installmentsLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No upcoming installments.
                  </td>
                </tr>
              )}
              {installmentsLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading upcoming installments...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Reconciliation */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Stripe Payout Reconciliation</h2>
            <p className="text-sm text-gray-600">
              Sync Stripe payouts and track reconciliation status with finance ledger.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTriggerReconciliation}
              className="inline-flex items-center gap-1 rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
              disabled={payoutsLoading}
            >
              {payoutsLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh from Stripe
                </>
              )}
            </button>
            <button
              onClick={loadPayouts}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              Reload
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Payout ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Arrival
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
              {payouts.map(payout => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {payout.stripe_payout_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(payout.arrival_date, true)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    ${Number(payout.amount ?? 0).toFixed(2)} {payout.currency?.toUpperCase() ?? 'CAD'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${payoutStatusBadge(payout.status)}`}
                    >
                      {payout.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(payout.details as any)?.notes ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdatePayoutStatus(payout, 'reconciled')}
                        className="inline-flex items-center gap-1 rounded-md border border-green-200 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Mark Reconciled
                      </button>
                      <button
                        onClick={() => handleUpdatePayoutStatus(payout, 'discrepancy')}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Flag Discrepancy
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {payouts.length === 0 && !payoutsLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No Stripe payouts synced yet.
                  </td>
                </tr>
              )}
              {payoutsLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading payouts...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Ledger */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Ledger Entries</h2>
            <p className="text-sm text-gray-600">Audit-ready timeline of financial transactions.</p>
          </div>
          <button
            onClick={loadLedgerEntries}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Timestamp
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Booking
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
              {ledgerEntries.map(entry => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(entry.created_at, true)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {entry.booking_id ?? 'General'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {entry.entry_type.toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.source}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.description ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    ${Number(entry.amount ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              {ledgerEntries.length === 0 && !ledgerLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No ledger entries yet.
                  </td>
                </tr>
              )}
              {ledgerLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading ledger entries...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Exports */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Finance Exports</h2>
            <p className="text-sm text-gray-600">
              Generate CSV exports for finance reporting and accounting workflows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={exportType}
              onChange={event =>
                setExportType(event.target.value as typeof exportType)
              }
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="payments_summary">Payments Summary</option>
              <option value="manual_payments">Manual Payments</option>
              <option value="accounts_receivable">Accounts Receivable</option>
              <option value="payout_summary">Payout Summary</option>
            </select>
            <button
              onClick={handleGenerateExport}
              disabled={exportSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {exportSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate Export
                </>
              )}
            </button>
            <button
              onClick={loadExports}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Export Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Requested At
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  Parameters
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {exportsList.map(exportRecord => (
                <tr key={exportRecord.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {exportRecord.export_type.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(exportRecord.created_at, true)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{exportRecord.status}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {exportRecord.parameters ? JSON.stringify(exportRecord.parameters) : '—'}
                  </td>
                </tr>
              ))}
              {exportsList.length === 0 && !exportsLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                    No exports generated yet.
                  </td>
                </tr>
              )}
              {exportsLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading exports...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPayments.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.bookingNumber}
                      </div>
                      <div className="text-sm text-gray-500">ID: {payment.id}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {payment.customerName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </div>
                    {payment.refundAmount && payment.refundAmount > 0 ? (
                      <div className="text-sm text-red-600">
                        Refunded: ${payment.refundAmount.toFixed(2)}
                      </div>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      {getPaymentMethodIcon(payment.paymentMethod)}
                      <span className="ml-2 capitalize">
                        {payment.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(payment.status)}
                      <span
                        className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(payment.status)}`}
                      >
                        {payment.status.replace('_', ' ')}
                      </span>
                    </div>
                    {payment.status === 'failed' && payment.failureReason && (
                      <div className="mt-1 text-xs text-red-600">{payment.failureReason}</div>
                    )}
                    {payment.status !== 'failed' && payment.refundReason && (
                      <div className="mt-1 text-xs text-blue-600">{payment.refundReason}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {payment.createdAt.toLocaleDateString()}
                    <div className="text-xs">{payment.createdAt.toLocaleTimeString()}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="text-kubota-orange hover:text-orange-600"
                      >
                        View
                      </button>
                      {payment.status === 'succeeded' &&
                        payment.amount - (payment.amountRefundedToDate ?? 0) > 0 && (
                        <button
                          onClick={() => setRefundPayment(payment)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Refund
                        </button>
                      )}
                      {payment.status === 'failed' && (
                        <button
                          className="cursor-not-allowed text-blue-300"
                          title="Retry is not yet available for failed payments"
                          disabled
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Payment Details - {selectedPayment.bookingNumber}
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Payment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Payment ID:</strong> {selectedPayment.id}
                    </div>
                    <div>
                      <strong>Booking:</strong> {selectedPayment.bookingNumber}
                    </div>
                    <div>
                      <strong>Customer:</strong> {selectedPayment.customerName}
                    </div>
                    <div>
                      <strong>Amount:</strong> ${selectedPayment.amount.toFixed(2)}
                    </div>
                    <div>
                      <strong>Method:</strong> {selectedPayment.paymentMethod.replace('_', ' ')}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedPayment.status)}`}
                      >
                        {selectedPayment.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Created:</strong> {selectedPayment.createdAt.toLocaleString()}
                    </div>
                    {selectedPayment.processedAt && (
                      <div>
                        <strong>Processed:</strong> {selectedPayment.processedAt.toLocaleString()}
                      </div>
                    )}
                    {selectedPayment.refundedAt && (
                      <div>
                        <strong>Refunded:</strong> {selectedPayment.refundedAt.toLocaleString()}
                      </div>
                    )}
                    {selectedPayment.stripePaymentIntentId && (
                      <div>
                        <strong>Stripe ID:</strong> {selectedPayment.stripePaymentIntentId}
                      </div>
                    )}
                    {selectedPayment.failureReason && (
                      <div>
                        <strong>Failure Reason:</strong> {selectedPayment.failureReason}
                      </div>
                    )}
                  </div>
                </div>

                {selectedPayment.refundAmount && selectedPayment.refundAmount > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="mb-3 text-sm font-medium text-gray-900">Refund Information</h4>
                    <div className="rounded-md border border-red-200 bg-red-50 p-4">
                      <div className="text-sm">
                        <div>
                          <strong>Refund Amount:</strong> ${selectedPayment.refundAmount.toFixed(2)}
                        </div>
                        <div>
                          <strong>Refund Date:</strong>{' '}
                          {selectedPayment.refundedAt?.toLocaleString()}
                        </div>
                        {selectedPayment.refundReason && (
                          <div>
                            <strong>Reason:</strong> {selectedPayment.refundReason}
                          </div>
                        )}
                        {selectedPayment.status === 'partially_refunded' && (
                          <div>
                            <strong>Remaining Amount:</strong> $
                            {(selectedPayment.amount - selectedPayment.refundAmount).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Actions</h4>
                  <div className="flex space-x-3">
                    {selectedPayment.status === 'succeeded' && (
                      <button
                        onClick={() => {
                          setRefundPayment(selectedPayment);
                          setSelectedPayment(null);
                        }}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                      >
                        Process Refund
                      </button>
                    )}
                    {selectedPayment.status === 'failed' && (
                      <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                        Retry Payment
                      </button>
                    )}
                    <button
                      onClick={() => handleViewReceipt(selectedPayment)}
                      className="rounded-md border border-[#A90F0F] px-4 py-2 text-sm font-medium text-[#A90F0F] transition hover:bg-[#A90F0F] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#A90F0F] focus:ring-offset-2"
                    >
                      View Receipt
                    </button>
                    <button
                      onClick={() => handleDownloadReceipt(selectedPayment)}
                      className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Download Receipt
                    </button>
                    <button
                      onClick={() => handleViewInStripe(selectedPayment)}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition shadow-sm ${
                        selectedPayment.stripePaymentIntentId ||
                        selectedPayment.stripeCheckoutSessionId
                          ? 'bg-[#A90F0F] text-white hover:bg-[#8B0B0B] focus:outline-none focus:ring-2 focus:ring-[#A90F0F] focus:ring-offset-2'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed focus:outline-none'
                      }`}
                      disabled={
                        (!selectedPayment.stripePaymentIntentId &&
                          !selectedPayment.stripeCheckoutSessionId) ||
                        stripeLinkLoadingId === selectedPayment.id
                      }
                      title={
                        selectedPayment.stripePaymentIntentId ||
                        selectedPayment.stripeCheckoutSessionId
                          ? 'View payment in Stripe dashboard'
                          : 'This payment is not linked to Stripe (no payment intent or checkout session)'
                      }
                    >
                      {stripeLinkLoadingId === selectedPayment.id ? 'Opening…' : 'View in Stripe'}
                    </button>
                  </div>
                  {!selectedPayment.stripePaymentIntentId &&
                    !selectedPayment.stripeCheckoutSessionId && (
                    <p className="mt-2 text-xs text-gray-500">
                      This payment was created internally and does not have Stripe identifiers. Stripe-specific actions are unavailable.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundPayment && (
        <RefundModal
          payment={{
            id: refundPayment.id,
            bookingNumber: refundPayment.bookingNumber,
            customerName: refundPayment.customerName,
            amount: refundPayment.amount,
            amountRefunded: refundPayment.amountRefundedToDate ?? refundPayment.refundAmount ?? 0,
            stripePaymentIntentId: refundPayment.stripePaymentIntentId,
          }}
          onClose={() => setRefundPayment(null)}
          onRefundComplete={() => {
            fetchPayments(); // Refresh payments list
          }}
        />
      )}
    </div>
  );
}
