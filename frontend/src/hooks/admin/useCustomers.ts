import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
// Customer type - defined inline since @/types/customer doesn't exist
interface Customer {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  [key: string]: any;
}

interface UseCustomersParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  statusFilter?: string;
}

export function useCustomers({ page = 1, pageSize = 25, searchTerm = '', statusFilter = 'all' }: UseCustomersParams = {}) {
  return useQuery({
    queryKey: ['admin', 'customers', page, pageSize, searchTerm, statusFilter],
    queryFn: async () => {
      const offset = (page - 1) * pageSize;
      const { data, error } = await (supabase.rpc as any)('get_customers_with_stats_paginated', {
        p_offset: offset,
        p_limit: pageSize,
        p_search_term: searchTerm || null,
        p_status_filter: statusFilter !== 'all' ? statusFilter : null,
      });

      if (error) {
        // Fallback to non-paginated function
        const { data: fallbackData, error: fallbackError } = await supabase.rpc('get_customers_with_stats');
        if (fallbackError) throw fallbackError;

        // Apply client-side pagination
        const startIndex = offset;
        const endIndex = startIndex + pageSize;
        const paginated = ((fallbackData || []) as any[]).slice(startIndex, endIndex);

        return {
          customers: paginated.map((c: any) => ({
            ...c,
            totalSpent: parseFloat(c.totalSpent || '0'),
            lastBooking: c.lastBooking ? new Date(c.lastBooking) : undefined,
            registrationDate: new Date(c.registrationDate),
          })) as Customer[],
          totalCount: ((fallbackData || []) as any[]).length,
        };
      }

      const customers = (data || []).map((c: any) => ({
        id: c.id,
        firstName: c.firstName || '',
        lastName: c.lastName || '',
        email: c.email,
        phone: c.phone || '',
        company: c.company || '',
        address: c.address || '',
        city: c.city || '',
        province: c.province || 'NB',
        postalCode: c.postalCode || '',
        isVerified: c.isVerified || false,
        isActive: c.isActive || false,
        totalBookings: parseInt(c.totalBookings || '0', 10),
        totalSpent: parseFloat(c.totalSpent || '0'),
        lastBooking: c.lastBooking ? new Date(c.lastBooking) : undefined,
        registrationDate: new Date(c.registrationDate),
        status: c.status || 'pending_verification',
      })) as Customer[];

      const totalCount = customers.length > 0 && (customers[0] as any).totalCount
        ? (customers[0] as any).totalCount
        : customers.length < pageSize
          ? (page - 1) * pageSize + customers.length
          : page * pageSize + 1;

      return { customers, totalCount };
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}


