/**
 * Realtime Dashboard Hook
 *
 * Subscribes to real-time updates for dashboard metrics
 * Updates materialized views and key metrics in real-time
 */

import { useEffect, useState, useCallback } from 'react';

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

interface DashboardMetrics {
  totalRevenue: number;
  totalBookings: number;
  activeBookings: number;
  totalCustomers: number;
  lastUpdated: Date | null;
}

interface UseRealtimeDashboardOptions {
  onMetricsUpdate?: (metrics: DashboardMetrics) => void;
  refreshInterval?: number; // Optional: refresh interval in milliseconds
}

interface UseRealtimeDashboardReturn {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRealtimeDashboard(
  options: UseRealtimeDashboardOptions = {}
): UseRealtimeDashboardReturn {
  const { onMetricsUpdate, refreshInterval } = options;
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchMetrics = useCallback(async () => {
    try {
      // Query materialized view for dashboard overview
      const { data: overview, error: overviewError } = await supabase
        .from('mv_dashboard_overview')
        .select('*')
        .limit(1)
        .single();

      if (overviewError && overviewError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is OK for empty dashboard
        throw overviewError;
      }

      // Query active bookings count
      const { count: activeBookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', [
          'pending',
          'confirmed',
          'paid',
          'insurance_verified',
          'ready_for_pickup',
          'delivered',
          'in_progress',
        ]);

      const dashboardMetrics: DashboardMetrics = {
        totalRevenue: overview?.total_revenue ?? 0,
        totalBookings: overview?.total_bookings ?? 0,
        activeBookings: activeBookingsCount ?? 0,
        totalCustomers: overview?.total_customers ?? 0,
        lastUpdated: overview?.last_updated ? new Date(overview.last_updated) : null,
      };

      setMetrics(dashboardMetrics);
      setLoading(false);
      setError(null);

      if (onMetricsUpdate) {
        onMetricsUpdate(dashboardMetrics);
      }
    } catch (err) {
      logger.error(
        'Failed to fetch dashboard metrics',
        {
          component: 'useRealtimeDashboard',
          action: 'fetch_error',
        },
        err instanceof Error ? err : undefined
      );
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      setLoading(false);
    }
  }, [supabase, onMetricsUpdate]);

  useEffect(() => {
    fetchMetrics();

    // Set up Realtime subscriptions for key tables
    const channels = [
      // Subscribe to bookings changes
      supabase
        .channel('dashboard-bookings')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
          },
          () => {
            // Refresh metrics when bookings change
            fetchMetrics();
          }
        )
        .subscribe(),

      // Subscribe to payments changes
      supabase
        .channel('dashboard-payments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
          },
          () => {
            // Refresh metrics when payments change
            fetchMetrics();
          }
        )
        .subscribe(),

      // Subscribe to materialized view refresh notifications (if using NOTIFY)
      supabase
        .channel('dashboard-refresh')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'mv_dashboard_overview',
          },
          () => {
            // Refresh metrics when materialized view is updated
            fetchMetrics();
          }
        )
        .subscribe(),
    ];

    // Optional: Set up interval refresh
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchMetrics();
      }, refreshInterval);
    }

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchMetrics, refreshInterval, supabase]);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
  };
}


