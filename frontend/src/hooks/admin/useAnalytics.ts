import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

type DateRange = 'week' | 'month' | 'quarter' | 'year';

export function useAnalytics(dateRange: DateRange = 'month') {
  return useQuery({
    queryKey: ['admin', 'analytics', dateRange],
    queryFn: async () => {
      const now = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const { data, error } = await (supabase.rpc as any)('get_analytics_aggregated', {
        p_metric_type: 'all',
        p_start_date: startDate.toISOString(),
        p_end_date: now.toISOString(),
      });

      if (error) throw error;

      // Transform RPC function results
      const revenueData = data.revenue?.daily_data || [];
      const bookingsData = data.bookings?.daily_data || [];
      const equipmentData = data.equipment?.utilization_data || [];
      const customersData = data.customers?.daily_data || [];

      return {
        revenue: {
          data: revenueData.map((item: unknown) => ({
            date: item.date,
            revenue: parseFloat(item.revenue || '0'),
            bookings: parseInt(item.bookings || '0', 10),
          })),
          totalRevenue: parseFloat(data.revenue?.total_revenue || '0'),
          growthPercentage: 0,
          averageDailyRevenue: parseFloat(data.revenue?.average_daily_revenue || '0'),
        },
        bookings: {
          data: bookingsData.map((item: unknown) => ({
            date: item.date,
            bookings: parseInt(item.total || '0', 10),
            completed: parseInt(item.completed || '0', 10),
            cancelled: parseInt(item.cancelled || '0', 10),
          })),
          totalBookings: parseInt(data.bookings?.total_bookings || '0', 10),
          completionRate: parseFloat(data.bookings?.completion_rate || '0'),
          cancellationRate: 0,
        },
        equipment: {
          data: equipmentData.map((item: unknown) => ({
            equipmentId: item.equipment_id,
            equipmentName: item.equipment_name,
            utilizationRate: parseFloat(item.utilization_rate || '0'),
            revenue: parseFloat(item.revenue || '0'),
          })),
          averageUtilization: parseFloat(data.equipment?.average_utilization || '0'),
          topPerformer:
            equipmentData.length > 0
              ? equipmentData.reduce(
                  (max: unknown, e: unknown) =>
                    parseFloat(e.utilization_rate || '0') > parseFloat(max.utilization_rate || '0')
                      ? e
                      : max,
                  equipmentData[0]
                )
              : { equipmentId: '', equipmentName: 'N/A', utilizationRate: 0 },
        },
        customers: {
          data: customersData.map((item: unknown) => ({
            date: item.date,
            newCustomers: parseInt(item.new_customers || '0', 10),
            returningCustomers: parseInt(item.returning_customers || '0', 10),
          })),
          totalCustomers: parseInt(data.customers?.total_customers || '0', 10),
          newCustomers: parseInt(data.customers?.new_customers || '0', 10),
          retentionRate: 0,
          averageLifetimeValue: parseFloat(data.customers?.average_lifetime_value || '0'),
        },
      };
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
