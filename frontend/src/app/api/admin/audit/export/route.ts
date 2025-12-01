import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper function to calculate severity (same as main route)
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

// Helper function to get resource name (simplified for export - may be slower but more reliable)
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
    // Fallback
    return `${tableName.charAt(0).toUpperCase() + tableName.slice(1)} ${String(recordId).substring(0, 8)}`;
  } catch (error) {
    return `${tableName.charAt(0).toUpperCase() + tableName.slice(1)} ${String(recordId).substring(0, 8)}`;
  }
}

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { user } = adminResult;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const actionFilter = searchParams.get('action');
    const severityFilter = searchParams.get('severity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const searchTerm = searchParams.get('search');
    const resourceTypeFilter = searchParams.get('resourceType');

    // Build query (fetch users separately like main route)
    let query = supabase
      .from('audit_logs')
      .select('id, table_name, record_id, action, old_values, new_values, ip_address, user_agent, user_id, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(10000); // Large limit for export

    // Apply filters
    if (actionFilter && actionFilter !== 'all') {
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

    const { data: auditLogs, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!auditLogs || auditLogs.length === 0) {
      return NextResponse.json({ error: 'No audit logs found' }, { status: 404 });
    }

    // Fetch user data separately (same approach as main route)
    const userIds = [...new Set(auditLogs.map((log) => log.user_id).filter(Boolean))];
    const { data: users } = await supabase
      .from('users')
      .select('id, firstName, lastName, email')
      .in('id', userIds);

    const usersMap = new Map((users || []).map((u) => [u.id, u]));

    // Transform logs (same logic as main route)
    const transformedLogs = await Promise.all(
      auditLogs.map(async (log: any) => {
        const user = log.user_id ? usersMap.get(log.user_id) : null;
        const userName = user
          ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'unknown'
          : 'System';
        const userEmail = user?.email || '';

        // Get resource name
        const resourceName = await getResourceName(log.table_name, log.record_id, supabase);

        // Calculate severity (same logic as main route)
        const severity = calculateSeverity(log.action, log.table_name, log.metadata);

        // Transform action to uppercase
        const actionUpper = String(log.action || '').toUpperCase();

        // Generate description
        const actionPast = actionUpper === 'CREATE' ? 'created' : actionUpper === 'UPDATE' ? 'updated' : actionUpper === 'DELETE' ? 'deleted' : `${log.action}d`;
        const description = `${userName} ${actionPast} ${log.table_name} ${String(log.record_id).substring(0, 8)}...`;

        // Get IP and user agent
        const ipAddress = log.metadata?.ip_address || log.ip_address || 'Unknown';
        const userAgent = log.metadata?.user_agent || log.user_agent || 'Unknown';

        return {
          id: log.id,
          timestamp: log.created_at,
          adminName: userName,
          adminEmail: userEmail,
          action: actionUpper,
          tableName: log.table_name,
          recordId: log.record_id,
          resourceName,
          severity,
          description,
          ipAddress,
          userAgent,
          changesBefore: log.old_values,
          changesAfter: log.new_values,
        };
      })
    );

    // Apply client-side filters (search and severity)
    let filteredLogs = transformedLogs;
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredLogs = filteredLogs.filter((log) => {
        return (
          log.adminName.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.tableName.toLowerCase().includes(searchLower) ||
          log.resourceName.toLowerCase().includes(searchLower) ||
          log.description.toLowerCase().includes(searchLower) ||
          log.ipAddress.toLowerCase().includes(searchLower)
        );
      });
    }

    if (severityFilter && severityFilter !== 'all') {
      filteredLogs = filteredLogs.filter((log) => log.severity === severityFilter.toLowerCase());
    }

    if (format === 'csv') {
      // Generate CSV with resource name column
      const headers = [
        'ID',
        'Timestamp',
        'Admin User',
        'Admin Email',
        'Action',
        'Resource Type',
        'Resource Name',
        'Record ID',
        'Severity',
        'Description',
        'IP Address',
        'User Agent',
        'Changes Before',
        'Changes After',
      ];

      const rows = filteredLogs.map((log) => {
        return [
          log.id || '',
          log.timestamp ? new Date(log.timestamp).toISOString() : '',
          log.adminName,
          log.adminEmail,
          log.action || '',
          log.tableName || '',
          log.resourceName || '',
          log.recordId || '',
          log.severity || 'low',
          log.description || '',
          log.ipAddress || '',
          log.userAgent || '',
          log.changesBefore ? JSON.stringify(log.changesBefore) : '',
          log.changesAfter ? JSON.stringify(log.changesAfter) : '',
        ];
      });

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      logger.info('Audit log export completed', {
        component: 'admin-audit-export',
        action: 'export_csv',
        metadata: {
          adminId: user?.id || 'unknown',
          logCount: filteredLogs.length,
          format,
          filters: { actionFilter, severityFilter, startDate, endDate, searchTerm },
        },
      });

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'PDF export not yet implemented. Please use CSV format.' },
        { status: 501 }
      );
    }
  } catch (err) {
    logger.error(
      'Failed to export audit logs',
      { component: 'admin-audit-export', action: 'error' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Failed to export audit logs' }, { status: 500 });
  }
});
