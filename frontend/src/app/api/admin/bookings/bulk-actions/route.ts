import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { bookingBulkActionSchema } from '@/lib/validators/admin/bookings';

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

    const payload = bookingBulkActionSchema.parse(await request.json());

    const { data, error: insertError } = await supabase
      .from('booking_bulk_operations')
      .insert({
        admin_id: user?.id || 'unknown',
        action: payload.action,
        filter_payload: payload.filters ?? {},
        status: 'queued',
        summary: {},
      })
      .select()
      .single();

    if (insertError) {
      logger.error(
        'Failed to queue booking bulk operation',
        {
          component: 'admin-bookings-bulk-actions',
          action: 'bulk_operation_insert_failed',
          metadata: { adminId: user?.id || 'unknown', action: payload.action },
        },
        insertError
      );

      return NextResponse.json(
        { error: 'Unable to queue booking bulk action' },
        { status: 500 }
      );
    }

    logger.info('Queued booking bulk operation', {
      component: 'admin-bookings-bulk-actions',
      action: 'bulk_operation_queued',
      metadata: { bulkOperationId: data.id, adminId: user?.id || 'unknown', action: payload.action },
    });

    return NextResponse.json({ bulkOperation: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error queuing booking bulk action',
      { component: 'admin-bookings-bulk-actions', action: 'unexpected_error' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json(
      { error: 'Internal server error while queuing booking bulk action' },
      { status: 500 }
    );
  }
}


