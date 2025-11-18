import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/analytics/export-data
 * Export analytics data as CSV/JSON
 */
export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    const { supabase } = adminResult;
    if (!supabase) {
      logger.error('Supabase client unavailable for analytics export', {
        component: 'analytics-export-api',
        action: 'missing_client',
      });
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { data: { user } } = await supabase.auth.getUser();

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
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, bookingNumber, totalAmount, status, createdAt, startDate, endDate')
        .gte('createdAt', startDate.toISOString())
        .order('createdAt', { ascending: false });

      if (bookingsError) {
        logger.error('Failed to fetch bookings for analytics export', {
          component: 'analytics-export-api',
          action: 'bookings_fetch_failed',
        });
        return NextResponse.json({ error: 'Unable to fetch bookings' }, { status: 500 });
      }

      exportData = bookings || [];
      filename = `bookings-export-${Date.now()}`;
    } else if (dataType === 'payments') {
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('id, amount, status, method, createdAt, bookingId')
        .gte('createdAt', startDate.toISOString())
        .order('createdAt', { ascending: false });

      if (paymentsError) {
        logger.error('Failed to fetch payments for analytics export', {
          component: 'analytics-export-api',
          action: 'payments_fetch_failed',
        });
        return NextResponse.json({ error: 'Unable to fetch payments' }, { status: 500 });
      }

      exportData = payments || [];
      filename = `payments-export-${Date.now()}`;
    } else if (dataType === 'equipment') {
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, name, category, dailyRate, status')
        .order('name', { ascending: true });

      if (equipmentError) {
        logger.error('Failed to fetch equipment for analytics export', {
          component: 'analytics-export-api',
          action: 'equipment_fetch_failed',
        });
        return NextResponse.json({ error: 'Unable to fetch equipment' }, { status: 500 });
      }

      exportData = equipment || [];
      filename = `equipment-export-${Date.now()}`;
    } else {
      return NextResponse.json({ error: 'Unsupported data type' }, { status: 400 });
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
          headers.map((header: any) => {
            const value = row[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(',')
        )
      ];

      const csv = csvRows.join('\n');

      logger.info('Data exported successfully', {
        component: 'analytics-export-api',
        action: 'export_data',
        metadata: { dataType, format, recordCount: exportData.length, userId: user?.id || 'unknown' }
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
        metadata: { dataType, format, recordCount: exportData.length, userId: user?.id || 'unknown' }
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
