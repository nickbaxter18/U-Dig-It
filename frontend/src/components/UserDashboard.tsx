'use client';

import { cancelBooking, getCancellationPreview } from '@/app/booking/[id]/actions';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { supabaseApi } from '@/lib/supabase/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';

import Footer from './Footer';
import Navigation from './Navigation';

interface Booking {
  id: string;
  bookingNumber: string;
  equipment: {
    make: string;
    model: string;
    images?: unknown;
  };
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  totalAmount: number;
  balanceAmount?: number | null;
  deliveryAddress: string;
}

interface UserStats {
  totalBookings: number;
  totalSpent: number;
  upcomingBookings: number;
  completedBookings: number;
}

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const isLoading = authLoading || loading;

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch user's bookings using Supabase
      const userBookings = await supabaseApi.getBookings({
        userId: user.id,
        limit: 10,
      });

      // Transform the bookings data to match the component interface
      // Type the booking result from Supabase query
      type BookingQueryResult = {
        id: string;
        bookingNumber: string;
        startDate: string | Date | null;
        endDate: string | Date | null;
        status: string;
        totalAmount: number | string | null;
        balance_amount?: number | string | null;
        deliveryAddress?: string | null;
        equipment?: {
          make?: string | null;
          model?: string | null;
          images?: string[] | unknown;
        } | null;
        [key: string]: unknown;
      };
      const transformedBookings: Booking[] = (userBookings || []).map((booking: BookingQueryResult) => ({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        equipment: {
          make: booking.equipment?.make || 'Equipment',
          model: booking.equipment?.model || 'Model',
          images: booking.equipment?.images as string[] | undefined,
        },
        startDate: typeof booking.startDate === 'string' ? booking.startDate : booking.startDate instanceof Date ? booking.startDate.toISOString() : '',
        endDate: typeof booking.endDate === 'string' ? booking.endDate : booking.endDate instanceof Date ? booking.endDate.toISOString() : '',
        status: booking.status as 'pending' | 'confirmed' | 'paid' | 'in_progress' | 'completed' | 'cancelled',
        totalAmount: Number(booking.totalAmount) || 0,
        balanceAmount: booking.balance_amount !== undefined && booking.balance_amount !== null ? Number(booking.balance_amount) : null,
        deliveryAddress: booking.deliveryAddress || '',
      }));

      // Calculate stats from the bookings
      const stats: UserStats = {
        totalBookings: transformedBookings.length,
        totalSpent: transformedBookings.reduce(
          (sum: number, booking: Booking) => sum + (booking.totalAmount || 0),
          0
        ),
        upcomingBookings: transformedBookings.filter((b) =>
          ['pending', 'confirmed', 'paid', 'in_progress'].includes(b.status)
        ).length,
        completedBookings: transformedBookings.filter((b) => b.status === 'completed').length,
      };

      setBookings(transformedBookings);
      setStats(stats);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch user data:',
          {
            component: 'UserDashboard',
            action: 'error',
          },
          error instanceof Error ? error : new Error(String(error))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  const handleCancelBooking = async (bookingId: string) => {
    if (cancellingId) return; // Prevent double-clicks

    try {
      setCancellingId(bookingId);

      // Get cancellation preview
      const preview = await getCancellationPreview(bookingId);

      if (!preview) {
        alert('Unable to calculate cancellation fee. Please try again.');
        return;
      }

      const confirmMessage =
        preview.fee > 0
          ? `Are you sure you want to cancel this booking?\n\n${preview.policy}\nCancellation Fee: $${preview.fee.toFixed(2)}\nRefund Amount: $${preview.refund.toFixed(2)}`
          : `Are you sure you want to cancel this booking?\n\n${preview.policy}\nYou will receive a full refund.`;

      if (confirm(confirmMessage)) {
        const result = await cancelBooking(bookingId);

        if (result.success) {
          alert(result.message);
          // Refresh bookings list
          await fetchUserData();
        } else {
          alert(`Cancellation failed: ${result.error || result.message}`);
        }
      }
    } catch (error: unknown) {
      logger.error(
        'Error cancelling booking:',
        {
          component: 'UserDashboard',
          action: 'error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
      alert('An error occurred while cancelling the booking');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-indigo-100 text-indigo-800';
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
      case 'paid':
        return 'Paid';
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

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aTime = new Date(a.startDate).getTime();
      const bTime = new Date(b.startDate).getTime();
      return aTime - bTime;
    });
  }, [bookings]);

  const nextActionableBooking = useMemo(() => {
    const now = new Date();
    return sortedBookings.find((booking) => {
      const startTime = new Date(booking.startDate).getTime();
      return (
        startTime >= now.getTime() - 1000 * 60 * 60 * 24 &&
        ['pending', 'confirmed', 'paid', 'in_progress'].includes(booking.status)
      );
    });
  }, [sortedBookings]);

  const filteredBookings = useMemo(() => {
    const now = new Date();

    return sortedBookings.filter((booking) => {
      const startTime = new Date(booking.startDate).getTime();

      switch (activeTab) {
        case 'upcoming':
          return startTime >= now.getTime();
        case 'past':
          return startTime < now.getTime();
        case 'all':
        default:
          return true;
      }
    });
  }, [sortedBookings, activeTab]);

  const nextBookingSummary = useMemo(() => {
    if (!nextActionableBooking) return null;

    const statusCopy: Record<Booking['status'], { label: string; helper: string }> = {
      pending: {
        label: 'Awaiting confirmation',
        helper: 'We are reviewing the details. We will notify you as soon as it is confirmed.',
      },
      confirmed: {
        label: 'Confirmed',
        helper: 'Complete any required forms or insurance before pick-up.',
      },
      paid: {
        label: 'Payment complete',
        helper: 'You are all set. Review pick-up instructions and arrival time.',
      },
      in_progress: {
        label: 'Active rental',
        helper: 'Return on time to avoid late fees. Need help? Contact support anytime.',
      },
      completed: {
        label: 'Completed',
        helper: 'Thank you for renting with us! Download receipts or leave feedback.',
      },
      cancelled: {
        label: 'Cancelled',
        helper: 'See details to reschedule or create a new booking.',
      },
    };

    return {
      ...nextActionableBooking,
      copy: statusCopy[nextActionableBooking.status],
    };
  }, [nextActionableBooking]);

  if (isLoading || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-6 h-8 rounded bg-gray-200"></div>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded bg-gray-200"></div>
            ))}
          </div>
          <div className="h-64 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.user_metadata?.firstName || user?.email || 'User'}!
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your equipment rentals and stay on top of your upcoming tasks.
              </p>
            </div>

            {nextBookingSummary ? (
              <div className="rounded-2xl border border-blue-200 bg-white shadow-sm">
                <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Next booking
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      {nextBookingSummary.equipment.make} {nextBookingSummary.equipment.model}
                    </h2>
                    <p className="mt-3 text-sm text-gray-600">
                      {formatDate(nextBookingSummary.startDate)} &ndash;{' '}
                      {formatDate(nextBookingSummary.endDate)}
                    </p>
                    {nextBookingSummary.deliveryAddress && (
                      <p className="mt-1 text-sm text-gray-500">
                        {nextBookingSummary.deliveryAddress}
                      </p>
                    )}
                  </div>
                  <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {nextBookingSummary.copy.label}
                    </span>
                    <p className="max-w-md text-sm text-gray-600 md:text-right">
                      {nextBookingSummary.copy.helper}
                    </p>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <Link
                        href={`/booking/${nextBookingSummary.id}/manage`}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        View tasks
                      </Link>
                      <Link
                        href={`/booking/${nextBookingSummary.id}/details`}
                        className="inline-flex items-center justify-center rounded-lg border border-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        Booking summary
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">No upcoming bookings yet</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Book your next rental to see timelines, tasks, and helpful reminders here.
                </p>
                <Link
                  href="/book"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Start a booking
                </Link>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center">
                  <div className="rounded-lg bg-green-100 p-2">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.totalSpent)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center">
                  <div className="rounded-lg bg-yellow-100 p-2">
                    <svg
                      className="h-6 w-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.upcomingBookings}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <svg
                      className="h-6 w-6 text-purple-600"
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
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/book"
                className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="mr-3 rounded-lg bg-blue-100 p-2">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">New Booking</p>
                  <p className="text-sm text-gray-600">Rent equipment</p>
                </div>
              </Link>

              <Link
                href="/profile"
                className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="mr-3 rounded-lg bg-green-100 p-2">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Profile</p>
                  <p className="text-sm text-gray-600">Manage account</p>
                </div>
              </Link>

              <Link
                href="/support"
                className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="mr-3 rounded-lg bg-yellow-100 p-2">
                  <svg
                    className="h-5 w-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Support</p>
                  <p className="text-sm text-gray-600">Get help</p>
                </div>
              </Link>

              <Link
                href="/downloads"
                className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="mr-3 rounded-lg bg-purple-100 p-2">
                  <svg
                    className="h-5 w-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Downloads</p>
                  <p className="text-sm text-gray-600">Forms & guides</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Bookings Section */}
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Your Bookings</h2>
                <div className="flex space-x-1">
                  {(['upcoming', 'past', 'all'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6">
              {filteredBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {activeTab === 'upcoming'
                      ? "You don't have any upcoming bookings."
                      : activeTab === 'past'
                        ? "You don't have any past bookings."
                        : "You don't have any bookings yet."}
                  </p>
                  {activeTab !== 'past' && (
                    <div className="mt-6">
                      <Link
                        href="/book"
                        className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                      >
                        Make a Booking
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img
                            src={(Array.isArray(booking.equipment.images) && booking.equipment.images[0]) || '/images/kubota.png'}
                            alt={`${booking.equipment.make} ${booking.equipment.model}`}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {booking.equipment.make} {booking.equipment.model}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Booking #{booking.bookingNumber}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(booking.startDate)} &ndash; {formatDate(booking.endDate)}
                            </p>
                            <p className="text-sm text-gray-600">{booking.deliveryAddress}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(booking.status)}`}
                          >
                            {getStatusText(booking.status)}
                          </span>
                          <p className="mt-2 text-lg font-semibold text-gray-900">
                            {formatCurrency(booking.balanceAmount ?? booking.totalAmount)}
                          </p>
                          <div className="mt-3 flex flex-col gap-2">
                            <Link
                              href={`/booking/${booking.id}/manage`}
                              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                              <svg
                                className="mr-1.5 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                />
                              </svg>
                              Manage Booking
                            </Link>
                            <div className="flex gap-2">
                              <Link
                                href={`/booking/${booking.id}/details`}
                                className="flex-1 text-center text-sm text-gray-600 underline hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
                              >
                                Details
                              </Link>
                              {booking.status === 'pending' && (
                                <button
                                  className="flex-1 text-center text-sm text-red-600 underline hover:text-red-800 disabled:opacity-50"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={cancellingId === booking.id}
                                >
                                  {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
