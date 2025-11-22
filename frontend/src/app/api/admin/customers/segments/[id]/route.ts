import { ZodError } from 'zod';
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const customerSegmentUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  criteria: z.record(z.string(), z.unknown()).optional(),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'enterprise']).optional().nullable(),
  is_active: z.boolean().optional(),
});

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

      const payload = customerSegmentUpdateSchema.parse(await request.json());

      const { data, error: updateError } = await supabase
        .from('customer_segments')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single();

      if (updateError) {
        logger.error(
          'Failed to update customer segment',
          {
            component: 'admin-customer-segments',
            action: 'update_failed',
            metadata: { segmentId: params.id, adminId: user?.id || 'unknown' },
          },
          updateError
        );
        return NextResponse.json({ error: 'Unable to update customer segment' }, { status: 500 });
      }

      logger.info('Customer segment updated', {
        component: 'admin-customer-segments',
        action: 'segment_updated',
        metadata: { segmentId: params.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ segment: data });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error updating customer segment',
        {
          component: 'admin-customer-segments',
          action: 'update_unexpected',
          metadata: { segmentId: params.id },
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
        .from('customer_segments')
        .delete()
        .eq('id', params.id);

      if (deleteError) {
        logger.error(
          'Failed to delete customer segment',
          {
            component: 'admin-customer-segments',
            action: 'delete_failed',
            metadata: { segmentId: params.id, adminId: user?.id || 'unknown' },
          },
          deleteError
        );
        return NextResponse.json({ error: 'Unable to delete customer segment' }, { status: 500 });
      }

      logger.info('Customer segment deleted', {
        component: 'admin-customer-segments',
        action: 'segment_deleted',
        metadata: { segmentId: params.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      logger.error(
        'Unexpected error deleting customer segment',
        {
          component: 'admin-customer-segments',
          action: 'delete_unexpected',
          metadata: { segmentId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
