/**
 * Enterprise Permission System - API Route Middleware
 * Middleware for protecting API routes with permissions
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

import { hasAllPermissions, hasAnyPermission, hasPermission } from './checker';
import type { PermissionCheckOptions, PermissionString } from './types';

export interface PermissionMiddlewareOptions {
  permissions: PermissionString | PermissionString[];
  requireAll?: boolean; // If multiple permissions, require all
  resourceId?: string; // Optional resource ID for resource-level checks
  allowSuperAdmin?: boolean; // Allow super_admin to bypass (default: true)
}

/**
 * Permission middleware for API routes
 * Usage: export const middleware = withPermission({ permissions: 'bookings:update:all' })
 */
export function withPermission(options: PermissionMiddlewareOptions) {
  return async (handler: (req: NextRequest, context: any) => Promise<NextResponse>) => {
    return async (req: NextRequest, context: any): Promise<NextResponse> => {
      try {
        // First verify admin access
        const adminResult = await requireAdmin(req);
        if (adminResult.error) {
          return adminResult.error;
        }

        const { user, role } = adminResult;
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Super admin bypass (unless explicitly disabled)
        if (options.allowSuperAdmin !== false && role === 'super_admin') {
          return handler(req, { ...context, user, role, permissions: [] });
        }

        // Check permissions
        const permissions = Array.isArray(options.permissions)
          ? options.permissions
          : [options.permissions];

        const checkOptions: PermissionCheckOptions = {
          resourceId: options.resourceId,
          requireAll: options.requireAll ?? false,
        };

        let hasAccess = false;

        if (checkOptions.requireAll) {
          hasAccess = await hasAllPermissions(user.id, permissions, checkOptions);
        } else {
          hasAccess = await hasAnyPermission(user.id, permissions, checkOptions);
        }

        if (!hasAccess) {
          logger.warn('Permission denied', {
            component: 'permissions-middleware',
            action: 'permission_check_failed',
            metadata: {
              userId: user.id,
              permissions,
              path: req.nextUrl.pathname,
            },
          });

          return NextResponse.json(
            {
              error: 'Forbidden',
              message: 'You do not have permission to perform this action',
              requiredPermissions: permissions,
            },
            { status: 403 }
          );
        }

        // Permission granted - call handler
        return handler(req, { ...context, user, role, permissions });
      } catch (error) {
        logger.error('Permission middleware error', {
          component: 'permissions-middleware',
          action: 'middleware_error',
          metadata: { path: req.nextUrl.pathname },
        });

        return NextResponse.json(
          { error: 'Internal server error', message: 'Permission check failed' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Helper to check permission in route handler
 */
export async function checkPermission(
  req: NextRequest,
  permission: PermissionString | PermissionString[],
  options: PermissionCheckOptions = {}
): Promise<{ hasAccess: boolean; user: any; error?: NextResponse }> {
  try {
    const adminResult = await requireAdmin(req);
    if (adminResult.error) {
      return { hasAccess: false, user: null, error: adminResult.error };
    }

    const { user, role } = adminResult;
    if (!user) {
      return {
        hasAccess: false,
        user: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    // Super admin bypass
    if (role === 'super_admin') {
      return { hasAccess: true, user };
    }

    const permissions = Array.isArray(permission) ? permission : [permission];
    let hasAccess = false;

    try {
      if (options.requireAll) {
        hasAccess = await hasAllPermissions(user.id, permissions, options);
      } else {
        hasAccess = await hasAnyPermission(user.id, permissions, options);
      }
    } catch (permError: any) {
      // Check if error is due to missing functions (migration not applied)
      const errorMessage = permError?.message || '';
      if (errorMessage.includes('function') && errorMessage.includes('does not exist')) {
        // Permission system not initialized - allow access for admins (they can view the migration message)
        // This allows the UI to show the migration required message
        logger.warn('Permission check skipped - system not initialized', {
          component: 'permissions-middleware',
          action: 'check_permission',
          metadata: { userId: user.id },
        });
        hasAccess = true; // Allow admins to proceed so they can see the migration message
      } else {
        throw permError; // Re-throw other errors
      }
    }

    if (!hasAccess) {
      return {
        hasAccess: false,
        user,
        error: NextResponse.json(
          {
            error: 'Forbidden',
            message: 'You do not have permission to perform this action',
            requiredPermissions: permissions,
          },
          { status: 403 }
        ),
      };
    }

    return { hasAccess: true, user };
  } catch (error) {
    logger.error('Permission check error', {
      component: 'permissions-middleware',
      action: 'check_permission',
    });

    return {
      hasAccess: false,
      user: null,
      error: NextResponse.json(
        { error: 'Internal server error', message: 'Permission check failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Require specific permission (throws if not authorized)
 */
export async function requirePermission(
  req: NextRequest,
  permission: PermissionString | PermissionString[],
  options: PermissionCheckOptions = {}
): Promise<{ user: any; role: string }> {
  const result = await checkPermission(req, permission, options);

  if (!result.hasAccess || result.error) {
    throw result.error || new Error('Permission denied');
  }

  return { user: result.user, role: 'admin' }; // Role from requireAdmin
}
