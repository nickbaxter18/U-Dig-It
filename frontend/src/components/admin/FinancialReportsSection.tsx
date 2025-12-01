'use client';

import { Calendar, CreditCard, DollarSign, Download, TrendingDown, TrendingUp } from 'lucide-react';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { requestFinancialExport } from '@/lib/api/admin/payments';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

interface FinancialSummary {
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  averageTransactionValue: number;
  transactionCount: number;
  successRate: number;
  paymentMethodBreakdown: {
    card: number;
    bank_transfer: number;
    other: number;
  };
  periodComparison: {
    revenue: number;
    revenueGrowth: number;
    transactions: number;
    transactionsGrowth: number;
    hasComparison: boolean;
  };
}

interface FinancialReportsSectionProps {
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year';
}

const MS_IN_DAY = 24 * 60 * 60 * 1000;

function getDateRanges(range: FinancialReportsSectionProps['dateRange']): {
  currentStart?: Date;
  currentEnd?: Date;
  previousStart?: Date;
  previousEnd?: Date;
} {
  const now = new Date();
  const currentEnd = new Date(now);

  if (!range || range === 'all') {
    return { currentEnd };
  }

  switch (range) {
    case 'today': {
      const currentStart = new Date(now);
      currentStart.setHours(0, 0, 0, 0);

      const previousStart = new Date(currentStart.getTime() - MS_IN_DAY);
      const previousEnd = new Date(currentStart.getTime() - 1);

      return { currentStart, currentEnd, previousStart, previousEnd };
    }
    case 'week': {
      const currentStart = new Date(now.getTime() - 7 * MS_IN_DAY);
      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(previousEnd.getTime() - 7 * MS_IN_DAY + 1);

      return { currentStart, currentEnd, previousStart, previousEnd };
    }
    case 'month': {
      const currentStart = new Date(now);
      currentStart.setMonth(currentStart.getMonth() - 1);

      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(currentStart);
      previousStart.setMonth(previousStart.getMonth() - 1);

      return { currentStart, currentEnd, previousStart, previousEnd };
    }
    case 'quarter': {
      const currentStart = new Date(now);
      currentStart.setMonth(currentStart.getMonth() - 3);

      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(currentStart);
      previousStart.setMonth(previousStart.getMonth() - 3);

      return { currentStart, currentEnd, previousStart, previousEnd };
    }
    case 'year': {
      const currentStart = new Date(now);
      currentStart.setFullYear(currentStart.getFullYear() - 1);

      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(currentStart);
      previousStart.setFullYear(previousStart.getFullYear() - 1);

      return { currentStart, currentEnd, previousStart, previousEnd };
    }
    default:
      return { currentEnd };
  }
}

