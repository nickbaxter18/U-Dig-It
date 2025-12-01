'use client';

import { CreditCard, XCircle } from 'lucide-react';
import { useState } from 'react';
import { AdminModal } from '@/components/admin/AdminModal';

interface ManualPaymentModalProps {
  bookingId: string;
  bookingNumber: string;
  onClose: () => void;
  onSubmit: (formData: {
    amount: number;
    method: 'cash' | 'ach' | 'check' | 'pos' | 'other';
    receivedAt?: string;
    notes?: string;
    currency?: string;
  }) => void;
  processing: boolean;
  error: string | null;
}

export function ManualPaymentModal({
  bookingId,
  bookingNumber,
  onClose,
  onSubmit,
  processing,
  error,
}: ManualPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'ach' | 'check' | 'pos' | 'other'>('cash');
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    onSubmit({
      amount: amountNum,
      method,
      receivedAt: receivedAt ? new Date(receivedAt).toISOString() : undefined,
      notes: notes.trim() || undefined,
      currency: 'cad',
    });
  };

  return (
    <AdminModal
      isOpen={true}
      onClose={onClose}
      title="Record Manual Payment"
      maxWidth="md"
      ariaLabelledBy="manual-payment-title"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-500">Booking: {bookingNumber}</p>
        </div>

        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount (CAD) <span className="text-red-500">*</span>
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={processing}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="0.00"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="method" className="block text-sm font-medium text-gray-700">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
              disabled={processing}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="ach">ACH / Bank Transfer</option>
              <option value="pos">POS / Card Terminal</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Received At */}
          <div>
            <label htmlFor="receivedAt" className="block text-sm font-medium text-gray-700">
              Received Date & Time
            </label>
            <input
              id="receivedAt"
              type="datetime-local"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
              disabled={processing}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={processing}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Optional notes about this payment"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-red-800">Error</h4>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={processing || !amount || parseFloat(amount) <= 0}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {processing ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Recording...
              </>
            ) : (
              <>
                <CreditCard className="inline-block h-4 w-4 mr-2" />
                Record Payment
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

