'use client';

import { Calendar, DollarSign, Download, TrendingUp, Users, Wrench } from 'lucide-react';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { DashboardChart } from '@/components/admin/DashboardChart';
import BookingTrendsChart from '@/components/admin/BookingTrendsChart';
import CustomerChart from '@/components/admin/CustomerChart';
import { RevenueChart } from '@/components/admin/RevenueChart';

import { AnalyticsData, DateRange } from '@/lib/admin/analytics-server';
import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import type { RevenueChartPoint, BookingChartPoint } from '@/types/dashboard';

interface AnalyticsDashboardClientProps {
  initialData: AnalyticsData | null;
  initialError: string | null;
  initialDateRange?: DateRange;
}

/**
 * Converts a Date to YYYY-MM-DD format using local timezone
 * This prevents date shifts when converting to UTC
 */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Resolves date range bounds (start and end dates) for the given range type
 */
function resolveDateRangeBounds(range: DateRange): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (range) {
    case 'week':
      // Week: 7 days total (today + 6 days back) - EXACT match to dashboard
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

/**
 * Fills missing dates in revenue chart data with zero values
 * Ensures all dates in the selected range are present in the chart
 */
function fillMissingRevenueDates(
  data: RevenueChartPoint[],
  startDate: Date,
  endDate: Date
): RevenueChartPoint[] {
  const dataMap = new Map<string, RevenueChartPoint>();
  data.forEach((point) => {
    dataMap.set(point.date, point);
  });

  const filled: RevenueChartPoint[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const endDateStr = toDateString(end);
  const startDateStr = toDateString(startDate);

  while (true) {
    const dateKey = toDateString(current);

    const existing = dataMap.get(dateKey);
    if (existing) {
      filled.push(existing);
    } else {
      filled.push({
        date: dateKey,
        grossRevenue: 0,
        refundedAmount: 0,
        netRevenue: 0,
        paymentsCount: 0,
      });
    }

    if (dateKey >= endDateStr) {
      break;
    }

    current.setDate(current.getDate() + 1);
  }

  return filled;
}

/**
 * Fills missing dates in booking chart data with zero values
 * Ensures all dates in the selected range are present in the chart
 */
function fillMissingBookingDates(
  data: BookingChartPoint[],
  startDate: Date,
  endDate: Date
): BookingChartPoint[] {
  const dataMap = new Map<string, BookingChartPoint>();
  data.forEach((point) => {
    dataMap.set(point.date, point);
  });

  const filled: BookingChartPoint[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const endDateStr = toDateString(end);
  const startDateStr = toDateString(startDate);

  while (true) {
    const dateKey = toDateString(current);

    const existing = dataMap.get(dateKey);
    if (existing) {
      filled.push(existing);
    } else {
      filled.push({
        date: dateKey,
        total: 0,
        completed: 0,
        cancelled: 0,
        active: 0,
      });
    }

    if (dateKey >= endDateStr) {
      break;
    }

    current.setDate(current.getDate() + 1);
  }

  return filled;
}

export default function AnalyticsDashboardClient({
  initialData,
  initialError,
  initialDateRange = 'month',
}: AnalyticsDashboardClientProps) {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(initialData);
  const [loading, setLoading] = useState(false); // No initial loading as data is pre-fetched
  // Store chart-formatted data for Recharts components
  const [revenueChartData, setRevenueChartData] = useState<RevenueChartPoint[]>([]);
  const [bookingChartData, setBookingChartData] = useState<BookingChartPoint[]>([]);
  const [customerChartData, setCustomerChartData] = useState<Array<{ date: string; newCustomers: number; returningCustomers: number; total: number }>>([]);
  // Ensure error is always a string, not an object
  const normalizeError = (err: string | null): string | null => {
    if (!err) return null;
    if (typeof err === 'string') return err;
    if (typeof err === 'object') {
      const errorObj = err as any;
      return errorObj.message || errorObj.error || errorObj.toString() || 'Unknown error';
    }
    return String(err);
  };
  const [error, setError] = useState<string | null>(normalizeError(initialError));
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [selectedChart, setSelectedChart] = useState<
    'revenue' | 'bookings' | 'equipment' | 'customers'
  >('revenue');

  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAnalyticsData = useCallback(
    async (range?: DateRange, retryAttempt = 0) => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        setLoading(true);
        setError(null);

        // Use provided range or current state
        const activeRange = range || dateRange;

        // Call API route - EXACT pattern from dashboard
        const apiUrl = `/api/admin/analytics/overview?range=${activeRange}`;

        const response = await fetchWithAuth(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          ...(abortController ? { signal: abortController.signal } : {}),
        });

        if (!response.ok) {
          const message = await response.text();
          // Retry on network errors or 5xx errors
          if (retryAttempt < MAX_RETRIES && (response.status >= 500 || response.status === 0)) {
            const delay = Math.min(1000 * Math.pow(2, retryAttempt), 10000); // Exponential backoff, max 10s
            setTimeout(() => {
              fetchAnalyticsData(activeRange, retryAttempt + 1);
            }, delay);
            return;
          }
          throw new Error(message || 'Failed to fetch analytics data');
        }

        const data = (await response.json()) as AnalyticsData;

        // Calculate date range bounds for filling missing dates
        const { start, end } = resolveDateRangeBounds(activeRange);

        // Transform revenue data to chart format
        const transformedRevenueData: RevenueChartPoint[] = data.revenue.data.map((point) => ({
          date: point.date,
          grossRevenue: point.revenue,
          refundedAmount: 0, // Not tracked separately in AnalyticsData
          netRevenue: point.revenue,
          paymentsCount: 0, // Not tracked in AnalyticsData
        }));
        setRevenueChartData(fillMissingRevenueDates(transformedRevenueData, start, end));

        // Transform booking data to chart format
        const transformedBookingData: BookingChartPoint[] = data.bookings.data.map((point) => ({
          date: point.date,
          total: point.bookings,
          completed: point.completed,
          cancelled: point.cancelled,
          active: 0, // Not tracked in AnalyticsData
        }));
        setBookingChartData(fillMissingBookingDates(transformedBookingData, start, end));

        // Transform customer data to chart format and fill missing dates
        const transformedCustomerData = data.customers.data.map((point) => ({
          date: point.date,
          newCustomers: point.newCustomers || 0,
          returningCustomers: point.returningCustomers || 0,
          total: (point.newCustomers || 0) + (point.returningCustomers || 0),
        }));

        // Fill missing customer dates
        const filledCustomerData: Array<{ date: string; newCustomers: number; returningCustomers: number; total: number }> = [];
        const customerDataMap = new Map(transformedCustomerData.map(item => [item.date, item]));
        const fillCurrent = new Date(start);
        fillCurrent.setHours(0, 0, 0, 0);
        const fillEnd = new Date(end);
        fillEnd.setHours(23, 59, 59, 999);
        const endDateStr = toDateString(fillEnd);

        while (true) {
          const dateKey = toDateString(fillCurrent);
          const existing = customerDataMap.get(dateKey);
          if (existing) {
            filledCustomerData.push(existing);
          } else {
            filledCustomerData.push({
              date: dateKey,
              newCustomers: 0,
              returningCustomers: 0,
              total: 0,
            });
          }

          if (dateKey >= endDateStr) break;
          fillCurrent.setDate(fillCurrent.getDate() + 1);
        }

        setCustomerChartData(filledCustomerData);

        // Set analytics data
        setAnalyticsData(data);
        setRetryCount(0); // Reset retry count on success
        abortControllerRef.current = null;
      } catch (err) {
        // Don't retry if request was aborted
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';

        // Retry on network errors
        if (
          retryAttempt < MAX_RETRIES &&
          (err instanceof TypeError || (err as Error).message.includes('fetch'))
        ) {
          const delay = Math.min(1000 * Math.pow(2, retryAttempt), 10000);
          setRetryCount(retryAttempt + 1);
          setTimeout(() => {
            fetchAnalyticsData(range || dateRange, retryAttempt + 1);
          }, delay);
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          logger.error(
            'Failed to fetch analytics data',
            {
              component: 'analytics-client',
              action: 'fetch_error',
              metadata: { error: errorMessage, retryAttempt },
            },
            err instanceof Error ? err : undefined
          );
        }
        setError(errorMessage);
        setRetryCount(0);
        abortControllerRef.current = null;
      } finally {
        setLoading(false);
      }
    },
    [dateRange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Transform chart data from analyticsData whenever it changes
  // This handles both initialData and data fetched via fetchAnalyticsData
  useEffect(() => {
    if (!analyticsData) {
      // Clear chart data if analyticsData is cleared
      setRevenueChartData([]);
      setBookingChartData([]);
      setCustomerChartData([]);
      return;
    }

    // Transform analyticsData to chart format using current dateRange
    const { start, end } = resolveDateRangeBounds(dateRange);

    // Transform revenue data
    const transformedRevenueData: RevenueChartPoint[] = analyticsData.revenue.data.map((point) => ({
      date: point.date,
      grossRevenue: point.revenue,
      refundedAmount: 0, // Not tracked separately in AnalyticsData
      netRevenue: point.revenue,
      paymentsCount: 0, // Not tracked in AnalyticsData
    }));
    setRevenueChartData(fillMissingRevenueDates(transformedRevenueData, start, end));

    // Transform booking data
    const transformedBookingData: BookingChartPoint[] = analyticsData.bookings.data.map((point) => ({
      date: point.date,
      total: point.bookings,
      completed: point.completed,
      cancelled: point.cancelled,
      active: 0, // Not tracked in AnalyticsData
    }));
    setBookingChartData(fillMissingBookingDates(transformedBookingData, start, end));

    // Transform customer data - also fill missing dates
    const transformedCustomerData = analyticsData.customers.data.map((point) => ({
      date: point.date,
      newCustomers: point.newCustomers || 0,
      returningCustomers: point.returningCustomers || 0,
      total: (point.newCustomers || 0) + (point.returningCustomers || 0),
    }));

    // Fill missing customer dates
    const filledCustomerData: Array<{ date: string; newCustomers: number; returningCustomers: number; total: number }> = [];
    const customerDataMap = new Map(transformedCustomerData.map(item => [item.date, item]));
    const fillCurrent = new Date(start);
    fillCurrent.setHours(0, 0, 0, 0);
    const fillEnd = new Date(end);
    fillEnd.setHours(23, 59, 59, 999);
    const endDateStr = toDateString(fillEnd);

    while (true) {
      const dateKey = toDateString(fillCurrent);
      const existing = customerDataMap.get(dateKey);
      if (existing) {
        filledCustomerData.push(existing);
      } else {
        filledCustomerData.push({
          date: dateKey,
          newCustomers: 0,
          returningCustomers: 0,
          total: 0,
        });
      }

      if (dateKey >= endDateStr) break;
      fillCurrent.setDate(fillCurrent.getDate() + 1);
    }

    setCustomerChartData(filledCustomerData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsData, dateRange]); // Run when analyticsData or dateRange changes

  // Fetch data on mount and when dateRange changes
  useEffect(() => {
    fetchAnalyticsData(dateRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, fetchAnalyticsData]);

  const renderEquipmentChart = () => {
    if (!analyticsData) return null;

    return (
      <div className="max-h-[500px] space-y-4 overflow-y-auto">
        {analyticsData.equipment.data.map((item) => {
          const utilizationRate = Number(item.utilizationRate) || 0;
          const revenue = Number(item.revenue) || 0;
          return (
            <div
              key={item.equipmentId}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
            >
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{item.equipmentName}</span>
                  <span className="text-sm text-gray-600">{utilizationRate}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="bg-kubota-orange h-2 rounded-full transition-all duration-500"
                    style={{ width: `${utilizationRate}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Revenue: ${revenue.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
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
              const newRange = e.target.value as 'week' | 'month' | 'quarter' | 'year';
              // Only update state - useEffect will handle the fetch to avoid race conditions
              setDateRange(newRange);
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
          {/* Revenue Chart */}
          {selectedChart === 'revenue' && (
            <DashboardChart
              title="Revenue Trend"
              description="Net revenue after refunds for the selected period."
              status={loading ? 'loading' : error ? 'error' : !analyticsData || !analyticsData.revenue || !analyticsData.revenue.data || analyticsData.revenue.data.length === 0 ? 'empty' : 'ready'}
              errorMessage={error}
              emptyMessage="No revenue recorded during this period."
              updatedAt={analyticsData ? new Date() : null}
            >
              {analyticsData && analyticsData.revenue && analyticsData.revenue.data && analyticsData.revenue.data.length > 0 && (
                <RevenueChart
                  data={revenueChartData.length > 0 ? revenueChartData : (() => {
                    const { start, end } = resolveDateRangeBounds(dateRange);
                    const transformed = analyticsData.revenue.data.map((point) => ({
                      date: point.date,
                      grossRevenue: point.revenue,
                      refundedAmount: 0,
                      netRevenue: point.revenue,
                      paymentsCount: 0,
                    }));
                    return fillMissingRevenueDates(transformed, start, end);
                  })()}
                  summary={{
                    totalRevenue: analyticsData.revenue.totalRevenue,
                    growthPercentage: analyticsData.revenue.growthPercentage,
                    averageDailyRevenue: analyticsData.revenue.averageDailyRevenue,
                  }}
                  compact={false}
                />
              )}
            </DashboardChart>
          )}

          {/* Booking Chart */}
          {selectedChart === 'bookings' && (
            <DashboardChart
              title="Booking Trends"
              description="Daily bookings broken down by completed, active, and cancelled."
              status={loading ? 'loading' : error ? 'error' : !analyticsData || !analyticsData.bookings || !analyticsData.bookings.data || analyticsData.bookings.data.length === 0 ? 'empty' : 'ready'}
              errorMessage={error}
              emptyMessage="No booking activity for the selected period."
              updatedAt={analyticsData ? new Date() : null}
            >
              {analyticsData && analyticsData.bookings && analyticsData.bookings.data && analyticsData.bookings.data.length > 0 && (
                <BookingTrendsChart
                  data={bookingChartData.length > 0 ? bookingChartData : (() => {
                    const { start, end } = resolveDateRangeBounds(dateRange);
                    const transformed = analyticsData.bookings.data.map((point) => ({
                      date: point.date,
                      total: point.bookings,
                      completed: point.completed,
                      cancelled: point.cancelled,
                      active: 0,
                    }));
                    return fillMissingBookingDates(transformed, start, end);
                  })()}
                  summary={{
                    totalBookings: analyticsData.bookings.totalBookings,
                    completionRate: analyticsData.bookings.completionRate,
                    cancellationRate: analyticsData.bookings.cancellationRate,
                    growthPercentage: null, // Not calculated currently
                  }}
                  compact={false}
                />
              )}
            </DashboardChart>
          )}

          {/* Equipment Chart - Keep custom for now */}
          {selectedChart === 'equipment' && (
            <DashboardChart
              title="Equipment Utilization"
              description="Equipment utilization rates and revenue by equipment."
              status={loading ? 'loading' : error ? 'error' : !analyticsData || !analyticsData.equipment.data || analyticsData.equipment.data.length === 0 ? 'empty' : 'ready'}
              errorMessage={error}
              emptyMessage="No equipment data available for the selected period."
              updatedAt={analyticsData ? new Date() : null}
            >
              {analyticsData && renderEquipmentChart()}
            </DashboardChart>
          )}

          {/* Customers Chart */}
          {selectedChart === 'customers' && (
            <DashboardChart
              title="Customer Acquisition"
              description="Daily customer acquisition and retention metrics."
              status={loading ? 'loading' : error ? 'error' : !analyticsData || !analyticsData.customers || !analyticsData.customers.data || analyticsData.customers.data.length === 0 ? 'empty' : 'ready'}
              errorMessage={error}
              emptyMessage="No customer data available for the selected period."
              updatedAt={analyticsData ? new Date() : null}
            >
              {analyticsData && analyticsData.customers && analyticsData.customers.data && analyticsData.customers.data.length > 0 && (
                <CustomerChart
                  data={customerChartData.length > 0 ? customerChartData : analyticsData.customers.data.map((point) => ({
                    date: point.date,
                    newCustomers: point.newCustomers || 0,
                    returningCustomers: point.returningCustomers || 0,
                    total: (point.newCustomers || 0) + (point.returningCustomers || 0),
                  }))}
                  summary={{
                    totalCustomers: analyticsData.customers.totalCustomers,
                    newCustomers: analyticsData.customers.newCustomers,
                    retentionRate: analyticsData.customers.retentionRate,
                  }}
                  compact={false}
                />
              )}
            </DashboardChart>
          )}

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
