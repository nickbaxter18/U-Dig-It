import { NextRequest, NextResponse } from 'next/server';

import { recalculateBookingBalance } from '@/lib/booking/balance';
import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/bookings/[id]/recalculate-balance
 * Recalculates the balance_amount for a booking based on all completed payments
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const bookingId = params.id;

  if (!bookingId) {
    return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
  }

  try {
    const newBalance = await recalculateBookingBalance(bookingId);

    if (newBalance === null) {
      logger.error('Balance recalculation failed', {
        component: 'admin-recalculate-balance-api',
        action: 'recalculation_failed',
        metadata: { bookingId, adminId: user.id },
      });
      return NextResponse.json({ error: 'Failed to recalculate balance' }, { status: 500 });
    }

    logger.info('Balance recalculated via API', {
      component: 'admin-recalculate-balance-api',
      action: 'balance_recalculated',
      metadata: { bookingId, newBalance, adminId: user.id },
    });

    return NextResponse.json({
      success: true,
      balance: newBalance,
    });
  } catch (error) {
    logger.error(
      'Unexpected error recalculating balance',
      {
        component: 'admin-recalculate-balance-api',
        action: 'recalculation_error',
        metadata: { bookingId, adminId: user.id },
      },
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
