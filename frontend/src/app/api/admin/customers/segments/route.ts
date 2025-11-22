import { ZodError } from 'zod';
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const customerSegmentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  criteria: z.record(z.string(), z.unknown()),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'enterprise']).optional().nullable(),
});

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    const {
      data,
      error: fetchError,
      count,
    } = await supabase
      .from('customer_segments')
      .select(
        'id, name, description, criteria, customer_count, avg_booking_value, avg_booking_frequency, tier, is_active, created_at, updated_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (fetchError) {
      logger.error('Failed to fetch customer segments', {
        component: 'admin-customer-segments',
        action: 'fetch_failed',
      });
      return NextResponse.json({ error: 'Unable to fetch customer segments' }, { status: 500 });
    }

    return NextResponse.json({
      segments: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching customer segments',
      { component: 'admin-customer-segments', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    const payload = customerSegmentCreateSchema.parse(await request.json());

    const { data, error: insertError } = await supabase
      .from('customer_segments')
      .insert({
        name: payload.name,
        description: payload.description ?? null,
        criteria: payload.criteria,
        tier: payload.tier ?? null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      logger.error(
        'Failed to create customer segment',
        {
          component: 'admin-customer-segments',
          action: 'create_failed',
          metadata: { name: payload.name, adminId: user?.id || 'unknown' },
        },
        insertError
      );
      return NextResponse.json({ error: 'Unable to create customer segment' }, { status: 500 });
    }

    logger.info('Customer segment created', {
      component: 'admin-customer-segments',
      action: 'segment_created',
      metadata: { segmentId: data?.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ segment: data }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating customer segment',
      { component: 'admin-customer-segments', action: 'create_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
