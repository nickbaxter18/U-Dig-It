/**
 * Hold System Explanation Modal
 *
 * Shows after clicking "Confirm Booking" to explain the hold system
 * before proceeding to Stripe card collection.
 */

'use client';

interface HoldSystemExplanationModalProps {
  isOpen: boolean;
  startDate: string;
  onClose: () => void;
  onProceed: () => void;
}

export default function HoldSystemExplanationModal({
  isOpen,
  startDate,
  onClose,
  onProceed,
}: HoldSystemExplanationModalProps) {
  if (!isOpen) return null;

  // Calculate T-48 date
  const pickupDate = new Date(startDate);
  const t48Date = new Date(pickupDate.getTime() - (48 * 60 * 60 * 1000));
  const isWithin48h = t48Date <= new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E1BC56] to-[#D4A843] px-6 py-4 rounded-t-xl flex-shrink-0">
          <h2 className="text-xl font-bold text-white">💳 Card Verification & Security Hold</h2>
          <p className="mt-1 text-white/90 text-sm">Simple, secure, and transparent</p>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">

          {/* Why We Need This */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center text-sm">
              <span className="mr-2">💡</span>
              How This Works
            </h3>
            <p className="text-blue-800 text-xs leading-relaxed">
              We need to verify your payment method and have a card on file for the security hold. <strong>No charges will be made right now.</strong>
              {' '}We'll place a <strong>$500 refundable security hold</strong> 48 hours before your pickup to protect the equipment.
              The hold is <strong>automatically released within 24 hours</strong> when you return the equipment clean, refueled, and in good condition.
            </p>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">📅 What Happens Next</h3>
            <div className="space-y-3">
              {/* Step 1 - Card Verification */}
              <div className="flex items-start space-x-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold shrink-0 text-xs">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">Right Now: Save Your Card</div>
                  <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                    We'll securely save your payment method with Stripe. <strong className="text-green-600">No charges</strong> will be made at this time.
                    Your card information is encrypted and never stored on our servers.
                  </div>
                </div>
              </div>

              {/* Step 2 - $500 Security Hold */}
              <div className="flex items-start space-x-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold shrink-0 text-xs">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">
                    {isWithin48h ? 'Within Hours' : `${t48Date.toLocaleDateString()}`}: $500 Security Hold
                  </div>
                  <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {isWithin48h ? (
                      <>We'll place a <strong>$500 refundable hold</strong> on your card within the next few hours (your pickup is soon!).</>
                    ) : (
                      <>Exactly 48 hours before your pickup, we'll automatically place a <strong>$500 refundable hold</strong> on your card.</>
                    )}
                    {' '}This is <strong className="text-blue-600">NOT a charge</strong> — it's a temporary authorization that protects the equipment during your rental.
                  </div>
                </div>
              </div>

              {/* Step 3 - Hold Released */}
              <div className="flex items-start space-x-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold shrink-0 text-xs">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">After Return: Hold Released</div>
                  <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                    When you return the equipment clean, refueled, and in good condition, we <strong className="text-purple-600">automatically release the $500 hold within 24 hours</strong>.
                    The hold may be charged for damage beyond normal wear, failure to refuel, or excessive mud/debris. No calls or emails needed!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <h3 className="font-semibold text-green-900 mb-2 text-sm">✅ Key Benefits</h3>
            <ul className="space-y-1.5 text-xs text-green-800">
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 text-green-600">✓</span>
                <span><strong>No immediate charges</strong> — we only verify your card and save it securely</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 text-green-600">✓</span>
                <span><strong>Automated hold management</strong> — placed and released automatically, no action needed from you</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 text-green-600">✓</span>
                <span><strong>Complete transparency</strong> — you know exactly when the $500 hold will be placed and released</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 text-green-600">✓</span>
                <span><strong>Bank-level security</strong> — powered by Stripe with PCI-DSS Level 1 compliance and TLS 1.3 encryption</span>
              </li>
            </ul>
          </div>

          {/* Security Note */}
          <div className="flex items-start space-x-2 rounded-lg bg-gray-50 p-3">
            <div className="text-lg">🔐</div>
            <div className="flex-1 text-xs text-gray-700">
              <p className="font-semibold mb-1">Your Security is Our Priority</p>
              <p>
                Your card details are encrypted with TLS 1.3 and processed by Stripe (PCI-DSS Level 1 certified).
                We <strong>never</strong> store your card number on our servers.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions - Fixed at bottom */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onProceed}
              className="px-5 py-2 bg-[#A90F0F] hover:bg-[#8a0c0c] text-white font-semibold rounded-lg transition-colors shadow-md text-sm"
            >
              Save My Card Securely →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

