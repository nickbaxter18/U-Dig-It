'use client';

import { CheckCircle, Download, Eye, FileText, Calendar, User, XCircle, CreditCard, Clock, DollarSign, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/utils';
import { StepHistoryTimeline } from './StepHistoryTimeline';
import { RefundModal } from '@/components/admin/RefundModal';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { ManualPaymentModal } from './ManualPaymentModal';

interface PaymentStepDetailsProps {
  bookingId: string;
  isExpanded: boolean;
  activeTab?: 'details' | 'history' | 'files' | 'actions';
  onTabChange?: (tab: 'details' | 'history' | 'files' | 'actions') => void;
}

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  amountRefunded: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  type: 'deposit' | 'payment' | 'refund' | 'additional_charge';
  method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'check';
  description: string | null;
  notes: string | null;
  stripePaymentIntentId: string | null;
  stripeCheckoutSessionId: string | null;
  stripeChargeId: string | null;
  stripeRefundId: string | null;
  processedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export function PaymentStepDetails({ bookingId, isExpanded, activeTab = 'details', onTabChange }: PaymentStepDetailsProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingNumber, setBookingNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [manualPaymentProcessing, setManualPaymentProcessing] = useState(false);
  const [manualPaymentError, setManualPaymentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isExpanded || !bookingId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch booking info for customer name and booking number
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('bookingNumber, customerId, customer:customerId(firstName, lastName)')
          .eq('id', bookingId)
          .single();

        if (bookingError) throw bookingError;

        if (bookingData) {
          setBookingNumber(bookingData.bookingNumber || '');
          const customer = bookingData.customer as { firstName: string; lastName: string } | null;
          if (customer) {
            setCustomerName(`${customer.firstName || ''} ${customer.lastName || ''}`.trim());
          }
        }

        // Fetch payments
        const { data, error: fetchError } = await supabase
          .from('payments')
          .select('id, paymentNumber, amount, amountRefunded, status, type, method, description, notes, stripePaymentIntentId, stripeCheckoutSessionId, stripeChargeId, stripeRefundId, processedAt, failedAt, failureReason, createdAt, updatedAt')
          .eq('bookingId', bookingId)
          .order('createdAt', { ascending: false });

        if (fetchError) throw fetchError;
        setPayments(data || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
        logger.error(
          'Failed to fetch payment data',
          {
            component: 'PaymentStepDetails',
            action: 'fetch_error',
            metadata: { bookingId },
          },
          err instanceof Error ? err : new Error(String(err))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, isExpanded]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getStatusColor = (status: Payment['status']) => {
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

  const getStatusIcon = (status: Payment['status']) => {
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

  const handleRefundClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRefundModal(true);
  };

  const handleRefundComplete = () => {
    // Refresh payments list
    const fetchPayments = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('payments')
          .select('id, paymentNumber, amount, amountRefunded, status, type, method, description, notes, stripePaymentIntentId, stripeCheckoutSessionId, stripeChargeId, stripeRefundId, processedAt, failedAt, failureReason, createdAt, updatedAt')
          .eq('bookingId', bookingId)
          .order('createdAt', { ascending: false });

        if (fetchError) throw fetchError;
        setPayments(data || []);
        setSuccessMessage('Refund processed successfully');
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err) {
        logger.error(
          'Failed to refresh payments after refund',
          {
            component: 'PaymentStepDetails',
            action: 'refresh_after_refund',
            metadata: { bookingId },
          },
          err instanceof Error ? err : new Error(String(err))
        );
      }
    };
    fetchPayments();
  };

  const handleManualPaymentSubmit = async (formData: {
    amount: number;
    method: 'cash' | 'ach' | 'check' | 'pos' | 'other';
    receivedAt?: string;
    notes?: string;
    currency?: string;
  }) => {
    setManualPaymentProcessing(true);
    setManualPaymentError(null);
    setSuccessMessage(null);

    try {
      // Get customer ID from booking
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('customerId')
        .eq('id', bookingId)
        .single();

      const response = await fetchWithAuth('/api/admin/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          customerId: bookingData?.customerId,
          amount: formData.amount,
          method: formData.method,
          currency: formData.currency || 'cad',
          receivedAt: formData.receivedAt || new Date().toISOString(),
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to record manual payment');
      }

      // Refresh payments list
      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('id, paymentNumber, amount, amountRefunded, status, type, method, description, notes, stripePaymentIntentId, stripeCheckoutSessionId, stripeChargeId, stripeRefundId, processedAt, failedAt, failureReason, createdAt, updatedAt')
        .eq('bookingId', bookingId)
        .order('createdAt', { ascending: false });

      if (fetchError) throw fetchError;
      setPayments(data || []);

      setShowManualPaymentModal(false);
      setSuccessMessage('Manual payment recorded successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record manual payment';
      setManualPaymentError(message);
      logger.error(
        'Failed to record manual payment',
        {
          component: 'PaymentStepDetails',
          action: 'manual_payment_error',
          metadata: { bookingId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setManualPaymentProcessing(false);
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

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount - (p.amountRefunded || 0), 0);

  const totalRefunded = payments.reduce((sum, p) => sum + (p.amountRefunded || 0), 0);

  const tabs = [
    { id: 'details' as const, label: 'Details', icon: FileText },
    { id: 'history' as const, label: 'History', icon: Clock },
    { id: 'files' as const, label: 'Files', icon: Download },
    { id: 'actions' as const, label: 'Actions', icon: CreditCard },
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
              <label className="text-xs font-medium text-gray-500">Total Paid</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <label className="text-xs font-medium text-gray-500">Total Refunded</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(totalRefunded)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <label className="text-xs font-medium text-gray-500">Payment Count</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{payments.length}</p>
            </div>
          </div>

          {/* Payment List */}
          {payments.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600">No payments found for this booking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{payment.paymentNumber}</h4>
                      <p className="text-sm text-gray-600">{payment.type.replace('_', ' ').toUpperCase()}</p>
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

                    {payment.failedAt && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Failed</label>
                        <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                          <XCircle className="h-4 w-4" />
                          {formatDate(payment.failedAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  {payment.description && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <label className="text-xs font-medium text-gray-500">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{payment.description}</p>
                    </div>
                  )}

                  {payment.notes && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <label className="text-xs font-medium text-gray-500">Notes</label>
                      <p className="mt-1 text-sm text-gray-900">{payment.notes}</p>
                    </div>
                  )}

                  {payment.failureReason && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                      <label className="text-xs font-semibold text-red-800">Failure Reason</label>
                      <p className="mt-1 text-sm text-red-700">{payment.failureReason}</p>
                    </div>
                  )}

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
        <StepHistoryTimeline bookingId={bookingId} stepType="payment_completed" />
      )}

      {activeTab === 'files' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">Payment Receipts</h4>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-600">No payments found.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.paymentNumber || `Payment ${payment.id.slice(0, 8)}`}</p>
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
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-4 text-sm font-semibold text-gray-900">Payment Actions</h4>
            <div className="space-y-2">
              <button
                onClick={() => setShowManualPaymentModal(true)}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <CreditCard className="h-4 w-4" /> Record Manual Payment
              </button>
              {payments
                .filter(p => p.status === 'completed' && (p.amountRefunded || 0) < p.amount)
                .map((payment) => (
                  <button
                    key={payment.id}
                    onClick={() => handleRefundClick(payment)}
                    className="w-full flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <DollarSign className="h-4 w-4" /> Process Refund - {payment.paymentNumber || `Payment ${payment.id.slice(0, 8)}`}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <RefundModal
          payment={{
            id: selectedPayment.id,
            bookingNumber,
            customerName,
            amount: selectedPayment.amount,
            amountRefunded: selectedPayment.amountRefunded || 0,
            stripePaymentIntentId: selectedPayment.stripePaymentIntentId || undefined,
          }}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedPayment(null);
          }}
          onRefundComplete={handleRefundComplete}
        />
      )}

      {/* Manual Payment Modal */}
      {showManualPaymentModal && (
        <ManualPaymentModal
          bookingId={bookingId}
          bookingNumber={bookingNumber}
          onClose={() => {
            setShowManualPaymentModal(false);
            setManualPaymentError(null);
          }}
          onSubmit={handleManualPaymentSubmit}
          processing={manualPaymentProcessing}
          error={manualPaymentError}
        />
      )}
    </div>
  );
}

