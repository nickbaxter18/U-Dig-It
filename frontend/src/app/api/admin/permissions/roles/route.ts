/**
 * GET /api/admin/permissions/roles
 * Get all roles with their permissions
 *
 * POST /api/admin/permissions/roles
 * Create a new role
 */
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { logPermissionChange } from '@/lib/permissions/audit';
import { checkPermission } from '@/lib/permissions/middleware';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const createRoleSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string().uuid()),
});

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    const { supabase } = adminResult;
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, check if roles table exists (before permission checks)
    const { data: roles, error: rolesError } = await supabase.from('roles').select('id').limit(1);

    if (rolesError) {
      logger.error('Failed to fetch roles', {
        component: 'admin-permissions-api',
        action: 'get_roles',
        metadata: { error: rolesError },
      });

      // Check if table doesn't exist (PostgreSQL error code 42P01)
      const errorCode = (rolesError as any)?.code;
      const errorMessage = rolesError.message || '';

      // Check for various "table doesn't exist" error patterns
      const isTableMissing =
        errorCode === '42P01' || // Undefined table
        errorCode === 'P0001' || // Undefined table (alternative)
        errorMessage.includes('does not exist') ||
        (errorMessage.includes('relation') &&
          (errorMessage.includes('roles') || errorMessage.includes('role_permissions'))) ||
        (errorMessage.includes('permission denied') &&
          (errorMessage.includes('roles') || errorMessage.includes('role_permissions')));

      if (isTableMissing) {
        return NextResponse.json(
          {
            error: 'Permission system not initialized',
            code: 'MIGRATION_REQUIRED',
            details:
              'The roles table does not exist. Please apply the database migrations to initialize the permission system.',
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
        logger.warn('RLS blocking roles query - service role key may be missing', {
          component: 'admin-permissions-api',
          action: 'get_roles',
        });
        return NextResponse.json(
          {
            error: 'Permission system access denied',
            code: 'RLS_BLOCKED',
            details:
              'Unable to access roles table. This may be due to missing SUPABASE_SERVICE_ROLE_KEY or RLS policies blocking access. Please ensure the service role key is configured and migrations are applied.',
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
          error: 'Failed to fetch roles',
          code: 'INTERNAL_ERROR',
          details: rolesError.message,
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

    // Now fetch all roles with permissions (we already checked table exists)
    const { data: allRoles, error: fetchError } = await supabase
      .from('roles')
      .select(
        `
        *,
        role_permissions (
          permission_id,
          permission:permissions (
            id,
            name,
            resource,
            action,
            scope,
            description,
            category,
            is_system
          )
        )
      `
      )
      .order('name', { ascending: true });

    if (fetchError) {
      logger.error('Failed to fetch roles', {
        component: 'admin-permissions-api',
        action: 'get_roles',
        metadata: { error: fetchError },
      });
      return NextResponse.json(
        { error: 'Failed to fetch roles', code: 'INTERNAL_ERROR', details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      roles: (allRoles || []).map((role: any) => ({
        id: role.id,
        name: role.name,
        displayName: role.display_name,
        description: role.description,
        isSystem: role.is_system,
        isActive: role.is_active,
        permissions: ((role.role_permissions || []) as any[])
          .filter((rp: any) => rp.permission)
          .map((rp: any) => ({
            id: rp.permission.id,
            name: rp.permission.name,
            resource: rp.permission.resource,
            action: rp.permission.action,
            scope: rp.permission.scope,
            description: rp.permission.description,
            category: rp.permission.category,
            isSystem: rp.permission.is_system,
          })),
      })),
    });
  } catch (error) {
    logger.error('Unexpected error fetching roles', {
      component: 'admin-permissions-api',
      action: 'get_roles',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    // Check permission
    const permissionResult = await checkPermission(request, 'admin_users:create:all');
    if (!permissionResult.hasAccess) {
      return permissionResult.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { supabase, user } = adminResult;
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createRoleSchema.parse(body);

    // Create role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        name: validated.name,
        display_name: validated.displayName,
        description: validated.description,
        is_system: validated.isSystem,
        is_active: validated.isActive,
      })
      .select('id, name, display_name')
      .single();

    if (roleError) {
      logger.error('Failed to create role', {
        component: 'admin-permissions-api',
        action: 'create_role',
      });
      return NextResponse.json(
        { error: 'Failed to create role', details: roleError.message },
        { status: 500 }
      );
    }

    // Assign permissions
    if (validated.permissions.length > 0) {
      const rolePermissions = validated.permissions.map((permissionId) => ({
        role_id: role.id,
        permission_id: permissionId,
        granted_by: user.id,
      }));

      const { error: permError } = await supabase.from('role_permissions').insert(rolePermissions);

      if (permError) {
        logger.error('Failed to assign permissions to role', {
          component: 'admin-permissions-api',
          action: 'create_role',
        });
        // Rollback role creation
        await supabase.from('roles').delete().eq('id', role.id);
        return NextResponse.json(
          { error: 'Failed to assign permissions', details: permError.message },
          { status: 500 }
        );
      }
    }

    // Log audit
    await logPermissionChange({
      action: 'role_created',
      targetType: 'role',
      targetId: role.id,
      roleId: role.id,
      performedBy: user.id,
      newValue: {
        name: role.name,
        displayName: role.display_name,
        permissions: validated.permissions,
      },
    });

    logger.info('Role created successfully', {
      component: 'admin-permissions-api',
      action: 'create_role',
      metadata: { roleId: role.id, roleName: role.name },
    });

    return NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        displayName: role.display_name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Unexpected error creating role', {
      component: 'admin-permissions-api',
      action: 'create_role',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
