import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper function to get resource name based on table and record ID
async function getResourceName(
  tableName: string,
  recordId: string,
  supabase: SupabaseClient
): Promise<string> {
  try {
    if (tableName === 'bookings') {
      const { data } = await supabase
        .from('bookings')
        .select('bookingNumber')
        .eq('id', recordId)
        .single();
      if (data?.bookingNumber) {
        return `Booking #${data.bookingNumber}`;
      }
    } else if (tableName === 'equipment') {
      const { data } = await supabase
        .from('equipment')
        .select('make, model, unit_id')
        .eq('id', recordId)
        .single();
      if (data) {
        const name = `${data.make || ''} ${data.model || ''}`.trim();
        return name || data.unit_id || `Equipment ${String(recordId).substring(0, 8)}`;
      }
    } else if (tableName === 'users') {
      const { data } = await supabase
        .from('users')
        .select('firstName, lastName, email')
        .eq('id', recordId)
        .single();
      if (data) {
        const name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        return name || data.email || `User ${String(recordId).substring(0, 8)}`;
      }
    } else if (tableName === 'payments') {
      // Try to get related booking number
      const { data: payment } = await supabase
        .from('payments')
        .select('bookingId')
        .eq('id', recordId)
        .single();

      if (payment?.bookingId) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('bookingNumber')
          .eq('id', payment.bookingId)
          .single();
        if (booking?.bookingNumber) {
          return `Payment for Booking #${booking.bookingNumber}`;
        }
      }
      return `Payment ${String(recordId).substring(0, 8)}`;
    }
    // Fallback: formatted table name + ID
    return `${tableName.charAt(0).toUpperCase() + tableName.slice(1)} ${String(recordId).substring(0, 8)}`;
  } catch (error) {
    logger.error(
      'Failed to resolve resource name',
      {
        component: 'audit-api',
        action: 'resolve_resource_name',
        metadata: { tableName, recordId },
      },
      error instanceof Error ? error : undefined
    );
    return `${tableName.charAt(0).toUpperCase() + tableName.slice(1)} ${String(recordId).substring(0, 8)}`;
  }
}

