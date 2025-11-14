/**
 * Generate Contract API
 * Creates a new contract for a booking
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user owns this booking or is admin
    const isAdmin =
      user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin';
    if (booking.customerId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized access to booking' }, { status: 403 });
    }

    // Call helper function to generate contract
    const { data, error } = await supabase.rpc('generate_rental_contract', {
      p_booking_id: bookingId,
    });

    if (error) {
      logger.error('Contract generation error', {
        component: 'api-generate',
        action: 'error',
        metadata: { error: error.message },
      }, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      contractId: data,
    });
  } catch (error: any) {
    logger.error('Contract generation error', {
      component: 'api-generate',
      action: 'error',
      metadata: { error: error.message },
    }, error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate contract',
      },
      { status: 500 }
    );
  }
}
