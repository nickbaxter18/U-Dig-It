import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const ACTIVE_BOOKING_STATUSES = [
  'confirmed',
  'paid',
  'in_progress',
  'ready_for_pickup',
  'delivered',
];

function formatCsvValue(value: unknown) {
  const asString = value === null || value === undefined ? '' : String(value);
  return `"${asString.replace(/"/g, '""')}"`;
}

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;
    if (!supabase) {
      logger.error('Supabase client not configured for equipment export', {
        component: 'admin-equipment-export-api',
        action: 'client_missing',
      });
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const searchTerm = searchParams.get('search')?.trim() ?? '';

    let equipmentQuery = supabase
      .from('equipment')
      .select(
        'id, unitId, make, model, serialNumber, status, location, dailyRate, weeklyRate, monthlyRate, nextMaintenanceDue, lastMaintenanceDate, createdAt'
      )
      .order('createdAt', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      equipmentQuery = equipmentQuery.eq('status', statusFilter);
    }

    if (searchTerm) {
      equipmentQuery = equipmentQuery.or(
        `make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,unitId.ilike.%${searchTerm}%,serialNumber.ilike.%${searchTerm}%`
      );
    }

    const { data: equipmentRows, error: equipmentError } = await equipmentQuery;
    if (equipmentError) {
      logger.error('Failed to fetch equipment for export', {
        component: 'admin-equipment-export-api',
        action: 'fetch_equipment_failed',
        metadata: { error: equipmentError.message },
      });
      throw equipmentError;
    }

    if (!equipmentRows || equipmentRows.length === 0) {
      logger.warn('No equipment found for export', {
        component: 'admin-equipment-export-api',
        action: 'no_equipment',
        metadata: { statusFilter, searchTerm },
      });
      // Return empty CSV with headers
      const header = [
        'Equipment',
        'Make',
        'Model',
        'Unit ID',
        'Serial Number',
        'Status',
        'Location',
        'Daily Rate (CAD)',
        'Weekly Rate (CAD)',
        'Monthly Rate (CAD)',
        'Total Bookings',
        'Total Revenue (CAD)',
        'Utilization (%)',
        'Last Maintenance',
        'Next Maintenance Due',
        'Created At',
      ];
      const csvContent = header.map(formatCsvValue).join(',') + '\n';
      const filename = `equipment-export-${new Date().toISOString().split('T')[0]}.csv`;
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    const equipmentIds = (equipmentRows ?? []).map((item) => item.id);
    const bookingStats = new Map<
      string,
      { totalBookings: number; totalRevenue: number; activeBookings: number }
    >();

    if (equipmentIds.length > 0) {
      const { data: bookingRows, error: bookingsError } = await supabase
        .from('bookings')
        .select('equipmentId, totalAmount, status')
        .in('equipmentId', equipmentIds);

      if (bookingsError) throw bookingsError;

      for (const booking of bookingRows ?? []) {
        if (!booking.equipmentId) continue;
        const entry = bookingStats.get(booking.equipmentId) || {
          totalBookings: 0,
          totalRevenue: 0,
          activeBookings: 0,
        };
        entry.totalBookings += 1;
        entry.totalRevenue += Number(booking.totalAmount ?? 0);
        if (booking.status && ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
          entry.activeBookings += 1;
        }
        bookingStats.set(booking.equipmentId, entry);
      }
    }

    const header = [
      'Equipment',
      'Make',
      'Model',
      'Unit ID',
      'Serial Number',
      'Status',
      'Location',
      'Daily Rate (CAD)',
      'Weekly Rate (CAD)',
      'Monthly Rate (CAD)',
      'Total Bookings',
      'Total Revenue (CAD)',
      'Utilization (%)',
      'Last Maintenance',
      'Next Maintenance Due',
      'Created At',
    ];

    const rows = (equipmentRows ?? []).map((item: unknown) => {
      const stats = bookingStats.get(item.id) ?? {
        totalBookings: 0,
        totalRevenue: 0,
        activeBookings: 0,
      };
      const utilization =
        stats.totalBookings > 0 ? (stats.activeBookings / stats.totalBookings) * 100 : 0;

      return [
        `${item.make ?? ''} ${item.model ?? ''}`.trim() || 'Equipment',
        item.make ?? 'N/A',
        item.model ?? 'N/A',
        item.unitId ?? 'N/A',
        item.serialNumber ?? 'N/A',
        (item.status ?? 'unknown').toString(),
        item.location ?? 'N/A',
        item.dailyRate !== null && item.dailyRate !== undefined
          ? Number(item.dailyRate).toFixed(2)
          : '0.00',
        item.weeklyRate !== null && item.weeklyRate !== undefined
          ? Number(item.weeklyRate).toFixed(2)
          : '0.00',
        item.monthlyRate !== null && item.monthlyRate !== undefined
          ? Number(item.monthlyRate).toFixed(2)
          : '0.00',
        stats.totalBookings.toString(),
        stats.totalRevenue.toFixed(2),
        utilization.toFixed(2),
        item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate).toLocaleDateString() : '',
        item.nextMaintenanceDue ? new Date(item.nextMaintenanceDue).toLocaleDateString() : '',
        item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
      ];
    });

    const csvContent = [header, ...rows].map((row) => row.map(formatCsvValue).join(',')).join('\n');
    const filename = `equipment-export-${new Date().toISOString().split('T')[0]}.csv`;

    logger.info('Equipment export completed', {
      component: 'admin-equipment-export-api',
      action: 'export_success',
      metadata: {
        equipmentCount: equipmentRows.length,
        filename,
        csvSize: csvContent.length,
      },
    });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    logger.error(
      'Equipment export failed',
      {
        component: 'admin-equipment-api',
        action: 'export_failed',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Failed to export equipment data' }, { status: 500 });
  }
});
