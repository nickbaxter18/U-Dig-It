'use client';

import { CheckCircle, Download, Eye, FileText, Calendar, User, XCircle, Lock, Clock, DollarSign, ExternalLink, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/utils';
import { StepHistoryTimeline } from './StepHistoryTimeline';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { ManualPaymentModal } from './ManualPaymentModal';

interface DepositStepDetailsProps {
  bookingId: string;
  isExpanded: boolean;
  activeTab?: 'details' | 'history' | 'files' | 'actions';
  onTabChange?: (tab: 'details' | 'history' | 'files' | 'actions') => void;
}

interface DepositPayment {
  id: string;
  paymentNumber: string;
  amount: number;
  amountRefunded: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'check';
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  stripeRefundId: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BookingDepositInfo {
  depositAmount: number | null;
  depositPaid: boolean;
  depositPaidAt: string | null;
  stripeDepositPaymentIntentId: string | null;
  security_hold_intent_id: string | null;
}

export function DepositStepDetails({ bookingId, isExpanded, activeTab = 'details', onTabChange }: DepositStepDetailsProps) {
  const [depositPayments, setDepositPayments] = useState<DepositPayment[]>([]);
  const [bookingInfo, setBookingInfo] = useState<BookingDepositInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releasingDeposit, setReleasingDeposit] = useState(false);
  const [showManualDepositModal, setShowManualDepositModal] = useState(false);
  const [manualDepositProcessing, setManualDepositProcessing] = useState(false);
  const [manualDepositError, setManualDepositError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isExpanded || !bookingId) return;

    const fetchDepositInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch booking deposit info
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('depositAmount, depositPaid, depositPaidAt, stripeDepositPaymentIntentId, security_hold_intent_id')
          .eq('id', bookingId)
          .maybeSingle();

        if (bookingError) throw bookingError;
        setBookingInfo(bookingData);

        // Fetch deposit payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('id, paymentNumber, amount, amountRefunded, status, method, stripePaymentIntentId, stripeChargeId, stripeRefundId, processedAt, createdAt, updatedAt')
          .eq('bookingId', bookingId)
          .eq('type', 'deposit')
          .order('createdAt', { ascending: false });

        if (paymentsError) throw paymentsError;
        setDepositPayments(paymentsData || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load deposit information';
        setError(message);
        logger.error(
          'Failed to fetch deposit information',
          {
            component: 'DepositStepDetails',
            action: 'fetch_error',
            metadata: { bookingId },
          },
          err instanceof Error ? err : new Error(String(err))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDepositInfo();
  }, [bookingId, isExpanded]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getStatusColor = (status: DepositPayment['status']) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-blue-100 text-blue-800',
      partially_refunded: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: DepositPayment['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-3 w-3" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      case 'refunded':
      case 'partially_refunded':
        return <DollarSign className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleViewStripe = (paymentIntentId: string | null) => {
    if (paymentIntentId) {
      window.open(`https://dashboard.stripe.com/payments/${paymentIntentId}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleReleaseDeposit = async () => {
    if (!confirm('Release security deposit? This will cancel the security hold and release the funds to the customer.')) {
      return;
    }

    setReleasingDeposit(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetchWithAuth('/api/stripe/release-security-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to release security deposit');
      }

      // Refresh deposit data
      const fetchDepositInfo = async () => {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('depositAmount, depositPaid, depositPaidAt, stripeDepositPaymentIntentId, security_hold_intent_id')
          .eq('id', bookingId)
          .maybeSingle();

        if (bookingData) {
          setBookingInfo(bookingData);
        }

        const { data: paymentsData } = await supabase
          .from('payments')
          .select('id, paymentNumber, amount, amountRefunded, status, method, stripePaymentIntentId, stripeChargeId, stripeRefundId, processedAt, createdAt, updatedAt')
          .eq('bookingId', bookingId)
          .eq('type', 'deposit')
          .order('createdAt', { ascending: false });

        if (paymentsData) {
          setDepositPayments(paymentsData);
        }
      };

      await fetchDepositInfo();
      setSuccessMessage('Security deposit released successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to release security deposit';
      setError(message);
      logger.error(
        'Failed to release security deposit',
        {
          component: 'DepositStepDetails',
          action: 'release_deposit_error',
          metadata: { bookingId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setReleasingDeposit(false);
    }
  };

  const handleManualDepositSubmit = async (formData: {
    amount: number;
    method: 'cash' | 'ach' | 'check' | 'pos' | 'other';
    receivedAt?: string;
    notes?: string;
    currency?: string;
  }) => {
    setManualDepositProcessing(true);
    setManualDepositError(null);
    setSuccessMessage(null);

    try {
      // Get customer ID from booking
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('customerId')
        .eq('id', bookingId)
        .single();

      // Use completion-steps endpoint to mark deposit as paid
      const response = await fetchWithAuth(`/api/admin/bookings/${bookingId}/completion-steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'deposit_paid',
          completed: true,
          notes: formData.notes || `Manual deposit recorded: ${formData.method}`,
          paymentAmount: formData.amount,
          paymentMethod: formData.method === 'cash' ? 'cash' : formData.method === 'check' ? 'check' : formData.method === 'ach' ? 'bank_transfer' : 'credit_card',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to record manual deposit');
      }

      // Also record as manual payment for ledger
      try {
        await fetchWithAuth('/api/admin/payments/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            customerId: bookingData?.customerId,
            amount: formData.amount,
            method: formData.method,
            currency: formData.currency || 'cad',
            receivedAt: formData.receivedAt || new Date().toISOString(),
            notes: formData.notes || 'Manual deposit payment',
          }),
        });
      } catch (manualPaymentError) {
        // Log but don't fail - the completion step was successful
        logger.warn('Failed to record manual payment entry', {
          component: 'DepositStepDetails',
          action: 'manual_payment_entry_failed',
          metadata: { bookingId },
        });
      }

      // Refresh deposit data
      const { data: bookingDataUpdated } = await supabase
        .from('bookings')
        .select('depositAmount, depositPaid, depositPaidAt, stripeDepositPaymentIntentId, security_hold_intent_id')
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingDataUpdated) {
        setBookingInfo(bookingDataUpdated);
      }

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('id, paymentNumber, amount, amountRefunded, status, method, stripePaymentIntentId, stripeChargeId, stripeRefundId, processedAt, createdAt, updatedAt')
        .eq('bookingId', bookingId)
        .eq('type', 'deposit')
        .order('createdAt', { ascending: false });

      if (paymentsData) {
        setDepositPayments(paymentsData);
      }

      setShowManualDepositModal(false);
      setSuccessMessage('Manual deposit recorded successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record manual deposit';
      setManualDepositError(message);
      logger.error(
        'Failed to record manual deposit',
        {
          component: 'DepositStepDetails',
          action: 'manual_deposit_error',
          metadata: { bookingId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setManualDepositProcessing(false);
    }
  };

  if (!isExpanded) return null;

  if (loading) {
    return (
      <div className="mt-4 flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-premium-gold border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  const totalDepositPaid = depositPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount - (p.amountRefunded || 0), 0);

  const totalRefunded = depositPayments.reduce((sum, p) => sum + (p.amountRefunded || 0), 0);

  const tabs = [
    { id: 'details' as const, label: 'Details', icon: FileText },
    { id: 'history' as const, label: 'History', icon: Clock },
    { id: 'files' as const, label: 'Files', icon: Download },
    { id: 'actions' as const, label: 'Actions', icon: Lock },
  ];

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-premium-gold text-premium-gold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <label className="text-xs font-medium text-gray-500">Required Deposit</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {bookingInfo?.depositAmount ? formatCurrency(bookingInfo.depositAmount) : 'N/A'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <label className="text-xs font-medium text-gray-500">Total Paid</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(totalDepositPaid)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <label className="text-xs font-medium text-gray-500">Total Refunded</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(totalRefunded)}</p>
            </div>
          </div>

          {/* Status */}
          {bookingInfo && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium text-gray-500">Deposit Status</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {bookingInfo.depositPaid ? 'Paid' : 'Not Paid'}
                  </p>
                </div>
                {bookingInfo.depositPaid && bookingInfo.depositPaidAt && (
                  <div className="text-right">
                    <label className="text-xs font-medium text-gray-500">Paid At</label>
                    <p className="mt-1 flex items-center justify-end gap-1 text-sm text-gray-900">
                      <Calendar className="h-4 w-4" />
                      {formatDate(bookingInfo.depositPaidAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment List */}
          {depositPayments.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600">No deposit payments found for this booking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {depositPayments.map((payment) => (
                <div key={payment.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{payment.paymentNumber}</h4>
                      <p className="text-sm text-gray-600">Security Deposit</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1">{payment.status.replace('_', ' ').toUpperCase()}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Amount</label>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                    </div>

                    {payment.amountRefunded > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Refunded</label>
                        <p className="mt-1 text-sm text-red-600">{formatCurrency(payment.amountRefunded)}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-medium text-gray-500">Method</label>
                      <p className="mt-1 text-sm text-gray-900">{payment.method.replace('_', ' ').toUpperCase()}</p>
                    </div>

                    {payment.processedAt && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Processed</label>
                        <p className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                          <Calendar className="h-4 w-4" />
                          {formatDate(payment.processedAt)}
                        </p>
                      </div>
                    )}

                    {payment.createdAt && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Created</label>
                        <p className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                          <Calendar className="h-4 w-4" />
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  {payment.stripePaymentIntentId && (
                    <div className="mt-4 flex gap-2 border-t border-gray-200 pt-4">
                      <button
                        onClick={() => handleViewStripe(payment.stripePaymentIntentId)}
                        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View in Stripe
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <StepHistoryTimeline bookingId={bookingId} stepType="deposit_paid" />
      )}

      {activeTab === 'files' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">Deposit Receipts</h4>
          {depositPayments.length === 0 ? (
            <p className="text-sm text-gray-600">No deposit payments found.</p>
          ) : (
            <div className="space-y-2">
              {depositPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.paymentNumber || `Deposit ${payment.id.slice(0, 8)}`}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(payment.amount)} - {formatDate(payment.createdAt)}</p>
                    </div>
                  </div>
                  {payment.stripePaymentIntentId && (
                    <button
                      onClick={() => handleViewStripe(payment.stripePaymentIntentId)}
                      className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-3 w-3" /> View Receipt
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-4">
          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-4 text-sm font-semibold text-gray-900">Deposit Actions</h4>
            <div className="space-y-2">
              {bookingInfo && (bookingInfo.security_hold_intent_id || bookingInfo.depositPaid) && (
                <button
                  onClick={handleReleaseDeposit}
                  disabled={releasingDeposit || !bookingInfo.security_hold_intent_id}
                  className="w-full flex items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-4 w-4" />
                  {releasingDeposit ? 'Releasing...' : 'Release Deposit'}
                </button>
              )}
              <button
                onClick={() => setShowManualDepositModal(true)}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <CreditCard className="h-4 w-4" /> Record Manual Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Deposit Modal */}
      {showManualDepositModal && (
        <ManualPaymentModal
          bookingId={bookingId}
          bookingNumber=""
          onClose={() => {
            setShowManualDepositModal(false);
            setManualDepositError(null);
          }}
          onSubmit={handleManualDepositSubmit}
          processing={manualDepositProcessing}
          error={manualDepositError}
        />
      )}
    </div>
  );
}

