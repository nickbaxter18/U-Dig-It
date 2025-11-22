import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { customerTagCreateSchema } from '@/lib/validators/admin/customers';

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
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    const {
      data,
      error: fetchError,
      count,
    } = await supabase
      .from('customer_tags')
      .select('id, name, color, description, created_by, created_at, updated_at', {
        count: 'exact',
      })
      .order('name', { ascending: true })
      .range(rangeStart, rangeEnd);

    if (fetchError) {
      logger.error('Failed to fetch customer tags', {
        component: 'admin-customer-tags',
        action: 'fetch_failed',
      });
      return NextResponse.json({ error: 'Unable to fetch customer tags' }, { status: 500 });
    }

    return NextResponse.json({
      tags: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching customer tags',
      { component: 'admin-customer-tags', action: 'fetch_unexpected' },
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

    const payload = customerTagCreateSchema.parse(await request.json());

    const { data, error: insertError } = await supabase
      .from('customer_tags')
      .insert({
        name: payload.name,
        color: payload.color ?? null,
        description: payload.description ?? null,
        created_by: user?.id || 'unknown',
      })
      .select()
      .single();

    if (insertError) {
      logger.error(
        'Failed to create customer tag',
        {
          component: 'admin-customer-tags',
          action: 'create_failed',
          metadata: { name: payload.name, adminId: user?.id || 'unknown' },
        },
        insertError
      );
      return NextResponse.json({ error: 'Unable to create customer tag' }, { status: 500 });
    }

    logger.info('Customer tag created', {
      component: 'admin-customer-tags',
      action: 'tag_created',
      metadata: { tagId: data?.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ tag: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating customer tag',
      { component: 'admin-customer-tags', action: 'create_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
