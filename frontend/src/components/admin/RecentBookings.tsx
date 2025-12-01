'use client';

import { Eye } from 'lucide-react';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  equipmentName: string;
  startDate: string;
  endDate: string;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function RecentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent bookings from Supabase
    const fetchBookings = async () => {
      try {
        // Query bookings with equipment and customer details from public.users
        const { data, error } = await supabase
          .from('bookings')
          .select(
            `
            id,
            bookingNumber,
            startDate,
            endDate,
            totalAmount,
            balance_amount,
            status,
            createdAt,
            equipment:equipmentId (
              make,
              model
            ),
            customer:customerId (
              firstName,
              lastName,
              email
            )
          `
          )
          .order('createdAt', { ascending: false })
          .limit(5);

        if (error) throw error;

        // Transform data to match Booking interface
        const bookingsData = (data || ([] as unknown[])).map((booking: unknown) => {
          const firstName = booking.customer?.firstName || '';
          const lastName = booking.customer?.lastName || '';
          const customerName =
            `${firstName} ${lastName}`.trim() || booking.customer?.email || 'Unknown Customer';

          return {
            id: booking.id,
            bookingNumber: booking.bookingNumber,
            customerName,
            equipmentName: `${booking.equipment?.make || 'Kubota'} ${booking.equipment?.model || 'SVL-75'}`,
            startDate: booking.startDate,
            endDate: booking.endDate,
            total: parseFloat(booking.totalAmount),
            balanceAmount: booking.balance_amount !== undefined && booking.balance_amount !== null ? Number(booking.balance_amount) : null,
            status: booking.status.toUpperCase() as Booking['status'],
            createdAt: booking.createdAt,
          };
        });

        setBookings(bookingsData);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error(
            'Failed to fetch recent bookings:',
            {
              component: 'RecentBookings',
              action: 'error',
            },
            error instanceof Error ? error : new Error(String(error))
          );
        }
        // Set empty array on error instead of showing mock data
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div
        className="flex h-32 items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="border-premium-gold h-6 w-6 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center">
        <h4 className="text-base font-semibold text-gray-900">No recent bookings</h4>
        <p className="mt-1 text-sm text-gray-500">
          New bookings will appear here as soon as customers confirm their rentals.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Booking
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Equipment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{booking.bookingNumber}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-900">{booking.customerName}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-900">{booking.equipmentName}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {new Date(booking.startDate).toLocaleDateString()} -{' '}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    ${(booking.balanceAmount ?? booking.total).toLocaleString()}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[booking.status]}`}
                  >
                    {booking.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <Link
                    href={`/admin/bookings?bookingId=${booking.id}`}
                    className="text-premium-gold flex items-center hover:text-premium-gold-dark"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">Showing {bookings.length} recent bookings</p>
          <Link
            href="/admin/bookings"
            className="text-premium-gold text-sm font-medium hover:text-premium-gold-dark"
          >
            View all bookings →
          </Link>
        </div>
      </div>
    </div>
  );
}
