/**
 * Balance Discrepancy Alerting
 *
 * Monitors balance discrepancies and sends alerts when thresholds are exceeded
 */

import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';
import { getBalanceValidationLogs } from '@/lib/booking/balance-validator';

export interface BalanceAlert {
  id: string;
  bookingId: string;
  discrepancy: number;
  discrepancyPercentage: number;
  storedBalance: number;
  calculatedBalance: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export interface AlertSummary {
  totalAlerts: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  totalDiscrepancy: number;
  alerts: BalanceAlert[];
}

/**
 * Alert severity thresholds
 */
const ALERT_THRESHOLDS = {
  critical: { amount: 100.0, percentage: 10.0 }, // $100+ or 10%+
  high: { amount: 50.0, percentage: 5.0 }, // $50+ or 5%+
  medium: { amount: 10.0, percentage: 1.0 }, // $10+ or 1%+
  low: { amount: 0.01, percentage: 0.01 }, // $0.01+ or 0.01%+
};

/**
 * Determine alert severity based on discrepancy
 */
function determineSeverity(
  discrepancy: number,
  discrepancyPercentage: number
): 'low' | 'medium' | 'high' | 'critical' {
  const absDiscrepancy = Math.abs(discrepancy);
  const absPercentage = Math.abs(discrepancyPercentage);

  if (
    absDiscrepancy >= ALERT_THRESHOLDS.critical.amount ||
    absPercentage >= ALERT_THRESHOLDS.critical.percentage
  ) {
    return 'critical';
  }

  if (
    absDiscrepancy >= ALERT_THRESHOLDS.high.amount ||
    absPercentage >= ALERT_THRESHOLDS.high.percentage
  ) {
    return 'high';
  }

  if (
    absDiscrepancy >= ALERT_THRESHOLDS.medium.amount ||
    absPercentage >= ALERT_THRESHOLDS.medium.percentage
  ) {
    return 'medium';
  }

  return 'low';
}

/**
 * Get balance alerts for recent discrepancies
 *
 * @param hours - Hours to look back (default: 24)
 * @param minSeverity - Minimum severity to include (default: 'low')
 * @returns Array of balance alerts
 */
export async function getBalanceAlerts(
  hours: number = 24,
  minSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<BalanceAlert[]> {
  try {
    const logs = await getBalanceValidationLogs(1000, 0.01);

    // Filter by time window
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentLogs = logs.filter((log) => new Date(log.createdAt) >= cutoffTime);

    // Convert to alerts with severity
    const alerts: BalanceAlert[] = recentLogs
      .map((log) => {
        const severity = determineSeverity(log.discrepancy, log.discrepancyPercentage);
        return {
          id: log.id,
          bookingId: log.bookingId,
          discrepancy: log.discrepancy,
          discrepancyPercentage: log.discrepancyPercentage,
          storedBalance: log.storedBalance,
          calculatedBalance: log.calculatedBalance,
          severity,
          createdAt: log.createdAt,
        };
      })
      .filter((alert) => {
        // Filter by minimum severity
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        return severityOrder[alert.severity] >= severityOrder[minSeverity];
      })
      .sort((a, b) => {
        // Sort by severity (critical first), then by discrepancy amount
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return Math.abs(b.discrepancy) - Math.abs(a.discrepancy);
      });

    return alerts;
  } catch (error) {
    logger.error(
      'Error fetching balance alerts',
      {
        component: 'balance-alerts',
        action: 'get_alerts',
        metadata: { hours, minSeverity },
      },
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get alert summary
 *
 * @param hours - Hours to look back (default: 24)
 * @returns Alert summary with counts by severity
 */
export async function getAlertSummary(
  hours: number = 24
): Promise<AlertSummary> {
  const alerts = await getBalanceAlerts(hours, 'low');

  const summary: AlertSummary = {
    totalAlerts: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.filter((a) => a.severity === 'low').length,
    totalDiscrepancy: alerts.reduce((sum, a) => sum + Math.abs(a.discrepancy), 0),
    alerts,
  };

  return summary;
}

/**
 * Check if critical alerts exist and need immediate attention
 *
 * @param hours - Hours to look back (default: 24)
 * @returns True if critical alerts exist
 */
export async function hasCriticalAlerts(hours: number = 24): Promise<boolean> {
  const alerts = await getBalanceAlerts(hours, 'critical');
  return alerts.length > 0;
}


