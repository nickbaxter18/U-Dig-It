'use client';

import type { RevenueChartPoint } from '@/types/dashboard';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { memo, useMemo } from 'react';

import { logger } from '@/lib/logger';

interface RevenueChartProps {
  data: RevenueChartPoint[];
  summary: {
    totalRevenue: number;
    growthPercentage: number | null;
    averageDailyRevenue: number;
  };
  compact?: boolean;
}

/**
 * Formats a date for display in the chart
 * Handles YYYY-MM-DD format strings correctly by parsing as local date, not UTC
 */
function formatChartDate(dateString: string): string {
  try {
    // If dateString is in YYYY-MM-DD format, parse it as local date to avoid timezone issues
    // new Date('2025-11-21') is interpreted as UTC, which can shift to previous day in some timezones
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
 * Formats currency value for display
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats currency for Y-axis labels (compact format)
 */
function formatYAxisLabel(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value);
}

/**
 * Validates and sanitizes chart data
 */
function validateData(data: RevenueChartPoint[]): RevenueChartPoint[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((point) => {
      // Filter out invalid entries
      if (!point || typeof point !== 'object') return false;
      if (!point.date || typeof point.date !== 'string') return false;

      // Validate date is parseable
      const date = new Date(point.date);
      if (isNaN(date.getTime())) return false;

      // Validate numeric fields
      if (
        typeof point.netRevenue !== 'number' ||
        isNaN(point.netRevenue) ||
        !isFinite(point.netRevenue)
      ) {
        return false;
      }

      return true;
    })
    .map((point) => {
      // Sanitize and ensure all numeric fields are valid
      const netRevenue = Math.max(0, Number(point.netRevenue) || 0);
      const grossRevenue = Math.max(0, Number(point.grossRevenue) || 0);
      const refundedAmount = Math.max(0, Number(point.refundedAmount) || 0);
      const paymentsCount = Math.max(0, Math.round(Number(point.paymentsCount) || 0));

      // Ensure netRevenue doesn't exceed grossRevenue (data integrity check)
      const sanitizedNetRevenue = Math.min(netRevenue, grossRevenue);

      return {
        ...point,
        date: point.date, // Keep original date string
        netRevenue: sanitizedNetRevenue,
        grossRevenue,
        refundedAmount: Math.min(refundedAmount, grossRevenue), // Refunds can't exceed gross
        paymentsCount,
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
      netRevenue: number;
      grossRevenue: number;
      refundedAmount: number;
    };
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  const netRevenue = data.netRevenue || 0;
  const grossRevenue = data.grossRevenue || 0;
  const refundedAmount = data.refundedAmount || 0;
  const paymentsCount = data.paymentsCount || 0;

  // Use label (formatted date) or fall back to data.date
  const displayDate = label || data.date;

  return (
    <div className="pointer-events-none z-50 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <div className="text-xs font-semibold text-gray-900">{formatChartDate(displayDate)}</div>
      <div className="mt-1 space-y-0.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-600">Net Revenue:</span>
          <span className="font-semibold text-gray-900">{formatCurrency(netRevenue)}</span>
        </div>
        {grossRevenue > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600">Gross:</span>
            <span className="text-gray-700">{formatCurrency(grossRevenue)}</span>
          </div>
        )}
        {refundedAmount > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600">Refunded:</span>
            <span className="text-red-600">{formatCurrency(refundedAmount)}</span>
          </div>
        )}
        {paymentsCount > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600">Payments:</span>
            <span className="text-gray-700">{paymentsCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Transforms data for Recharts consumption
 */
function transformDataForRecharts(data: RevenueChartPoint[]): Array<{
  date: string;
  netRevenue: number;
  grossRevenue: number;
  refundedAmount: number;
  paymentsCount: number;
}> {
  if (!Array.isArray(data)) {
    return [];
  }

  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

  return sortedData.map((point) => {
    return {
      date: point.date,
      netRevenue: point.netRevenue,
      grossRevenue: point.grossRevenue,
      refundedAmount: point.refundedAmount,
      paymentsCount: point.paymentsCount,
    };
  });
}

function RevenueChartComponent({ data, summary, compact = false }: RevenueChartProps) {
  // Validate and sort data
  const validatedData = useMemo(() => validateData(data), [data]);

  // Transform data for Recharts
  const chartData = useMemo(() => transformDataForRecharts(validatedData), [validatedData]);

  // Debug logging in development to diagnose data issues
  if (process.env.NODE_ENV === 'development' && chartData.length > 0) {
    logger.debug('[RevenueChart] Data received:', {
      rawDataLength: data.length,
      validatedDataLength: validatedData.length,
      chartDataLength: chartData.length,
      hasNonZeroRevenue: chartData.some((d) => d.netRevenue > 0),
      maxRevenue: Math.max(...chartData.map((d) => d.netRevenue)),
      sampleData: chartData.slice(0, 3),
    });
  }

  // Edge case: single data point (calculate before empty check for consistency)
  const isSinglePoint = validatedData.length === 1;

  // Calculate max revenue for Y-axis domain (before early return for hooks rule)
  const maxRevenue = useMemo(() => {
    if (chartData.length === 0) return 1;

    const allValues = chartData.map((point) => point.netRevenue);
    const max = Math.max(...allValues, 1);
    // If all values are zero, return 1 to prevent division by zero
    if (max === 0) return 1;
    // Add 10% padding to top of domain for better visual appearance
    return max * 1.1;
  }, [chartData]);

  // Calculate average revenue for reference line
  const averageRevenue = useMemo(() => {
    if (chartData.length === 0) return 0;
    const total = chartData.reduce((sum, point) => sum + point.netRevenue, 0);
    return total / chartData.length;
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
        aria-label="Revenue chart - no data"
      >
        <p className="text-sm font-medium text-gray-700">No revenue data available</p>
        <p className="text-xs text-gray-500">
          Revenue data will appear here once bookings are created
        </p>
      </div>
    );
  }

  const chartHeight = compact ? 200 : 256;
  const xAxisHeight = compact ? 50 : 60;
  const yAxisWidth = compact ? 60 : 80;

  return (
    <div
      className={compact ? 'space-y-2' : 'space-y-4'}
      data-testid="revenue-chart-container"
      role="region"
      aria-label="Revenue trend chart showing daily revenue over time"
    >
      {/* Chart Container */}
      <div
        className={`relative rounded-lg bg-gray-50 ${compact ? 'p-2' : 'p-4'} ${compact ? 'h-[200px]' : ''}`}
        data-testid="revenue-chart"
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
            syncId="revenue-chart"
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                <stop offset="50%" stopColor="#fb923c" stopOpacity={1} />
                <stop offset="100%" stopColor="#fdba74" stopOpacity={1} />
              </linearGradient>
              {/* Comparison period gradient - distinct blue-gray color */}
              {/* Ensure gradient is always defined, even if hasComparison is false */}
              <linearGradient id="revenueComparisonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#475569" stopOpacity={0.7} />
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
              tickFormatter={formatYAxisLabel}
              domain={[0, maxRevenue]}
              width={yAxisWidth}
              tick={{ fontSize: compact ? 10 : 12, fill: '#6b7280' }}
              aria-label="Revenue amount axis"
              allowDecimals={true}
              type="number"
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              animationDuration={200}
              wrapperStyle={{ outline: 'none' }}
            />
            {/* Reference line for average revenue - hide in compact mode */}
            {!compact && averageRevenue > 0 && chartData.length > 1 && (
              <ReferenceLine
                y={averageRevenue}
                stroke="#94a3b8"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: 'Average',
                  position: 'right',
                  fill: '#64748b',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />
            )}
            {/* Main revenue bar */}
            <Bar
              dataKey="netRevenue"
              fill="url(#revenueGradient)"
              radius={[4, 4, 0, 0]}
              name="Current Period"
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats - Hide in compact mode */}
      {!compact && (
        <div
          className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3"
          data-testid="revenue-summary"
          role="group"
          aria-label="Revenue summary statistics"
        >
          <div className="text-center">
            <div className="text-gray-500">Total Revenue</div>
            <div
              className="text-lg font-semibold"
              aria-label={`Total revenue: ${formatCurrency(summary.totalRevenue)}`}
            >
              {formatCurrency(summary.totalRevenue)}
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
          <div className="text-center">
            <div className="text-gray-500">Daily Average</div>
            <div
              className="text-lg font-semibold"
              aria-label={`Daily average revenue: ${formatCurrency(summary.averageDailyRevenue)}`}
            >
              {formatCurrency(summary.averageDailyRevenue)}
            </div>
          </div>
        </div>
      )}

      {/* Screen reader summary */}
      <div className="sr-only" role="status">
        <p>
          Revenue chart showing {validatedData.length} data points. Total revenue:{' '}
          {formatCurrency(summary.totalRevenue)}.
          {summary.growthPercentage !== null &&
            ` Growth: ${summary.growthPercentage >= 0 ? '+' : ''}${summary.growthPercentage.toFixed(1)}%.`}{' '}
          Daily average: {formatCurrency(summary.averageDailyRevenue)}.
        </p>
        <ul>
          {validatedData.map((point) => (
            <li key={point.date}>
              {formatChartDate(point.date)}: {formatCurrency(point.netRevenue)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders when props haven't changed
export const RevenueChart = memo(RevenueChartComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  if (prevProps.compact !== nextProps.compact) return false;
  if (prevProps.data.length !== nextProps.data.length) return false;
  if (prevProps.summary.totalRevenue !== nextProps.summary.totalRevenue) return false;
  if (prevProps.summary.growthPercentage !== nextProps.summary.growthPercentage) return false;
  if (prevProps.summary.averageDailyRevenue !== nextProps.summary.averageDailyRevenue) return false;

  // Deep comparison of data arrays (only check first and last items for performance)
  if (prevProps.data.length > 0 && nextProps.data.length > 0) {
    const prevFirst = prevProps.data[0];
    const nextFirst = nextProps.data[0];
    const prevLast = prevProps.data[prevProps.data.length - 1];
    const nextLast = nextProps.data[nextProps.data.length - 1];

    if (
      prevFirst.date !== nextFirst.date ||
      prevFirst.netRevenue !== nextFirst.netRevenue ||
      prevLast.date !== nextLast.date ||
      prevLast.netRevenue !== nextLast.netRevenue
    ) {
      return false;
    }
  }

  return true; // Props are equal, skip re-render
});
