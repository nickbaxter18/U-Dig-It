/**
 * Booking Confirmed Modal
 *
 * Shows after successful card verification to confirm the booking is complete.
 */

'use client';

import { useRouter } from 'next/navigation';

interface BookingConfirmedModalProps {
  isOpen: boolean;
  bookingNumber: string;
  bookingId: string;
}

export default function BookingConfirmedModal({
  isOpen,
  bookingNumber,
  bookingId,
}: BookingConfirmedModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleViewBooking = () => {
    router.push(`/booking/${bookingId}/manage`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        {/* Success Animation */}
        <div className="flex flex-col items-center justify-center px-8 py-12">
          {/* Success Icon */}
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 animate-bounce">
            <svg
              className="h-12 w-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h2 className="mb-3 text-3xl font-bold text-gray-900">
            🎉 Booking Confirmed!
          </h2>
          <p className="mb-2 text-center text-lg text-gray-700">
            Your rental is all set
          </p>
          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2">
            <p className="text-center font-mono text-xl font-bold text-blue-900">
              {bookingNumber}
            </p>
          </div>

          {/* What's Next */}
          <div className="w-full rounded-lg bg-gray-50 p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">
              📧 What's Next
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 text-green-600">✓</span>
                <span>Confirmation email sent to your inbox</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 text-green-600">✓</span>
                <span>Payment method saved securely with Stripe</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 text-blue-600">→</span>
                <span><strong>Pay your invoice</strong> to complete the booking</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 text-blue-600">→</span>
                <span>Upload a picture of your license</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 text-blue-600">→</span>
                <span>Upload your Certificate of Insurance</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 text-blue-600">→</span>
                <span>Sign the rental agreement electronically</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 text-blue-600">→</span>
                <span>$500 refundable security hold will be placed 48 hours before pickup</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleViewBooking}
            className="w-full rounded-lg bg-[#A90F0F] px-6 py-3 text-lg font-semibold text-white hover:bg-[#8a0c0c] transition-colors shadow-md"
          >
            View My Booking →
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            You can manage your booking, upload documents, and track delivery from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}

