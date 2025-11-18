import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

interface BookingListResponse {
  bookings: any[];
  total: number;
  page: number;
  pageSize: number;
}

const SORT_COLUMN_MAP: Record<string, string> = {
  createdAt: 'created_at',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  totalAmount: 'totalAmount',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const search = searchParams.get('search');
  const sortByParam = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  const sortColumn = SORT_COLUMN_MAP[sortByParam] ?? 'created_at';

  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    let query = supabase
      .from('bookings')
      .select(
        `
          *,
          customer:customerId (
            id,
            firstName,
            lastName,
            email
          ),
          equipment:equipmentId (
            id,
            make,
            model
          )
        `,
        { count: 'exact' }
      )
      .order(sortColumn, { ascending: sortOrder === 'asc' });

    if (status) {
      query = query.eq('status', status);
    }

    if (customerId) {
      query = query.eq('customerId', customerId);
    }

    if (search) {
      query = query.ilike('bookingNumber', `%${search}%`);
    }

    const { data, error: queryError, count } = await query.range(rangeStart, rangeEnd);

    if (queryError) {
      logger.error('Admin bookings fetch failed', {
        component: 'admin-bookings-api',
        action: 'fetch_error',
        metadata: { message: queryError.message },
      }, queryError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    const response: BookingListResponse = {
      bookings: data ?? [],
      total: count ?? (data?.length ?? 0),
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Unexpected admin bookings error', {
      component: 'admin-bookings-api',
      action: 'unexpected_error',
    }, error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


