'use client';

import type {
  BookingChartPoint,
  DashboardChartsPayload,
  DashboardOverviewResponse,
  DashboardSummary,
  DateRangeKey,
  RevenueChartPoint,
  RevenueComparisonPoint,
} from '@/types/dashboard';
import {
  Calendar,
  Calendar as CalendarIcon,
  DollarSign,
  Download,
  RefreshCw,
  Settings,
  Users,
} from 'lucide-react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AdvancedFilters, type DateRange } from '@/components/admin/AdvancedFilters';
import BookingTrendsChart from '@/components/admin/BookingTrendsChart';
import { BookingTrendsChartModal } from '@/components/admin/BookingTrendsChartModal';
import { DashboardAlerts } from '@/components/admin/DashboardAlerts';
import { DashboardChart } from '@/components/admin/DashboardChart';
import { EquipmentStatus } from '@/components/admin/EquipmentStatus';
import EquipmentUtilizationChart from '@/components/admin/EquipmentUtilizationChart';
import { RecentBookings } from '@/components/admin/RecentBookings';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { RevenueChartModal } from '@/components/admin/RevenueChartModal';
import { StatsCard } from '@/components/admin/StatsCard';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

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

/**
 * Converts a Date to YYYY-MM-DD format without timezone conversion
 * This prevents date shifts when converting to UTC (e.g., Nov 21 23:00 EST → Nov 22 04:00 UTC)
 * Uses local time components directly to preserve the intended date
 */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveRangeBounds(range: DateRangeKey) {
  const end = new Date();
  const start = new Date(end);

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
    case 'custom':
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
      break;
  }

  return { start, end };
}

/**
 * Fills missing dates in chart data with zero values
 * Ensures all dates in the selected range are present in the chart
 */
