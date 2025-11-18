import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/analytics/generate-report
 * Generate an analytics report
 */
export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { reportType, dateRange, format = 'pdf' } = body;

    if (!reportType) {
      return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
    }

    // Calculate date range
    let startDate = new Date();
    let endDate = new Date();

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
      case 'ytd':
        startDate = new Date(new Date().getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Fetch analytics data based on report type
    let reportData: any = {};

    if (reportType === 'revenue' || reportType === 'full') {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('totalAmount, createdAt, status')
        .gte('createdAt', startDate.toISOString())
        .lte('createdAt', endDate.toISOString());

      const revenue = bookings?.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0) || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;

      reportData.revenue = {
        total: revenue,
        bookings: bookings?.length || 0,
        completed: completedBookings,
        average: bookings?.length ? revenue / bookings.length : 0
      };
    }

    if (reportType === 'equipment' || reportType === 'full') {
      const { data: equipment } = await supabase
        .from('equipment')
        .select('id, name, dailyRate, status');

      const { data: bookings } = await supabase
        .from('bookings')
        .select('equipmentId, totalAmount')
        .gte('createdAt', startDate.toISOString())
        .lte('createdAt', endDate.toISOString());

      reportData.equipment = {
        total: equipment?.length || 0,
        available: equipment?.filter(e => e.status === 'available').length || 0,
        utilization: equipment?.map((eq: any) => {
          const eqBookings = bookings?.filter(b => b.equipmentId === eq.id) || [];
          return {
            id: eq.id,
            name: eq.name,
            bookings: eqBookings.length,
            revenue: eqBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0)
          };
        }) || []
      };
    }

    if (reportType === 'customers' || reportType === 'full') {
      const { data: customers } = await supabase
        .from('users')
        .select('id, firstName, lastName, email, createdAt')
        .eq('role', 'customer')
        .gte('createdAt', startDate.toISOString())
        .lte('createdAt', endDate.toISOString());

      reportData.customers = {
        new: customers?.length || 0,
        total: customers?.length || 0
      };
    }

    // Generate report HTML
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Analytics Report - ${reportType}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #E1BC56; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 28px; font-weight: bold; color: #A90F0F; }
    .report-title { font-size: 24px; margin-top: 20px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; color: #E1BC56; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px; }
    .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">KUBOTA RENTAL PLATFORM</div>
    <div class="report-title">ANALYTICS REPORT</div>
    <div style="margin-top: 10px; color: #666;">Generated: ${new Date().toLocaleString()}</div>
    <div style="margin-top: 5px; color: #666;">Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</div>
  </div>

  ${reportData.revenue ? `
  <div class="section">
    <div class="section-title">Revenue Metrics</div>
    <div class="metric"><span>Total Revenue:</span><span>$${reportData.revenue.total.toFixed(2)}</span></div>
    <div class="metric"><span>Total Bookings:</span><span>${reportData.revenue.bookings}</span></div>
    <div class="metric"><span>Completed Bookings:</span><span>${reportData.revenue.completed}</span></div>
    <div class="metric"><span>Average Booking Value:</span><span>$${reportData.revenue.average.toFixed(2)}</span></div>
  </div>
  ` : ''}

  ${reportData.equipment ? `
  <div class="section">
    <div class="section-title">Equipment Metrics</div>
    <div class="metric"><span>Total Equipment:</span><span>${reportData.equipment.total}</span></div>
    <div class="metric"><span>Available Equipment:</span><span>${reportData.equipment.available}</span></div>
  </div>
  ` : ''}

  ${reportData.customers ? `
  <div class="section">
    <div class="section-title">Customer Metrics</div>
    <div class="metric"><span>New Customers:</span><span>${reportData.customers.new}</span></div>
    <div class="metric"><span>Total Customers:</span><span>${reportData.customers.total}</span></div>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by Kubota Rental Platform Analytics</p>
    <p>U-Digit Rentals Inc. | Saint John, New Brunswick</p>
  </div>
</body>
</html>
    `.trim();

    logger.info('Report generated successfully', {
      component: 'analytics-report-api',
      action: 'generate_report',
      metadata: { reportType, dateRange, format, userId: user?.id || 'unknown' }
    });

    return new NextResponse(reportHTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="analytics-report-${reportType}-${Date.now()}.html"`,
      },
    });
  } catch (error: any) {
    logger.error('Failed to generate report', {
      component: 'analytics-report-api',
      action: 'generate_report_error',
      metadata: { error: error.message }
    }, error);

    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

