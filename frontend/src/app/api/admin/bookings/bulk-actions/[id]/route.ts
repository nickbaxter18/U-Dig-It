import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { data, error: fetchError } = await supabase
      .from('booking_bulk_operations')
      .select(
        'id, admin_id, action, filter_payload, status, summary, created_at, updated_at, completed_at'
      )
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError) {
      logger.error(
        'Failed to fetch booking bulk operation',
        {
          component: 'admin-bookings-bulk-actions',
          action: 'bulk_operation_fetch_failed',
          metadata: { bulkOperationId: params.id },
        },
        fetchError
      );
      return NextResponse.json({ error: 'Unable to load bulk action status' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Bulk action not found' }, { status: 404 });
    }

    return NextResponse.json({ bulkOperation: data });
  } catch (err) {
    logger.error(
      'Unexpected error fetching booking bulk action status',
      {
        component: 'admin-bookings-bulk-actions',
        action: 'bulk_operation_fetch_unexpected',
        metadata: { bulkOperationId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
