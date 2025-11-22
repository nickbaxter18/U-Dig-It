import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    // Try alert_incidents first, fallback to alerts table
    let query = supabase
      .from('alert_incidents')
      .select(
        'id, alert_rule_id, alert_name, severity, status, metric_name, current_value, threshold_value, description, triggered_at, acknowledged_at, acknowledged_by, resolved_at, resolved_by, resolution_notes, metadata, created_at, updated_at',
        { count: 'exact' }
      )
      .order('triggered_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (status) {
      query = query.eq('status', status);
    }

    let { data, error: fetchError, count } = await query;

    // If alert_incidents doesn't exist or fails, try alerts table
    if (
      fetchError &&
      (fetchError.message?.includes('does not exist') || fetchError.code === '42P01')
    ) {
      logger.warn('alert_incidents table not found, falling back to alerts table', {
        component: 'admin-dashboard-alerts',
        action: 'fallback_to_alerts',
      });

      query = supabase
        .from('alerts')
        .select(
          'id, type, severity, entity_type, entity_id, summary, details, detected_at, acknowledged_at, acknowledged_by, status, created_at',
          { count: 'exact' }
        )
        .order('detected_at', { ascending: false })
        .range(rangeStart, rangeEnd);

      if (status) {
        // Map status values if needed
        query = query.eq('status', status === 'open' ? 'active' : status);
      }

      const result = await query;
      data = result.data;
      fetchError = result.error;
      count = result.count;
    }

    if (fetchError) {
      logger.error(
        'Failed to fetch dashboard alerts',
        {
          component: 'admin-dashboard-alerts',
          action: 'fetch_failed',
          metadata: { error: fetchError.message },
        },
        fetchError instanceof Error ? fetchError : new Error(String(fetchError))
      );
      return NextResponse.json({ error: 'Unable to load dashboard alerts' }, { status: 500 });
    }

    return NextResponse.json({
      alerts: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching dashboard alerts',
      { component: 'admin-dashboard-alerts', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
