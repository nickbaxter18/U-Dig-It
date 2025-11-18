import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { logisticsTaskStatusSchema } from '@/lib/validators/admin/bookings';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    

    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    const payload = logisticsTaskStatusSchema.parse(await request.json());

    const updateBody: Record<string, unknown> = {
      status: payload.status,
    };

    if (payload.routeUrl) updateBody.route_url = payload.routeUrl;
    if (payload.etaMinutes !== undefined) updateBody.eta_minutes = payload.etaMinutes;
    if (payload.notes !== undefined) updateBody.notes = payload.notes;
    if (payload.completedAt) updateBody.completed_at = payload.completedAt;
    if (payload.status === 'completed' && !payload.completedAt) {
      updateBody.completed_at = new Date().toISOString();
    }

    const { data, error: updateError } = await supabase
      .from('logistics_tasks')
      .update(updateBody)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      logger.error(
        'Failed to update logistics task status',
        {
          component: 'admin-logistics-tasks',
          action: 'status_update_failed',
          metadata: { taskId: params.id, adminId: user?.id || 'unknown' },
        },
        updateError
      );
      return NextResponse.json(
        { error: 'Unable to update logistics task status' },
        { status: 500 }
      );
    }

    logger.info('Logistics task status updated', {
      component: 'admin-logistics-tasks',
      action: 'status_updated',
      metadata: { taskId: params.id, adminId: user?.id || 'unknown', status: payload.status },
    });

    return NextResponse.json({ task: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error updating logistics task status',
      {
        component: 'admin-logistics-tasks',
        action: 'status_update_unexpected',
        metadata: { taskId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


