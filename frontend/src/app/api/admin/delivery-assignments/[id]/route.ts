import { z } from 'zod';
import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

// Schema for delivery assignment update
const deliveryAssignmentUpdateSchema = z.object({
  status: z.string().optional(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  notes: z.string().optional(),
});

/**
 * PATCH /api/admin/delivery-assignments/[id]
 * Update delivery assignment details (admin only)
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
    const { user } = adminResult;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = deliveryAssignmentUpdateSchema.parse(body);

    // Create service role client for privileged operations
    const supabaseAdmin = await createServiceClient();

    // Update delivery assignment with service role
    const { data, error: updateError } = await supabaseAdmin
      .from('delivery_assignments')
      .update(validatedData)
      .eq('booking_id', params.id)
      .select()
      .single();

    if (updateError) {
      logger.error(
        'Failed to update delivery assignment',
        {
          component: 'admin-delivery-assignments-api',
          action: 'update_error',
          metadata: { bookingId: params.id, adminId: user?.id || 'unknown' },
        },
        updateError
      );
      return NextResponse.json(
        { error: 'Failed to update delivery assignment', details: updateError.message },
        { status: 500 }
      );
    }

    logger.info('Delivery assignment updated by admin', {
      component: 'admin-delivery-assignments-api',
      action: 'delivery_assignment_updated',
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
      'Unexpected error in admin delivery assignments API',
      {
        component: 'admin-delivery-assignments-api',
        action: 'unexpected_error',
      },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
