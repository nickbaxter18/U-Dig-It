import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { supportSlaUpdateSchema } from '@/lib/validators/admin/support';

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const result = await requireAdmin(request);
      if ('error' in result && result.error) return result.error;
      const supabase = result.supabase ?? (await createServiceClient());
      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
      }

      // Get user for logging - not needed for GET, but available if needed
      const { user: _user } = result;
      const { data, error: fetchError } = await supabase
        .from('support_sla')
        .select(
          'id, ticket_id, priority, target_response_minutes, target_resolution_minutes, first_response_at, resolved_at, breached_response, breached_resolution, created_at, updated_at'
        )
        .eq('ticket_id', params.id)
        .maybeSingle();

      if (fetchError) {
        logger.error(
          'Failed to fetch support SLA',
          {
            component: 'admin-support-sla',
            action: 'fetch_failed',
            metadata: { ticketId: params.id },
          },
          fetchError
        );
        return NextResponse.json({ error: 'Unable to load SLA details' }, { status: 500 });
      }

      return NextResponse.json({ sla: data ?? null });
    } catch (err) {
      logger.error(
        'Unexpected error fetching support SLA',
        {
          component: 'admin-support-sla',
          action: 'fetch_unexpected',
          metadata: { ticketId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const result = await requireAdmin(request);
      if ('error' in result && result.error) return result.error;
      const supabase = result.supabase ?? (await createServiceClient());
      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
      }

      // Get user for logging
      const { user } = result;

      const payload = supportSlaUpdateSchema.parse(await request.json());
      if (Object.keys(payload).length === 0) {
        return NextResponse.json({ success: true });
      }

      const updateBody: Record<string, unknown> = {};
      if (payload.priority !== undefined) updateBody.priority = payload.priority;
      if (payload.targetResponseMinutes !== undefined) {
        updateBody.target_response_minutes = payload.targetResponseMinutes;
      }
      if (payload.targetResolutionMinutes !== undefined) {
        updateBody.target_resolution_minutes = payload.targetResolutionMinutes;
      }

      const { data, error: updateError } = await supabase
        .from('support_sla')
        .update(updateBody)
        .eq('ticket_id', params.id)
        .select()
        .single();

      if (updateError) {
        logger.error(
          'Failed to update support SLA',
          {
            component: 'admin-support-sla',
            action: 'update_failed',
            metadata: { ticketId: params.id, adminId: user?.id || 'unknown' },
          },
          updateError
        );
        return NextResponse.json({ error: 'Unable to update SLA' }, { status: 500 });
      }

      logger.info('Support SLA updated', {
        component: 'admin-support-sla',
        action: 'sla_updated',
        metadata: { ticketId: params.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ sla: data });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error updating support SLA',
        {
          component: 'admin-support-sla',
          action: 'update_unexpected',
          metadata: { ticketId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
