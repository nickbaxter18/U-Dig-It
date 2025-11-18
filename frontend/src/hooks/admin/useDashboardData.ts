import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import type { DashboardOverviewResponse, DateRangeKey } from '@/types/dashboard';

export function useDashboardData(range: DateRangeKey = 'month') {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'overview', range],
    queryFn: async () => {
      const response = await fetchWithAuth(`/api/admin/dashboard/overview?range=${range}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return (await response.json()) as DashboardOverviewResponse;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}


