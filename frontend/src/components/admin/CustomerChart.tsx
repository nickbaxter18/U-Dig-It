'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { memo, useMemo } from 'react';

export interface CustomerChartPoint {
  date: string;
  newCustomers: number;
  returningCustomers: number;
  total: number;
}

interface CustomerChartProps {
  data: CustomerChartPoint[];
  summary: {
    totalCustomers: number;
    newCustomers: number;
    retentionRate: number;
  };
  compact?: boolean;
  className?: string;
}

/**
 * Formats a date for display in the chart
 * Handles YYYY-MM-DD format strings correctly by parsing as local date, not UTC
 */
function formatChartDate(dateString: string): string {
  try {
    // If dateString is in YYYY-MM-DD format, parse it as local date to avoid timezone issues
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }

    // Fallback for ISO strings or other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Validates and sanitizes chart data
 */
function validateData(data: CustomerChartPoint[]): CustomerChartPoint[] {
  if (!Array.isArray(data)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CustomerChart] validateData: data is not an array', { data });
    }
    return [];
  }

  if (data.length === 0) {
    return [];
  }

  return data
    .filter((point) => {
      // Filter out invalid entries
      if (!point || typeof point !== 'object') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[CustomerChart] validateData: invalid point (not object)', { point });
        }
        return false;
      }
      if (!point.date || typeof point.date !== 'string') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[CustomerChart] validateData: invalid point (missing/invalid date)', {
            point,
          });
        }
        return false;
      }

      // Validate date is parseable
      if (/^\d{4}-\d{2}-\d{2}$/.test(point.date)) {
        const [year, month, day] = point.date.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[CustomerChart] validateData: invalid point (unparseable date)', {
              point,
              date: point.date,
            });
          }
          return false;
        }
      } else {
        const date = new Date(point.date);
        if (isNaN(date.getTime())) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[CustomerChart] validateData: invalid point (unparseable date)', {
              point,
              date: point.date,
            });
          }
          return false;
        }
      }

      return true;
    })
    .map((point) => ({
      date: point.date,
      newCustomers: Number(point.newCustomers) || 0,
      returningCustomers: Number(point.returningCustomers) || 0,
      total: Number(point.total) || (Number(point.newCustomers) || 0) + (Number(point.returningCustomers) || 0),
    }));
}

/**
 * Transforms data for Recharts consumption
 */
function transformDataForRecharts(data: CustomerChartPoint[]): Array<{
  date: string;
  formattedDate: string;
  newCustomers: number;
  returningCustomers: number;
  total: number;
}> {
  return data.map((point) => ({
    date: point.date,
    formattedDate: formatChartDate(point.date),
    newCustomers: point.newCustomers,
    returningCustomers: point.returningCustomers,
    total: point.total,
  }));
}

const CustomerChart = memo(function CustomerChart({
  data,
  summary,
  compact = false,
  className,
}: CustomerChartProps) {
  const validatedData = useMemo(() => validateData(data), [data]);
  const transformedData = useMemo(() => transformDataForRecharts(validatedData), [validatedData]);

  // Handle single data point case
  if (transformedData.length === 1) {
    const point = transformedData[0];
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={compact ? 200 : 300}>
          <BarChart data={[point]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="formattedDate"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'newCustomers') return [value, 'New Customers'];
                if (name === 'returningCustomers') return [value, 'Returning Customers'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="newCustomers" stackId="customers" fill="#9333ea" name="New Customers" radius={[0, 0, 0, 0]} />
            <Bar dataKey="returningCustomers" stackId="customers" fill="#3b82f6" name="Returning Customers" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Calculate max value for proper scaling (use total, not individual values)
  const maxCustomers = useMemo(() => {
    if (transformedData.length === 0) return 1;
    const max = Math.max(...transformedData.map((point) => point.total), 1);
    return max * 1.1; // Add 10% padding
  }, [transformedData]);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={compact ? 200 : 300}>
        <BarChart
          data={transformedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          barCategoryGap="10%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="formattedDate"
            angle={transformedData.length > 7 ? -45 : 0}
            textAnchor={transformedData.length > 7 ? 'end' : 'middle'}
            height={transformedData.length > 7 ? 80 : 60}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            interval={transformedData.length > 14 ? 'preserveStartEnd' : 0}
          />
          <YAxis
            domain={[0, maxCustomers * 1.1]}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'newCustomers') return [value, 'New Customers'];
              if (name === 'returningCustomers') return [value, 'Returning Customers'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar dataKey="newCustomers" stackId="customers" fill="#9333ea" name="New Customers" radius={[0, 0, 0, 0]} />
          <Bar dataKey="returningCustomers" stackId="customers" fill="#3b82f6" name="Returning Customers" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default CustomerChart;

