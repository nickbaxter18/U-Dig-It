'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import BookingInvoiceCard from '@/components/booking/BookingInvoiceCard';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

import { cancelBooking, getCancellationPreview } from '../actions';

interface BookingDetails {
  id: string;
  bookingNumber: string;
  status: string;
  type: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  subtotal: number;
  taxes: number;
  deliveryFee: number;
  securityDeposit: number;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryProvince: string | null;
  deliveryPostalCode: string | null;
  specialInstructions: string | null;
  createdAt: string;
  customerId: string;
  floatFee?: number | null;
  distanceKm?: number | null;
  equipment: {
    model: string;
    make: string;
    type: string;
    dailyRate: number;
  } | null;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  contracts: {
    id: string;
    contractNumber: string | null;
    status: string | null;
    type: string | null;
    documentUrl: string | null;
    signedAt: string | null;
    createdAt: string | null;
  }[];
  payments: {
    id: string;
    paymentNumber: string | null;
    amount: number | null;
    status: string | null;
    type: string | null;
    method: string | null;
    stripePaymentIntentId?: string | null;
    processedAt?: string | null;
    createdAt?: string | null;
  }[];
  insuranceDocuments: {
    id: string;
    documentNumber: string | null;
    fileName: string | null;
    fileUrl: string | null;
    status: string | null;
    type: string | null;
    insuranceCompany: string | null;
    policyNumber: string | null;
    createdAt: string | null;
  }[];
}

type RawContract = {
  id: string;
  contractNumber: string | null;
  status: string | null;
  type: string | null;
  documentUrl: string | null;
  signedAt: string | null;
  createdAt: string | null;
};

type RawPayment = {
  id: string;
  paymentNumber: string | null;
  amount: string | number | null;
  status: string | null;
  type: string | null;
  method: string | null;
  stripePaymentIntentId?: string | null;
  processedAt?: string | null;
  createdAt?: string | null;
};

type RawInsuranceDocument = {
  id: string;
  documentNumber: string | null;
  fileName: string | null;
  fileUrl: string | null;
  status: string | null;
  type: string | null;
  insuranceCompany: string | null;
  policyNumber: string | null;
  createdAt: string | null;
};

