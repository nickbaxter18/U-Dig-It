import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for user update
const userUpdateSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  emailVerified: z.boolean().optional(),
  auto_approve_bookings: z.boolean().optional(),
  credit_limit: z.number().optional(),
  role: z.enum(['admin', 'super_admin']).optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
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
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    const { supabase } = adminResult;
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    const requesterRole = adminResult.role;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = userUpdateSchema.parse(body);

    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: 'At least one field must be provided' },
        { status: 400 }
      );
    }

    if (validatedData.role && requesterRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can change user roles' },
        { status: 403 }
      );
    }

    if (validatedData.status && requesterRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can change account status' },
        { status: 403 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (validatedData.status !== undefined) {
      updates.status = validatedData.status;
    }

    if (validatedData.role !== undefined) {
      updates.role = validatedData.role;
    }

    if (validatedData.emailVerified !== undefined) {
      updates.emailVerified = validatedData.emailVerified;
    }

    if (validatedData.auto_approve_bookings !== undefined) {
      updates.auto_approve_bookings = validatedData.auto_approve_bookings;
    }

    if (validatedData.credit_limit !== undefined) {
      updates.credit_limit = validatedData.credit_limit;
    }

    if (validatedData.firstName !== undefined) {
      updates.firstName = validatedData.firstName.trim();
    }

    if (validatedData.lastName !== undefined) {
      updates.lastName = validatedData.lastName.trim();
    }

    const { data, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', params.id)
      .select('id, email, firstName, lastName, role, status, emailVerified, auto_approve_bookings, credit_limit')
      .single();

    if (updateError) {
      logger.error(
        'Failed to update admin user',
        {
          component: 'admin-users-api',
          action: 'update_admin_user',
          metadata: { targetUserId: params.id, adminId: user?.id || 'unknown' },
        },
        updateError
      );

      return NextResponse.json(
        { error: 'Failed to update user', details: updateError.message },
        { status: 500 }
      );
    }

    logger.info('Admin user updated successfully', {
      component: 'admin-users-api',
      action: 'update_admin_user',
      metadata: {
        targetUserId: params.id,
        adminId: user?.id || 'unknown',
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

    logger.error(
      'Unexpected error updating admin user',
      { component: 'admin-users-api', action: 'update_admin_user' },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
