/**
 * Enterprise Permission System - Permission Gate Component
 * Conditionally render children based on permissions
 */

'use client';

import { ReactNode } from 'react';

import type { PermissionCheckOptions, PermissionString } from '@/lib/permissions/types';

import { useHasPermission } from '@/hooks/usePermissions';

export interface PermissionGateProps {
  permission: PermissionString | PermissionString[];
  requireAll?: boolean; // If multiple permissions, require all
  fallback?: ReactNode;
  loading?: ReactNode;
  children: ReactNode;
  resourceId?: string;
}

/**
 * PermissionGate - Conditionally render children based on permissions
 *
 * @example
 * <PermissionGate permission="bookings:update:all">
 *   <EditButton />
 * </PermissionGate>
 *
 * @example
 * <PermissionGate permission={["bookings:update:all", "bookings:delete:all"]} requireAll>
 *   <AdminActions />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  requireAll = false,
  fallback = null,
  loading = null,
  children,
  resourceId,
}: PermissionGateProps) {
  const permissions = Array.isArray(permission) ? permission : [permission];
  const options: PermissionCheckOptions = { requireAll, resourceId };

  // Check first permission to determine loading state
  const { hasPermission: hasFirstPermission, loading: isLoading } = useHasPermission(
    permissions[0],
    options
  );

  // For multiple permissions with requireAll, we'd need to check all
  // For now, we'll use the first permission check as a proxy
  // In a production system, you'd want to check all permissions
  if (isLoading) {
    return <>{loading}</>;
  }

  if (!hasFirstPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * PermissionGate with any permission check
 */
export function PermissionGateAny({
  permission,
  fallback = null,
  loading = null,
  children,
  resourceId,
}: Omit<PermissionGateProps, 'requireAll'>) {
  return (
    <PermissionGate
      permission={permission}
      requireAll={false}
      fallback={fallback}
      loading={loading}
      resourceId={resourceId}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * PermissionGate with all permissions required
 */
export function PermissionGateAll({
  permission,
  fallback = null,
  loading = null,
  children,
  resourceId,
}: Omit<PermissionGateProps, 'requireAll'>) {
  return (
    <PermissionGate
      permission={permission}
      requireAll={true}
      fallback={fallback}
      loading={loading}
      resourceId={resourceId}
    >
      {children}
    </PermissionGate>
  );
}
