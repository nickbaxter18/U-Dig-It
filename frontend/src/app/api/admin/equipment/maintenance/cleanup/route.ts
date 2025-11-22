import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Cleanup endpoint to fix orphaned nextMaintenanceDue values
 * This fixes equipment that have nextMaintenanceDue set but no active scheduled maintenance
 */
export const POST = withRateLimit(RateLimitPresets.STRICT, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    const { user } = adminResult;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = await createServiceClient();
    if (!supabaseAdmin) {
      logger.error('Service client not available for maintenance cleanup', {
        component: 'admin-equipment-maintenance-cleanup',
        action: 'service_client_missing',
      });
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
    }

    // Get all equipment with nextMaintenanceDue set
    const { data: equipmentWithDueDates, error: fetchError } = await supabaseAdmin
      .from('equipment')
      .select('id, nextMaintenanceDue')
      .not('nextMaintenanceDue', 'is', null);

    if (fetchError) {
      logger.error(
        'Failed to fetch equipment for cleanup',
        {
          component: 'admin-equipment-maintenance-cleanup',
          action: 'fetch_error',
        },
        fetchError
      );
      return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
    }

    if (!equipmentWithDueDates || equipmentWithDueDates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No equipment with maintenance due dates found',
        fixed: 0,
      });
    }

    let fixedCount = 0;
    const updates: Array<{ id: string; nextMaintenanceDue: string | null }> = [];

    // Check each equipment for active scheduled maintenance
    for (const equipment of equipmentWithDueDates) {
      const { data: activeMaintenance, error: maintenanceError } = await supabaseAdmin
        .from('equipment_maintenance')
        .select('scheduled_date, next_due_date')
        .eq('equipment_id', equipment.id)
        .in('status', ['scheduled', 'in_progress', 'overdue'])
        .order('scheduled_date', { ascending: true })
        .limit(1);

      if (maintenanceError) {
        // Only log in development to reduce production noise
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Failed to check maintenance for equipment', {
            component: 'admin-equipment-maintenance-cleanup',
            metadata: { equipmentId: equipment.id },
          });
        }
        continue;
      }

      let nextMaintenanceDue: string | null = null;

      if (activeMaintenance && activeMaintenance.length > 0) {
        // Use next_due_date if available, otherwise use scheduled_date
        const record = activeMaintenance[0];
        nextMaintenanceDue = record.next_due_date || record.scheduled_date;
      }

      // Only update if the value has changed
      const currentDue = equipment.nextMaintenanceDue;
      if (currentDue !== nextMaintenanceDue) {
        updates.push({
          id: equipment.id,
          nextMaintenanceDue,
        });
      }
    }

    // Batch update all equipment
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabaseAdmin
          .from('equipment')
          .update({ nextMaintenanceDue: update.nextMaintenanceDue })
          .eq('id', update.id);

        if (updateError) {
          // Only log in development to reduce production noise
          if (process.env.NODE_ENV === 'development') {
            logger.warn('Failed to update equipment during cleanup', {
              component: 'admin-equipment-maintenance-cleanup',
              metadata: { equipmentId: update.id },
            });
          }
        } else {
          fixedCount++;
        }
      }
    }

    // Only log if something was actually fixed, or in development
    if (fixedCount > 0 || process.env.NODE_ENV === 'development') {
      logger.info('Maintenance due dates cleanup completed', {
        component: 'admin-equipment-maintenance-cleanup',
        action: 'cleanup_completed',
        metadata: {
          checked: equipmentWithDueDates.length,
          fixed: fixedCount,
          adminId: user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${fixedCount} equipment records fixed`,
      checked: equipmentWithDueDates.length,
      fixed: fixedCount,
    });
  } catch (err) {
    logger.error(
      'Unexpected error during maintenance cleanup',
      {
        component: 'admin-equipment-maintenance-cleanup',
        action: 'cleanup_unexpected',
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error during cleanup' }, { status: 500 });
  }
});
