/**
 * Enterprise Permission System - Permission Definitions
 * Complete catalog of all permissions in the system
 */
import type { ActionType, Permission, PermissionScope, ResourceType } from './types';

// Helper to create permission name
function createPermission(
  resource: ResourceType,
  action: ActionType,
  scope: PermissionScope = 'all'
): string {
  return `${resource}:${action}:${scope}`;
}

// Permission definitions organized by resource
export const PERMISSION_DEFINITIONS: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ============================================================================
  // BOOKINGS PERMISSIONS
  // ============================================================================
  {
    name: createPermission('bookings', 'create', 'all'),
    resource: 'bookings',
    action: 'create',
    scope: 'all',
    description: 'Create new bookings',
    category: 'Bookings',
    isSystem: true,
  },
  {
    name: createPermission('bookings', 'read', 'all'),
    resource: 'bookings',
    action: 'read',
    scope: 'all',
    description: 'View all bookings',
    category: 'Bookings',
    isSystem: true,
  },
  {
    name: createPermission('bookings', 'read', 'own'),
    resource: 'bookings',
    action: 'read',
    scope: 'own',
    description: 'View own bookings only',
    category: 'Bookings',
    isSystem: true,
  },
  {
    name: createPermission('bookings', 'update', 'all'),
    resource: 'bookings',
    action: 'update',
    scope: 'all',
    description: 'Update any booking',
    category: 'Bookings',
    isSystem: true,
  },
  {
    name: createPermission('bookings', 'update', 'own'),
    resource: 'bookings',
    action: 'update',
    scope: 'own',
    description: 'Update own bookings only',
    category: 'Bookings',
    isSystem: true,
  },
  {
    name: createPermission('bookings', 'delete', 'all'),
    resource: 'bookings',
    action: 'delete',
    scope: 'all',
    description: 'Delete any booking',
    category: 'Bookings',
    isSystem: true,
  },
  {
    name: createPermission('bookings', 'cancel', 'all'),
    resource: 'bookings',
    action: 'cancel',
    scope: 'all',
    description: 'Cancel any booking',
    category: 'Bookings',
    isSystem: true,
  },
  {
    name: createPermission('bookings', 'approve', 'all'),
    resource: 'bookings',
    action: 'approve',
    scope: 'all',
    description: 'Approve bookings',
    category: 'Bookings',
    isSystem: true,
  },
  {
    name: createPermission('bookings', 'export', 'all'),
    resource: 'bookings',
    action: 'export',
    scope: 'all',
    description: 'Export booking data',
    category: 'Bookings',
    isSystem: true,
  },
  {
    name: createPermission('bookings', 'manage', 'all'),
    resource: 'bookings',
    action: 'manage',
    scope: 'all',
    description: 'Full booking management (all actions)',
    category: 'Bookings',
    isSystem: true,
  },

  // ============================================================================
  // EQUIPMENT PERMISSIONS
  // ============================================================================
  {
    name: createPermission('equipment', 'create', 'all'),
    resource: 'equipment',
    action: 'create',
    scope: 'all',
    description: 'Add new equipment',
    category: 'Equipment',
    isSystem: true,
  },
  {
    name: createPermission('equipment', 'read', 'all'),
    resource: 'equipment',
    action: 'read',
    scope: 'all',
    description: 'View all equipment',
    category: 'Equipment',
    isSystem: true,
  },
  {
    name: createPermission('equipment', 'update', 'all'),
    resource: 'equipment',
    action: 'update',
    scope: 'all',
    description: 'Update equipment details',
    category: 'Equipment',
    isSystem: true,
  },
  {
    name: createPermission('equipment', 'delete', 'all'),
    resource: 'equipment',
    action: 'delete',
    scope: 'all',
    description: 'Delete equipment',
    category: 'Equipment',
    isSystem: true,
  },
  {
    name: createPermission('equipment', 'manage', 'all'),
    resource: 'equipment',
    action: 'manage',
    scope: 'all',
    description: 'Full equipment management',
    category: 'Equipment',
    isSystem: true,
  },

  // ============================================================================
  // CUSTOMERS PERMISSIONS
  // ============================================================================
  {
    name: createPermission('customers', 'create', 'all'),
    resource: 'customers',
    action: 'create',
    scope: 'all',
    description: 'Create customer accounts',
    category: 'Customers',
    isSystem: true,
  },
  {
    name: createPermission('customers', 'read', 'all'),
    resource: 'customers',
    action: 'read',
    scope: 'all',
    description: 'View all customers',
    category: 'Customers',
    isSystem: true,
  },
  {
    name: createPermission('customers', 'read', 'own'),
    resource: 'customers',
    action: 'read',
    scope: 'own',
    description: 'View own profile only',
    category: 'Customers',
    isSystem: true,
  },
  {
    name: createPermission('customers', 'update', 'all'),
    resource: 'customers',
    action: 'update',
    scope: 'all',
    description: 'Update any customer',
    category: 'Customers',
    isSystem: true,
  },
  {
    name: createPermission('customers', 'update', 'own'),
    resource: 'customers',
    action: 'update',
    scope: 'own',
    description: 'Update own profile',
    category: 'Customers',
    isSystem: true,
  },
  {
    name: createPermission('customers', 'delete', 'all'),
    resource: 'customers',
    action: 'delete',
    scope: 'all',
    description: 'Delete customer accounts',
    category: 'Customers',
    isSystem: true,
  },
  {
    name: createPermission('customers', 'export', 'all'),
    resource: 'customers',
    action: 'export',
    scope: 'all',
    description: 'Export customer data',
    category: 'Customers',
    isSystem: true,
  },
  {
    name: createPermission('customers', 'manage', 'all'),
    resource: 'customers',
    action: 'manage',
    scope: 'all',
    description: 'Full customer management',
    category: 'Customers',
    isSystem: true,
  },

  // ============================================================================
  // PAYMENTS PERMISSIONS
  // ============================================================================
  {
    name: createPermission('payments', 'read', 'all'),
    resource: 'payments',
    action: 'read',
    scope: 'all',
    description: 'View all payments',
    category: 'Payments',
    isSystem: true,
  },
  {
    name: createPermission('payments', 'read', 'own'),
    resource: 'payments',
    action: 'read',
    scope: 'own',
    description: 'View own payments only',
    category: 'Payments',
    isSystem: true,
  },
  {
    name: createPermission('payments', 'refund', 'all'),
    resource: 'payments',
    action: 'refund',
    scope: 'all',
    description: 'Process refunds',
    category: 'Payments',
    isSystem: true,
  },
  {
    name: createPermission('payments', 'approve', 'all'),
    resource: 'payments',
    action: 'approve',
    scope: 'all',
    description: 'Approve payment operations',
    category: 'Payments',
    isSystem: true,
  },
  {
    name: createPermission('payments', 'export', 'all'),
    resource: 'payments',
    action: 'export',
    scope: 'all',
    description: 'Export payment data',
    category: 'Payments',
    isSystem: true,
  },
  {
    name: createPermission('payments', 'manage', 'all'),
    resource: 'payments',
    action: 'manage',
    scope: 'all',
    description: 'Full payment management',
    category: 'Payments',
    isSystem: true,
  },

  // ============================================================================
  // ADMIN USERS PERMISSIONS
  // ============================================================================
  {
    name: createPermission('admin_users', 'create', 'all'),
    resource: 'admin_users',
    action: 'create',
    scope: 'all',
    description: 'Create admin users',
    category: 'Admin Users',
    isSystem: true,
  },
  {
    name: createPermission('admin_users', 'read', 'all'),
    resource: 'admin_users',
    action: 'read',
    scope: 'all',
    description: 'View admin users',
    category: 'Admin Users',
    isSystem: true,
  },
  {
    name: createPermission('admin_users', 'update', 'all'),
    resource: 'admin_users',
    action: 'update',
    scope: 'all',
    description: 'Update admin users',
    category: 'Admin Users',
    isSystem: true,
  },
  {
    name: createPermission('admin_users', 'delete', 'all'),
    resource: 'admin_users',
    action: 'delete',
    scope: 'all',
    description: 'Delete admin users',
    category: 'Admin Users',
    isSystem: true,
  },
  {
    name: createPermission('admin_users', 'manage', 'all'),
    resource: 'admin_users',
    action: 'manage',
    scope: 'all',
    description: 'Full admin user management',
    category: 'Admin Users',
    isSystem: true,
  },

  // ============================================================================
  // SETTINGS PERMISSIONS
  // ============================================================================
  {
    name: createPermission('settings', 'read', 'all'),
    resource: 'settings',
    action: 'read',
    scope: 'all',
    description: 'View system settings',
    category: 'Settings',
    isSystem: true,
  },
  {
    name: createPermission('settings', 'update', 'all'),
    resource: 'settings',
    action: 'update',
    scope: 'all',
    description: 'Update system settings',
    category: 'Settings',
    isSystem: true,
  },
  {
    name: createPermission('settings', 'manage', 'all'),
    resource: 'settings',
    action: 'manage',
    scope: 'all',
    description: 'Full settings management',
    category: 'Settings',
    isSystem: true,
  },

  // ============================================================================
  // REPORTS PERMISSIONS
  // ============================================================================
  {
    name: createPermission('reports', 'read', 'all'),
    resource: 'reports',
    action: 'read',
    scope: 'all',
    description: 'View reports',
    category: 'Reports',
    isSystem: true,
  },
  {
    name: createPermission('reports', 'create', 'all'),
    resource: 'reports',
    action: 'create',
    scope: 'all',
    description: 'Create custom reports',
    category: 'Reports',
    isSystem: true,
  },
  {
    name: createPermission('reports', 'export', 'all'),
    resource: 'reports',
    action: 'export',
    scope: 'all',
    description: 'Export reports',
    category: 'Reports',
    isSystem: true,
  },
  {
    name: createPermission('reports', 'manage', 'all'),
    resource: 'reports',
    action: 'manage',
    scope: 'all',
    description: 'Full report management',
    category: 'Reports',
    isSystem: true,
  },

  // ============================================================================
  // AUDIT PERMISSIONS
  // ============================================================================
  {
    name: createPermission('audit', 'read', 'all'),
    resource: 'audit',
    action: 'read',
    scope: 'all',
    description: 'View audit logs',
    category: 'Audit',
    isSystem: true,
  },
  {
    name: createPermission('audit', 'export', 'all'),
    resource: 'audit',
    action: 'export',
    scope: 'all',
    description: 'Export audit logs',
    category: 'Audit',
    isSystem: true,
  },

  // ============================================================================
  // INTEGRATIONS PERMISSIONS
  // ============================================================================
  {
    name: createPermission('integrations', 'read', 'all'),
    resource: 'integrations',
    action: 'read',
    scope: 'all',
    description: 'View integrations',
    category: 'Integrations',
    isSystem: true,
  },
  {
    name: createPermission('integrations', 'update', 'all'),
    resource: 'integrations',
    action: 'update',
    scope: 'all',
    description: 'Configure integrations',
    category: 'Integrations',
    isSystem: true,
  },
  {
    name: createPermission('integrations', 'manage', 'all'),
    resource: 'integrations',
    action: 'manage',
    scope: 'all',
    description: 'Full integration management',
    category: 'Integrations',
    isSystem: true,
  },

  // ============================================================================
  // SUPPORT PERMISSIONS
  // ============================================================================
  {
    name: createPermission('support', 'read', 'all'),
    resource: 'support',
    action: 'read',
    scope: 'all',
    description: 'View support tickets',
    category: 'Support',
    isSystem: true,
  },
  {
    name: createPermission('support', 'update', 'all'),
    resource: 'support',
    action: 'update',
    scope: 'all',
    description: 'Update support tickets',
    category: 'Support',
    isSystem: true,
  },
  {
    name: createPermission('support', 'assign', 'all'),
    resource: 'support',
    action: 'assign',
    scope: 'all',
    description: 'Assign support tickets',
    category: 'Support',
    isSystem: true,
  },
  {
    name: createPermission('support', 'manage', 'all'),
    resource: 'support',
    action: 'manage',
    scope: 'all',
    description: 'Full support management',
    category: 'Support',
    isSystem: true,
  },

  // ============================================================================
  // CONTRACTS PERMISSIONS
  // ============================================================================
  {
    name: createPermission('contracts', 'read', 'all'),
    resource: 'contracts',
    action: 'read',
    scope: 'all',
    description: 'View contracts',
    category: 'Contracts',
    isSystem: true,
  },
  {
    name: createPermission('contracts', 'create', 'all'),
    resource: 'contracts',
    action: 'create',
    scope: 'all',
    description: 'Create contracts',
    category: 'Contracts',
    isSystem: true,
  },
  {
    name: createPermission('contracts', 'update', 'all'),
    resource: 'contracts',
    action: 'update',
    scope: 'all',
    description: 'Update contracts',
    category: 'Contracts',
    isSystem: true,
  },
  {
    name: createPermission('contracts', 'send', 'all'),
    resource: 'contracts',
    action: 'send',
    scope: 'all',
    description: 'Send contracts',
    category: 'Contracts',
    isSystem: true,
  },
  {
    name: createPermission('contracts', 'manage', 'all'),
    resource: 'contracts',
    action: 'manage',
    scope: 'all',
    description: 'Full contract management',
    category: 'Contracts',
    isSystem: true,
  },

  // ============================================================================
  // COMMUNICATIONS PERMISSIONS
  // ============================================================================
  {
    name: createPermission('communications', 'read', 'all'),
    resource: 'communications',
    action: 'read',
    scope: 'all',
    description: 'View communications',
    category: 'Communications',
    isSystem: true,
  },
  {
    name: createPermission('communications', 'create', 'all'),
    resource: 'communications',
    action: 'create',
    scope: 'all',
    description: 'Create communications',
    category: 'Communications',
    isSystem: true,
  },
  {
    name: createPermission('communications', 'send', 'all'),
    resource: 'communications',
    action: 'send',
    scope: 'all',
    description: 'Send communications',
    category: 'Communications',
    isSystem: true,
  },
  {
    name: createPermission('communications', 'manage', 'all'),
    resource: 'communications',
    action: 'manage',
    scope: 'all',
    description: 'Full communication management',
    category: 'Communications',
    isSystem: true,
  },

  // ============================================================================
  // ANALYTICS PERMISSIONS
  // ============================================================================
  {
    name: createPermission('analytics', 'read', 'all'),
    resource: 'analytics',
    action: 'read',
    scope: 'all',
    description: 'View analytics',
    category: 'Analytics',
    isSystem: true,
  },
  {
    name: createPermission('analytics', 'export', 'all'),
    resource: 'analytics',
    action: 'export',
    scope: 'all',
    description: 'Export analytics data',
    category: 'Analytics',
    isSystem: true,
  },

  // ============================================================================
  // OPERATIONS PERMISSIONS
  // ============================================================================
  {
    name: createPermission('operations', 'read', 'all'),
    resource: 'operations',
    action: 'read',
    scope: 'all',
    description: 'View operations',
    category: 'Operations',
    isSystem: true,
  },
  {
    name: createPermission('operations', 'update', 'all'),
    resource: 'operations',
    action: 'update',
    scope: 'all',
    description: 'Update operations',
    category: 'Operations',
    isSystem: true,
  },
  {
    name: createPermission('operations', 'assign', 'all'),
    resource: 'operations',
    action: 'assign',
    scope: 'all',
    description: 'Assign operations tasks',
    category: 'Operations',
    isSystem: true,
  },
  {
    name: createPermission('operations', 'manage', 'all'),
    resource: 'operations',
    action: 'manage',
    scope: 'all',
    description: 'Full operations management',
    category: 'Operations',
    isSystem: true,
  },
];

