import { z } from 'zod';
import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

// Schema for booking update
const bookingUpdateSchema = z.object({
  status: z.string().optional(),
  actualStartDate: z.string().nullable().optional(),
  actualEndDate: z.string().nullable().optional(),
  internalNotes: z.string().optional(),
  cancelledAt: z.string().nullable().optional(),
  cancellationReason: z.string().nullable().optional(),
});

/**
 * PATCH /api/admin/bookings/[id]
 * Update booking details (admin only)
 */
export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      // Parse and validate request body
      const body = await request.json();
      const validatedData = bookingUpdateSchema.parse(body);

      // Create service role client for privileged operations
      const supabaseAdmin = createServiceClient();

      // Update booking with service role
      const { data, error: updateError } = await supabaseAdmin
        .from('bookings')
        .update(validatedData)
        .eq('id', params.id)
        .select()
        .single();

      if (updateError) {
        logger.error(
          'Failed to update booking',
          {
            component: 'admin-bookings-api',
            action: 'update_error',
            metadata: { bookingId: params.id, adminId: user?.id || 'unknown' },
          },
          updateError
        );
        return NextResponse.json(
          { error: 'Failed to update booking', details: updateError.message },
          { status: 500 }
        );
      }

      logger.info('Booking updated by admin', {
        component: 'admin-bookings-api',
        action: 'booking_updated',
        metadata: {
          bookingId: params.id,
          adminId: user?.id || 'unknown',
          updates: Object.keys(validatedData),
        },
      });

      return NextResponse.json({ data });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error in admin bookings API',
        {
          component: 'admin-bookings-api',
          action: 'unexpected_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