function fillMissingDates(
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

  // Ensure we include the end date by comparing date strings, not Date objects
  // This avoids timezone comparison issues
  const endDateStr = toDateString(end);

  // Loop through all dates from start to end (inclusive)
  // Use date string comparison to avoid timezone issues
  const startDateStr = toDateString(startDate);

  while (true) {
    const dateKey = toDateString(current);

    // Add the current date (either existing data or zero-filled)
    const existing = dataMap.get(dateKey);
    if (existing) {
      filled.push(existing);
    } else {
      // Fill missing date with zero values
      filled.push({
        date: dateKey,
        grossRevenue: 0,
        refundedAmount: 0,
        netRevenue: 0,
        paymentsCount: 0,
      });
    }

    // Check if we've reached the end date - if so, we're done
    if (dateKey >= endDateStr) {
      break;
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  return filled;
}

/**
 * Aligns comparison data dates with main series dates
 * Ensures comparison bars align with main bars in the chart
 *
 * Since previous period dates are different from current period dates,
 * we align by relative position (day 1 vs day 1, day 2 vs day 2, etc.)
 * rather than exact date matching.
 */
function alignComparisonDates(
  mainSeries: RevenueChartPoint[],
  comparisonSeries: RevenueComparisonPoint[]
): RevenueComparisonPoint[] {
  // Sort both series by date to ensure correct order
  const sortedMain = [...mainSeries].sort((a, b) => a.date.localeCompare(b.date));
  const sortedComparison = [...comparisonSeries].sort((a, b) => a.date.localeCompare(b.date));

  // Align by index/position: day 1 of current period vs day 1 of previous period
  // This handles cases where dates don't match exactly (e.g., different weeks)
  // If comparison series is shorter, we pad with zeros for remaining days
  // If comparison series is longer, we truncate to match main series length
  const aligned = sortedMain.map((mainPoint, index) => {
    const comparison = sortedComparison[index];
    return {
      date: mainPoint.date,
      netRevenue: comparison?.netRevenue ?? 0,
    };
  });

  // Log alignment details for debugging
  if (process.env.NODE_ENV === 'development' && sortedMain.length > 0) {
    const mainLength = sortedMain.length;
    const comparisonLength = sortedComparison.length;
    if (mainLength !== comparisonLength) {
      logger.debug('[alignComparisonDates] Length mismatch:', {
        mainLength,
        comparisonLength,
        difference: mainLength - comparisonLength,
        action: comparisonLength < mainLength ? 'padded with zeros' : 'truncated',
      });
    }
  }

  return aligned;
}

function calculateAverageDailyRevenue(totalRevenue: number, range: DateRangeKey) {
  const { start, end } = resolveRangeBounds(range);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY));
  return totalRevenue / days;
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

  // Ensure we include the end date by comparing date strings, not Date objects
  // This avoids timezone comparison issues
  const endDateStr = toDateString(end);

  // Loop through all dates from start to end (inclusive)
  // Use date string comparison to avoid timezone issues
  const startDateStr = toDateString(startDate);

  while (true) {
    const dateKey = toDateString(current);

    // Add the current date (either existing data or zero-filled)
    const existing = dataMap.get(dateKey);
    if (existing) {
      filled.push(existing);
    } else {
      // Fill missing date with zero values
      filled.push({
        date: dateKey,
        total: 0,
        completed: 0,
        cancelled: 0,
        active: 0,
      });
    }

    // Check if we've reached the end date - if so, we're done
    if (dateKey >= endDateStr) {
      break;
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  return filled;
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

  const revenueSeries = (legacy.revenue ?? []).map((point) => {
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

  const bookingSeries = (legacy.bookings ?? []).map((point) => ({
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
    cancellationRate: bookingTotals.total
      ? (bookingTotals.cancelled / bookingTotals.total) * 100
      : 0,
  };

  const utilizationRecords = (legacy.utilization ?? []).map((record) => {
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
  const [advancedFilters, setAdvancedFilters] = useState<{
    dateRange?: DateRange;
    operators?: unknown[];
    multiSelects?: Record<string, string[]>;
  }>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStats = useCallback(
    async (retryAttempt = 0) => {
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

        // Determine date range: AdvancedFilters takes precedence over predefined range
        let apiUrl = '/api/admin/dashboard/overview?';
        const currentAdvancedFilters = advancedFilters;
        if (currentAdvancedFilters.dateRange?.start && currentAdvancedFilters.dateRange?.end) {
          // Custom date range from AdvancedFilters
          const startISO = toDateString(currentAdvancedFilters.dateRange.start);
          const endISO = toDateString(currentAdvancedFilters.dateRange.end);
          apiUrl += `startDate=${startISO}&endDate=${endISO}`;
        } else {
          // Predefined range
          apiUrl += `range=${dateRange}`;
        }

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
              fetchStats(retryAttempt + 1);
            }, delay);
            return;
          }
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

        // Use current time for lastUpdated since we're fetching live data
        // The API uses live queries from payments table, so data is always current
        setLastUpdated(new Date());
        setRetryCount(0); // Reset retry count on success
        abortControllerRef.current = null;
      } catch (err) {
        // Don't retry if request was aborted
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard stats';

        // Retry on network errors
        if (
          retryAttempt < MAX_RETRIES &&
          (err instanceof TypeError || (err as Error).message.includes('fetch'))
        ) {
          const delay = Math.min(1000 * Math.pow(2, retryAttempt), 10000);
          setRetryCount(retryAttempt + 1);
          setTimeout(() => {
            fetchStats(retryAttempt + 1);
          }, delay);
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          logger.error(
            'Failed to fetch dashboard stats:',
            {
              component: 'app-page',
              action: 'error',
              metadata: { retryAttempt },
            },
            err instanceof Error ? err : new Error(String(err))
          );
        }
        setError(errorMessage);
        setRetryCount(0);
        abortControllerRef.current = null;
      } finally {
        setLoading(false);
      }
    },
    [dateRange, advancedFilters.dateRange?.start, advancedFilters.dateRange?.end]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Refetch when AdvancedFilters dateRange changes
  useEffect(() => {
    if (advancedFilters.dateRange?.start || advancedFilters.dateRange?.end) {
      fetchStats();
    }
  }, [advancedFilters.dateRange, fetchStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchStats();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, loading]);

  useEffect(() => {
    let isMounted = true;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleRealtimeChange = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        fetchStats();
      }, 500);
    };

    const channel = supabase
      .channel('admin-dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        handleRealtimeChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        handleRealtimeChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipment' },
        handleRealtimeChange
      )
      .subscribe((status) => {
        if (!isMounted) return;
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      isMounted = false;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  const handleRefresh = () => {
    fetchStats();
  };

  const handleDateRangeChange = (newDateRange: DateRangeKey) => {
    setDateRange(newDateRange);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetchWithAuth(`/api/admin/dashboard/export?range=${dateRange}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to export dashboard data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `dashboard-export-${dateRange}-${toDateString(new Date())}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (err) {
      logger.error(
        'Dashboard export failed',
        { component: 'AdminDashboard', action: 'export_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(err instanceof Error ? err.message : 'Failed to export dashboard report');
    } finally {
      setExporting(false);
    }
  };

  const comparisonLabel = comparisonLabels[dateRange] ?? comparisonLabels.custom;

  // Fill missing dates in revenue series and align comparison data
  const revenueSeries = useMemo(() => {
    try {
      const raw = charts?.revenue.series ?? [];
      if (!Array.isArray(raw) || raw.length === 0) return [];

      // Determine date range
      let startDate: Date;
      let endDate: Date;

      if (advancedFilters.dateRange?.start && advancedFilters.dateRange?.end) {
        startDate = new Date(advancedFilters.dateRange.start);
        endDate = new Date(advancedFilters.dateRange.end);

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          logger.warn('Invalid date range in advanced filters', {
            component: 'AdminDashboard',
            action: 'invalid_date_range',
          });
          return raw; // Return raw data if dates are invalid
        }
      } else {
        const ranges = resolveRangeBounds(dateRange);
        startDate = ranges.start;
        endDate = ranges.end;
      }

      // Fill missing dates with zero values
      const filled = fillMissingDates(raw, startDate, endDate);

      // Debug: Log date range and filled data (always log for month/quarter/year to diagnose issues)
      if (
        filled.length > 0 &&
        (dateRange === 'month' || dateRange === 'quarter' || dateRange === 'year')
      ) {
        const nonZeroData = filled.filter((d) => d.netRevenue > 0);
        logger.info('Revenue series date range', {
          component: 'AdminDashboard',
          action: 'revenue_series_date_range',
          metadata: {
            range: dateRange,
            startDate: toDateString(startDate),
            endDate: toDateString(endDate),
            startDateISO: startDate.toISOString(),
            endDateISO: endDate.toISOString(),
            rawDataPoints: raw.length,
            filledDataPoints: filled.length,
            nonZeroDataPoints: nonZeroData.length,
            firstDate: filled[0]?.date,
            lastDate: filled[filled.length - 1]?.date,
            today: toDateString(new Date()),
            sampleData: filled
              .slice(0, 3)
              .map((d) => ({
                date: d.date,
                netRevenue: d.netRevenue,
                grossRevenue: d.grossRevenue,
                paymentsCount: d.paymentsCount,
              })),
            lastThreeData: filled
              .slice(-3)
              .map((d) => ({
                date: d.date,
                netRevenue: d.netRevenue,
                grossRevenue: d.grossRevenue,
                paymentsCount: d.paymentsCount,
              })),
            nonZeroSample: nonZeroData
              .slice(0, 5)
              .map((d) => ({
                date: d.date,
                netRevenue: d.netRevenue,
                grossRevenue: d.grossRevenue,
                paymentsCount: d.paymentsCount,
              })),
          },
        });
      } else if (process.env.NODE_ENV === 'development' && filled.length > 0) {
        logger.debug('Revenue series date range', {
          component: 'AdminDashboard',
          action: 'revenue_series_date_range',
          metadata: {
            range: dateRange,
            startDate: toDateString(startDate),
            endDate: toDateString(endDate),
            startDateISO: startDate.toISOString(),
            endDateISO: endDate.toISOString(),
            rawDataPoints: raw.length,
            filledDataPoints: filled.length,
            firstDate: filled[0]?.date,
            lastDate: filled[filled.length - 1]?.date,
            today: toDateString(new Date()),
          },
        });
      }

      return filled;
    } catch (error) {
      logger.error(
        'Error processing revenue series',
        {
          component: 'AdminDashboard',
          action: 'revenue_series_error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
      return charts?.revenue.series ?? [];
    }
  }, [charts?.revenue.series, dateRange, advancedFilters.dateRange]);

  const revenueNetTotal = charts?.revenue.totals.netRevenue ?? stats.totalRevenue;

  const revenueChartSummary = useMemo(
    () => ({
      totalRevenue: revenueNetTotal,
      growthPercentage: stats.revenueGrowth,
      averageDailyRevenue: calculateAverageDailyRevenue(revenueNetTotal, dateRange),
    }),
    [revenueNetTotal, stats.revenueGrowth, dateRange]
  );

  // Process booking series with date filling and comparison alignment
  const bookingSeries = useMemo(() => {
    try {
      const raw = charts?.bookings.series ?? [];
      if (!Array.isArray(raw) || raw.length === 0) return [];

      // Determine date range
      let startDate: Date;
      let endDate: Date;

      if (advancedFilters.dateRange?.start && advancedFilters.dateRange?.end) {
        startDate = new Date(advancedFilters.dateRange.start);
        endDate = new Date(advancedFilters.dateRange.end);

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          logger.warn('Invalid date range in advanced filters for bookings', {
            component: 'AdminDashboard',
            action: 'invalid_date_range',
          });
          return raw; // Return raw data if dates are invalid
        }
      } else {
        const ranges = resolveRangeBounds(dateRange);
        startDate = ranges.start;
        endDate = ranges.end;
      }

      // Fill missing dates with zero values
      const filled = fillMissingBookingDates(raw, startDate, endDate);

      return filled;
    } catch (error) {
      logger.error(
        'Error processing booking series',
        {
          component: 'AdminDashboard',
          action: 'booking_series_error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
      return charts?.bookings.series ?? [];
    }
  }, [charts?.bookings.series, dateRange, advancedFilters.dateRange]);

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

  // Check if revenue series has actual payment data (non-zero netRevenue)
  // fillMissingDates creates zero-filled dates, so we need to check for actual revenue
  const hasRevenueData = useMemo(() => {
    return revenueSeries.some((point) => point.netRevenue > 0);
  }, [revenueSeries]);

  const revenueStatus = resolveStatus(hasRevenueData);
  // Check if booking series has actual booking data (non-zero total)
  // fillMissingBookingDates creates zero-filled dates, so we need to check for actual bookings
  const hasBookingData = useMemo(() => {
    return bookingSeries.some((point) => point.total > 0);
  }, [bookingSeries]);
  const bookingStatus = resolveStatus(hasBookingData);
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
      <div
        className="flex h-64 items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading dashboard"
      >
        <div
          className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"
          aria-hidden="true"
        ></div>
        <span className="sr-only">Loading dashboard data</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status announcements for screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {loading && 'Loading dashboard data'}
        {error && `Error: ${error}`}
        {!loading &&
          !error &&
          lastUpdated &&
          `Dashboard updated at ${lastUpdated.toLocaleTimeString()}`}
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with your rental business.
          </p>
          {lastUpdated && (
            <p className="mt-1 text-sm text-gray-500" aria-live="polite" aria-atomic="true">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* WebSocket connection indicator */}
          <div className="flex items-center space-x-2" role="status" aria-live="polite">
            <div
              className={`h-2 w-2 rounded-full ${
                realtimeConnected ? 'bg-green-500' : 'bg-gray-300 animate-pulse'
              }`}
              aria-hidden="true"
            ></div>
            <span
              className="text-sm text-gray-500"
              aria-label={`Connection status: ${realtimeConnected ? 'Live' : 'Offline'}`}
            >
              {realtimeConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Date range selector */}
          <label htmlFor="date-range-select" className="sr-only">
            Select date range
          </label>
          <select
            id="date-range-select"
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value as DateRangeKey)}
            className="focus:ring-kubota-orange rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus-visible:ring-2"
            aria-label="Date range selector"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center space-x-2 rounded-md bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={exporting ? 'Exporting dashboard data' : 'Export dashboard data'}
            type="button"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{exporting ? 'Exporting…' : 'Export'}</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Refresh dashboard data"
            type="button"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-4"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                {retryCount > 0 && retryCount < MAX_RETRIES && (
                  <p className="mt-1">
                    Retrying... (Attempt {retryCount} of {MAX_RETRIES})
                  </p>
                )}
                {retryCount === 0 && (
                  <button
                    onClick={() => fetchStats(0)}
                    className="mt-2 text-sm font-medium text-red-800 underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                    type="button"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <AdvancedFilters
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          availableFields={[
            {
              label: 'Booking Status',
              value: 'status',
              type: 'select',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'Paid', value: 'paid' },
                { label: 'Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' },
              ],
            },
            { label: 'Total Amount', value: 'totalAmount', type: 'number' },
            { label: 'Created Date', value: 'createdAt', type: 'date' },
          ]}
          multiSelectFields={[
            {
              label: 'Booking Status',
              value: 'status',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'Paid', value: 'paid' },
                { label: 'Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' },
              ],
            },
          ]}
        />
      </div>

      {/* Stats cards */}
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        role="region"
        aria-label="Dashboard statistics"
      >
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
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        role="region"
        aria-label="Additional dashboard statistics"
      >
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

      {/* Dashboard Alerts */}
      <div
        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        role="region"
        aria-label="System alerts"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
        </div>
        <DashboardAlerts
          maxAlerts={10}
          showOnlyActive={true}
          onAlertChange={() => {
            fetchStats();
          }}
        />
      </div>

      {/* Charts and recent activity */}
      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        role="region"
        aria-label="Dashboard charts"
      >
        {/* Revenue chart */}
        <DashboardChart
          title="Revenue Trend"
          description="Net revenue after refunds for the selected period."
          status={revenueStatus}
          errorMessage={error}
          emptyMessage="No revenue recorded during this period."
          updatedAt={lastUpdated}
          onExpand={() => setIsRevenueModalOpen(true)}
        >
          {revenueStatus === 'ready' && (
            <RevenueChart data={revenueSeries} summary={revenueChartSummary} compact={false} />
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
          onExpand={() => setIsBookingModalOpen(true)}
        >
          {bookingStatus === 'ready' && (
            <BookingTrendsChart
              data={bookingSeries}
              summary={bookingTrendSummary}
              compact={false}
            />
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
      <div className="rounded-lg bg-white p-6 shadow" role="region" aria-label="Recent bookings">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Recent Bookings</h3>
        <RecentBookings />
      </div>

      {/* Revenue Chart Modal */}
      <RevenueChartModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        data={revenueSeries}
        summary={revenueChartSummary}
        dateRange={dateRange}
      />

      {/* Booking Trends Chart Modal */}
      <BookingTrendsChartModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        data={bookingSeries}
        summary={bookingTrendSummary}
        dateRange={dateRange}
      />
    </div>
  );
}
