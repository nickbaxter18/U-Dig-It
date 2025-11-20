/**
 * POST /api/admin/permissions/check
 * Check if the current user has a specific permission
 * Used by client-side components to check permissions
 */
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const checkPermissionSchema = z.object({
  permission: z.union([z.string(), z.array(z.string())]),
  resourceId: z.string().optional().nullable(),
  requireAll: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    const { supabase, user } = adminResult;
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = checkPermissionSchema.parse(body);

    // Check if permission system is initialized
    const { data: permCheck, error: permCheckError } = await supabase
      .from('permissions')
      .select('id')
      .limit(1);

    if (permCheckError) {
      const errorCode = (permCheckError as any)?.code;
      const errorMessage = permCheckError.message || '';

      if (errorCode === '42P01' || errorMessage.includes('does not exist')) {
        return NextResponse.json(
          {
            hasPermission: false,
            error: 'Permission system not initialized',
            code: 'MIGRATION_REQUIRED',
          },
          { status: 503 }
        );
      }

      logger.error('Failed to check permissions table', {
        component: 'admin-permissions-check-api',
        action: 'check_permission',
        metadata: { error: permCheckError },
      });
      return NextResponse.json(
        { hasPermission: false, error: 'Failed to check permission' },
        { status: 500 }
      );
    }

    // Check permission(s) using RPC function
    const permissions = Array.isArray(validated.permission)
      ? validated.permission
      : [validated.permission];
    let hasPermission = false;

    if (permissions.length === 1) {
      // Single permission check
      const { data, error } = await supabase.rpc('has_permission', {
        p_user_id: user.id,
        p_permission_name: permissions[0],
        p_resource_id: validated.resourceId || null,
      });

      if (error) {
        const errorCode = (error as any)?.code;
        const errorMessage = error.message || '';

        if (
          errorCode === '42883' ||
          (errorMessage.includes('function') && errorMessage.includes('does not exist'))
        ) {
          return NextResponse.json(
            {
              hasPermission: false,
              error: 'Permission system not initialized',
              code: 'MIGRATION_REQUIRED',
            },
            { status: 503 }
          );
        }

        logger.error('Permission check failed', {
          component: 'admin-permissions-check-api',
          action: 'check_permission',
          metadata: { userId: user.id, permission: permissions[0], error: error.message },
        });
        return NextResponse.json(
          { hasPermission: false, error: 'Failed to check permission' },
          { status: 500 }
        );
      }

      hasPermission = data === true;
    } else {
      // Multiple permissions check
      const rpcFunction = validated.requireAll ? 'has_all_permissions' : 'has_any_permission';
      const { data, error } = await supabase.rpc(rpcFunction, {
        p_user_id: user.id,
        p_permission_names: permissions,
      });

      if (error) {
        const errorCode = (error as any)?.code;
        const errorMessage = error.message || '';

        if (
          errorCode === '42883' ||
          (errorMessage.includes('function') && errorMessage.includes('does not exist'))
        ) {
          return NextResponse.json(
            {
              hasPermission: false,
              error: 'Permission system not initialized',
              code: 'MIGRATION_REQUIRED',
            },
            { status: 503 }
          );
        }

        logger.error('Permission check failed', {
          component: 'admin-permissions-check-api',
          action: 'check_permission',
          metadata: { userId: user.id, permissions, error: error.message },
        });
        return NextResponse.json(
          { hasPermission: false, error: 'Failed to check permission' },
          { status: 500 }
        );
      }

      hasPermission = data === true;
    }

    return NextResponse.json({
      hasPermission,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Unexpected error checking permission', {
      component: 'admin-permissions-check-api',
      action: 'check_permission',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
