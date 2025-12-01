'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function InvoicePaymentCancelPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <svg
              className="h-8 w-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>

        <p className="text-gray-600 mb-6">
          Your payment was cancelled. You can complete your payment at any time from your booking
          dashboard or by clicking the payment link in your invoice email.
        </p>

        <div className="space-y-3">
          {bookingId && (
            <Link
              href={`/booking/${bookingId}/manage`}
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              View Booking & Pay Later
            </Link>
          )}

          <Link
            href="/dashboard"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Need help? Contact us at{' '}
          <a href="tel:+15065550199" className="text-blue-600 hover:underline">
            (506) 555-0199
          </a>{' '}
          or reply to your invoice email.
        </p>
      </div>
    </div>
  );
}

