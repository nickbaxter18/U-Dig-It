'use client';

import { useMemo } from 'react';

import type { BookingChartPoint } from '@/types/dashboard';

interface BookingTrendsChartProps {
  data: BookingChartPoint[];
  summary: {
    totalBookings: number;
    completionRate: number;
    cancellationRate: number;
    growthPercentage: number | null;
  };
  className?: string;
}

export default function BookingTrendsChart({ data, summary, className = '' }: BookingTrendsChartProps) {
  const maxTotal = useMemo(() => Math.max(...data.map(point => point.total), 1), [data]);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 text-sm md:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-gray-500">Total Bookings</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{summary.totalBookings}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Completion Rate</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {summary.completionRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Cancellation Rate</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {summary.cancellationRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Growth vs Previous Period</p>
          <p
            className={`mt-1 text-lg font-semibold ${
              summary.growthPercentage === null
                ? 'text-gray-500'
                : summary.growthPercentage >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
            }`}
          >
            {summary.growthPercentage === null
              ? 'N/A'
              : `${summary.growthPercentage >= 0 ? '+' : ''}${summary.growthPercentage.toFixed(1)}%`}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex h-64 items-end justify-between space-x-4">
          {data.map(point => {
            const totalHeight = (point.total / maxTotal) * 100;
            const completedHeight = point.total ? (point.completed / point.total) * 100 : 0;
            const cancelledHeight = point.total ? (point.cancelled / point.total) * 100 : 0;
            const activeHeight = Math.max(
              0,
              100 - Math.round(completedHeight) - Math.round(cancelledHeight)
            );

            return (
              <div key={point.date} className="flex flex-1 flex-col items-center">
                <div className="flex h-64 w-1 items-end justify-center">
                  <div
                    className="relative flex w-6 flex-col overflow-hidden rounded-md border border-orange-200 bg-orange-50 shadow-sm transition-transform duration-200 hover:scale-[1.03]"
                    style={{ height: `${Math.max(totalHeight, 2)}%` }}
                    title={`${new Date(point.date).toLocaleDateString()}: ${point.total} bookings`}
                    data-testid="booking-bar"
                  >
                    <div className="bg-green-500" style={{ height: `${completedHeight}%` }} aria-hidden="true" />
                    <div className="bg-orange-400" style={{ height: `${activeHeight}%` }} aria-hidden="true" />
                    <div className="bg-red-500" style={{ height: `${cancelledHeight}%` }} aria-hidden="true" />
                  </div>
                </div>
                <div className="mt-2 origin-left -rotate-45 transform text-xs text-gray-500">
                  {new Date(point.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-400" />
            <span>Active / In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            <span>Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
