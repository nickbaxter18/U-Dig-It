'use client';

import { useMemo } from 'react';

import type {
  RevenueChartPoint,
  RevenueComparisonPoint,
} from '@/types/dashboard';

interface RevenueChartProps {
  data: RevenueChartPoint[];
  comparison?: RevenueComparisonPoint[];
  summary: {
    totalRevenue: number;
    growthPercentage: number | null;
    averageDailyRevenue: number;
  };
}

export function RevenueChart({ data, comparison = [], summary }: RevenueChartProps) {
  const maxRevenue = useMemo(
    () => Math.max(...data.map(point => point.netRevenue), 1),
    [data]
  );

  const hasComparison = comparison.length > 0;
  const comparisonMap = useMemo(() => {
    if (!hasComparison) return new Map<string, number>();
    return new Map(comparison.map(point => [point.date, point.netRevenue]));
  }, [comparison, hasComparison]);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="revenue-chart-container">
      <div className="h-64 rounded-lg bg-gray-50 p-4" data-testid="revenue-chart">
        <div className="flex h-full items-end justify-between space-x-3">
          {data.map(point => {
            const netRevenue = point.netRevenue;
            const heightPercent = (netRevenue / maxRevenue) * 100;
            const comparisonValue = comparisonMap.get(point.date);

            return (
              <div key={point.date} className="flex min-w-[24px] flex-1 flex-col items-center gap-2">
                <div className="relative flex h-full w-full items-end justify-center">
                  {hasComparison ? (
                    <div
                      className="absolute bottom-0 w-3 rounded-t bg-orange-200 opacity-70"
                      style={{
                        height: `${Math.max(2, ((comparisonValue ?? 0) / maxRevenue) * 100)}%`,
                      }}
                      title={`${point.date}: Previous $${(comparisonValue ?? 0).toLocaleString()}`}
                    />
                  ) : null}
                  <div
                    className="relative flex h-full w-6 flex-col justify-end overflow-hidden rounded-md bg-gradient-to-t from-orange-500 via-orange-400 to-orange-300 shadow-sm transition-transform duration-200 hover:scale-[1.02]"
                    style={{ height: `${Math.max(2, heightPercent)}%` }}
                    title={`${point.date}: $${netRevenue.toLocaleString()}`}
                    data-testid="revenue-bar"
                  >
                    <div className="absolute inset-x-0 top-0 h-[6px] bg-white/20" />
                  </div>
                </div>
                <div className="origin-left -rotate-45 text-xs text-gray-500">
                  {new Date(point.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm" data-testid="revenue-summary">
        <div className="text-center">
          <div className="text-gray-500">Total Revenue</div>
          <div className="text-lg font-semibold">
            ${summary.totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Growth</div>
          {summary.growthPercentage === null ? (
            <div className="text-lg font-semibold text-gray-500">N/A</div>
          ) : (
            <div
              className={`text-lg font-semibold ${
                summary.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {summary.growthPercentage >= 0 ? '+' : ''}
              {summary.growthPercentage.toFixed(1)}%
            </div>
          )}
        </div>
        <div className="text-center">
          <div className="text-gray-500">Daily Average</div>
          <div className="text-lg font-semibold">
            $
            {summary.averageDailyRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
