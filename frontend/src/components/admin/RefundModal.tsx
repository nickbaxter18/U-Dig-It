'use client';

import { AlertTriangle, DollarSign, X, XCircle } from 'lucide-react';

import { useState } from 'react';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface RefundModalProps {
  payment: {
    id: string;
    bookingNumber: string;
    customerName: string;
    amount: number;
    amountRefunded?: number;
    stripePaymentIntentId?: string;
  };
  onClose: () => void;
  onRefundComplete: () => void;
}

export function RefundModal({ payment, onClose, onRefundComplete }: RefundModalProps) {
  const remainingAmount = Math.max(payment.amount - (payment.amountRefunded ?? 0), 0);
  const [refundAmount, setRefundAmount] = useState(
    remainingAmount > 0 ? remainingAmount.toString() : '0'
  );
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedRefundAmount = Number.parseFloat(refundAmount);
  const isPartialRefund =
    Number.isFinite(parsedRefundAmount) &&
    parsedRefundAmount > 0 &&
    parsedRefundAmount < remainingAmount;
  const maxRefundAmount = remainingAmount;

  const handleRefund = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Validate refund amount
      const amount = parseFloat(refundAmount);
      if (Number.isNaN(amount) || amount <= 0 || amount > maxRefundAmount) {
        throw new Error(
          `Refund amount must be between $0.01 and $${Math.max(maxRefundAmount, 0).toFixed(2)}`
        );
      }

      if (!refundReason.trim()) {
        throw new Error('Please provide a reason for the refund');
      }

      logger.info('Processing refund', {
        component: 'RefundModal',
        action: 'refund_start',
        metadata: {
          paymentId: payment.id,
          bookingNumber: payment.bookingNumber,
          refundAmount: amount,
          reason: refundReason,
        },
      });

      // Call refund API
      const response = await fetchWithAuth('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          amount,
          reason: refundReason,
          stripePaymentIntentId: payment.stripePaymentIntentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process refund');
      }

      const result = await response.json();

      logger.info('Refund processed successfully', {
        component: 'RefundModal',
        action: 'refund_success',
        metadata: {
          refundId: result.refundId,
          amount,
        },
      });

      // Close modal and refresh payments list
      onRefundComplete();
      onClose();
    } catch (err: unknown) {
      logger.error(
        'Refund error:',
        {
          component: 'RefundModal',
          action: 'refund_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err.message || 'Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  const titleId = `refund-${payment.id}-title`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h3 id={titleId} className="text-lg font-medium text-gray-900">
                Process Refund
              </h3>
              <p className="mt-1 text-sm text-gray-500">Booking: {payment.bookingNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={processing}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Warning */}
          <div className="mb-6 rounded-md bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">Important</h4>
                <p className="mt-1 text-sm text-yellow-700">
                  This will initiate a refund to the customer's payment method. This action cannot
                  be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="rounded-md bg-gray-50 p-4">
              <div className="text-sm">
                <div className="mb-2">
                  <strong>Customer:</strong> {payment.customerName}
                </div>
                <div>
                  <strong>Original Amount:</strong> ${payment.amount.toFixed(2)}
                </div>
                <div>
                  <strong>Refunded To-Date:</strong> ${(payment.amountRefunded ?? 0).toFixed(2)}
                </div>
                <div>
                  <strong>Available to Refund:</strong> ${maxRefundAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Refund Amount */}
            <div>
              <label htmlFor="refundAmount" className="block text-sm font-medium text-gray-700">
                Refund Amount
              </label>
              <div className="mt-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="refundAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxRefundAmount}
                  value={refundAmount}
                  onChange={(e: unknown) => setRefundAmount(e.target.value)}
                  disabled={processing}
                  className="block w-full rounded-md border-gray-300 pl-10 pr-12 focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="0.00"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-sm text-gray-500">CAD</span>
                </div>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>
                  {parsedRefundAmount > 0 && parsedRefundAmount < maxRefundAmount
                    ? 'Partial refund'
                    : parsedRefundAmount === maxRefundAmount
                      ? 'Full refund'
                      : 'Enter amount'}
                </span>
                <button
                  type="button"
                  onClick={() => setRefundAmount(maxRefundAmount.toFixed(2))}
                  className="text-orange-600 hover:text-orange-700"
                  disabled={processing || maxRefundAmount <= 0}
                >
                  Use max: ${maxRefundAmount.toFixed(2)}
                </button>
              </div>
              {maxRefundAmount <= 0 && (
                <p className="mt-2 text-xs text-red-600">
                  This payment has already been fully refunded.
                </p>
              )}
            </div>

            {/* Refund Reason */}
            <div>
              <label htmlFor="refundReason" className="block text-sm font-medium text-gray-700">
                Refund Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="refundReason"
                rows={3}
                value={refundReason}
                onChange={(e: unknown) => setRefundReason(e.target.value)}
                disabled={processing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter the reason for this refund (required for audit trail)"
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be logged for compliance and customer support purposes.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">Error</h4>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleRefund}
              disabled={processing || !refundReason.trim() || maxRefundAmount <= 0}
              className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Processing...
                </>
              ) : (
                `Refund $${parseFloat(refundAmount || '0').toFixed(2)}`
              )}
            </button>
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
