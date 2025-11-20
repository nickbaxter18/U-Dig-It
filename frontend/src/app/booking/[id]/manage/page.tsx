/**
 * Booking Management Page
 * Central hub for customers to complete all booking requirements:
 * - Sign contract
 * - Upload insurance documents
 * - Upload driver's license
 * - Pay invoice
 */
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import BookingManagementDashboard from '@/components/BookingManagementDashboard';
import BookingCompletionTrigger from '@/components/booking/BookingCompletionTrigger';
import PaymentSuccessHandler from '@/components/booking/PaymentSuccessHandler';
import QuickActionsBar from '@/components/booking/QuickActionsBar';

import { createClient } from '@/lib/supabase/server';

// Import Navigation and Footer dynamically to avoid SSR issues
const Navigation = dynamic(() => import('@/components/Navigation'), { ssr: true });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: true });

// Page configuration for Next.js
export const runtime = 'nodejs';
export const revalidate = 0;

export default async function ManageBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // Get comprehensive booking details (including coupon fields!)
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      couponCode,
      couponType,
      couponValue,
      equipment:equipmentId(
        id,
        make,
        model,
        unitId,
        serialNumber,
        dailyRate,
        weeklyRate,
        monthlyRate,
        images,
        type,
        riderRequired:rider_required,
        riderTemplateId:rider_template_id,
        riderVersion:rider_version,
        totalEngineHours,
        attachments
      ),
      customer:customerId(
        id,
        firstName,
        lastName,
        email,
        phone,
        driversLicense,
        drivers_license_verified_at
      ),
      contracts(
        id,
        contractNumber,
        status,
        type,
        documentUrl,
        signedAt,
        sentForSignatureAt,
        createdAt,
        documentContent,
        legalVersions
      ),
      payments(
        id,
        paymentNumber,
        amount,
        status,
        type,
        method,
        stripePaymentIntentId,
        processedAt,
        createdAt
      ),
      insurance_documents:insurance_documents(
        id,
        documentNumber,
        fileName,
        fileUrl,
        status,
        type,
        insuranceCompany,
        policyNumber,
        createdAt
      ),
      id_verification_requests:id_verification_requests(
        id,
        status,
        attempt_number,
        created_at,
        consent_method,
        consent_recorded_at,
        metadata,
        result:id_verification_results(
          document_status,
          face_liveness_score,
          face_match_score,
          failure_reasons,
          processed_at
        )
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !booking) {
    redirect('/dashboard');
  }

  // Verify user has access to this booking
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/signin?redirect=/booking/${id}/manage`);
  }

  const isAdmin =
    user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin';

  if (booking.customerId !== user.id && !isAdmin) {
    redirect('/dashboard');
  }

  // Calculate completion status
  const contract = booking.contracts?.[0];
  const payment = booking.payments?.find((p: unknown) => p.type === 'payment');
  const _deposit = booking.payments?.find((p: unknown) => p.type === 'deposit'); // Reserved for future deposit handling
  const hasInsurance = booking.insurance_documents && booking.insurance_documents.length > 0;
  const hasApprovedVerification = Array.isArray(booking.id_verification_requests)
    ? booking.id_verification_requests.some(
        (request: { status?: string | null }) =>
          (request?.status ?? '').toLowerCase() === 'approved'
      )
    : false;
  const hasVerifiedDriverLicense = Boolean(booking.customer?.drivers_license_verified_at);
  const hasLicense = hasApprovedVerification || hasVerifiedDriverLicense;

  // Check if terms were accepted during booking (indicates contract signed inline)
  const termsAcceptedDuringBooking =
    booking.termsAccepted && typeof booking.termsAccepted === 'object';

  // Check if contract was signed during booking flow (has signedAt timestamp)
  const contractSignedDuringBooking = contract?.status === 'signed' && contract?.signedAt;

  const contractSigned = contract?.status === 'signed' || contract?.status === 'completed';

  const completionSteps = {
    contract_signed: contractSigned,
    insurance_uploaded: hasInsurance,
    license_uploaded: hasLicense,
    payment_completed: payment?.status === 'completed' || booking.status === 'paid',
    deposit_paid: !!booking.stripe_payment_method_id, // Card verified = deposit step complete
  };

  // Track what was completed during booking vs. what needs to be done now
  const completedDuringBooking = {
    dates_selected: true, // Always true if booking exists
    delivery_address: !!booking.deliveryAddress,
    terms_accepted: termsAcceptedDuringBooking,
    contract_signed: contractSignedDuringBooking,
  };

  const totalSteps = Object.keys(completionSteps).length;
  const completedSteps = Object.values(completionSteps).filter(Boolean).length;
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <>
      <Navigation />

      {/* Payment Success Handler - Detects payment=success and refreshes page */}
      <PaymentSuccessHandler />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="mb-6 flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm font-medium text-gray-700 transition-colors hover:text-[#E1BC56]"
                >
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    Manage Booking
                  </span>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-400 md:ml-2">
                    {booking.bookingNumber}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Your Booking</h1>
                <p className="mt-2 text-gray-600">
                  Complete the steps below to finalize your equipment rental
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div className="text-left sm:text-right">
                  <div className="mb-1 text-sm text-gray-600">Booking Status</div>
                  <span
                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'paid'
                          ? 'bg-blue-100 text-blue-800'
                          : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {booking.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <QuickActionsBar />
          </div>

          {/* Progress Bar */}
          <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-semibold text-blue-600">
                {completedSteps} of {totalSteps} completed ({completionPercentage}%)
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Booking Completion Trigger - Shows when all 5 steps are complete */}
          <BookingCompletionTrigger
            bookingId={booking.id}
            bookingNumber={booking.bookingNumber}
            completionSteps={completionSteps}
            currentStatus={booking.status}
          />

          {/* What You've Already Completed */}
          {(completedDuringBooking.terms_accepted || completedDuringBooking.delivery_address) && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <div className="flex items-start">
                <svg
                  className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="mb-2 text-base font-semibold text-blue-900">
                    ✅ Completed During Booking
                  </h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    {completedDuringBooking.dates_selected && (
                      <li className="flex items-center">
                        <span className="mr-2 text-green-600">✓</span>
                        Selected rental dates: {new Date(
                          booking.startDate
                        ).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                      </li>
                    )}
                    {completedDuringBooking.delivery_address && (
                      <li className="flex items-center">
                        <span className="mr-2 text-green-600">✓</span>
                        Delivery address confirmed: {booking.deliveryAddress}
                      </li>
                    )}
                    {completedDuringBooking.terms_accepted && (
                      <li className="flex items-center">
                        <span className="mr-2 text-green-600">✓</span>
                        Terms & conditions accepted
                      </li>
                    )}
                    {completedDuringBooking.contract_signed && (
                      <li className="flex items-center">
                        <span className="mr-2 text-green-600">✓</span>
                        Rental agreement signed electronically
                      </li>
                    )}
                  </ul>
                  <p className="mt-3 text-xs italic text-blue-700">
                    These steps were completed when you created your booking. Focus on the remaining
                    requirements below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Booking Management Dashboard Component */}
          <BookingManagementDashboard
            booking={booking}
            completionSteps={completionSteps}
            completedDuringBooking={completedDuringBooking}
            userId={user.id}
            isAdmin={isAdmin}
          />

          {/* Helpful Tips Section */}
          {completionPercentage < 100 && (
            <div className="mt-8 rounded-r-lg border-l-4 border-blue-400 bg-blue-50 p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">💡 Helpful Tips</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc space-y-1 pl-5">
                      {!completionSteps.insurance_uploaded && (
                        <li>
                          Your Certificate of Insurance must include U-Dig It Rentals as Additional
                          Insured and Loss Payee
                        </li>
                      )}
                      {!completionSteps.license_uploaded && (
                        <li>
                          Upload a clear photo or scan of your driver's license (front and back if
                          applicable)
                        </li>
                      )}
                      {!completionSteps.payment_completed && (
                        <li>
                          Payment is processed securely through Stripe - we never store your card
                          information
                        </li>
                      )}
                      <li>
                        Need help? Call us at{' '}
                        <a href="tel:+15066431575" className="font-semibold underline">
                          (506) 643-1575
                        </a>{' '}
                        or visit our{' '}
                        <Link href="/support" className="font-semibold underline">
                          Support Center
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-blue-600">
                      <strong>Estimated time to complete remaining steps:</strong>{' '}
                      {completedSteps === 0
                        ? '15-20'
                        : completedSteps === 1
                          ? '10-15'
                          : completedSteps === 2
                            ? '5-10'
                            : completedSteps === 3
                              ? '3-5'
                              : '1-2'}{' '}
                      minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
