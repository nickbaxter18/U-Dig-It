import { NextRequest, NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/supabase/service';
import { calculatePaymentMetrics } from '@/lib/monitoring/payment-metrics';
import { getAlertSummary, hasCriticalAlerts } from '@/lib/monitoring/balance-alerts';
import { logger } from '@/lib/logger';

/**
 * GET /api/health/payments
 *
 * Payment system health check endpoint
 *
 * Returns:
 * - Database connectivity status
 * - Recent payment processing metrics
 * - Balance discrepancy alerts
 * - System health status
 */
export async function GET(request: NextRequest) {
  try {
    const healthStatus = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'unknown' as string, message: '' },
        payments: { status: 'unknown' as string, message: '' },
        balanceValidation: { status: 'unknown' as string, message: '' },
      },
      metrics: null as any,
      alerts: null as any,
      issues: [] as string[],
    };

    // Check database connectivity
    try {
      const supabase = createServiceClient();
      const { error: dbError } = await supabase.from('bookings').select('id').limit(1);

      if (dbError) {
        healthStatus.checks.database = {
          status: 'unhealthy',
          message: `Database error: ${dbError.message}`,
        };
        healthStatus.issues.push('Database connectivity issue');
        healthStatus.status = 'unhealthy';
      } else {
        healthStatus.checks.database = {
          status: 'healthy',
          message: 'Database connection successful',
        };
      }
    } catch (error) {
      healthStatus.checks.database = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown database error',
      };
      healthStatus.issues.push('Database connection failed');
      healthStatus.status = 'unhealthy';
    }

    // Check payment processing (last 24 hours)
    try {
      const metrics = await calculatePaymentMetrics(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date()
      );

      healthStatus.metrics = metrics;

      // Determine payment health
      if (metrics.paymentSuccessRate < 90) {
        healthStatus.checks.payments = {
          status: 'degraded',
          message: `Low payment success rate: ${metrics.paymentSuccessRate.toFixed(2)}%`,
        };
        healthStatus.issues.push('Payment success rate below 90%');
        if (healthStatus.status === 'healthy') {
          healthStatus.status = 'degraded';
        }
      } else if (metrics.failedPayments > 10) {
        healthStatus.checks.payments = {
          status: 'degraded',
          message: `High number of failed payments: ${metrics.failedPayments}`,
        };
        healthStatus.issues.push(`High failed payment count: ${metrics.failedPayments}`);
        if (healthStatus.status === 'healthy') {
          healthStatus.status = 'degraded';
        }
      } else {
        healthStatus.checks.payments = {
          status: 'healthy',
          message: `Payment processing healthy (${metrics.paymentSuccessRate.toFixed(2)}% success rate)`,
        };
      }
    } catch (error) {
      healthStatus.checks.payments = {
        status: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to calculate metrics',
      };
      healthStatus.issues.push('Payment metrics calculation failed');
    }

    // Check balance validation (last 24 hours)
    try {
      const alertSummary = await getAlertSummary(24);
      const criticalAlerts = await hasCriticalAlerts(24);

      healthStatus.alerts = {
        total: alertSummary.totalAlerts,
        critical: alertSummary.critical,
        high: alertSummary.high,
        medium: alertSummary.medium,
        low: alertSummary.low,
        totalDiscrepancy: alertSummary.totalDiscrepancy,
      };

      if (criticalAlerts) {
        healthStatus.checks.balanceValidation = {
          status: 'unhealthy',
          message: `${alertSummary.critical} critical balance discrepancies detected`,
        };
        healthStatus.issues.push(
          `${alertSummary.critical} critical balance discrepancies require immediate attention`
        );
        healthStatus.status = 'unhealthy';
      } else if (alertSummary.totalAlerts > 10) {
        healthStatus.checks.balanceValidation = {
          status: 'degraded',
          message: `${alertSummary.totalAlerts} balance discrepancies detected`,
        };
        healthStatus.issues.push(`High number of balance discrepancies: ${alertSummary.totalAlerts}`);
        if (healthStatus.status === 'healthy') {
          healthStatus.status = 'degraded';
        }
      } else {
        healthStatus.checks.balanceValidation = {
          status: 'healthy',
          message: `Balance validation healthy (${alertSummary.totalAlerts} discrepancies in last 24h)`,
        };
      }
    } catch (error) {
      healthStatus.checks.balanceValidation = {
        status: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to check balance validation',
      };
      healthStatus.issues.push('Balance validation check failed');
    }

    // Determine overall status
    const statusCode =
      healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 200 : 503;

    logger.info('Payment system health check completed', {
      component: 'api-health-payments',
      action: 'health_check',
      metadata: {
        status: healthStatus.status,
        issues: healthStatus.issues.length,
        paymentSuccessRate: healthStatus.metrics?.paymentSuccessRate,
        balanceDiscrepancies: healthStatus.alerts?.total,
      },
    });

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    logger.error(
      'Error performing payment system health check',
      {
        component: 'api-health-payments',
        action: 'health_check_error',
      },
      error instanceof Error ? error : undefined
    );

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}


