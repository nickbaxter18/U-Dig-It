/**
 * Enterprise Permission System - Permission Checker
 * Centralized permission checking with caching
 */
import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { createServiceClient } from '@/lib/supabase/service';

import type {
    PermissionCheckOptions,
    PermissionContext,
    PermissionString
} from './types';

// Detect if running client-side
const isClient = typeof window !== 'undefined';

// In-memory cache for permissions (5 minute TTL)
interface PermissionCacheEntry {
  permissions: PermissionString[];
  roles: string[];
  expiresAt: number;
}

const PERMISSION_CACHE = new Map<string, PermissionCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: PermissionString,
  options: PermissionCheckOptions = {}
): Promise<boolean> {
  logger.debug('Permission check called', {
    component: 'PermissionChecker',
    action: 'hasPermission_called',
    metadata: {
      userId,
      permission,
      isClient,
      options,
    },
  });
  try {
    // Check cache first
    const cacheKey = `${userId}:${permission}`;
    const cached = PERMISSION_CACHE.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug('Using cached permission result', {
        component: 'PermissionChecker',
        action: 'cache_hit',
        metadata: {
          userId,
          permission,
          hasPermission: cached.permissions.includes(permission),
        },
      });
      return cached.permissions.includes(permission);
    }

    let hasPermission = false;

    // Client-side: use API route
    if (isClient) {
      try {
        logger.debug('Making API request for permission', {
          component: 'PermissionChecker',
          action: 'api_request',
          metadata: {
            permission,
            userId,
          },
        });
        logger.debug('fetchWithAuth type check', {
          component: 'PermissionChecker',
          action: 'type_check',
          metadata: {
            fetchWithAuthType: typeof fetchWithAuth,
            isFunction: typeof fetchWithAuth === 'function',
          },
        });

        // Check if fetchWithAuth is available and is a function
        if (!fetchWithAuth) {
          const error = new Error('fetchWithAuth is not available (undefined)');
          logger.error(
            'fetchWithAuth check failed',
            {
              component: 'PermissionChecker',
              action: 'fetchWithAuth_check_failed',
            },
            error
          );
          throw error;
        }

        if (typeof fetchWithAuth !== 'function') {
          const error = new Error(
            `fetchWithAuth is not a function (type: ${typeof fetchWithAuth})`
          );
          logger.error(
            'fetchWithAuth type check failed',
            {
              component: 'PermissionChecker',
              action: 'type_check_failed',
            },
            error
          );
          throw error;
        }

        logger.debug('Calling fetchWithAuth', {
          component: 'PermissionChecker',
          action: 'calling_fetchWithAuth',
        });
        const response = await fetchWithAuth('/api/admin/permissions/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permission,
            resourceId: options.resourceId || null,
          }),
        });
        logger.debug('API response received', {
          component: 'PermissionChecker',
          action: 'api_response',
          metadata: { status: response.status, ok: response.ok },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.code === 'MIGRATION_REQUIRED') {
            logger.warn('Permission system not initialized', {
              component: 'permissions-checker',
              action: 'has_permission',
              metadata: { userId, permission },
            });
            return false;
          }
          logger.error('Permission check API failed', {
            component: 'permissions-checker',
            action: 'has_permission',
            metadata: { userId, permission, status: response.status },
          });
          return false;
        }

        const result = await response.json();
        hasPermission = result.hasPermission === true;
      } catch (apiError) {
        // Capture comprehensive error details
        type ErrorDetails = {
          userId: string;
          permission: string;
          errorMessage?: string;
          errorStack?: string;
          errorName?: string;
          errorCode?: string | number;
          errorString?: string;
          errorKeys?: string[];
          errorType?: string;
          stringifyError?: string;
        };
        const errorDetails: ErrorDetails = {
          userId,
          permission,
        };

        if (apiError instanceof Error) {
          errorDetails.errorMessage = apiError.message;
          errorDetails.errorStack = apiError.stack;
          errorDetails.errorName = apiError.name;
        } else if (apiError && typeof apiError === 'object') {
          try {
            errorDetails.errorString = JSON.stringify(apiError);
            errorDetails.errorKeys = Object.keys(apiError);
            const errorObj = apiError as Record<string, unknown>;
            if ('message' in errorObj) errorDetails.errorMessage = String(errorObj.message);
            if ('stack' in errorObj) errorDetails.errorStack = String(errorObj.stack);
            if ('name' in errorObj) errorDetails.errorName = String(errorObj.name);
            if ('code' in errorObj) {
              const codeValue = errorObj.code;
              errorDetails.errorCode = typeof codeValue === 'string' || typeof codeValue === 'number' ? codeValue : undefined;
            }
          } catch (stringifyError) {
            errorDetails.stringifyError = String(stringifyError);
          }
        } else {
          errorDetails.errorString = String(apiError);
          errorDetails.errorType = typeof apiError;
        }

        logger.error(
          'API error details',
          {
            component: 'PermissionChecker',
            action: 'api_error',
            metadata: errorDetails,
          },
          apiError instanceof Error ? apiError : undefined
        );
        // Raw error already logged above

        logger.error('Permission check API error', {
          component: 'permissions-checker',
          action: 'has_permission',
          metadata: errorDetails,
        });
        return false;
      }
    } else {
      // Server-side: use direct RPC
      const supabase = await createServiceClient();
      if (!supabase) {
        logger.error('Service client not available for permission check', {
          component: 'permissions-checker',
          action: 'has_permission',
          metadata: { userId, permission },
        });
        return false;
      }

      const { data, error } = await supabase.rpc('has_permission', {
        p_user_id: userId,
        p_permission_name: permission,
        p_resource_id: options.resourceId || null,
      });

      if (error) {
        // Check if function doesn't exist (migration not applied)
        // Type PostgREST error structure
        const errorCode = (error as { code?: string | number })?.code;
        const errorMessage = error.message || '';

        if (
          errorCode === '42883' ||
          (errorMessage.includes('function') && errorMessage.includes('does not exist'))
        ) {
          logger.warn('Permission system not initialized - function missing', {
            component: 'permissions-checker',
            action: 'has_permission',
            metadata: { userId, permission },
          });
          return false;
        }

        logger.error('Permission check failed', {
          component: 'permissions-checker',
          action: 'has_permission',
          metadata: { userId, permission, error: error.message },
        });
        return false;
      }

      hasPermission = data === true;
    }

    // Update cache
    if (hasPermission) {
      const userPermissions = await getUserPermissions(userId);
      PERMISSION_CACHE.set(cacheKey, {
        permissions: userPermissions.permissions,
        roles: userPermissions.roles,
        expiresAt: Date.now() + CACHE_TTL,
      });
    }

    return hasPermission;
  } catch (error) {
    logger.error(
      'Unexpected error checking permission',
      {
        component: 'permissions-checker',
        action: 'has_permission',
        metadata: { userId, permission },
      },
      error instanceof Error ? error : undefined
    );
    return false;
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissions: PermissionString[],
  options: PermissionCheckOptions = {}
): Promise<boolean> {
  try {
    if (permissions.length === 0) return false;
    if (permissions.length === 1) return hasPermission(userId, permissions[0], options);

    // Client-side: use API route
    if (isClient) {
      try {
        const response = await fetchWithAuth('/api/admin/permissions/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permission: permissions,
            resourceId: options.resourceId || null,
            requireAll: false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.code === 'MIGRATION_REQUIRED') {
            logger.warn('Permission system not initialized', {
              component: 'permissions-checker',
              action: 'has_any_permission',
              metadata: { userId, permissions },
            });
            return false;
          }
          logger.error('Permission check API failed', {
            component: 'permissions-checker',
            action: 'has_any_permission',
            metadata: { userId, permissions, status: response.status },
          });
          return false;
        }

        const result = await response.json();
        return result.hasPermission === true;
      } catch (apiError) {
        logger.error(
          'Permission check API error',
          {
            component: 'permissions-checker',
            action: 'has_any_permission',
            metadata: { userId, permissions },
          },
          apiError instanceof Error ? apiError : undefined
        );
        return false;
      }
    }

    // Server-side: use direct RPC
    const supabase = await createServiceClient();
    if (!supabase) {
      return false;
    }

    const { data, error } = await supabase.rpc('has_any_permission', {
      p_user_id: userId,
      p_permission_names: permissions,
    });

    if (error) {
      // Check if function doesn't exist (migration not applied)
      // Type PostgREST error structure
      const errorCode = (error as { code?: string | number })?.code;
      const errorMessage = error.message || '';

      if (
        errorCode === '42883' ||
        (errorMessage.includes('function') && errorMessage.includes('does not exist'))
      ) {
        logger.warn('Permission system not initialized - function missing', {
          component: 'permissions-checker',
          action: 'has_any_permission',
          metadata: { userId, permissions },
        });
        return false;
      }

      logger.error('Any permission check failed', {
        component: 'permissions-checker',
        action: 'has_any_permission',
        metadata: { userId, permissions, error: error.message },
      });
      return false;
    }

    return data === true;
  } catch (error) {
    logger.error(
      'Unexpected error checking any permission',
      {
        component: 'permissions-checker',
        action: 'has_any_permission',
        metadata: { userId, permissions },
      },
      error instanceof Error ? error : undefined
    );
    return false;
  }
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissions: PermissionString[],
  options: PermissionCheckOptions = {}
): Promise<boolean> {
  try {
    if (permissions.length === 0) return true;
    if (permissions.length === 1) return hasPermission(userId, permissions[0], options);

    // Client-side: use API route
    if (isClient) {
      try {
        const response = await fetchWithAuth('/api/admin/permissions/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permission: permissions,
            resourceId: options.resourceId || null,
            requireAll: true,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.code === 'MIGRATION_REQUIRED') {
            logger.warn('Permission system not initialized', {
              component: 'permissions-checker',
              action: 'has_all_permissions',
              metadata: { userId, permissions },
            });
            return false;
          }
          logger.error('Permission check API failed', {
            component: 'permissions-checker',
            action: 'has_all_permissions',
            metadata: { userId, permissions, status: response.status },
          });
          return false;
        }

        const result = await response.json();
        return result.hasPermission === true;
      } catch (apiError) {
        logger.error(
          'Permission check API error',
          {
            component: 'permissions-checker',
            action: 'has_all_permissions',
            metadata: { userId, permissions },
          },
          apiError instanceof Error ? apiError : undefined
        );
        return false;
      }
    }

    // Server-side: use direct RPC
    const supabase = await createServiceClient();
    if (!supabase) {
      return false;
    }

    const { data, error } = await supabase.rpc('has_all_permissions', {
      p_user_id: userId,
      p_permission_names: permissions,
    });

    if (error) {
      // Check if function doesn't exist (migration not applied)
      // Type PostgREST error structure
      const errorCode = (error as { code?: string | number })?.code;
      const errorMessage = error.message || '';

      if (
        errorCode === '42883' ||
        (errorMessage.includes('function') && errorMessage.includes('does not exist'))
      ) {
        logger.warn('Permission system not initialized - function missing', {
          component: 'permissions-checker',
          action: 'has_all_permissions',
          metadata: { userId, permissions },
        });
        return false;
      }

      logger.error('All permissions check failed', {
        component: 'permissions-checker',
        action: 'has_all_permissions',
        metadata: { userId, permissions, error: error.message },
      });
      return false;
    }

    return data === true;
  } catch (error) {
    logger.error(
      'Unexpected error checking all permissions',
      {
        component: 'permissions-checker',
        action: 'has_all_permissions',
        metadata: { userId, permissions },
      },
      error instanceof Error ? error : undefined
    );
    return false;
  }
}

