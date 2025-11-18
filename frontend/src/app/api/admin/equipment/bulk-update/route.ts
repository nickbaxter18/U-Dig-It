import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

const equipmentBulkUpdateSchema = z.object({
  equipmentIds: z.array(z.string().uuid()).min(1, 'At least one equipment ID is required'),
  action: z.enum(['update_status', 'delete']),
  status: z.enum(['available', 'rented', 'maintenance', 'out_of_service']).optional(),
});

/**
 * POST /api/admin/equipment/bulk-update
 * Perform bulk operations on equipment (status update or delete)
 */
export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    

    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const validated = equipmentBulkUpdateSchema.parse(body);

    const supabaseAdmin = createServiceClient();
    if (!supabaseAdmin) {
      logger.error('Service role client not initialized', { component: 'admin-equipment-bulk-api' });
      return NextResponse.json({ error: 'Internal server error: Service client unavailable' }, { status: 500 });
    }

    const { equipmentIds, action, status } = validated;

    if (action === 'delete') {
      // Check if any equipment is currently rented
      const { data: rentedEquipment, error: checkError } = await supabaseAdmin
        .from('bookings')
        .select('equipmentId')
        .in('equipmentId', equipmentIds)
        .in('status', ['confirmed', 'paid', 'in_progress', 'delivered']);

      if (checkError) {
        logger.error('Failed to check equipment rental status', {
          component: 'admin-equipment-bulk-api',
          action: 'check_rental_status_error',
        });
        return NextResponse.json({ error: 'Failed to verify equipment status' }, { status: 500 });
      }

      const rentedIds = new Set((rentedEquipment || []).map((b: any) => b.equipmentId));
      const cannotDelete = equipmentIds.filter(id => rentedIds.has(id));

      if (cannotDelete.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot delete equipment that is currently rented',
            cannotDelete,
          },
          { status: 400 }
        );
      }

      // Delete equipment
      const { error: deleteError } = await supabaseAdmin
        .from('equipment')
        .delete()
        .in('id', equipmentIds);

      if (deleteError) {
        logger.error('Failed to delete equipment', {
          component: 'admin-equipment-bulk-api',
          action: 'delete_error',
          metadata: { equipmentIds, adminId: user?.id || 'unknown' },
        }, deleteError);
        return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
      }

      // Log to audit trail
      for (const equipmentId of equipmentIds) {
        await supabaseAdmin.from('audit_logs').insert({
          table_name: 'equipment',
          record_id: equipmentId,
          action: 'delete',
          user_id: user?.id || 'unknown',
          metadata: {
            action_type: 'bulk_delete',
            bulk_operation: true,
          },
        });
      }

      logger.info('Equipment bulk deleted', {
        component: 'admin-equipment-bulk-api',
        action: 'bulk_delete_success',
        metadata: { count: equipmentIds.length, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${equipmentIds.length} equipment item(s)`,
        deletedCount: equipmentIds.length,
      });
    } else if (action === 'update_status' && status) {
      // Update status
      const { error: updateError } = await supabaseAdmin
        .from('equipment')
        .update({ status, updatedAt: new Date().toISOString() })
        .in('id', equipmentIds);

      if (updateError) {
        logger.error('Failed to update equipment status', {
          component: 'admin-equipment-bulk-api',
          action: 'update_status_error',
          metadata: { equipmentIds, status, adminId: user?.id || 'unknown' },
        }, updateError);
        return NextResponse.json({ error: 'Failed to update equipment status' }, { status: 500 });
      }

      // Log to audit trail
      for (const equipmentId of equipmentIds) {
        await supabaseAdmin.from('audit_logs').insert({
          table_name: 'equipment',
          record_id: equipmentId,
          action: 'update',
          user_id: user?.id || 'unknown',
          old_values: {},
          new_values: { status },
          metadata: {
            action_type: 'bulk_status_update',
            bulk_operation: true,
            new_status: status,
          },
        });
      }

      logger.info('Equipment bulk status updated', {
        component: 'admin-equipment-bulk-api',
        action: 'bulk_status_update_success',
        metadata: { count: equipmentIds.length, status, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${equipmentIds.length} equipment item(s) to ${status}`,
        updatedCount: equipmentIds.length,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action or missing status' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Unexpected error in equipment bulk update', {
      component: 'admin-equipment-bulk-api',
      action: 'unexpected_error',
    }, error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


