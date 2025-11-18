import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const actionFilter = searchParams.get('action') || null;
    const severityFilter = searchParams.get('severity') || null;
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;

    // Build query
    let query = supabase
      .from('audit_logs')
      .select(
        `
        id,
        table_name,
        record_id,
        action,
        user_id,
        old_values,
        new_values,
        metadata,
        created_at,
        users:user_id (
          firstName,
          lastName,
          email
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(10000); // Large limit for export

    // Apply filters
    if (actionFilter && actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }

    if (severityFilter && severityFilter !== 'all') {
      query = query.eq('metadata->>severity', severityFilter);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: auditLogs, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!auditLogs || auditLogs.length === 0) {
      return NextResponse.json({ error: 'No audit logs found' }, { status: 404 });
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID',
        'Timestamp',
        'Admin User',
        'Admin Email',
        'Action',
        'Table',
        'Record ID',
        'Severity',
        'Description',
        'IP Address',
        'User Agent',
        'Changes Before',
        'Changes After',
      ];

      const rows = auditLogs.map((log: any) => {
        const adminName = log.users
          ? `${log.users.firstName || ''} ${log.users.lastName || ''}`.trim() || 'Unknown'
          : 'Unknown';
        const adminEmail = log.users?.email || '';
        const severity = log.metadata?.severity || 'low';
        const description = log.metadata?.description || log.action || '';
        const ipAddress = log.metadata?.ip_address || '';
        const userAgent = log.metadata?.user_agent || '';

        return [
          log.id || '',
          log.created_at ? new Date(log.created_at).toISOString() : '',
          adminName,
          adminEmail,
          log.action || '',
          log.table_name || '',
          log.record_id || '',
          severity,
          description,
          ipAddress,
          userAgent,
          log.old_values ? JSON.stringify(log.old_values) : '',
          log.new_values ? JSON.stringify(log.new_values) : '',
        ];
      });

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      logger.info('Audit log export completed', {
        component: 'admin-audit-export',
        action: 'export_csv',
        metadata: { adminId: user?.id || 'unknown', logCount: auditLogs.length, format },
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
}