// Default role definitions with their permissions
export const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: 'super_admin',
    displayName: 'Super Admin',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: PERMISSION_DEFINITIONS.map((p) => p.name), // All permissions
  },
  ADMIN: {
    name: 'admin',
    displayName: 'Admin',
    description: 'Standard admin with most permissions',
    isSystem: true,
    permissions: PERMISSION_DEFINITIONS.filter(
      (p) => !p.name.includes('admin_users:delete') && !p.name.includes('settings:update')
    ).map((p) => p.name),
  },
  EQUIPMENT_MANAGER: {
    name: 'equipment_manager',
    displayName: 'Equipment Manager',
    description: 'Equipment-focused permissions',
    isSystem: true,
    permissions: PERMISSION_DEFINITIONS.filter(
      (p) =>
        p.resource === 'equipment' ||
        p.resource === 'bookings' ||
        (p.resource === 'customers' && p.action === 'read')
    ).map((p) => p.name),
  },
  FINANCE_ADMIN: {
    name: 'finance_admin',
    displayName: 'Finance Admin',
    description: 'Payment and financial permissions',
    isSystem: true,
    permissions: PERMISSION_DEFINITIONS.filter(
      (p) =>
        p.resource === 'payments' ||
        p.resource === 'bookings' ||
        (p.resource === 'reports' && p.action === 'read')
    ).map((p) => p.name),
  },
  SUPPORT_ADMIN: {
    name: 'support_admin',
    displayName: 'Support Admin',
    description: 'Customer support permissions',
    isSystem: true,
    permissions: PERMISSION_DEFINITIONS.filter(
      (p) =>
        p.resource === 'support' ||
        p.resource === 'customers' ||
        (p.resource === 'bookings' && ['read', 'update'].includes(p.action))
    ).map((p) => p.name),
  },
  READ_ONLY_ADMIN: {
    name: 'read_only_admin',
    displayName: 'Read-Only Admin',
    description: 'View-only access to all resources',
    isSystem: true,
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.action === 'read').map((p) => p.name),
  },
};

// Helper to get all permission names
export function getAllPermissionNames(): string[] {
  return PERMISSION_DEFINITIONS.map((p) => p.name);
}

// Helper to get permissions by resource
export function getPermissionsByResource(resource: ResourceType): string[] {
  return PERMISSION_DEFINITIONS.filter((p) => p.resource === resource).map((p) => p.name);
}

// Helper to get permissions by action
export function getPermissionsByAction(action: ActionType): string[] {
  return PERMISSION_DEFINITIONS.filter((p) => p.action === action).map((p) => p.name);
}

// Helper to check if permission exists
export function isValidPermission(permission: string): boolean {
  return PERMISSION_DEFINITIONS.some((p) => p.name === permission);
}
