'use client';

import {
  Calendar,
  Calendar as CalendarIcon,
  DollarSign,
  RefreshCw,
  Settings,
  Users,
} from 'lucide-react';

import { useCallback, useEffect, useMemo, useState } from 'react';

import BookingTrendsChart from '@/components/admin/BookingTrendsChart';
import { DashboardChart } from '@/components/admin/DashboardChart';
import { EquipmentStatus } from '@/components/admin/EquipmentStatus';
import EquipmentUtilizationChart from '@/components/admin/EquipmentUtilizationChart';
import { RecentBookings } from '@/components/admin/RecentBookings';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { StatsCard } from '@/components/admin/StatsCard';

import { logger } from '@/lib/logger';

import type {
  DashboardChartsPayload,
  DashboardOverviewResponse,
  DashboardSummary,
  DateRangeKey,
} from '@/types/dashboard';

const comparisonLabels: Record<DateRangeKey, string> = {
  today: 'vs yesterday',
  week: 'vs last week',
  month: 'vs previous month',
  quarter: 'vs previous quarter',
  year: 'vs previous year',
  custom: 'vs previous period',
};

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function resolveRangeBounds(range: DateRangeKey) {
  const end = new Date();
  const start = new Date(end);

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 6);
      break;
    case 'month':
    case 'custom':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      break;
  }

  return { start, end };
}

function calculateAverageDailyRevenue(totalRevenue: number, range: DateRangeKey) {
  const { start, end } = resolveRangeBounds(range);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY));
  return totalRevenue / days;
}

type LegacyCharts = {
  revenue?: Array<{
    bucket_date: string;
    gross_revenue: number | string | null;
    refunded_amount: number | string | null;
    payments_count: number | string | null;
  }>;
  bookings?: Array<{
    bucket_date: string;
    total_bookings: number | string | null;
    completed_bookings: number | string | null;
    cancelled_bookings: number | string | null;
    active_bookings: number | string | null;
  }>;
  utilization?: Array<{
    snapshot_date: string;
    equipment_id: string;
    utilization_pct: number | string | null;
    hours_used: number | string | null;
    revenue_generated: number | string | null;
  }>;
};

