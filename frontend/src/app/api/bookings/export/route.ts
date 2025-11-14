import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/bookings/export
 * Export bookings to CSV format
 *
 * Admin-only endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    // 3. Fetch all bookings with customer and equipment data
    const { data: bookingsData, error: bookingsError } = await supabase.from('bookings').select(`
        id,
        bookingNumber,
        startDate,
        endDate,
        status,
        type,
        totalAmount,
        subtotal,
        taxes,
        deliveryFee,
        securityDeposit,
        deliveryAddress,
        deliveryCity,
        deliveryProvince,
        deliveryPostalCode,
        specialInstructions,
        createdAt,
        equipment:equipmentId (
          make,
          model,
          serialNumber
        ),
        customer:customerId (
          firstName,
          lastName,
          email,
          phone,
          companyName
        )
      `).order('createdAt', { ascending: false });

    if (bookingsError) throw bookingsError;

    // 4. Generate CSV
    const csvHeaders = [
      'Booking Number',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Company',
      'Equipment',
      'Serial Number',
      'Start Date',
      'End Date',
      'Status',
      'Type',
      'Subtotal',
      'Taxes',
      'Delivery Fee',
      'Total Amount',
      'Security Deposit',
      'Delivery Address',
      'Special Instructions',
      'Created At',
    ];

    const csvRows = (bookingsData || []).map((booking: any) => {
      const customer = booking.customer || {};
      const equipment = booking.equipment || {};

      const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
      const equipmentName = `${equipment.make || ''} ${equipment.model || ''}`.trim() || 'N/A';
      const deliveryAddress = [
        booking.deliveryAddress,
        booking.deliveryCity,
        booking.deliveryProvince,
        booking.deliveryPostalCode,
      ]
        .filter(Boolean)
        .join(', ');

      return [
        booking.bookingNumber || '',
        customerName,
        customer.email || '',
        customer.phone || '',
        customer.companyName || '',
        equipmentName,
        equipment.serialNumber || '',
        booking.startDate ? new Date(booking.startDate).toLocaleDateString() : '',
        booking.endDate ? new Date(booking.endDate).toLocaleDateString() : '',
        booking.status || '',
        booking.type || '',
        booking.subtotal || '0',
        booking.taxes || '0',
        booking.deliveryFee || '0',
        booking.totalAmount || '0',
        booking.securityDeposit || '0',
        deliveryAddress,
        (booking.specialInstructions || '').replace(/"/g, '""'), // Escape quotes
        booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '',
      ];
    });

    // 5. Combine headers and rows
    const csvContent = [
      csvHeaders.map(h => `"${h}"`).join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    logger.info('Bookings exported', {
      component: 'bookings-export-api',
      action: 'export_success',
      metadata: {
        count: csvRows.length,
        adminId: user.id,
      },
    });

    // 6. Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bookings-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    logger.error(
      'Bookings export error',
      {
        component: 'bookings-export-api',
        action: 'export_error',
      },
      error
    );

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

