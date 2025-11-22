import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

type DateRangeKey = 'today' | 'week' | 'month' | 'quarter' | 'year';

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

function resolveDateRanges(range: DateRangeKey) {
  const now = new Date();
  const currentStart = new Date(now);
  const previousStart = new Date(now);
  const previousEnd = new Date(now);

  switch (range) {
    case 'today': {
      currentStart.setHours(0, 0, 0, 0);
      previousStart.setDate(previousStart.getDate() - 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    }
    case 'week': {
      currentStart.setDate(currentStart.getDate() - 6);
      previousStart.setDate(previousStart.getDate() - 13);
      previousEnd.setDate(previousEnd.getDate() - 7);
      break;
    }
    case 'month': {
      currentStart.setMonth(currentStart.getMonth() - 1);
      previousStart.setMonth(previousStart.getMonth() - 2);
      previousEnd.setMonth(previousEnd.getMonth() - 1);
      break;
    }
    case 'quarter': {
      currentStart.setMonth(currentStart.getMonth() - 3);
      previousStart.setMonth(previousStart.getMonth() - 6);
      previousEnd.setMonth(previousEnd.getMonth() - 3);
      break;
    }
    case 'year': {
      currentStart.setFullYear(currentStart.getFullYear() - 1);
      previousStart.setFullYear(previousStart.getFullYear() - 2);
      previousEnd.setFullYear(previousEnd.getFullYear() - 1);
      break;
    }
    default:
      break;
  }

  const currentEnd = now;

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
}

function calculateGrowth(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? null : 0;
  }
  return ((current - previous) / previous) * 100;
}

