import { NextRequest, NextResponse } from 'next/server';

import { COMPLETED_PAYMENT_STATUSES } from '@/lib/constants/payment-status';
import { getErrorMessage } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { type TableRow } from '@/lib/supabase/typed-helpers';

type DateRangeKey = 'today' | 'week' | 'month' | 'quarter' | 'year';

interface TrendPoint {
  bucket_date: string;
  gross_revenue: number;
  refunded_amount: number;
  payments_count: number;
}

interface BookingTrendPoint {
  bucket_date: string;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  active_bookings: number;
}

interface EquipmentUtilizationPoint {
  snapshot_date: string;
  equipment_id: string;
  utilization_pct: number;
  hours_used: number;
  revenue_generated: number;
}

// Type definitions for query results
type PaymentRow = Pick<TableRow<'payments'>, 'id' | 'createdAt' | 'processedAt' | 'amount' | 'status' | 'amountRefunded' | 'type'>;
// Type for debug query that includes bookingId
type PaymentRowWithBooking = PaymentRow & { bookingId?: string | null };

interface RevenueTrendRow {
  bucket_date: string;
  gross_revenue: number | string | null;
  refunded_amount: number | string | null;
  payments_count: number | string | null;
}

const ACTIVE_BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'paid',
  'insurance_verified',
  'ready_for_pickup',
  'delivered',
  'in_progress',
  'verify_hold_ok',
  'deposit_scheduled',
  'hold_placed',
  'captured',
];

/**
 * Converts a Date to YYYY-MM-DD format using LOCAL timezone
 * This ensures consistency with date range calculations which use local time
 * For payment dates stored in UTC, we want to use the local date representation
 * to match the "today" date range which is calculated in local time
 */
function toDateString(date: Date): string {
  // Use local time components to match date range calculations
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts an ISO date string to YYYY-MM-DD format using LOCAL timezone
 * This is used for payment dates to ensure they match the local date range
 */
function toDateStringFromISO(isoString: string | null | undefined): string | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  // Use local time components to match how "today" is calculated
  return toDateString(date);
}

