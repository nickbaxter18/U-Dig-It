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
      .from('telematics_snapshots')
      .select('*')
      .eq('equipment_id', params.id)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      logger.error(
        'Failed to fetch latest telematics snapshot',
        {
          component: 'admin-equipment-telematics',
          action: 'fetch_latest_failed',
          metadata: { equipmentId: params.id },
        },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to load telematics snapshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ snapshot: data ?? null });
  } catch (err) {
    logger.error(
      'Unexpected error fetching telematics snapshot',
      {
        component: 'admin-equipment-telematics',
        action: 'fetch_latest_unexpected',
        metadata: { equipmentId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


