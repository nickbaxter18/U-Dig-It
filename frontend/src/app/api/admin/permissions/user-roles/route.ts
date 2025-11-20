/**
 * GET /api/admin/permissions/user-roles
 * Get all user role assignments
 *
 * POST /api/admin/permissions/user-roles
 * Assign a role to a user
 */
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { logPermissionChange } from '@/lib/permissions/audit';
import { checkPermission } from '@/lib/permissions/middleware';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    const { supabase } = adminResult;
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, check if user_roles table exists (before permission checks)
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1);

    if (userRolesError) {
      logger.error('Failed to fetch user roles', {
        component: 'admin-permissions-api',
        action: 'get_user_roles',
        metadata: { error: userRolesError },
      });

      // Check if table doesn't exist (PostgreSQL error code 42P01)
      const errorCode = (userRolesError as any)?.code;
      const errorMessage = userRolesError.message || '';

      // Check for various "table doesn't exist" error patterns
      const isTableMissing =
        errorCode === '42P01' || // Undefined table
        errorCode === 'P0001' || // Undefined table (alternative)
        errorMessage.includes('does not exist') ||
        (errorMessage.includes('relation') && errorMessage.includes('user_roles')) ||
        (errorMessage.includes('permission denied') && errorMessage.includes('user_roles'));

      if (isTableMissing) {
        return NextResponse.json(
          {
            error: 'Permission system not initialized',
            code: 'MIGRATION_REQUIRED',
            details:
              'The user_roles table does not exist. Please apply the database migrations to initialize the permission system.',
            migrationFiles: [
              '20250123000001_enterprise_permission_system.sql',
              '20250123000002_seed_permissions_and_roles.sql',
              '20250123000003_rls_permission_integration.sql',
            ],
          },
          { status: 503 }
        );
      }

      // Check if it's an RLS/permission denied error
      if (
        errorCode === '42501' ||
        errorMessage.includes('permission denied') ||
        errorMessage.includes('row-level security')
      ) {
        logger.warn('RLS blocking user_roles query - service role key may be missing', {
          component: 'admin-permissions-api',
          action: 'get_user_roles',
        });
        return NextResponse.json(
          {
            error: 'Permission system access denied',
            code: 'RLS_BLOCKED',
            details:
              'Unable to access user_roles table. This may be due to missing SUPABASE_SERVICE_ROLE_KEY or RLS policies blocking access. Please ensure the service role key is configured and migrations are applied.',
            migrationFiles: [
              '20250123000001_enterprise_permission_system.sql',
              '20250123000002_seed_permissions_and_roles.sql',
              '20250123000003_rls_permission_integration.sql',
            ],
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to fetch user roles',
          code: 'INTERNAL_ERROR',
          details: userRolesError.message,
          errorCode: errorCode,
        },
        { status: 500 }
      );
    }

    // If table exists, now check permissions (system is initialized)
    const permissionResult = await checkPermission(request, 'admin_users:read:all');
    if (!permissionResult.hasAccess) {
      // If permission check fails due to missing functions, return migration required
      const errorResponse = permissionResult.error;
      if (errorResponse) {
        try {
          const errorBody = await errorResponse
            .clone()
            .json()
            .catch(() => null);
          if (
            errorBody?.message?.includes('function') &&
            errorBody?.message?.includes('does not exist')
          ) {
            return NextResponse.json(
              {
                error: 'Permission system not initialized',
                code: 'MIGRATION_REQUIRED',
                details:
                  'The permission system database functions are missing. Please apply the database migrations to initialize the permission system.',
                migrationFiles: [
                  '20250123000001_enterprise_permission_system.sql',
                  '20250123000002_seed_permissions_and_roles.sql',
                  '20250123000003_rls_permission_integration.sql',
                ],
              },
              { status: 503 }
            );
          }
        } catch {
          // If we can't parse error, continue with original error
        }
      }
      return permissionResult.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Now fetch all user roles with details (we already checked table exists)
    // Note: user_roles.user_id references auth.users(id), but we need to join with users table
    // Since Supabase relationship syntax might not work, we'll fetch separately and join

    // First, get all user roles
    const { data: allUserRoles, error: fetchUserRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .order('assigned_at', { ascending: false });

    if (fetchUserRolesError) {
      logger.error('Failed to fetch user roles', {
        component: 'admin-permissions-api',
        action: 'get_user_roles',
        metadata: { error: fetchUserRolesError },
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch user roles',
          code: 'INTERNAL_ERROR',
          details: fetchUserRolesError.message,
        },
        { status: 500 }
      );
    }

    if (!allUserRoles || allUserRoles.length === 0) {
      return NextResponse.json({
        userRoles: [],
      });
    }

    // Get unique user IDs and role IDs
    const userIds = [...new Set(allUserRoles.map((ur) => ur.user_id))];
    const roleIds = [...new Set(allUserRoles.map((ur) => ur.role_id))];

    // Fetch users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, firstName, lastName')
      .in('id', userIds);

    if (usersError) {
      logger.warn('Failed to fetch users for user roles', {
        component: 'admin-permissions-api',
        action: 'get_user_roles',
        metadata: { error: usersError },
      });
      // Continue without user data
    }

    // Fetch roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name, display_name, description')
      .in('id', roleIds);

    if (rolesError) {
      logger.warn('Failed to fetch roles for user roles', {
        component: 'admin-permissions-api',
        action: 'get_user_roles',
        metadata: { error: rolesError },
      });
      // Continue without role data
    }

    // Create lookup maps
    const usersMap = new Map((users || []).map((u) => [u.id, u]));
    const rolesMap = new Map((roles || []).map((r) => [r.id, r]));

    // Combine data
    return NextResponse.json({
      userRoles: (allUserRoles || []).map((ur) => {
        const user = usersMap.get(ur.user_id);
        const role = rolesMap.get(ur.role_id);

        return {
          id: ur.id,
          userId: ur.user_id,
          roleId: ur.role_id,
          assignedAt: ur.assigned_at,
          user: user
            ? {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            : undefined,
          role: role
            ? {
                id: role.id,
                name: role.name,
                displayName: role.display_name,
                description: role.description,
              }
            : undefined,
        };
      }),
    });
  } catch (error) {
    logger.error('Unexpected error fetching user roles', {
      component: 'admin-permissions-api',
      action: 'get_user_roles',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const validated = assignRoleSchema.parse(body);

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, firstName, lastName')
      .eq('id', validated.userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if role exists
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name, display_name')
      .eq('id', validated.roleId)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Assign role (upsert to handle existing assignments)
    const { data: userRole, error: assignError } = await supabase
      .from('user_roles')
      .upsert(
        {
          user_id: validated.userId,
          role_id: validated.roleId,
          assigned_by: user.id,
          expires_at: validated.expiresAt || null,
        },
        {
          onConflict: 'user_id,role_id',
        }
      )
      .select('id, user_id, role_id, assigned_at')
      .single();

    if (assignError) {
      logger.error('Failed to assign role', {
        component: 'admin-permissions-api',
        action: 'assign_role',
      });
      return NextResponse.json(
        { error: 'Failed to assign role', details: assignError.message },
        { status: 500 }
      );
    }

    // Rebuild permission cache for the user
    await supabase.rpc('rebuild_user_permission_cache', {
      p_user_id: validated.userId,
    });

    // Log audit
    await logPermissionChange({
      action: 'role_assigned',
      targetType: 'user',
      targetId: validated.userId,
      roleId: validated.roleId,
      performedBy: user.id,
      newValue: {
        roleId: role.id,
        roleName: role.name,
        expiresAt: validated.expiresAt || null,
      },
    });

    logger.info('Role assigned successfully', {
      component: 'admin-permissions-api',
      action: 'assign_role',
      metadata: { userId: validated.userId, roleId: validated.roleId },
    });

    return NextResponse.json({
      userRole: {
        id: userRole.id,
        userId: userRole.user_id,
        roleId: userRole.role_id,
        assignedAt: userRole.assigned_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Unexpected error assigning role', {
      component: 'admin-permissions-api',
      action: 'assign_role',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