// Helper function to calculate severity
function calculateSeverity(
  action: string,
  tableName: string,
  metadata?: Record<string, unknown> | null
): 'low' | 'medium' | 'high' | 'critical' {
  // Check metadata first
  if (metadata?.severity) {
    const metaSeverity = String(metadata.severity).toLowerCase();
    if (['low', 'medium', 'high', 'critical'].includes(metaSeverity)) {
      return metaSeverity as 'low' | 'medium' | 'high' | 'critical';
    }
  }

  // Calculate based on action and table
  if (action === 'delete') return 'high';
  if (action === 'update') {
    if (tableName === 'payments' || tableName === 'bookings') return 'medium';
    return 'medium';
  }
  if (action === 'create') {
    if (tableName === 'payments' || tableName === 'bookings') return 'medium';
    return 'low';
  }
  return 'low';
}

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

    // Related logs parameters (for fetching related logs)
    const relatedResourceId = searchParams.get('relatedResourceId');
    const relatedResourceType = searchParams.get('relatedResourceType');
    const relatedAdminId = searchParams.get('relatedAdminId');
    const excludeLogId = searchParams.get('excludeLogId');
    const isRelatedLogsQuery = !!(relatedResourceId || relatedAdminId);

    // Regular pagination parameters (only used if not related logs query)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = isRelatedLogsQuery
      ? 100 // Max 100 for related logs
      : Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 100);
    const rangeStart = isRelatedLogsQuery ? 0 : (page - 1) * pageSize;
    const rangeEnd = isRelatedLogsQuery ? 99 : rangeStart + pageSize - 1;

    // Filter parameters
    const actionFilter = searchParams.get('action');
    const severityFilter = searchParams.get('severity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const searchTerm = searchParams.get('search');
    const resourceTypeFilter = searchParams.get('resourceType');

    // Build query
    let query = supabase
      .from('audit_logs')
      .select(
        'id, table_name, record_id, action, old_values, new_values, ip_address, user_agent, user_id, created_at, metadata',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (actionFilter && actionFilter !== 'all') {
      // Convert to lowercase for database comparison
      query = query.eq('action', actionFilter.toLowerCase());
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (resourceTypeFilter && resourceTypeFilter !== 'all') {
      query = query.eq('table_name', resourceTypeFilter);
    }

    // Apply related logs filters (if this is a related logs query)
    if (isRelatedLogsQuery) {
      if (relatedResourceId && relatedResourceType) {
        query = query.eq('record_id', relatedResourceId).eq('table_name', relatedResourceType);
      } else if (relatedAdminId) {
        query = query.eq('user_id', relatedAdminId);
      }

      // Exclude the current log if specified
      if (excludeLogId) {
        query = query.neq('id', excludeLogId);
      }
    }

    // Apply pagination (only for regular queries, related logs use range 0-99)
    query = query.range(rangeStart, rangeEnd);

    const {
      data: logs,
      error: logsError,
      count,
    } = await query;

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

    // Batch fetch resource names by grouping by table_name
    const resourceMap = new Map<string, string>();
    const resourcePromises: Promise<void>[] = [];

    // Group logs by table_name to batch fetch
    const logsByTable = new Map<string, Array<{ id: string; record_id: string }>>();
    (logs || []).forEach((log) => {
      if (!logsByTable.has(log.table_name)) {
        logsByTable.set(log.table_name, []);
      }
      logsByTable.get(log.table_name)?.push({ id: log.id, record_id: log.record_id });
    });

    // Batch fetch resources for each table
    for (const [tableName, tableLogs] of logsByTable.entries()) {
      if (tableName === 'bookings') {
        const recordIds = tableLogs.map((l) => l.record_id);
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, bookingNumber')
          .in('id', recordIds);
        bookings?.forEach((booking) => {
          resourceMap.set(`${tableName}:${booking.id}`, `Booking #${booking.bookingNumber}`);
        });
      } else if (tableName === 'equipment') {
        const recordIds = tableLogs.map((l) => l.record_id);
        const { data: equipment } = await supabase
          .from('equipment')
          .select('id, make, model, unit_id')
          .in('id', recordIds);
        equipment?.forEach((eq) => {
          const name = `${eq.make || ''} ${eq.model || ''}`.trim();
          resourceMap.set(
            `${tableName}:${eq.id}`,
            name || eq.unit_id || `Equipment ${String(eq.id).substring(0, 8)}`
          );
        });
      } else if (tableName === 'users') {
        const recordIds = tableLogs.map((l) => l.record_id);
        const { data: usersData } = await supabase
          .from('users')
          .select('id, firstName, lastName, email')
          .in('id', recordIds);
        usersData?.forEach((user) => {
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          resourceMap.set(
            `${tableName}:${user.id}`,
            name || user.email || `User ${String(user.id).substring(0, 8)}`
          );
        });
      }
    }

    // ✅ Transform logs
    const transformedLogs = await Promise.all(
      (logs || []).map(async (log: any) => {
        const user = log.user_id ? usersMap.get(log.user_id) : null;
        const userName = user
          ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'unknown'
          : 'System';

        // Get resource name from map or fetch individually
        const resourceKey = `${log.table_name}:${log.record_id}`;
        let resourceName = resourceMap.get(resourceKey);
        if (!resourceName) {
          resourceName = await getResourceName(log.table_name, log.record_id, supabase);
        }

        // Determine severity - check metadata first, then calculate
        const severity = calculateSeverity(log.action, log.table_name, log.metadata);

        // Transform action to uppercase
        const actionUpper = String(log.action || '').toUpperCase();

        // Generate description with proper action casing
        const actionPast = actionUpper === 'CREATE' ? 'created' : actionUpper === 'UPDATE' ? 'updated' : actionUpper === 'DELETE' ? 'deleted' : `${log.action}d`;
        const description = `${userName} ${actionPast} ${log.table_name} ${String(log.record_id).substring(0, 8)}...`;

        // Get IP address from metadata or column
        const ipAddress = log.metadata?.ip_address || log.ip_address || 'Unknown';
        const userAgent = log.metadata?.user_agent || log.user_agent || 'Unknown';

        return {
          id: log.id,
          adminId: log.user_id || 'system',
          adminName: userName,
          action: actionUpper,
          resourceType: log.table_name,
          resourceId: log.record_id,
          resourceName,
          changesBefore: log.old_values,
          changesAfter: log.new_values,
          ipAddress,
          userAgent,
          timestamp: log.created_at,
          severity,
          description,
        };
      })
    );

    // Apply client-side search filter if provided (for text search across multiple fields)
    let filteredLogs = transformedLogs;
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredLogs = transformedLogs.filter((log) => {
        return (
          log.adminName.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.resourceType.toLowerCase().includes(searchLower) ||
          log.resourceName.toLowerCase().includes(searchLower) ||
          log.description.toLowerCase().includes(searchLower) ||
          log.ipAddress.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply severity filter if provided (after transformation since severity is calculated)
    if (severityFilter && severityFilter !== 'all') {
      filteredLogs = filteredLogs.filter((log) => log.severity === severityFilter.toLowerCase());
    }

    // Calculate total pages (only for regular queries)
    const totalPages = isRelatedLogsQuery ? 1 : Math.ceil((count ?? 0) / pageSize);

    logger.info('Audit logs fetched successfully', {
      component: 'audit-api',
      action: isRelatedLogsQuery ? 'fetch_related_logs' : 'fetch_logs',
      metadata: {
        count: filteredLogs.length,
        total: count ?? 0,
        page: isRelatedLogsQuery ? 1 : page,
        pageSize,
        filters: { actionFilter, severityFilter, startDate, endDate, searchTerm },
        relatedLogs: isRelatedLogsQuery,
        relatedResourceId: relatedResourceId || undefined,
        relatedAdminId: relatedAdminId || undefined,
      },
    });

    // Return format differs for related logs vs regular logs
    if (isRelatedLogsQuery) {
      return NextResponse.json({
        relatedLogs: filteredLogs,
        total: count ?? 0,
      });
    }

    return NextResponse.json({
      logs: filteredLogs,
      total: count ?? 0,
      page,
      pageSize,
      totalPages,
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
