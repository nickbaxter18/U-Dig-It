'use client';

import { logger } from '@/lib/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Payment Success Handler
 * Detects payment=success query parameter and handles post-payment refresh
 */
export default function PaymentSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!searchParams) return;

    const paymentStatus = searchParams.get('payment');

    if (!paymentStatus) return;

    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && !isProcessing) {
      setIsProcessing(true);
      setErrorMessage(null);

      logger.info('Payment success detected', {
        component: 'PaymentSuccessHandler',
        action: 'payment_success_detected',
      });

      // Get booking ID from URL
      const pathParts = window.location.pathname.split('/');
      const bookingId = pathParts[pathParts.indexOf('booking') + 1];
      const paymentType = searchParams.get('type') || 'payment';

      const endpoint =
        sessionId != null
          ? '/api/stripe/checkout/complete'
          : '/api/payments/mark-completed';

      const payload =
        sessionId != null
          ? { sessionId, bookingId, paymentType }
          : { bookingId, paymentType };

      console.log('🚀 [PaymentSuccessHandler] Finalizing payment:', {
        bookingId,
        paymentType,
        sessionId,
        endpoint,
      });

      let encounteredError = false;

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
        .then(async res => {
          console.log('📥 [PaymentSuccessHandler] API Response Status:', res.status);
          const data = await res.json().catch(() => ({}));

          if (!res.ok || data.error) {
            const error = data.error || `Request failed (${res.status})`;
            console.error('❌ [PaymentSuccessHandler] API Error:', error);
            setErrorMessage(error);
            encounteredError = true;
          } else {
            console.log('✅ [PaymentSuccessHandler] API Response Data:', data);
          }

          logger.info('Payment finalization result', {
            component: 'PaymentSuccessHandler',
            action: 'payment_finalized',
            metadata: {
              success: !data.error,
              error: data.error,
              sessionId,
              endpoint,
            },
          });
        })
        .catch(err => {
          console.error('❌ [PaymentSuccessHandler] Fetch Error:', err);
          setErrorMessage('Failed to finalize payment. Please refresh to retry.');
          encounteredError = true;

          logger.error(
            'Failed to finalize payment after checkout',
            {
              component: 'PaymentSuccessHandler',
              action: 'finalization_error',
              metadata: { sessionId, endpoint },
            },
            err
          );
        })
        .finally(() => {
          if (!encounteredError) {
            setTimeout(() => {
              window.location.href = window.location.pathname;
            }, 2000);
          }
        });
    } else if (paymentStatus === 'cancelled') {
      logger.info('Payment cancelled by user', {
        component: 'PaymentSuccessHandler',
        action: 'payment_cancelled',
      });

      // Remove the query parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('session_id');
      router.replace(url.pathname + url.search);
    }
  }, [searchParams, router, isProcessing]); // Stable dependencies

  // Show loading indicator while waiting for refresh
  if (searchParams?.get('payment') === 'success' && isProcessing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="rounded-lg bg-white p-8 text-center shadow-xl">
          <div className="mb-4 flex justify-center">
            <svg
              className="h-16 w-16 animate-spin text-green-600"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">
            ✅ Payment Successful!
          </h3>
          <p className="text-gray-600">Updating your booking status...</p>
          {errorMessage ? (
            <p className="mt-3 text-sm text-red-600">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}

