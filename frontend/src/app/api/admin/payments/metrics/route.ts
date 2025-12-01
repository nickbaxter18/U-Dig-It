import { NextRequest, NextResponse } from 'next/server';

import { rateLimit } from '@/lib/rate-limiter';
import { RateLimitPresets } from '@/lib/rate-limiter';
import { requireAdminServer } from '@/lib/supabase/requireAdminServer';
import { calculatePaymentMetrics } from '@/lib/monitoring/payment-metrics';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/payments/metrics
 *
 * Get payment processing metrics
 *
 * Query parameters:
 * - days: Number of days to look back (default: 7)
 * - startDate: Start date (ISO string, optional)
 * - endDate: End date (ISO string, optional)
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
    const days = parseInt(searchParams.get('days') || '7', 10);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      endDate = new Date();
      startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    }

    const metrics = await calculatePaymentMetrics(startDate, endDate);

    logger.info('Payment metrics retrieved', {
      component: 'api-payment-metrics',
      action: 'get_metrics',
      metadata: {
        periodDays: metrics.periodDays,
        paymentSuccessRate: metrics.paymentSuccessRate,
        totalPayments: metrics.totalPayments,
        balanceDiscrepancies: metrics.balanceDiscrepancies,
      },
    });

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    logger.error(
      'Error fetching payment metrics',
      {
        component: 'api-payment-metrics',
        action: 'get_metrics_error',
      },
      error instanceof Error ? error : undefined
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


