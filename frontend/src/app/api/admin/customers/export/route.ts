import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

type CustomerRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  status?: string;
  isVerified?: boolean;
  isActive?: boolean;
  totalBookings?: number;
  totalSpent?: number;
  lastBooking?: string | Date | null;
  registrationDate?: string | Date | null;
};

function formatCsvValue(value: unknown) {
  const asString = value === null || value === undefined ? '' : String(value);
  return `"${asString.replace(/"/g, '""')}"`;
}

function normalizeCustomer(record: CustomerRecord): CustomerRecord {
  return {
    ...record,
    totalBookings: Number(record.totalBookings ?? 0),
    totalSpent: Number(record.totalSpent ?? 0),
    lastBooking: record.lastBooking ? new Date(record.lastBooking) : null,
    registrationDate: record.registrationDate ? new Date(record.registrationDate) : null,
    isVerified: Boolean(record.isVerified),
    isActive: Boolean(record.isActive),
    status: record.status || (record.isVerified ? 'active' : 'pending_verification'),
  };
}

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const {
      data: { user: _user },
    } = await supabase.auth.getUser();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') ?? 'all';
    const searchTerm = (searchParams.get('search') ?? '').trim().toLowerCase();

    let customersData: CustomerRecord[] | null = null;

    const rpcResult = await supabase.rpc('get_customers_with_stats');
    if (!rpcResult.error && rpcResult.data) {
      customersData = (rpcResult.data as CustomerRecord[]).map(normalizeCustomer);
    } else {
      // Fallback to manual aggregation
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .not('role', 'in', '("admin","super_admin")')
        .order('createdAt', { ascending: false });

      if (usersError) throw usersError;

      const userIds = (usersData ?? []).map((user) => user?.id || 'unknown');
      let bookingsByCustomer: Record<
        string,
        Array<{ totalAmount: number; createdAt: string; status: string }>
      > = {};

      if (userIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('customerId, totalAmount, createdAt, status')
          .in('customerId', userIds);

        if (bookingsError) throw bookingsError;

        bookingsByCustomer = (bookingsData ?? []).reduce(
          (acc, booking: unknown) => {
            if (!booking.customerId) {
              return acc;
            }
            if (!acc[booking.customerId]) {
              acc[booking.customerId] = [];
            }
            acc[booking.customerId].push({
              totalAmount: Number(booking.totalAmount ?? 0),
              createdAt: booking.createdAt,
              status: booking.status,
            });
            return acc;
          },
          {} as Record<string, Array<{ totalAmount: number; createdAt: string; status: string }>>
        );
      }

      customersData = (usersData ?? []).map((user: unknown) => {
        const customerBookings = bookingsByCustomer[user?.id || 'unknown'] ?? [];
        const totalBookings = customerBookings.length;
        const totalSpent = customerBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        const lastBooking =
          customerBookings.length > 0
            ? new Date(
                Math.max(
                  ...customerBookings.map((booking) => new Date(booking.createdAt).getTime())
                )
              )
            : null;
        const status =
          user?.status === 'suspended'
            ? 'suspended'
            : user?.emailVerified
              ? 'active'
              : 'pending_verification';

        return normalizeCustomer({
          id: user?.id || 'unknown',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || 'unknown',
          phone: user?.phone || '',
          company: user?.companyName || '',
          status,
          isVerified: Boolean(user?.emailVerified),
          isActive: user?.status === 'active',
          totalBookings,
          totalSpent,
          lastBooking,
          registrationDate: user?.createdAt,
        });
      });
    }

    const filteredCustomers = (customersData ?? []).filter((customer) => {
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      const matchesSearch =
        !searchTerm ||
        `${customer.firstName ?? ''} ${customer.lastName ?? ''}`
          .toLowerCase()
          .includes(searchTerm) ||
        (customer.email ?? '').toLowerCase().includes(searchTerm) ||
        (customer.phone ?? '').toLowerCase().includes(searchTerm) ||
        (customer.company ?? '').toLowerCase().includes(searchTerm);
      return matchesStatus && matchesSearch;
    });

    const header = [
      'Customer Name',
      'Email',
      'Phone',
      'Company',
      'Status',
      'Verified',
      'Total Bookings',
      'Total Spent (CAD)',
      'Last Booking',
      'Registered At',
    ];

    const rows = filteredCustomers.map((customer) => [
      `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'N/A',
      customer.email ?? 'N/A',
      customer.phone ?? '',
      customer.company ?? '',
      customer.status ?? 'unknown',
      customer.isVerified ? 'Yes' : 'No',
      Number(customer.totalBookings ?? 0).toString(),
      Number(customer.totalSpent ?? 0).toFixed(2),
      customer.lastBooking ? new Date(customer.lastBooking).toLocaleDateString() : '',
      customer.registrationDate ? new Date(customer.registrationDate).toLocaleDateString() : '',
    ]);

    const csvContent = [header, ...rows].map((row) => row.map(formatCsvValue).join(',')).join('\n');
    const filename = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error(
      'Customers export failed',
      {
        component: 'admin-customers-api',
        action: 'export_failed',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Failed to export customers' }, { status: 500 });
  }
}
