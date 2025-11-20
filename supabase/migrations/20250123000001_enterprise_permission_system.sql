-- Enterprise-Grade Permission System
-- Date: 2025-01-23
-- Purpose: Create comprehensive RBAC permission system with granular permissions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Permissions table - Master catalog of all permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL, -- Format: resource:action:scope (e.g., "equipment:create:all")
  resource VARCHAR(100) NOT NULL, -- Resource category (equipment, bookings, etc.)
  action VARCHAR(50) NOT NULL, -- Action type (create, read, update, delete, etc.)
  scope VARCHAR(50) NOT NULL DEFAULT 'all', -- Scope (own, department, all)
  description TEXT,
  category VARCHAR(100), -- For grouping in UI
  is_system BOOLEAN DEFAULT false, -- System permissions cannot be deleted
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles table - Role definitions
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- System roles cannot be deleted
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional role metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role-Permission mapping (many-to-many)
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(role_id, permission_id)
);

-- User-Role mapping (many-to-many) - Users can have multiple roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ, -- Optional expiration for time-based permissions
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, role_id)
);

-- Direct permission grants (overrides roles) - For special cases
CREATE TABLE permission_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  resource_id UUID, -- Optional: specific resource instance (e.g., specific equipment)
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ, -- Optional expiration
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, permission_id, resource_id)
);

-- Permission audit log - Track all permission changes
CREATE TABLE permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL, -- granted, revoked, role_assigned, role_removed, etc.
  target_type VARCHAR(50) NOT NULL, -- user, role, permission
  target_id UUID NOT NULL,
  permission_id UUID REFERENCES permissions(id) ON DELETE SET NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Permissions indexes
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_scope ON permissions(scope);
CREATE INDEX idx_permissions_name ON permissions(name);

-- Roles indexes
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_active ON roles(is_active) WHERE is_active = true;

