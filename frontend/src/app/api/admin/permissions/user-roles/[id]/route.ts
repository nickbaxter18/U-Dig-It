/**
 * DELETE /api/admin/permissions/user-roles/[id]
 * Remove a role assignment from a user
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { logPermissionChange } from '@/lib/permissions/audit';
import { checkPermission } from '@/lib/permissions/middleware';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const userRoleId = params.id;

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userRoleId || !uuidRegex.test(userRoleId)) {
      return NextResponse.json({ error: 'Invalid user role ID' }, { status: 400 });
    }

    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    // Check permission
    const permissionResult = await checkPermission(request, 'admin_users:update:all');
    if (!permissionResult.hasAccess) {
      return permissionResult.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { supabase, user } = adminResult;
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role details before deletion
    const { data: userRole, error: fetchError } = await supabase
      .from('user_roles')
      .select(
        `
        *,
        role:roles (
          id,
          name,
          display_name
        )
      `
      )
      .eq('id', userRoleId)
      .single();

    if (fetchError || !userRole) {
      return NextResponse.json({ error: 'User role assignment not found' }, { status: 404 });
    }

    // Delete user role
    const { error: deleteError } = await supabase.from('user_roles').delete().eq('id', userRoleId);

    if (deleteError) {
      logger.error('Failed to remove role assignment', {
        component: 'admin-permissions-api',
        action: 'remove_role',
      });
      return NextResponse.json(
        { error: 'Failed to remove role assignment', details: deleteError.message },
        { status: 500 }
      );
    }

    // Rebuild permission cache for the user
    await supabase.rpc('rebuild_user_permission_cache', {
      p_user_id: userRole.user_id,
    });

    // Log audit
    await logPermissionChange({
      action: 'role_removed',
      targetType: 'user',
      targetId: userRole.user_id,
      roleId: userRole.role_id,
      performedBy: user.id,
      oldValue: {
        roleId: (userRole.role as any)?.id,
        roleName: (userRole.role as any)?.name,
      },
    });

    logger.info('Role assignment removed successfully', {
      component: 'admin-permissions-api',
      action: 'remove_role',
      metadata: { userRoleId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error('Unexpected error removing role assignment', {
      component: 'admin-permissions-api',
      action: 'remove_role',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
