'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { formatCurrency, formatDate } from '@/lib/utils';

import AnalyticsDashboard from './AnalyticsDashboard';
import LiveBookingStatus from './LiveBookingStatus';
import NotificationCenter from './NotificationCenter';

interface AdminStats {
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  equipment: {
    name: string;
    type: string;
  };
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total: number;
  deliveryAddress: string;
  createdAt: string;
}

interface RecentActivity {
  id: string;
  type:
    | 'booking_created'
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'payment_received'
    | 'equipment_returned';
  description: string;
  timestamp: string;
  bookingNumber?: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [_activeTab, _setActiveTab] = useState<'overview' | 'bookings' | 'revenue' | 'equipment'>(
    'overview'
  ); // Reserved for future tab functionality
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAdminData();
  }, [dateRange]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API calls
      const mockStats: AdminStats = {
        totalBookings: 47,
        totalRevenue: 125750.0,
        activeBookings: 8,
        pendingBookings: 3,
        completedBookings: 35,
        cancelledBookings: 1,
        averageBookingValue: 2675.53,
        monthlyRevenue: 18750.0,
        weeklyRevenue: 4687.5,
        dailyRevenue: 669.64,
      };

      const mockBookings: Booking[] = [
        {
          id: '1',
          bookingNumber: 'UDR-2025-001',
          customer: {
            name: 'John Smith',
            email: 'john@example.com',
            phone: '(506) 555-0123',
          },
          equipment: {
            name: 'Kubota SVL-75',
            type: 'Compact Track Loader',
          },
          startDate: '2025-01-15',
          endDate: '2025-01-17',
          status: 'confirmed',
          total: 1050.0,
          deliveryAddress: '123 Main St, Saint John, NB',
          createdAt: '2025-01-10T10:30:00Z',
        },
        {
          id: '2',
          bookingNumber: 'UDR-2025-002',
          customer: {
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '(506) 555-0456',
          },
          equipment: {
            name: 'Kubota SVL-75',
            type: 'Compact Track Loader',
          },
          startDate: '2025-01-20',
          endDate: '2025-01-22',
          status: 'pending',
          total: 1050.0,
          deliveryAddress: '456 Oak Ave, Rothesay, NB',
          createdAt: '2025-01-12T14:15:00Z',
        },
        {
          id: '3',
          bookingNumber: 'UDR-2025-003',
          customer: {
            name: 'Mike Wilson',
            email: 'mike@example.com',
            phone: '(506) 555-0789',
          },
          equipment: {
            name: 'Kubota SVL-75',
            type: 'Compact Track Loader',
          },
          startDate: '2025-01-18',
          endDate: '2025-01-20',
          status: 'in_progress',
          total: 1050.0,
          deliveryAddress: '789 Pine St, Quispamsis, NB',
          createdAt: '2025-01-08T09:45:00Z',
        },
      ];

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'booking_created',
          description: 'New booking created by John Smith',
          timestamp: '2025-01-12T14:30:00Z',
          bookingNumber: 'UDR-2025-002',
        },
        {
          id: '2',
          type: 'payment_received',
          description: 'Payment received for UDR-2025-001',
          timestamp: '2025-01-12T11:15:00Z',
          bookingNumber: 'UDR-2025-001',
        },
        {
          id: '3',
          type: 'booking_confirmed',
          description: 'Booking UDR-2025-003 confirmed',
          timestamp: '2025-01-11T16:20:00Z',
          bookingNumber: 'UDR-2025-003',
        },
        {
          id: '4',
          type: 'equipment_returned',
          description: 'Equipment returned for UDR-2024-156',
          timestamp: '2025-01-11T10:45:00Z',
          bookingNumber: 'UDR-2024-156',
        },
      ];

      setStats(mockStats);
      setBookings(mockBookings);
      setRecentActivity(mockActivity);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch admin data:',
          {
            component: 'AdminDashboard',
            action: 'error',
          },
          error instanceof Error ? error : new Error(String(error))
        );
      }
    } finally {
      setLoading(false);
    }
  };

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking_created':
        return '📝';
      case 'booking_confirmed':
        return '✅';
      case 'booking_cancelled':
        return '❌';
      case 'payment_received':
        return '💰';
      case 'equipment_returned':
        return '🔧';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-6 h-8 rounded bg-gray-200"></div>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded bg-gray-200"></div>
            ))}
          </div>
          <div className="h-64 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Manage bookings, track revenue, and monitor equipment performance
            </p>
          </div>
          <NotificationCenter userId={user?.id} showBadge={true} />
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Time Period:</label>
          <select
            value={dateRange}
            onChange={(e) =>
              setDateRange(e.target.value as 'today' | 'week' | 'month' | 'quarter' | 'year')
            }
            className="rounded-md border border-gray-300 px-3 py-1 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
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
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Booking Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.averageBookingValue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Breakdown */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Revenue Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Daily</span>
                <span className="font-semibold">{formatCurrency(stats.dailyRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly</span>
                <span className="font-semibold">{formatCurrency(stats.weeklyRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly</span>
                <span className="font-semibold">{formatCurrency(stats.monthlyRevenue)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Booking Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{stats.pendingBookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active</span>
                <span className="font-semibold text-blue-600">{stats.activeBookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{stats.completedBookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cancelled</span>
                <span className="font-semibold text-red-600">{stats.cancelledBookings}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/admin/bookings"
                className="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                View All Bookings
              </Link>
              <Link
                href="/admin/equipment"
                className="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Manage Equipment
              </Link>
              <Link
                href="/admin/customers"
                className="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Customer Management
              </Link>
              <Link
                href="/admin/reports"
                className="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Generate Reports
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="mb-8 rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
        </div>
        <div className="p-6">
          {bookings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No recent bookings found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {booking.equipment.name}
                          </h3>
                          <p className="text-sm text-gray-600">#{booking.bookingNumber}</p>
                          <p className="text-sm text-gray-600">
                            {booking.customer.name} • {booking.customer.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(booking.status)}`}
                      >
                        {getStatusText(booking.status)}
                      </span>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {formatCurrency(booking.total)}
                      </p>
                      <div className="mt-2 space-x-2">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </Link>
                        {booking.status === 'pending' && (
                          <button className="text-sm text-green-600 hover:text-green-800">
                            Confirm
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

      {/* Recent Activity */}
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(activity.timestamp)} • {activity.bookingNumber}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="mt-8">
        <AnalyticsDashboard />
      </div>

      {/* Live Booking Status */}
      <div className="mt-8">
        <LiveBookingStatus bookingId="current" showLiveIndicator={true} />
      </div>
    </div>
  );
}
