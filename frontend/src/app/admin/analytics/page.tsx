'use client';

import { Calendar, DollarSign, Download, TrendingUp, Users, Wrench } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
// Added Supabase import
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface AnalyticsData {
  revenue: {
    data: Array<{ date: string; revenue: number; bookings: number }>;
    totalRevenue: number;
    growthPercentage: number;
    averageDailyRevenue: number;
  };
  bookings: {
    data: Array<{ date: string; bookings: number; completed: number; cancelled: number }>;
    totalBookings: number;
    completionRate: number;
    cancellationRate: number;
  };
  equipment: {
    data: Array<{
      equipmentId: string;
      equipmentName: string;
      utilizationRate: number;
      revenue: number;
    }>;
    averageUtilization: number;
    topPerformer: { equipmentId: string; equipmentName: string; utilizationRate: number };
  };
  customers: {
    data: Array<{ date: string; newCustomers: number; returningCustomers: number }>;
    totalCustomers: number;
    newCustomers: number;
    retentionRate: number;
    averageLifetimeValue: number;
  };
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedChart, setSelectedChart] = useState<
    'revenue' | 'bookings' | 'equipment' | 'customers'
  >('revenue');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      const previousStartDate = new Date();

      switch (dateRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          previousStartDate.setDate(previousStartDate.getDate() - 14);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          previousStartDate.setMonth(previousStartDate.getMonth() - 2);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          previousStartDate.setMonth(previousStartDate.getMonth() - 6);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
          break;
      }

      // MIGRATED: Fetch revenue analytics from Supabase
      // Include both bookings (for booking-based metrics) and actual payments (for revenue)
      const { data: currentBookings, error: revenueError } = await supabase
        .from('bookings')
        .select('totalAmount, createdAt, status, customerId')
        .gte('createdAt', startDate.toISOString())
        .lte('createdAt', now.toISOString())
        .returns<
          Array<{ totalAmount: string; createdAt: string; status: string; customerId: string }>
        >();

      if (revenueError) throw revenueError;

      const { data: previousBookings } = await supabase
        .from('bookings')
        .select('totalAmount')
        .gte('createdAt', previousStartDate.toISOString())
        .lt('createdAt', startDate.toISOString())
        .returns<Array<{ totalAmount: string }>>();

      // Fetch actual payments (Stripe + manual) for accurate revenue
      const [currentStripePayments, currentManualPayments] = await Promise.all([
        supabase
          .from('payments')
          .select('amount, status, createdAt')
          .in('status', ['completed', 'succeeded'])
          .eq('type', 'payment')
          .gte('createdAt', startDate.toISOString())
          .lte('createdAt', now.toISOString())
          .is('deleted_at', null),
        supabase
          .from('manual_payments')
          .select('amount, status, created_at')
          .eq('status', 'completed')
          .is('deleted_at', null)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString()),
      ]);

      if (currentStripePayments.error) throw currentStripePayments.error;
      if (currentManualPayments.error) throw currentManualPayments.error;

      // Fetch previous period payments
      const [previousStripePayments, previousManualPayments] = await Promise.all([
        supabase
          .from('payments')
          .select('amount, status, createdAt')
          .in('status', ['completed', 'succeeded'])
          .eq('type', 'payment')
          .gte('createdAt', previousStartDate.toISOString())
          .lt('createdAt', startDate.toISOString())
          .is('deleted_at', null),
        supabase
          .from('manual_payments')
          .select('amount, status, created_at')
          .eq('status', 'completed')
          .is('deleted_at', null)
          .gte('created_at', previousStartDate.toISOString())
          .lt('created_at', startDate.toISOString()),
      ]);

      if (previousStripePayments.error) throw previousStripePayments.error;
      if (previousManualPayments.error) throw previousManualPayments.error;

      // Calculate revenue from actual payments (more accurate than booking totals)
      const currentStripeRevenue =
        (currentStripePayments.data ?? []).reduce(
          (sum: number, p: unknown) => sum + Number((p as { amount: number | string }).amount ?? 0),
          0
        ) || 0;
      const currentManualRevenue =
        (currentManualPayments.data ?? []).reduce(
          (sum: number, p: unknown) => sum + Number((p as { amount: number | string }).amount ?? 0),
          0
        ) || 0;
      const totalRevenue = currentStripeRevenue + currentManualRevenue;

      const previousStripeRevenue =
        (previousStripePayments.data ?? []).reduce(
          (sum: number, p: unknown) => sum + Number((p as { amount: number | string }).amount ?? 0),
          0
        ) || 0;
      const previousManualRevenue =
        (previousManualPayments.data ?? []).reduce(
          (sum: number, p: unknown) => sum + Number((p as { amount: number | string }).amount ?? 0),
          0
        ) || 0;
      const previousRevenue = previousStripeRevenue + previousManualRevenue;

      // Aggregate revenue by date (using payment dates, not booking dates)
      const revenueByDate = new Map<string, { revenue: number; bookings: number }>();

      // Add Stripe payments to date map
      currentStripePayments.data?.forEach((payment: unknown) => {
        const paymentDate = new Date((payment as { createdAt: string }).createdAt)
          .toISOString()
          .split('T')[0];
        const current = revenueByDate.get(paymentDate) || { revenue: 0, bookings: 0 };
        revenueByDate.set(paymentDate, {
          revenue: current.revenue + Number((payment as { amount: number | string }).amount ?? 0),
          bookings: current.bookings,
        });
      });

      // Add manual payments to date map
      currentManualPayments.data?.forEach((payment: unknown) => {
        const paymentDate = new Date((payment as { created_at: string }).created_at)
          .toISOString()
          .split('T')[0];
        const current = revenueByDate.get(paymentDate) || { revenue: 0, bookings: 0 };
        revenueByDate.set(paymentDate, {
          revenue: current.revenue + Number((payment as { amount: number | string }).amount ?? 0),
          bookings: current.bookings,
        });
      });

      // Add booking counts by date
      currentBookings?.forEach((booking) => {
        const date = new Date(booking.createdAt).toISOString().split('T')[0];
        const current = revenueByDate.get(date) || { revenue: 0, bookings: 0 };
        revenueByDate.set(date, {
          revenue: current.revenue,
          bookings: current.bookings + 1,
        });
      });

      const revenueData = Array.from(revenueByDate.entries())
        .map(([date, { revenue, bookings }]) => ({ date, revenue, bookings }))
        .sort((a: unknown, b: unknown) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const growthPercentage =
        previousRevenue > 0
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
          : totalRevenue > 0
            ? 100
            : 0;

      const daysDiff = Math.max(
        1,
        Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const averageDailyRevenue = totalRevenue / daysDiff;

      // MIGRATED: Fetch booking analytics from Supabase
      const bookingsByDate = new Map<
        string,
        { total: number; completed: number; cancelled: number }
      >();
      currentBookings?.forEach((booking) => {
        const date = new Date(booking.createdAt).toISOString().split('T')[0];
        const current = bookingsByDate.get(date) || { total: 0, completed: 0, cancelled: 0 };
        bookingsByDate.set(date, {
          total: current.total + 1,
          completed: current.completed + (booking.status === 'completed' ? 1 : 0),
          cancelled: current.cancelled + (booking.status === 'cancelled' ? 1 : 0),
        });
      });

      const bookingsData = Array.from(bookingsByDate.entries())
        .map(([date, { total, completed, cancelled }]) => ({
          date,
          bookings: total,
          completed,
          cancelled,
        }))
        .sort((a: unknown, b: unknown) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const totalBookings = currentBookings?.length || 0;
      const completedBookings =
        currentBookings?.filter((b) => b.status === 'completed').length || 0;
      const cancelledBookings =
        currentBookings?.filter((b) => b.status === 'cancelled').length || 0;
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

      // MIGRATED: Fetch equipment analytics from Supabase
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, model, make, serialNumber, dailyRate, status')
        .returns<
          Array<{
            id: string;
            model: string;
            make: string;
            serialNumber: string;
            dailyRate: string;
            status: string;
          }>
        >();

      if (equipmentError) throw equipmentError;

      const equipmentWithStats = await Promise.all(
        (equipment || []).map(async (eq) => {
          // Get bookings for this equipment in the date range
          const { data: equipmentBookings } = await supabase
            .from('bookings')
            .select('totalAmount, status, startDate, endDate')
            .eq('equipmentId', eq.id)
            .gte('createdAt', startDate.toISOString())
            .returns<
              Array<{ totalAmount: string; status: string; startDate: string; endDate: string }>
            >();

          const revenue =
            equipmentBookings?.reduce(
              (sum: unknown, b: unknown) => sum + parseFloat(b.totalAmount || '0'),
              0
            ) || 0;

          // Calculate utilization rate (simplified: days booked / total days in period)
          const totalDays = daysDiff;
          let daysBooked = 0;
          equipmentBookings?.forEach((booking) => {
            if (booking.status !== 'cancelled') {
              const start = new Date(booking.startDate);
              const end = new Date(booking.endDate);
              const bookingDays = Math.ceil(
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
              );
              daysBooked += bookingDays;
            }
          });
          const utilizationRate = totalDays > 0 ? Math.min(100, (daysBooked / totalDays) * 100) : 0;

          return {
            equipmentId: eq.id,
            equipmentName: `${eq.make} ${eq.model}`,
            utilizationRate,
            revenue,
          };
        })
      );

      const averageUtilization =
        equipmentWithStats.length > 0
          ? equipmentWithStats.reduce((sum: unknown, e: unknown) => sum + e.utilizationRate, 0) /
            equipmentWithStats.length
          : 0;

      const topPerformer = equipmentWithStats.reduce(
        (max: unknown, e: unknown) => (e.utilizationRate > max.utilizationRate ? e : max),
        equipmentWithStats[0] || { equipmentId: '', equipmentName: 'N/A', utilizationRate: 0 }
      );

      // MIGRATED: Fetch customer analytics from Supabase
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, createdAt')
        .returns<Array<{ id: string; createdAt: string }>>();

      const totalCustomers = allUsers?.length || 0;

      const { data: newUsers } = await supabase
        .from('users')
        .select('id, createdAt')
        .gte('createdAt', startDate.toISOString())
        .returns<Array<{ id: string; createdAt: string }>>();

      const newCustomers = newUsers?.length || 0;

      // Customer data by date
      const customersByDate = new Map<string, { new: number; returning: number }>();
      currentBookings?.forEach((booking) => {
        const date = new Date(booking.createdAt).toISOString().split('T')[0];
        // For simplicity, assume all customers in a booking are returning
        // (proper implementation would check if it's their first booking)
        const current = customersByDate.get(date) || { new: 0, returning: 0 };
        customersByDate.set(date, {
          ...current,
          returning: current.returning + 1,
        });
      });

      newUsers?.forEach((user) => {
        const date = new Date(user.createdAt).toISOString().split('T')[0];
        const current = customersByDate.get(date) || { new: 0, returning: 0 };
        customersByDate.set(date, {
          ...current,
          new: current.new + 1,
        });
      });

      const customersData = Array.from(customersByDate.entries())
        .map(([date, { new: newCust, returning }]) => ({
          date,
          newCustomers: newCust,
          returningCustomers: returning,
        }))
        .sort((a: unknown, b: unknown) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate retention rate (simplified: customers with >1 booking / total customers)
      const customersWithBookings = new Set(currentBookings?.map((b) => b.customerId) || []);
      const { data: repeatCustomers } = await supabase
        .from('bookings')
        .select('customerId')
        .in('customerId', Array.from(customersWithBookings))
        .returns<Array<{ customerId: string }>>();

      const customerBookingCounts = new Map<string, number>();
      repeatCustomers?.forEach((b) => {
        const count = customerBookingCounts.get(b.customerId) || 0;
        customerBookingCounts.set(b.customerId, count + 1);
      });

      const returningCount = Array.from(customerBookingCounts.values()).filter(
        (count) => count > 1
      ).length;
      const retentionRate =
        customersWithBookings.size > 0 ? (returningCount / customersWithBookings.size) * 100 : 0;

      // Calculate average lifetime value
      const averageLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      const analyticsData: AnalyticsData = {
        revenue: {
          data:
            revenueData.length > 0
              ? revenueData
              : [{ date: now.toISOString().split('T')[0], revenue: 0, bookings: 0 }],
          totalRevenue,
          growthPercentage,
          averageDailyRevenue,
        },
        bookings: {
          data:
            bookingsData.length > 0
              ? bookingsData
              : [
                  {
                    date: now.toISOString().split('T')[0],
                    bookings: 0,
                    completed: 0,
                    cancelled: 0,
                  },
                ],
          totalBookings,
          completionRate,
          cancellationRate,
        },
        equipment: {
          data: equipmentWithStats,
          averageUtilization,
          topPerformer,
        },
        customers: {
          data:
            customersData.length > 0
              ? customersData
              : [{ date: now.toISOString().split('T')[0], newCustomers: 0, returningCustomers: 0 }],
          totalCustomers,
          newCustomers,
          retentionRate,
          averageLifetimeValue,
        },
      };

      setAnalyticsData(analyticsData);
    } catch (err) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch analytics data',
          {
            component: 'app-page',
            action: 'analytics_fetch_error',
            metadata: { error: err instanceof Error ? err.message : 'Unknown error' },
          },
          err instanceof Error ? err : undefined
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const renderRevenueChart = () => {
    if (!analyticsData) return null;

    const maxRevenue = Math.max(...analyticsData.revenue.data.map((d) => d.revenue));

    return (
      <div className="h-64">
        <div className="flex h-full items-end justify-between space-x-2">
          {analyticsData.revenue.data.map((item, _index) => {
            const height = (item.revenue / maxRevenue) * 100;
            return (
              <div key={item.date} className="flex flex-1 flex-col items-center">
                <div className="flex w-full flex-col items-center">
                  <div
                    className="relative w-full rounded-t-lg bg-gray-200"
                    style={{ height: '200px' }}
                  >
                    <div
                      className="bg-kubota-orange w-full rounded-t-lg transition-all duration-500 ease-in-out hover:bg-orange-600"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-xs font-medium text-gray-900">
                    ${(item.revenue / 1000).toFixed(1)}k
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBookingsChart = () => {
    if (!analyticsData) return null;

    const maxBookings = Math.max(...analyticsData.bookings.data.map((d) => d.bookings));

    return (
      <div className="h-64">
        <div className="flex h-full items-end justify-between space-x-2">
          {analyticsData.bookings.data.map((item, _index) => {
            const height = (item.bookings / maxBookings) * 100;
            const completedHeight = (item.completed / maxBookings) * 100;
            return (
              <div key={item.date} className="flex flex-1 flex-col items-center">
                <div className="flex w-full flex-col items-center">
                  <div
                    className="relative w-full rounded-t-lg bg-gray-200"
                    style={{ height: '200px' }}
                  >
                    <div
                      className="w-full rounded-t-lg bg-green-500 transition-all duration-500 ease-in-out"
                      style={{ height: `${completedHeight}%` }}
                    />
                    <div
                      className="w-full rounded-t-lg bg-blue-500 transition-all duration-500 ease-in-out"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-xs font-medium text-gray-900">{item.bookings}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEquipmentChart = () => {
    if (!analyticsData) return null;

    return (
      <div className="space-y-4">
        {analyticsData.equipment.data.map((item) => (
          <div
            key={item.equipmentId}
            className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
          >
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{item.equipmentName}</span>
                <span className="text-sm text-gray-600">{item.utilizationRate}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="bg-kubota-orange h-2 rounded-full transition-all duration-500"
                  style={{ width: `${item.utilizationRate}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Revenue: ${item.revenue.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCustomersChart = () => {
    if (!analyticsData) return null;

    const maxCustomers = Math.max(
      ...analyticsData.customers.data.map((d) => d.newCustomers + d.returningCustomers)
    );

    return (
      <div className="h-64">
        <div className="flex h-full items-end justify-between space-x-2">
          {analyticsData.customers.data.map((item, _index) => {
            const totalCustomers = item.newCustomers + item.returningCustomers;
            const height = (totalCustomers / maxCustomers) * 100;
            const newHeight = (item.newCustomers / maxCustomers) * 100;
            return (
              <div key={item.date} className="flex flex-1 flex-col items-center">
                <div className="flex w-full flex-col items-center">
                  <div
                    className="relative w-full rounded-t-lg bg-gray-200"
                    style={{ height: '200px' }}
                  >
                    <div
                      className="w-full rounded-t-lg bg-purple-500 transition-all duration-500 ease-in-out"
                      style={{ height: `${newHeight}%` }}
                    />
                    <div
                      className="w-full rounded-t-lg bg-blue-500 transition-all duration-500 ease-in-out"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-xs font-medium text-gray-900">{totalCustomers}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive analytics and insights for your rental business performance.
          </p>
        </div>
        <div className="flex space-x-2">
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value as 'week' | 'month' | 'quarter' | 'year');
              fetchAnalyticsData();
            }}
            className="focus:ring-kubota-orange rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={async () => {
              try {
                const response = await fetchWithAuth(
                  `/api/admin/analytics/export?dateRange=${dateRange}`
                );
                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `analytics-export-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } else {
                  throw new Error('Export failed');
                }
              } catch (err) {
                alert('Failed to export analytics');
                logger.error(
                  'Analytics export failed',
                  {},
                  err instanceof Error ? err : new Error(String(err))
                );
              }
            }}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${analyticsData.revenue.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-green-600">
                  <TrendingUp className="mr-1 inline h-4 w-4" />+
                  {analyticsData.revenue.growthPercentage}%
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData.bookings.totalBookings}
                </p>
                <p className="text-sm text-gray-600">
                  {analyticsData.bookings.completionRate}% completion rate
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wrench className="text-kubota-orange h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Utilization</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData.equipment.averageUtilization.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  Top: {analyticsData.equipment.topPerformer.equipmentName}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData.customers.totalCustomers}
                </p>
                <p className="text-sm text-gray-600">
                  {analyticsData.customers.retentionRate}% retention
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Navigation */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="flex space-x-1">
          {[
            { id: 'revenue', name: 'Revenue', icon: DollarSign },
            { id: 'bookings', name: 'Bookings', icon: Calendar },
            { id: 'equipment', name: 'Equipment', icon: Wrench },
            { id: 'customers', name: 'Customers', icon: Users },
          ].map((chart) => (
            <button
              key={chart.id}
              onClick={() =>
                setSelectedChart(chart.id as 'revenue' | 'bookings' | 'equipment' | 'customers')
              }
              className={`flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                selectedChart === chart.id
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                  : 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
              }`}
            >
              <chart.icon className="h-4 w-4" />
              <span>{chart.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      {analyticsData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Main Chart */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              {selectedChart === 'revenue' && 'Revenue Trend'}
              {selectedChart === 'bookings' && 'Booking Volume'}
              {selectedChart === 'equipment' && 'Equipment Utilization'}
              {selectedChart === 'customers' && 'Customer Acquisition'}
            </h3>

            {selectedChart === 'revenue' && renderRevenueChart()}
            {selectedChart === 'bookings' && renderBookingsChart()}
            {selectedChart === 'equipment' && renderEquipmentChart()}
            {selectedChart === 'customers' && renderCustomersChart()}
          </div>

          {/* Secondary Metrics */}
          <div className="space-y-6">
            {selectedChart === 'revenue' && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-medium text-gray-900">Revenue Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Daily Revenue</span>
                    <span className="text-sm font-medium">
                      ${analyticsData.revenue.averageDailyRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Growth Rate</span>
                    <span className="text-sm font-medium text-green-600">
                      +{analyticsData.revenue.growthPercentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Best Day</span>
                    <span className="text-sm font-medium">
                      {new Date(
                        Math.max(
                          ...analyticsData.revenue.data.map((d) => new Date(d.date).getTime())
                        )
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedChart === 'bookings' && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-medium text-gray-900">Booking Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-medium text-green-600">
                      {analyticsData.bookings.completionRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cancellation Rate</span>
                    <span className="text-sm font-medium text-red-600">
                      {analyticsData.bookings.cancellationRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average per Day</span>
                    <span className="text-sm font-medium">
                      {(
                        analyticsData.bookings.totalBookings / analyticsData.bookings.data.length
                      ).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedChart === 'equipment' && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-medium text-gray-900">Equipment Performance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Top Performer</span>
                    <span className="text-sm font-medium">
                      {analyticsData.equipment.topPerformer.equipmentName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Utilization Rate</span>
                    <span className="text-sm font-medium text-green-600">
                      {analyticsData.equipment.topPerformer.utilizationRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Equipment</span>
                    <span className="text-sm font-medium">
                      {analyticsData.equipment.data.length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedChart === 'customers' && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-medium text-gray-900">Customer Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New This Period</span>
                    <span className="text-sm font-medium">
                      {analyticsData.customers.newCustomers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Retention Rate</span>
                    <span className="text-sm font-medium text-green-600">
                      {analyticsData.customers.retentionRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Lifetime Value</span>
                    <span className="text-sm font-medium">
                      ${analyticsData.customers.averageLifetimeValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetchWithAuth('/api/admin/analytics/generate-report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          reportType: 'full',
                          dateRange: '30d',
                          format: 'pdf',
                        }),
                      });
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `analytics-report-${Date.now()}.html`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } else {
                        alert('Failed to generate report');
                      }
                    } catch {
                      alert('Error generating report');
                    }
                  }}
                  className="inline-flex w-full items-center justify-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Generate Report
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetchWithAuth(
                        '/api/admin/analytics/export-data?type=bookings&format=csv&dateRange=30d'
                      );
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `analytics-export-${Date.now()}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } else {
                        alert('Failed to export data');
                      }
                    } catch {
                      alert('Error exporting data');
                    }
                  }}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Export Data
                </button>
                <button
                  onClick={async () => {
                    const frequency = prompt('Enter frequency (daily, weekly, monthly):', 'weekly');
                    if (!frequency) return;

                    const email = prompt('Enter recipient email:', user?.email || '');
                    if (!email) return;

                    try {
                      const response = await fetchWithAuth('/api/admin/analytics/schedule-report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          reportType: 'full',
                          frequency: frequency,
                          recipients: [email],
                          dateRange: '30d',
                        }),
                      });
                      if (response.ok) {
                        const data = await response.json();
                        alert(`Report scheduled successfully! ${data.message}`);
                      } else {
                        const error = await response.json();
                        alert(`Failed to schedule report: ${error.error}`);
                      }
                    } catch {
                      alert('Error scheduling report');
                    }
                  }}
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                >
                  Schedule Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
