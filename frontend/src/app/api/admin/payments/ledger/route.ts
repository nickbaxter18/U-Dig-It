import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { ledgerQuerySchema } from '@/lib/validators/admin/payments';

export async function GET(request: NextRequest) {
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

    let query = supabase
      .from('financial_ledger')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (bookingId) query = query.eq('booking_id', bookingId);
    if (entryType) query = query.eq('entry_type', entryType);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error: fetchError } = await query;

    if (fetchError) {
      logger.error(
        'Failed to fetch financial ledger',
        {
          component: 'admin-financial-ledger',
          action: 'fetch_failed',
          metadata: { bookingId, entryType },
        },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to load financial ledger' },
        { status: 500 }
      );
    }

    return NextResponse.json({ entries: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching financial ledger',
      { component: 'admin-financial-ledger', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


