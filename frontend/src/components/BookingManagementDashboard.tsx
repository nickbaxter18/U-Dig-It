/**
 * Booking Management Dashboard
 * All-in-one component for managing booking requirements
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import BookingDetailsCard from './booking/BookingDetailsCard';
import ContractSigningSection from './booking/ContractSigningSection';
import InsuranceUploadSection from './booking/InsuranceUploadSection';
import LicenseUploadSection from './booking/LicenseUploadSection';
import PaymentSection from './booking/PaymentSection';

interface BookingManagementDashboardProps {
  booking: any;
  completionSteps: {
    contract_signed: boolean;
    insurance_uploaded: boolean;
    license_uploaded: boolean;
    payment_completed: boolean;
    deposit_paid: boolean;
  };
  completedDuringBooking?: {
    dates_selected: boolean;
    delivery_address: boolean;
    terms_accepted: boolean;
    contract_signed: boolean;
  };
  userId: string;
  isAdmin: boolean;
}

export default function BookingManagementDashboard({
  booking,
  completionSteps,
  completedDuringBooking,
  userId,
  isAdmin,
}: BookingManagementDashboardProps) {
  const router = useRouter();
  const bookingId = booking?.id ?? 'unknown';
  const storageKey = `booking-active-section-${bookingId}`;

  const [activeSection, setActiveSection] = useState<string>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const hasRestoredSection = useRef(false);

  const handleStepComplete = () => {
    setRefreshKey((prev) => prev + 1);
    router.refresh();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      setActiveSection(stored);
    }
    hasRestoredSection.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasRestoredSection.current) return;
    sessionStorage.setItem(storageKey, activeSection);
  }, [activeSection, storageKey]);

  const contract = booking.contracts?.[0];
  const payment = booking.payments?.find((p: any) => p.type === 'payment');
  const deposit = booking.payments?.find((p: any) => p.type === 'deposit');
  const latestVerificationRequest = useMemo(() => {
    if (!Array.isArray(booking.id_verification_requests)) return null;
    const sorted = [...booking.id_verification_requests].sort((a, b) => {
      const left = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const right = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return right - left;
    });
    return sorted[0] ?? null;
  }, [booking.id_verification_requests, refreshKey]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Column: Checklist & Details */}
      <div className="space-y-6 lg:col-span-1">
        {/* Requirements Checklist */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">📋 Required Steps</h2>

          <div className="space-y-3">
            {/* Contract */}
            <button
              onClick={() => setActiveSection('contract')}
              className={`w-full rounded-lg border-2 p-3 text-left transition ${
                activeSection === 'contract'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {completionSteps.contract_signed ? (
                    <span className="mr-2 text-green-600">✅</span>
                  ) : (
                    <span className="mr-2 text-yellow-600">⏳</span>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">Sign Contract</div>
                    <div className="text-xs text-gray-500">
                      {completionSteps.contract_signed
                        ? completedDuringBooking?.contract_signed
                          ? 'Signed during booking'
                          : 'Signed'
                        : 'Action required'}
                    </div>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>

            {/* Insurance */}
            <button
              onClick={() => setActiveSection('insurance')}
              className={`w-full rounded-lg border-2 p-3 text-left transition ${
                activeSection === 'insurance'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {completionSteps.insurance_uploaded ? (
                    <span className="mr-2 text-green-600">✅</span>
                  ) : (
                    <span className="mr-2 text-yellow-600">⏳</span>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">Upload Insurance</div>
                    <div className="text-xs text-gray-500">
                      {completionSteps.insurance_uploaded ? 'Uploaded' : 'Required'}
                    </div>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>

            {/* License */}
            <button
              onClick={() => setActiveSection('license')}
              className={`w-full rounded-lg border-2 p-3 text-left transition ${
                activeSection === 'license'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {completionSteps.license_uploaded ? (
                    <span className="mr-2 text-green-600">✅</span>
                  ) : (
                    <span className="mr-2 text-yellow-600">⏳</span>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">Upload License</div>
                    <div className="text-xs text-gray-500">
                      {completionSteps.license_uploaded ? 'Uploaded' : 'Required'}
                    </div>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>

            {/* Payment - Invoice */}
            <button
              onClick={() => setActiveSection('payment')}
              className={`w-full rounded-lg border-2 p-3 text-left transition ${
                activeSection === 'payment'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {completionSteps.payment_completed ? (
                    <span className="mr-2 text-green-600">✅</span>
                  ) : (
                    <span className="mr-2 text-red-600">❌</span>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">Pay Invoice</div>
                    <div className="text-xs text-gray-500">
                      {completionSteps.payment_completed ? 'Paid' : 'Payment required'}
                    </div>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>

            {/* Card Verification (for Security Hold) */}
            <button
              onClick={() => setActiveSection('deposit')}
              className={`w-full rounded-lg border-2 p-3 text-left transition ${
                activeSection === 'deposit'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {completionSteps.deposit_paid ? (
                    <span className="mr-2 text-green-600">✅</span>
                  ) : (
                    <span className="mr-2 text-yellow-600">⏳</span>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">Card Verification</div>
                    <div className="text-xs text-gray-500">
                      {completionSteps.deposit_paid
                        ? 'Card saved securely'
                        : 'Verify payment method'}
                    </div>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Booking Details Summary */}
        <BookingDetailsCard booking={booking} />
      </div>

      {/* Right Column: Active Section Content */}
      <div className="lg:col-span-2">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          {activeSection === 'overview' && (
            <div className="py-12 text-center">
              <svg
                className="mx-auto mb-4 h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Select a step to get started
              </h3>
              <p className="text-gray-600">Click on any step in the checklist to complete it</p>
            </div>
          )}

          {activeSection === 'contract' && (
            <ContractSigningSection
              booking={booking}
              contract={contract}
              completedDuringBooking={completedDuringBooking?.contract_signed}
              onSigned={handleStepComplete}
            />
          )}

          {activeSection === 'insurance' && (
            <InsuranceUploadSection
              bookingId={booking.id}
              existingDocuments={booking.insurance_documents || []}
              onUploadComplete={handleStepComplete}
            />
          )}

          {activeSection === 'license' && (
            <LicenseUploadSection
              userId={userId}
              bookingId={booking.id}
              latestRequest={latestVerificationRequest ?? undefined}
              onUploadComplete={handleStepComplete}
            />
          )}

          {activeSection === 'payment' && (
            <PaymentSection
              booking={booking}
              payment={payment}
              paymentType="payment"
              onPaymentComplete={handleStepComplete}
            />
          )}

          {activeSection === 'deposit' && (
            <PaymentSection
              booking={booking}
              payment={deposit}
              paymentType="deposit"
              onPaymentComplete={handleStepComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
