import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? Math.max(1, Math.min(100, Number(searchParams.get('limit')))) : 10;

    let query = supabase
      .from('alert_incidents')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      logger.error(
        'Failed to fetch dashboard alerts',
        { component: 'admin-dashboard-alerts', action: 'fetch_failed' });
      return NextResponse.json(
        { error: 'Unable to load dashboard alerts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alerts: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching dashboard alerts',
      { component: 'admin-dashboard-alerts', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

