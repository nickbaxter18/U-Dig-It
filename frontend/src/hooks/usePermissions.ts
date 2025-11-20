/**
 * Enterprise Permission System - React Hook
 * Hook for checking permissions in React components
 */
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import {
  hasPermission as checkPermission,
  getUserPermissions,
  hasAllPermissions,
  hasAnyPermission,
} from '@/lib/permissions/checker';
import type { PermissionCheckOptions, PermissionString } from '@/lib/permissions/types';

export interface UsePermissionsResult {
  permissions: PermissionString[];
  roles: string[];
  hasPermission: (
    permission: PermissionString,
    options?: PermissionCheckOptions
  ) => Promise<boolean>;
  hasAnyPermission: (
    permissions: PermissionString[],
    options?: PermissionCheckOptions
  ) => Promise<boolean>;
  hasAllPermissions: (
    permissions: PermissionString[],
    options?: PermissionCheckOptions
  ) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to check user permissions
 */
export function usePermissions(): UsePermissionsResult {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PermissionString[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPermissions = useCallback(async () => {
    if (!user?.id) {
      setPermissions([]);
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getUserPermissions(user.id);
      setPermissions(result.permissions);
      setRoles(result.roles);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load permissions'));
      setPermissions([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const checkPermissionCallback = useCallback(
    async (permission: PermissionString, options?: PermissionCheckOptions): Promise<boolean> => {
      if (!user?.id) return false;
      return checkPermission(user.id, permission, options);
    },
    [user?.id]
  );

  const checkAnyPermission = useCallback(
    async (permissions: PermissionString[], options?: PermissionCheckOptions): Promise<boolean> => {
      if (!user?.id) return false;
      return hasAnyPermission(user.id, permissions, options);
    },
    [user?.id]
  );

  const checkAllPermissions = useCallback(
    async (permissions: PermissionString[], options?: PermissionCheckOptions): Promise<boolean> => {
      if (!user?.id) return false;
      return hasAllPermissions(user.id, permissions, options);
    },
    [user?.id]
  );

  return {
    permissions,
    roles,
    hasPermission: checkPermissionCallback,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    loading,
    error,
    refresh: loadPermissions,
  };
}

/**
 * Hook to check a specific permission
 */
export function useHasPermission(
  permission: PermissionString,
  options?: PermissionCheckOptions
): { hasPermission: boolean; loading: boolean } {
  const { user } = useAuth();
  // Rename state variable to avoid shadowing the imported hasPermission function
  const [hasPermissionResult, setHasPermissionResult] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setHasPermissionResult(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        setLoading(true);
        console.log('[useHasPermission] Starting permission check', {
          userId: user.id,
          permission,
        });
        const result = await checkPermission(user.id, permission, options);
        console.log('[useHasPermission] Permission check result', {
          userId: user.id,
          permission,
          result,
        });
        if (!cancelled) {
          setHasPermissionResult(result);
        }
      } catch (err) {
        // First, log the raw error immediately to see what we're dealing with
        console.error('[useHasPermission] CAUGHT ERROR - Raw err:', err);
        console.error('[useHasPermission] CAUGHT ERROR - err type:', typeof err);
        console.error(
          '[useHasPermission] CAUGHT ERROR - err instanceof Error:',
          err instanceof Error
        );
        console.error('[useHasPermission] CAUGHT ERROR - err constructor:', err?.constructor?.name);
        console.error(
          '[useHasPermission] CAUGHT ERROR - err keys:',
          err && typeof err === 'object' ? Object.keys(err) : 'N/A'
        );

        // Capture error details more thoroughly
        const errorDetails: any = {
          userId: user.id,
          permission,
          errorType: typeof err,
          errorConstructor: err?.constructor?.name,
          isErrorInstance: err instanceof Error,
        };

        // Try to extract error information in multiple ways
        if (err instanceof Error) {
          errorDetails.errorMessage = err.message;
          errorDetails.errorStack = err.stack;
          errorDetails.errorName = err.name;
        } else if (err && typeof err === 'object') {
          // Try to extract properties from the error object
          try {
            const keys = Object.keys(err);
            errorDetails.errorKeys = keys;
            errorDetails.errorKeyCount = keys.length;

            // Try to get common error properties
            if ('message' in err) errorDetails.errorMessage = (err as any).message;
            if ('stack' in err) errorDetails.errorStack = (err as any).stack;
            if ('name' in err) errorDetails.errorName = (err as any).name;
            if ('code' in err) errorDetails.errorCode = (err as any).code;
            if ('toString' in err && typeof err.toString === 'function') {
              try {
                errorDetails.errorToString = err.toString();
              } catch (e) {
                errorDetails.errorToStringError = String(e);
              }
            }

            // Try JSON.stringify
            try {
              errorDetails.errorString = JSON.stringify(err);
            } catch (stringifyError) {
              errorDetails.stringifyError = String(stringifyError);
            }
          } catch (extractError) {
            errorDetails.extractError = String(extractError);
          }
        } else {
          errorDetails.errorString = String(err);
        }

        // Log to console for immediate visibility with full details
        console.error('[useHasPermission] Error checking permission - Full Details:', errorDetails);
        console.error('[useHasPermission] Error checking permission - Raw err again:', err);

        // Also log via logger
        logger.error('Error checking permission in hook', {
          component: 'useHasPermission',
          action: 'check_permission',
          metadata: errorDetails,
        });

        if (!cancelled) {
          setHasPermissionResult(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [user?.id, permission, JSON.stringify(options)]);

  return { hasPermission: hasPermissionResult, loading };
}
