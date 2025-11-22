import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { maintenanceLogUpdateSchema } from '@/lib/validators/admin/equipment';

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

      const payload = maintenanceLogUpdateSchema.parse(await request.json());

      const updateBody: Record<string, unknown> = {};
      if (payload.maintenanceType) updateBody.maintenance_type = payload.maintenanceType;
      if (payload.performedAt) updateBody.performed_at = payload.performedAt;
      if (payload.technician !== undefined) updateBody.technician = payload.technician ?? null;
      if (payload.notes !== undefined) updateBody.notes = payload.notes ?? null;
      if (payload.cost !== undefined) updateBody.cost = payload.cost ?? null;
      if (payload.durationHours !== undefined)
        updateBody.duration_hours = payload.durationHours ?? null;
      if (payload.status) updateBody.status = payload.status;
      if (payload.nextDueAt !== undefined) updateBody.next_due_at = payload.nextDueAt ?? null;
      if (payload.documents !== undefined) updateBody.documents = payload.documents ?? [];

      if (Object.keys(updateBody).length === 0) {
        return NextResponse.json({ success: true });
      }

      const { data, error: updateError } = await supabase
        .from('maintenance_logs')
        .update(updateBody)
        .eq('id', params.id)
        .is('deleted_at', null)
        .select()
        .single();

      if (updateError) {
        logger.error(
          'Failed to update maintenance log',
          {
            component: 'admin-maintenance-log',
            action: 'update_failed',
            metadata: { maintenanceLogId: params.id, adminId: user?.id || 'unknown' },
          },
          updateError
        );
        return NextResponse.json({ error: 'Unable to update maintenance log' }, { status: 500 });
      }

      logger.info('Maintenance log updated', {
        component: 'admin-maintenance-log',
        action: 'log_updated',
        metadata: { maintenanceLogId: params.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ maintenanceLog: data });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error updating maintenance log',
        {
          component: 'admin-maintenance-log',
          action: 'update_unexpected',
          metadata: { maintenanceLogId: params.id },
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
        .from('maintenance_logs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', params.id);

      if (deleteError) {
        logger.error(
          'Failed to soft delete maintenance log',
          {
            component: 'admin-maintenance-log',
            action: 'delete_failed',
            metadata: { maintenanceLogId: params.id, adminId: user?.id || 'unknown' },
          },
          deleteError
        );
        return NextResponse.json({ error: 'Unable to delete maintenance log' }, { status: 500 });
      }

      logger.info('Maintenance log soft deleted', {
        component: 'admin-maintenance-log',
        action: 'log_deleted',
        metadata: { maintenanceLogId: params.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      logger.error(
        'Unexpected error deleting maintenance log',
        {
          component: 'admin-maintenance-log',
          action: 'delete_unexpected',
          metadata: { maintenanceLogId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
