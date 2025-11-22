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
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    // ✅ Fetch audit logs from Supabase
    const {
      data: logs,
      error: logsError,
      count,
    } = await supabase
      .from('audit_logs')
      .select(
        'id, table_name, record_id, action, old_values, new_values, ip_address, user_agent, user_id, created_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (logsError) {
      throw new Error(`Database error: ${logsError.message}`);
    }

    // ✅ Fetch user data for logs separately
    const userIds = [...new Set((logs || []).map((log) => log.user_id).filter(Boolean))];
    const { data: users } = await supabase
      .from('users')
      .select('id, firstName, lastName, email')
      .in('id', userIds);

    const usersMap = new Map((users || []).map((u) => [u.id, u]));

    // ✅ Transform logs
    const transformedLogs = (logs || []).map((log: unknown) => {
      const user = log.user_id ? usersMap.get(log.user_id) : null;
      const userName = user
        ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'unknown'
        : 'System';

      // Determine severity
      let severity = 'low';
      if (log.action === 'delete') severity = 'high';
      else if (log.action === 'update') severity = 'medium';
      else if (log.table_name === 'payments' || log.table_name === 'bookings') severity = 'medium';

      // Generate description
      const description = `${userName} ${log.action}d ${log.table_name} ${log.record_id.substring(0, 8)}...`;

      return {
        id: log.id,
        adminId: log.user_id || 'system',
        adminName: userName,
        action: log.action,
        resourceType: log.table_name,
        resourceId: log.record_id,
        resourceName: log.table_name,
        changesBefore: log.old_values,
        changesAfter: log.new_values,
        ipAddress: log.ip_address || 'Unknown',
        userAgent: log.user_agent || 'Unknown',
        timestamp: log.created_at,
        severity,
        description,
      };
    });

    logger.info('Audit logs fetched successfully', {
      component: 'audit-api',
      action: 'fetch_logs',
      metadata: { count: transformedLogs.length },
    });

    return NextResponse.json({
      logs: transformedLogs,
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      'Failed to fetch audit logs',
      {
        component: 'audit-api',
        action: 'fetch_logs_error',
        metadata: { error: errorMessage },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
});
