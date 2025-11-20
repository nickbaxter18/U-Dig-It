/**
 * GET /api/admin/permissions/audit
 * Get permission audit log entries
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { getAuditLog } from '@/lib/permissions/audit';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    const { user } = adminResult;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const performedBy = searchParams.get('performedBy') || undefined;
    const action = searchParams.get('action') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get audit log
    const logs = await getAuditLog({
      userId,
      performedBy,
      action: action as any,
      limit,
      offset,
    });

    logger.info('Audit log retrieved', {
      component: 'admin-permissions-audit',
      action: 'get_audit_log',
      metadata: {
        userId: user.id,
        filters: { userId, performedBy, action },
        count: logs.length,
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    logger.error('Failed to get audit log', {
      component: 'admin-permissions-audit',
      action: 'get_audit_log',
    });

    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to retrieve audit log' },
      { status: 500 }
    );
  }
}