export function FinancialReportsSection({ dateRange = 'month' }: FinancialReportsSectionProps) {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchFinancialSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges(dateRange);
      const selectColumns = 'amount, status, method, "amountRefunded", "createdAt", type';

      // Fetch both Stripe payments and manual payments for current period
      let currentStripeQuery = supabase.from('payments').select(selectColumns);
      let currentManualQuery = supabase
        .from('manual_payments')
        .select('amount, status, method, created_at')
        .eq('status', 'completed')
        .is('deleted_at', null);

      if (currentStart) {
        currentStripeQuery = currentStripeQuery.gte('createdAt', currentStart.toISOString());
        currentManualQuery = currentManualQuery.gte('created_at', currentStart.toISOString());
      }
      if (currentEnd) {
        currentStripeQuery = currentStripeQuery.lte('createdAt', currentEnd.toISOString());
        currentManualQuery = currentManualQuery.lte('created_at', currentEnd.toISOString());
      }

      const [currentStripeResult, currentManualResult] = await Promise.all([
        currentStripeQuery,
        currentManualQuery,
      ]);

      if (currentStripeResult.error) throw currentStripeResult.error;
      if (currentManualResult.error) throw currentManualResult.error;

      // Combine Stripe and manual payments, normalize manual payments to match structure
      const currentStripePayments = currentStripeResult.data ?? [];
      const currentManualPayments = (currentManualResult.data ?? []).map((mp: unknown) => ({
        ...mp,
        type: 'payment',
        createdAt: (mp as { created_at: string }).created_at,
        amountRefunded: 0,
      }));
      const currentPayments = [...currentStripePayments, ...currentManualPayments];

      // Fetch previous period payments
      let previousPayments: unknown[] = [];
      if (previousStart && previousEnd) {
        const [previousStripeResult, previousManualResult] = await Promise.all([
          supabase
            .from('payments')
            .select(selectColumns)
            .gte('createdAt', previousStart.toISOString())
            .lte('createdAt', previousEnd.toISOString()),
          supabase
            .from('manual_payments')
            .select('amount, status, method, created_at')
            .eq('status', 'completed')
            .is('deleted_at', null)
            .gte('created_at', previousStart.toISOString())
            .lte('created_at', previousEnd.toISOString()),
        ]);

        if (previousStripeResult.error) throw previousStripeResult.error;
        if (previousManualResult.error) throw previousManualResult.error;

        const previousStripePayments = previousStripeResult.data ?? [];
        const previousManualPayments = (previousManualResult.data ?? []).map((mp: unknown) => ({
          ...mp,
          type: 'payment',
          createdAt: (mp as { created_at: string }).created_at,
          amountRefunded: 0,
        }));
        previousPayments = [...previousStripePayments, ...previousManualPayments];
      }

      const parseAmount = (value: unknown) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = Number.parseFloat(value);
          return Number.isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      const successfulPayments = currentPayments.filter(
        (p: unknown) => p.type === 'payment' && p.status === 'completed'
      );
      const totalRevenue = successfulPayments.reduce(
        (sum: number, p: unknown) => sum + parseAmount(p.amount),
        0
      );

      const totalRefunds = currentPayments.reduce(
        (sum: number, p: unknown) => sum + parseAmount(p.amountRefunded),
        0
      );

      const netRevenue = totalRevenue - totalRefunds;

      const transactionCount = successfulPayments.length;
      const totalTransactions = currentPayments.filter((p: unknown) => p.type === 'payment').length;
      const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;
      const successRate = totalTransactions > 0 ? (transactionCount / totalTransactions) * 100 : 0;

      // Payment method breakdown - include manual payment methods
      const paymentMethodBreakdown = {
        card: successfulPayments
          .filter(
            (p: unknown) =>
              p.method === 'credit_card' || p.method === 'debit_card' || p.method === 'pos' // POS terminal payments
          )
          .reduce((sum: number, p: unknown) => sum + parseAmount(p.amount), 0),
        bank_transfer: successfulPayments
          .filter((p: unknown) => p.method === 'bank_transfer' || p.method === 'ach')
          .reduce((sum: number, p: unknown) => sum + parseAmount(p.amount), 0),
        other: successfulPayments
          .filter((p: unknown) => ['cash', 'check', 'other'].includes(p.method as string))
          .reduce((sum: number, p: unknown) => sum + parseAmount(p.amount), 0),
      };

      const successfulPreviousPayments = previousPayments.filter(
        (p: unknown) => p.type === 'payment' && p.status === 'completed'
      );
      const previousRevenue = successfulPreviousPayments.reduce(
        (sum: number, p: unknown) => sum + parseAmount(p.amount),
        0
      );
      const previousTransactions = successfulPreviousPayments.length;
      const hasComparison =
        previousStart != null && previousEnd != null && previousPayments.length > 0;

      const revenueGrowth = hasComparison
        ? previousRevenue > 0
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
          : totalRevenue > 0
            ? 100
            : 0
        : 0;

      const transactionsGrowth = hasComparison
        ? previousTransactions > 0
          ? ((transactionCount - previousTransactions) / previousTransactions) * 100
          : transactionCount > 0
            ? 100
            : 0
        : 0;

      const financialSummary: FinancialSummary = {
        totalRevenue,
        totalRefunds,
        netRevenue,
        averageTransactionValue,
        transactionCount,
        successRate,
        paymentMethodBreakdown,
        periodComparison: {
          revenue: previousRevenue,
          revenueGrowth,
          transactions: previousTransactions,
          transactionsGrowth,
          hasComparison,
        },
      };

      setSummary(financialSummary);
    } catch (err: unknown) {
      logger.error(
        'Failed to fetch financial summary',
        {
          component: 'FinancialReportsSection',
          action: 'fetch_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to load financial summary');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchFinancialSummary();
  }, [fetchFinancialSummary]);

  // Memoize percentage calculations - MUST be before any early returns
  const paymentMethodPercentages = useMemo(
    () => ({
      card: summary?.totalRevenue && summary.totalRevenue > 0
        ? (summary.paymentMethodBreakdown.card / summary.totalRevenue) * 100
        : 0,
      bank_transfer: summary?.totalRevenue && summary.totalRevenue > 0
        ? (summary.paymentMethodBreakdown.bank_transfer / summary.totalRevenue) * 100
        : 0,
      other: summary?.totalRevenue && summary.totalRevenue > 0
        ? (summary.paymentMethodBreakdown.other / summary.totalRevenue) * 100
        : 0,
    }),
    [summary?.totalRevenue, summary?.paymentMethodBreakdown]
  );

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await requestFinancialExport({
        exportType: 'payments_summary',
        filters: { dateRange },
      });
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      logger.error(
        'Failed to generate financial export',
        {
          component: 'FinancialReportsSection',
          action: 'export_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex h-32 items-center justify-center rounded-lg bg-white p-6 shadow"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6" role="alert">
        <p className="text-sm text-red-700">{error || 'Failed to load financial reports'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Financial Reports</h3>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {exporting ? (
            <>
              <Download className="h-4 w-4 animate-bounce" />
              <span>Preparing...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </>
          )}
        </button>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Net Revenue */}
        <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Net Revenue</p>
              <p className="mt-2 text-3xl font-bold text-green-700">
                ${summary.netRevenue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-2 flex items-center text-sm text-gray-600">
                {summary.periodComparison.hasComparison ? (
                  summary.periodComparison.revenueGrowth >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="font-medium text-green-600">
                        +{summary.periodComparison.revenueGrowth.toFixed(1)}%
                      </span>
                      <span className="ml-1 text-gray-600">vs last period</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      <span className="font-medium text-red-600">
                        {summary.periodComparison.revenueGrowth.toFixed(1)}%
                      </span>
                      <span className="ml-1 text-gray-600">vs last period</span>
                    </>
                  )
                ) : (
                  <span>No prior period data</span>
                )}
              </div>
            </div>
            <DollarSign className="h-12 w-12 text-green-600 opacity-20" />
          </div>
        </div>

        {/* Average Transaction Value */}
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Avg Transaction</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">
                $
                {summary.averageTransactionValue.toLocaleString('en-CA', {
                  minimumFractionDigits: 2,
                })}
              </p>
              <div className="mt-2 text-sm text-gray-600">
                {summary.transactionCount} transactions
              </div>
            </div>
            <CreditCard className="h-12 w-12 text-blue-600 opacity-20" />
          </div>
        </div>

        {/* Success Rate */}
        <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900">Success Rate</p>
              <p className="mt-2 text-3xl font-bold text-purple-700">
                {summary.successRate.toFixed(1)}%
              </p>
              <div className="mt-2 flex items-center text-sm text-gray-600">
                {summary.periodComparison.hasComparison ? (
                  summary.periodComparison.transactionsGrowth >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
                      <span className="font-medium text-purple-600">
                        +{summary.periodComparison.transactionsGrowth.toFixed(1)}%
                      </span>
                      <span className="ml-1 text-gray-600">transactions</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      <span className="font-medium text-red-600">
                        {summary.periodComparison.transactionsGrowth.toFixed(1)}%
                      </span>
                      <span className="ml-1 text-gray-600">transactions</span>
                    </>
                  )
                ) : (
                  <span>No prior period data</span>
                )}
              </div>
            </div>
            <Calendar className="h-12 w-12 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Revenue Details */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h4 className="mb-4 text-sm font-medium text-gray-900">Revenue Breakdown</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gross Revenue:</span>
              <span className="text-sm font-medium text-gray-900">
                ${summary.totalRevenue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Refunds:</span>
              <span className="text-sm font-medium text-red-600">
                -${summary.totalRefunds.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-sm font-semibold text-gray-900">Net Revenue:</span>
              <span className="text-lg font-bold text-green-600">
                ${summary.netRevenue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h4 className="mb-4 text-sm font-medium text-gray-900">Payment Methods</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Credit/Debit Card:</span>
                <span className="text-sm font-medium text-gray-900">
                  $
                  {summary.paymentMethodBreakdown.card.toLocaleString('en-CA', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{
                    width: `${paymentMethodPercentages.card}%`,
                  }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {paymentMethodPercentages.card.toFixed(1)}% of total
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Bank Transfer:</span>
                <span className="text-sm font-medium text-gray-900">
                  $
                  {summary.paymentMethodBreakdown.bank_transfer.toLocaleString('en-CA', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{
                    width: `${paymentMethodPercentages.bank_transfer}%`,
                  }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {paymentMethodPercentages.bank_transfer.toFixed(1)}% of total
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Other:</span>
                <span className="text-sm font-medium text-gray-900">
                  $
                  {summary.paymentMethodBreakdown.other.toLocaleString('en-CA', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-gray-600"
                  style={{
                    width: `${paymentMethodPercentages.other}%`,
                  }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {paymentMethodPercentages.other.toFixed(1)}% of total
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
