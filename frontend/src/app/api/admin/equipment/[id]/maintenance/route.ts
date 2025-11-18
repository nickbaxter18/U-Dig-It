import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import {
  maintenanceLogCreateSchema,
  maintenancePartSchema,
} from '@/lib/validators/admin/equipment';
import type { TablesInsert, TablesUpdate } from '@/../../supabase/types';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';

const scheduleMaintenanceSchema = z.object({
  title: z.string().min(3).max(200),
  maintenanceType: z.enum(['scheduled', 'preventive', 'repair', 'emergency', 'inspection']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  scheduledDate: z
    .string()
    .refine(value => !Number.isNaN(new Date(value).getTime()), 'Invalid scheduled date'),
  description: z.string().max(2000).optional(),
  performedBy: z.string().max(120).optional(),
  cost: z.number().nonnegative().optional(),
  nextDueDate: z
    .string()
    .optional()
    .nullable()
    .transform(value => (value ? new Date(value).toISOString() : null)),
  nextDueHours: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

function getServiceClient() {
  return createServiceClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    
    // Type guard: after checking error, we know we have supabase and user
    const { supabase } = adminResult;
    if (!supabase) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'logs' or 'scheduled' or null (both)

    // If type is 'scheduled', return scheduled maintenance records
    if (type === 'scheduled') {
      const limitParam = searchParams.get('limit');
      const limit = limitParam ? Math.max(1, Math.min(50, Number(limitParam))) : 10;

      const supabaseAdmin = getServiceClient();
      const { data, error: fetchError } = await supabaseAdmin
        .from('equipment_maintenance')
        .select(
          'id, title, maintenance_type, priority, status, scheduled_date, performed_by, cost, next_due_date'
        )
        .eq('equipment_id', params.id)
        .order('scheduled_date', { ascending: false })
        .limit(limit);

      if (fetchError) {
        logger.error(
          'Failed to load equipment maintenance records',
          {
            component: 'admin-equipment-maintenance-api',
            action: 'fetch_error',
            metadata: { equipmentId: params.id },
          },
          fetchError
        );
        return NextResponse.json(
          { error: 'Failed to load maintenance records' },
          { status: 500 }
        );
      }

      const formatted = (data ?? []).map(record => ({
        id: record.id,
        title: record.title,
        maintenanceType: record.maintenance_type,
        priority: record.priority,
        status: record.status,
        scheduledDate: record.scheduled_date,
        performedBy: record.performed_by,
        cost: record.cost,
        nextDueDate: record.next_due_date,
      }));

      return NextResponse.json({ data: formatted });
    }

    // Default: return maintenance logs (history)
    const { data, error: fetchError } = await supabase
      .from('maintenance_logs')
      .select(
        `
        id,
        equipment_id,
        maintenance_type,
        performed_at,
        technician,
        notes,
        cost,
        duration_hours,
        status,
        next_due_at,
        documents,
        created_by,
        created_at,
        updated_at,
        parts:maintenance_parts (
          id,
          part_name,
          quantity,
          cost_per_unit,
          supplier,
          created_at,
          updated_at
        )
      `
      )
      .eq('equipment_id', params.id)
      .is('deleted_at', null)
      .order('performed_at', { ascending: false });

    if (fetchError) {
      logger.error(
        'Failed to fetch equipment maintenance logs',
        {
          component: 'admin-equipment-maintenance',
          action: 'fetch_logs_failed',
          metadata: { equipmentId: params.id },
        },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to load maintenance logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ maintenanceLogs: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching maintenance data',
      {
        component: 'admin-equipment-maintenance',
        action: 'fetch_unexpected',
        metadata: { equipmentId: params.id },
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
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    
    // Type guard: after checking error, we know we have supabase and user
    const { supabase, user } = adminResult;
    if (!supabase) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const body = await request.json();

    // Check if this is a scheduled maintenance request (has 'title' field) or a log entry
    if (body.title) {
      // Handle scheduled maintenance
      const validated = scheduleMaintenanceSchema.parse(body);
      const scheduledDate = new Date(validated.scheduledDate);

      if (Number.isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduled date' },
          { status: 400 }
        );
      }

      const supabaseAdmin = getServiceClient();

      const maintenancePayload: TablesInsert<'equipment_maintenance'> = {
        equipment_id: params.id,
        title: validated.title,
        maintenance_type: validated.maintenanceType,
        priority: validated.priority,
        status: 'scheduled',
        scheduled_date: scheduledDate.toISOString(),
        description: validated.description ?? null,
        performed_by: validated.performedBy ?? null,
        cost: validated.cost ?? null,
        next_due_date: validated.nextDueDate ?? null,
        next_due_hours: validated.nextDueHours ?? null,
        notes: validated.notes ?? null,
      };

      const { data, error: insertError } = await supabaseAdmin
        .from('equipment_maintenance')
        .insert(maintenancePayload)
        .select(
          'id, title, maintenance_type, priority, status, scheduled_date, performed_by, cost, next_due_date'
        )
        .single();

      if (insertError) {
        logger.error(
          'Failed to schedule maintenance',
          {
            component: 'admin-equipment-maintenance-api',
            action: 'insert_error',
            metadata: { equipmentId: params.id, adminId: user.id },
          },
          insertError
        );
        return NextResponse.json(
          { error: 'Failed to schedule maintenance' },
          { status: 500 }
        );
      }

      const equipmentUpdates: TablesUpdate<'equipment'> = {
        nextMaintenanceDue: maintenancePayload.next_due_date ?? maintenancePayload.scheduled_date,
      };

      if (scheduledDate <= new Date()) {
        equipmentUpdates.status = 'maintenance';
      }

      const { error: equipmentUpdateError } = await supabaseAdmin
        .from('equipment')
        .update(equipmentUpdates)
        .eq('id', params.id);

      if (equipmentUpdateError) {
        logger.error(
          'Failed to update equipment maintenance metadata',
          {
            component: 'admin-equipment-maintenance-api',
            action: 'equipment_update_error',
            metadata: { equipmentId: params.id, adminId: user.id },
          },
          equipmentUpdateError
        );
      }

      logger.info('Maintenance scheduled for equipment', {
        component: 'admin-equipment-maintenance-api',
        action: 'maintenance_scheduled',
        metadata: {
          equipmentId: params.id,
          maintenanceId: data.id,
          adminId: user.id,
          maintenanceType: validated.maintenanceType,
          priority: validated.priority,
        },
      });

      return NextResponse.json(
        {
          data: {
            id: data.id,
            title: data.title,
            maintenanceType: data.maintenance_type,
            priority: data.priority,
            status: data.status,
            scheduledDate: data.scheduled_date,
            performedBy: data.performed_by,
            cost: data.cost,
            nextDueDate: data.next_due_date,
          },
        },
        { status: 201 }
      );
    }

    // Handle maintenance log entry
    const payload = maintenanceLogCreateSchema.parse(body);

    const { data: maintenanceLog, error: insertError } = await supabase
      .from('maintenance_logs')
      .insert({
        equipment_id: params.id,
        maintenance_type: payload.maintenanceType,
        performed_at: payload.performedAt,
        technician: payload.technician ?? null,
        notes: payload.notes ?? null,
        cost: payload.cost ?? null,
        duration_hours: payload.durationHours ?? null,
        status: payload.status ?? 'completed',
        next_due_at: payload.nextDueAt ?? null,
        documents: payload.documents ?? [],
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !maintenanceLog) {
      logger.error(
        'Failed to create maintenance log',
        {
          component: 'admin-equipment-maintenance',
          action: 'create_log_failed',
          metadata: { equipmentId: params.id },
        },
        insertError ?? new Error('Missing maintenance log data')
      );
      return NextResponse.json(
        { error: 'Unable to create maintenance log' },
        { status: 500 }
      );
    }

    const parts = payload.parts ?? [];
    let partsResult = [];

    if (parts.length > 0) {
      const validParts = parts.map(part => {
        const parsed = maintenancePartSchema.parse(part);
        return {
          log_id: maintenanceLog.id,
          part_name: parsed.partName,
          quantity: parsed.quantity ?? 1,
          cost_per_unit: parsed.costPerUnit ?? null,
          supplier: parsed.supplier ?? null,
        };
      });

      const { data: insertedParts, error: partsError } = await supabase
        .from('maintenance_parts')
        .insert(validParts)
        .select();

      if (partsError) {
        logger.error(
          'Maintenance log created but parts insertion failed',
          {
            component: 'admin-equipment-maintenance',
            action: 'parts_insert_failed',
            metadata: { maintenanceLogId: maintenanceLog.id },
          },
          partsError
        );
      } else {
        partsResult = insertedParts ?? [];
      }
    }

    logger.info('Maintenance log created', {
      component: 'admin-equipment-maintenance',
      action: 'maintenance_log_created',
      metadata: { maintenanceLogId: maintenanceLog.id, equipmentId: params.id, adminId: user.id },
    });

    return NextResponse.json({
      maintenanceLog: {
        ...maintenanceLog,
        parts: partsResult,
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating maintenance log',
      {
        component: 'admin-equipment-maintenance',
        action: 'create_log_unexpected',
        metadata: { equipmentId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json(
      { error: 'Internal server error while creating maintenance log' },
      { status: 500 }
    );
  }
}
