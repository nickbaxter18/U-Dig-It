import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

const customerBulkUpdateSchema = z.object({
  customerIds: z.array(z.string().uuid()).min(1, 'At least one customer ID is required'),
  action: z.enum(['add_tags', 'remove_tags', 'update_status']),
  tags: z.array(z.string().uuid()).optional(), // Tag IDs, not names
  status: z.enum(['active', 'suspended', 'pending_verification']).optional(),
});

/**
 * POST /api/admin/customers/bulk-update
 * Perform bulk operations on customers (tag assignment or status update)
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
    const validated = customerBulkUpdateSchema.parse(body);

    const supabaseAdmin = createServiceClient();
    if (!supabaseAdmin) {
      logger.error('Service role client not initialized', {
        component: 'admin-customers-bulk-api',
      });
      return NextResponse.json(
        { error: 'Internal server error: Service client unavailable' },
        { status: 500 }
      );
    }

    const { customerIds, action, tags, status } = validated;

    if (action === 'add_tags' && tags && tags.length > 0) {
      // Use customer_tag_members table for proper tag assignment
      const tagAssignments = customerIds.flatMap((customerId) =>
        tags.map((tagId) => ({
          customer_id: customerId,
          tag_id: tagId,
          assigned_by: user?.id || 'unknown',
          assigned_at: new Date().toISOString(),
        }))
      );

      // Use upsert to avoid duplicates
      const { error: insertError } = await supabaseAdmin
        .from('customer_tag_members')
        .upsert(tagAssignments, {
          onConflict: 'customer_id,tag_id',
        });

      if (insertError) {
        logger.error(
          'Failed to bulk assign customer tags',
          {
            component: 'admin-customers-bulk-api',
            action: 'bulk_add_tags_error',
            metadata: { customerIds, tagIds: tags, adminId: user?.id || 'unknown' },
          },
          insertError
        );
        return NextResponse.json({ error: 'Failed to assign tags' }, { status: 500 });
      }

      // Log to audit trail for each customer
      for (const customerId of customerIds) {
        await supabaseAdmin.from('audit_logs').insert({
          table_name: 'customer_tag_members',
          record_id: customerId,
          action: 'insert',
          user_id: user?.id || 'unknown',
          metadata: {
            action_type: 'bulk_add_tags',
            bulk_operation: true,
            tag_ids: tags,
          },
        });
      }

      logger.info('Customer tags bulk assigned', {
        component: 'admin-customers-bulk-api',
        action: 'bulk_add_tags_success',
        metadata: { count: customerIds.length, tagIds: tags, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully assigned tags to ${customerIds.length} customer(s)`,
        updatedCount: customerIds.length,
      });
    } else if (action === 'remove_tags' && tags && tags.length > 0) {
      // Remove tags using customer_tag_members table
      const { error: deleteError } = await supabaseAdmin
        .from('customer_tag_members')
        .delete()
        .in('customer_id', customerIds)
        .in('tag_id', tags);

      if (deleteError) {
        logger.error(
          'Failed to bulk remove customer tags',
          {
            component: 'admin-customers-bulk-api',
            action: 'bulk_remove_tags_error',
            metadata: { customerIds, tagIds: tags, adminId: user?.id || 'unknown' },
          },
          deleteError
        );
        return NextResponse.json({ error: 'Failed to remove tags' }, { status: 500 });
      }

      // Log to audit trail for each customer
      for (const customerId of customerIds) {
        await supabaseAdmin.from('audit_logs').insert({
          table_name: 'customer_tag_members',
          record_id: customerId,
          action: 'delete',
          user_id: user?.id || 'unknown',
          metadata: {
            action_type: 'bulk_remove_tags',
            bulk_operation: true,
            tag_ids: tags,
          },
        });
      }

      logger.info('Customer tags bulk removed', {
        component: 'admin-customers-bulk-api',
        action: 'bulk_remove_tags_success',
        metadata: { count: customerIds.length, tagIds: tags, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully removed tags from ${customerIds.length} customer(s)`,
        updatedCount: customerIds.length,
      });
    } else if (action === 'update_status' && status) {
      // Update status
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          status,
          updatedAt: new Date().toISOString(),
        })
        .in('id', customerIds);

      if (updateError) {
        logger.error(
          'Failed to update customer status',
          {
            component: 'admin-customers-bulk-api',
            action: 'update_status_error',
            metadata: { customerIds, status, adminId: user?.id || 'unknown' },
          },
          updateError
        );
        return NextResponse.json({ error: 'Failed to update customer status' }, { status: 500 });
      }

      // Log to audit trail
      for (const customerId of customerIds) {
        await supabaseAdmin.from('audit_logs').insert({
          table_name: 'users',
          record_id: customerId,
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

      logger.info('Customer status bulk updated', {
        component: 'admin-customers-bulk-api',
        action: 'bulk_status_update_success',
        metadata: { count: customerIds.length, status, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${customerIds.length} customer(s) to ${status}`,
        updatedCount: customerIds.length,
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
      'Unexpected error in customer bulk update',
      {
        component: 'admin-customers-bulk-api',
        action: 'unexpected_error',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
