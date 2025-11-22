'use client';

import type { DateRangeKey, RevenueChartPoint } from '@/types/dashboard';

import { AdminModal } from './AdminModal';
import { RevenueChart } from './RevenueChart';

interface RevenueChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RevenueChartPoint[];
  summary: {
    totalRevenue: number;
    growthPercentage: number | null;
    averageDailyRevenue: number;
  };
  title?: string;
  dateRange?: DateRangeKey;
}

const dateRangeLabels: Record<DateRangeKey, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  quarter: 'This Quarter',
  year: 'This Year',
  custom: 'Custom Period',
};

export function RevenueChartModal({
  isOpen,
  onClose,
  data,
  summary,
  title = 'Revenue Trend',
  dateRange,
}: RevenueChartModalProps) {
  const modalTitle = dateRange ? `${title} - ${dateRangeLabels[dateRange]}` : title;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="6xl">
      <div className="p-6">
        {/* Summary Stats - Prominently displayed at top */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(summary.totalRevenue)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">Growth</div>
            {summary.growthPercentage === null ? (
              <div className="mt-1 text-2xl font-bold text-gray-500">N/A</div>
            ) : (
              <div
                className={`mt-1 text-2xl font-bold ${
                  summary.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {summary.growthPercentage >= 0 ? '+' : ''}
                {summary.growthPercentage.toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">Daily Average</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(summary.averageDailyRevenue)}
            </div>
          </div>
        </div>

        {/* Full-size Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <RevenueChart data={data} summary={summary} compact={false} />
        </div>
      </div>
    </AdminModal>
  );
}
