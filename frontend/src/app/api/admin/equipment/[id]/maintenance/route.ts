import type { TablesInsert, TablesUpdate } from '@/../../supabase/types';
import { ZodError } from 'zod';
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import {
  maintenanceLogCreateSchema,
  maintenanceLogUpdateSchema,
  maintenancePartSchema,
} from '@/lib/validators/admin/equipment';

const scheduleMaintenanceSchema = z.object({
  title: z.string().min(3).max(200),
  maintenanceType: z.enum(['scheduled', 'preventive', 'repair', 'emergency', 'inspection']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  scheduledDate: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Invalid scheduled date'),
  description: z.string().max(2000).optional(),
  performedBy: z.string().max(120).optional(),
  cost: z.number().nonnegative().optional(),
  nextDueDate: z
    .string()
    .optional()
    .nullable()
    .transform((value) => (value ? new Date(value).toISOString() : null)),
  nextDueHours: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

const updateScheduledMaintenanceSchema = scheduleMaintenanceSchema.partial().extend({
  maintenanceId: z.string().uuid(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue']).optional(),
});

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const resolvedParams = await Promise.resolve(params);
      const equipmentId = resolvedParams.id;

      const adminResult = await requireAdmin(request);
      if (adminResult.error) return adminResult.error;

      // Type guard: after checking error, we know we have supabase and user
      const { supabase } = adminResult;
      if (!supabase) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }

      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type'); // 'logs' or 'scheduled' or null (both)

      // Get pagination parameters
      const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
      const pageSize = Math.min(
        Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1),
        100
      );
      const rangeStart = (page - 1) * pageSize;
      const rangeEnd = rangeStart + pageSize - 1;

      // If type is 'scheduled', return scheduled maintenance records
      if (type === 'scheduled') {
        const supabaseAdmin = await createServiceClient();
        if (!supabaseAdmin) {
          logger.error('Service client not available for fetching scheduled maintenance', {
            component: 'admin-equipment-maintenance-api',
            action: 'service_client_missing',
            metadata: { equipmentId },
          });
          return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
        }

        const {
          data,
          error: fetchError,
          count,
        } = await supabaseAdmin
          .from('equipment_maintenance')
          .select(
            'id, title, maintenance_type, priority, status, scheduled_date, performed_by, cost, next_due_date, next_due_hours, description, notes',
            { count: 'exact' }
          )
          .eq('equipment_id', equipmentId)
          .order('scheduled_date', { ascending: true }) // Show upcoming first
          .range(rangeStart, rangeEnd);

        if (fetchError) {
          logger.error(
            'Failed to load equipment maintenance records',
            {
              component: 'admin-equipment-maintenance-api',
              action: 'fetch_error',
              metadata: { equipmentId },
            },
            fetchError
          );
          return NextResponse.json(
            { error: 'Failed to load maintenance records' },
            { status: 500 }
          );
        }

        const formatted = (data ?? []).map((record) => ({
          id: record.id,
          title: record.title,
          maintenanceType: record.maintenance_type,
          priority: record.priority,
          status: record.status,
          scheduledDate: record.scheduled_date,
          performedBy: record.performed_by,
          cost: record.cost,
          nextDueDate: record.next_due_date,
          nextDueHours: record.next_due_hours,
          description: record.description,
          notes: record.notes,
        }));

        return NextResponse.json({
          data: formatted,
          pagination: {
            page,
            pageSize,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / pageSize),
          },
        });
      }

      // Default: return maintenance logs (history)
      // Use service client to bypass RLS since we've already verified admin access
      const supabaseAdmin = await createServiceClient();
      if (!supabaseAdmin) {
        logger.error('Service client not available for fetching maintenance logs', {
          component: 'admin-equipment-maintenance-api',
          action: 'service_client_missing',
          metadata: { equipmentId },
        });
        return NextResponse.json(
          { error: 'Service configuration error - service role key not available' },
          { status: 500 }
        );
      }

      const {
        data,
        error: fetchError,
        count: logsCount,
      } = await supabaseAdmin
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
        `,
          { count: 'exact' }
        )
        .eq('equipment_id', equipmentId)
        .is('deleted_at', null)
        .order('performed_at', { ascending: false })
        .range(rangeStart, rangeEnd);

      if (fetchError) {
        logger.error(
          'Failed to fetch equipment maintenance logs',
          {
            component: 'admin-equipment-maintenance',
            action: 'fetch_logs_failed',
            metadata: { equipmentId },
          },
          fetchError
        );
        return NextResponse.json({ error: 'Unable to load maintenance logs' }, { status: 500 });
      }

      return NextResponse.json({
        maintenanceLogs: data ?? [],
        pagination: {
          page,
          pageSize,
          total: logsCount ?? 0,
          totalPages: Math.ceil((logsCount ?? 0) / pageSize),
        },
      });
    } catch (err) {
      logger.error(
        'Unexpected error fetching maintenance data',
        {
          component: 'admin-equipment-maintenance',
          action: 'fetch_unexpected',
          metadata: { equipmentId: resolvedParams.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = withRateLimit(
  RateLimitPresets.STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const resolvedParams = await Promise.resolve(params);
      const equipmentId = resolvedParams.id;

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
          return NextResponse.json({ error: 'Invalid scheduled date' }, { status: 400 });
        }

        const supabaseAdmin = await createServiceClient();
        if (!supabaseAdmin) {
          logger.error('Service client not available for scheduling maintenance', {
            component: 'admin-equipment-maintenance-api',
            action: 'service_client_missing',
            metadata: { equipmentId },
          });
          return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
        }

        const maintenancePayload: TablesInsert<'equipment_maintenance'> = {
          equipment_id: equipmentId,
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
              metadata: { equipmentId, adminId: user.id },
            },
            insertError
          );
          return NextResponse.json({ error: 'Failed to schedule maintenance' }, { status: 500 });
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
          .eq('id', equipmentId);

        if (equipmentUpdateError) {
          logger.error(
            'Failed to update equipment maintenance metadata',
            {
              component: 'admin-equipment-maintenance-api',
              action: 'equipment_update_error',
              metadata: { equipmentId, adminId: user.id },
            },
            equipmentUpdateError
          );
        }

        logger.info('Maintenance scheduled for equipment', {
          component: 'admin-equipment-maintenance-api',
          action: 'maintenance_scheduled',
          metadata: {
            equipmentId,
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
          equipment_id: equipmentId,
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
            metadata: { equipmentId },
          },
          insertError ?? new Error('Missing maintenance log data')
        );
        return NextResponse.json({ error: 'Unable to create maintenance log' }, { status: 500 });
      }

      const parts = payload.parts ?? [];
      let partsResult = [];

      if (parts.length > 0) {
        const validParts = parts.map((part) => {
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
        metadata: { maintenanceLogId: maintenanceLog.id, equipmentId, adminId: user.id },
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
          metadata: { equipmentId: resolvedParams.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json(
        { error: 'Internal server error while creating maintenance log' },
        { status: 500 }
      );
    }
  }
);

export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const resolvedParams = await Promise.resolve(params);
      const equipmentId = resolvedParams.id;

      const adminResult = await requireAdmin(request);
      if (adminResult.error) return adminResult.error;

      const { user } = adminResult;
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { logId, maintenanceId, ...updateData } = body;

      // Check if this is a scheduled maintenance update or a log update
      const { searchParams } = new URL(request.url);
      const isScheduled = searchParams.get('type') === 'scheduled' || maintenanceId;

      if (isScheduled) {
        // Handle scheduled maintenance update
        if (!maintenanceId) {
          return NextResponse.json({ error: 'Maintenance ID is required' }, { status: 400 });
        }

        const validated = updateScheduledMaintenanceSchema.parse({ maintenanceId, ...updateData });

        const supabaseAdmin = await createServiceClient();
        if (!supabaseAdmin) {
          logger.error('Service client not available for updating scheduled maintenance', {
            component: 'admin-equipment-maintenance-api',
            action: 'service_client_missing',
            metadata: { equipmentId, maintenanceId },
          });
          return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
        }

        const updatePayload: Record<string, unknown> = {};
        if (validated.title) updatePayload.title = validated.title;
        if (validated.maintenanceType) updatePayload.maintenance_type = validated.maintenanceType;
        if (validated.priority) updatePayload.priority = validated.priority;
        if (validated.status) updatePayload.status = validated.status;
        if (validated.scheduledDate) {
          const scheduledDate = new Date(validated.scheduledDate);
          updatePayload.scheduled_date = scheduledDate.toISOString();
        }
        if (validated.description !== undefined)
          updatePayload.description = validated.description || null;
        if (validated.performedBy !== undefined)
          updatePayload.performed_by = validated.performedBy || null;
        if (validated.cost !== undefined) updatePayload.cost = validated.cost || null;
        if (validated.nextDueDate !== undefined)
          updatePayload.next_due_date = validated.nextDueDate || null;
        if (validated.nextDueHours !== undefined)
          updatePayload.next_due_hours = validated.nextDueHours || null;
        if (validated.notes !== undefined) updatePayload.notes = validated.notes || null;

        const { data: updatedMaintenance, error: updateError } = await supabaseAdmin
          .from('equipment_maintenance')
          .update(updatePayload)
          .eq('id', maintenanceId)
          .eq('equipment_id', equipmentId)
          .select(
            'id, title, maintenance_type, priority, status, scheduled_date, performed_by, cost, next_due_date'
          )
          .single();

        if (updateError || !updatedMaintenance) {
          logger.error(
            'Failed to update scheduled maintenance',
            {
              component: 'admin-equipment-maintenance-api',
              action: 'update_scheduled_failed',
              metadata: { equipmentId, maintenanceId },
            },
            updateError ?? new Error('Missing updated maintenance data')
          );
          return NextResponse.json(
            { error: 'Unable to update scheduled maintenance' },
            { status: 500 }
          );
        }

        // Update equipment next maintenance due if needed
        if (validated.nextDueDate || validated.scheduledDate) {
          const nextDue = validated.nextDueDate
            ? new Date(validated.nextDueDate)
            : validated.scheduledDate
              ? new Date(validated.scheduledDate)
              : null;

          if (nextDue) {
            const { error: equipmentUpdateError } = await supabaseAdmin
              .from('equipment')
              .update({ nextMaintenanceDue: nextDue.toISOString() })
              .eq('id', equipmentId);

            if (equipmentUpdateError) {
              // Only log in development to reduce production noise
              if (process.env.NODE_ENV === 'development') {
                logger.warn('Failed to update equipment next maintenance due', {
                  component: 'admin-equipment-maintenance-api',
                  metadata: { equipmentId },
                });
              }
            }
          }
        }

        logger.info('Scheduled maintenance updated', {
          component: 'admin-equipment-maintenance-api',
          action: 'scheduled_maintenance_updated',
          metadata: { maintenanceId, equipmentId, adminId: user.id },
        });

        return NextResponse.json({
          data: {
            id: updatedMaintenance.id,
            title: updatedMaintenance.title,
            maintenanceType: updatedMaintenance.maintenance_type,
            priority: updatedMaintenance.priority,
            status: updatedMaintenance.status,
            scheduledDate: updatedMaintenance.scheduled_date,
            performedBy: updatedMaintenance.performed_by,
            cost: updatedMaintenance.cost,
            nextDueDate: updatedMaintenance.next_due_date,
          },
        });
      } else {
        // Handle maintenance log update
        if (!logId) {
          return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
        }

        // Validate update data
        const validated = maintenanceLogUpdateSchema.parse(updateData);

        // Use service client to bypass RLS
        const supabaseAdmin = await createServiceClient();
        if (!supabaseAdmin) {
          logger.error('Service client not available for updating maintenance log', {
            component: 'admin-equipment-maintenance-api',
            action: 'service_client_missing',
            metadata: { equipmentId, logId },
          });
          return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
        }

        // Update maintenance log
        const updatePayload: Record<string, unknown> = {};
        if (validated.maintenanceType) updatePayload.maintenance_type = validated.maintenanceType;
        if (validated.performedAt) updatePayload.performed_at = validated.performedAt;
        if (validated.technician !== undefined)
          updatePayload.technician = validated.technician || null;
        if (validated.notes !== undefined) updatePayload.notes = validated.notes || null;
        if (validated.cost !== undefined) updatePayload.cost = validated.cost || null;
        if (validated.durationHours !== undefined)
          updatePayload.duration_hours = validated.durationHours || null;
        if (validated.status) updatePayload.status = validated.status;
        if (validated.nextDueAt !== undefined)
          updatePayload.next_due_at = validated.nextDueAt || null;
        if (validated.documents) updatePayload.documents = validated.documents;

        const { data: updatedLog, error: updateError } = await supabaseAdmin
          .from('maintenance_logs')
          .update(updatePayload)
          .eq('id', logId)
          .eq('equipment_id', equipmentId)
          .select()
          .single();

        if (updateError || !updatedLog) {
          logger.error(
            'Failed to update maintenance log',
            {
              component: 'admin-equipment-maintenance-api',
              action: 'update_log_failed',
              metadata: { equipmentId, logId },
            },
            updateError ?? new Error('Missing updated log data')
          );
          return NextResponse.json({ error: 'Unable to update maintenance log' }, { status: 500 });
        }

        logger.info('Maintenance log updated', {
          component: 'admin-equipment-maintenance-api',
          action: 'maintenance_log_updated',
          metadata: { maintenanceLogId: updatedLog.id, equipmentId, adminId: user.id },
        });

        return NextResponse.json({ maintenanceLog: updatedLog });
      }
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error updating maintenance',
        {
          component: 'admin-equipment-maintenance-api',
          action: 'update_unexpected',
          metadata: { equipmentId },
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json(
        { error: 'Internal server error while updating maintenance' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withRateLimit(
  RateLimitPresets.STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const resolvedParams = await Promise.resolve(params);
      const equipmentId = resolvedParams.id;

      const adminResult = await requireAdmin(request);
      if (adminResult.error) return adminResult.error;

      const { user } = adminResult;
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const logId = searchParams.get('logId');
      const maintenanceId = searchParams.get('maintenanceId');
      const type = searchParams.get('type'); // 'scheduled' for scheduled maintenance

      if (!logId && !maintenanceId) {
        return NextResponse.json(
          { error: 'Log ID or Maintenance ID is required' },
          { status: 400 }
        );
      }

      // Use service client to bypass RLS
      const supabaseAdmin = await createServiceClient();
      if (!supabaseAdmin) {
        logger.error('Service client not available for deleting maintenance', {
          component: 'admin-equipment-maintenance-api',
          action: 'service_client_missing',
          metadata: { equipmentId, logId, maintenanceId },
        });
        return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
      }

      if (maintenanceId || type === 'scheduled') {
        // Cancel/delete scheduled maintenance (equipment_maintenance table)
        const idToDelete = maintenanceId || logId;
        if (!idToDelete) {
          return NextResponse.json({ error: 'Maintenance ID is required' }, { status: 400 });
        }

        // Update status to 'cancelled' instead of deleting (preserves history)
        const { error: cancelError } = await supabaseAdmin
          .from('equipment_maintenance')
          .update({ status: 'cancelled' })
          .eq('id', idToDelete)
          .eq('equipment_id', equipmentId);

        if (cancelError) {
          logger.error(
            'Failed to cancel scheduled maintenance',
            {
              component: 'admin-equipment-maintenance-api',
              action: 'cancel_scheduled_failed',
              metadata: { equipmentId, maintenanceId: idToDelete },
            },
            cancelError
          );
          return NextResponse.json(
            { error: 'Unable to cancel scheduled maintenance' },
            { status: 500 }
          );
        }

        // Recalculate next maintenance due date from remaining active scheduled maintenance
        const { data: activeMaintenance, error: fetchError } = await supabaseAdmin
          .from('equipment_maintenance')
          .select('scheduled_date, next_due_date')
          .eq('equipment_id', equipmentId)
          .in('status', ['scheduled', 'in_progress', 'overdue'])
          .order('scheduled_date', { ascending: true })
          .limit(1);

        if (fetchError) {
          // Only log in development to reduce production noise
          if (process.env.NODE_ENV === 'development') {
            logger.warn('Failed to fetch remaining scheduled maintenance for equipment update', {
              component: 'admin-equipment-maintenance-api',
              metadata: { equipmentId },
            });
          }
        } else {
          // Update equipment's nextMaintenanceDue based on remaining scheduled maintenance
          let nextMaintenanceDue: string | null = null;

          if (activeMaintenance && activeMaintenance.length > 0) {
            // Use next_due_date if available, otherwise use scheduled_date
            const record = activeMaintenance[0];
            nextMaintenanceDue = record.next_due_date || record.scheduled_date;
          }

          const { error: equipmentUpdateError } = await supabaseAdmin
            .from('equipment')
            .update({ nextMaintenanceDue })
            .eq('id', equipmentId);

          if (equipmentUpdateError) {
            logger.warn(
              'Failed to update equipment nextMaintenanceDue after cancelling maintenance',
              {
                component: 'admin-equipment-maintenance-api',
                metadata: { equipmentId },
              }
            );
          } else {
            // Only log in development to reduce production noise
            if (process.env.NODE_ENV === 'development') {
              logger.debug('Updated equipment nextMaintenanceDue after cancelling maintenance', {
                component: 'admin-equipment-maintenance-api',
                metadata: { equipmentId, nextMaintenanceDue },
              });
            }
          }
        }

        logger.info('Scheduled maintenance cancelled', {
          component: 'admin-equipment-maintenance-api',
          action: 'scheduled_maintenance_cancelled',
          metadata: { maintenanceId: idToDelete, equipmentId, adminId: user.id },
        });

        return NextResponse.json({ success: true });
      } else {
        // Delete maintenance log (cascade will handle parts)
        const { error: deleteError } = await supabaseAdmin
          .from('maintenance_logs')
          .delete()
          .eq('id', logId)
          .eq('equipment_id', equipmentId);

        if (deleteError) {
          logger.error(
            'Failed to delete maintenance log',
            {
              component: 'admin-equipment-maintenance-api',
              action: 'delete_log_failed',
              metadata: { equipmentId, logId },
            },
            deleteError
          );
          return NextResponse.json({ error: 'Unable to delete maintenance log' }, { status: 500 });
        }

        logger.info('Maintenance log deleted', {
          component: 'admin-equipment-maintenance-api',
          action: 'maintenance_log_deleted',
          metadata: { maintenanceLogId: logId, equipmentId, adminId: user.id },
        });

        return NextResponse.json({ success: true });
      }
    } catch (err) {
      logger.error(
        'Unexpected error deleting maintenance log',
        {
          component: 'admin-equipment-maintenance-api',
          action: 'delete_log_unexpected',
          metadata: { equipmentId: resolvedParams.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json(
        { error: 'Internal server error while deleting maintenance log' },
        { status: 500 }
      );
    }
  }
);

// DELETE handler for canceling scheduled maintenance
// Note: This extends the existing DELETE handler to support both log deletion and scheduled maintenance cancellation
// The existing DELETE handler checks for logId query param, so we'll add maintenanceId support