function normalizeChartsPayload(payload: DashboardOverviewResponse): DashboardChartsPayload | null {
  if (payload.chartsV2) {
    return payload.chartsV2;
  }

  const legacy = payload.charts as LegacyCharts | undefined;
  if (!legacy) {
    return null;
  }

  const revenueSeries = (legacy.revenue ?? []).map(point => {
    const grossRevenue = Number(point.gross_revenue ?? 0);
    const refundedAmount = Number(point.refunded_amount ?? 0);

    return {
      date: point.bucket_date,
      grossRevenue,
      refundedAmount,
      netRevenue: grossRevenue - refundedAmount,
      paymentsCount: Number(point.payments_count ?? 0),
    };
  });

  const revenueTotals = revenueSeries.reduce(
    (acc, point) => {
      acc.grossRevenue += point.grossRevenue;
      acc.refundedAmount += point.refundedAmount;
      acc.netRevenue += point.netRevenue;
      return acc;
    },
    { grossRevenue: 0, refundedAmount: 0, netRevenue: 0 }
  );

  const bookingSeries = (legacy.bookings ?? []).map(point => ({
    date: point.bucket_date,
    total: Number(point.total_bookings ?? 0),
    completed: Number(point.completed_bookings ?? 0),
    cancelled: Number(point.cancelled_bookings ?? 0),
    active: Number(point.active_bookings ?? 0),
  }));

  const bookingTotals = bookingSeries.reduce(
    (acc, point) => {
      acc.total += point.total;
      acc.completed += point.completed;
      acc.cancelled += point.cancelled;
      return acc;
    },
    { total: 0, completed: 0, cancelled: 0 }
  );

  const bookingConversion = {
    completionRate: bookingTotals.total ? (bookingTotals.completed / bookingTotals.total) * 100 : 0,
    cancellationRate: bookingTotals.total ? (bookingTotals.cancelled / bookingTotals.total) * 100 : 0,
  };

  const utilizationRecords = (legacy.utilization ?? []).map(record => {
    const utilizationPct = Number(record.utilization_pct ?? 0);
    const revenue = Number(record.revenue_generated ?? 0);

    return {
      equipmentId: record.equipment_id,
      label: `Equipment ${record.equipment_id.slice(0, 8)}`,
      status: 'AVAILABLE',
      utilizationPct,
      rentedDays: Number(record.hours_used ?? 0),
      revenue,
    };
  });

  const utilizationSummary = utilizationRecords.length
    ? {
        averageUtilization:
          utilizationRecords.reduce((sum, record) => sum + record.utilizationPct, 0) /
          utilizationRecords.length,
        activeOrMaintenanceCount: utilizationRecords.length,
        lifetimeRevenue: utilizationRecords.reduce((sum, record) => sum + record.revenue, 0),
      }
    : {
        averageUtilization: 0,
        activeOrMaintenanceCount: 0,
        lifetimeRevenue: 0,
      };

  return {
    revenue: {
      series: revenueSeries,
      comparison: [],
      totals: revenueTotals,
    },
    bookings: {
      series: bookingSeries,
      totals: bookingTotals,
      conversion: bookingConversion,
    },
    utilization: {
      summary: utilizationSummary,
      equipment: utilizationRecords,
    },
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardSummary>({
    totalBookings: 0,
    totalRevenue: 0,
    activeEquipment: 0,
    totalCustomers: 0,
    bookingsGrowth: null,
    revenueGrowth: null,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    averageBookingValue: 0,
    equipmentUtilization: 0,
    snapshotDate: null,
    lastGeneratedAt: null,
  });
  const [charts, setCharts] = useState<DashboardChartsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeKey>('month');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/dashboard/overview?range=${dateRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to fetch dashboard overview');
      }

      const payload = (await response.json()) as DashboardOverviewResponse;
      const summary = payload.summary;

      const nextStats: DashboardSummary = {
        totalBookings: Math.round(Number(summary.totalBookings ?? 0)),
        totalRevenue: Number(summary.totalRevenue ?? 0),
        activeEquipment: Math.round(Number(summary.activeEquipment ?? 0)),
        totalCustomers: Math.round(Number(summary.totalCustomers ?? 0)),
        bookingsGrowth:
          summary.bookingsGrowth === null || summary.bookingsGrowth === undefined
            ? null
            : Number(summary.bookingsGrowth),
        revenueGrowth:
          summary.revenueGrowth === null || summary.revenueGrowth === undefined
            ? null
            : Number(summary.revenueGrowth),
        activeBookings: Math.round(Number(summary.activeBookings ?? 0)),
        completedBookings: Math.round(Number(summary.completedBookings ?? 0)),
        cancelledBookings: Math.round(Number(summary.cancelledBookings ?? 0)),
        averageBookingValue: Number(summary.averageBookingValue ?? 0),
        equipmentUtilization: Number(summary.equipmentUtilization ?? 0),
        snapshotDate: summary.snapshotDate ?? null,
        lastGeneratedAt: summary.lastGeneratedAt ?? null,
      };

      setStats(nextStats);

      const normalizedCharts = normalizeChartsPayload(payload);
      setCharts(normalizedCharts);

      const updatedAtSource =
        payload.metadata?.generatedAt ?? summary.lastGeneratedAt ?? undefined;
      const updatedAt = updatedAtSource ? new Date(updatedAtSource) : new Date();
      setLastUpdated(Number.isNaN(updatedAt.getTime()) ? new Date() : updatedAt);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch dashboard stats:',
          {
            component: 'app-page',
            action: 'error',
          },
          err instanceof Error ? err : new Error(String(err))
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchStats();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, loading]);

  const handleRefresh = () => {
    fetchStats();
  };

  const handleDateRangeChange = (newDateRange: DateRangeKey) => {
    setDateRange(newDateRange);
  };

  const comparisonLabel = comparisonLabels[dateRange] ?? comparisonLabels.custom;

  const revenueSeries = charts?.revenue.series ?? [];
  const revenueComparisonSeries = charts?.revenue.comparison ?? [];
  const revenueNetTotal = charts?.revenue.totals.netRevenue ?? stats.totalRevenue;

  const revenueChartSummary = useMemo(
    () => ({
      totalRevenue: revenueNetTotal,
      growthPercentage: stats.revenueGrowth,
      averageDailyRevenue: calculateAverageDailyRevenue(revenueNetTotal, dateRange),
    }),
    [revenueNetTotal, stats.revenueGrowth, dateRange]
  );

  const bookingSeries = charts?.bookings.series ?? [];
  const bookingTotals = charts?.bookings.totals;
  const bookingConversion = charts?.bookings.conversion;

  const bookingTrendSummary = useMemo(() => {
    const totalBookings = bookingTotals?.total ?? stats.totalBookings;
    const completedBookings = bookingTotals?.completed ?? stats.completedBookings;
    const cancelledBookings = bookingTotals?.cancelled ?? stats.cancelledBookings;

    const completionRate =
      bookingConversion?.completionRate ??
      (totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0);
    const cancellationRate =
      bookingConversion?.cancellationRate ??
      (totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0);

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      completionRate,
      cancellationRate,
      growthPercentage: stats.bookingsGrowth,
    };
  }, [
    bookingTotals?.total,
    bookingTotals?.completed,
    bookingTotals?.cancelled,
    bookingConversion?.completionRate,
    bookingConversion?.cancellationRate,
    stats.totalBookings,
    stats.completedBookings,
    stats.cancelledBookings,
    stats.bookingsGrowth,
  ]);

  const utilizationSummary = charts?.utilization.summary;
  const utilizationRecords = charts?.utilization.equipment ?? [];

  type ChartStatus = 'loading' | 'error' | 'empty' | 'ready';

  const resolveStatus = (hasData: boolean): ChartStatus => {
    if (hasData) {
      return 'ready';
    }
    if (loading) {
      return 'loading';
    }
    if (error) {
      return 'error';
    }
    return 'empty';
  };

  const revenueStatus = resolveStatus(revenueSeries.length > 0);
  const bookingStatus = resolveStatus(bookingSeries.length > 0);
  const utilizationStatus = resolveStatus(utilizationRecords.length > 0);

  const totalRevenueDisplay = currencyFormatter.format(revenueNetTotal);
  const averageBookingValueDisplay = currencyFormatter.format(stats.averageBookingValue);
  const equipmentUtilizationDisplay = `${(
    utilizationSummary?.averageUtilization ?? stats.equipmentUtilization
  ).toFixed(1)}%`;

  const bookingsGrowthType =
    stats.bookingsGrowth === null
      ? 'neutral'
      : stats.bookingsGrowth > 0
        ? 'positive'
        : stats.bookingsGrowth < 0
          ? 'negative'
          : 'neutral';

  const revenueGrowthType =
    stats.revenueGrowth === null
      ? 'neutral'
      : stats.revenueGrowth > 0
        ? 'positive'
        : stats.revenueGrowth < 0
          ? 'negative'
          : 'neutral';

  if (loading && !lastUpdated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with your rental business.
          </p>
          {lastUpdated && (
            <p className="mt-1 text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* WebSocket connection indicator */}
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-500">Connected</span>
          </div>

          {/* Date range selector */}
          <select
            value={dateRange}
            onChange={(e) =>
              handleDateRangeChange(e.target.value as DateRangeKey)
            }
            className="focus:ring-kubota-orange rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={Calendar}
          growth={stats.bookingsGrowth}
          growthType={bookingsGrowthType}
          color="blue"
          comparisonLabel={comparisonLabel}
        />
        <StatsCard
          title="Total Revenue"
          value={totalRevenueDisplay}
          icon={DollarSign}
          growth={stats.revenueGrowth}
          growthType={revenueGrowthType}
          color="green"
          comparisonLabel={comparisonLabel}
        />
        <StatsCard
          title="Active Equipment"
          value={stats.activeEquipment}
          icon={Settings}
          growth={null}
          growthType="neutral"
          color="orange"
          comparisonLabel={comparisonLabel}
        />
        <StatsCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          growth={null}
          growthType="neutral"
          color="purple"
          comparisonLabel={comparisonLabel}
        />
      </div>

      {/* Additional stats row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Bookings"
          value={stats.activeBookings}
          icon={CalendarIcon}
          growth={null}
          growthType="neutral"
          color="blue"
          comparisonLabel={comparisonLabel}
        />
        <StatsCard
          title="Completed Bookings"
          value={stats.completedBookings}
          icon={Calendar}
          growth={null}
          growthType="neutral"
          color="green"
          comparisonLabel={comparisonLabel}
        />
        <StatsCard
          title="Avg Booking Value"
          value={averageBookingValueDisplay}
          icon={DollarSign}
          growth={null}
          growthType="neutral"
          color="orange"
          comparisonLabel={comparisonLabel}
        />
        <StatsCard
          title="Equipment Utilization"
          value={equipmentUtilizationDisplay}
          icon={Settings}
          growth={null}
          growthType="neutral"
          color="purple"
          comparisonLabel={comparisonLabel}
        />
      </div>

      {/* Charts and recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue chart */}
        <DashboardChart
          title="Revenue Trend"
          description="Net revenue after refunds for the selected period."
          status={revenueStatus}
          errorMessage={error}
          emptyMessage="No revenue recorded during this period."
          updatedAt={lastUpdated}
        >
          {revenueStatus === 'ready' && (
            <RevenueChart
              data={revenueSeries}
              comparison={revenueComparisonSeries}
              summary={revenueChartSummary}
            />
          )}
        </DashboardChart>

        {/* Equipment status */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Equipment Status</h3>
          <EquipmentStatus />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardChart
          title="Booking Trends"
          description="Daily bookings broken down by completed, active, and cancelled."
          status={bookingStatus}
          errorMessage={error}
          emptyMessage="No booking activity for the selected period."
          updatedAt={lastUpdated}
        >
          {bookingStatus === 'ready' && (
            <BookingTrendsChart data={bookingSeries} summary={bookingTrendSummary} />
          )}
        </DashboardChart>
        <DashboardChart
          title="Top Equipment Utilization"
          description="Utilization performance for your busiest equipment."
          status={utilizationStatus}
          errorMessage={error}
          emptyMessage="No utilization data available for the selected period."
          updatedAt={lastUpdated}
        >
          {utilizationStatus === 'ready' && utilizationSummary ? (
            <EquipmentUtilizationChart summary={utilizationSummary} records={utilizationRecords} />
          ) : null}
        </DashboardChart>
      </div>

      {/* Recent bookings */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Recent Bookings</h3>
        <RecentBookings />
      </div>
    </div>
  );
}
