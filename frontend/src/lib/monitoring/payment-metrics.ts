/**
 * Payment Processing Metrics
 *
 * Tracks and aggregates payment processing health metrics
 */

import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

export interface PaymentMetrics {
  // Success rates
  paymentSuccessRate: number;
  refundSuccessRate: number;
  processingTimeAvg: number;

  // Volume metrics
  totalPayments: number;
  totalRefunds: number;
  totalAmount: number;
  totalRefunded: number;

  // Error metrics
  failedPayments: number;
  failedRefunds: number;
  balanceDiscrepancies: number;

  // Time-based metrics
  periodStart: string;
  periodEnd: string;
  periodDays: number;
}

/**
 * Calculate payment processing metrics for a time period
 *
 * @param startDate - Start date (default: 7 days ago)
 * @param endDate - End date (default: now)
 * @returns Payment metrics
 */
export async function calculatePaymentMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<PaymentMetrics> {
  const end = endDate || new Date();
  const start = startDate || new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const periodDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

  try {
    const supabase = createServiceClient();

    // Fetch payments in period
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, status, "amountRefunded", "processedAt", "createdAt", type')
      .gte('createdAt', start.toISOString())
      .lte('createdAt', end.toISOString());

    if (paymentsError) {
      throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
    }

    // Fetch manual payments in period
    const { data: manualPayments, error: manualError } = await supabase
      .from('manual_payments')
      .select('amount, status, "receivedAt", "createdAt"')
      .gte('createdAt', start.toISOString())
      .lte('createdAt', end.toISOString())
      .is('deleted_at', null);

    if (manualError) {
      throw new Error(`Failed to fetch manual payments: ${manualError.message}`);
    }

    // Calculate metrics
    const allPayments = (payments || []).filter((p) => !p.type || p.type === 'payment');
    const completedPayments = allPayments.filter((p) => p.status === 'completed');
    const failedPayments = allPayments.filter((p) => p.status === 'failed');
    const refundedPayments = allPayments.filter(
      (p) => p.status === 'refunded' || p.status === 'partially_refunded'
    );

    const completedManualPayments = (manualPayments || []).filter(
      (p) => p.status === 'completed'
    );

    const totalPayments = allPayments.length + (manualPayments?.length || 0);
    const successfulPayments = completedPayments.length + completedManualPayments.length;
    const paymentSuccessRate =
      totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 100;

    const totalRefunds = refundedPayments.length;
    const refundSuccessRate = totalRefunds > 0 ? 100 : 100; // Refunds are always successful if created

    // Calculate processing times (for completed payments with processedAt)
    const processingTimes = completedPayments
      .filter((p) => p.processedAt && p.createdAt)
      .map((p) => {
        const created = new Date(p.createdAt).getTime();
        const processed = new Date(p.processedAt).getTime();
        return processed - created;
      });

    const processingTimeAvg =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

    // Calculate amounts
    const totalAmount =
      completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0) +
      completedManualPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalRefunded = allPayments.reduce(
      (sum, p) => sum + Number(p.amountRefunded || 0),
      0
    );

    // Get balance discrepancies from validation logs
    const { data: validationLogs } = await supabase
      .from('balance_validation_log')
      .select('id')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const balanceDiscrepancies = validationLogs?.length || 0;

    return {
      paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
      refundSuccessRate: Math.round(refundSuccessRate * 100) / 100,
      processingTimeAvg: Math.round(processingTimeAvg),
      totalPayments,
      totalRefunds,
      totalAmount,
      totalRefunded,
      failedPayments: failedPayments.length,
      failedRefunds: 0, // Refunds don't fail in our system
      balanceDiscrepancies,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      periodDays,
    };
  } catch (error) {
    logger.error(
      'Error calculating payment metrics',
      {
        component: 'payment-metrics',
        action: 'calculate_metrics',
        metadata: { startDate: start.toISOString(), endDate: end.toISOString() },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    throw error;
  }
}


