'use client';

import type { BookingChartPoint } from '@/types/dashboard';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { memo, useMemo } from 'react';

interface BookingTrendsChartProps {
  data: BookingChartPoint[];
  summary: {
    totalBookings: number;
    completionRate: number;
    cancellationRate: number;
    growthPercentage: number | null;
  };
  compact?: boolean;
  className?: string;
}

/**
 * Formats a date for display in the chart
 * Handles YYYY-MM-DD format strings correctly by parsing as local date, not UTC
 */
function formatChartDate(dateString: string): string {
  try {
    // If dateString is in YYYY-MM-DD format, parse it as local date to avoid timezone issues
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }

    // Fallback for ISO strings or other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Validates and sanitizes chart data
 */
function validateData(data: BookingChartPoint[]): BookingChartPoint[] {
  if (!Array.isArray(data)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[BookingTrendsChart] validateData: data is not an array', { data });
    }
    return [];
  }

  if (data.length === 0) {
    return [];
  }

  return data
    .filter((point) => {
      // Filter out invalid entries
      if (!point || typeof point !== 'object') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[BookingTrendsChart] validateData: invalid point (not object)', { point });
        }
        return false;
      }
      if (!point.date || typeof point.date !== 'string') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[BookingTrendsChart] validateData: invalid point (missing/invalid date)', {
            point,
          });
        }
        return false;
      }

      // Validate date is parseable
      const date = new Date(point.date);
      if (isNaN(date.getTime())) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[BookingTrendsChart] validateData: invalid point (unparseable date)', {
            point,
            date: point.date,
          });
        }
        return false;
      }

      // Validate numeric fields - allow undefined/null but validate if present
      if (point.total !== undefined && point.total !== null) {
        if (typeof point.total !== 'number' || isNaN(point.total) || !isFinite(point.total)) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[BookingTrendsChart] validateData: invalid point (invalid total)', {
              point,
              total: point.total,
            });
          }
          return false;
        }
      }

      return true;
    })
    .map((point) => {
      // Sanitize and ensure all numeric fields are valid
      const total = Math.max(0, Math.round(Number(point.total) || 0));
      const completed = Math.max(0, Math.round(Number(point.completed) || 0));
      const cancelled = Math.max(0, Math.round(Number(point.cancelled) || 0));
      const active = Math.max(0, Math.round(Number(point.active) || 0));

      // Ensure breakdown doesn't exceed total
      const breakdownTotal = completed + cancelled + active;
      const sanitizedTotal = Math.max(total, breakdownTotal);

      return {
        ...point,
        date: point.date, // Keep original date string
        total: sanitizedTotal,
        completed: Math.min(completed, sanitizedTotal),
        cancelled: Math.min(cancelled, sanitizedTotal),
        active: Math.min(active, sanitizedTotal),
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
}

/**
 * Custom tooltip component for Recharts
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      date: string;
      total: number;
      completed: number;
      cancelled: number;
      active: number;
    };
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  const total = data.total || 0;
  const completed = data.completed || 0;
  const cancelled = data.cancelled || 0;
  const activeCount = data.active || 0;

  // Use label (formatted date) or fall back to data.date
  const displayDate = label || data.date;

  return (
    <div className="pointer-events-none z-50 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <div className="text-xs font-semibold text-gray-900">{formatChartDate(displayDate)}</div>
      <div className="mt-1 space-y-0.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-600">Total Bookings:</span>
          <span className="font-semibold text-gray-900">{total}</span>
        </div>
        {completed > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600">Completed:</span>
            <span className="text-green-600 font-medium">{completed}</span>
          </div>
        )}
        {activeCount > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600">Active:</span>
            <span className="text-orange-600 font-medium">{activeCount}</span>
          </div>
        )}
        {cancelled > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600">Cancelled:</span>
            <span className="text-red-600 font-medium">{cancelled}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Transforms data for Recharts consumption
 */
function transformDataForRecharts(data: BookingChartPoint[]): Array<{
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  active: number;
}> {
  if (!Array.isArray(data)) {
    return [];
  }

  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

  return sortedData.map((point) => {
    return {
      date: point.date,
      total: point.total,
      completed: point.completed,
      cancelled: point.cancelled,
      active: point.active,
    };
  });
}

function BookingTrendsChartComponent({
  data,
  summary,
  compact = false,
  className = '',
}: BookingTrendsChartProps) {
  // Validate and sort data
  const validatedData = useMemo(() => validateData(data), [data]);

  // Transform data for Recharts
  const chartData = useMemo(() => transformDataForRecharts(validatedData), [validatedData]);

  // Edge case: single data point (calculate before empty check for consistency)
  const isSinglePoint = validatedData.length === 1;

  // Calculate max bookings for Y-axis domain (before early return for hooks rule)
  const maxBookings = useMemo(() => {
    if (chartData.length === 0) return 1;

    const allValues = chartData.map((point) => point.total);
    const max = Math.max(...allValues, 1);
    // If all values are zero, return 1 to prevent division by zero
    if (max === 0) return 1;
    // Add 10% padding to top of domain for better visual appearance
    return max * 1.1;
  }, [chartData]);

  // Empty state (after hooks to maintain hook order)
  if (validatedData.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 text-center ${
          compact ? 'h-40' : 'h-64'
        }`}
        role="status"
        aria-live="polite"
        aria-label="Booking trends chart - no data"
      >
        <p className="text-sm font-medium text-gray-700">No booking data available</p>
        <p className="text-xs text-gray-500">
          Booking data will appear here once bookings are created
        </p>
      </div>
    );
  }

  const chartHeight = compact ? 200 : 256;
  const xAxisHeight = compact ? 50 : 60;
  const yAxisWidth = compact ? 60 : 80;

  return (
    <div
      className={compact ? `space-y-2 ${className}` : `space-y-4 ${className}`}
      data-testid="booking-trends-chart-container"
      role="region"
      aria-label="Booking trends chart showing daily bookings over time"
    >
      {/* Summary stats - Hide in compact mode */}
      {!compact && (
        <div
          className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 text-sm sm:grid-cols-4"
          data-testid="booking-summary"
          role="group"
          aria-label="Booking summary statistics"
        >
          <div className="text-center">
            <div className="text-gray-500">Total Bookings</div>
            <div
              className="text-lg font-semibold"
              aria-label={`Total bookings: ${summary.totalBookings}`}
            >
              {summary.totalBookings}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Completion Rate</div>
            <div
              className="text-lg font-semibold"
              aria-label={`Completion rate: ${summary.completionRate.toFixed(1)}%`}
            >
              {summary.completionRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Cancellation Rate</div>
            <div
              className="text-lg font-semibold"
              aria-label={`Cancellation rate: ${summary.cancellationRate.toFixed(1)}%`}
            >
              {summary.cancellationRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Growth</div>
            {summary.growthPercentage === null ? (
              <div
                className="text-lg font-semibold text-gray-500"
                aria-label="Growth: Not available"
              >
                N/A
              </div>
            ) : (
              <div
                className={`text-lg font-semibold ${
                  summary.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
                aria-label={`Growth: ${summary.growthPercentage >= 0 ? '+' : ''}${summary.growthPercentage.toFixed(1)}%`}
              >
                {summary.growthPercentage >= 0 ? '+' : ''}
                {summary.growthPercentage.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div
        className={`relative rounded-lg bg-gray-50 ${compact ? 'p-2' : 'p-4'} ${compact ? 'h-[200px]' : ''}`}
        data-testid="booking-trends-chart"
      >
        <ResponsiveContainer width="100%" height={chartHeight} debounce={100}>
          <BarChart
            data={chartData}
            margin={{
              top: compact ? 10 : 20,
              right: compact ? 10 : 30,
              left: compact ? 5 : 10,
              bottom: xAxisHeight,
            }}
            barCategoryGap={isSinglePoint ? '20%' : compact ? '8%' : '10%'}
            barSize={compact ? 24 : 32}
            accessibilityLayer={true}
            syncId="booking-trends-chart"
          >
            <defs>
              <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="cancelledGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              angle={isSinglePoint ? 0 : compact ? -30 : -45}
              textAnchor={isSinglePoint ? 'middle' : compact ? 'end' : 'end'}
              height={xAxisHeight}
              tick={{ fontSize: compact ? 10 : 12, fill: '#6b7280' }}
              interval={
                chartData.length > 30
                  ? 'preserveStartEnd'
                  : compact && chartData.length > 14
                    ? 'preserveStartEnd'
                    : 0
              }
              minTickGap={compact ? 30 : 30}
              aria-label="Date axis"
              type="category"
            />
            <YAxis
              domain={[0, maxBookings]}
              width={yAxisWidth}
              tick={{ fontSize: compact ? 10 : 12, fill: '#6b7280' }}
              allowDecimals={false}
              aria-label="Number of bookings axis"
              type="number"
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              animationDuration={200}
              wrapperStyle={{ outline: 'none' }}
            />
            {/* Main booking bars - stacked */}
            <Bar
              dataKey="completed"
              stackId="current"
              fill="url(#completedGradient)"
              radius={[0, 0, 0, 0]}
              name="Completed"
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="active"
              stackId="current"
              fill="url(#activeGradient)"
              radius={[0, 0, 0, 0]}
              name="Active / In Progress"
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="cancelled"
              stackId="current"
              fill="url(#cancelledGradient)"
              radius={[4, 4, 0, 0]}
              name="Cancelled"
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend - more compact in compact mode */}
      <div
        className={`flex items-center justify-center ${compact ? 'gap-2 text-[10px]' : 'gap-4 text-xs'} text-gray-600`}
        role="group"
        aria-label="Chart legend"
      >
        <div className="flex items-center gap-1.5">
          <div
            className={`${compact ? 'h-2 w-4' : 'h-3 w-6'} rounded bg-gradient-to-t from-green-500 to-green-600`}
          />
          <span>{compact ? 'Completed' : 'Completed'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`${compact ? 'h-2 w-4' : 'h-3 w-6'} rounded bg-gradient-to-t from-orange-400 to-orange-500`}
          />
          <span>{compact ? 'Active' : 'Active / In Progress'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`${compact ? 'h-2 w-4' : 'h-3 w-6'} rounded bg-gradient-to-t from-red-500 to-red-600`}
          />
          <span>{compact ? 'Cancelled' : 'Cancelled'}</span>
        </div>
      </div>

      {/* Screen reader summary */}
      <div className="sr-only" role="status">
        <p>
          Booking trends chart showing {validatedData.length} data points. Total bookings:{' '}
          {summary.totalBookings}.
          {summary.growthPercentage !== null &&
            ` Growth: ${summary.growthPercentage >= 0 ? '+' : ''}${summary.growthPercentage.toFixed(1)}%.`}{' '}
          Completion rate: {summary.completionRate.toFixed(1)}%. Cancellation rate:{' '}
          {summary.cancellationRate.toFixed(1)}%.
        </p>
        <ul>
          {validatedData.map((point) => (
            <li key={point.date}>
              {formatChartDate(point.date)}: {point.total} bookings ({point.completed} completed,{' '}
              {point.active} active, {point.cancelled} cancelled)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders when props haven't changed
export default memo(BookingTrendsChartComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  if (prevProps.compact !== nextProps.compact) return false;
  if (prevProps.data.length !== nextProps.data.length) return false;
  if (prevProps.summary.totalBookings !== nextProps.summary.totalBookings) return false;
  if (prevProps.summary.growthPercentage !== nextProps.summary.growthPercentage) return false;
  if (prevProps.summary.completionRate !== nextProps.summary.completionRate) return false;
  if (prevProps.summary.cancellationRate !== nextProps.summary.cancellationRate) return false;

  // Deep comparison of data arrays (only check first and last items for performance)
  if (prevProps.data.length > 0 && nextProps.data.length > 0) {
    const prevFirst = prevProps.data[0];
    const nextFirst = nextProps.data[0];
    const prevLast = prevProps.data[prevProps.data.length - 1];
    const nextLast = nextProps.data[nextProps.data.length - 1];

    if (
      prevFirst.date !== nextFirst.date ||
      prevFirst.total !== nextFirst.total ||
      prevLast.date !== nextLast.date ||
      prevLast.total !== nextLast.total
    ) {
      return false;
    }
  }

  return true; // Props are equal, skip re-render
});
