import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { ledgerQuerySchema } from '@/lib/validators/admin/payments';

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const parsedResult = ledgerQuerySchema.safeParse({
      bookingId: queryParams.bookingId ?? undefined,
      entryType: queryParams.entryType ?? undefined,
      startDate: queryParams.startDate ?? undefined,
      endDate: queryParams.endDate ?? undefined,
      limit: queryParams.limit ? Number(queryParams.limit) : undefined,
    });

    if (!parsedResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedResult.error.issues },
        { status: 400 }
      );
    }

    const { bookingId, entryType, startDate, endDate, limit } = parsedResult.data;

    // Convert limit to pagination format
    const pageSize = Math.min(Math.max(limit || 100, 1), 500);
    const page = 1; // Legacy API uses limit, so default to page 1
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    let query = supabase
      .from('financial_ledger')
      .select(
        'id, booking_id, entry_type, amount, currency, source, reference_id, description, created_at, created_by',
        { count: 'exact' }
      );

    if (bookingId) query = query.eq('booking_id', bookingId);
    if (entryType) query = query.eq('entry_type', entryType);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    query = query.order('created_at', { ascending: false }).range(rangeStart, rangeEnd);

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      logger.error(
        'Failed to fetch financial ledger',
        {
          component: 'admin-financial-ledger',
          action: 'fetch_failed',
          metadata: {
            bookingId,
            entryType,
            errorCode: (fetchError as any)?.code,
            errorMessage: fetchError.message,
            errorDetails: (fetchError as any)?.details,
            errorHint: (fetchError as any)?.hint,
          },
        },
        fetchError
      );
      return NextResponse.json(
        {
          error: 'Unable to load financial ledger',
          details:
            process.env.NODE_ENV === 'development'
              ? fetchError.message || 'Database query failed'
              : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entries: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching financial ledger',
      {
        component: 'admin-financial-ledger',
        action: 'fetch_unexpected',
        metadata: {
          errorName: err instanceof Error ? err.name : typeof err,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : undefined,
        },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined,
      },
      { status: 500 }
    );
  }
});
