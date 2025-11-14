import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/analytics/export-data
 * Export analytics data as CSV/JSON
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type') || 'bookings';
    const format = searchParams.get('format') || 'csv';
    const dateRange = searchParams.get('dateRange') || '30d';

    // Calculate date range
    let startDate = new Date();
    switch (dateRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    let exportData: any[] = [];
    let filename = '';

    if (dataType === 'bookings') {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, bookingNumber, totalAmount, status, createdAt, startDate, endDate')
        .gte('createdAt', startDate.toISOString())
        .order('createdAt', { ascending: false });

      exportData = bookings || [];
      filename = `bookings-export-${Date.now()}`;
    } else if (dataType === 'payments') {
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, status, method, createdAt, bookingId')
        .gte('createdAt', startDate.toISOString())
        .order('createdAt', { ascending: false });

      exportData = payments || [];
      filename = `payments-export-${Date.now()}`;
    } else if (dataType === 'equipment') {
      const { data: equipment } = await supabase
        .from('equipment')
        .select('id, name, category, dailyRate, status')
        .order('name', { ascending: true });

      exportData = equipment || [];
      filename = `equipment-export-${Date.now()}`;
    }

    if (format === 'csv') {
      // Convert to CSV
      if (exportData.length === 0) {
        return NextResponse.json({ error: 'No data to export' }, { status: 404 });
      }

      const headers = Object.keys(exportData[0]);
      const csvRows = [
        headers.join(','),
        ...exportData.map(row =>
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(',')
        )
      ];

      const csv = csvRows.join('\n');

      logger.info('Data exported successfully', {
        component: 'analytics-export-api',
        action: 'export_data',
        metadata: { dataType, format, recordCount: exportData.length, userId: supabase.auth.getUser().data.user?.id }
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // JSON format
      logger.info('Data exported successfully', {
        component: 'analytics-export-api',
        action: 'export_data',
        metadata: { dataType, format, recordCount: exportData.length, userId: supabase.auth.getUser().data.user?.id }
      });

      return NextResponse.json({
        data: exportData,
        count: exportData.length,
        exportedAt: new Date().toISOString(),
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString()
        }
      }, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error: any) {
    logger.error('Failed to export data', {
      component: 'analytics-export-api',
      action: 'export_data_error',
      metadata: { error: error.message }
    }, error);

    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

