/**
 * Hold Payment Modal
 *
 * Modal wrapper for VerificationHoldPayment component.
 * Shows Stripe Elements for card collection.
 */

'use client';

import VerificationHoldPayment from './VerificationHoldPayment';

interface HoldPaymentModalProps {
  isOpen: boolean;
  bookingId: string;
  customerId: string;
  startDate: string;
  totalAmount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export default function HoldPaymentModal({
  isOpen,
  bookingId,
  customerId,
  startDate,
  totalAmount,
  onSuccess,
  onError,
  onClose,
}: HoldPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="p-8">
            <VerificationHoldPayment
              bookingId={bookingId}
              customerId={customerId}
              startDate={startDate}
              totalAmount={totalAmount}
              onSuccess={onSuccess}
              onError={onError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

























