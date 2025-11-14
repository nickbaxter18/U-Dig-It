import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = deliveryAssignmentUpdateSchema.parse(body);

    // Create service role client for privileged operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);

    // Update delivery assignment with service role
    const { data, error } = await supabaseAdmin
      .from('delivery_assignments')
      .update(validatedData)
      .eq('booking_id', params.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update delivery assignment', {
        component: 'admin-delivery-assignments-api',
        action: 'update_error',
        metadata: { bookingId: params.id, adminId: user.id },
      }, error);
      return NextResponse.json(
        { error: 'Failed to update delivery assignment', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Delivery assignment updated by admin', {
      component: 'admin-delivery-assignments-api',
      action: 'delivery_assignment_updated',
      metadata: {
        bookingId: params.id,
        adminId: user.id,
        updates: Object.keys(validatedData),
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Unexpected error in admin delivery assignments API', {
      component: 'admin-delivery-assignments-api',
      action: 'unexpected_error',
    }, error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

