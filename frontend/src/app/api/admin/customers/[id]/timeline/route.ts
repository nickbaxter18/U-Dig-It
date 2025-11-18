import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { customerTimelineQuerySchema } from '@/lib/validators/admin/customers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = customerTimelineQuerySchema.safeParse({
      limit: queryParams.limit ? Number(queryParams.limit) : undefined,
      cursor: queryParams.cursor,
      eventTypes: queryParams.eventTypes,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { limit, cursor, eventTypes } = parsed.data;

    let query = supabase
      .from('customer_timeline_events')
      .select('*')
      .eq('customer_id', params.id)
      .order('occurred_at', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt('occurred_at', cursor);
    }

    if (eventTypes && eventTypes.length > 0) {
      query = query.in('event_type', eventTypes as any);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      logger.error(
        'Failed to fetch customer timeline events',
        {
          component: 'admin-customer-timeline',
          action: 'fetch_failed',
          metadata: { customerId: params.id },
        },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to load timeline events' },
        { status: 500 }
      );
    }

    const items = data ?? [];
    let nextCursor: string | null = null;

    if (items.length > limit) {
      const next = items.pop();
      nextCursor = next?.occurred_at ?? null;
    }

    return NextResponse.json({
      events: items,
      nextCursor,
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching customer timeline events',
      {
        component: 'admin-customer-timeline',
        action: 'fetch_unexpected',
        metadata: { customerId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


