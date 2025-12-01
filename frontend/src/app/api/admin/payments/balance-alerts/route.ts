import { NextRequest, NextResponse } from 'next/server';

import { rateLimit } from '@/lib/rate-limiter';
import { RateLimitPresets } from '@/lib/rate-limiter';
import { requireAdminServer } from '@/lib/supabase/requireAdminServer';
import { getBalanceAlerts, getAlertSummary } from '@/lib/monitoring/balance-alerts';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/payments/balance-alerts
 *
 * Get balance discrepancy alerts
 *
 * Query parameters:
 * - hours: Hours to look back (default: 24)
 * - minSeverity: Minimum severity (low, medium, high, critical) (default: low)
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Admin authentication
    const { supabase, user, error: authError } = await requireAdminServer();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const minSeverity = (searchParams.get('minSeverity') ||
      'low') as 'low' | 'medium' | 'high' | 'critical';

    // Get summary or detailed alerts based on query
    const summaryOnly = searchParams.get('summary') === 'true';

    if (summaryOnly) {
      const summary = await getAlertSummary(hours);
      return NextResponse.json({
        success: true,
        summary,
      });
    }

    const alerts = await getBalanceAlerts(hours, minSeverity);

    logger.info('Balance alerts retrieved', {
      component: 'api-balance-alerts',
      action: 'get_alerts',
      metadata: {
        hours,
        minSeverity,
        alertCount: alerts.length,
        critical: alerts.filter((a) => a.severity === 'critical').length,
      },
    });

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
      summary: {
        critical: alerts.filter((a) => a.severity === 'critical').length,
        high: alerts.filter((a) => a.severity === 'high').length,
        medium: alerts.filter((a) => a.severity === 'medium').length,
        low: alerts.filter((a) => a.severity === 'low').length,
      },
    });
  } catch (error) {
    logger.error(
      'Error fetching balance alerts',
      {
        component: 'api-balance-alerts',
        action: 'get_alerts_error',
      },
      error instanceof Error ? error : undefined
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


