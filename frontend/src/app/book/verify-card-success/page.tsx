/**
 * Card Verification Success Page
 *
 * Handles redirect from Stripe Checkout after successful card setup
 * Saves payment method to booking and redirects to dashboard
 */

'use client';

import { Suspense, useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import BookingConfirmedModal from '@/components/booking/BookingConfirmedModal';

import { logger } from '@/lib/logger';

function VerifyCardSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing card verification...');
  const [bookingData, setBookingData] = useState<{
    bookingId: string;
    bookingNumber: string;
  } | null>(null);

  useEffect(() => {
    const processSuccess = async () => {
      const sessionId = searchParams.get('session_id');
      const bookingId = searchParams.get('booking_id');

      if (!sessionId || !bookingId) {
        setStatus('error');
        setMessage('Missing required parameters');
        return;
      }

      try {
        logger.info('Processing card verification success', {
          component: 'VerifyCardSuccess',
          action: 'start',
          metadata: { sessionId: sessionId.substring(0, 20) + '...', bookingId },
        });

        // Retrieve booking form data from localStorage
        const savedFormData = localStorage.getItem('pending_booking_data');
        if (!savedFormData) {
          throw new Error('Booking form data not found. Please start over.');
        }

        const bookingFormData = JSON.parse(savedFormData);

        logger.info('Retrieved booking form data from localStorage', {
          component: 'VerifyCardSuccess',
          action: 'form_data_retrieved',
          metadata: { dataKeys: Object.keys(bookingFormData) },
        });

        // Call API to complete card verification AND create booking
        const response = await fetch('/api/stripe/complete-card-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            bookingId,
            bookingFormData, // Send the saved form data to create the booking
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to complete booking');
        }

        const result = await response.json();

        logger.info('Card verification and booking completed', {
          component: 'VerifyCardSuccess',
          action: 'success',
          metadata: {
            bookingId: result.bookingId,
            paymentMethodId: result.paymentMethodId?.substring(0, 10) + '...',
          },
        });

        setStatus('success');
        setMessage('Card verified and booking created successfully!');

        // Store booking data to show in modal
        setBookingData({
          bookingId: result.bookingId,
          bookingNumber: result.bookingNumber,
        });

        // Clear ALL booking-related data from localStorage
        // This ensures a completely fresh start for the next booking

        // First, collect all keys to remove (to avoid index shifting issues)
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith('booking') ||
              key.startsWith('enhanced_booking') ||
              key === 'pending_booking_data' ||
              key === 'booking_form_data' ||
              key === 'booking-form-draft') // ← The component uses this to restore saved progress
          ) {
            keysToRemove.push(key);
          }
        }

        // Now remove all collected keys
        keysToRemove.forEach((key) => localStorage.removeItem(key));

        logger.info('Cleaned up ALL localStorage booking data after successful booking creation', {
          component: 'VerifyCardSuccess',
          action: 'cleanup_complete',
          metadata: {
            bookingId: result.bookingId,
            clearedKeys: keysToRemove,
            totalKeysCleared: keysToRemove.length,
          },
        });
      } catch (error: unknown) {
        logger.error(
          'Card verification or booking creation failed',
          {
            component: 'VerifyCardSuccess',
            action: 'error',
            metadata: { error: error.message },
          },
          error
        );

        setStatus('error');
        setMessage(error.message || 'Failed to complete booking');
      }
    };

    processSuccess();
  }, [searchParams, router]);

  return (
    <>
      {/* Show modal when booking is successfully created */}
      {status === 'success' && bookingData && (
        <BookingConfirmedModal
          isOpen={true}
          bookingNumber={bookingData.bookingNumber}
          bookingId={bookingData.bookingId}
        />
      )}

      {/* Processing/Error States */}
      {(status === 'processing' || status === 'error') && (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
            {status === 'processing' && (
              <div className="flex flex-col items-center">
                <svg
                  className="mb-4 h-16 w-16 animate-spin text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <h2 className="text-xl font-bold text-gray-900">{message}</h2>
                <p className="mt-2 text-sm text-gray-600">Please wait...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-red-900">❌ {message}</h2>
                <p className="mt-4 text-sm text-gray-600">Please try again or contact support.</p>
                <button
                  onClick={() => router.push('/book')}
                  className="mt-6 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Return to Booking
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function VerifyCardSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyCardSuccessContent />
    </Suspense>
  );
}
