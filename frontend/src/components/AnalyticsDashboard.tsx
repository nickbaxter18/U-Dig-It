'use client';

import { formatCurrency, formatDate } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    daily: number;
    growth: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  equipment: {
    utilization: number;
    availability: number;
    maintenance: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    satisfaction: number;
  };
  trends: {
    revenue: Array<{ date: string; value: number }>;
    bookings: Array<{ date: string; value: number }>;
    utilization: Array<{ date: string; value: number }>;
  };
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    // Simulate API call
    const fetchAnalytics = async () => {
      setLoading(true);

      // Mock data - replace with actual API call
      const mockData: AnalyticsData = {
        revenue: {
          total: 125000,
          monthly: 15000,
          daily: 500,
          growth: 12.5,
        },
        bookings: {
          total: 45,
          pending: 3,
          confirmed: 35,
          completed: 25,
          cancelled: 2,
        },
        equipment: {
          utilization: 78,
          availability: 22,
          maintenance: 5,
        },
        customers: {
          total: 120,
          new: 15,
          returning: 85,
          satisfaction: 4.8,
        },
        trends: {
          revenue: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 2000) + 800,
          })),
          bookings: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 10) + 1,
          })),
          utilization: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 40) + 60,
          })),
        },
      };

      setTimeout(() => {
        setAnalytics(mockData);
        setLoading(false);
      }, 1000);
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-white p-6 shadow">
            <div className="mb-2 h-4 rounded bg-gray-200"></div>
            <div className="h-8 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d'
                ? '7 Days'
                : range === '30d'
                  ? '30 Days'
                  : range === '90d'
                    ? '90 Days'
                    : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.revenue.total)}
              </p>
            </div>
            <div className="flex items-center text-green-600">
              <svg className="mr-1 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">+{analytics.revenue.growth}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.bookings.total}</p>
            </div>
            <div className="text-blue-600">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Equipment Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.equipment.utilization}%</p>
            </div>
            <div className="text-orange-600">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.customers.satisfaction}/5
              </p>
            </div>
            <div className="text-yellow-600">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <div className="flex h-64 items-end space-x-1">
            {analytics.trends.revenue.slice(-14).map((point: any, index: any) => (
              <div
                key={index}
                className="rounded-t bg-blue-500"
                style={{
                  height: `${(point.value / Math.max(...analytics.trends.revenue.map(p => p.value))) * 100}%`,
                  width: '100%',
                }}
                title={`${formatDate(point.date)}: ${formatCurrency(point.value)}`}
              />
            ))}
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Booking Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Confirmed</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-24 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{
                      width: `${(analytics.bookings.confirmed / analytics.bookings.total) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.bookings.confirmed}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-24 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${(analytics.bookings.completed / analytics.bookings.total) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.bookings.completed}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-24 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-yellow-500"
                    style={{
                      width: `${(analytics.bookings.pending / analytics.bookings.total) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.bookings.pending}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cancelled</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-24 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{
                      width: `${(analytics.bookings.cancelled / analytics.bookings.total) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.bookings.cancelled}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Status */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Equipment Status</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {analytics.equipment.utilization}%
            </div>
            <div className="text-sm text-gray-600">Utilization Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {analytics.equipment.availability}%
            </div>
            <div className="text-sm text-gray-600">Availability</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {analytics.equipment.maintenance}%
            </div>
            <div className="text-sm text-gray-600">Under Maintenance</div>
          </div>
        </div>
      </div>
    </div>
  );
}
