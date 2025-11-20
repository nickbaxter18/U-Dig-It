import { ZodError } from 'zod';
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const scheduledReportUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  reportType: z
    .enum(['dashboard', 'analytics', 'bookings', 'customers', 'equipment', 'payments'])
    .optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  frequencyConfig: z.record(z.string(), z.unknown()).optional().nullable(),
  dateRange: z.enum(['7d', '30d', '90d', 'ytd', 'all']).optional(),
  format: z.enum(['csv', 'pdf', 'json']).optional(),
  recipients: z.array(z.string().email()).optional(),
  filters: z.record(z.string(), z.unknown()).optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const payload = scheduledReportUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.reportType !== undefined) updateData.report_type = payload.reportType;
    if (payload.frequency !== undefined) {
      updateData.frequency = payload.frequency;
      // Recalculate next_run_at if frequency changed
      const { data: nextRunData } = await supabase.rpc('calculate_next_run_date', {
        p_frequency: payload.frequency,
        p_frequency_config: payload.frequencyConfig || null,
        p_current_next_run: null,
      });
      if (nextRunData) {
        updateData.next_run_at = nextRunData;
      }
    }
    if (payload.frequencyConfig !== undefined)
      updateData.frequency_config = payload.frequencyConfig;
    if (payload.dateRange !== undefined) updateData.date_range = payload.dateRange;
    if (payload.format !== undefined) updateData.format = payload.format;
    if (payload.recipients !== undefined) updateData.recipients = payload.recipients;
    if (payload.filters !== undefined) updateData.filters = payload.filters;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;

    const { data, error: updateError } = await supabase
      .from('scheduled_reports')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      logger.error(
        'Failed to update scheduled report',
        {
          component: 'admin-scheduled-reports',
          action: 'update_failed',
          metadata: { reportId: params.id, adminId: user?.id || 'unknown' },
        },
        updateError
      );
      return NextResponse.json({ error: 'Unable to update scheduled report' }, { status: 500 });
    }

    logger.info('Scheduled report updated', {
      component: 'admin-scheduled-reports',
      action: 'report_updated',
      metadata: { reportId: params.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ report: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error updating scheduled report',
      {
        component: 'admin-scheduled-reports',
        action: 'update_unexpected',
        metadata: { reportId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: deleteError } = await supabase
      .from('scheduled_reports')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      logger.error(
        'Failed to delete scheduled report',
        {
          component: 'admin-scheduled-reports',
          action: 'delete_failed',
          metadata: { reportId: params.id, adminId: user?.id || 'unknown' },
        },
        deleteError
      );
      return NextResponse.json({ error: 'Unable to delete scheduled report' }, { status: 500 });
    }

    logger.info('Scheduled report deleted', {
      component: 'admin-scheduled-reports',
      action: 'report_deleted',
      metadata: { reportId: params.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error(
      'Unexpected error deleting scheduled report',
      {
        component: 'admin-scheduled-reports',
        action: 'delete_unexpected',
        metadata: { reportId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
