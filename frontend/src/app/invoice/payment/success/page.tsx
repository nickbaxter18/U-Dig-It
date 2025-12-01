'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function InvoicePaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');
  const sessionId = searchParams.get('session_id');
  const message = searchParams.get('message');
  const [isLoading, setIsLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to booking page with success parameter if bookingId exists
  useEffect(() => {
    if (bookingId && !hasRedirected && !message) {
      setHasRedirected(true);
      // Redirect to booking page with payment=success parameter
      // This will trigger PaymentSuccessHandler to finalize payment and refresh
      const redirectUrl = `/booking/${bookingId}/manage?payment=success&type=invoice${sessionId ? `&session_id=${sessionId}` : ''}`;
      router.push(redirectUrl);
    }
  }, [bookingId, sessionId, message, hasRedirected, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing...</p>
        </div>
      </div>
    );
  }

  const isAlreadyPaid = message === 'already_paid';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {isAlreadyPaid ? (
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : (
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isAlreadyPaid ? 'Invoice Already Paid' : 'Payment Successful!'}
        </h1>

        <p className="text-gray-600 mb-6">
          {isAlreadyPaid
            ? 'This invoice has already been paid in full.'
            : 'Your invoice payment has been processed successfully. You will receive a confirmation email shortly.'}
        </p>

        {sessionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Payment Session:</span> {sessionId.substring(0, 20)}...
            </p>
          </div>
        )}

        <div className="space-y-3">
          {bookingId && (
            <Link
              href={`/booking/${bookingId}/manage`}
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              View Booking Details
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
          Questions? Contact us at{' '}
          <a href="tel:+15065550199" className="text-blue-600 hover:underline">
            (506) 555-0199
          </a>{' '}
          or reply to your invoice email.
        </p>
      </div>
    </div>
  );
}

