import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    // After error check, TypeScript should know this is RequireAdminSuccess
    const supabase = adminResult.supabase;
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'month';
    const format = searchParams.get('format') || 'csv';

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

    // Fetch analytics data using RPC function
    const { data: analyticsData, error: analyticsError } = await supabase.rpc('get_analytics_aggregated', {
      p_metric_type: 'all',
      p_start_date: startDate.toISOString(),
      p_end_date: now.toISOString(),
    });

    if (analyticsError) {
      throw analyticsError;
    }

    if (format === 'csv') {
      // Generate CSV with all analytics data
      const revenueData = analyticsData.revenue?.daily_data || [];
      const bookingsData = analyticsData.bookings?.daily_data || [];
      const equipmentData = analyticsData.equipment?.utilization_data || [];
      const customersData = analyticsData.customers?.daily_data || [];

      // Revenue section
      const revenueHeaders = ['Date', 'Revenue', 'Bookings'];
      const revenueRows = revenueData.map((item: any) => [
        item.date,
        parseFloat(item.revenue || '0').toFixed(2),
        parseInt(item.bookings || '0', 10),
      ]);

      // Bookings section
      const bookingsHeaders = ['Date', 'Total Bookings', 'Completed', 'Cancelled'];
      const bookingsRows = bookingsData.map((item: any) => [
        item.date,
        parseInt(item.total || '0', 10),
        parseInt(item.completed || '0', 10),
        parseInt(item.cancelled || '0', 10),
      ]);

      // Equipment section
      const equipmentHeaders = ['Equipment ID', 'Equipment Name', 'Utilization Rate (%)', 'Revenue'];
      const equipmentRows = equipmentData.map((item: any) => [
        item.equipment_id,
        item.equipment_name,
        parseFloat(item.utilization_rate || '0').toFixed(2),
        parseFloat(item.revenue || '0').toFixed(2),
      ]);

      // Customers section
      const customersHeaders = ['Date', 'New Customers', 'Returning Customers'];
      const customersRows = customersData.map((item: any) => [
        item.date,
        parseInt(item.new_customers || '0', 10),
        parseInt(item.returning_customers || '0', 10),
      ]);

      // Combine all sections
      const csvLines = [
        'ANALYTICS EXPORT',
        `Date Range: ${dateRange}`,
        `Generated: ${new Date().toISOString()}`,
        '',
        'REVENUE DATA',
        revenueHeaders.join(','),
        ...revenueRows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        '',
        'BOOKINGS DATA',
        bookingsHeaders.join(','),
        ...bookingsRows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        '',
        'EQUIPMENT UTILIZATION',
        equipmentHeaders.join(','),
        ...equipmentRows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        '',
        'CUSTOMERS DATA',
        customersHeaders.join(','),
        ...customersRows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        '',
        'SUMMARY',
        `Total Revenue,${parseFloat(analyticsData.revenue?.total_revenue || '0').toFixed(2)}`,
        `Total Bookings,${parseInt(analyticsData.bookings?.total_bookings || '0', 10)}`,
        `Average Utilization,${parseFloat(analyticsData.equipment?.average_utilization || '0').toFixed(2)}%`,
        `Total Customers,${parseInt(analyticsData.customers?.total_customers || '0', 10)}`,
        `New Customers,${parseInt(analyticsData.customers?.new_customers || '0', 10)}`,
      ];

      const csvContent = csvLines.join('\n');

      logger.info('Analytics export completed', {
        component: 'admin-analytics-export',
        action: 'export_csv',
        metadata: { adminId: user?.id || 'unknown', dateRange, format },
      });

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-export-${dateRange}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'PDF export not yet implemented. Please use CSV format.' },
        { status: 501 }
      );
    }
  } catch (err) {
    logger.error(
      'Failed to export analytics',
      { component: 'admin-analytics-export', action: 'error' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Failed to export analytics' }, { status: 500 });
  }
}
