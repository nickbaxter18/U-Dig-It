import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get('range') as DateRangeKey | null;
  const range: DateRangeKey = rangeParam ?? 'month';

  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) {
      return error;
    }

    const { currentStart, currentEnd, previousStart, previousEnd } = resolveDateRanges(range);
    const currentStartISO = currentStart.toISOString().slice(0, 10);
    const currentEndISO = currentEnd.toISOString().slice(0, 10);
    const previousStartISO = previousStart.toISOString().slice(0, 10);
    const previousEndISO = previousEnd.toISOString().slice(0, 10);

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
    ] = await Promise.all([
      supabase.from('mv_dashboard_kpis').select('*').order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
      supabase
        .from('mv_revenue_trends')
        .select('*')
        .gte('bucket_date', currentStartISO)
        .lte('bucket_date', currentEndISO)
        .order('bucket_date', { ascending: true }),
      supabase
        .from('mv_revenue_trends')
        .select('*')
        .gte('bucket_date', previousStartISO)
        .lte('bucket_date', previousEndISO)
        .order('bucket_date', { ascending: true }),
      supabase
        .from('mv_booking_trends')
        .select('*')
        .gte('bucket_date', currentStartISO)
        .lte('bucket_date', currentEndISO)
        .order('bucket_date', { ascending: true }),
      supabase
        .from('mv_booking_trends')
        .select('*')
        .gte('bucket_date', previousStartISO)
        .lte('bucket_date', previousEndISO)
        .order('bucket_date', { ascending: true }),
      supabase
        .from('mv_equipment_utilization')
        .select('*')
        .gte('snapshot_date', currentStartISO)
        .lte('snapshot_date', currentEndISO),
      supabase
        .from('equipment')
        .select('id, unitId, make, model, status, utilization_rate, total_rental_days, revenue_generated'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .not('role', 'in', '("admin","super_admin")'),
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', ACTIVE_BOOKING_STATUSES)
        .gte('createdAt', currentStart.toISOString())
        .lte('createdAt', currentEnd.toISOString()),
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('createdAt', currentStart.toISOString())
        .lte('createdAt', currentEnd.toISOString()),
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled')
        .gte('createdAt', currentStart.toISOString())
        .lte('createdAt', currentEnd.toISOString()),
      supabase.from('alerts').select('*').order('detected_at', { ascending: false }).limit(10),
      supabase.from('mv_alert_candidates').select('*').order('detected_at', { ascending: false }).limit(10),
    ]);

    const revenueTrend = (revenueTrendResult.data ?? []) as TrendPoint[];
    const previousRevenueTrend = (previousRevenueTrendResult.data ?? []) as TrendPoint[];
    const bookingTrend = (bookingTrendResult.data ?? []) as BookingTrendPoint[];
    const previousBookingTrend = (previousBookingTrendResult.data ?? []) as BookingTrendPoint[];
    const utilizationRows = (utilizationResult.data ?? []) as EquipmentUtilizationPoint[];

    const totalRevenue = revenueTrend.reduce((acc, row) => acc + Number(row.gross_revenue ?? 0) - Number(row.refunded_amount ?? 0), 0);
    const previousRevenue = previousRevenueTrend.reduce(
      (acc, row) => acc + Number(row.gross_revenue ?? 0) - Number(row.refunded_amount ?? 0),
      0
    );
    const totalBookings = bookingTrend.reduce((acc, row) => acc + Number(row.total_bookings ?? 0), 0);
    const previousTotalBookings = previousBookingTrend.reduce((acc, row) => acc + Number(row.total_bookings ?? 0), 0);
    const completedBookings = bookingTrend.reduce((acc, row) => acc + Number(row.completed_bookings ?? 0), 0);
    const cancelledBookings = bookingTrend.reduce((acc, row) => acc + Number(row.cancelled_bookings ?? 0), 0);

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
      row => !['out_of_service', 'unavailable'].includes((row.status ?? '').toString().toLowerCase())
    ).length;
    const equipmentUtilization =
      equipmentSummaryRows.length > 0
        ? equipmentSummaryRows.reduce(
            (acc, row) => acc + Number((row as { utilization_rate?: string | number }).utilization_rate ?? 0),
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
      snapshotDate: dashboardKpiResult.data?.snapshot_date ?? null,
      lastGeneratedAt: dashboardKpiResult.data?.generated_at ?? null,
    };

    return NextResponse.json({
      summary,
      charts: {
        revenue: revenueTrend,
        bookings: bookingTrend,
        utilization: utilizationRows,
      },
      chartsV2: buildChartsPayload({
        revenueCurrent: revenueTrend,
        revenuePrevious: previousRevenueTrend,
        bookingCurrent: bookingTrend,
        bookingPrevious: previousBookingTrend,
        utilizationSnapshots: utilizationRows,
        equipmentSummary: equipmentSummaryRows,
      }),
      metadata: {
        generatedAt: dashboardKpiResult.data?.generated_at ?? new Date().toISOString(),
        snapshotDate: dashboardKpiResult.data?.snapshot_date ?? null,
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
    logger.error(
      'Admin dashboard overview error',
      {
        component: 'admin-dashboard-api',
        action: 'overview_fetch_failed',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Failed to fetch dashboard overview' }, { status: 500 });
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
  const revenueSeries = params.revenueCurrent.map(row => {
    const gross = Number(row.gross_revenue ?? 0);
    const refunds = Number(row.refunded_amount ?? 0);
    return {
      date: row.bucket_date,
      grossRevenue: gross,
      refundedAmount: refunds,
      netRevenue: gross - refunds,
      paymentsCount: Number(row.payments_count ?? 0),
    };
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

  const revenueComparison = params.revenuePrevious.map(row => {
    const gross = Number(row.gross_revenue ?? 0);
    const refunds = Number(row.refunded_amount ?? 0);
    return {
      date: row.bucket_date,
      netRevenue: gross - refunds,
    };
  });

  const bookingSeries = params.bookingCurrent.map(row => ({
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

  const utilizationDetails = params.equipmentSummary.map(item => {
    const latestSnapshot = utilizationMap.get(item.id);
    const utilizationPct =
      latestSnapshot !== undefined
        ? Number(latestSnapshot.utilization_pct ?? 0)
        : Number(item.utilization_rate ?? 0);

    return {
      equipmentId: item.id,
      label: buildEquipmentLabel(item),
      status: (item.status ?? 'unknown') as string,
      utilizationPct,
      rentedDays: latestSnapshot ? Number(latestSnapshot.hours_used ?? 0) : item.total_rental_days ?? 0,
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


