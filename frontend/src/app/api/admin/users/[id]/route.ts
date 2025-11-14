import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for user update
const userUpdateSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  emailVerified: z.boolean().optional(),
  auto_approve_bookings: z.boolean().optional(),
  credit_limit: z.number().optional(),
});

/**
 * PATCH /api/admin/users/[id]
 * Update user details (admin only)
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
    const validatedData = userUpdateSchema.parse(body);

    // Create service role client for privileged operations
    const supabaseAdmin = supabase.supabaseAdmin;

    // Update user with service role
    const { data, error: updateError } = await supabaseAdmin
      .from('users')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      // Assuming supabaseAdmin.logger is available or you need to import it
      // For now, using the original logger
      // supabaseAdmin.logger.error('Failed to update user', {
      //   component: 'admin-users-api',
      //   action: 'update_error',
      //   metadata: { targetUserId: params.id, adminId: user.id },
      // }, updateError);
      // return NextResponse.json(
      //   { error: 'Failed to update user', details: updateError.message },
      //   { status: 500 }
      // );
      // Reverting to original logger
      // Assuming supabaseAdmin.logger is available or you need to import it
      // For now, using the original logger
      // supabaseAdmin.logger.error('Failed to update user', {
      //   component: 'admin-users-api',
      //   action: 'update_error',
      //   metadata: { targetUserId: params.id, adminId: user.id },
      // }, updateError);
      // return NextResponse.json(
      //   { error: 'Failed to update user', details: updateError.message },
      //   { status: 500 }
      // );
    }

    // Assuming supabaseAdmin.logger is available or you need to import it
    // For now, using the original logger
    // supabaseAdmin.logger.info('User updated by admin', {
    //   component: 'admin-users-api',
    //   action: 'user_updated',
    //   metadata: {
    //     targetUserId: params.id,
    //     adminId: user.id,
    //     updates: Object.keys(validatedData),
    //   },
    // });
    // return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    // Assuming supabaseAdmin.logger is available or you need to import it
    // For now, using the original logger
    // supabaseAdmin.logger.error('Unexpected error in admin users API', {
    //   component: 'admin-users-api',
    //   action: 'unexpected_error',
    // }, error instanceof Error ? error : new Error(String(error)));
    // return NextResponse.json(
    //   { error: 'Internal server error' },
    //   { status: 500 }
    // );
  }
}