/**
 * Get all permissions for a user (with caching)
 */
export async function getUserPermissions(userId: string): Promise<{
  permissions: PermissionString[];
  roles: string[];
}> {
  try {
    // Check cache
    const cacheKey = `user:${userId}`;
    const cached = PERMISSION_CACHE.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        permissions: cached.permissions,
        roles: cached.roles,
      };
    }

    const supabase = await createServiceClient();
    if (!supabase) {
      logger.error('Service client not available for getting user permissions', {
        component: 'permissions-checker',
        action: 'get_user_permissions',
        metadata: { userId },
      });
      return { permissions: [], roles: [] };
    }

    // Get permissions from database
    const { data: permissions, error: permError } = await supabase.rpc('get_user_permissions', {
      p_user_id: userId,
    });

    if (permError) {
      logger.error('Failed to get user permissions', {
        component: 'permissions-checker',
        action: 'get_user_permissions',
        metadata: { userId, error: permError.message },
      });
      return { permissions: [], roles: [] };
    }

    // Get user roles
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', userId)
      .is('expires_at', null);

    const roleNames: string[] = [];
    if (!roleError && roles) {
      for (const role of roles) {
        if (role.role && typeof role.role === 'object' && 'name' in role.role) {
          roleNames.push(role.role.name as string);
        }
      }
    }

    const permissionNames = (permissions || []).map(
      (p: { permission_name: string }) => p.permission_name
    );

    // Update cache
    PERMISSION_CACHE.set(cacheKey, {
      permissions: permissionNames,
      roles: roleNames,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return {
      permissions: permissionNames,
      roles: roleNames,
    };
  } catch (error) {
    logger.error(
      'Unexpected error getting user permissions',
      {
        component: 'permissions-checker',
        action: 'get_user_permissions',
        metadata: { userId },
      },
      error instanceof Error ? error : undefined
    );
    return { permissions: [], roles: [] };
  }
}

