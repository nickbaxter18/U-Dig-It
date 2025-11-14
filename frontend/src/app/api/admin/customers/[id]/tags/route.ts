import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import {
  customerTagAssignSchema,
  customerTagRemoveSchema,
} from '@/lib/validators/admin/customers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { data, error: fetchError } = await supabase
      .from('customer_tag_members')
      .select(
        `
        tag:customer_tags (
          id,
          name,
          color,
          description,
          created_at,
          updated_at
        ),
        assigned_by,
        assigned_at
      `
      )
      .eq('customer_id', params.id);

    if (fetchError) {
      logger.error(
        'Failed to fetch customer tag assignments',
        {
          component: 'admin-customer-tags',
          action: 'assignments_fetch_failed',
          metadata: { customerId: params.id },
        },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to load customer tags' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tags: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching customer tag assignments',
      {
        component: 'admin-customer-tags',
        action: 'assignments_fetch_unexpected',
        metadata: { customerId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = customerTagAssignSchema.parse(await request.json());

    const { error: insertError } = await supabase
      .from('customer_tag_members')
      .upsert({
        customer_id: params.id,
        tag_id: payload.tagId,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
      });

    if (insertError) {
      logger.error(
        'Failed to assign customer tag',
        {
          component: 'admin-customer-tags',
          action: 'assign_failed',
          metadata: { customerId: params.id, tagId: payload.tagId, adminId: user.id },
        },
        insertError
      );
      return NextResponse.json(
        { error: 'Unable to assign tag to customer' },
        { status: 500 }
      );
    }

    logger.info('Customer tag assigned', {
      component: 'admin-customer-tags',
      action: 'tag_assigned',
      metadata: { customerId: params.id, tagId: payload.tagId, adminId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error assigning customer tag',
      {
        component: 'admin-customer-tags',
        action: 'assign_unexpected',
        metadata: { customerId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = customerTagRemoveSchema.parse(await request.json());

    const { error: deleteError } = await supabase
      .from('customer_tag_members')
      .delete()
      .eq('customer_id', params.id)
      .eq('tag_id', payload.tagId);

    if (deleteError) {
      logger.error(
        'Failed to remove customer tag',
        {
          component: 'admin-customer-tags',
          action: 'remove_failed',
          metadata: { customerId: params.id, tagId: payload.tagId, adminId: user.id },
        },
        deleteError
      );
      return NextResponse.json(
        { error: 'Unable to remove customer tag' },
        { status: 500 }
      );
    }

    logger.info('Customer tag removed', {
      component: 'admin-customer-tags',
      action: 'tag_removed',
      metadata: { customerId: params.id, tagId: payload.tagId, adminId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error removing customer tag',
      {
        component: 'admin-customer-tags',
        action: 'remove_unexpected',
        metadata: { customerId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


