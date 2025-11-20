/**
 * Enterprise Permission System - Main Export
 * Centralized exports for all permission utilities
 */

// Types
export type {
  PermissionString,
  ResourceType,
  ActionType,
  PermissionScope,
  Permission,
  Role,
  UserRole,
  PermissionGrant,
  PermissionAuditLog,
  PermissionAuditAction,
  PermissionCheckResult,
  UserPermissions,
  PermissionCheckOptions,
  PermissionContext,
} from './types';

// Permission definitions
export {
  PERMISSION_DEFINITIONS,
  DEFAULT_ROLES,
  getAllPermissionNames,
  getPermissionsByResource,
  getPermissionsByAction,
  isValidPermission,
} from './definitions';

// Permission checking
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  getPermissionContext,
  invalidateUserCache,
  clearPermissionCache,
  rebuildUserPermissionCache,
} from './checker';

// Middleware
export {
  withPermission,
  checkPermission,
  requirePermission,
  type PermissionMiddlewareOptions,
} from './middleware';

// Audit logging
export { logPermissionChange, getAuditLog, type AuditLogEntry } from './audit';

// Cache
export { permissionCache } from './cache';
