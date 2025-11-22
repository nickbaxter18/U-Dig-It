import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

interface BookingListResponse {
  bookings: unknown[];
  total: number;
  page: number;
  pageSize: number;
}

const SORT_COLUMN_MAP: Record<string, string> = {
  createdAt: 'createdAt',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  totalAmount: 'totalAmount',
};

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const search = searchParams.get('search');
  const sortByParam = searchParams.get('sortBy') || 'createdAt';
  const sortOrder =
    (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  const sortColumn = SORT_COLUMN_MAP[sortByParam] ?? 'createdAt';

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
          id,
          bookingNumber,
          customerId,
          equipmentId,
          startDate,
          endDate,
          status,
          totalAmount,
          securityDeposit,
          createdAt,
          updatedAt,
          deliveryAddress,
          deliveryCity,
          deliveryProvince,
          deliveryPostalCode,
          subtotal,
          taxes,
          dailyRate,
          weeklyRate,
          monthlyRate,
          deliveryFee,
          actualStartDate,
          actualEndDate,
          cancelledAt,
          cancellationReason,
          couponCode,
          couponDiscount,
          specialInstructions,
          internalNotes,
          depositAmount,
          balance_amount,
          balance_due_at,
          billing_status,
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

    const equipmentId = searchParams.get('equipmentId');
    if (equipmentId) {
      query = query.eq('equipmentId', equipmentId);
    }

    const startDate = searchParams.get('startDate');
    if (startDate) {
      query = query.gte('startDate', startDate);
    }

    const endDate = searchParams.get('endDate');
    if (endDate) {
      query = query.lte('endDate', endDate);
    }

    if (search) {
      query = query.or(`bookingNumber.ilike.%${search}%,deliveryAddress.ilike.%${search}%`);
    }

    const { data, error: queryError, count } = await query.range(rangeStart, rangeEnd);

    if (queryError) {
      logger.error(
        'Admin bookings fetch failed',
        {
          component: 'admin-bookings-api',
          action: 'fetch_error',
          metadata: {
            message: queryError.message,
            code: queryError.code,
            details: queryError.details,
            hint: queryError.hint,
            rangeStart,
            rangeEnd,
            sortColumn,
            sortOrder,
          },
        },
        queryError
      );
      return NextResponse.json(
        {
          error: 'Failed to fetch bookings',
          details: process.env.NODE_ENV === 'development' ? queryError.message : undefined,
        },
        { status: 500 }
      );
    }

    const response: BookingListResponse = {
      bookings: data ?? [],
      total: count ?? data?.length ?? 0,
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      'Unexpected admin bookings error',
      {
        component: 'admin-bookings-api',
        action: 'unexpected_error',
        metadata: {
          errorName: error instanceof Error ? error.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
});
