'use client';

/**
 * Booking Completion Trigger Component
 * Automatically detects when all 5 requirements are met and triggers booking confirmation
 */

import { confirmBookingAutomatically } from '@/app/booking/[id]/actions-completion';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BookingCompletionTriggerProps {
  bookingId: string;
  bookingNumber: string;
  completionSteps: {
    contract_signed: boolean;
    insurance_uploaded: boolean;
    license_uploaded: boolean;
    payment_completed: boolean;
    deposit_paid: boolean;
  };
  currentStatus: string;
}

export default function BookingCompletionTrigger({
  bookingId,
  bookingNumber,
  completionSteps,
  currentStatus,
}: BookingCompletionTriggerProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Check if all steps are complete
  const allStepsComplete = Object.values(completionSteps).every(Boolean);
  const isPending = currentStatus === 'pending';
  const isConfirmed = currentStatus === 'confirmed' || currentStatus === 'insurance_verified';
  const shouldShowCompleteButton = allStepsComplete && isPending;
  const shouldShowReadyState = allStepsComplete && (isConfirmed || currentStatus === 'paid');

  useEffect(() => {
    // Show success banner when all steps complete
    if (allStepsComplete && isPending && !showSuccessBanner) {
      setShowSuccessBanner(true);
    }
  }, [allStepsComplete, isPending, showSuccessBanner]);

  useEffect(() => {
    if (!allStepsComplete) return;
    if (autoTriggered) return;

    (async () => {
      try {
        setAutoTriggered(true);
        logger.info('Auto-triggering booking confirmation', {
          component: 'BookingCompletionTrigger',
          action: 'auto_confirm_start',
          metadata: { bookingId, bookingNumber, currentStatus },
        });

        const result = await confirmBookingAutomatically(bookingId);

        if (result.success) {
          logger.info('Booking auto-confirmed via banner', {
            component: 'BookingCompletionTrigger',
            action: 'auto_confirm_success',
            metadata: { bookingId, bookingNumber, redirectUrl: result.redirectUrl },
          });
          router.refresh();
        } else {
          logger.warn('Auto confirmation attempt reported incomplete requirements', {
            component: 'BookingCompletionTrigger',
            action: 'auto_confirm_incomplete',
            metadata: { bookingId, bookingNumber, error: result.error },
          });
          setAutoTriggered(false);
        }
      } catch (autoError) {
        logger.error('Auto confirmation trigger failed', {
          component: 'BookingCompletionTrigger',
          action: 'auto_confirm_error',
          metadata: { bookingId, bookingNumber },
        }, autoError instanceof Error ? autoError : new Error(String(autoError)));
        setAutoTriggered(false);
      }
    })();
  }, [allStepsComplete, autoTriggered, bookingId, bookingNumber, currentStatus, router]);

  const handleCompleteBooking = async () => {
    if (!allStepsComplete) {
      setError('Please complete all requirements before finalizing your booking.');
      return;
    }

    try {
      setIsConfirming(true);
      setError(null);

      logger.info('User triggering booking confirmation', {
        component: 'BookingCompletionTrigger',
        action: 'confirm_clicked',
        metadata: { bookingId, bookingNumber },
      });

      const result = await confirmBookingAutomatically(bookingId);

      if (!result.success) {
        setError(result.error || 'Failed to confirm booking');
        logger.error('Booking confirmation failed', {
          component: 'BookingCompletionTrigger',
          action: 'confirm_failed',
          metadata: { bookingId, error: result.error },
        });
        return;
      }

      logger.info('Booking confirmed successfully, redirecting', {
        component: 'BookingCompletionTrigger',
        action: 'confirm_success',
        metadata: {
          bookingId,
          bookingNumber: result.bookingNumber,
          redirectUrl: result.redirectUrl,
        },
      });

      // Show brief success message before redirect
      setShowSuccessBanner(true);

      // Redirect to confirmed page
      setTimeout(() => {
        router.push(result.redirectUrl || `/booking/${bookingId}/confirmed`);
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      logger.error('Error in booking confirmation:', {
        component: 'BookingCompletionTrigger',
        action: 'error',
      }, err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsConfirming(false);
    }
  };

  // Don't render anything if not all steps complete
  if (!allStepsComplete) {
    return null;
  }

  // Show "Ready State" when confirmed
  if (shouldShowReadyState) {
    return (
      <div className="mb-6">
        {/* Success Banner - Booking Ready */}
        <div className="animate-fade-in rounded-lg border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 p-8 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-6 flex-1">
              <h2 className="text-2xl font-bold text-green-900">
                🎉 Your Booking is Confirmed & Ready!
              </h2>
              <p className="mt-3 text-lg text-green-800">
                All requirements have been completed successfully. Your equipment rental for{' '}
                <strong>Booking #{bookingNumber}</strong> is confirmed and ready for delivery.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-800 shadow-sm">
                  <svg className="mr-2 h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Contract Signed
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-800 shadow-sm">
                  <svg className="mr-2 h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Insurance Approved
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-800 shadow-sm">
                  <svg className="mr-2 h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Payment Complete
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* What Happens Next - Confirmed Booking */}
        <div className="mt-6 rounded-lg border border-green-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 flex items-center text-xl font-bold text-gray-900">
            <svg className="mr-3 h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            What Happens Next
          </h3>
          <ol className="space-y-4 text-gray-700">
            <li className="flex items-start">
              <span className="mr-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                1
              </span>
              <div>
                <strong className="text-gray-900">Confirmation Email Sent:</strong>
                <p className="mt-1 text-sm">You'll receive a confirmation email with all booking details, contract copy, and delivery schedule</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                2
              </span>
              <div>
                <strong className="text-gray-900">Pre-Delivery Contact (24hrs before):</strong>
                <p className="mt-1 text-sm">Our team will call to confirm delivery time and any special requirements</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                3
              </span>
              <div>
                <strong className="text-gray-900">Equipment Delivery:</strong>
                <p className="mt-1 text-sm">Kubota SVL-75 will be delivered to your job site with full tank and safety equipment</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                4
              </span>
              <div>
                <strong className="text-gray-900">Safety Orientation:</strong>
                <p className="mt-1 text-sm">Our operator will provide equipment walkthrough and safety instructions</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                5
              </span>
              <div>
                <strong className="text-gray-900">24/7 Support During Rental:</strong>
                <p className="mt-1 text-sm">Emergency support available at (506) 643-1575 throughout your rental period</p>
              </div>
            </li>
          </ol>

          <div className="mt-6 rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-800">
              <strong>📞 Questions?</strong> Contact us at{' '}
              <a href="tel:+15066431575" className="font-semibold underline">
                (506) 643-1575
              </a>{' '}
              or{' '}
              <a href="mailto:info@udigit.ca" className="font-semibold underline">
                info@udigit.ca
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not all steps complete
  if (!shouldShowCompleteButton) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Success Banner */}
      {showSuccessBanner && !isConfirming && (
        <div className="mb-4 animate-fade-in rounded-lg border-2 border-green-500 bg-green-50 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-green-900">
                🎉 All Requirements Completed!
              </h3>
              <p className="mt-2 text-green-800">
                Excellent! You've completed all 5 required steps. Your booking is ready to be
                finalized.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Complete Booking Button */}
      <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 text-center shadow-sm">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Ready to Finalize Your Rental
          </h2>
          <p className="mb-6 text-gray-700">
            All requirements have been met. Click below to confirm your booking and receive
            your confirmation email.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleCompleteBooking}
            disabled={isConfirming}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConfirming ? (
              <>
                <svg
                  className="mr-3 h-6 w-6 animate-spin"
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
                Confirming Your Booking...
              </>
            ) : (
              <>
                <svg
                  className="mr-3 h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Complete Booking & Confirm Rental
                <svg
                  className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </button>

          <p className="mt-4 text-sm text-gray-600">
            By completing this booking, you confirm that all information is accurate and you agree
            to the rental terms.
          </p>
        </div>
      </div>

      {/* What Happens Next Preview */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-white p-6">
        <h3 className="mb-4 flex items-center font-semibold text-blue-900">
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          What Happens After Confirmation?
        </h3>
        <ol className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
              1
            </span>
            <span>
              <strong>Instant Confirmation:</strong> You'll receive a confirmation email with all
              booking details
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
              2
            </span>
            <span>
              <strong>Contract Copy:</strong> A signed copy of your rental agreement will be
              emailed to you
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
              3
            </span>
            <span>
              <strong>Pre-Delivery Contact:</strong> We'll call you 24 hours before your rental
              starts to confirm delivery details
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
              4
            </span>
            <span>
              <strong>Equipment Delivery:</strong> Your equipment will be delivered on your
              scheduled start date
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
              5
            </span>
            <span>
              <strong>Safety Orientation:</strong> Our operator will provide a brief safety
              orientation and equipment walkthrough
            </span>
          </li>
        </ol>

        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>📞 Need Help?</strong> Our team is standing by at{' '}
            <a href="tel:+15066431575" className="font-semibold underline">
              (506) 643-1575
            </a>{' '}
            or email{' '}
            <a href="mailto:info@udigit.ca" className="font-semibold underline">
              info@udigit.ca
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}


