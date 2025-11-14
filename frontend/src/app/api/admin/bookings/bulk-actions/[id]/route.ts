import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { data, error: fetchError } = await supabase
      .from('booking_bulk_operations')
      .select('*')
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
      return NextResponse.json(
        { error: 'Unable to load bulk action status' },
        { status: 500 }
      );
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


