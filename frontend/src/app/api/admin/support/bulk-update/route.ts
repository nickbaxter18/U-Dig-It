import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

const supportBulkUpdateSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1, 'At least one ticket ID is required'),
  action: z.enum(['assign', 'update_status']),
  assignedTo: z.string().uuid().optional(),
  status: z.enum(['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']).optional(),
});

/**
 * POST /api/admin/support/bulk-update
 * Perform bulk operations on support tickets (assignment or status update)
 */
export const POST = withRateLimit(RateLimitPresets.STRICT, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { user } = adminResult;

    const body = await request.json();
    const validated = supportBulkUpdateSchema.parse(body);

    const supabaseAdmin = await createServiceClient();
    if (!supabaseAdmin) {
      logger.error('Service role client not initialized', { component: 'admin-support-bulk-api' });
      return NextResponse.json(
        { error: 'Internal server error: Service client unavailable' },
        { status: 500 }
      );
    }

    const { ticketIds, action, assignedTo, status } = validated;

    if (action === 'assign' && assignedTo) {
      // Bulk assign tickets
      const { error: updateError } = await supabaseAdmin
        .from('support_tickets')
        .update({
          assigned_to: assignedTo,
          assigned_at: new Date().toISOString(),
          status: 'in_progress', // Auto-update status when assigned
        })
        .in('id', ticketIds);

      if (updateError) {
        logger.error(
          'Failed to assign tickets',
          {
            component: 'admin-support-bulk-api',
            action: 'assign_error',
            metadata: { ticketIds, assignedTo, adminId: user?.id || 'unknown' },
          },
          updateError
        );
        return NextResponse.json({ error: 'Failed to assign tickets' }, { status: 500 });
      }

      // Log to audit trail
      for (const ticketId of ticketIds) {
        await supabaseAdmin.from('audit_logs').insert({
          table_name: 'support_tickets',
          record_id: ticketId,
          action: 'update',
          user_id: user?.id || 'unknown',
          old_values: {},
          new_values: { assigned_to: assignedTo, status: 'in_progress' },
          metadata: {
            action_type: 'bulk_assign',
            bulk_operation: true,
            assigned_to: assignedTo,
          },
        });
      }

      logger.info('Support tickets bulk assigned', {
        component: 'admin-support-bulk-api',
        action: 'bulk_assign_success',
        metadata: { count: ticketIds.length, assignedTo, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully assigned ${ticketIds.length} ticket(s)`,
        updatedCount: ticketIds.length,
      });
    } else if (action === 'update_status' && status) {
      // Bulk update status
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // If resolving, set resolved_at timestamp
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error: updateError } = await supabaseAdmin
        .from('support_tickets')
        .update(updateData)
        .in('id', ticketIds);

      if (updateError) {
        logger.error(
          'Failed to update ticket status',
          {
            component: 'admin-support-bulk-api',
            action: 'update_status_error',
            metadata: { ticketIds, status, adminId: user?.id || 'unknown' },
          },
          updateError
        );
        return NextResponse.json({ error: 'Failed to update ticket status' }, { status: 500 });
      }

      // Log to audit trail
      for (const ticketId of ticketIds) {
        await supabaseAdmin.from('audit_logs').insert({
          table_name: 'support_tickets',
          record_id: ticketId,
          action: 'update',
          user_id: user?.id || 'unknown',
          old_values: {},
          new_values: updateData,
          metadata: {
            action_type: 'bulk_status_update',
            bulk_operation: true,
            new_status: status,
          },
        });
      }

      logger.info('Support tickets status bulk updated', {
        component: 'admin-support-bulk-api',
        action: 'bulk_status_update_success',
        metadata: { count: ticketIds.length, status, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${ticketIds.length} ticket(s) to ${status}`,
        updatedCount: ticketIds.length,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing required fields' },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error in support bulk update',
      {
        component: 'admin-support-bulk-api',
        action: 'unexpected_error',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
