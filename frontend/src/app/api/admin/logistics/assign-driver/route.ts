import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { assignDriverSchema } from '@/lib/validators/admin/bookings';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = assignDriverSchema.parse(await request.json());

    const { data: task, error: taskError } = await supabase
      .from('logistics_tasks')
      .select('id, booking_id, task_type, driver_id, status, scheduled_at')
      .eq('id', payload.taskId)
      .maybeSingle();

    if (taskError) {
      logger.error(
        'Failed to load logistics task for driver assignment',
        {
          component: 'admin-logistics-assign-driver',
          action: 'task_fetch_failed',
          metadata: { taskId: payload.taskId },
        },
        taskError
      );
      return NextResponse.json(
        { error: 'Unable to assign driver to logistics task' },
        { status: 500 }
      );
    }

    if (!task) {
      return NextResponse.json({ error: 'Logistics task not found' }, { status: 404 });
    }

    const updateBody: Record<string, unknown> = {
      driver_id: payload.driverId,
      status: task.status === 'pending' ? 'scheduled' : task.status,
    };

    if (payload.scheduledAt) {
      updateBody.scheduled_at = payload.scheduledAt;
    }
    if (payload.routeUrl) {
      updateBody.route_url = payload.routeUrl;
    }
    if (payload.etaMinutes !== undefined) {
      updateBody.eta_minutes = payload.etaMinutes;
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('logistics_tasks')
      .update(updateBody)
      .eq('id', payload.taskId)
      .select()
      .single();

    if (updateError) {
      logger.error(
        'Failed to assign driver to logistics task',
        {
          component: 'admin-logistics-assign-driver',
          action: 'task_update_failed',
          metadata: { taskId: payload.taskId, driverId: payload.driverId },
        },
        updateError
      );
      return NextResponse.json(
        { error: 'Unable to assign driver to logistics task' },
        { status: 500 }
      );
    }

    const { data: existingAssignment } = await supabase
      .from('delivery_assignments')
      .select('id')
      .eq('task_id', payload.taskId)
      .maybeSingle();

    const assignmentRecord = {
      task_id: payload.taskId,
      booking_id: task.booking_id,
      driver_id: payload.driverId,
      assigned_at: new Date().toISOString(),
      assigned_by: user.id,
      status: 'assigned',
      route_url: payload.routeUrl ?? null,
      eta_minutes: payload.etaMinutes ?? null,
    };

    const { error: assignmentError } = existingAssignment
      ? await supabase
          .from('delivery_assignments')
          .update(assignmentRecord)
          .eq('id', existingAssignment.id)
      : await supabase.from('delivery_assignments').insert(assignmentRecord);

    if (assignmentError) {
      logger.warn(
        'Driver assignment succeeded but delivery assignment sync failed',
        {
          component: 'admin-logistics-assign-driver',
          action: 'delivery_assignment_failed',
          metadata: { taskId: payload.taskId, driverId: payload.driverId },
        },
        assignmentError
      );
    }

    logger.info('Driver assigned to logistics task', {
      component: 'admin-logistics-assign-driver',
      action: 'driver_assigned',
      metadata: { taskId: payload.taskId, driverId: payload.driverId, adminId: user.id },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error assigning driver to logistics task',
      {
        component: 'admin-logistics-assign-driver',
        action: 'unexpected_error',
      },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json(
      { error: 'Internal server error while assigning driver' },
      { status: 500 }
    );
  }
}


