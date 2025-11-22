import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { customerTagUpdateSchema } from '@/lib/validators/admin/customers';

export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      const payload = customerTagUpdateSchema.parse(await request.json());

      if (Object.keys(payload).length === 0) {
        return NextResponse.json({ success: true });
      }

      const updateBody: Record<string, unknown> = {};
      if (payload.name !== undefined) updateBody.name = payload.name;
      if (payload.color !== undefined) updateBody.color = payload.color ?? null;
      if (payload.description !== undefined) updateBody.description = payload.description ?? null;

      const { data, error: updateError } = await supabase
        .from('customer_tags')
        .update(updateBody)
        .eq('id', params.id)
        .select()
        .single();

      if (updateError) {
        logger.error(
          'Failed to update customer tag',
          {
            component: 'admin-customer-tags',
            action: 'update_failed',
            metadata: { tagId: params.id, adminId: user?.id || 'unknown' },
          },
          updateError
        );
        return NextResponse.json({ error: 'Unable to update customer tag' }, { status: 500 });
      }

      logger.info('Customer tag updated', {
        component: 'admin-customer-tags',
        action: 'tag_updated',
        metadata: { tagId: params.id, adminId: user?.id || 'unknown' },
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
        'Unexpected error updating customer tag',
        {
          component: 'admin-customer-tags',
          action: 'update_unexpected',
          metadata: { tagId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const DELETE = withRateLimit(
  RateLimitPresets.VERY_STRICT,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      const { error: deleteError } = await supabase
        .from('customer_tags')
        .delete()
        .eq('id', params.id);

      if (deleteError) {
        logger.error(
          'Failed to delete customer tag',
          {
            component: 'admin-customer-tags',
            action: 'delete_failed',
            metadata: { tagId: params.id, adminId: user?.id || 'unknown' },
          },
          deleteError
        );
        return NextResponse.json({ error: 'Unable to delete customer tag' }, { status: 500 });
      }

      logger.info('Customer tag deleted', {
        component: 'admin-customer-tags',
        action: 'tag_deleted',
        metadata: { tagId: params.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      logger.error(
        'Unexpected error deleting customer tag',
        {
          component: 'admin-customer-tags',
          action: 'delete_unexpected',
          metadata: { tagId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
