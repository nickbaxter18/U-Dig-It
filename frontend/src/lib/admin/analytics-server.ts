/**
 * Server-Side Analytics Data Fetching
 *
 * Helper functions to fetch analytics data server-side for use in Server Components.
 */

import { COMPLETED_PAYMENT_STATUSES } from '@/lib/constants/payment-status';
import { logger } from '@/lib/logger';

export interface AnalyticsData {
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

export type DateRange = 'week' | 'month' | 'quarter' | 'year';

/**
 * Calculate date ranges for analytics queries
 * Matches client-side resolveDateRangeBounds() to ensure consistent date filtering
 */
export function calculateDateRanges(dateRange: DateRange) {
  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(now);
  const previousStartDate = new Date();

  // Set proper time bounds for inclusive filtering
  switch (dateRange) {
    case 'week':
      // Week: 7 days total (today + 6 days back) - EXACT match to dashboard
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      previousStartDate.setDate(previousStartDate.getDate() - 13);
      previousStartDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      previousStartDate.setMonth(previousStartDate.getMonth() - 2);
      previousStartDate.setHours(0, 0, 0, 0);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      previousStartDate.setMonth(previousStartDate.getMonth() - 6);
      previousStartDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
      previousStartDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      previousStartDate.setMonth(previousStartDate.getMonth() - 2);
      previousStartDate.setHours(0, 0, 0, 0);
      break;
  }

  // Return 'now' as endDate for backward compatibility, but it's properly bounded
  return { now: endDate, startDate, previousStartDate };
}

/**
 * Fetch analytics data server-side
 *
 * This function replicates the logic from the client component but runs server-side.
 */
export async function fetchAnalyticsDataServer(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  dateRange: DateRange = 'month'
): Promise<AnalyticsData> {
  const { now: endDate, startDate, previousStartDate } = calculateDateRanges(dateRange);
  // endDate is properly bounded with 23:59:59.999 for inclusive filtering

  // Fetch bookings
  const { data: currentBookings, error: revenueError } = await supabase
    .from('bookings')
    .select('totalAmount, createdAt, status, customerId')
    .gte('createdAt', startDate.toISOString())
    .lte('createdAt', endDate.toISOString());

  if (revenueError) {
    logger.error('Error fetching bookings for analytics', {
      component: 'analytics-server',
      action: 'fetch_bookings_error',
      metadata: {
        error: revenueError.message,
        details: revenueError.details,
        hint: revenueError.hint,
        code: revenueError.code,
        dateRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
    });
    throw new Error(`Failed to fetch bookings: ${revenueError.message}${revenueError.details ? ` - ${revenueError.details}` : ''}${revenueError.hint ? ` (Hint: ${revenueError.hint})` : ''}`);
  }

  // Previous bookings not needed for current calculation, but kept for potential future use
  // const { data: _previousBookings } = await supabase
  //   .from('bookings')
  //   .select('totalAmount')
  //   .gte('createdAt', previousStartDate.toISOString())
  //   .lt('createdAt', startDate.toISOString());

  // Fetch payments
  const [currentStripePayments, currentManualPayments, previousStripePayments, previousManualPayments] = await Promise.all([
    supabase
      .from('payments')
      .select('amount, status, createdAt')
      .in('status', COMPLETED_PAYMENT_STATUSES)
      .eq('type', 'payment')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString()),
    supabase
      .from('manual_payments')
      .select('amount, status, created_at')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
    supabase
      .from('payments')
      .select('amount, status, createdAt')
      .in('status', COMPLETED_PAYMENT_STATUSES)
      .eq('type', 'payment')
      .gte('createdAt', previousStartDate.toISOString())
      .lt('createdAt', startDate.toISOString()),
    supabase
      .from('manual_payments')
      .select('amount, status, created_at')
      .eq('status', 'completed')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString()),
  ]);

  if (currentStripePayments.error) throw currentStripePayments.error;
  if (currentManualPayments.error) throw currentManualPayments.error;
  if (previousStripePayments.error) throw previousStripePayments.error;
  if (previousManualPayments.error) throw previousManualPayments.error;

  // Calculate revenue
  const currentStripeRevenue =
    (currentStripePayments.data ?? []).reduce(
      (sum, p) => sum + Number((p as { amount: number | string }).amount ?? 0),
      0
    ) || 0;
  const currentManualRevenue =
    (currentManualPayments.data ?? []).reduce(
      (sum, p) => sum + Number((p as { amount: number | string }).amount ?? 0),
      0
    ) || 0;
  const totalRevenue = currentStripeRevenue + currentManualRevenue;

  const previousStripeRevenue =
    (previousStripePayments.data ?? []).reduce(
      (sum, p) => sum + Number((p as { amount: number | string }).amount ?? 0),
      0
    ) || 0;
  const previousManualRevenue =
    (previousManualPayments.data ?? []).reduce(
      (sum, p) => sum + Number((p as { amount: number | string }).amount ?? 0),
      0
    ) || 0;
  const previousRevenue = previousStripeRevenue + previousManualRevenue;

  // Aggregate revenue by date
  const revenueByDate = new Map<string, { revenue: number; bookings: number }>();

  currentStripePayments.data?.forEach((payment: any) => {
    const paymentDate = new Date(payment.createdAt).toISOString().split('T')[0];
    const current = revenueByDate.get(paymentDate) || { revenue: 0, bookings: 0 };
    revenueByDate.set(paymentDate, {
      revenue: current.revenue + Number(payment.amount ?? 0),
      bookings: current.bookings,
    });
  });

  currentManualPayments.data?.forEach((payment: any) => {
    const paymentDate = new Date(payment.created_at).toISOString().split('T')[0];
    const current = revenueByDate.get(paymentDate) || { revenue: 0, bookings: 0 };
    revenueByDate.set(paymentDate, {
      revenue: current.revenue + Number(payment.amount ?? 0),
      bookings: current.bookings,
    });
  });

  currentBookings?.forEach((booking: any) => {
    const date = new Date(booking.createdAt).toISOString().split('T')[0];
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
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const averageDailyRevenue = totalRevenue / daysDiff;

  // Bookings analytics
  const bookingsByDate = new Map<string, { total: number; completed: number; cancelled: number }>();
  currentBookings?.forEach((booking: any) => {
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
        .gte('createdAt', startDate.toISOString())
        .lte('createdAt', endDate.toISOString());

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
    .gte('createdAt', startDate.toISOString())
    .lte('createdAt', endDate.toISOString());

  const newCustomers = newUsers?.length || 0;

  const customersByDate = new Map<string, { new: number; returning: number }>();
  currentBookings?.forEach((booking: any) => {
    const date = new Date(booking.createdAt).toISOString().split('T')[0];
    const current = customersByDate.get(date) || { new: 0, returning: 0 };
    customersByDate.set(date, {
      ...current,
      returning: current.returning + 1,
    });
  });

  newUsers?.forEach((user: any) => {
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

  return {
    revenue: {
      data:
        revenueData.length > 0
          ? revenueData
          : [{ date: endDate.toISOString().split('T')[0], revenue: 0, bookings: 0 }],
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
                date: endDate.toISOString().split('T')[0],
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
          : [{ date: endDate.toISOString().split('T')[0], newCustomers: 0, returningCustomers: 0 }],
      totalCustomers,
      newCustomers,
      retentionRate,
      averageLifetimeValue,
    },
  };
}


