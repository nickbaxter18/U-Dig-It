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
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user?.id || 'unknown',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('status', 'open'); // Only acknowledge open alerts

    if (updateError) {
      logger.error(
        'Failed to acknowledge alert',
        {
          component: 'admin-dashboard-alerts',
          action: 'acknowledge_failed',
          metadata: { alertId: params.id, adminId: user?.id || 'unknown' },
        },
        updateError
      );
      return NextResponse.json(
        { error: 'Unable to acknowledge alert' },
        { status: 500 }
      );
    }

    logger.info('Alert acknowledged', {
      component: 'admin-dashboard-alerts',
      action: 'alert_acknowledged',
      metadata: { alertId: params.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error(
      'Unexpected error acknowledging alert',
      {
        component: 'admin-dashboard-alerts',
        action: 'acknowledge_unexpected',
        metadata: { alertId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

