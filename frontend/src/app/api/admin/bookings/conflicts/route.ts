import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { bookingConflictRequestSchema } from '@/lib/validators/admin/bookings';

const ACTIVE_BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'paid',
  'insurance_verified',
  'ready_for_pickup',
  'delivered',
  'in_progress',
  'verify_hold_ok',
  'deposit_scheduled',
  'hold_placed',
  'captured',
];

function hasOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const startTimeA = new Date(startA).getTime();
  const endTimeA = new Date(endA).getTime();
  const startTimeB = new Date(startB).getTime();
  const endTimeB = new Date(endB).getTime();

  if ([startTimeA, endTimeA, startTimeB, endTimeB].some(time => Number.isNaN(time))) {
    return false;
  }

  return startTimeA <= endTimeB && startTimeB <= endTimeA;
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const body = await request.json();
    const data = bookingConflictRequestSchema.parse(body);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        bookingNumber,
        customerId,
        equipmentId,
        startDate,
        endDate,
        status,
        totalAmount
      `
      )
      .eq('equipmentId', data.equipmentId)
      .in('status', ACTIVE_BOOKING_STATUSES)
      .order('startDate', { ascending: true });

    if (bookingsError) {
      logger.error(
        'Failed to fetch bookings for conflict detection',
        { component: 'admin-bookings-conflicts', action: 'fetch_failed', metadata: { equipmentId: data.equipmentId } },
        bookingsError
      );
      return NextResponse.json(
        { error: 'Unable to evaluate booking conflicts' },
        { status: 500 }
      );
    }

    const conflicts =
      bookings
        ?.filter(booking => {
          if (data.excludeBookingId && booking.id === data.excludeBookingId) {
            return false;
          }
          return hasOverlap(
            data.startDate,
            data.endDate,
            booking.startDate,
            booking.endDate
          );
        })
        .map(booking => ({
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          customerId: booking.customerId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalAmount: booking.totalAmount,
        })) ?? [];

    return NextResponse.json({
      conflicts,
      hasConflicts: conflicts.length > 0,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error detecting booking conflicts',
      { component: 'admin-bookings-conflicts', action: 'unexpected_error' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json(
      { error: 'Internal server error while checking booking conflicts' },
      { status: 500 }
    );
  }
}