-- Role-Permission indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- User-Role indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- Permission grants indexes
CREATE INDEX idx_permission_grants_user ON permission_grants(user_id);
CREATE INDEX idx_permission_grants_permission ON permission_grants(permission_id);
CREATE INDEX idx_permission_grants_resource ON permission_grants(resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX idx_permission_grants_expires ON permission_grants(expires_at) WHERE expires_at IS NOT NULL;

-- Audit log indexes
CREATE INDEX idx_permission_audit_user ON permission_audit_log(user_id);
CREATE INDEX idx_permission_audit_performed_by ON permission_audit_log(performed_by);
CREATE INDEX idx_permission_audit_action ON permission_audit_log(action);
CREATE INDEX idx_permission_audit_created ON permission_audit_log(created_at DESC);
CREATE INDEX idx_permission_audit_target ON permission_audit_log(target_type, target_id);

-- ============================================================================
-- ENHANCE USERS TABLE
-- ============================================================================

-- Add permission cache columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS permissions_cache JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS permissions_updated_at TIMESTAMPTZ;

-- Index for permission cache queries
CREATE INDEX IF NOT EXISTS idx_users_permissions_cache ON users USING GIN(permissions_cache);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_permission_name VARCHAR(255),
  p_resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_has_permission BOOLEAN := false;
  v_permission_id UUID;
  v_is_super_admin BOOLEAN;
BEGIN
  -- Check if user is super_admin (has all permissions)
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = p_user_id
    AND role = 'super_admin'
    AND status = 'active'
  ) INTO v_is_super_admin;

  IF v_is_super_admin THEN
    RETURN true;
  END IF;

  -- Get permission ID
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE name = p_permission_name;

  IF v_permission_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check direct permission grants
  SELECT EXISTS (
    SELECT 1 FROM permission_grants
    WHERE user_id = p_user_id
    AND permission_id = v_permission_id
    AND (p_resource_id IS NULL OR resource_id = p_resource_id OR resource_id IS NULL)
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_has_permission;

  IF v_has_permission THEN
    RETURN true;
  END IF;

  -- Check role-based permissions
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = p_user_id
    AND rp.permission_id = v_permission_id
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$;

-- Function to get all permissions for a user (cached)
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(permission_name VARCHAR(255))
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_is_super_admin BOOLEAN;
  v_cache_updated TIMESTAMPTZ;
  v_cache_age INTERVAL;
BEGIN
  -- Check if user is super_admin
  SELECT role = 'super_admin', permissions_updated_at
  INTO v_is_super_admin, v_cache_updated
  FROM users
  WHERE id = p_user_id AND status = 'active';

  IF v_is_super_admin THEN
    -- Super admin has all permissions
    RETURN QUERY
    SELECT p.name::VARCHAR(255)
    FROM permissions p;
    RETURN;
  END IF;

  -- Check cache freshness (5 minutes)
  v_cache_age := NOW() - COALESCE(v_cache_updated, '1970-01-01'::TIMESTAMPTZ);

  IF v_cache_age < INTERVAL '5 minutes' THEN
    -- Return cached permissions
    RETURN QUERY
    SELECT jsonb_array_elements_text(permissions_cache)::VARCHAR(255)
    FROM users
    WHERE id = p_user_id;
    RETURN;
  END IF;

  -- Cache expired or missing - rebuild
  RETURN QUERY
  WITH user_permissions AS (
    -- Direct grants
    SELECT DISTINCT p.name
    FROM permission_grants pg
    JOIN permissions p ON pg.permission_id = p.id
    WHERE pg.user_id = p_user_id
    AND (pg.expires_at IS NULL OR pg.expires_at > NOW())

    UNION

    -- Role-based permissions
    SELECT DISTINCT p.name
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  )
  SELECT up.name::VARCHAR(255)
  FROM user_permissions up
  ORDER BY up.name;

  -- Update cache (async - don't block)
  -- This will be handled by a trigger or background job
END;
$$;

-- Function to rebuild permission cache for a user
CREATE OR REPLACE FUNCTION rebuild_user_permission_cache(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_permissions JSONB;
BEGIN
  -- Get all permissions for user
  SELECT COALESCE(jsonb_agg(permission_name ORDER BY permission_name), '[]'::jsonb)
  INTO v_permissions
  FROM get_user_permissions(p_user_id);

  -- Update cache
  UPDATE users
  SET
    permissions_cache = v_permissions,
    permissions_updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Function to check if user has any of the specified permissions
CREATE OR REPLACE FUNCTION has_any_permission(
  p_user_id UUID,
  p_permission_names VARCHAR(255)[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_permission_name VARCHAR(255);
BEGIN
  FOREACH v_permission_name IN ARRAY p_permission_names
  LOOP
    IF has_permission(p_user_id, v_permission_name) THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

-- Function to check if user has all of the specified permissions
CREATE OR REPLACE FUNCTION has_all_permissions(
  p_user_id UUID,
  p_permission_names VARCHAR(255)[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_permission_name VARCHAR(255);
BEGIN
  FOREACH v_permission_name IN ARRAY p_permission_names
  LOOP
    IF NOT has_permission(p_user_id, v_permission_name) THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at on permissions
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_permissions_updated_at();

-- Trigger to update updated_at on roles
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_roles_updated_at();

-- Trigger to invalidate permission cache when user roles change
CREATE OR REPLACE FUNCTION invalidate_permission_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Invalidate cache for affected user
  UPDATE users
  SET permissions_updated_at = NULL
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invalidate_cache_on_user_role_change
AFTER INSERT OR UPDATE OR DELETE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION invalidate_permission_cache();

CREATE TRIGGER invalidate_cache_on_permission_grant
AFTER INSERT OR UPDATE OR DELETE ON permission_grants
FOR EACH ROW
EXECUTE FUNCTION invalidate_permission_cache();

CREATE TRIGGER invalidate_cache_on_role_permission_change
AFTER INSERT OR UPDATE OR DELETE ON role_permissions
FOR EACH ROW
EXECUTE FUNCTION invalidate_permission_cache();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all permission tables
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

-- Permissions table policies
CREATE POLICY "Everyone can view permissions" ON permissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage permissions" ON permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );

-- Roles table policies
CREATE POLICY "Everyone can view active roles" ON roles
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage roles" ON roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );

-- Role-Permission policies
CREATE POLICY "Admins can view role permissions" ON role_permissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage role permissions" ON role_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );

-- User-Role policies
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all user roles" ON user_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage user roles" ON user_roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );

-- Permission grants policies
CREATE POLICY "Users can view own permission grants" ON permission_grants
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all permission grants" ON permission_grants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage permission grants" ON permission_grants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );

-- Audit log policies
CREATE POLICY "Admins can view audit log" ON permission_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert audit log" ON permission_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true); -- All authenticated users can create audit entries (system will use service role)

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION has_permission(UUID, VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rebuild_user_permission_cache(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_any_permission(UUID, VARCHAR[]) TO authenticated;
GRANT EXECUTE ON FUNCTION has_all_permissions(UUID, VARCHAR[]) TO authenticated;

-- Grant service role full access
GRANT ALL ON permissions TO service_role;
GRANT ALL ON roles TO service_role;
GRANT ALL ON role_permissions TO service_role;
GRANT ALL ON user_roles TO service_role;
GRANT ALL ON permission_grants TO service_role;
GRANT ALL ON permission_audit_log TO service_role;


