/**
 * Debug endpoint to check payment records
 * Development only
 */
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get all payments for this booking
    const { data: payments, error } = await supabase
      .from('payments')
      .select('id, bookingId, amount, currency, status, type, stripePaymentIntentId, created_at')
      .eq('bookingId', bookingId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      bookingId,
      count: payments?.length || 0,
      payments: payments || [],
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
