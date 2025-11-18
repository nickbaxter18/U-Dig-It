import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    

    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from('alert_incidents')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id || 'unknown',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .in('status', ['open', 'acknowledged']); // Only resolve open or acknowledged alerts

    if (updateError) {
      logger.error(
        'Failed to resolve alert',
        {
          component: 'admin-dashboard-alerts',
          action: 'resolve_failed',
          metadata: { alertId: params.id, adminId: user?.id || 'unknown' },
        },
        updateError
      );
      return NextResponse.json(
        { error: 'Unable to resolve alert' },
        { status: 500 }
      );
    }

    logger.info('Alert resolved', {
      component: 'admin-dashboard-alerts',
      action: 'alert_resolved',
      metadata: { alertId: params.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error(
      'Unexpected error resolving alert',
      {
        component: 'admin-dashboard-alerts',
        action: 'resolve_unexpected',
        metadata: { alertId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

