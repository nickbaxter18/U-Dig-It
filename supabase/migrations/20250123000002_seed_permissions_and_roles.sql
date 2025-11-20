-- Seed Permissions and Default Roles
-- This migration populates the permission system with default data

-- Insert all permissions
INSERT INTO permissions (name, resource, action, scope, description, category, is_system)
VALUES
  -- Bookings
  ('bookings:create:all', 'bookings', 'create', 'all', 'Create new bookings', 'Bookings', true),
  ('bookings:read:all', 'bookings', 'read', 'all', 'View all bookings', 'Bookings', true),
  ('bookings:read:own', 'bookings', 'read', 'own', 'View own bookings only', 'Bookings', true),
  ('bookings:update:all', 'bookings', 'update', 'all', 'Update any booking', 'Bookings', true),
  ('bookings:update:own', 'bookings', 'update', 'own', 'Update own bookings only', 'Bookings', true),
  ('bookings:delete:all', 'bookings', 'delete', 'all', 'Delete any booking', 'Bookings', true),
  ('bookings:cancel:all', 'bookings', 'cancel', 'all', 'Cancel any booking', 'Bookings', true),
  ('bookings:approve:all', 'bookings', 'approve', 'all', 'Approve bookings', 'Bookings', true),
  ('bookings:export:all', 'bookings', 'export', 'all', 'Export booking data', 'Bookings', true),
  ('bookings:manage:all', 'bookings', 'manage', 'all', 'Full booking management', 'Bookings', true),

  -- Equipment
  ('equipment:create:all', 'equipment', 'create', 'all', 'Add new equipment', 'Equipment', true),
  ('equipment:read:all', 'equipment', 'read', 'all', 'View all equipment', 'Equipment', true),
  ('equipment:update:all', 'equipment', 'update', 'all', 'Update equipment details', 'Equipment', true),
  ('equipment:delete:all', 'equipment', 'delete', 'all', 'Delete equipment', 'Equipment', true),
  ('equipment:manage:all', 'equipment', 'manage', 'all', 'Full equipment management', 'Equipment', true),

  -- Customers
  ('customers:create:all', 'customers', 'create', 'all', 'Create customer accounts', 'Customers', true),
  ('customers:read:all', 'customers', 'read', 'all', 'View all customers', 'Customers', true),
  ('customers:read:own', 'customers', 'read', 'own', 'View own profile only', 'Customers', true),
  ('customers:update:all', 'customers', 'update', 'all', 'Update any customer', 'Customers', true),
  ('customers:update:own', 'customers', 'update', 'own', 'Update own profile', 'Customers', true),
  ('customers:delete:all', 'customers', 'delete', 'all', 'Delete customer accounts', 'Customers', true),
  ('customers:export:all', 'customers', 'export', 'all', 'Export customer data', 'Customers', true),
  ('customers:manage:all', 'customers', 'manage', 'all', 'Full customer management', 'Customers', true),

  -- Payments
  ('payments:read:all', 'payments', 'read', 'all', 'View all payments', 'Payments', true),
  ('payments:read:own', 'payments', 'read', 'own', 'View own payments only', 'Payments', true),
  ('payments:refund:all', 'payments', 'refund', 'all', 'Process refunds', 'Payments', true),
  ('payments:approve:all', 'payments', 'approve', 'all', 'Approve payment operations', 'Payments', true),
  ('payments:export:all', 'payments', 'export', 'all', 'Export payment data', 'Payments', true),
  ('payments:manage:all', 'payments', 'manage', 'all', 'Full payment management', 'Payments', true),

  -- Admin Users
  ('admin_users:create:all', 'admin_users', 'create', 'all', 'Create admin users', 'Admin Users', true),
  ('admin_users:read:all', 'admin_users', 'read', 'all', 'View admin users', 'Admin Users', true),
  ('admin_users:update:all', 'admin_users', 'update', 'all', 'Update admin users', 'Admin Users', true),
  ('admin_users:delete:all', 'admin_users', 'delete', 'all', 'Delete admin users', 'Admin Users', true),
  ('admin_users:manage:all', 'admin_users', 'manage', 'all', 'Full admin user management', 'Admin Users', true),

  -- Settings
  ('settings:read:all', 'settings', 'read', 'all', 'View system settings', 'Settings', true),
  ('settings:update:all', 'settings', 'update', 'all', 'Update system settings', 'Settings', true),
  ('settings:manage:all', 'settings', 'manage', 'all', 'Full settings management', 'Settings', true),

  -- Reports
  ('reports:read:all', 'reports', 'read', 'all', 'View reports', 'Reports', true),
  ('reports:create:all', 'reports', 'create', 'all', 'Create custom reports', 'Reports', true),
  ('reports:export:all', 'reports', 'export', 'all', 'Export reports', 'Reports', true),
  ('reports:manage:all', 'reports', 'manage', 'all', 'Full report management', 'Reports', true),

  -- Audit
  ('audit:read:all', 'audit', 'read', 'all', 'View audit logs', 'Audit', true),
  ('audit:export:all', 'audit', 'export', 'all', 'Export audit logs', 'Audit', true),

  -- Integrations
  ('integrations:read:all', 'integrations', 'read', 'all', 'View integrations', 'Integrations', true),
  ('integrations:update:all', 'integrations', 'update', 'all', 'Configure integrations', 'Integrations', true),
  ('integrations:manage:all', 'integrations', 'manage', 'all', 'Full integration management', 'Integrations', true),

  -- Support
  ('support:read:all', 'support', 'read', 'all', 'View support tickets', 'Support', true),
  ('support:update:all', 'support', 'update', 'all', 'Update support tickets', 'Support', true),
  ('support:assign:all', 'support', 'assign', 'all', 'Assign support tickets', 'Support', true),
  ('support:manage:all', 'support', 'manage', 'all', 'Full support management', 'Support', true),

  -- Contracts
  ('contracts:read:all', 'contracts', 'read', 'all', 'View contracts', 'Contracts', true),
  ('contracts:create:all', 'contracts', 'create', 'all', 'Create contracts', 'Contracts', true),
  ('contracts:update:all', 'contracts', 'update', 'all', 'Update contracts', 'Contracts', true),
  ('contracts:send:all', 'contracts', 'send', 'all', 'Send contracts', 'Contracts', true),
  ('contracts:manage:all', 'contracts', 'manage', 'all', 'Full contract management', 'Contracts', true),

  -- Communications
  ('communications:read:all', 'communications', 'read', 'all', 'View communications', 'Communications', true),
  ('communications:create:all', 'communications', 'create', 'all', 'Create communications', 'Communications', true),
  ('communications:send:all', 'communications', 'send', 'all', 'Send communications', 'Communications', true),
  ('communications:manage:all', 'communications', 'manage', 'all', 'Full communication management', 'Communications', true),

  -- Analytics
  ('analytics:read:all', 'analytics', 'read', 'all', 'View analytics', 'Analytics', true),
  ('analytics:export:all', 'analytics', 'export', 'all', 'Export analytics data', 'Analytics', true),

  -- Operations
  ('operations:read:all', 'operations', 'read', 'all', 'View operations', 'Operations', true),
  ('operations:update:all', 'operations', 'update', 'all', 'Update operations', 'Operations', true),
  ('operations:assign:all', 'operations', 'assign', 'all', 'Assign operations tasks', 'Operations', true),
  ('operations:manage:all', 'operations', 'manage', 'all', 'Full operations management', 'Operations', true)
