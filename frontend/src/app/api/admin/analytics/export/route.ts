import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/analytics/export
 * Export analytics data to CSV
 *
 * Admin-only endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    // 2. Verify admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', supabase.auth.getUser().data.user?.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // 3. Get date range parameter
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'month';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // 4. Fetch analytics data
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        bookingNumber,
        startDate,
        endDate,
        totalAmount,
        status,
        createdAt,
        customer:customerId (
          firstName,
          lastName,
          email
        ),
        equipment:equipmentId (
          make,
          model
        )
      `
      )
      .gte('createdAt', startDate.toISOString())
      .order('createdAt', { ascending: false });

    if (bookingsError) throw bookingsError;

    const { data: equipment } = await supabase
      .from('equipment')
      .select('id, make, model, status, dailyRate');

    // 5. Calculate aggregated metrics
    const metrics: any[] = [];

    // Revenue metrics
    const totalRevenue = bookings?.reduce((sum: any, b: any) => sum + parseFloat(b.totalAmount || '0'), 0) || 0;
    const avgBookingValue = bookings && bookings.length > 0 ? totalRevenue / bookings.length : 0;

    metrics.push({
      metric: 'Total Revenue',
      value: totalRevenue.toFixed(2),
      period: dateRange,
      unit: 'CAD',
    });

    metrics.push({
      metric: 'Total Bookings',
      value: bookings?.length || 0,
      period: dateRange,
      unit: 'bookings',
    });

    metrics.push({
      metric: 'Average Booking Value',
      value: avgBookingValue.toFixed(2),
      period: dateRange,
      unit: 'CAD',
    });

    // Booking status breakdown
    const statusCounts: Record<string, number> = {};
    bookings?.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      metrics.push({
        metric: `Bookings - ${status}`,
        value: count,
        period: dateRange,
        unit: 'bookings',
      });
    });

    // Equipment utilization
    const equipmentStats = await Promise.all(
      (equipment || []).map(async eq => {
        const { data: eqBookings } = await supabase
          .from('bookings')
          .select('id, startDate, endDate, status')
          .eq('equipmentId', eq.id)
          .gte('createdAt', startDate.toISOString());

        const activeBookings = eqBookings?.filter(b =>
          ['confirmed', 'paid', 'in_progress'].includes(b.status)
        ).length || 0;

        return {
          equipment: `${eq.make} ${eq.model}`,
          totalBookings: eqBookings?.length || 0,
          activeBookings,
          status: eq.status,
        };
      })
    );

    // Add equipment metrics
    equipmentStats.forEach(stat => {
      metrics.push({
        metric: `Equipment Utilization - ${stat.equipment}`,
        value: stat.activeBookings,
        period: dateRange,
        unit: 'active bookings',
      });
    });

    // 6. Generate CSV
    const csvHeaders = ['Metric', 'Value', 'Period', 'Unit'];
    const csvRows = metrics.map(m => [m.metric, m.value, m.period, m.unit]);

    const csvContent = [
      csvHeaders.map(h => `"${h}"`).join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    logger.info('Analytics exported', {
      component: 'analytics-export-api',
      action: 'export_success',
      metadata: {
        metricsCount: metrics.length,
        dateRange,
        adminId: supabase.auth.getUser().data.user?.id,
      },
    });

    // 7. Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-export-${dateRange}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    logger.error(
      'Analytics export error',
      {
        component: 'analytics-export-api',
        action: 'error',
      },
      error
    );

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