/**
 * Get permission context for a user
 */
export async function getPermissionContext(userId: string): Promise<PermissionContext | null> {
  try {
    const supabase = await createServiceClient();
    if (!supabase) {
      return null;
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return null;
    }

    // Get permissions
    const { permissions, roles } = await getUserPermissions(userId);

    return {
      userId,
      userRole: userData.role as 'customer' | 'admin' | 'super_admin',
      permissions,
      roles,
    };
  } catch (error) {
    logger.error(
      'Unexpected error getting permission context',
      {
        component: 'permissions-checker',
        action: 'get_permission_context',
        metadata: { userId },
      },
      error instanceof Error ? error : undefined
    );
    return null;
  }
}

/**
 * Invalidate permission cache for a user
 */
export function invalidateUserCache(userId: string): void {
  const keysToDelete: string[] = [];
  for (const key of PERMISSION_CACHE.keys()) {
    if (key.startsWith(`${userId}:`) || key === `user:${userId}`) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => PERMISSION_CACHE.delete(key));
}

/**
 * Clear all permission cache
 */
export function clearPermissionCache(): void {
  PERMISSION_CACHE.clear();
}

/**
 * Rebuild permission cache for a user
 */
export async function rebuildUserPermissionCache(userId: string): Promise<void> {
  try {
    const supabase = await createServiceClient();
    if (!supabase) {
      return;
    }

    await supabase.rpc('rebuild_user_permission_cache', {
      p_user_id: userId,
    });

    // Invalidate in-memory cache to force refresh
    invalidateUserCache(userId);
  } catch (error) {
    logger.error(
      'Failed to rebuild permission cache',
      {
        component: 'permissions-checker',
        action: 'rebuild_user_permission_cache',
        metadata: { userId },
      },
      error instanceof Error ? error : undefined
    );
  }
}
