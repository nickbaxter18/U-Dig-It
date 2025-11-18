import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bulkExportSchema = z.object({
  customerIds: z.array(z.string().uuid()).min(1),
  format: z.enum(['csv', 'pdf']).default('csv'),
});

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

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const payload = bulkExportSchema.parse(await request.json());
    const { customerIds, format } = payload;

    // Fetch customers with stats
    const { data: customers, error: fetchError } = await supabase.rpc('get_customers_with_stats_paginated', {
      p_offset: 0,
      p_limit: 10000, // Large limit to get all selected customers
      p_search_term: null,
      p_status_filter: null,
    });

    if (fetchError) {
      // Fallback to manual query
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', customerIds)
        .not('role', 'in', '("admin","super_admin")')
        .order('createdAt', { ascending: false });

      if (usersError) throw usersError;

      // Get booking stats
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('customerId, totalAmount, createdAt')
        .in('customerId', customerIds);

      const bookingsByCustomer = ((bookingsData || []) as any[]).reduce(
        (acc: Record<string, any[]>, booking: any) => {
          if (!acc[booking.customerId]) {
            acc[booking.customerId] = [];
          }
          acc[booking.customerId].push(booking);
          return acc;
        },
        {} as Record<string, any[]>
      );

      const customersWithStats = ((usersData || []) as any[]).map((user: any) => {
        const customerBookings = bookingsByCustomer[user?.id || 'unknown'] || [];
        const totalBookings = customerBookings.length;
        const totalSpent = customerBookings.reduce((sum: any, b: any) => sum + parseFloat(b.totalAmount || '0'), 0);
        const lastBooking = customerBookings.length > 0
          ? new Date(Math.max(...customerBookings.map((b) => new Date(b.createdAt).getTime())))
          : undefined;

        return {
          id: user?.id || 'unknown',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || 'unknown',
          phone: user?.phone || '',
          company: user?.companyName || '',
          address: user?.address || '',
          city: user?.city || '',
          province: user?.province || 'NB',
          postalCode: user?.postalCode || '',
          isVerified: user?.emailVerified || false,
          isActive: user?.status === 'active',
          totalBookings,
          totalSpent,
          lastBooking: lastBooking?.toISOString(),
          registrationDate: user?.createdAt,
          status: user?.status === 'suspended' ? 'suspended' : user?.emailVerified ? 'active' : 'pending_verification',
        };
      });

      // Filter to only selected customers
      const selectedCustomers = customersWithStats.filter(c => customerIds.includes(c.id));

      if (format === 'csv') {
        const headers = [
          'First Name',
          'Last Name',
          'Email',
          'Phone',
          'Company',
          'Address',
          'City',
          'Province',
          'Postal Code',
          'Status',
          'Verified',
          'Total Bookings',
          'Total Spent',
          'Last Booking',
          'Registration Date',
        ];

        const rows = selectedCustomers.map((customer: any) => [
          customer.firstName || '',
          customer.lastName || '',
          customer.email || '',
          customer.phone || '',
          customer.company || '',
          customer.address || '',
          customer.city || '',
          customer.province || '',
          customer.postalCode || '',
          customer.status || '',
          customer.isVerified ? 'Yes' : 'No',
          customer.totalBookings || 0,
          customer.totalSpent ? `$${parseFloat(customer.totalSpent).toFixed(2)}` : '$0.00',
          customer.lastBooking ? new Date(customer.lastBooking).toLocaleDateString() : 'Never',
          customer.registrationDate ? new Date(customer.registrationDate).toLocaleString() : '',
        ]);

        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

        logger.info('Bulk customer export completed', {
          component: 'admin-customers-bulk-export',
          action: 'export_csv',
          metadata: { adminId: user?.id || 'unknown', customerCount: selectedCustomers.length },
        });

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="customers-export-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      } else {
        return NextResponse.json(
          { error: 'PDF export not yet implemented. Please use CSV format.' },
          { status: 501 }
        );
      }
    }

    // Use RPC function results
    const selectedCustomers = ((customers || []) as any[]).filter((c: any) => customerIds.includes(c.id));

    if (format === 'csv') {
      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Company',
        'Address',
        'City',
        'Province',
        'Postal Code',
        'Status',
        'Verified',
        'Total Bookings',
        'Total Spent',
        'Last Booking',
        'Registration Date',
      ];

      const rows = selectedCustomers.map((customer: any) => [
        customer.firstName || '',
        customer.lastName || '',
        customer.email || '',
        customer.phone || '',
        customer.company || '',
        customer.address || '',
        customer.city || '',
        customer.province || '',
        customer.postalCode || '',
        customer.status || '',
        customer.isVerified ? 'Yes' : 'No',
        customer.totalBookings || 0,
        customer.totalSpent ? `$${parseFloat(customer.totalSpent).toFixed(2)}` : '$0.00',
        customer.lastBooking ? new Date(customer.lastBooking).toLocaleDateString() : 'Never',
        customer.registrationDate ? new Date(customer.registrationDate).toLocaleString() : '',
      ]);

      const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

      logger.info('Bulk customer export completed', {
        component: 'admin-customers-bulk-export',
        action: 'export_csv',
        metadata: { adminId: user?.id || 'unknown', customerCount: selectedCustomers.length },
      });

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="customers-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'PDF export not yet implemented. Please use CSV format.' },
        { status: 501 }
      );
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: err.issues }, { status: 400 });
    }

    logger.error(
      'Failed to perform customer bulk export',
      { component: 'admin-customers-bulk-export', action: 'error' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Failed to perform bulk export' }, { status: 500 });
  }
}


