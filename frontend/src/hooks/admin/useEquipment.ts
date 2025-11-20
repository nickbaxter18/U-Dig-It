import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

interface UseEquipmentParams {
  statusFilter?: string;
  searchTerm?: string;
}

export function useEquipment({ statusFilter = 'all', searchTerm = '' }: UseEquipmentParams = {}) {
  return useQuery({
    queryKey: ['admin', 'equipment', statusFilter, searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_equipment_with_stats');

      if (error) {
        // Fallback to manual query
        let query = supabase.from('equipment').select('*');
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        if (searchTerm) {
          query = query.or(
            `make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,unitId.ilike.%${searchTerm}%,serialNumber.ilike.%${searchTerm}%`
          );
        }
        const { data: fallbackData, error: fallbackError } = await query.order('createdAt', {
          ascending: false,
        });
        if (fallbackError) throw fallbackError;

        // Get stats for each equipment
        const equipmentWithStats = await Promise.all(
          ((fallbackData || []) as unknown[]).map(async (eq: unknown) => {
            const { data: bookingData } = await supabase
              .from('bookings')
              .select('totalAmount, status')
              .eq('equipmentId', eq.id);

            const totalBookings = (bookingData as unknown[])?.length || 0;
            const totalRevenue =
              (bookingData as unknown[])?.reduce(
                (sum: number, b: unknown) => sum + parseFloat(b.totalAmount || '0'),
                0
              ) || 0;
            const activeBookings =
              (bookingData as unknown[])?.filter((b: unknown) =>
                ['confirmed', 'paid', 'in_progress'].includes(b.status)
              ).length || 0;
            const utilizationRate = totalBookings > 0 ? (activeBookings / totalBookings) * 100 : 0;

            return {
              id: eq.id,
              name: `${eq.make} ${eq.model}`,
              model: eq.model,
              serialNumber: eq.serialNumber,
              status: (eq.status || 'available').toLowerCase(),
              location: eq.location || 'Main Yard',
              dailyRate: parseFloat(eq.dailyRate),
              weeklyRate: parseFloat(eq.weeklyRate),
              monthlyRate: parseFloat(eq.monthlyRate),
              isAvailable: (eq.status || 'available').toLowerCase() === 'available',
              maintenanceDue: eq.nextMaintenanceDue ? new Date(eq.nextMaintenanceDue) : undefined,
              lastMaintenance: eq.lastMaintenanceDate
                ? new Date(eq.lastMaintenanceDate)
                : undefined,
              totalBookings,
              totalRevenue,
              utilizationRate,
              unitId: eq.unitId,
              make: eq.make,
              year: eq.year || new Date().getFullYear(),
              specifications: eq.specifications || {},
            };
          })
        );

        return equipmentWithStats;
      }

      // Transform RPC function results
      let filteredEquipment = ((data || []) as unknown[]).map((eq: unknown) => ({
        id: eq.id,
        name: `${eq.make || ''} ${eq.model || ''}`.trim() || 'Equipment',
        model: eq.model || '',
        serialNumber: eq.serialNumber || '',
        status: (eq.status || 'available').toLowerCase(),
        location: eq.location || 'Main Yard',
        dailyRate: parseFloat(eq.dailyRate || '0'),
        weeklyRate: parseFloat(eq.weeklyRate || '0'),
        monthlyRate: parseFloat(eq.monthlyRate || '0'),
        isAvailable: (eq.status || 'available').toLowerCase() === 'available',
        maintenanceDue: eq.nextMaintenanceDue ? new Date(eq.nextMaintenanceDue) : undefined,
        lastMaintenance: eq.lastBookingDate ? new Date(eq.lastBookingDate) : undefined,
        totalBookings: parseInt(eq.totalBookings || '0', 10),
        totalRevenue: parseFloat(eq.totalRevenue || '0'),
        utilizationRate: parseFloat(eq.utilizationRate || '0'),
        unitId: eq.unitId || '',
        make: eq.make || '',
        year: new Date().getFullYear(),
        specifications: {},
      }));

      // Apply client-side filters
      if (statusFilter !== 'all') {
        filteredEquipment = filteredEquipment.filter((eq) => eq.status === statusFilter);
      }
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredEquipment = filteredEquipment.filter(
          (eq) =>
            eq.make?.toLowerCase().includes(searchLower) ||
            eq.model?.toLowerCase().includes(searchLower) ||
            eq.unitId?.toLowerCase().includes(searchLower) ||
            eq.serialNumber?.toLowerCase().includes(searchLower)
        );
      }

      return filteredEquipment;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
