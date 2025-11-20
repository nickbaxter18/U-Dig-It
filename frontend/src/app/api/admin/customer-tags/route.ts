import { NextRequest, NextResponse } from 'next/server';

// import { ZodError } from 'zod'; // Reserved for future validation error handling

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { customerTagCreateSchema } from '@/lib/validators/admin/customers';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { data, error: fetchError } = await supabase
      .from('customer_tags')
      .select('id, name, color, description, created_by, created_at, updated_at')
      .order('name', { ascending: true });

    if (fetchError) {
      logger.error('Failed to fetch customer tags', {
        component: 'admin-customer-tags',
        action: 'fetch_failed',
      });
      return NextResponse.json({ error: 'Unable to fetch customer tags' }, { status: 500 });
    }

    return NextResponse.json({ tags: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching customer tags',
      { component: 'admin-customer-tags', action: 'fetch_unexpected' },
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

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
}
