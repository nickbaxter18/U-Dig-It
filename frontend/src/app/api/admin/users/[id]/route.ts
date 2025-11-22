import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { logPermissionChange } from '@/lib/permissions/audit';
import { checkPermission } from '@/lib/permissions/middleware';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

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
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  // Rate limit FIRST - strict for user management
  const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    // Handle Next.js 15 async params
    const params = await Promise.resolve(context.params);

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const targetUserId = params.id;

    if (!targetUserId || targetUserId === 'undefined' || !uuidRegex.test(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID', details: 'User ID must be a valid UUID' },
        { status: 400 }
      );
    }

    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    const { supabase, user: requesterUser, role: requesterRole } = adminResult;
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!requesterUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!requesterRole) {
      logger.error('Requester role not found', {
        component: 'admin-users-api',
        action: 'update_admin_user',
        metadata: { userId: requesterUser.id },
      });
      return NextResponse.json({ error: 'Unable to determine user role' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = userUpdateSchema.parse(body);

    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json({ error: 'At least one field must be provided' }, { status: 400 });
    }

    // Prevent self-demotion (security risk)
    if (requesterUser.id === targetUserId) {
      if (validatedData.role && validatedData.role !== requesterRole) {
        return NextResponse.json(
          {
            error: 'You cannot change your own role',
            details:
              'Changing your own role could lock you out of the system. Ask another super admin to make this change.',
          },
          { status: 403 }
        );
      }

      if (validatedData.status && validatedData.status !== 'active') {
        return NextResponse.json(
          {
            error: 'You cannot deactivate your own account',
            details:
              'Deactivating your own account could lock you out. Ask another super admin to make this change.',
          },
          { status: 403 }
        );
      }
    }

    // Get current user data for validation
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('id', targetUserId)
      .single();

    if (fetchError || !currentUser) {
      logger.error(
        'Failed to fetch user for update',
        {
          component: 'admin-users-api',
          action: 'update_admin_user',
          metadata: { targetUserId, error: fetchError?.message },
        },
        fetchError
      );
      return NextResponse.json(
        { error: 'User not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    // Validate role transitions - check permission
    if (validatedData.role) {
      logger.info('Role change requested', {
        component: 'admin-users-api',
        action: 'update_admin_user',
        metadata: {
          requesterId: requesterUser.id,
          requesterRole,
          targetUserId,
          currentRole: currentUser.role,
          newRole: validatedData.role,
        },
      });

      // Check permission for role updates
      const roleUpdatePermission = await checkPermission(request, 'admin_users:update:all');
      if (!roleUpdatePermission.hasAccess || requesterRole !== 'super_admin') {
        logger.warn('Role change denied - insufficient privileges', {
          component: 'admin-users-api',
          action: 'update_admin_user',
          metadata: {
            requesterId: requesterUser.id,
            requesterRole,
            requiredRole: 'super_admin',
          },
        });
        return NextResponse.json(
          { error: 'Only super admins can change user roles' },
          { status: 403 }
        );
      }

      // Prevent downgrading from super_admin to admin if it's the last super_admin
      if (currentUser.role === 'super_admin' && validatedData.role === 'admin') {
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'super_admin')
          .eq('status', 'active');

        if (count === 1) {
          return NextResponse.json(
            {
              error: 'Cannot downgrade last super admin',
              details:
                'At least one active super admin is required. Promote another user to super admin first.',
            },
            { status: 400 }
          );
        }
      }
    }

    // Check permission for status updates
    if (validatedData.status) {
      const statusUpdatePermission = await checkPermission(request, 'admin_users:update:all');
      if (!statusUpdatePermission.hasAccess || requesterRole !== 'super_admin') {
        logger.warn('Status change denied - insufficient privileges', {
          component: 'admin-users-api',
          action: 'update_admin_user',
          metadata: {
            requesterId: requesterUser.id,
            requesterRole,
            requiredRole: 'super_admin',
          },
        });
        return NextResponse.json(
          { error: 'Only super admins can change account status' },
          { status: 403 }
        );
      }
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
      .eq('id', targetUserId)
      .select(
        'id, email, firstName, lastName, role, status, emailVerified, auto_approve_bookings, credit_limit'
      )
      .single();

    if (updateError) {
      logger.error(
        'Failed to update admin user',
        {
          component: 'admin-users-api',
          action: 'update_admin_user',
          metadata: {
            targetUserId,
            adminId: requesterUser.id,
            updates: Object.keys(updates),
            errorCode: updateError.code,
            errorMessage: updateError.message,
            currentRole: currentUser.role,
            targetRole: validatedData.role,
          },
        },
        updateError
      );

      // Provide more specific error messages
      if (updateError.code === 'PGRST116' || updateError.message?.includes('permission denied')) {
        return NextResponse.json(
          {
            error: 'Permission denied. Unable to update user.',
            details:
              'The update was blocked by database security policies. Please check RLS policies.',
          },
          { status: 403 }
        );
      }

      if (updateError.message?.includes('violates check constraint')) {
        return NextResponse.json(
          {
            error: 'Invalid value provided',
            details: 'One or more values violate database constraints. Please check your input.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to update user',
          details: updateError.message || 'Database update failed',
        },
        { status: 500 }
      );
    }

    if (!data) {
      logger.error('Update succeeded but no data returned', {
        component: 'admin-users-api',
        action: 'update_admin_user',
        metadata: { targetUserId, adminId: requesterUser.id },
      });
      return NextResponse.json(
        { error: 'Update completed but user data not returned' },
        { status: 500 }
      );
    }

    // Log permission changes to audit log
    if (validatedData.role && validatedData.role !== currentUser.role) {
      await logPermissionChange({
        action: 'role_updated',
        targetType: 'user',
        targetId: targetUserId,
        userId: targetUserId,
        performedBy: requesterUser.id,
        oldValue: { role: currentUser.role },
        newValue: { role: data.role },
        metadata: { requesterRole },
      });
    }

    if (validatedData.status && validatedData.status !== currentUser.status) {
      await logPermissionChange({
        action: 'role_updated',
        targetType: 'user',
        targetId: targetUserId,
        userId: targetUserId,
        performedBy: requesterUser.id,
        oldValue: { status: currentUser.status },
        newValue: { status: data.status },
        metadata: { requesterRole },
      });
    }

    logger.info('Admin user updated successfully', {
      component: 'admin-users-api',
      action: 'update_admin_user',
      metadata: {
        targetUserId,
        adminId: requesterUser.id,
        updates: Object.keys(validatedData),
        previousRole: currentUser.role,
        newRole: data.role,
        previousStatus: currentUser.status,
        newStatus: data.status,
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

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
