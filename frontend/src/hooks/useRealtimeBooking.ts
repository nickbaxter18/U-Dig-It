/**
 * Realtime Booking Hook
 *
 * Subscribes to real-time updates for booking status changes
 */

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

import type { Database } from '@/../../supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];

interface UseRealtimeBookingOptions {
  bookingId?: string;
  customerId?: string;
  onUpdate?: (booking: Booking) => void;
  onStatusChange?: (oldStatus: string, newStatus: string, booking: Booking) => void;
}

interface UseRealtimeBookingReturn {
  booking: Booking | null;
  loading: boolean;
  error: string | null;
}

export function useRealtimeBooking(
  options: UseRealtimeBookingOptions = {}
): UseRealtimeBookingReturn {
  const { bookingId, customerId, onUpdate, onStatusChange } = options;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!bookingId && !customerId) {
      setLoading(false);
      return;
    }

    // Fetch initial booking data
    const fetchBooking = async () => {
      try {
        let query = supabase.from('bookings').select('*');

        if (bookingId) {
          query = query.eq('id', bookingId).single();
        } else if (customerId) {
          query = query.eq('customerId', customerId).order('createdAt', { ascending: false }).limit(1).single();
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        if (data) {
          setBooking(data);
          setLoading(false);
        }
      } catch (err) {
        logger.error(
          'Failed to fetch booking for realtime subscription',
          {
            component: 'useRealtimeBooking',
            action: 'fetch_error',
            metadata: { bookingId, customerId },
          },
          err instanceof Error ? err : undefined
        );
        setError(err instanceof Error ? err.message : 'Failed to fetch booking');
        setLoading(false);
      }
    };

    fetchBooking();

    // Set up Realtime subscription
    const channel = supabase
      .channel(`booking-${bookingId || customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: bookingId ? `id=eq.${bookingId}` : customerId ? `customerId=eq.${customerId}` : undefined,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newBooking = payload.new as Booking;
            const oldBooking = payload.old as Booking | null;

            // Check for status change
            if (oldBooking && oldBooking.status !== newBooking.status && onStatusChange) {
              onStatusChange(oldBooking.status, newBooking.status, newBooking);
            }

            setBooking(newBooking);
            if (onUpdate) {
              onUpdate(newBooking);
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const newBooking = payload.new as Booking;
            setBooking(newBooking);
            if (onUpdate) {
              onUpdate(newBooking);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, customerId, onUpdate, onStatusChange, supabase]);

  return { booking, loading, error };
}


