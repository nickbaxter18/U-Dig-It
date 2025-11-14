import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import {
  customerTagCreateSchema,
  customerTagUpdateSchema,
} from '@/lib/validators/admin/customers';

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { data, error: fetchError } = await supabase
      .from('customer_tags')
      .select('id, name, color, description, created_by, created_at, updated_at')
      .order('name', { ascending: true });

    if (fetchError) {
      logger.error(
        'Failed to fetch customer tags',
        { component: 'admin-customer-tags', action: 'fetch_failed' },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to fetch customer tags' },
        { status: 500 }
      );
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
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = customerTagCreateSchema.parse(await request.json());

    const { data, error: insertError } = await supabase
      .from('customer_tags')
      .insert({
        name: payload.name,
        color: payload.color ?? null,
        description: payload.description ?? null,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      logger.error(
        'Failed to create customer tag',
        {
          component: 'admin-customer-tags',
          action: 'create_failed',
          metadata: { name: payload.name, adminId: user.id },
        },
        insertError
      );
      return NextResponse.json(
        { error: 'Unable to create customer tag' },
        { status: 500 }
      );
    }

    logger.info('Customer tag created', {
      component: 'admin-customer-tags',
      action: 'tag_created',
      metadata: { tagId: data?.id, adminId: user.id },
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