ON CONFLICT (name) DO NOTHING;

-- Create default roles
INSERT INTO roles (name, display_name, description, is_system, is_active)
VALUES
  ('super_admin', 'Super Admin', 'Full system access with all permissions', true, true),
  ('admin', 'Admin', 'Standard admin with most permissions', true, true),
  ('equipment_manager', 'Equipment Manager', 'Equipment-focused permissions', true, true),
  ('finance_admin', 'Finance Admin', 'Payment and financial permissions', true, true),
  ('support_admin', 'Support Admin', 'Customer support permissions', true, true),
  ('read_only_admin', 'Read-Only Admin', 'View-only access to all resources', true, true)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to Super Admin (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Admin (most permissions except sensitive operations)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.name NOT IN ('admin_users:delete:all', 'settings:update:all')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Equipment Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'equipment_manager'
AND (
  p.resource = 'equipment'
  OR p.resource = 'bookings'
  OR (p.resource = 'customers' AND p.action = 'read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Finance Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'finance_admin'
AND (
  p.resource = 'payments'
  OR p.resource = 'bookings'
  OR (p.resource = 'reports' AND p.action = 'read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Support Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'support_admin'
AND (
  p.resource = 'support'
  OR p.resource = 'customers'
  OR (p.resource = 'bookings' AND p.action IN ('read', 'update'))
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Read-Only Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'read_only_admin'
AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Migrate existing users to new role system
-- Map existing roles to new role system
DO $$
DECLARE
  v_super_admin_role_id UUID;
  v_admin_role_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO v_super_admin_role_id FROM roles WHERE name = 'super_admin';
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin';

  -- Assign super_admin role to existing super_admin users
  INSERT INTO user_roles (user_id, role_id)
  SELECT id, v_super_admin_role_id
  FROM users
  WHERE role = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = users.id AND role_id = v_super_admin_role_id
  );

  -- Assign admin role to existing admin users
  INSERT INTO user_roles (user_id, role_id)
  SELECT id, v_admin_role_id
  FROM users
  WHERE role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = users.id AND role_id = v_admin_role_id
  );
END $$;


