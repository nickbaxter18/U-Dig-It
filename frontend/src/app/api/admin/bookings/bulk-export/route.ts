import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const bulkExportSchema = z.object({
  bookingIds: z.array(z.string().uuid()).min(1),
  format: z.enum(['csv', 'pdf']).default('csv'),
});

export const POST = withRateLimit(RateLimitPresets.STRICT, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { user } = adminResult;

    const payload = bulkExportSchema.parse(await request.json());
    const { bookingIds, format } = payload;

    // Fetch bookings with related data
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        bookingNumber,
        startDate,
        endDate,
        status,
        totalAmount,
        createdAt,
        customer:customerId (
          id,
          firstName,
          lastName,
          email,
          phone
        ),
        equipment:equipmentId (
          id,
          make,
          model,
          unitId
        )
      `
      )
      .in('id', bookingIds);

    if (fetchError) {
      throw fetchError;
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ error: 'No bookings found' }, { status: 404 });
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Booking Number',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Equipment',
        'Start Date',
        'End Date',
        'Status',
        'Total Amount',
        'Created At',
      ];

      const rows = bookings.map((booking: unknown) => [
        booking.bookingNumber || '',
        booking.customer
          ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim()
          : '',
        booking.customer?.email || '',
        booking.customer?.phone || '',
        booking.equipment
          ? `${booking.equipment.make || ''} ${booking.equipment.model || ''}`.trim()
          : '',
        booking.startDate ? new Date(booking.startDate).toLocaleDateString() : '',
        booking.endDate ? new Date(booking.endDate).toLocaleDateString() : '',
        booking.status || '',
        booking.totalAmount ? `$${parseFloat(booking.totalAmount).toFixed(2)}` : '$0.00',
        booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '',
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      logger.info('Bulk booking export completed', {
        component: 'admin-bookings-bulk-export',
        action: 'export_csv',
        metadata: { adminId: user?.id || 'unknown', bookingCount: bookings.length },
      });

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="bookings-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // PDF export would require @react-pdf/renderer or similar
      // For now, return JSON as fallback
      return NextResponse.json(
        { error: 'PDF export not yet implemented. Please use CSV format.' },
        { status: 501 }
      );
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Failed to perform booking bulk export',
      { component: 'admin-bookings-bulk-export', action: 'error' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Failed to perform bulk export' }, { status: 500 });
  }
});
