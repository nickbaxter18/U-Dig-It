import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { Database, Tables } from '../../../supabase/types';

// Generic hook for Supabase queries
export function useSupabaseQuery<T>(
  table: keyof Database['public']['Tables'],
  query: any,
  options?: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options?.enabled) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from(table)
          .select(query.select || '*')
          .eq(query.eq?.key, query.eq?.value)
          .limit(query.limit || 100);

        if (error) throw error;
        setData(data as T);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, JSON.stringify(query), options?.enabled]);

  return { data, loading, error, refetch: () => window.location.reload() };
}

// Equipment hooks
export function useEquipment(id?: string) {
  return useSupabaseQuery<Tables<'equipment'>>(
    'equipment',
    id ? { select: '*', eq: { key: 'id', value: id } } : { select: '*' },
    { enabled: true }
  );
}

export function useBookings(userId?: string) {
  return useSupabaseQuery<Tables<'bookings'>[]>(
    'bookings',
    {
      select: `
        *,
        equipment:equipment_id (
          id, model, make, year, dailyRate, images
        ),
        customer:customerId (
          id, firstName, lastName, email
        )
      `,
      eq: userId ? { key: 'customerId', value: userId } : undefined,
    },
    { enabled: true }
  );
}

export function useUserBookings() {
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Tables<'bookings'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      setLoading(false);
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(
            `
            *,
            equipment:equipment_id (
              id, model, make, year, dailyRate, images
            )
          `
          )
          .eq('customerId', userId)
          .order('createdAt', { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    fetchBookings();
  }, [userId]);

  return { bookings, loading, error };
}

// Real-time hooks
export function useRealtimeSubscription<T>(
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter,
        },
        callback || (() => {})
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, callback]);
}

// Live availability hook
export function useLiveAvailability(equipmentId: string) {
  const [availability, setAvailability] = useState<any>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`equipment_availability_${equipmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability_blocks',
          filter: `equipment_id=eq.${equipmentId}`,
        },
        payload => {
          setAvailability(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `equipmentId=eq.${equipmentId}`,
        },
        payload => {
          setAvailability(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [equipmentId]);

  return availability;
}

// Live booking status hook
export function useLiveBookingStatus(bookingId: string) {
  const [booking, setBooking] = useState<Tables<'bookings'> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`booking_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        payload => {
          setBooking(payload.new as Tables<'bookings'>);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  return booking;
}
