'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  DollarSign,
  Download,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface BookingDetails {
  id: string;
  bookingNumber: string;
  equipmentId: string;
  startDate: string;
  endDate: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryProvince: string | null;
  deliveryPostalCode: string | null;
  subtotal: string;
  taxes: string;
  totalAmount: string;
  balance_amount?: number | null;
  deliveryFee: string;
  securityDeposit: string;
  status: string;
  type: string;
  createdAt: string;
  dailyRate: string;
  specialInstructions: string | null;
}

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading, initialized } = useAuth();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (initialized && !authLoading && !user) {
      router.push('/auth/signin?callbackUrl=/dashboard/bookings');
    }
  }, [user, authLoading, initialized, router]);

  // Fetch booking details
  useEffect(() => {
    if (!user) return;

    const fetchBookingDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select('*, balance_amount')
          .eq('id', params.id)
          .eq('customerId', user.id) // Ensure user can only see their own bookings
          .single();

        if (fetchError) throw fetchError;

        setBooking(data);
      } catch (err) {
        logger.error('[BookingDetail] Error fetching booking', {
          component: 'app-page',
          action: 'error',
          metadata: { error: err instanceof Error ? err.message : String(err) }
        }, err instanceof Error ? err : undefined);
        setError('Failed to load booking details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [user, params.id]);

  if (!initialized || authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#E1BC56]" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#E1BC56]" />
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-start rounded-lg border border-red-200 bg-red-50 p-6">
            <AlertCircle className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
            <div>
              <h3 className="mb-1 font-semibold text-red-900">Error Loading Booking</h3>
              <p className="text-red-700">{error || 'Booking not found'}</p>
              <Link
                href="/dashboard/bookings"
                className="mt-3 inline-block text-sm font-medium text-red-600 underline hover:text-red-700"
              >
                ← Back to Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rentalDays =
    Math.ceil(
      (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) || 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Back Button */}
        <Link
          href="/dashboard/bookings"
          className="mb-6 inline-flex items-center font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Bookings
        </Link>

        {/* Header */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600">
                Reference: <span className="font-mono font-semibold">{booking.bookingNumber}</span>
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
                  booking.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : booking.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'completed'
                        ? 'bg-gray-100 text-gray-800'
                        : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                }`}
              >
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Equipment */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <Package className="mr-2 h-5 w-5" />
                Equipment Details
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src="/images/kubota-svl-75-hero.png"
                    alt="Kubota SVL-75"
                    className="h-24 w-24 rounded-lg bg-gray-50 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Kubota SVL-75 Compact Track Loader
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    74.3 HP • 9,420 lbs • Professional Grade
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Daily Rate:{' '}
                    <span className="font-semibold">
                      {formatCurrency(parseFloat(booking.dailyRate))}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Rental Period */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <Calendar className="mr-2 h-5 w-5" />
                Rental Period
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Start Date</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(booking.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">End Date</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(booking.endDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-gray-600">Total Duration</span>
                  <span className="font-semibold text-[#E1BC56]">
                    {rentalDays} {rentalDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <MapPin className="mr-2 h-5 w-5" />
                Delivery Information
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{booking.deliveryAddress}</p>
                <p className="text-gray-600">
                  {booking.deliveryCity}
                  {booking.deliveryProvince && `, ${booking.deliveryProvince}`}
                  {booking.deliveryPostalCode && ` ${booking.deliveryPostalCode}`}
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  Delivery Type: <span className="font-semibold capitalize">{booking.type}</span>
                </p>
              </div>
            </div>

            {/* Special Instructions */}
            {booking.specialInstructions && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-blue-900">Special Instructions</h3>
                <p className="text-sm text-blue-800">{booking.specialInstructions}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <DollarSign className="mr-2 h-5 w-5" />
                Pricing Summary
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(booking.subtotal))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(booking.deliveryFee))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">HST</span>
                  <span className="font-medium">{formatCurrency(parseFloat(booking.taxes))}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>{booking.balance_amount !== undefined && booking.balance_amount !== null ? 'Outstanding Balance' : 'Total'}</span>
                  <span className="text-[#E1BC56]">
                    {formatCurrency(booking.balance_amount ?? parseFloat(booking.totalAmount))}
                  </span>
                </div>
                <div className="mt-3 border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="font-medium">
                      {formatCurrency(parseFloat(booking.securityDeposit))}
                    </span>
                  </div>
                  <p className="mt-2 text-xs italic text-gray-500">
                    Refundable upon equipment return
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => window.print()}
                  className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </button>
                <Link
                  href={`mailto:info@udigit.ca?subject=Booking ${booking.bookingNumber}`}
                  className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Support
                </Link>
                <Link
                  href="tel:+15066431575"
                  className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call Us
                </Link>
              </div>
            </div>

            {/* Important Info */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-yellow-900">Important</h3>
              <ul className="space-y-1 text-xs text-yellow-800">
                <li>• Insurance must be verified before delivery</li>
                <li>• Security deposit required before pickup</li>
                <li>• Cancellation fee applies within 48 hours</li>
                <li>• Contact us for modifications</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Bookings */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center font-semibold text-[#E1BC56] hover:text-[#d4b04a]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
