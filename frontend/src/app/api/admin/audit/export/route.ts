import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/audit/export
 * Export audit logs to CSV
 *
 * Admin-only endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    // 3. Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');

    // 4. Fetch audit logs
    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('id, table_name, record_id, action, old_values, new_values, ip_address, user_agent, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (logsError) throw logsError;

    // 5. Fetch user data
    const userIds = [...new Set((logs || []).map(log => log.user_id).filter(Boolean))];
    const { data: users } = await supabase
      .from('users')
      .select('id, firstName, lastName, email')
      .in('id', userIds);

    const usersMap = new Map((users || []).map(u => [u.id, u]));

    // 6. Generate CSV
    const csvHeaders = [
      'Timestamp',
      'Admin Name',
      'Admin Email',
      'Action',
      'Resource Type',
      'Resource ID',
      'IP Address',
      'User Agent',
      'Changes Summary',
    ];

    const csvRows = (logs || []).map((log: any) => {
      const user = log.user_id ? usersMap.get(log.user_id) : null;
      const userName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        : 'System';
      const userEmail = user?.email || 'system@kubota.com';

      // Create changes summary
      let changesSummary = '';
      if (log.old_values && log.new_values) {
        const changed = Object.keys(log.new_values).filter(
          key => JSON.stringify(log.old_values[key]) !== JSON.stringify(log.new_values[key])
        );
        changesSummary = changed.join(', ');
      } else if (log.action === 'create') {
        changesSummary = 'New record created';
      } else if (log.action === 'delete') {
        changesSummary = 'Record deleted';
      }

      return [
        new Date(log.created_at).toLocaleString(),
        userName,
        userEmail,
        log.action.toUpperCase(),
        log.table_name,
        log.record_id,
        log.ip_address || 'Unknown',
        (log.user_agent || 'Unknown').substring(0, 50), // Truncate user agent
        changesSummary,
      ];
    });

    const csvContent = [
      csvHeaders.map(h => `"${h}"`).join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    logger.info('Audit logs exported', {
      component: 'audit-export-api',
      action: 'export_success',
      metadata: {
        count: csvRows.length,
        adminId: supabase.auth.getUser().data.user?.id,
      },
    });

    // 7. Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    logger.error(
      'Audit export error',
      {
        component: 'audit-export-api',
        action: 'error',
      },
      error
    );

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

