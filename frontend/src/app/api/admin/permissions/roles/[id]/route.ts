/**
 * PATCH /api/admin/permissions/roles/[id]
 * Update a role
 */
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { logPermissionChange } from '@/lib/permissions/audit';
import { checkPermission } from '@/lib/permissions/middleware';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string().uuid()).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const roleId = params.id;

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!roleId || !uuidRegex.test(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
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

    // Get current role
    const { data: currentRole, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (fetchError || !currentRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Prevent editing system roles
    if (currentRole.is_system) {
      return NextResponse.json({ error: 'System roles cannot be modified' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateRoleSchema.parse(body);

    // Update role
    const updates: any = {};
    if (validated.name) updates.name = validated.name;
    if (validated.displayName) updates.display_name = validated.displayName;
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.isActive !== undefined) updates.is_active = validated.isActive;

    const { data: updatedRole, error: updateError } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', roleId)
      .select('*')
      .single();

    if (updateError) {
      logger.error('Failed to update role', {
        component: 'admin-permissions-api',
        action: 'update_role',
      });
      return NextResponse.json(
        { error: 'Failed to update role', details: updateError.message },
        { status: 500 }
      );
    }

    // Update permissions if provided
    if (validated.permissions !== undefined) {
      // Get current permissions
      const { data: currentPerms } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

      const currentPermissionIds = (currentPerms || []).map((p) => p.permission_id);
      const newPermissionIds = validated.permissions;

      // Remove permissions that are no longer assigned
      const toRemove = currentPermissionIds.filter((id) => !newPermissionIds.includes(id));
      if (toRemove.length > 0) {
        await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)
          .in('permission_id', toRemove);
      }

      // Add new permissions
      const toAdd = newPermissionIds.filter((id) => !currentPermissionIds.includes(id));
      if (toAdd.length > 0) {
        const rolePermissions = toAdd.map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
          granted_by: user.id,
        }));

        await supabase.from('role_permissions').insert(rolePermissions);
      }
    }

    // Log audit
    await logPermissionChange({
      action: 'role_updated',
      targetType: 'role',
      targetId: roleId,
      roleId: roleId,
      performedBy: user.id,
      oldValue: {
        name: currentRole.name,
        displayName: currentRole.display_name,
        isActive: currentRole.is_active,
      },
      newValue: {
        name: updatedRole.name,
        displayName: updatedRole.display_name,
        isActive: updatedRole.is_active,
      },
    });

    logger.info('Role updated successfully', {
      component: 'admin-permissions-api',
      action: 'update_role',
      metadata: { roleId },
    });

    return NextResponse.json({
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        displayName: updatedRole.display_name,
        description: updatedRole.description,
        isSystem: updatedRole.is_system,
        isActive: updatedRole.is_active,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Unexpected error updating role', {
      component: 'admin-permissions-api',
      action: 'update_role',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
