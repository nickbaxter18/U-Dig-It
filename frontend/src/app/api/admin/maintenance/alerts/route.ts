import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import {
  maintenanceAlertCreateSchema,
  maintenanceAlertPatchSchema,
  maintenanceAlertQuerySchema,
} from '@/lib/validators/admin/equipment';

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const filters = maintenanceAlertQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );

    let query = supabase
      .from('maintenance_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.equipmentId) {
      query = query.eq('equipment_id', filters.equipmentId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      logger.error(
        'Failed to fetch maintenance alerts',
        {
          component: 'admin-maintenance-alerts',
          action: 'fetch_failed',
          metadata: filters,
        },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to load maintenance alerts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alerts: data ?? [] });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error fetching maintenance alerts',
      {
        component: 'admin-maintenance-alerts',
        action: 'fetch_unexpected',
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = maintenanceAlertCreateSchema.parse(await request.json());

    const { data, error: insertError } = await supabase
      .from('maintenance_alerts')
      .insert({
        equipment_id: payload.equipmentId,
        alert_type: payload.alertType,
        threshold_value: payload.thresholdValue ?? null,
        triggered_at: payload.triggeredAt ?? null,
        status: 'active',
      })
      .select()
      .single();

    if (insertError || !data) {
      logger.error(
        'Failed to create maintenance alert',
        {
          component: 'admin-maintenance-alerts',
          action: 'create_failed',
          metadata: { equipmentId: payload.equipmentId, adminId: user.id },
        },
        insertError ?? new Error('Missing alert data')
      );
      return NextResponse.json(
        { error: 'Unable to create maintenance alert' },
        { status: 500 }
      );
    }

    logger.info('Maintenance alert created', {
      component: 'admin-maintenance-alerts',
      action: 'alert_created',
      metadata: { alertId: data.id, equipmentId: payload.equipmentId, adminId: user.id },
    });

    return NextResponse.json({ alert: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating maintenance alert',
      {
        component: 'admin-maintenance-alerts',
        action: 'create_unexpected',
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Internal server error while creating maintenance alert' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = maintenanceAlertPatchSchema.parse(await request.json());

    const updateBody: Record<string, unknown> = {};
    if (payload.status) updateBody.status = payload.status;
    if (payload.resolvedAt !== undefined) updateBody.resolved_at = payload.resolvedAt ?? null;
    if (payload.resolvedBy !== undefined) updateBody.resolved_by = payload.resolvedBy ?? null;
    if (payload.status === 'resolved' && updateBody.resolved_at === undefined) {
      updateBody.resolved_at = new Date().toISOString();
      updateBody.resolved_by = user.id;
    }

    if (Object.keys(updateBody).length === 0) {
      return NextResponse.json({ success: true });
    }

    const { data, error: updateError } = await supabase
      .from('maintenance_alerts')
      .update(updateBody)
      .eq('id', payload.alertId)
      .select()
      .single();

    if (updateError) {
      logger.error(
        'Failed to update maintenance alert',
        {
          component: 'admin-maintenance-alerts',
          action: 'update_failed',
          metadata: { alertId: payload.alertId, adminId: user.id },
        },
        updateError
      );
      return NextResponse.json(
        { error: 'Unable to update maintenance alert' },
        { status: 500 }
      );
    }

    logger.info('Maintenance alert updated', {
      component: 'admin-maintenance-alerts',
      action: 'alert_updated',
      metadata: { alertId: payload.alertId, adminId: user.id },
    });

    return NextResponse.json({ alert: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error updating maintenance alert',
      {
        component: 'admin-maintenance-alerts',
        action: 'update_unexpected',
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


