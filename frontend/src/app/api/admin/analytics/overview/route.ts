import { NextRequest, NextResponse } from 'next/server';

import { COMPLETED_PAYMENT_STATUSES } from '@/lib/constants/payment-status';
import { getErrorMessage } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { AnalyticsData, DateRange } from '@/lib/admin/analytics-server';

/**
 * Converts a Date to YYYY-MM-DD format using LOCAL timezone
 * This ensures consistency with date range calculations which use local time
 */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Resolve date ranges for analytics - EXACT copy from dashboard API route
 * Week uses -6 days (7 days total including today) to match dashboard
 */
function resolveDateRanges(range: DateRange) {
  const now = new Date();
  const currentStart = new Date(now);
  const currentEnd = new Date(now);
  let previousStart = new Date(now);
  let previousEnd = new Date(now);

  switch (range) {
    case 'week': {
      // Week: 7 days total (today + 6 days back) - EXACT match to dashboard
      currentStart.setDate(currentStart.getDate() - 6);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setDate(previousStart.getDate() - 13);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(previousEnd.getDate() - 7);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    }
    case 'month': {
      currentStart.setMonth(currentStart.getMonth() - 1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousEnd = new Date(currentStart);
      previousEnd.setTime(previousEnd.getTime() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      previousStart = new Date(previousEnd);
      previousStart.setMonth(previousStart.getMonth() - 1);
      previousStart.setHours(0, 0, 0, 0);
      break;
    }
    case 'quarter': {
      currentStart.setMonth(currentStart.getMonth() - 3);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousEnd = new Date(currentStart);
      previousEnd.setTime(previousEnd.getTime() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      previousStart = new Date(previousEnd);
      previousStart.setMonth(previousStart.getMonth() - 3);
      previousStart.setHours(0, 0, 0, 0);
      break;
    }
    case 'year': {
      currentStart.setFullYear(currentStart.getFullYear() - 1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousEnd = new Date(currentStart);
      previousEnd.setTime(previousEnd.getTime() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      previousStart = new Date(previousEnd);
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      previousStart.setHours(0, 0, 0, 0);
      break;
    }
    default: {
      // Default to month
      currentStart.setMonth(currentStart.getMonth() - 1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousEnd = new Date(currentStart);
      previousEnd.setTime(previousEnd.getTime() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      previousStart = new Date(previousEnd);
      previousStart.setMonth(previousStart.getMonth() - 1);
      previousStart.setHours(0, 0, 0, 0);
      break;
    }
  }

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
}

export async function GET(request: NextRequest) {
  // Rate limit FIRST - moderate for read operations (EXACT match to dashboard)
  const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  const { searchParams } = new URL(request.url);
  const rangeParam = (searchParams.get('range') as DateRange | null) || 'month';

  // Validate range parameter
  const validRanges: DateRange[] = ['week', 'month', 'quarter', 'year'];
  if (!validRanges.includes(rangeParam)) {
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

    // Resolve date ranges using EXACT dashboard logic
    const { currentStart, currentEnd, previousStart, previousEnd } = resolveDateRanges(rangeParam);

    // Fetch bookings for current period
    const { data: currentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('totalAmount, createdAt, status, customerId')
      .gte('createdAt', currentStart.toISOString())
      .lte('createdAt', currentEnd.toISOString());

    if (bookingsError) {
      logger.error('Error fetching bookings for analytics', {
        component: 'analytics-api',
        action: 'fetch_bookings_error',
        metadata: {
          error: bookingsError.message,
          details: bookingsError.details,
          code: bookingsError.code,
          dateRange: rangeParam,
          startDate: currentStart.toISOString(),
          endDate: currentEnd.toISOString(),
        },
      });
      throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
    }

    // Fetch payments for current period
    const [currentStripePayments, currentManualPayments] = await Promise.all([
      supabase
        .from('payments')
        .select('amount, status, createdAt')
        .in('status', COMPLETED_PAYMENT_STATUSES)
        .eq('type', 'payment')
        .gte('createdAt', currentStart.toISOString())
        .lte('createdAt', currentEnd.toISOString()),
      supabase
        .from('manual_payments')
        .select('amount, status, created_at')
        .eq('status', 'completed')
        .gte('created_at', currentStart.toISOString())
        .lte('created_at', currentEnd.toISOString()),
    ]);

    if (currentStripePayments.error) throw currentStripePayments.error;
    if (currentManualPayments.error) throw currentManualPayments.error;

    // Fetch payments for previous period (for growth calculation)
    const [previousStripePayments, previousManualPayments] = await Promise.all([
      supabase
        .from('payments')
        .select('amount, status, createdAt')
        .in('status', COMPLETED_PAYMENT_STATUSES)
        .eq('type', 'payment')
        .gte('createdAt', previousStart.toISOString())
        .lt('createdAt', currentStart.toISOString()),
      supabase
        .from('manual_payments')
        .select('amount, status, created_at')
        .eq('status', 'completed')
        .gte('created_at', previousStart.toISOString())
        .lt('created_at', currentStart.toISOString()),
    ]);

    if (previousStripePayments.error) throw previousStripePayments.error;
    if (previousManualPayments.error) throw previousManualPayments.error;

    // Calculate revenue
    const currentStripeRevenue =
      (currentStripePayments.data ?? []).reduce(
        (sum, p: any) => sum + Number(p.amount ?? 0),
        0
      ) || 0;
    const currentManualRevenue =
      (currentManualPayments.data ?? []).reduce(
        (sum, p: any) => sum + Number(p.amount ?? 0),
        0
      ) || 0;
    const totalRevenue = currentStripeRevenue + currentManualRevenue;

    const previousStripeRevenue =
      (previousStripePayments.data ?? []).reduce(
        (sum, p: any) => sum + Number(p.amount ?? 0),
        0
      ) || 0;
    const previousManualRevenue =
      (previousManualPayments.data ?? []).reduce(
        (sum, p: any) => sum + Number(p.amount ?? 0),
        0
      ) || 0;
    const previousRevenue = previousStripeRevenue + previousManualRevenue;

    // Aggregate revenue by date
    const revenueByDate = new Map<string, { revenue: number; bookings: number }>();

    currentStripePayments.data?.forEach((payment: any) => {
      const paymentDate = toDateString(new Date(payment.createdAt));
      const current = revenueByDate.get(paymentDate) || { revenue: 0, bookings: 0 };
      revenueByDate.set(paymentDate, {
        revenue: current.revenue + Number(payment.amount ?? 0),
        bookings: current.bookings,
      });
    });

    currentManualPayments.data?.forEach((payment: any) => {
      const paymentDate = toDateString(new Date(payment.created_at));
      const current = revenueByDate.get(paymentDate) || { revenue: 0, bookings: 0 };
      revenueByDate.set(paymentDate, {
        revenue: current.revenue + Number(payment.amount ?? 0),
        bookings: current.bookings,
      });
    });

    currentBookings?.forEach((booking: any) => {
      const date = toDateString(new Date(booking.createdAt));
      const current = revenueByDate.get(date) || { revenue: 0, bookings: 0 };
      revenueByDate.set(date, {
        revenue: current.revenue,
        bookings: current.bookings + 1,
      });
    });

    const revenueData = Array.from(revenueByDate.entries())
      .map(([date, { revenue, bookings }]) => ({ date, revenue, bookings }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const growthPercentage =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : totalRevenue > 0
          ? 100
          : 0;

    const daysDiff = Math.max(
      1,
      Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    const averageDailyRevenue = totalRevenue / daysDiff;

    // Bookings analytics
    const bookingsByDate = new Map<string, { total: number; completed: number; cancelled: number }>();
    currentBookings?.forEach((booking: any) => {
      const date = toDateString(new Date(booking.createdAt));
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
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalBookings = currentBookings?.length || 0;
    const completedBookings = currentBookings?.filter((b: any) => b.status === 'completed').length || 0;
    const cancelledBookings = currentBookings?.filter((b: any) => b.status === 'cancelled').length || 0;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    // Equipment analytics
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, model, make, serialNumber, dailyRate, status');

    if (equipmentError) throw equipmentError;

    const equipmentWithStats = await Promise.all(
      (equipment || []).map(async (eq: any) => {
        const { data: equipmentBookings } = await supabase
          .from('bookings')
          .select('totalAmount, status, startDate, endDate')
          .eq('equipmentId', eq.id)
          .gte('createdAt', currentStart.toISOString())
          .lte('createdAt', currentEnd.toISOString());

        const revenue =
          equipmentBookings?.reduce(
            (sum: number, b: any) => sum + parseFloat(b.totalAmount || '0'),
            0
          ) || 0;

        const totalDays = daysDiff;
        let daysBooked = 0;
        equipmentBookings?.forEach((booking: any) => {
          if (booking.status !== 'cancelled') {
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            const bookingDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
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
        ? equipmentWithStats.reduce((sum, e) => sum + e.utilizationRate, 0) / equipmentWithStats.length
        : 0;

    const topPerformer = equipmentWithStats.reduce(
      (max, e) => (e.utilizationRate > max.utilizationRate ? e : max),
      equipmentWithStats[0] || { equipmentId: '', equipmentName: 'N/A', utilizationRate: 0 }
    );

    // Customer analytics
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, createdAt');

    const totalCustomers = allUsers?.length || 0;

    const { data: newUsers } = await supabase
      .from('users')
      .select('id, createdAt')
      .gte('createdAt', currentStart.toISOString())
      .lte('createdAt', currentEnd.toISOString());

    const newCustomers = newUsers?.length || 0;

    const customersByDate = new Map<string, { new: number; returning: number }>();
    currentBookings?.forEach((booking: any) => {
      const date = toDateString(new Date(booking.createdAt));
      const current = customersByDate.get(date) || { new: 0, returning: 0 };
      customersByDate.set(date, {
        ...current,
        returning: current.returning + 1,
      });
    });

    newUsers?.forEach((user: any) => {
      const date = toDateString(new Date(user.createdAt));
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
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const customersWithBookings = new Set(currentBookings?.map((b: any) => b.customerId) || []);
    const { data: repeatCustomers } = await supabase
      .from('bookings')
      .select('customerId')
      .in('customerId', Array.from(customersWithBookings));

    const customerBookingCounts = new Map<string, number>();
    repeatCustomers?.forEach((b: any) => {
      const count = customerBookingCounts.get(b.customerId) || 0;
      customerBookingCounts.set(b.customerId, count + 1);
    });

    const returningCount = Array.from(customerBookingCounts.values()).filter((count) => count > 1).length;
    const retentionRate =
      customersWithBookings.size > 0 ? (returningCount / customersWithBookings.size) * 100 : 0;

    const averageLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    const analyticsData: AnalyticsData = {
      revenue: {
        data:
          revenueData.length > 0
            ? revenueData
            : [{ date: toDateString(currentEnd), revenue: 0, bookings: 0 }],
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
                  date: toDateString(currentEnd),
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
            : [{ date: toDateString(currentEnd), newCustomers: 0, returningCustomers: 0 }],
        totalCustomers,
        newCustomers,
        retentionRate,
        averageLifetimeValue,
      },
    };

    return NextResponse.json(analyticsData);
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    logger.error('Failed to fetch analytics data', {
      component: 'analytics-api',
      action: 'fetch_error',
      metadata: {
        error: errorMessage,
        dateRange: rangeParam,
      },
    }, err instanceof Error ? err : undefined);

    return NextResponse.json(
      { error: 'Failed to fetch analytics data', message: errorMessage },
      { status: 500 }
    );
  }
}

