import { z, ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

// Schema for booking update
// Note: Some fields require business logic validation (e.g., can't change dates if booking is active)
const bookingUpdateSchema = z.object({
  // Status and cancellation
  status: z.string().optional(),
  cancelledAt: z.string().nullable().optional(),
  cancellationReason: z.string().nullable().optional(),

  // Actual dates (for active/completed bookings)
  actualStartDate: z.string().nullable().optional(),
  actualEndDate: z.string().nullable().optional(),

  // Scheduled dates (with validation - can't change if booking is active)
  startDate: z.string().optional(),
  endDate: z.string().optional(),

  // Delivery information
  deliveryAddress: z.string().nullable().optional(),
  deliveryCity: z.string().nullable().optional(),
  deliveryProvince: z.string().nullable().optional(),
  deliveryPostalCode: z.string().nullable().optional(),
  deliveryFee: z.number().optional(),

  // Instructions and notes
  specialInstructions: z.string().nullable().optional(),
  internalNotes: z.string().optional(),

  // Discounts
  couponCode: z.string().nullable().optional(),

  // Financial fields (admin adjustments)
  depositAmount: z.number().nullable().optional(),
  balanceAmount: z.number().nullable().optional(),
  balanceDueAt: z.string().nullable().optional(),
  billingStatus: z.string().nullable().optional(),
  financeNotes: z.string().nullable().optional(),
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
      const supabaseAdmin = await createServiceClient();

      // Business logic validation: Can't change scheduled dates if booking is active/completed
      if (validatedData.startDate || validatedData.endDate) {
        const { data: currentBooking } = await supabaseAdmin
          .from('bookings')
          .select('status, actualStartDate')
          .eq('id', params.id)
          .single();

        if (currentBooking) {
          const activeStatuses = ['active', 'in_progress', 'delivered', 'completed'];
          if (activeStatuses.includes(currentBooking.status) || currentBooking.actualStartDate) {
            return NextResponse.json(
              {
                error: 'Cannot change scheduled dates for active or completed bookings',
                details: 'Use actualStartDate/actualEndDate to track actual rental dates',
              },
              { status: 400 }
            );
          }
        }
      }

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
