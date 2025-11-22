import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

/**
 * PATCH /api/admin/contracts/[id]/status
 * Update contract status
 *
 * Admin-only endpoint
 */
export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;

      // 1. Verify authentication
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      // 3. Get new status from request body
      const body = await request.json();
      const { status: newStatus } = body;

      if (!newStatus) {
        return NextResponse.json({ error: 'Status is required' }, { status: 400 });
      }

      // Validate status value
      const validStatuses = [
        'draft',
        'sent',
        'sent_for_signature',
        'signed',
        'completed',
        'voided',
        'expired',
        'delivered',
        'declined',
      ];

      if (!validStatuses.includes(newStatus)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }

      // 4. Update contract status in database
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Add timestamp fields based on status
      if (newStatus === 'sent' || newStatus === 'sent_for_signature') {
        updateData.sent_at = new Date().toISOString();
      } else if (newStatus === 'signed') {
        updateData.signed_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (newStatus === 'voided') {
        updateData.voided_at = new Date().toISOString();
        updateData.voided_by = adminResult.user?.id || 'unknown';
      } else if (newStatus === 'declined') {
        updateData.declined_at = new Date().toISOString();
      }

      const { data, error: updateError } = await supabase
        .from('rental_contracts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      logger.info('Contract status updated', {
        component: 'contracts-status-api',
        action: 'status_update',
        metadata: {
          contractId: id,
          newStatus,
          adminId: adminResult.user?.id || 'unknown',
        },
      });

      return NextResponse.json({
        success: true,
        contract: data,
      });
    } catch (error: unknown) {
      logger.error(
        'Contract status update error',
        {
          component: 'contracts-status-api',
          action: 'error',
        },
        error
      );

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
