/**
 * Enterprise Permission System - Type Definitions
 * Type-safe permission system for RBAC
 */

// Permission format: {resource}:{action}:{scope}
export type PermissionString = string;

// Resource categories
export type ResourceType =
  | 'bookings'
  | 'equipment'
  | 'customers'
  | 'payments'
  | 'admin_users'
  | 'settings'
  | 'reports'
  | 'audit'
  | 'integrations'
  | 'support'
  | 'contracts'
  | 'communications'
  | 'analytics'
  | 'operations';

// Action types
export type ActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'approve'
  | 'refund'
  | 'manage'
  | 'cancel'
  | 'assign'
  | 'send';

// Permission scopes
export type PermissionScope = 'own' | 'department' | 'all';

// Permission definition
export interface Permission {
  id: string;
  name: PermissionString;
  resource: ResourceType;
  action: ActionType;
  scope: PermissionScope;
  description: string;
  category?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// Role definition
export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

// User role assignment
export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  role?: Role;
}

// Direct permission grant
export interface PermissionGrant {
  id: string;
  userId: string;
  permissionId: string;
  resourceId?: string;
  grantedAt: string;
  grantedBy?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  permission?: Permission;
}

// Permission audit log entry
export interface PermissionAuditLog {
  id: string;
  action: PermissionAuditAction;
  targetType: 'user' | 'role' | 'permission';
  targetId: string;
  permissionId?: string;
  roleId?: string;
  userId?: string;
  performedBy?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export type PermissionAuditAction =
  | 'granted'
  | 'revoked'
  | 'role_assigned'
  | 'role_removed'
  | 'role_created'
  | 'role_updated'
  | 'role_deleted'
  | 'permission_created'
  | 'permission_updated'
  | 'permission_deleted';

// Permission check result
export interface PermissionCheckResult {
  hasPermission: boolean;
  source?: 'role' | 'grant' | 'super_admin';
  roleId?: string;
  grantId?: string;
}

// User permissions (cached)
export interface UserPermissions {
  userId: string;
  permissions: PermissionString[];
  roles: string[];
  updatedAt: string;
}

// Permission check options
export interface PermissionCheckOptions {
  resourceId?: string;
  requireAll?: boolean; // If checking multiple permissions, require all
}

// Permission middleware context
export interface PermissionContext {
  userId: string;
  userRole: 'customer' | 'admin' | 'super_admin';
  permissions: PermissionString[];
  roles: string[];
}
