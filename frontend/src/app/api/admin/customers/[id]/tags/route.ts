import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { customerTagAssignSchema, customerTagRemoveSchema } from '@/lib/validators/admin/customers';

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get pagination parameters (tag assignments are typically small, but add pagination for consistency)
      const { searchParams } = new URL(request.url);
      const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
      const pageSize = Math.min(
        Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1),
        100
      );
      const rangeStart = (page - 1) * pageSize;
      const rangeEnd = rangeStart + pageSize - 1;

      const {
        data,
        error: fetchError,
        count,
      } = await supabase
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
        `,
          { count: 'exact' }
        )
        .eq('customer_id', params.id)
        .range(rangeStart, rangeEnd);

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
        return NextResponse.json({ error: 'Unable to load customer tags' }, { status: 500 });
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
);

export const POST = withRateLimit(
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

      const payload = customerTagAssignSchema.parse(await request.json());

      const { error: insertError } = await supabase.from('customer_tag_members').upsert({
        customer_id: params.id,
        tag_id: payload.tagId,
        assigned_by: user?.id || 'unknown',
        assigned_at: new Date().toISOString(),
      });

      if (insertError) {
        logger.error(
          'Failed to assign customer tag',
          {
            component: 'admin-customer-tags',
            action: 'assign_failed',
            metadata: {
              customerId: params.id,
              tagId: payload.tagId,
              adminId: user?.id || 'unknown',
            },
          },
          insertError
        );
        return NextResponse.json({ error: 'Unable to assign tag to customer' }, { status: 500 });
      }

      logger.info('Customer tag assigned', {
        component: 'admin-customer-tags',
        action: 'tag_assigned',
        metadata: { customerId: params.id, tagId: payload.tagId, adminId: user?.id || 'unknown' },
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
);

export const DELETE = withRateLimit(
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
            metadata: {
              customerId: params.id,
              tagId: payload.tagId,
              adminId: user?.id || 'unknown',
            },
          },
          deleteError
        );
        return NextResponse.json({ error: 'Unable to remove customer tag' }, { status: 500 });
      }

      logger.info('Customer tag removed', {
        component: 'admin-customer-tags',
        action: 'tag_removed',
        metadata: { customerId: params.id, tagId: payload.tagId, adminId: user?.id || 'unknown' },
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
);