function formatCsvValue(value: unknown) {
  const asString = value === null || value === undefined ? '' : String(value);
  return `"${asString.replace(/"/g, '""')}"`;
}

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as DateRangeKey) ?? 'month';

    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { currentStart, currentEnd, previousStart, previousEnd } = resolveDateRanges(range);
    const currentStartISO = currentStart.toISOString().slice(0, 10);
    const currentEndISO = currentEnd.toISOString().slice(0, 10);
    const previousStartISO = previousStart.toISOString().slice(0, 10);
    const previousEndISO = previousEnd.toISOString().slice(0, 10);

    const [
      revenueTrendResult,
      previousRevenueTrendResult,
      bookingTrendResult,
      previousBookingTrendResult,
      equipmentSummaryResult,
      customerCountResult,
      activeBookingsCountResult,
      completedBookingsCountResult,
      cancelledBookingsCountResult,
      dashboardKpiResult,
      recentBookingsResult,
    ] = await Promise.all([
      supabase
        .from('mv_revenue_trends')
        .select('bucket_date, gross_revenue, refunded_amount, payments_count')
        .gte('bucket_date', currentStartISO)
        .lte('bucket_date', currentEndISO)
        .order('bucket_date', { ascending: true }),
      supabase
        .from('mv_revenue_trends')
        .select('bucket_date, gross_revenue, refunded_amount, payments_count')
        .gte('bucket_date', previousStartISO)
        .lte('bucket_date', previousEndISO)
        .order('bucket_date', { ascending: true }),
      supabase
        .from('mv_booking_trends')
        .select(
          'bucket_date, total_bookings, completed_bookings, cancelled_bookings, active_bookings'
        )
        .gte('bucket_date', currentStartISO)
        .lte('bucket_date', currentEndISO)
        .order('bucket_date', { ascending: true }),
      supabase
        .from('mv_booking_trends')
        .select(
          'bucket_date, total_bookings, completed_bookings, cancelled_bookings, active_bookings'
        )
        .gte('bucket_date', previousStartISO)
        .lte('bucket_date', previousEndISO)
        .order('bucket_date', { ascending: true }),
      supabase
        .from('equipment')
        .select('id, status, utilization_rate, total_rental_days, revenue_generated'),
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
      supabase
        .from('mv_dashboard_kpis')
        .select('snapshot_date, generated_at')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('bookings')
        .select(
          `
          id,
          bookingNumber,
          status,
          type,
          totalAmount,
          startDate,
          endDate,
          createdAt,
          customer:customerId (
            firstName,
            lastName,
            email
          )
        `
        )
        .gte('createdAt', currentStart.toISOString())
        .lte('createdAt', currentEnd.toISOString())
        .order('createdAt', { ascending: false })
        .limit(25),
    ]);

    const queryErrors = [
      revenueTrendResult.error,
      previousRevenueTrendResult.error,
      bookingTrendResult.error,
      previousBookingTrendResult.error,
      equipmentSummaryResult.error,
      customerCountResult.error,
      activeBookingsCountResult.error,
      completedBookingsCountResult.error,
      cancelledBookingsCountResult.error,
      dashboardKpiResult.error,
      recentBookingsResult.error,
    ].filter(Boolean);

    if (queryErrors.length > 0) {
      throw queryErrors[0] as Error;
    }

    const revenueTrend = revenueTrendResult.data ?? [];
    const previousRevenueTrend = previousRevenueTrendResult.data ?? [];
    const bookingTrend = bookingTrendResult.data ?? [];
    const previousBookingTrend = previousBookingTrendResult.data ?? [];
    const equipmentSummaryRows = equipmentSummaryResult.data ?? [];

    const totalRevenue = revenueTrend.reduce(
      (acc, row: { gross_revenue?: number; refunded_amount?: number }) =>
        acc + Number(row.gross_revenue ?? 0) - Number(row.refunded_amount ?? 0),
      0
    );
    const previousRevenue = previousRevenueTrend.reduce(
      (acc, row: { gross_revenue?: number; refunded_amount?: number }) =>
        acc + Number(row.gross_revenue ?? 0) - Number(row.refunded_amount ?? 0),
      0
    );

    const totalBookings = bookingTrend.reduce(
      (acc, row: { total_bookings?: number }) => acc + Number(row.total_bookings ?? 0),
      0
    );
    const previousTotalBookings = previousBookingTrend.reduce(
      (acc, row: { total_bookings?: number }) => acc + Number(row.total_bookings ?? 0),
      0
    );

    const activeEquipment = equipmentSummaryRows.filter((row: { status?: string | null }) => {
      const status = (row.status ?? '').toString().toLowerCase();
      return !['out_of_service', 'unavailable'].includes(status);
    }).length;
    const equipmentUtilization =
      equipmentSummaryRows.length > 0
        ? equipmentSummaryRows.reduce(
            (acc: number, row: { utilization_rate?: number | string | null }) =>
              acc + Number(row.utilization_rate ?? 0),
            0
          ) / equipmentSummaryRows.length
        : 0;

    const totalCustomers = customerCountResult.count ?? 0;
    const activeBookingsTotal =
      activeBookingsCountResult.count ??
      bookingTrend.reduce(
        (acc, row: { active_bookings?: number }) => acc + Number(row.active_bookings ?? 0),
        0
      );
    const completedBookingsTotal = completedBookingsCountResult.count ?? 0;
    const cancelledBookingsTotal = cancelledBookingsCountResult.count ?? 0;

    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    const summaryRows: Array<[string, string]> = [
      ['Selected Range', `${currentStartISO} to ${currentEndISO}`],
      ['Total Revenue (CAD)', totalRevenue.toFixed(2)],
      ['Total Bookings', totalBookings.toString()],
      [
        'Bookings Growth (%)',
        calculateGrowth(totalBookings, previousTotalBookings)?.toFixed(2) ?? 'N/A',
      ],
      ['Revenue Growth (%)', calculateGrowth(totalRevenue, previousRevenue)?.toFixed(2) ?? 'N/A'],
      ['Active Equipment', activeEquipment.toString()],
      ['Total Customers', totalCustomers.toString()],
      ['Active Bookings', activeBookingsTotal.toString()],
      ['Completed Bookings', completedBookingsTotal.toString()],
      ['Cancelled Bookings', cancelledBookingsTotal.toString()],
      ['Average Booking Value (CAD)', averageBookingValue.toFixed(2)],
      ['Equipment Utilization (%)', equipmentUtilization.toFixed(2)],
      ['Snapshot Date', dashboardKpiResult.data?.snapshot_date ?? 'N/A'],
      ['Report Generated At', dashboardKpiResult.data?.generated_at ?? new Date().toISOString()],
    ];

    const bookingsHeader = [
      'Booking Number',
      'Status',
      'Type',
      'Customer Name',
      'Customer Email',
      'Start Date',
      'End Date',
      'Total Amount (CAD)',
      'Created At',
    ];

    const recentBookings = (recentBookingsResult.data ?? []).map((booking: unknown) => {
      const customerName =
        `${booking.customer?.firstName ?? ''} ${booking.customer?.lastName ?? ''}`
          .trim()
          .replace(/\s+/g, ' ');
      return [
        booking.bookingNumber || booking.id,
        booking.status || 'unknown',
        booking.type || 'unknown',
        customerName || 'N/A',
        booking.customer?.email || 'N/A',
        booking.startDate ? new Date(booking.startDate).toLocaleDateString() : '',
        booking.endDate ? new Date(booking.endDate).toLocaleDateString() : '',
        booking.totalAmount !== null && booking.totalAmount !== undefined
          ? Number(booking.totalAmount).toFixed(2)
          : '0.00',
        booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '',
      ];
    });

    const csvSections: string[][] = [
      ['Dashboard Summary'],
      ['Metric', 'Value'],
      ...summaryRows,
      [''],
      ['Recent Bookings'],
      bookingsHeader,
      ...recentBookings,
    ];

    const csvContent = csvSections.map((row) => row.map(formatCsvValue).join(',')).join('\n');
    const filename = `dashboard-export-${range}-${currentEndISO}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error(
      'Dashboard export failed',
      {
        component: 'admin-dashboard-api',
        action: 'export_failed',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Failed to export dashboard data' }, { status: 500 });
  }
});