function resolveDateRanges(range: DateRangeKey) {
  const now = new Date();
  const currentStart = new Date(now);
  const currentEnd = new Date(now);
  let previousStart = new Date(now);
  let previousEnd = new Date(now);

  switch (range) {
    case 'today': {
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setDate(previousStart.getDate() - 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);

      // Log date range calculation for today
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Today date range calculation', {
          component: 'admin-dashboard-api',
          action: 'today_date_calculation',
          metadata: {
            currentStart: currentStart.toISOString(),
            currentEnd: currentEnd.toISOString(),
            previousStart: previousStart.toISOString(),
            previousEnd: previousEnd.toISOString(),
            currentStartDateStr: toDateString(currentStart),
            currentEndDateStr: toDateString(currentEnd),
            previousStartDateStr: toDateString(previousStart),
            previousEndDateStr: toDateString(previousEnd),
          },
        });
      }
      break;
    }
    case 'week': {
      currentStart.setDate(currentStart.getDate() - 6);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setDate(previousStart.getDate() - 13);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(previousEnd.getDate() - 7);
      previousEnd.setHours(23, 59, 59, 999);

      // Log date range calculation for week
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Week date range calculation', {
          component: 'admin-dashboard-api',
          action: 'week_date_calculation',
          metadata: {
            currentStart: currentStart.toISOString(),
            currentEnd: currentEnd.toISOString(),
            previousStart: previousStart.toISOString(),
            previousEnd: previousEnd.toISOString(),
            currentStartDateStr: toDateString(currentStart),
            currentEndDateStr: toDateString(currentEnd),
            previousStartDateStr: toDateString(previousStart),
            previousEndDateStr: toDateString(previousEnd),
          },
        });
      }
      break;
    }
    case 'month': {
      // Current: last 30 days (or 31 depending on month)
      currentStart.setMonth(currentStart.getMonth() - 1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      // Previous: 30 days before current period
      previousEnd = new Date(currentStart);
      previousEnd.setTime(previousEnd.getTime() - 1); // One day before current start
      previousEnd.setHours(23, 59, 59, 999);
      previousStart = new Date(previousEnd);
      previousStart.setMonth(previousStart.getMonth() - 1);
      previousStart.setHours(0, 0, 0, 0);

      // Validate previous period is exactly 30 days before current
      const currentDuration = currentEnd.getTime() - currentStart.getTime();
      const previousDuration = previousEnd.getTime() - previousStart.getTime();
      const daysDifference = Math.abs(
        (currentStart.getTime() - previousEnd.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (process.env.NODE_ENV === 'development') {
        logger.debug('Monthly date range calculation', {
          component: 'admin-dashboard-api',
          action: 'monthly_date_calculation',
          metadata: {
            currentStart: currentStart.toISOString(),
            currentEnd: currentEnd.toISOString(),
            previousStart: previousStart.toISOString(),
            previousEnd: previousEnd.toISOString(),
            currentDurationDays: Math.round(currentDuration / (1000 * 60 * 60 * 24)),
            previousDurationDays: Math.round(previousDuration / (1000 * 60 * 60 * 24)),
            daysBetweenPeriods: Math.round(daysDifference),
            currentStartDateStr: toDateString(currentStart),
            currentEndDateStr: toDateString(currentEnd),
            previousStartDateStr: toDateString(previousStart),
            previousEndDateStr: toDateString(previousEnd),
          },
        });
      }
      break;
    }
    case 'quarter': {
      // Current: last 3 months
      currentStart.setMonth(currentStart.getMonth() - 3);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      // Previous: 3 months before current period
      previousEnd = new Date(currentStart);
      previousEnd.setTime(previousEnd.getTime() - 1); // One day before current start
      previousEnd.setHours(23, 59, 59, 999);
      previousStart = new Date(previousEnd);
      previousStart.setMonth(previousStart.getMonth() - 3);
      previousStart.setHours(0, 0, 0, 0);

      // Log date range calculation for quarter
      if (process.env.NODE_ENV === 'development') {
        const currentDuration = currentEnd.getTime() - currentStart.getTime();
        const previousDuration = previousEnd.getTime() - previousStart.getTime();
        logger.debug('Quarter date range calculation', {
          component: 'admin-dashboard-api',
          action: 'quarter_date_calculation',
          metadata: {
            currentStart: currentStart.toISOString(),
            currentEnd: currentEnd.toISOString(),
            previousStart: previousStart.toISOString(),
            previousEnd: previousEnd.toISOString(),
            currentDurationDays: Math.round(currentDuration / (1000 * 60 * 60 * 24)),
            previousDurationDays: Math.round(previousDuration / (1000 * 60 * 60 * 24)),
            currentStartDateStr: toDateString(currentStart),
            currentEndDateStr: toDateString(currentEnd),
            previousStartDateStr: toDateString(previousStart),
            previousEndDateStr: toDateString(previousEnd),
          },
        });
      }
      break;
    }
    case 'year': {
      // Current: last 12 months
      currentStart.setFullYear(currentStart.getFullYear() - 1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      // Previous: 12 months before current period
      previousEnd = new Date(currentStart);
      previousEnd.setTime(previousEnd.getTime() - 1); // One day before current start
      previousEnd.setHours(23, 59, 59, 999);
      previousStart = new Date(previousEnd);
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      previousStart.setHours(0, 0, 0, 0);

      // Log date range calculation for year
      if (process.env.NODE_ENV === 'development') {
        const currentDuration = currentEnd.getTime() - currentStart.getTime();
        const previousDuration = previousEnd.getTime() - previousStart.getTime();
        logger.debug('Year date range calculation', {
          component: 'admin-dashboard-api',
          action: 'year_date_calculation',
          metadata: {
            currentStart: currentStart.toISOString(),
            currentEnd: currentEnd.toISOString(),
            previousStart: previousStart.toISOString(),
            previousEnd: previousEnd.toISOString(),
            currentDurationDays: Math.round(currentDuration / (1000 * 60 * 60 * 24)),
            previousDurationDays: Math.round(previousDuration / (1000 * 60 * 60 * 24)),
            currentStartDateStr: toDateString(currentStart),
            currentEndDateStr: toDateString(currentEnd),
            previousStartDateStr: toDateString(previousStart),
            previousEndDateStr: toDateString(previousEnd),
          },
        });
      }
      break;
    }
    default:
      break;
  }

  // Ensure currentEnd is set (fallback for default case)
  if (
    range !== 'today' &&
    range !== 'week' &&
    range !== 'month' &&
    range !== 'quarter' &&
    range !== 'year'
  ) {
    currentEnd.setHours(23, 59, 59, 999);
  }

  // Debug logging for date range calculation - for ALL ranges
  if (process.env.NODE_ENV === 'development') {
    const currentDuration = currentEnd.getTime() - currentStart.getTime();
    const previousDuration = previousEnd.getTime() - previousStart.getTime();
    logger.debug('Date range calculated', {
      component: 'admin-dashboard-api',
      action: 'date_range_calculation',
      metadata: {
        range,
        currentStart: currentStart.toISOString(),
        currentEnd: currentEnd.toISOString(),
        currentStartDateStr: toDateString(currentStart),
        currentEndDateStr: toDateString(currentEnd),
        currentDurationDays: Math.round(currentDuration / (1000 * 60 * 60 * 24)),
        previousStart: previousStart.toISOString(),
        previousEnd: previousEnd.toISOString(),
        previousStartDateStr: toDateString(previousStart),
        previousEndDateStr: toDateString(previousEnd),
        previousDurationDays: Math.round(previousDuration / (1000 * 60 * 60 * 24)),
        daysBetweenPeriods: Math.round(
          (currentStart.getTime() - previousEnd.getTime()) / (1000 * 60 * 60 * 24)
        ),
        now: now.toISOString(),
      },
    });
  }

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
}

function calculateGrowth(current: number, previous: number): number | null {
  // Handle null/undefined/NaN values
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;

  // If previous is 0 or null/undefined, growth is undefined (not calculable)
  if (previousValue === 0 || !isFinite(previousValue)) {
    return currentValue > 0 ? null : 0;
  }

  // Calculate growth percentage
  const growth = ((currentValue - previousValue) / previousValue) * 100;

  // Return null if result is not finite (handles edge cases)
  return isFinite(growth) ? growth : null;
}

export async function GET(request: NextRequest) {
  // Rate limit FIRST - moderate for read operations
  const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get('range') as DateRangeKey | null;
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  // Validate range parameter if provided
  const validRanges: DateRangeKey[] = ['today', 'week', 'month', 'quarter', 'year'];
  if (rangeParam && !validRanges.includes(rangeParam)) {
    return NextResponse.json(
      {
        error: 'Invalid range parameter',
        message: `Range must be one of: ${validRanges.join(', ')}`,
      },
      { status: 400 }
    );
  }

  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Determine date range: custom dates take precedence over predefined range
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;
    let range: DateRangeKey = rangeParam ?? 'month';

    if (startDateParam && endDateParam) {
      // Custom date range from AdvancedFilters
      try {
        // Sanitize input - only allow YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDateParam) || !dateRegex.test(endDateParam)) {
          return NextResponse.json(
            { error: 'Invalid date format', message: 'Dates must be in YYYY-MM-DD format' },
            { status: 400 }
          );
        }

        currentStart = new Date(startDateParam);
        currentEnd = new Date(endDateParam);

        // Validate dates
        if (isNaN(currentStart.getTime()) || isNaN(currentEnd.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format', message: 'Start and end dates must be valid dates' },
            { status: 400 }
          );
        }

        // Validate startDate <= endDate
        if (currentStart > currentEnd) {
          return NextResponse.json(
            {
              error: 'Invalid date range',
              message: 'Start date must be before or equal to end date',
            },
            { status: 400 }
          );
        }

        // Validate date range is not too large (max 2 years)
        const MAX_RANGE_DAYS = 730; // 2 years
        const daysDiff = Math.ceil(
          (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff > MAX_RANGE_DAYS) {
          return NextResponse.json(
            {
              error: 'Date range too large',
              message: `Date range cannot exceed ${MAX_RANGE_DAYS} days (2 years)`,
            },
            { status: 400 }
          );
        }

        // Validate dates are not in the future
        const now = new Date();
        if (currentEnd > now) {
          return NextResponse.json(
            { error: 'Invalid date range', message: 'End date cannot be in the future' },
            { status: 400 }
          );
        }

        // Set time boundaries for date-only comparison
        currentStart.setHours(0, 0, 0, 0);
        currentEnd.setHours(23, 59, 59, 999);

        // Calculate previous period based on duration
        const duration = currentEnd.getTime() - currentStart.getTime();
        previousEnd = new Date(currentStart);
        previousEnd.setTime(previousEnd.getTime() - 1);
        previousEnd.setHours(23, 59, 59, 999);
        previousStart = new Date(previousEnd);
        previousStart.setTime(previousStart.getTime() - duration);
        previousStart.setHours(0, 0, 0, 0);

        // Note: 'custom' is not a valid DateRangeKey, but we use it internally to track custom date ranges
        // The range parameter is still used for the response metadata
        // @ts-expect-error - 'custom' is used internally to track custom date ranges
        range = 'custom';
      } catch (err) {
        logger.warn('Invalid date parameters in dashboard API', {
          component: 'admin-dashboard-api',
          action: 'invalid_date_params',
          metadata: {
            startDateParam,
            endDateParam,
            error: err instanceof Error ? err.message : String(err),
          },
        });
        return NextResponse.json(
          { error: 'Invalid date parameters', message: 'Failed to parse startDate or endDate' },
          { status: 400 }
        );
      }
    } else {
      // Predefined range (existing logic)
      const ranges = resolveDateRanges(rangeParam ?? 'month');
      currentStart = ranges.currentStart;
      currentEnd = ranges.currentEnd;
      previousStart = ranges.previousStart;
      previousEnd = ranges.previousEnd;
    }
    // Use date strings (YYYY-MM-DD) for materialized view queries (bucket_date is date type)
    const currentStartISO = toDateString(currentStart);
    const currentEndISO = toDateString(currentEnd);
    const previousStartISO = toDateString(previousStart);
    const previousEndISO = toDateString(previousEnd);

    // Log date ranges (debug level to reduce production noise)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Dashboard overview date ranges', {
        component: 'admin-dashboard-api',
        action: 'date_ranges_set',
        metadata: {
          range,
          currentPeriod: {
            start: currentStartISO,
            end: currentEndISO,
            startDate: currentStart.toISOString(),
            endDate: currentEnd.toISOString(),
          },
          previousPeriod: {
            start: previousStartISO,
            end: previousEndISO,
            startDate: previousStart.toISOString(),
            endDate: previousEnd.toISOString(),
          },
        },
      });
    }

    // Helper function to safely query materialized views with fallback
    const safeQueryView = async <T>(
      viewName: string,
      queryFn: () => Promise<{ data: T | null; error: { message?: string; code?: string } | null }>,
      fallbackFn?: () => Promise<{ data: T | null; error: { message?: string; code?: string } | null }>
    ): Promise<{ data: T | null; error: { message?: string; code?: string } | null }> => {
      try {
        const result = await queryFn();
        // Check if error is "relation does not exist" OR if data is empty/null
        if (
          result.error &&
          (result.error.message?.includes('does not exist') || result.error.code === '42P01')
        ) {
          logger.warn(`Materialized view ${viewName} does not exist, using fallback`, {
            component: 'admin-dashboard-api',
            action: 'view_missing',
            metadata: { viewName },
          });
          return fallbackFn ? await fallbackFn() : { data: null, error: null };
        }
        // If view exists but returns empty data OR stale data, also use fallback for revenue trends and booking trends
        // This ensures we get real-time data from payments/bookings tables
        if (
          viewName === 'mv_revenue_trends' ||
          viewName === 'mv_booking_trends' ||
          viewName.startsWith('mv_booking_trends')
        ) {
          const isEmpty = !result.data || (Array.isArray(result.data) && result.data.length === 0);
          const isStale =
            result.error?.code === 'STALE_DATA' || result.error?.message?.includes('stale');

          if (isEmpty || isStale) {
            logger.info(
              `Materialized view ${viewName} returned ${isEmpty ? 'empty' : 'stale'} data, using fallback for real-time data`,
              {
                component: 'admin-dashboard-api',
                action: 'view_empty_or_stale_using_fallback',
                metadata: {
                  viewName,
                  dataLength: Array.isArray(result.data) ? result.data.length : 'null',
                  reason: isEmpty ? 'empty' : 'stale',
                  error: result.error,
                },
              }
            );
            return fallbackFn ? await fallbackFn() : { data: null, error: null };
          }
        }
        return result;
      } catch {
        logger.warn(`Error querying ${viewName}, using fallback`, {
          component: 'admin-dashboard-api',
          action: 'view_query_error',
          metadata: { viewName },
        });
        return fallbackFn ? await fallbackFn() : { data: null, error: null };
      }
    };

    let queryResults;
    try {
      queryResults = await Promise.all([
        safeQueryView('mv_dashboard_kpis', async () => {
          const result = await supabase
            .from('mv_dashboard_kpis')
            .select('snapshot_date, generated_at')
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .maybeSingle();
          return { data: result.data, error: result.error };
        }),
        safeQueryView(
          'mv_revenue_trends',
          async () => {
            // For DATE columns, use date strings (YYYY-MM-DD) not ISO timestamps
            // Supabase will handle the comparison correctly
            const result = await supabase
              .from('mv_revenue_trends')
              .select('bucket_date, gross_revenue, refunded_amount, payments_count')
              .gte('bucket_date', currentStartISO) // This is actually YYYY-MM-DD from toDateString()
              .lte('bucket_date', currentEndISO) // This is actually YYYY-MM-DD from toDateString()
              .order('bucket_date', { ascending: true });

            // Check if materialized view data is complete (covers the full date range)
            // If the view is stale (missing recent dates) or empty, we should use fallback
            let isDataComplete = false;

            // Always use fallback for real-time data - materialized views may be stale
            // This ensures we always get current payment data
            if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
              logger.info('Materialized view returned empty data, using fallback for real-time data', {
                component: 'admin-dashboard-api',
                action: 'mv_revenue_trends_empty',
                metadata: {
                  range,
                  dateRange: { start: currentStartISO, end: currentEndISO },
                },
              });
              // Return error to trigger fallback
              const emptyError = {
                message: 'Materialized view data is empty',
                code: 'STALE_DATA',
                details: 'Materialized view returned no data, using fallback',
              };
              return {
                data: result.data,
                error: emptyError,
              };
            }

            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
              const viewDates = result.data.map((r: RevenueTrendRow) => r.bucket_date).sort();
              const firstDate = viewDates[0];
              const lastDate = viewDates[viewDates.length - 1];
              const today = toDateString(new Date());

              // Data is complete if it covers the full range AND includes today (or very recent dates)
              // If the last date in the view is more than 1 day old, it's likely stale
              const daysSinceLastUpdate = Math.floor(
                (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
              );

              // Data is complete if:
              // 1. It starts at or before the requested start date
              // 2. It ends at or after the requested end date
              // 3. The last date is recent (within 1 day of today)
              // For monthly/quarterly/yearly views, we need the view to cover the full range
              isDataComplete =
                firstDate <= currentStartISO &&
                lastDate >= currentEndISO &&
                daysSinceLastUpdate <= 1;

              if (!isDataComplete) {
                logger.info('Materialized view data is incomplete or stale, will use fallback', {
                  component: 'admin-dashboard-api',
                  action: 'mv_revenue_trends_stale',
                  metadata: {
                    range,
                    dateRange: { start: currentStartISO, end: currentEndISO },
                    viewDataRange: { start: firstDate, end: lastDate },
                    daysSinceLastUpdate,
                    viewDataLength: result.data.length,
                    today,
                  },
                });
                // Return error to trigger fallback
                // Ensure error object has the correct structure for detection
                const staleError: { message: string; code: string; details: string } = {
                  message: 'Materialized view data is stale',
                  code: 'STALE_DATA',
                  details: `View has data from ${firstDate} to ${lastDate}, but needs ${currentStartISO} to ${currentEndISO}`,
                };
                return {
                  data: result.data,
                  error: staleError,
                };
              }
            }

            // Log what the materialized view returns
            logger.info('Materialized view query result', {
              component: 'admin-dashboard-api',
              action: 'mv_revenue_trends_query',
              metadata: {
                range,
                dateRange: { start: currentStartISO, end: currentEndISO },
                hasError: !!result.error,
                dataLength: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0,
                isDataComplete,
                sampleData: Array.isArray(result.data) ? result.data.slice(0, 3) : result.data,
              },
            });

            return result;
          },
          async () => {
            // Fallback: calculate from payments table
            // Note: Payment status is 'completed' when paid, not 'succeeded'
            // Optimize query by filtering in database where possible
            // Use processedAt for revenue date (when payment was actually completed), fallback to createdAt
            // Include all payment types (payment, deposit, additional_charge) but exclude refunds (handled via amountRefunded)

            const startDateStr = toDateString(currentStart);
            const endDateStr = toDateString(currentEnd);
            const currentStartISO = currentStart.toISOString();
            const currentEndISO = currentEnd.toISOString();

            // Debug: Check ALL payments to see what we have (development only)
            let allPaymentsDebug: PaymentRow[] | undefined;
            if (process.env.NODE_ENV === 'development') {
              const { data: debugPayments, error: debugError } = await supabase
                .from('payments')
                .select(
                  'id, createdAt, processedAt, amount, status, amountRefunded, type, bookingId'
                )
                .order('createdAt', { ascending: false })
                .limit(10);

              if (!debugError && debugPayments) {
                allPaymentsDebug = debugPayments;
                logger.debug('Recent payments in database (for debugging)', {
                  component: 'admin-dashboard-api',
                  action: 'debug_all_payments',
                  metadata: {
                    totalRecentPayments: debugPayments.length,
                    payments: debugPayments.map((p: PaymentRowWithBooking) => ({
                      id: p.id?.substring(0, 8),
                      status: p.status,
                      type: p.type,
                      amount: p.amount,
                      createdAt: p.createdAt,
                      processedAt: p.processedAt,
                      createdAtDateStr: toDateStringFromISO(p.createdAt),
                      processedAtDateStr: toDateStringFromISO(p.processedAt),
                      bookingId: p.bookingId?.substring(0, 8) ?? null, // Use actual bookingId from query
                    })),
                  },
                });
              }
            }

            // Query payments with basic filters
            // We filter by status and type in database, then do precise date filtering in JavaScript
            // This approach handles the processedAt/createdAt fallback logic correctly
            // FIX: Use explicit AND logic by grouping the OR condition with parentheses
            // This ensures: (status IN completed_statuses) AND (type IS NULL OR type != 'refund')
            // IMPORTANT: Include 'id' field for logging and debugging
            // Note: We don't filter by date in the database query because we need to handle
            // both processedAt (preferred) and createdAt (fallback) dates, which is easier in JavaScript
            const { data: payments, error } = await supabase
              .from('payments')
              .select('id, createdAt, processedAt, amount, status, amountRefunded, type')
              .in('status', COMPLETED_PAYMENT_STATUSES)
              .or('and(type.is.null),and(type.neq.refund)') // Grouped OR: (type IS NULL) OR (type != 'refund'), ANDed with status filter
              .limit(10000); // Safety limit to prevent memory issues

            if (error) {
              logger.error(
                'Error fetching payments for revenue trends',
                {
                  component: 'admin-dashboard-api',
                  action: 'payments_query_error',
                  metadata: {
                    error: error.message,
                    errorCode: error.code,
                    errorDetails: error.details,
                    errorHint: error.hint,
                    dateRange: { start: startDateStr, end: endDateStr },
                    isoRange: { start: currentStartISO, end: currentEndISO },
                  },
                },
                error
              );
              return { data: null, error };
            }

            // Log ALL payment query results (critical for debugging revenue issues)
            logger.info('Payment query results', {
              component: 'admin-dashboard-api',
              action: 'payment_query_results',
              metadata: {
                dateRange: { start: startDateStr, end: endDateStr },
                range,
                queryFilters: {
                  status: COMPLETED_PAYMENT_STATUSES,
                  typeFilter: 'type.is.null,type.neq.refund',
                },
                paymentsCount: payments?.length ?? 0,
                hasError: !!error,
                errorMessage: error ? getErrorMessage(error) : undefined,
                samplePayments: payments?.slice(0, 10).map((p: PaymentRow) => ({
                  id: p.id?.substring(0, 8),
                  status: p.status,
                  type: p.type,
                  amount: p.amount,
                  createdAt: p.createdAt,
                  processedAt: p.processedAt,
                  createdAtDateStr: toDateStringFromISO(p.createdAt),
                  processedAtDateStr: toDateStringFromISO(p.processedAt),
                  amountRefunded: p.amountRefunded,
                })),
                allPaymentsCount: allPaymentsDebug?.length ?? 0,
                allPaymentsStatuses: allPaymentsDebug?.map((p: PaymentRow) => p.status) ?? [],
              },
            });

            if (!payments || payments.length === 0) {
              logger.warn('No completed payments found in database', {
                component: 'admin-dashboard-api',
                action: 'no_payments_found',
                metadata: {
                  dateRange: { start: startDateStr, end: endDateStr },
                  range,
                  queryFilters: {
                    status: COMPLETED_PAYMENT_STATUSES,
                    typeFilter: 'type.is.null,type.neq.refund',
                  },
                  hasError: !!error,
                  errorMessage: error ? getErrorMessage(error) : undefined,
                  allPaymentsCount: allPaymentsDebug?.length ?? 0,
                  allPaymentsStatuses: allPaymentsDebug?.map((p: PaymentRow) => p.status) ?? [],
                  allPaymentsTypes: allPaymentsDebug?.map((p: PaymentRow) => p.type) ?? [],
                },
              });
            }

            // Final filter using date string comparison for precise date matching
            // This handles timezone issues and ensures we match the bucket_date format (YYYY-MM-DD)
            // IMPORTANT: Use local timezone for payment dates to match date range (which uses local time)
            const filteredPayments = (payments ?? []).filter((payment) => {
              // Use processedAt if available (actual payment date), otherwise use createdAt
              // Convert ISO strings to Date objects, which will be in local timezone when we extract date components
              const paymentDateStr = payment.processedAt
                ? toDateStringFromISO(payment.processedAt)
                : toDateStringFromISO(payment.createdAt);

              if (!paymentDateStr) return false;

              // Compare dates only (ignore time) to match bucket_date format
              // Both dates are now in local timezone format (YYYY-MM-DD)
              const isInRange = paymentDateStr >= startDateStr && paymentDateStr <= endDateStr;

              // Debug logging for filtered payments
              if (process.env.NODE_ENV === 'development' && isInRange) {
                logger.debug('Payment in range', {
                  component: 'admin-dashboard-api',
                  action: 'payment_date_filter',
                  metadata: {
                    paymentId: payment.id?.substring(0, 8),
                    processedAt: payment.processedAt,
                    createdAt: payment.createdAt,
                    paymentDateStr,
                    startDateStr,
                    endDateStr,
                    amount: payment.amount,
                    status: payment.status,
                    type: payment.type,
                  },
                });
              }

              return isInRange;
            });

            // Log payment query results (info level for production visibility)
            if (filteredPayments.length > 0 || (payments ?? []).length > 0) {
              logger.info('Payment query and filtering', {
                component: 'admin-dashboard-api',
                action: 'revenue_payment_query',
                metadata: {
                  range,
                  dateRange: {
                    start: startDateStr,
                    end: endDateStr,
                  },
                  queryResult: {
                    totalPayments: (payments ?? []).length,
                    filteredPayments: filteredPayments.length,
                  },
                  timezoneInfo: {
                    serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    serverOffset: new Date().getTimezoneOffset(),
                  },
                },
              });
            }

            if (process.env.NODE_ENV === 'development') {
              logger.debug('Payment query details', {
                component: 'admin-dashboard-api',
                action: 'revenue_payment_query_details',
                metadata: {
                  samplePayments: (payments ?? []).slice(0, 5).map((p: PaymentRow) => ({
                    id: p.id?.substring(0, 8),
                    processedAt: p.processedAt,
                    createdAt: p.createdAt,
                    amount: p.amount,
                    status: p.status,
                    type: p.type,
                    paymentDateStr: p.processedAt
                      ? toDateStringFromISO(p.processedAt) ?? ''
                      : toDateStringFromISO(p.createdAt) ?? '',
                    inRange:
                      (p.processedAt
                        ? toDateStringFromISO(p.processedAt) ?? ''
                        : toDateStringFromISO(p.createdAt) ?? '') >= startDateStr &&
                      (p.processedAt
                        ? toDateStringFromISO(p.processedAt) ?? ''
                        : toDateStringFromISO(p.createdAt) ?? '') <= endDateStr,
                  })),
                },
              });
            }

            if (filteredPayments.length === 0 && (payments ?? []).length > 0) {
              logger.warn('No payments found in date range after filtering', {
                component: 'admin-dashboard-api',
                action: 'revenue_date_filter_no_matches',
                metadata: {
                  range,
                  totalPayments: (payments ?? []).length,
                  dateRange: { start: startDateStr, end: endDateStr },
                  allPaymentDates: (payments ?? []).slice(0, 10).map((p: PaymentRow) => ({
                    processedAt: p.processedAt,
                    createdAt: p.createdAt,
                    dateStr: p.processedAt
                      ? toDateStringFromISO(p.processedAt)
                      : toDateStringFromISO(p.createdAt),
                    amount: p.amount,
                  })),
                },
              });
            }

            // Group payments by date
            const grouped = new Map<
              string,
              { gross_revenue: number; refunded_amount: number; payments_count: number }
            >();
            filteredPayments.forEach((payment) => {
              // Use processedAt if available (actual payment date), otherwise use createdAt
              const paymentDate = payment.processedAt
                ? new Date(payment.processedAt)
                : new Date(payment.createdAt);
              const date = toDateString(paymentDate);
              const entry = grouped.get(date) || {
                gross_revenue: 0,
                refunded_amount: 0,
                payments_count: 0,
              };
              const amount = Number(payment.amount ?? 0);
              const refunded = Number(payment.amountRefunded ?? 0);
              entry.gross_revenue += amount;
              entry.refunded_amount += refunded;
              entry.payments_count += 1;
              grouped.set(date, entry);

              // Debug logging for grouped payments
              if (process.env.NODE_ENV === 'development' && amount > 0) {
                logger.debug('Grouping payment', {
                  component: 'admin-dashboard-api',
                  action: 'payment_grouping',
                  metadata: {
                    date,
                    paymentId: payment.id?.substring(0, 8),
                    amount,
                    refunded,
                    netRevenue: amount - refunded,
                    paymentDate: paymentDate.toISOString(),
                  },
                });
              }
            });

            const result: RevenueTrendRow[] = Array.from(grouped.entries()).map(([bucket_date, values]) => ({
              bucket_date,
              ...values,
            }));

            // Enhanced logging for grouped results - ALWAYS log for debugging revenue issues
            const totalGross = result.reduce(
              (sum: number, r: RevenueTrendRow) => sum + Number(r.gross_revenue || 0),
              0
            );
            const totalRefunded = result.reduce(
              (sum: number, r: RevenueTrendRow) => sum + Number(r.refunded_amount || 0),
              0
            );
            const totalNet = totalGross - totalRefunded;

            logger.info('Revenue fallback grouping complete', {
              component: 'admin-dashboard-api',
              action: 'revenue_fallback_grouping',
              metadata: {
                range,
                dateRange: { start: startDateStr, end: endDateStr },
                totalPaymentsQueried: (payments ?? []).length,
                filteredPaymentsCount: filteredPayments.length,
                groupedDatesCount: result.length,
                groupedData: result.slice(0, 10).map((r: RevenueTrendRow) => ({
                  date: r.bucket_date,
                  gross: Number(r.gross_revenue || 0),
                  refunded: Number(r.refunded_amount || 0),
                  net: Number(r.gross_revenue || 0) - Number(r.refunded_amount || 0),
                  count: Number(r.payments_count || 0),
                })),
                totals: {
                  gross: totalGross,
                  refunded: totalRefunded,
                  net: totalNet,
                },
                hasRevenue: totalNet > 0,
              },
            });

            // ALWAYS return result, even if empty (chart will show zero-filled dates)
            return {
              data: result,
              error: null,
            };
          }
        ),
        safeQueryView(
          'mv_revenue_trends (previous)',
          async () => {
            // Use date strings (YYYY-MM-DD) for bucket_date queries, not ISO strings
            // bucket_date is a date column, so date strings work correctly
            const previousStartDateStr = toDateString(previousStart);
            const previousEndDateStr = toDateString(previousEnd);

            // Check materialized view for previous period
            logger.info('Querying previous period revenue trends', {
              component: 'admin-dashboard-api',
              action: 'previous_revenue_query',
              metadata: {
                range,
                previousStartDateStr,
                previousEndDateStr,
                previousStartISO: previousStart.toISOString(),
                previousEndISO: previousEnd.toISOString(),
              },
            });

            const result = await supabase
              .from('mv_revenue_trends')
              .select('bucket_date, gross_revenue, refunded_amount, payments_count')
              .gte('bucket_date', previousStartDateStr)
              .lte('bucket_date', previousEndDateStr)
              .order('bucket_date', { ascending: true });

            logger.info('Previous period revenue trends query result', {
              component: 'admin-dashboard-api',
              action: 'previous_revenue_query_result',
              metadata: {
                range,
                dataLength: Array.isArray(result.data) ? result.data.length : 0,
                hasError: !!result.error,
                sampleData: Array.isArray(result.data) ? result.data.slice(0, 3) : null,
              },
            });

            // Check if materialized view data is stale (same logic as current period)
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
              const viewDates = result.data.map((r: RevenueTrendRow) => r.bucket_date).sort();
              const firstDate = viewDates[0];
              const lastDate = viewDates[viewDates.length - 1];
              const today = toDateString(new Date());

              const daysSinceLastUpdate = Math.floor(
                (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
              );

              const isDataComplete =
                firstDate <= previousStartDateStr &&
                lastDate >= previousEndDateStr &&
                daysSinceLastUpdate <= 1;

              if (!isDataComplete) {
                logger.info(
                  'Previous period materialized view data is incomplete or stale, will use fallback',
                  {
                    component: 'admin-dashboard-api',
                    action: 'previous_mv_revenue_trends_stale',
                    metadata: {
                      range,
                      dateRange: { start: previousStartDateStr, end: previousEndDateStr },
                      viewDataRange: { start: firstDate, end: lastDate },
                      daysSinceLastUpdate,
                      viewDataLength: result.data.length,
                      today,
                    },
                  }
                );
                // Return error to trigger fallback
                const staleError: { message: string; code: string; details: string } = {
                  message: 'Materialized view data is stale',
                  code: 'STALE_DATA',
                  details: `View has data from ${firstDate} to ${lastDate}, but needs ${previousStartDateStr} to ${previousEndDateStr}`,
                };
                return {
                  data: result.data,
                  error: staleError,
                };
              }
            }

            return result;
          },
          async () => {
            // Note: Payment status is 'completed' when paid, not 'succeeded'
            // Query all completed payments and filter by previous period date range
            // Use processedAt for revenue date (when payment was actually completed), fallback to createdAt
            // Include all payment types (payment, deposit, additional_charge) but exclude refunds
            const startDateStr = toDateString(previousStart);
            const endDateStr = toDateString(previousEnd);
            // Note: previousStartISO and previousEndISO are available if needed for date range queries
            // const previousStartISO = previousStart.toISOString();
            // const previousEndISO = previousEnd.toISOString();

            // FIX: Use explicit AND logic by grouping the OR condition with parentheses
            // This ensures: (status IN completed_statuses) AND (type IS NULL OR type != 'refund')
            // Add safety limit to prevent memory issues with large datasets
            const { data: payments, error } = await supabase
              .from('payments')
              .select('createdAt, processedAt, amount, status, amountRefunded, type')
              .in('status', COMPLETED_PAYMENT_STATUSES)
              .or('and(type.is.null),and(type.neq.refund)') // Grouped OR: (type IS NULL) OR (type != 'refund'), ANDed with status filter
              .limit(10000); // Safety limit to prevent memory issues

            if (error) {
              logger.warn('Error fetching payments for previous period revenue trends', {
                component: 'admin-dashboard-api',
                action: 'previous_payments_query_error',
                metadata: {
                  error: error.message,
                  dateRange: { start: startDateStr, end: endDateStr },
                },
              });
              return { data: null, error };
            }

            // Filter payments that fall within the previous period date range based on processedAt or createdAt
            // Use date-only comparison with local timezone to match date range calculations
            const filteredPayments = (payments ?? []).filter((payment) => {
              // Use processedAt if available (actual payment date), otherwise use createdAt
              // Convert to local date string to match the date range format
              const paymentDateStr = payment.processedAt
                ? toDateStringFromISO(payment.processedAt)
                : toDateStringFromISO(payment.createdAt);

              if (!paymentDateStr) return false;

              // Compare dates only (ignore time) to match bucket_date format
              return paymentDateStr >= startDateStr && paymentDateStr <= endDateStr;
            });

            // Group payments by date (using local timezone to match date range)
            const grouped = new Map<
              string,
              { gross_revenue: number; refunded_amount: number; payments_count: number }
            >();
            filteredPayments.forEach((payment) => {
              // Use processedAt if available (actual payment date), otherwise use createdAt
              // Convert to local date string to match the date range format
              const date = payment.processedAt
                ? toDateStringFromISO(payment.processedAt)
                : toDateStringFromISO(payment.createdAt);

              if (!date) return; // Skip if no valid date

              const entry = grouped.get(date) || {
                gross_revenue: 0,
                refunded_amount: 0,
                payments_count: 0,
              };
              entry.gross_revenue += Number(payment.amount ?? 0);
              entry.refunded_amount += Number(payment.amountRefunded ?? 0);
              entry.payments_count += 1;
              grouped.set(date, entry);
            });

            const result: TrendPoint[] = Array.from(grouped.entries()).map(([bucket_date, values]) => ({
              bucket_date,
              gross_revenue: values.gross_revenue,
              refunded_amount: values.refunded_amount,
              payments_count: values.payments_count,
            }));

            // Enhanced logging for previous period fallback
            if (result.length > 0 || filteredPayments.length > 0) {
              const totalGross = result.reduce(
                (sum: number, r: TrendPoint) => sum + Number(r.gross_revenue || 0),
                0
              );
              const totalRefunded = result.reduce(
                (sum: number, r: TrendPoint) => sum + Number(r.refunded_amount || 0),
                0
              );
              const totalNet = totalGross - totalRefunded;

              logger.info('Previous period revenue fallback grouping complete', {
                component: 'admin-dashboard-api',
                action: 'previous_revenue_fallback_grouping',
                metadata: {
                  range,
                  dateRange: { start: startDateStr, end: endDateStr },
                  totalPaymentsQueried: (payments ?? []).length,
                  filteredPaymentsCount: filteredPayments.length,
                  groupedDatesCount: result.length,
                  groupedData: result.slice(0, 10).map((r: RevenueTrendRow) => ({
                    date: r.bucket_date,
                    gross: Number(r.gross_revenue || 0),
                    refunded: Number(r.refunded_amount || 0),
                    net: Number(r.gross_revenue || 0) - Number(r.refunded_amount || 0),
                    count: Number(r.payments_count || 0),
                  })),
                  totals: {
                    gross: totalGross,
                    refunded: totalRefunded,
                    net: totalNet,
                  },
                },
              });
            } else {
              logger.info('Previous period revenue fallback - no data found', {
                component: 'admin-dashboard-api',
                action: 'previous_revenue_fallback_no_data',
                metadata: {
                  range,
                  dateRange: { start: startDateStr, end: endDateStr },
                  totalPaymentsQueried: (payments ?? []).length,
                  filteredPaymentsCount: filteredPayments.length,
                },
              });
            }

            return {
              data: result,
              error: null,
            };
          }
        ),
        safeQueryView(
          'mv_booking_trends',
          async () => {
            const result = await supabase
              .from('mv_booking_trends')
              .select(
                'bucket_date, total_bookings, completed_bookings, cancelled_bookings, active_bookings'
              )
              .gte('bucket_date', currentStartISO)
              .lte('bucket_date', currentEndISO)
              .order('bucket_date', { ascending: true });

            // Check if materialized view data covers the requested date range
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
              const viewDates = result.data.map((r: BookingTrendPoint) => r.bucket_date).sort();
              const firstDate = viewDates[0];
              const lastDate = viewDates[viewDates.length - 1];

              // Data is complete if it covers the full range
              const isDataComplete = firstDate <= currentStartISO && lastDate >= currentEndISO;

              if (!isDataComplete) {
                logger.info(
                  'Materialized view booking trends data is incomplete, will use fallback',
                  {
                    component: 'admin-dashboard-api',
                    action: 'mv_booking_trends_incomplete',
                    metadata: {
                      range,
                      dateRange: { start: currentStartISO, end: currentEndISO },
                      viewDataRange: { start: firstDate, end: lastDate },
                      viewDataLength: result.data.length,
                    },
                  }
                );
                // Return error to trigger fallback
                const incompleteError: { message: string; code: string; details: string } = {
                  message: 'Materialized view data is incomplete',
                  code: 'STALE_DATA',
                  details: `View has data from ${firstDate} to ${lastDate}, but needs ${currentStartISO} to ${currentEndISO}`,
                };
                return {
                  data: result.data,
                  error: incompleteError,
                };
              }
            }

            return result;
          },
          async () => {
            const { data: bookings, error } = await supabase
              .from('bookings')
              .select('createdAt, status')
              .gte('createdAt', currentStart.toISOString())
              .lte('createdAt', currentEnd.toISOString())
              .limit(10000); // Safety limit to prevent memory issues
            if (error) return { data: null, error };
            const grouped = new Map<
              string,
              {
                total_bookings: number;
                completed_bookings: number;
                cancelled_bookings: number;
                active_bookings: number;
              }
            >();
            (bookings ?? []).forEach((booking) => {
              const date = toDateString(new Date(booking.createdAt));
              const entry = grouped.get(date) || {
                total_bookings: 0,
                completed_bookings: 0,
                cancelled_bookings: 0,
                active_bookings: 0,
              };
              entry.total_bookings += 1;
              if (booking.status === 'completed') entry.completed_bookings += 1;
              if (booking.status === 'cancelled') entry.cancelled_bookings += 1;
              if (ACTIVE_BOOKING_STATUSES.includes(booking.status)) entry.active_bookings += 1;
              grouped.set(date, entry);
            });
            return {
              data: Array.from(grouped.entries()).map(([bucket_date, values]) => ({
                bucket_date,
                ...values,
              })) as BookingTrendPoint[],
              error: null,
            };
          }
        ),
        safeQueryView(
          'mv_booking_trends (previous)',
          async () => {
            // Use date strings (YYYY-MM-DD) for bucket_date queries, not ISO strings
            const previousStartDateStr = toDateString(previousStart);
            const previousEndDateStr = toDateString(previousEnd);

            // Check materialized view for previous period
            const result = await supabase
              .from('mv_booking_trends')
              .select(
                'bucket_date, total_bookings, completed_bookings, cancelled_bookings, active_bookings'
              )
              .gte('bucket_date', previousStartDateStr)
              .lte('bucket_date', previousEndDateStr)
              .order('bucket_date', { ascending: true });

            // Check if materialized view data is stale (same logic as current period and revenue previous)
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
              const viewDates = result.data.map((r: BookingTrendPoint) => r.bucket_date).sort();
              const firstDate = viewDates[0];
              const lastDate = viewDates[viewDates.length - 1];
              const today = toDateString(new Date());

              const daysSinceLastUpdate = Math.floor(
                (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
              );

              const isDataComplete =
                firstDate <= previousStartDateStr &&
                lastDate >= previousEndDateStr &&
                daysSinceLastUpdate <= 1;

              if (!isDataComplete) {
                logger.info(
                  'Previous period booking trends materialized view data is incomplete or stale, will use fallback',
                  {
                    component: 'admin-dashboard-api',
                    action: 'previous_mv_booking_trends_stale',
                    metadata: {
                      range,
                      dateRange: { start: previousStartDateStr, end: previousEndDateStr },
                      viewDataRange: { start: firstDate, end: lastDate },
                      daysSinceLastUpdate,
                      viewDataLength: result.data.length,
                      today,
                    },
                  }
                );
                // Return error to trigger fallback
                const staleError: { message: string; code: string; details: string } = {
                  message: 'Materialized view data is stale',
                  code: 'STALE_DATA',
                  details: `View has data from ${firstDate} to ${lastDate}, but needs ${previousStartDateStr} to ${previousEndDateStr}`,
                };
                return {
                  data: result.data,
                  error: staleError,
                };
              }
            }

            return result;
          },
          async () => {
            const { data: bookings, error } = await supabase
              .from('bookings')
              .select('createdAt, status')
              .gte('createdAt', previousStart.toISOString())
              .lte('createdAt', previousEnd.toISOString())
              .limit(10000); // Safety limit to prevent memory issues
            if (error) return { data: null, error };
            const grouped = new Map<
              string,
              {
                total_bookings: number;
                completed_bookings: number;
                cancelled_bookings: number;
                active_bookings: number;
              }
            >();
            (bookings ?? []).forEach((booking) => {
              const date = toDateString(new Date(booking.createdAt));
              const entry = grouped.get(date) || {
                total_bookings: 0,
                completed_bookings: 0,
                cancelled_bookings: 0,
                active_bookings: 0,
              };
              entry.total_bookings += 1;
              if (booking.status === 'completed') entry.completed_bookings += 1;
              if (booking.status === 'cancelled') entry.cancelled_bookings += 1;
              if (ACTIVE_BOOKING_STATUSES.includes(booking.status)) entry.active_bookings += 1;
              grouped.set(date, entry);
            });
            return {
              data: Array.from(grouped.entries()).map(([bucket_date, values]) => ({
                bucket_date,
                ...values,
              })) as BookingTrendPoint[],
              error: null,
            };
          }
        ),
        safeQueryView('mv_equipment_utilization', async () => {
          const result = await supabase
            .from('mv_equipment_utilization')
            .select('snapshot_date, equipment_id, utilization_pct, hours_used, revenue_generated')
            .gte('snapshot_date', currentStartISO)
            .lte('snapshot_date', currentEndISO);
          return { data: result.data, error: result.error };
        }),
        supabase
          .from('equipment')
          .select(
            'id, unitId, make, model, status, utilization_rate, total_rental_days, revenue_generated'
          ),
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .not('role', 'in', '("admin","super_admin")'),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('status', ACTIVE_BOOKING_STATUSES)
          .gte('createdAt', currentStart.toISOString())
          .lte('createdAt', currentEnd.toISOString()),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('createdAt', currentStart.toISOString())
          .lte('createdAt', currentEnd.toISOString()),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'cancelled')
          .gte('createdAt', currentStart.toISOString())
          .lte('createdAt', currentEnd.toISOString()),
        safeQueryView('alerts', async () => {
          const result = await supabase
            .from('alerts')
            .select(
              'id, type, severity, entity_type, entity_id, summary, details, detected_at, acknowledged_at, acknowledged_by, status, created_at'
            )
            .order('detected_at', { ascending: false })
            .limit(10);
          return { data: result.data, error: result.error };
        }),
        safeQueryView('mv_alert_candidates', async () => {
          const result = await supabase
            .from('mv_alert_candidates')
            .select(
              'id, type, severity, entity_type, entity_id, summary, details, detected_at, acknowledged_at, acknowledged_by, status, created_at'
            )
            .order('detected_at', { ascending: false })
            .limit(10);
          return { data: result.data, error: result.error };
        }),
      ]);
    } catch (queryError) {
      logger.error(
        'Error executing dashboard queries',
        {
          component: 'admin-dashboard-api',
          action: 'query_execution_failed',
          metadata: {
            error: queryError instanceof Error ? queryError.message : String(queryError),
            range,
            errorStack: queryError instanceof Error ? queryError.stack : undefined,
          },
        },
        queryError instanceof Error ? queryError : new Error(String(queryError))
      );
      throw queryError;
    }

    const [
      dashboardKpiResult,
      revenueTrendResult,
      previousRevenueTrendResult,
      bookingTrendResult,
      previousBookingTrendResult,
      utilizationResult,
      equipmentSummaryResult,
      customerCountResult,
      activeBookingsCountResult,
      completedBookingsCountResult,
      cancelledBookingsCountResult,
      alertsResult,
      alertCandidatesResult,
    ] = queryResults;

    const revenueTrend = (revenueTrendResult.data ?? []) as TrendPoint[];
    const previousRevenueTrend = (previousRevenueTrendResult.data ?? []) as TrendPoint[];
    const bookingTrend = (bookingTrendResult.data ?? []) as BookingTrendPoint[];
    const previousBookingTrend = (previousBookingTrendResult.data ?? []) as BookingTrendPoint[];

    // Log revenue trend data for debugging
    logger.info('Revenue trend data extracted', {
      component: 'admin-dashboard-api',
      action: 'revenue_trend_extracted',
      metadata: {
        range,
        revenueTrendLength: revenueTrend.length,
        revenueTrendError: revenueTrendResult.error ? revenueTrendResult.error.message : null,
        revenueTrendSample: revenueTrend.slice(0, 5).map((r: TrendPoint) => ({
          bucket_date: r.bucket_date,
          gross_revenue: r.gross_revenue,
          refunded_amount: r.refunded_amount,
          net_revenue: Number(r.gross_revenue ?? 0) - Number(r.refunded_amount ?? 0),
          payments_count: r.payments_count,
        })),
        hasRevenueData: revenueTrend.some((r: TrendPoint) => {
          const net = Number(r.gross_revenue ?? 0) - Number(r.refunded_amount ?? 0);
          return net > 0;
        }),
      },
    });

    // Comprehensive logging for monthly ranges
    if (range === 'month') {
      logger.info('Monthly view data check', {
        component: 'admin-dashboard-api',
        action: 'monthly_view_data_check',
        metadata: {
          range,
          revenueTrendLength: revenueTrend.length,
          previousRevenueTrendLength: previousRevenueTrend.length,
          bookingTrendLength: bookingTrend.length,
          previousBookingTrendLength: previousBookingTrend.length,
          previousRevenueSample: previousRevenueTrend.slice(0, 5).map((r: TrendPoint) => ({
            bucket_date: r.bucket_date,
            gross_revenue: r.gross_revenue,
            refunded_amount: r.refunded_amount,
            net_revenue: Number(r.gross_revenue ?? 0) - Number(r.refunded_amount ?? 0),
          })),
          previousBookingSample: previousBookingTrend.slice(0, 5),
          previousRevenueHasData: previousRevenueTrend.some((r: TrendPoint) => {
            const net = Number(r.gross_revenue ?? 0) - Number(r.refunded_amount ?? 0);
            return net > 0;
          }),
          previousBookingHasData: previousBookingTrend.some(
            (b: BookingTrendPoint) => Number(b.total_bookings ?? 0) > 0
          ),
        },
      });
    }
    const utilizationRows = (utilizationResult.data ?? []) as EquipmentUtilizationPoint[];

    const totalRevenue = revenueTrend.reduce(
      (acc, row) => acc + Number(row.gross_revenue ?? 0) - Number(row.refunded_amount ?? 0),
      0
    );
    const previousRevenue = previousRevenueTrend.reduce((acc, row) => {
      const gross = Number(row.gross_revenue ?? 0);
      const refunded = Number(row.refunded_amount ?? 0);
      return acc + gross - refunded;
    }, 0);

    const totalBookings = bookingTrend.reduce(
      (acc, row) => acc + Number(row.total_bookings ?? 0),
      0
    );
    const previousTotalBookings = previousBookingTrend.reduce(
      (acc, row) => acc + Number(row.total_bookings ?? 0),
      0
    );

    // Log previous revenue calculation for debugging
    logger.info('Previous revenue calculation', {
      component: 'admin-dashboard-api',
      action: 'previous_revenue_calculation',
      metadata: {
        range,
        previousRevenueTrendLength: previousRevenueTrend.length,
        previousRevenue,
        previousRevenueRaw: previousRevenueTrend.reduce(
          (acc, row) => acc + Number(row.gross_revenue ?? 0),
          0
        ),
        previousRefundedRaw: previousRevenueTrend.reduce(
          (acc, row) => acc + Number(row.refunded_amount ?? 0),
          0
        ),
        sampleData: previousRevenueTrend.slice(0, 5).map((r: TrendPoint) => ({
          date: r.bucket_date,
          gross: Number(r.gross_revenue ?? 0),
          refunded: Number(r.refunded_amount ?? 0),
          net: Number(r.gross_revenue ?? 0) - Number(r.refunded_amount ?? 0),
        })),
      },
    });

    // Log growth calculation for debugging
    logger.info('Growth calculation', {
      component: 'admin-dashboard-api',
      action: 'growth_calculation',
      metadata: {
        range,
        currentRevenue: totalRevenue,
        previousRevenue,
        revenueGrowth: calculateGrowth(totalRevenue, previousRevenue),
        currentBookings: totalBookings,
        previousBookings: previousTotalBookings,
        bookingsGrowth: calculateGrowth(totalBookings, previousTotalBookings),
        currentPeriodDataPoints: revenueTrend.length,
        previousPeriodDataPoints: previousRevenueTrend.length,
        previousPeriodSample: previousRevenueTrend.slice(0, 5),
      },
    });
    const completedBookings = bookingTrend.reduce(
      (acc, row) => acc + Number(row.completed_bookings ?? 0),
      0
    );
    const cancelledBookings = bookingTrend.reduce(
      (acc, row) => acc + Number(row.cancelled_bookings ?? 0),
      0
    );

    const equipmentSummaryRows = (equipmentSummaryResult.data ?? []) as Array<{
      id: string;
      unitId: string | null;
      make: string | null;
      model: string | null;
      status: string | null;
      utilization_rate: string | number | null;
      total_rental_days: number | null;
      revenue_generated: string | number | null;
    }>;
    const activeEquipment = equipmentSummaryRows.filter(
      (row) =>
        !['out_of_service', 'unavailable'].includes((row.status ?? '').toString().toLowerCase())
    ).length;
    const equipmentUtilization =
      equipmentSummaryRows.length > 0
        ? equipmentSummaryRows.reduce(
            (acc, row) =>
              acc + Number((row as { utilization_rate?: string | number }).utilization_rate ?? 0),
            0
          ) / equipmentSummaryRows.length
        : 0;

    const totalCustomers = customerCountResult.count ?? 0;
    const activeBookings =
      activeBookingsCountResult.count ??
      bookingTrend.reduce((acc, row) => acc + Number(row.active_bookings ?? 0), 0);
    const completedBookingsTotal = completedBookingsCountResult.count ?? completedBookings;
    const cancelledBookingsTotal = cancelledBookingsCountResult.count ?? cancelledBookings;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    const summary = {
      totalBookings,
      totalRevenue,
      activeEquipment,
      totalCustomers,
      bookingsGrowth: calculateGrowth(totalBookings, previousTotalBookings),
      revenueGrowth: calculateGrowth(totalRevenue, previousRevenue),
      activeBookings,
      completedBookings: completedBookingsTotal,
      cancelledBookings: cancelledBookingsTotal,
      averageBookingValue,
      equipmentUtilization,
      snapshotDate: (dashboardKpiResult.data as { snapshot_date?: string } | null)?.snapshot_date ?? null,
      lastGeneratedAt: (dashboardKpiResult.data as { generated_at?: string } | null)?.generated_at ?? null,
    };

    return NextResponse.json({
      summary,
      charts: {
        revenue: revenueTrend,
        bookings: bookingTrend,
        utilization: utilizationRows,
      },
      chartsV2: (() => {
        const chartsPayload = buildChartsPayload({
          revenueCurrent: revenueTrend,
          revenuePrevious: previousRevenueTrend,
          bookingCurrent: bookingTrend,
          bookingPrevious: previousBookingTrend,
          utilizationSnapshots: utilizationRows,
          equipmentSummary: equipmentSummaryRows,
        });

        // Log chartsV2 payload for monthly ranges
        if (range === 'month' && process.env.NODE_ENV === 'development') {
          logger.info('ChartsV2 payload for monthly view', {
            component: 'admin-dashboard-api',
            action: 'charts_v2_payload_monthly',
            metadata: {
              revenueSeriesLength: chartsPayload.revenue.series.length,
              revenueComparisonLength: chartsPayload.revenue.comparison.length,
              bookingSeriesLength: chartsPayload.bookings.series.length,
              bookingComparisonLength: chartsPayload.bookings.comparison.length,
              revenueComparisonSample: chartsPayload.revenue.comparison.slice(0, 5),
              revenueComparisonHasData: chartsPayload.revenue.comparison.some(
                (r) => r.netRevenue > 0
              ),
            },
          });
        }

        return chartsPayload;
      })(),
      metadata: {
        // Use current time since we're querying live data (payments table fallback provides real-time data)
        generatedAt: new Date().toISOString(),
        snapshotDate: (dashboardKpiResult.data as { snapshot_date?: string } | null)?.snapshot_date ?? null,
        range,
        comparisonRange: {
          start: previousStart.toISOString(),
          end: previousEnd.toISOString(),
        },
      },
      alerts: {
        active: alertsResult.data ?? [],
        candidates: alertCandidatesResult.data ?? [],
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const dateRange = searchParams.get('range') || 'month';

    logger.error(
      'Admin dashboard overview error',
      {
        component: 'admin-dashboard-api',
        action: 'overview_fetch_failed',
        metadata: {
          error: errorMessage,
          range: dateRange,
          hasStack: !!errorStack,
        },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    // Return more detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          error: 'Failed to fetch dashboard overview',
          details: errorMessage,
          stack: errorStack,
        },
        { status: 500 }
      );
    }

    // In production, return generic error message (don't expose stack traces)
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard overview',
        message: 'An error occurred while loading dashboard data. Please try again later.',
      },
      { status: 500 }
    );
  }
}

