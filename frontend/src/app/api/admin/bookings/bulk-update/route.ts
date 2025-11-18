import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'paid',
  'insurance_verified',
  'ready_for_pickup',
  'delivered',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  'no_show',
  'verify_hold_ok',
  'deposit_scheduled',
  'hold_placed',
  'returned_ok',
  'captured',
] as const;

const bulkUpdateSchema = z.object({
  bookingIds: z.array(z.string().uuid()).min(1),
  operation: z.enum(['update_status', 'delete']),
  status: z.enum(BOOKING_STATUSES).optional(),
});

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

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const payload = bulkUpdateSchema.parse(await request.json());
    const { bookingIds } = payload;

    if (payload.operation === 'update_status') {
      if (!payload.status) {
        return NextResponse.json({ error: 'Status is required for update_status operation' }, { status: 400 });
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: payload.status,
          updatedAt: new Date().toISOString(),
        })
        .in('id', bookingIds);

      if (updateError) {
        throw updateError;
      }
    } else if (payload.operation === 'delete') {
      const { error: deleteError } = await supabase.from('bookings').delete().in('id', bookingIds);
      if (deleteError) {
        throw deleteError;
      }
    }

    await supabase.from('audit_logs').insert({
      table_name: 'bookings',
      record_id: null,
      action: 'bulk_update',
      user_id: user?.id || 'unknown',
      metadata: {
        operation: payload.operation,
        bookingIds,
        status: payload.status,
      },
    });

    logger.info('Booking bulk action completed', {
      component: 'admin-bookings-bulk-update',
      action: payload.operation,
      metadata: { adminId: user?.id || 'unknown', bookingCount: bookingIds.length },
    });

    return NextResponse.json({
      success: true,
      affected: bookingIds.length,
      operation: payload.operation,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: err.issues }, { status: 400 });
    }

    logger.error(
      'Failed to perform booking bulk update',
      { component: 'admin-bookings-bulk-update', action: 'error' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 });
  }
}


