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
      .from('insurance_activity')
      .select('*')
      .eq('insurance_document_id', params.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error(
        'Failed to fetch insurance activity',
        { component: 'admin-insurance-activity', action: 'fetch_failed', metadata: { insuranceId: params.id } },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to load insurance activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ activity: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching insurance activity',
      { component: 'admin-insurance-activity', action: 'fetch_unexpected', metadata: { insuranceId: params.id } },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


