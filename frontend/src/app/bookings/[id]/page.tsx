'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface BookingDetails {
  id: string;
  bookingNumber: string;
  equipment: {
    name: string;
    model: string;
    image: string;
  };
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total: number;
  subtotal: number;
  taxes: number;
  deliveryFee: number;
  deliveryAddress: string;
  deliveryCity: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  notes?: string;
}

export default function BookingDetailsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoading = authLoading || loading;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin?callbackUrl=/bookings/' + bookingId);
    }
  }, [user, isLoading, router, bookingId]);

  const fetchBookingDetails = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch booking from Supabase with equipment details
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
          id,
          bookingNumber,
          startDate,
          endDate,
          status,
          totalAmount,
          subtotal,
          taxes,
          deliveryFee,
          deliveryAddress,
          deliveryCity,
          specialInstructions,
          createdAt,
          equipment:equipmentId (
            id,
            make,
            model,
            images
          )
        `
        )
        .eq('id', bookingId)
        .eq('customerId', user?.id || '') // Security: only fetch user's own booking
        .single();

      if (error) {
        logger.error(
          'Failed to fetch booking',
          {
            component: 'app-page',
            action: 'error',
            metadata: { error: error.message },
          },
          error
        );
        throw error;
      }

      if (!data) {
        setBooking(null);
        return;
      }

      // Get customer name and email from user metadata
      const firstName = user?.user_metadata?.firstName || '';
      const lastName = user?.user_metadata?.lastName || '';
      const customerName = `${firstName} ${lastName}`.trim() || user?.email || 'Customer';

      // Transform Supabase data to match BookingDetails interface
      // Type assertion needed due to overly restrictive Supabase RLS types
      const bookingData: any = data;
      const bookingDetails: BookingDetails = {
        id: bookingData.id,
        bookingNumber: bookingData.bookingNumber,
        equipment: {
          name:
            bookingData.equipment?.make && bookingData.equipment?.model
              ? `${bookingData.equipment.make} ${bookingData.equipment.model}`
              : 'Equipment',
          model: bookingData.equipment?.model || 'Unknown',
          image: bookingData.equipment?.images?.[0] || '/images/kubota-svl-75-hero.png',
        },
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        status: bookingData.status,
        total: parseFloat(bookingData.totalAmount),
        subtotal: parseFloat(bookingData.subtotal),
        taxes: parseFloat(bookingData.taxes),
        deliveryFee: parseFloat(bookingData.deliveryFee),
        deliveryAddress: bookingData.deliveryAddress,
        deliveryCity: bookingData.deliveryCity,
        customerName: customerName,
        customerEmail: user?.email || 'unknown@example.com',
        customerPhone: user?.user_metadata?.phone,
        createdAt: bookingData.createdAt,
        notes: bookingData.specialInstructions || undefined,
      };

      setBooking(bookingDetails);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch booking details',
          {
            component: 'app-page',
            action: 'error',
            metadata: { error: error instanceof Error ? error.message : String(error) },
          },
          error instanceof Error ? error : undefined
        );
      }
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [user, bookingId]);

  useEffect(() => {
    if (user && bookingId) {
      fetchBookingDetails();
    }
  }, [user, bookingId, fetchBookingDetails]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (isLoading || loading) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading booking details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!user || !booking) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-md">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">Booking Not Found</h1>
            <p className="mb-6 text-gray-600">We couldn't find the booking you're looking for.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(booking.status)}`}
              >
                {getStatusText(booking.status)}
              </span>
            </div>
          </div>

          {/* Equipment Info */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Equipment</h2>
            <div className="flex items-center space-x-4">
              <img
                src={booking.equipment.image}
                alt={booking.equipment.name}
                className="h-32 w-32 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{booking.equipment.name}</h3>
                <p className="text-sm text-gray-600">Model: {booking.equipment.model}</p>
              </div>
            </div>
          </div>

          {/* Rental Period */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Rental Period</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="text-lg font-medium text-gray-900">
                  {new Date(booking.startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="text-lg font-medium text-gray-900">
                  {new Date(booking.endDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Delivery Information</h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Delivery Address</p>
                <p className="text-lg font-medium text-gray-900">
                  {booking.deliveryAddress}, {booking.deliveryCity}, NB
                </p>
              </div>
              {booking.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Special Instructions</p>
                  <p className="text-gray-900">{booking.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Customer Information</h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-gray-900">{booking.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900">{booking.customerEmail}</p>
              </div>
              {booking.customerPhone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-900">{booking.customerPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Pricing Breakdown</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Equipment Rental</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(booking.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(booking.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes (HST 15%)</span>
                <span className="font-medium text-gray-900">{formatCurrency(booking.taxes)}</span>
              </div>
              <div className="mt-2 border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(booking.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {booking.status === 'pending' && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Actions</h2>
              <div className="flex space-x-3">
                <button className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700">
                  Cancel Booking
                </button>
                <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
