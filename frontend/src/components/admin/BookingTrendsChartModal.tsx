'use client';

import type { BookingChartPoint, DateRangeKey } from '@/types/dashboard';

import { AdminModal } from './AdminModal';
import BookingTrendsChart from './BookingTrendsChart';

interface BookingTrendsChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BookingChartPoint[];
  summary: {
    totalBookings: number;
    completionRate: number;
    cancellationRate: number;
    growthPercentage: number | null;
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

export function BookingTrendsChartModal({
  isOpen,
  onClose,
  data,
  summary,
  title = 'Booking Trends',
  dateRange,
}: BookingTrendsChartModalProps) {
  const modalTitle = dateRange ? `${title} - ${dateRangeLabels[dateRange]}` : title;

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="6xl">
      <div className="p-6">
        {/* Summary Stats - Prominently displayed at top */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">Total Bookings</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{summary.totalBookings}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">Completion Rate</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {summary.completionRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">Cancellation Rate</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {summary.cancellationRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">Growth vs Previous Period</div>
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
        </div>

        {/* Full-size Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <BookingTrendsChart data={data} summary={summary} compact={false} />
        </div>
      </div>
    </AdminModal>
  );
}
