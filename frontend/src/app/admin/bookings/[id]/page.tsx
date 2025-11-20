'use client';

import { ArrowLeft, Calendar, DollarSign, Package, Truck, User } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { BookingFinancePanel } from '@/components/admin/finance/BookingFinancePanel';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  equipmentId: string;
  startDate: string;
  endDate: string;
  deliveryAddress: string;
  distanceKm: number;
  deliveryFee: number;
  transportationType: string;
  status: string;
  subtotal: number;
  taxes: number;
  totalAmount: number;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null;
  equipment: {
    id: string;
    make: string;
    model: string;
  } | null;
  depositAmount?: number | null;
  balanceAmount?: number | null;
  balanceDueAt?: string | null;
  billingStatus?: string | null;
  financeNotes?: string | null;
}

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'finance'>('overview');

  const fetchBookingDetails = useCallback(async (bookingId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(
          `
          id,
          bookingNumber,
          customerId,
          equipmentId,
          startDate,
          endDate,
          deliveryAddress,
          distanceKm,
          deliveryFee,
          transportationType,
          status,
          subtotal,
          taxes,
          totalAmount,
          createdAt,
          depositAmount,
          balanceAmount:balance_amount,
          balanceDueAt:balance_due_at,
          billingStatus:billing_status,
          financeNotes,
          customer:customerId (
            id,
            firstName,
            lastName,
            email,
            phone
          ),
          equipment:equipmentId (
            id,
            make,
            model
          )
        `
        )
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Booking not found');

      // Type assertion needed due to complex query with joins
      const bookingData = data as unknown as Record<string, unknown>;

      const normalized: Booking = {
        id: bookingData.id,
        bookingNumber: bookingData.bookingNumber,
        customerId: bookingData.customerId,
        equipmentId: bookingData.equipmentId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        deliveryAddress: bookingData.deliveryAddress,
        distanceKm: bookingData.distanceKm ?? 0,
        deliveryFee: bookingData.deliveryFee ?? 0,
        transportationType: bookingData.transportationType,
        status: bookingData.status,
        subtotal: bookingData.subtotal ?? 0,
        taxes: bookingData.taxes ?? 0,
        totalAmount: bookingData.totalAmount ?? 0,
        createdAt: bookingData.createdAt,
        customer: bookingData.customer,
        equipment: bookingData.equipment,
        depositAmount: bookingData.depositAmount ?? bookingData.deposit_amount ?? null,
        balanceAmount: bookingData.balanceAmount ?? bookingData.balance_amount ?? null,
        balanceDueAt: bookingData.balanceDueAt ?? bookingData.balance_due_at ?? null,
        billingStatus: bookingData.billingStatus ?? bookingData.billing_status ?? null,
        financeNotes: bookingData.financeNotes ?? bookingData.finance_notes ?? null,
      };

      setBooking(normalized);
    } catch (err) {
      logger.error(
        'Failed to fetch booking details',
        { component: 'BookingDetailPage', metadata: { bookingId } },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!params.id) return;
    fetchBookingDetails(params.id);
  }, [params.id, fetchBookingDetails]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-kubota-orange border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Booking Not Found</h2>
          <p className="mt-2 text-gray-600">{error || 'This booking does not exist.'}</p>
          <button
            onClick={() => router.push('/admin/bookings')}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-kubota-orange px-4 py-2 text-white hover:bg-orange-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/bookings')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Bookings
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-600">{booking.bookingNumber}</p>
          </div>
        </div>
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              booking.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : booking.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
            }`}
          >
            {booking.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex gap-3 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-kubota-orange text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'finance'
                ? 'border-b-2 border-kubota-orange text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Finance
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Customer Information */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-kubota-orange" />
                  <h2 className="text-lg font-semibold">Customer Information</h2>
                </div>
                {booking.customerId && (
                  <button
                    onClick={() => router.push(`/admin/customers?customerId=${booking.customerId}`)}
                    className="rounded-md bg-kubota-orange px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
                  >
                    View Customer
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">
                    {booking.customer?.firstName} {booking.customer?.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{booking.customer?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{booking.customer?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Equipment Information */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-kubota-orange" />
                <h2 className="text-lg font-semibold">Equipment Information</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Equipment</label>
                  <p className="text-gray-900">
                    {booking.equipment?.make} {booking.equipment?.model}
                  </p>
                </div>
              </div>
            </div>

            {/* Rental Period */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-kubota-orange" />
                <h2 className="text-lg font-semibold">Rental Period</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date</label>
                  <p className="text-gray-900">{formatDate(booking.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">End Date</label>
                  <p className="text-gray-900">{formatDate(booking.endDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Booking Created</label>
                  <p className="text-gray-900">{formatDate(booking.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-kubota-orange" />
                <h2 className="text-lg font-semibold">Delivery Information</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">{booking.deliveryAddress}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Distance</label>
                  <p className="text-gray-900">{booking.distanceKm || 0} km</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Delivery Method</label>
                  <p className="text-gray-900 capitalize">
                    {booking.transportationType?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-kubota-orange" />
              <h2 className="text-lg font-semibold">Financial Summary</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(booking.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">{formatCurrency(booking.deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (HST)</span>
                <span className="font-medium">{formatCurrency(booking.taxes || 0)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-lg font-bold text-kubota-orange">
                    {formatCurrency(booking.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <BookingFinancePanel
          bookingId={booking.id}
          bookingNumber={booking.bookingNumber}
          customerId={booking.customerId}
          customerName={
            booking.customer
              ? `${booking.customer.firstName ?? ''} ${booking.customer.lastName ?? ''}`.trim()
              : undefined
          }
          totalAmount={booking.totalAmount}
          depositAmount={booking.depositAmount}
          balanceAmount={booking.balanceAmount}
          billingStatus={booking.billingStatus}
          balanceDueAt={booking.balanceDueAt}
        />
      )}
    </div>
  );
}
