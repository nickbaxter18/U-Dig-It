/**
 * GET /api/admin/permissions
 * Get all permissions
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { checkPermission } from '@/lib/permissions/middleware';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    const { supabase } = adminResult;
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, check if permissions table exists (before permission checks)
    // This allows us to provide helpful error messages when migrations aren't applied
    const { data: permissions, error: permError } = await supabase
      .from('permissions')
      .select('id, name, description, resource, action, created_at, updated_at')
      .limit(1);

    if (permError) {
      logger.error('Failed to fetch permissions', {
        component: 'admin-permissions-api',
        action: 'get_permissions',
        metadata: {
          error: permError,
          errorCode: (permError as any)?.code,
          errorMessage: permError.message,
        },
      });

      // Check if table doesn't exist (PostgreSQL error code 42P01)
      const errorCode = (permError as any)?.code;
      const errorMessage = (permError.message || '').toLowerCase();
      const errorDetails = (permError as any)?.details || '';

      // Check for various "table doesn't exist" error patterns
      const isTableMissing =
        errorCode === '42P01' || // Undefined table
        errorCode === 'P0001' || // Undefined table (alternative)
        errorMessage.includes('does not exist') ||
        (errorMessage.includes('relation') && errorMessage.includes('permissions')) ||
        (errorMessage.includes('permission denied') && errorMessage.includes('permissions')) ||
        errorDetails.includes('permissions');

      if (isTableMissing) {
        return NextResponse.json(
          {
            error: 'Permission system not initialized',
            code: 'MIGRATION_REQUIRED',
            details:
              'The permissions table does not exist. Please apply the database migrations to initialize the permission system.',
            migrationFiles: [
              '20250123000001_enterprise_permission_system.sql',
              '20250123000002_seed_permissions_and_roles.sql',
              '20250123000003_rls_permission_integration.sql',
            ],
          },
          { status: 503 }
        );
      }

      // Check if it's an RLS/permission denied error (might need service role key)
      if (
        errorCode === '42501' ||
        errorMessage.includes('permission denied') ||
        errorMessage.includes('row-level security')
      ) {
        logger.warn('RLS blocking permissions query - service role key may be missing', {
          component: 'admin-permissions-api',
          action: 'get_permissions',
        });
        return NextResponse.json(
          {
            error: 'Permission system access denied',
            code: 'RLS_BLOCKED',
            details:
              'Unable to access permissions table. This may be due to missing SUPABASE_SERVICE_ROLE_KEY or RLS policies blocking access. Please ensure the service role key is configured and migrations are applied.',
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
          error: 'Failed to fetch permissions',
          code: 'INTERNAL_ERROR',
          details: permError.message,
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

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') || '100', 10), 1),
      500
    );
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    // Now fetch all permissions (we already checked table exists)
    const {
      data: allPermissions,
      error: fetchError,
      count,
    } = await supabase
      .from('permissions')
      .select('id, name, description, resource, action, created_at, updated_at', { count: 'exact' })
      .order('resource', { ascending: true })
      .order('action', { ascending: true })
      .range(rangeStart, rangeEnd);

    if (fetchError) {
      logger.error('Failed to fetch permissions', {
        component: 'admin-permissions-api',
        action: 'get_permissions',
        metadata: { error: fetchError },
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch permissions',
          code: 'INTERNAL_ERROR',
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      permissions: (allPermissions || []).map((p) => ({
        id: p.id,
        name: p.name,
        resource: p.resource,
        action: p.action,
        scope: p.scope,
        description: p.description,
        category: p.category,
        isSystem: p.is_system,
      })),
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (error) {
    logger.error('Unexpected error fetching permissions', {
      component: 'admin-permissions-api',
      action: 'get_permissions',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
