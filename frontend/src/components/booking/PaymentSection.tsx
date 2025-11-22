'use client';

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { isBookingStatusConsideredPaid } from '@/lib/payments';

import BookingInvoiceCard from './BookingInvoiceCard';

interface Payment {
  id: string;
  amount: number;
  status: string;
  type: string;
  stripePaymentIntentId?: string;
  processedAt?: string;
  createdAt?: string;
}

interface PaymentSectionProps {
  booking: unknown;
  payment?: Payment;
  paymentType: 'deposit' | 'payment';
  _onPaymentComplete?: () => void; // Reserved for future payment completion callback
}

export default function PaymentSection({
  booking,
  payment,
  paymentType,
  onPaymentComplete: _onPaymentComplete, // Reserved for future payment completion callback
}: PaymentSectionProps) {
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  // Extract values from booking
  const bookingId = booking.id;
  const totalAmount = Number(booking.totalAmount);
  const depositAmount = Number(booking.securityDeposit);

  // Validate UUID format
  const isValidUUID = (id: string | undefined | null): boolean => {
    if (!id || typeof id !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Diagnostic logging for payment object structure
  useEffect(() => {
    if (payment) {
      logger.info('PaymentSection: Payment object received', {
        component: 'PaymentSection',
        action: 'payment_object_received',
        metadata: {
          hasId: !!payment.id,
          idType: typeof payment.id,
          idValue: payment.id,
          isValidUUID: isValidUUID(payment.id),
          paymentStatus: payment.status,
          paymentType: payment.type,
          paymentAmount: payment.amount,
          hasProcessedAt: !!payment.processedAt,
        },
      });

      // Log warning if payment.id is missing or invalid
      if (!payment.id) {
        logger.warn('PaymentSection: Payment object missing id field', {
          component: 'PaymentSection',
          action: 'payment_missing_id',
          metadata: { payment },
        });
      } else if (!isValidUUID(payment.id)) {
        logger.warn('PaymentSection: Payment id is not a valid UUID', {
          component: 'PaymentSection',
          action: 'payment_invalid_uuid',
          metadata: { paymentId: payment.id },
        });
      }
    } else {
      logger.debug('PaymentSection: No payment object provided', {
        component: 'PaymentSection',
        action: 'no_payment_object',
        metadata: { paymentType, bookingId },
      });
    }
  }, [payment, paymentType, bookingId]);

  // Determine which type this is
  const isDeposit = paymentType === 'deposit';
  const amount = isDeposit ? depositAmount : totalAmount;
  // For deposits, check if card is verified; for payments, check if paid
  const isPaid = isDeposit
    ? false
    : (payment?.status ?? '').toLowerCase() === 'completed' ||
      isBookingStatusConsideredPaid(booking.status);

  const handlePayment = async () => {
    try {
      setProcessingPayment(true);
      setError(null);

      logger.info('Creating checkout session', {
        component: 'PaymentSection',
        action: 'checkout_start',
        metadata: { bookingId, paymentType },
      });

      // Create Stripe Checkout Session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          paymentType: isDeposit ? 'deposit' : 'payment',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.url) {
        throw new Error('No checkout URL received from server');
      }

      logger.info('Checkout session created, redirecting', {
        component: 'PaymentSection',
        action: 'checkout_redirect',
        metadata: { sessionId: data.sessionId },
      });

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: unknown) {
      logger.error(
        'Checkout session error:',
        {
          component: 'PaymentSection',
          action: 'error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err.message || 'Failed to create checkout session');
      setProcessingPayment(false);
    }
  };

  // Check if card is verified (for deposit section)
  const cardVerified = !!booking.stripe_payment_method_id;

  // Handle receipt link click with error handling
  const handleReceiptClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setReceiptError(null);

    if (!payment?.id) {
      setReceiptError('Payment ID is missing. Cannot generate receipt.');
      logger.error('Receipt link clicked but payment.id is missing', {
        component: 'PaymentSection',
        action: 'receipt_click_missing_id',
        metadata: { payment },
      });
      return;
    }

    if (!isValidUUID(payment.id)) {
      setReceiptError('Invalid payment ID format. Cannot generate receipt.');
      logger.error('Receipt link clicked with invalid UUID', {
        component: 'PaymentSection',
        action: 'receipt_click_invalid_uuid',
        metadata: { paymentId: payment.id },
      });
      return;
    }

    const receiptUrl = `/api/payments/receipt/${payment.id}`;

    logger.info('Opening receipt', {
      component: 'PaymentSection',
      action: 'receipt_link_clicked',
      metadata: { paymentId: payment.id, receiptUrl },
    });

    try {
      // Try to open in new tab
      const newWindow = window.open(receiptUrl, '_blank', 'noopener,noreferrer');

      if (!newWindow) {
        // Popup blocked - try direct navigation
        logger.warn('Popup blocked, attempting direct navigation', {
          component: 'PaymentSection',
          action: 'receipt_popup_blocked',
          metadata: { paymentId: payment.id },
        });
        window.location.href = receiptUrl;
      } else {
        // Check if window was successfully opened
        setTimeout(() => {
          if (newWindow.closed) {
            setReceiptError('Failed to open receipt. Please check your popup blocker settings.');
            logger.warn('Receipt window closed immediately', {
              component: 'PaymentSection',
              action: 'receipt_window_closed',
              metadata: { paymentId: payment.id },
            });
          }
        }, 1000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open receipt';
      setReceiptError(errorMessage);
      logger.error(
        'Error opening receipt',
        {
          component: 'PaymentSection',
          action: 'receipt_open_error',
          metadata: { paymentId: payment.id, error: errorMessage },
        },
        err instanceof Error ? err : new Error(String(err))
      );
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {isDeposit ? '💳 Card Verification & Security Hold' : '💳 Pay Invoice'}
        </h2>
        {(isDeposit ? cardVerified : isPaid) && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {isDeposit ? 'Card Verified ✓' : 'Invoice Paid'}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center">
            <svg className="mr-2 h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Card Verification Section (for Deposits) or Invoice (for Payments) */}
        {isDeposit && cardVerified ? (
          /* Show Card Verification Success Status */
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-7 w-7 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    Payment Method Verified ✓
                  </h3>
                  <p className="text-sm text-green-700">Card securely saved with Stripe</p>
                </div>
              </div>
            </div>

            {/* Security Hold Information */}
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-3 flex items-center text-sm font-semibold text-blue-900">
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  How the $500 Security Hold Works
                </h4>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start">
                    <span className="mr-2 mt-0.5 font-bold text-blue-600">1.</span>
                    <div>
                      <strong>48 Hours Before Pickup:</strong>
                      <p className="mt-1 text-xs leading-relaxed">
                        We'll automatically place a <strong>$500 refundable hold</strong> on your
                        saved card on{' '}
                        <strong>
                          {new Date(
                            new Date(booking.startDate).getTime() - 48 * 60 * 60 * 1000
                          ).toLocaleDateString()}{' '}
                          at{' '}
                          {new Date(
                            new Date(booking.startDate).getTime() - 48 * 60 * 60 * 1000
                          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </strong>
                        . This is <strong>NOT a charge</strong> — it's a temporary authorization.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2 mt-0.5 font-bold text-blue-600">2.</span>
                    <div>
                      <strong>During Your Rental:</strong>
                      <p className="mt-1 text-xs leading-relaxed">
                        The $500 hold remains active while you have the equipment. This protects
                        against damage, loss, or failure to meet return requirements.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2 mt-0.5 font-bold text-blue-600">3.</span>
                    <div>
                      <strong>After Return:</strong>
                      <p className="mt-1 text-xs leading-relaxed">
                        When you return the equipment{' '}
                        <strong>clean, refueled, and in good condition</strong>, we automatically
                        release the hold within 24 hours. The hold may be charged for damage beyond
                        normal wear, failure to refuel, or excessive mud/debris.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Requirements */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900 flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-gray-600"
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
                  Return Requirements for Full Hold Release
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2 text-green-600">✓</span>
                    <span>
                      <strong>Clean:</strong> Remove excessive mud/debris (normal working dirt is
                      fine)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-green-600">✓</span>
                    <span>
                      <strong>Refueled:</strong> Return with a full fuel tank
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-green-600">✓</span>
                    <span>
                      <strong>Good Condition:</strong> No damage beyond normal wear and tear
                    </span>
                  </li>
                </ul>
                <p className="mt-3 text-xs text-gray-500 italic">
                  Failure to meet these requirements may result in charges from the security hold
                  for cleaning ($150), refueling (fuel cost + $50), or repairs.
                </p>
              </div>

              {/* Card Details */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-900">
                  💳 Payment Method on File
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg
                      className="mr-2 h-5 w-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">Card ending in ••••</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Saved securely with Stripe. Will be used for the $500 security hold.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {!isDeposit && (
              <h3 className="text-lg font-semibold text-gray-900">📄 Rental Invoice</h3>
            )}
            {isDeposit && (
              <div className="rounded-lg border-2 border-gray-200 p-6">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    💳 Card Verification Required
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Verify your payment method for the $500 security hold
                  </p>
                </div>
              </div>
            )}

            {/* Professional Invoice (only for payment, not deposit) */}
            {!isDeposit && <BookingInvoiceCard booking={booking} />}

            {/* Payment Button - Only for Invoice, not Deposit */}
            {!isDeposit && (
              <>
                {isPaid ? (
                  <div className="space-y-3">
                    <div className="flex items-center rounded-lg bg-green-50 px-4 py-3 text-green-600">
                      <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">✅ Invoice Paid</span>
                      {payment?.processedAt && (
                        <span className="ml-auto text-sm text-green-700">
                          {new Date(payment.processedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {payment?.id && isValidUUID(payment.id) && (
                      <div className="space-y-2">
                        <a
                          href={`/api/payments/receipt/${payment.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleReceiptClick}
                          className="flex items-center justify-center rounded-lg border border-[#A90F0F] px-4 py-2 text-sm font-semibold text-[#A90F0F] transition-colors hover:bg-[#A90F0F] hover:text-white"
                        >
                          View Receipt
                        </a>
                        {receiptError && (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-2">
                            <p className="text-xs text-red-800">{receiptError}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {payment?.id && !isValidUUID(payment.id) && (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2">
                        <p className="text-xs text-yellow-800">
                          Receipt unavailable: Invalid payment ID format
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handlePayment}
                    disabled={processingPayment}
                    className="w-full rounded-lg px-6 py-4 text-lg font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 bg-[#A90F0F] hover:bg-[#8B0B0B]"
                  >
                    {processingPayment ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
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
                        Creating Secure Checkout...
                      </span>
                    ) : (
                      <>💳 Pay Invoice - ${amount.toFixed(2)}</>
                    )}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* Manual Interac e-Transfer Option (Invoice Only) */}
        {!isDeposit && !isPaid && (
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
            <div className="mb-4 flex items-center">
              <svg
                className="mr-2 h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-green-900">
                💸 Pay by Interac e-Transfer (Zero Fees!)
              </h3>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-green-800">
                <strong>Save money!</strong> Pay directly from your bank with no processing fees.
              </p>

              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">
                  How to pay with Interac e-Transfer:
                </h4>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2 font-bold text-green-600">1.</span>
                    <span>Open your banking app or online banking</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 font-bold text-green-600">2.</span>
                    <span>Select "Send Money" or "Interac e-Transfer"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 font-bold text-green-600">3.</span>
                    <div className="flex-1">
                      <span>
                        Send <strong className="font-bold">${amount.toFixed(2)} CAD</strong> to:
                      </span>
                      <div className="mt-1 rounded bg-gray-100 px-3 py-2 font-mono text-base font-bold text-gray-900">
                        info@udigit.ca
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 font-bold text-green-600">4.</span>
                    <div className="flex-1">
                      <span>In the message field, include your booking number:</span>
                      <div className="mt-1 rounded bg-gray-100 px-3 py-2 font-mono text-sm font-bold text-gray-900">
                        {booking.bookingNumber}
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 font-bold text-green-600">5.</span>
                    <span>We'll confirm your payment within 1 business day</span>
                  </li>
                </ol>
              </div>

              <div className="flex items-start rounded-lg bg-green-100 p-3">
                <svg
                  className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-xs text-green-800">
                  <strong>Note:</strong> Most e-Transfers are auto-deposited instantly. Your booking
                  will be confirmed once we receive payment. Need help? Call us at (506) 643-1575.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div
          className={`rounded-lg border p-4 ${
            isDeposit ? 'border-blue-200 bg-blue-50' : 'border-yellow-200 bg-yellow-50'
          }`}
        >
          <div className="flex items-start">
            <svg
              className={`mr-2 mt-0.5 h-5 w-5 ${isDeposit ? 'text-blue-600' : 'text-yellow-600'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h4
                className={`mb-1 text-sm font-semibold ${
                  isDeposit ? 'text-blue-900' : 'text-yellow-900'
                }`}
              >
                {isDeposit ? '💰 Refundable Security Hold' : '🔒 Secure Payment'}
              </h4>
              <p className={`text-sm ${isDeposit ? 'text-blue-800' : 'text-yellow-800'}`}>
                {isDeposit
                  ? 'This $500 temporary hold is automatically placed 48 hours before pickup and released within 24 hours after you return the equipment clean, refueled, and in good condition. Not a charge — just a temporary authorization on your card.'
                  : 'Payments are processed securely through Stripe. Your payment information is encrypted and never stored on our servers.'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        {payment && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              {isDeposit ? 'Deposit' : 'Payment'} Details
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-gray-900">${payment.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    payment.status === 'completed'
                      ? 'text-green-600'
                      : payment.status === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
              </div>
              {payment.processedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Processed:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(payment.processedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