function buildChartsPayload(params: {
  revenueCurrent: TrendPoint[];
  revenuePrevious: TrendPoint[];
  bookingCurrent: BookingTrendPoint[];
  bookingPrevious: BookingTrendPoint[];
  utilizationSnapshots: EquipmentUtilizationPoint[];
  equipmentSummary: Array<{
    id: string;
    unitId: string | null;
    make: string | null;
    model: string | null;
    status: string | null;
    utilization_rate: string | number | null;
    total_rental_days: number | null;
    revenue_generated: string | number | null;
  }>;
}) {
  // Log input data for debugging
  logger.info('Building charts payload', {
    component: 'admin-dashboard-api',
    action: 'build_charts_payload',
    metadata: {
      revenueCurrentLength: params.revenueCurrent.length,
      revenueCurrentSample: params.revenueCurrent.slice(0, 3).map((r: TrendPoint) => ({
        bucket_date: r.bucket_date,
        gross_revenue: r.gross_revenue,
        refunded_amount: r.refunded_amount,
        payments_count: r.payments_count,
      })),
    },
  });

  const revenueSeries = params.revenueCurrent.map((row: TrendPoint) => {
    const gross = Number(row.gross_revenue ?? 0);
    const refunds = Number(row.refunded_amount ?? 0);
    const net = gross - refunds;
    const result = {
      date: row.bucket_date,
      grossRevenue: gross,
      refundedAmount: refunds,
      netRevenue: net,
      paymentsCount: Number(row.payments_count ?? 0),
    };

    // Debug logging for data transformation
    if (process.env.NODE_ENV === 'development' && net > 0) {
      logger.debug('Transforming revenue data point', {
        component: 'admin-dashboard-api',
        action: 'revenue_data_transform',
        metadata: {
          original: {
            bucket_date: row.bucket_date,
            gross_revenue: row.gross_revenue,
            refunded_amount: row.refunded_amount,
            payments_count: row.payments_count,
          },
          transformed: result,
        },
      });
    }

    return result;
  });

  const revenueTotals = revenueSeries.reduce(
    (acc, row) => {
      acc.grossRevenue += row.grossRevenue;
      acc.refundedAmount += row.refundedAmount;
      acc.netRevenue += row.netRevenue;
      return acc;
    },
    { grossRevenue: 0, refundedAmount: 0, netRevenue: 0 }
  );

  const revenueComparison = params.revenuePrevious.map((row: RevenueTrendRow) => {
    const gross = Number(row.gross_revenue ?? 0);
    const refunds = Number(row.refunded_amount ?? 0);
    const net = gross - refunds;
    return {
      date: row.bucket_date,
      netRevenue: net,
    };
  });

  // Log comparison data for ALL ranges (not just monthly)
  if (process.env.NODE_ENV === 'development') {
    const sampleComparison = revenueComparison.slice(0, 5);
    logger.debug('Revenue comparison data built', {
      component: 'admin-dashboard-api',
      action: 'revenue_comparison_built',
      metadata: {
        range: params.revenuePrevious.length > 0 ? 'unknown' : 'empty', // Will be set by caller
        comparisonLength: revenueComparison.length,
        comparisonWithData: revenueComparison.filter((r) => r.netRevenue > 0).length,
        comparisonIsEmpty: revenueComparison.length === 0,
        sampleComparison,
        totalComparisonRevenue: revenueComparison.reduce((sum, r) => sum + r.netRevenue, 0),
      },
    });
  }

  const bookingSeries = params.bookingCurrent.map((row) => ({
    date: row.bucket_date,
    total: Number(row.total_bookings ?? 0),
    completed: Number(row.completed_bookings ?? 0),
    cancelled: Number(row.cancelled_bookings ?? 0),
    active: Number(row.active_bookings ?? 0),
  }));

  const bookingComparison = params.bookingPrevious.map((row) => ({
    date: row.bucket_date,
    total: Number(row.total_bookings ?? 0),
    completed: Number(row.completed_bookings ?? 0),
    cancelled: Number(row.cancelled_bookings ?? 0),
    active: Number(row.active_bookings ?? 0),
  }));

  const bookingTotals = bookingSeries.reduce(
    (acc, row) => {
      acc.total += row.total;
      acc.completed += row.completed;
      acc.cancelled += row.cancelled;
      return acc;
    },
    { total: 0, completed: 0, cancelled: 0 }
  );

  const completionRate =
    bookingTotals.total > 0 ? (bookingTotals.completed / bookingTotals.total) * 100 : 0;
  const cancellationRate =
    bookingTotals.total > 0 ? (bookingTotals.cancelled / bookingTotals.total) * 100 : 0;

  const utilizationMap = new Map<string, EquipmentUtilizationPoint>();
  for (const snapshot of params.utilizationSnapshots) {
    const existing = utilizationMap.get(snapshot.equipment_id);
    if (
      !existing ||
      new Date(snapshot.snapshot_date).getTime() > new Date(existing.snapshot_date).getTime()
    ) {
      utilizationMap.set(snapshot.equipment_id, snapshot);
    }
  }

  interface EquipmentSummaryItem {
    id: string;
    unitId: string | null;
    make: string | null;
    model: string | null;
    status?: string | null;
    utilization_rate?: number | string | null;
    total_rental_days?: number | null;
    revenue_generated?: number | string | null;
  }

  const utilizationDetails = params.equipmentSummary.map((item: EquipmentSummaryItem) => {
    const latestSnapshot = utilizationMap.get(item.id);
    const utilizationRateValue = item.utilization_rate;
    // Calculate utilization percentage and cap at 100%
    // Utilization can't exceed 100% (equipment can't be used more than 100% of available time)
    const rawUtilizationPct =
      latestSnapshot !== undefined
        ? Number(latestSnapshot.utilization_pct ?? 0)
        : typeof utilizationRateValue === 'number' ? utilizationRateValue : typeof utilizationRateValue === 'string' ? Number(utilizationRateValue) || 0 : 0;
    const utilizationPct = Math.min(100, Math.max(0, rawUtilizationPct)); // Cap between 0-100%

    // Convert hours_used to days (hours / 24)
    // If we have a snapshot with hours_used, convert to days
    // Otherwise use total_rental_days which is already in days
    const rentedDays = latestSnapshot
      ? Math.round((Number(latestSnapshot.hours_used ?? 0) / 24) * 10) / 10 // Round to 1 decimal place
      : Number(item.total_rental_days ?? 0);

    return {
      equipmentId: item.id,
      label: buildEquipmentLabel(item),
      status: (item.status ?? 'unknown') as string,
      utilizationPct,
      rentedDays,
      revenue:
        latestSnapshot !== undefined
          ? Number(latestSnapshot.revenue_generated ?? 0)
          : Number(item.revenue_generated ?? 0),
    };
  });

  const utilizationSummary = utilizationDetails.reduce(
    (acc, item) => {
      acc.averageUtilization += item.utilizationPct;
      if (['rented', 'maintenance'].includes(item.status.toLowerCase())) {
        acc.activeOrMaintenanceCount += 1;
      }
      acc.lifetimeRevenue += item.revenue;
      return acc;
    },
    { averageUtilization: 0, activeOrMaintenanceCount: 0, lifetimeRevenue: 0 }
  );

  if (utilizationDetails.length > 0) {
    utilizationSummary.averageUtilization /= utilizationDetails.length;
  }

  return {
    revenue: {
      series: revenueSeries,
      comparison: revenueComparison,
      totals: revenueTotals,
    },
    bookings: {
      series: bookingSeries,
      comparison: bookingComparison,
      totals: bookingTotals,
      conversion: {
        completionRate,
        cancellationRate,
      },
    },
    utilization: {
      summary: utilizationSummary,
      equipment: utilizationDetails,
    },
  };
}

function buildEquipmentLabel(item: {
  unitId: string | null;
  make: string | null;
  model: string | null;
}) {
  const parts = [item.make, item.model].filter(Boolean);
  const base = parts.length > 0 ? parts.join(' ') : 'Equipment';
  return item.unitId ? `${base} (${item.unitId})` : base;
}
