/**
 * Admin Dashboard: Hold Management
 *
 * Allows admins to:
 *   - View hold status and timeline
 *   - Place $500 hold manually (override T-48)
 *   - Cancel/release holds
 *   - Capture partial/full amounts
 *   - View audit trail
 *   - Resend SCA links
 */

'use client';

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface HoldManagementDashboardProps {
  booking: {
    id: string;
    bookingNumber: string;
    customerId: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    status: string;
    hold_verify_amount_cents?: number;
    hold_security_amount_cents?: number;
    verify_hold_intent_id?: string;
    security_hold_intent_id?: string;
    stripe_customer_id?: string;
    stripe_payment_method_id?: string;
  };
  holdTransactions?: Array<{
    id: string;
    purpose: string;
    amount_cents: number;
    status: string;
    stripe_payment_intent_id?: string;
    created_at: string;
    metadata?: unknown;
  }>;
}

export default function HoldManagementDashboard({
  booking,
  holdTransactions = [],
}: HoldManagementDashboardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [captureAmount, setCaptureAmount] = useState('');
  const [captureReason, setCaptureReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate hold status
  const hasVerifyHold = !!booking.verify_hold_intent_id;
  const hasSecurityHold = !!booking.security_hold_intent_id;
  const securityHoldActive = hasSecurityHold && booking.status === 'hold_placed';

  // Calculate T-48 date
  const pickupDate = new Date(booking.startDate);
  const t48Date = new Date(pickupDate.getTime() - 48 * 60 * 60 * 1000);
  const isWithin48h = t48Date <= new Date();

  /**
   * Place $500 security hold NOW (override T-48 timer)
   */
  const placeSecurityHoldNow = async () => {
    if (!confirm('Place $500 security hold immediately?')) return;

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetchWithAuth('/api/stripe/place-security-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place hold');
      }

      const result = await response.json();
      setSuccessMessage(
        `✅ $500 security hold placed successfully! Intent ID: ${result.paymentIntentId}`
      );

      // Refresh page after 2 seconds
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: unknown) {
      setErrorMessage(`❌ Failed to place hold: ${error.message}`);
      logger.error('Admin: Failed to place security hold', {
        component: 'HoldManagement',
        action: 'place_hold_error',
        metadata: { bookingId: booking.id, error: error.message },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Release/cancel security hold
   */
  const releaseSecurityHold = async () => {
    if (!confirm('Release $500 security hold? This action cannot be undone.')) return;

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetchWithAuth('/api/stripe/release-security-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to release hold');
      }

      setSuccessMessage('✅ Security hold released successfully!');

      setTimeout(() => window.location.reload(), 2000);
    } catch (error: unknown) {
      setErrorMessage(`❌ Failed to release hold: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Capture partial amount from hold
   */
  const capturePartial = async () => {
    const amountCents = parseFloat(captureAmount) * 100;

    if (
      !captureAmount ||
      amountCents <= 0 ||
      amountCents > (booking.hold_security_amount_cents || 50000)
    ) {
      setErrorMessage('Invalid amount');
      return;
    }

    if (!captureReason) {
      setErrorMessage('Please provide a reason for the charge');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetchWithAuth('/api/stripe/capture-security-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amountCents,
          reason: captureReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to capture hold');
      }

      const result = await response.json();
      setSuccessMessage(
        `✅ Captured $${result.capturedAmount}! Remainder ($${result.remainderReleased}) released.`
      );
      setShowCaptureModal(false);

      setTimeout(() => window.location.reload(), 2000);
    } catch (error: unknown) {
      setErrorMessage(`❌ Failed to capture: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Capture full hold amount
   */
  const captureFull = async () => {
    if (!confirm('Capture full $500 hold? This is for severe damage only.')) return;

    setCaptureAmount('500');
    setCaptureReason('Severe equipment damage requiring full hold capture');
    setShowCaptureModal(true);
  };

  return (
    <div className="space-y-6" aria-busy={isProcessing}>
      {/* Status Messages */}
      {successMessage && (
        <div
          className="rounded-lg bg-green-100 border border-green-400 p-4 text-green-800"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg bg-red-100 border border-red-400 p-4 text-red-800" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Hold Status Card */}
      <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-bold text-gray-900">🔒 Hold Status</h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Verification Hold */}
          <div
            className={`rounded-lg border-2 p-4 ${hasVerifyHold ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}
          >
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{hasVerifyHold ? '✅' : '⏳'}</span>
              <div>
                <div className="text-sm font-semibold text-gray-900">Verification Hold</div>
                <div className="text-xs text-gray-600">$50 (voided)</div>
              </div>
            </div>
            {hasVerifyHold && (
              <div className="mt-2 text-xs text-gray-600">
                Intent ID: {booking.verify_hold_intent_id?.substring(0, 20)}...
              </div>
            )}
          </div>

          {/* Security Hold */}
          <div
            className={`rounded-lg border-2 p-4 ${
              securityHoldActive
                ? 'border-blue-300 bg-blue-50'
                : hasSecurityHold
                  ? 'border-green-300 bg-green-50'
                  : 'border-yellow-300 bg-yellow-50'
            }`}
          >
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">
                {securityHoldActive ? '🔒' : hasSecurityHold ? '✅' : '⏰'}
              </span>
              <div>
                <div className="text-sm font-semibold text-gray-900">Security Hold</div>
                <div className="text-xs text-gray-600">
                  $500 {securityHoldActive ? '(active)' : ''}
                </div>
              </div>
            </div>
            {hasSecurityHold && (
              <div className="mt-2 text-xs text-gray-600">
                Intent ID: {booking.security_hold_intent_id?.substring(0, 20)}...
              </div>
            )}
            {!hasSecurityHold && (
              <div className="mt-2 text-xs text-gray-600">
                Scheduled for: {t48Date.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={placeSecurityHoldNow}
            disabled={isProcessing || hasSecurityHold}
            aria-label={
              hasSecurityHold ? 'Security hold already placed' : 'Place $500 security hold now'
            }
            className={`rounded-lg py-2 px-4 font-semibold text-white transition-colors ${
              hasSecurityHold || isProcessing
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Place $500 Hold Now
          </button>

          <button
            onClick={releaseSecurityHold}
            disabled={isProcessing || !securityHoldActive}
            aria-label={
              !securityHoldActive
                ? 'No active security hold to release'
                : 'Release active security hold'
            }
            className={`rounded-lg py-2 px-4 font-semibold text-white transition-colors ${
              !securityHoldActive || isProcessing
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            Release Hold
          </button>

          <button
            onClick={() => setShowCaptureModal(true)}
            disabled={isProcessing || !securityHoldActive}
            aria-label={
              !securityHoldActive
                ? 'No active security hold to capture'
                : 'Capture security hold funds'
            }
            className={`rounded-lg py-2 px-4 font-semibold text-white transition-colors ${
              !securityHoldActive || isProcessing
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            Capture Partial
          </button>

          <button
            onClick={captureFull}
            disabled={isProcessing || !securityHoldActive}
            className={`rounded-lg py-2 px-4 font-semibold text-white transition-colors ${
              !securityHoldActive || isProcessing
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Capture Full ($500)
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-bold text-gray-900">📊 Transaction History</h3>

        {holdTransactions.length === 0 ? (
          <p className="text-sm text-gray-600">No hold transactions yet</p>
        ) : (
          <div className="space-y-2">
            {holdTransactions.map((tx: unknown) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        tx.purpose === 'verify_hold'
                          ? 'bg-purple-100 text-purple-800'
                          : tx.purpose === 'security_hold'
                            ? 'bg-blue-100 text-blue-800'
                            : tx.purpose === 'capture'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {tx.purpose}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${(tx.amount_cents / 100).toFixed(2)}
                    </span>
                    <span
                      className={`text-xs ${
                        tx.status === 'succeeded'
                          ? 'text-green-600'
                          : tx.status === 'canceled'
                            ? 'text-gray-600'
                            : tx.status === 'failed'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(tx.created_at).toLocaleString()}
                    {tx.stripe_payment_intent_id && (
                      <> • PI: {tx.stripe_payment_intent_id.substring(0, 15)}...</>
                    )}
                  </div>
                  {tx.metadata?.reason && (
                    <div className="mt-1 text-xs text-gray-600 italic">
                      Reason: {tx.metadata.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Capture Modal */}
      {showCaptureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Capture Security Hold</h3>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Amount to Capture (max $500)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="0.01"
                  value={captureAmount}
                  onChange={(e: unknown) => setCaptureAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="180.00"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Reason for Charge
              </label>
              <textarea
                value={captureReason}
                onChange={(e: unknown) => setCaptureReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Hydraulic hose damage from improper use"
              />
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-lg bg-red-100 border border-red-400 p-3 text-sm text-red-800">
                {errorMessage}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCaptureModal(false);
                  setCaptureAmount('');
                  setCaptureReason('');
                  setErrorMessage('');
                }}
                disabled={isProcessing}
                className="flex-1 rounded-lg border border-gray-300 py-2 px-4 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={capturePartial}
                disabled={isProcessing || !captureAmount || !captureReason}
                className={`flex-1 rounded-lg py-2 px-4 font-semibold text-white ${
                  isProcessing || !captureAmount || !captureReason
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isProcessing ? 'Processing...' : `Capture $${captureAmount || '0'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
