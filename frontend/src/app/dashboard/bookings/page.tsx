'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Calendar, FileText, Loader2, MapPin, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface Booking {
  id: string;
  bookingNumber: string;
  equipmentId: string;
  startDate: string;
  endDate: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryProvince: string | null;
  deliveryPostalCode: string | null;
  totalAmount: string;
  securityDeposit: string;
  status: string;
  type: string;
  createdAt: string;
  dailyRate: string;
  deliveryFee: string;
}

export default function BookingsPage() {
  const { user, loading: authLoading, initialized } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (initialized && !authLoading && !user) {
      router.push('/auth/signin?callbackUrl=/dashboard/bookings');
    }
  }, [user, authLoading, initialized, router]);

  // Fetch bookings
  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select('*')
          .eq('customerId', user.id)
          .order('createdAt', { ascending: false });

        if (fetchError) throw fetchError;

        setBookings(data || []);
      } catch (err) {
        logger.error('[Bookings] Error fetching bookings', {
          component: 'app-page',
          action: 'error',
          metadata: { error: err instanceof Error ? err.message : String(err) }
        }, err instanceof Error ? err : undefined);
        setError('Failed to load your bookings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800 border-green-200' },
      in_progress: {
        label: 'In Progress',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
      },
      completed: { label: 'Completed', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
      insurance_verified: {
        label: 'Insurance OK',
        className: 'bg-teal-100 text-teal-800 border-teal-200',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const filterBookings = (bookings: Booking[]) => {
    const now = new Date();

    return bookings.filter(booking => {
      if (filter === 'all') return true;

      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);

      if (filter === 'upcoming') {
        return startDate > now && booking.status !== 'cancelled';
      }
      if (filter === 'past') {
        return endDate < now || booking.status === 'completed';
      }
      if (filter === 'cancelled') {
        return booking.status === 'cancelled';
      }

      return true;
    });
  };

  const filteredBookings = filterBookings(bookings);

  if (!initialized || authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#E1BC56]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="mt-1 text-gray-600">Manage your equipment rental bookings</p>
            </div>
            <Link
              href="/book"
              className="rounded-lg bg-[#E1BC56] px-6 py-3 font-semibold text-gray-900 shadow-sm transition-colors hover:bg-[#d4b04a]"
            >
              + New Booking
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {[
              { value: 'all', label: 'All Bookings' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'past', label: 'Past' },
              { value: 'cancelled', label: 'Cancelled' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as typeof filter)}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  filter === tab.value
                    ? 'border-[#E1BC56] text-[#E1BC56]'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.value === 'all' && bookings.length > 0 && (
                  <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                    {bookings.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#E1BC56]" />
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-start rounded-lg border border-red-200 bg-red-50 p-6">
            <AlertCircle className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
            <div>
              <h3 className="mb-1 font-semibold text-red-900">Error Loading Bookings</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBookings.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </h3>
            <p className="mb-6 text-gray-600">
              {filter === 'all'
                ? 'Start by creating your first equipment rental booking.'
                : `You don't have any ${filter} bookings.`}
            </p>
            {filter === 'all' && (
              <Link
                href="/book"
                className="inline-flex items-center rounded-lg bg-[#E1BC56] px-6 py-3 font-semibold text-gray-900 shadow-sm transition-colors hover:bg-[#d4b04a]"
              >
                Book Equipment Now
              </Link>
            )}
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <div
                key={booking.id}
                className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">Kubota SVL-75</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <p className="text-sm text-gray-500">Booking #{booking.bookingNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#E1BC56]">
                        {formatCurrency(parseFloat(booking.totalAmount))}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">Total Amount</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-b border-t border-gray-100 py-4 md:grid-cols-3">
                    <div className="flex items-start">
                      <Calendar className="mr-2 mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Rental Period
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {new Date(booking.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-600">to</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(booking.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="mr-2 mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Delivery Location
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {booking.deliveryCity}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">{booking.deliveryAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FileText className="mr-2 mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Booked On
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {new Date(booking.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {new Date(booking.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Daily Rate:{' '}
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(parseFloat(booking.dailyRate))}
                        </span>
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        Delivery:{' '}
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(parseFloat(booking.deliveryFee))}
                        </span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        View Details
                      </Link>
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this booking?')) {
                              // TODO: Implement cancellation
                              alert('Cancellation functionality coming soon');
                            }
                          }}
                          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
