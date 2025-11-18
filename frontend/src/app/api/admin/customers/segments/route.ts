import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { z } from 'zod';

const customerSegmentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  criteria: z.record(z.string(), z.unknown()),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'enterprise']).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    const { data, error: fetchError } = await supabase
      .from('customer_segments')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error(
        'Failed to fetch customer segments',
        { component: 'admin-customer-segments', action: 'fetch_failed' });
      return NextResponse.json(
        { error: 'Unable to fetch customer segments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ segments: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching customer segments',
      { component: 'admin-customer-segments', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      return NextResponse.json(
        { error: 'Unable to create customer segment' },
        { status: 500 }
      );
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

