import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

// Schema for booking update
const bookingUpdateSchema = z.object({
  status: z.string().optional(),
  actualStartDate: z.string().nullable().optional(),
  actualEndDate: z.string().nullable().optional(),
  internalNotes: z.string().optional(),
});

/**
 * PATCH /api/admin/bookings/[id]
 * Update booking details (admin only)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging

    const {
      data: { user: _user },
    } = await supabase.auth.getUser();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bookingUpdateSchema.parse(body);

    // Create service role client for privileged operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);

    // Update booking with service role
    const { data, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      // Assuming logger is available globally or imported elsewhere
      // logger.error('Failed to update booking', {
      //   component: 'admin-bookings-api',
      //   action: 'update_error',
      //   metadata: { bookingId: params.id, adminId: user?.id || 'unknown' },
      // }, updateError);
      return NextResponse.json(
        { error: 'Failed to update booking', details: updateError.message },
        { status: 500 }
      );
    }

    // Assuming logger is available globally or imported elsewhere
    // logger.info('Booking updated by admin', {
    //   component: 'admin-bookings-api',
    //   action: 'booking_updated',
    //   metadata: {
    //     bookingId: params.id,
    //     adminId: user?.id || 'unknown',
    //     updates: Object.keys(validatedData),
    //   },
    // });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    // Assuming logger is available globally or imported elsewhere
    // logger.error('Unexpected error in admin bookings API', {
    //   component: 'admin-bookings-api',
    //   action: 'unexpected_error',
    // }, error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