type BookingQueryResult = Omit<BookingDetails, 'contracts' | 'payments' | 'insuranceDocuments'> & {
  contracts?: RawContract[] | null;
  payments?: RawPayment[] | null;
  insurance_documents?: RawInsuranceDocument[] | null;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  insurance_verified: { label: 'Insurance Verified', color: 'bg-purple-100 text-purple-800' },
  ready_for_pickup: { label: 'Ready for Pickup', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Delivered', color: 'bg-teal-100 text-teal-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-800' },
};

const formatStatus = (status: string) =>
  STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, initialized } = useAuth();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    // Wait for auth to initialize
    if (!initialized || authLoading) return;

    // Redirect if not authenticated
    if (!user) {
      router.push(
        '/auth/signin?callbackUrl=' + encodeURIComponent(`/booking/${params.id}/details`)
      );
      return;
    }

    async function fetchBookingDetails() {
      try {
        const bookingId = params.id as string;

        if (!bookingId || bookingId === 'undefined') {
          throw new Error('Invalid booking ID');
        }

        // Fetch booking with related equipment data (including coupon fields!)
        const { data, error } = await supabase
          .from('bookings')
          .select(
            `
            id,
            bookingNumber,
            status,
            type,
            startDate,
            endDate,
            totalAmount,
            subtotal,
            taxes,
            deliveryFee,
            securityDeposit,
            deliveryAddress,
            deliveryCity,
            deliveryProvince,
            deliveryPostalCode,
            specialInstructions,
            createdAt,
            customerId,
            floatFee,
            distanceKm,
            couponCode,
            couponType,
            couponValue,
            waiver_selected,
            waiver_rate_cents,
            equipment:equipmentId (
              model,
              make,
              type,
              dailyRate
            )
          `
          )
          .eq('id', params.id as string)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Booking not found');
        }

        const rawBooking = data as BookingQueryResult;

        const [contractsResponse, paymentsResponse, insuranceResponse] = await Promise.all([
          supabase
            .from('contracts')
            .select('id, contractNumber, status, type, documentUrl, signedAt, createdAt')
            .eq('bookingId', params.id as string)
            .order('createdAt', { ascending: false }),
          supabase
            .from('payments')
            .select(
              'id, paymentNumber, amount, status, type, method, stripePaymentIntentId, processedAt, createdAt'
            )
            .eq('bookingId', params.id as string)
            .order('createdAt', { ascending: false }),
          supabase
            .from('insurance_documents')
            .select(
              'id, documentNumber, fileName, fileUrl, status, type, insuranceCompany, policyNumber, createdAt'
            )
            .eq('bookingId', params.id as string),
        ]);

        const contractsResponseError = contractsResponse.error;
        if (contractsResponseError) {
          logger.warn('Could not fetch contract data', {
            component: 'app-page',
            action: 'contracts_fetch_failed',
            metadata: { bookingId: params.id as string, error: contractsResponseError.message },
          });
        }

        const paymentsResponseError = paymentsResponse.error;
        if (paymentsResponseError) {
          logger.warn('Could not fetch payment data', {
            component: 'app-page',
            action: 'payments_fetch_failed',
            metadata: { bookingId: params.id as string, error: paymentsResponseError.message },
          });
        }

        const insuranceResponseError = insuranceResponse.error;
        if (insuranceResponseError) {
          logger.warn('Could not fetch insurance documents', {
            component: 'app-page',
            action: 'insurance_fetch_failed',
            metadata: { bookingId: params.id as string, error: insuranceResponseError.message },
          });
        }

        // Fetch customer data from public.users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('firstName, lastName, email, phone')
          .eq('id', rawBooking.customerId)
          .single();

        if (userError) {
          logger.warn('Could not fetch user data', {
            component: 'app-page',
            action: 'warning',
            metadata: { error: userError.message },
          });
        }

        const contractsData = (contractsResponse.data ?? []) as unknown[];
        const contracts = contractsData.map((contract: unknown) => ({
          id: contract.id,
          contractNumber: contract.contractNumber ?? null,
          status: contract.status ?? null,
          type: contract.type ?? null,
          documentUrl: contract.documentUrl ?? null,
          signedAt: contract.signedAt ?? null,
          createdAt: contract.createdAt ?? null,
        }));

        const paymentsData = (paymentsResponse.data ?? []) as unknown[];
        const payments = paymentsData.map((payment: unknown) => ({
          id: payment.id,
          paymentNumber: payment.paymentNumber ?? null,
          amount: typeof payment.amount === 'string' ? Number(payment.amount) : payment.amount,
          status: payment.status ?? null,
          type: payment.type ?? null,
          method: payment.method ?? null,
          stripePaymentIntentId: payment.stripePaymentIntentId ?? null,
          processedAt: payment.processedAt ?? null,
          createdAt: payment.createdAt ?? null,
        }));

        const insuranceData = (insuranceResponse.data ?? []) as unknown[];
        const insuranceDocuments = insuranceData.map((document: unknown) => ({
          id: document.id,
          documentNumber: document.documentNumber ?? null,
          fileName: document.fileName ?? null,
          fileUrl: document.fileUrl ?? null,
          status: document.status ?? null,
          type: document.type ?? null,
          insuranceCompany: document.insuranceCompany ?? null,
          policyNumber: document.policyNumber ?? null,
          createdAt: document.createdAt ?? null,
        }));

        setBooking({
          ...rawBooking,
          customer: userData || null,
          contracts,
          payments,
          insuranceDocuments,
        });
      } catch (err: unknown) {
        const derivedMessage = err instanceof Error ? err.message : String(err);

        logger.error(
          'Error fetching booking',
          {
            component: 'app-page',
            action: 'error',
            metadata: { error: derivedMessage },
          },
          err instanceof Error ? err : undefined
        );
        setError(derivedMessage || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    }

    fetchBookingDetails();
  }, [user, authLoading, initialized, params.id, router]);

  const signedContract = useMemo(() => {
    if (!booking) return undefined;
    return (
      booking.contracts.find(
        (contract) => contract.status === 'signed' || contract.status === 'completed'
      ) ?? booking.contracts[0]
    );
  }, [booking]);

  const primaryInvoice = useMemo(() => {
    if (!booking) return undefined;
    return booking.payments.find((payment) => payment.type === 'payment');
  }, [booking]);

  const securityDepositPayment = useMemo(() => {
    if (!booking) return undefined;
    return booking.payments.find((payment) => payment.type === 'deposit');
  }, [booking]);

  const insuranceDocs = useMemo(() => booking?.insuranceDocuments ?? [], [booking]);

  const statusInfo = useMemo(() => formatStatus(booking?.status ?? 'pending'), [booking?.status]);

  // Loading state
  if (authLoading || !initialized || loading) {
    return (
      <>
        <Navigation />
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading booking details...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Navigation />
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
            <div className="mb-4 text-5xl text-red-500">⚠️</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Error Loading Booking</h1>
            <p className="mb-6 text-gray-600">{error}</p>
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Return to Dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // No booking found
  if (!booking) {
    return (
      <>
        <Navigation />
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
            <div className="mb-4 text-5xl text-gray-400">📋</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Booking Not Found</h1>
            <p className="mb-6 text-gray-600">We couldn't find the booking you're looking for.</p>
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Return to Dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="mb-4 inline-flex items-center text-blue-600 transition-colors hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
                <p className="mt-1 text-gray-600">Booking #{booking.bookingNumber}</p>
              </div>
              <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Equipment Information */}
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Equipment Information</h2>
                {booking.equipment ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Equipment:</span>
                      <span className="font-semibold text-gray-900">
                        {booking.equipment.make} {booking.equipment.model}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold text-gray-900">{booking.equipment.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily Rate:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(Number(booking.equipment.dailyRate))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Equipment information not available</p>
                )}
              </div>

              {/* Rental Period */}
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Rental Period</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-semibold text-gray-900">
                      {formatDate(booking.startDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-semibold text-gray-900">
                      {formatDate(booking.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rental Type:</span>
                    <span className="font-semibold capitalize text-gray-900">{booking.type}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {booking.deliveryAddress && (
                <div className="rounded-lg bg-white p-6 shadow-md">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">Delivery Information</h2>
                  <div className="space-y-2">
                    <p className="text-gray-900">{booking.deliveryAddress}</p>
                    {booking.deliveryCity && (
                      <p className="text-gray-900">
                        {booking.deliveryCity}, {booking.deliveryProvince}{' '}
                        {booking.deliveryPostalCode}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Invoice */}
              <BookingInvoiceCard booking={booking} className="shadow-md" />

              {/* Special Instructions */}
              {booking.specialInstructions && (
                <div className="rounded-lg bg-white p-6 shadow-md">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">Special Instructions</h2>
                  <p className="whitespace-pre-wrap text-gray-700">{booking.specialInstructions}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Information */}
              {booking.customer && (
                <div className="rounded-lg bg-white p-6 shadow-md">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">Customer Information</h2>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">
                      {booking.customer.firstName} {booking.customer.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{booking.customer.email}</p>
                    {booking.customer.phone && (
                      <p className="text-sm text-gray-600">{booking.customer.phone}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Documents & Links */}
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Documents & Links</h2>
                <div className="space-y-4 text-sm">
                  <Link
                    href={`/booking/${booking.id}/manage`}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Open Manage Booking
                  </Link>

                  {primaryInvoice ? (
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Invoice {primaryInvoice.paymentNumber ?? '—'}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            {primaryInvoice.status ?? 'Unknown'} •{' '}
                            {formatCurrency(Number(primaryInvoice.amount ?? 0))}
                          </p>
                          {primaryInvoice.processedAt && (
                            <p className="mt-1 text-xs text-gray-500">
                              Processed {formatDateTime(primaryInvoice.processedAt)}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/booking/${booking.id}/manage`}
                          className="rounded-md border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                          Review payment
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-gray-200 p-4 text-gray-500">
                      No invoices yet. Complete your booking to receive payment documents.
                    </p>
                  )}

                  {securityDepositPayment && (
                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="font-semibold text-gray-900">Security Deposit</p>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {securityDepositPayment.status ?? 'Pending'} •{' '}
                        {formatCurrency(
                          Number(securityDepositPayment.amount ?? booking.securityDeposit)
                        )}
                      </p>
                      {securityDepositPayment.processedAt && (
                        <p className="mt-1 text-xs text-gray-500">
                          Processed {formatDateTime(securityDepositPayment.processedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {signedContract ? (
                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="font-semibold text-gray-900">Signed Contract</p>
                      <p className="text-xs text-gray-500">
                        {signedContract.contractNumber ?? 'Pending number'} •{' '}
                        {signedContract.status ?? 'Pending'}
                      </p>
                      {signedContract.signedAt && (
                        <p className="mt-1 text-xs text-gray-500">
                          Signed {formatDateTime(signedContract.signedAt)}
                        </p>
                      )}
                      {signedContract.documentUrl ? (
                        <a
                          href={signedContract.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center text-xs font-semibold text-blue-700 underline transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                          Download contract
                        </a>
                      ) : (
                        <p className="mt-3 text-xs text-gray-500">
                          Document link not yet available.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-gray-200 p-4 text-gray-500">
                      Contract will appear here once it has been generated.
                    </p>
                  )}

                  {insuranceDocs.length > 0 ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">Insurance Documents</p>
                      <ul className="space-y-2 text-xs text-gray-600">
                        {insuranceDocs.map((doc) => (
                          <li key={doc.id} className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {doc.fileName ?? doc.documentNumber ?? 'Insurance file'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {doc.status ?? 'Pending'}
                                {doc.createdAt
                                  ? ` • Uploaded ${formatDateTime(doc.createdAt)}`
                                  : ''}
                              </p>
                            </div>
                            {doc.fileUrl ? (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 rounded-md border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                              >
                                View
                              </a>
                            ) : (
                              <span className="shrink-0 text-xs text-gray-400">No file</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Insurance certificates will appear here once uploaded.
                    </p>
                  )}
                </div>
              </div>

              {/* Booking Information */}
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Booking Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-mono text-xs text-gray-900">{booking.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">{formatDateTime(booking.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Actions</h2>
                <div className="space-y-3">
                  <Link
                    href={`/booking/${booking.id}/manage`}
                    className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Manage Booking
                  </Link>
                  {booking.status === 'pending' && (
                    <button
                      className="block w-full rounded-lg bg-red-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={cancelling}
                      onClick={async () => {
                        if (cancelling) return;

                        // Get cancellation preview first
                        setCancelling(true);
                        const preview = await getCancellationPreview(booking.id);

                        if (!preview) {
                          alert('Unable to calculate cancellation fee. Please try again.');
                          setCancelling(false);
                          return;
                        }

                        const confirmMessage =
                          preview.fee > 0
                            ? `Are you sure you want to cancel this booking?\n\n${preview.policy}\nCancellation Fee: ${formatCurrency(preview.fee)}\nRefund Amount: ${formatCurrency(preview.refund)}`
                            : `Are you sure you want to cancel this booking?\n\n${preview.policy}\nYou will receive a full refund.`;

                        if (confirm(confirmMessage)) {
                          const result = await cancelBooking(booking.id);

                          if (result.success) {
                            alert(result.message);
                            router.push('/dashboard');
                          } else {
                            alert(`Cancellation failed: ${result.error || result.message}`);
                          }
                        }

                        setCancelling(false);
                      }}
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
