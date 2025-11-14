/**
 * Card Verification Component
 *
 * Simplified Hold System:
 *   1. Collects and securely saves payment method via Stripe Checkout
 *   2. No charges made - only verification
 *   3. $500 security hold scheduled for T-48 hours before pickup
 *   4. Hold automatically released 24 hours after equipment return
 */

'use client';

import { logger } from '@/lib/logger';
import { useState } from 'react';

// Using Stripe Checkout (hosted page) instead of inline Elements
// This is more reliable and handles all edge cases automatically
const USE_STRIPE_CHECKOUT = true;

interface VerificationHoldPaymentProps {
  bookingId: string;
  customerId: string;
  startDate: string;
  totalAmount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Timeline chip component
function TimelineChip({
  icon,
  label,
  description,
  status,
}: {
  icon: string;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'future';
}) {
  const bgColor = {
    completed: 'bg-green-100 border-green-300',
    current: 'bg-blue-100 border-blue-400',
    upcoming: 'bg-yellow-100 border-yellow-300',
    future: 'bg-gray-100 border-gray-300',
  }[status];

  const textColor = {
    completed: 'text-green-800',
    current: 'text-blue-900',
    upcoming: 'text-yellow-900',
    future: 'text-gray-600',
  }[status];

  const iconBgColor = {
    completed: 'bg-green-200',
    current: 'bg-blue-200',
    upcoming: 'bg-yellow-200',
    future: 'bg-gray-200',
  }[status];

  return (
    <div className={`flex-1 rounded-lg border-2 ${bgColor} p-3`}>
      <div className="flex items-center space-x-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBgColor} text-lg`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className={`text-xs font-semibold uppercase ${textColor}`}>{label}</div>
          <div className={`text-xs ${textColor} mt-0.5`}>{description}</div>
        </div>
      </div>
    </div>
  );
}

// Main payment form component
function VerificationHoldForm({
  bookingId,
  customerId: _customerId,
  startDate,
  totalAmount: _totalAmount,
  onSuccess: _onSuccess,
  onError,
}: VerificationHoldPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'card_entry' | 'processing' | 'success'>('card_entry');

  // Calculate T-48 date
  const pickupDate = new Date(startDate);
  const t48Date = new Date(pickupDate.getTime() - (48 * 60 * 60 * 1000));
  const isWithin48h = t48Date <= new Date();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use Stripe Checkout (hosted page) - most reliable method
    if (USE_STRIPE_CHECKOUT) {
      setIsProcessing(true);
      setCurrentStep('processing');

      try {
        logger.info('Creating Stripe Checkout Session for card verification', {
          component: 'VerificationHoldPayment',
          action: 'create_checkout',
          metadata: { bookingId },
        });

        const response = await fetch('/api/stripe/create-setup-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const result = await response.json();

        logger.info('Redirecting to Stripe Checkout', {
          component: 'VerificationHoldPayment',
          action: 'redirect',
          metadata: { sessionId: result.sessionId },
        });

        // Redirect to Stripe Checkout
        window.location.href = result.url;
        return;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start card verification';
        logger.error('Failed to create checkout session', {
          component: 'VerificationHoldPayment',
          action: 'error',
          metadata: { error: errorMessage },
        }, error instanceof Error ? error : new Error(String(error)));

        setIsProcessing(false);
        setCurrentStep('card_entry');
        onError(errorMessage);
        return;
      }
    }

    // Stripe Checkout flow handles everything
    // User will be redirected back to /book/verify-card-success after completion
  };

  return (
    <div className="space-y-6">
      {/* Timeline Section */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Security Hold Timeline</h3>
        <div className="flex space-x-2">
          <TimelineChip
            icon={currentStep === 'success' ? '✓' : currentStep === 'processing' ? '⏳' : '💳'}
            label="Right Now"
            description="Save card securely"
            status={currentStep === 'success' ? 'completed' : 'current'}
          />
          <TimelineChip
            icon="🔒"
            label={isWithin48h ? 'Soon' : 'T-48 Hours'}
            description="$500 hold placed"
            status="upcoming"
          />
          <TimelineChip
            icon="✅"
            label="After Return"
            description="Hold released"
            status="future"
          />
        </div>
      </div>

      {/* Explanation Card */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 font-semibold text-blue-900">
          💡 What Happens Next
        </h4>
        <ul className="space-y-2 text-sm text-blue-800 leading-relaxed">
          <li className="flex items-start">
            <span className="mr-2 mt-0.5 font-bold text-blue-600">1.</span>
            <span>
              We'll securely save your payment method with Stripe.{' '}
              <strong>No charges will be made right now</strong> — this is only to verify your card and keep it on file.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 mt-0.5 font-bold text-blue-600">2.</span>
            <span>
              A <strong>$500 refundable security hold</strong> will be automatically placed{' '}
              {isWithin48h ? (
                <strong className="text-yellow-800">within the next few hours</strong>
              ) : (
                <>
                  on <strong>{t48Date.toLocaleDateString()} at {t48Date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                </>
              )}{' '}
              (48 hours before your pickup). This is <strong>NOT a charge</strong> — it's a temporary authorization.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 mt-0.5 font-bold text-blue-600">3.</span>
            <span>
              The $500 hold is <strong>automatically released within 24 hours</strong> when you return the equipment clean, refueled, and in good condition.
              The hold may be charged for damage beyond normal wear, failure to refuel, or excessive mud/debris.
            </span>
          </li>
        </ul>
      </div>

      {/* Card Entry Form */}
      <form onSubmit={handleSubmit} className="rounded-lg border-2 border-gray-200 bg-white p-6 shadow-lg">
        <h4 className="mb-6 text-xl font-bold text-gray-900">
          {currentStep === 'success' ? '✅ Card Verified!' : '💳 Enter Your Card Details'}
        </h4>

        {currentStep === 'card_entry' && (
          <>
            {/* Trust Badge */}
            <div className="mb-4 flex items-center justify-center space-x-3 rounded-lg bg-green-50 border border-green-200 p-3">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-semibold text-green-800">Secure Payment Powered by</span>
              <div className="flex items-center">
                <span className="text-sm font-bold text-[#635BFF]">Stripe</span>
              </div>
            </div>

            {/* Stripe Checkout Info */}
            <div className="mb-6">
              <div className="relative rounded-lg border-2 border-blue-300 bg-blue-50 p-6">
                <div className="mb-4 flex items-center space-x-3">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900">Secure Card Verification</h4>
                    <p className="text-sm text-blue-700">Powered by Stripe Checkout</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-blue-800">
                  <p className="leading-relaxed">
                    Click the button below to securely save your payment method. You'll be redirected to Stripe's secure page where you can safely enter your card details.
                    <strong className="block mt-2 text-blue-900">No charges will be made at this time.</strong>
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Your card information is encrypted and never stored on our servers</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Bank-level security with 3D Secure authentication when required</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>PCI-DSS Level 1 certified payment processing by Stripe</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full rounded-lg py-3 font-semibold text-white transition-colors ${
                isProcessing
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-[#A90F0F] hover:bg-[#8a0c0c]'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="mr-2 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Redirecting to Stripe...
                </span>
              ) : (
                'Save Card & Complete Booking'
              )}
            </button>
          </>
        )}

        {currentStep === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="mb-4 h-12 w-12 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-semibold text-gray-900">Verifying your card...</p>
            <p className="mt-2 text-sm text-gray-600">This will only take a moment</p>
          </div>
        )}

        {currentStep === 'success' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-xl font-bold text-green-900">Card Saved Successfully!</p>
            <p className="mt-2 text-sm text-gray-600">
              Your payment method is securely saved
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Completing your booking...
            </p>
          </div>
        )}
      </form>

      {/* Security Note */}
      <div className="rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
        <p className="font-semibold text-gray-800 mb-2">🔒 Your Security is Our Priority</p>
        <ul className="space-y-1">
          <li>• Card details encrypted with TLS 1.3</li>
          <li>• PCI-DSS Level 1 compliant (Stripe)</li>
          <li>• Never stored on our servers</li>
          <li>• No charges made during card verification</li>
          <li>• $500 security hold only placed 48 hours before pickup</li>
        </ul>
      </div>
    </div>
  );
}

// Main component export - using Stripe Checkout (no Elements needed)
export default function VerificationHoldPayment(props: VerificationHoldPaymentProps) {
  // When using Stripe Checkout, we don't need Elements provider
  // Just render the form directly
  return <VerificationHoldForm {...props} />;
}

