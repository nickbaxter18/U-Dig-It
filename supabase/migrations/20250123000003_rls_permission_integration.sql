-- RLS Permission System Integration
-- Updates RLS policies to use the new permission system
-- Date: 2025-01-23

-- ============================================================================
-- RLS HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has permission (for use in RLS policies)
-- Optimized for RLS with fast cache lookup
CREATE OR REPLACE FUNCTION rls_has_permission(
  p_permission_name VARCHAR(255)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_super_admin BOOLEAN;
  v_cache_updated TIMESTAMPTZ;
  v_cache_age INTERVAL;
  v_permissions_cache JSONB;
  v_has_permission BOOLEAN := false;
BEGIN
  -- Get current user ID
  v_user_id := (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Fast check: Get user role and cache in single query
  SELECT
    role = 'super_admin',
    permissions_cache,
    permissions_updated_at
  INTO
    v_is_super_admin,
    v_permissions_cache,
    v_cache_updated
  FROM users
  WHERE id = v_user_id AND status = 'active';

  -- If user not found or inactive
  IF v_is_super_admin IS NULL THEN
    RETURN false;
  END IF;

  -- Super admin has all permissions
  IF v_is_super_admin THEN
    RETURN true;
  END IF;

  -- Check cache freshness (5 minutes)
  v_cache_age := NOW() - COALESCE(v_cache_updated, '1970-01-01'::TIMESTAMPTZ);

  -- Use cache if fresh
  IF v_cache_age < INTERVAL '5 minutes' AND v_permissions_cache IS NOT NULL THEN
    -- Check if permission is in cache
    RETURN v_permissions_cache ? p_permission_name;
  END IF;

  -- Cache expired or missing - use permission function (which will rebuild cache)
  SELECT has_permission(v_user_id, p_permission_name) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$;

-- Function to check if user has any of the specified permissions
CREATE OR REPLACE FUNCTION rls_has_any_permission(
  p_permission_names VARCHAR(255)[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_super_admin BOOLEAN;
BEGIN
  v_user_id := (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user is super_admin
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = v_user_id
    AND role = 'super_admin'
    AND status = 'active'
  ) INTO v_is_super_admin;

  IF v_is_super_admin THEN
    RETURN true;
  END IF;

  -- Check permissions
  RETURN has_any_permission(v_user_id, p_permission_names);
END;
$$;

-- Optimized function to check if user is admin (for backward compatibility)
-- Uses permission system but checks for admin role as fallback
CREATE OR REPLACE FUNCTION rls_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user has any admin permission OR has admin role
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = v_user_id
    AND status = 'active'
    AND (
      role IN ('admin', 'super_admin')
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = v_user_id
        AND r.name IN ('admin', 'super_admin', 'equipment_manager', 'finance_admin', 'support_admin')
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      )
    )
  );
END;
$$;

-- ============================================================================
-- UPDATE BOOKINGS RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;

-- New policies using permission system
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = customer_id
    OR rls_has_permission('bookings:read:all')
  );

CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL USING (
    rls_has_permission('bookings:manage:all')
    OR (
      auth.uid() = customer_id
      AND rls_has_any_permission(ARRAY['bookings:update:own', 'bookings:cancel:own'])
    )
  )
  WITH CHECK (
    rls_has_permission('bookings:manage:all')
    OR (
      auth.uid() = customer_id
      AND rls_has_any_permission(ARRAY['bookings:update:own', 'bookings:cancel:own'])
    )
  );

-- ============================================================================
-- UPDATE EQUIPMENT RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Equipment is manageable by admins" ON equipment;

-- New policy using permission system
CREATE POLICY "Equipment is manageable by admins" ON equipment
  FOR ALL USING (
    rls_has_permission('equipment:manage:all')
    OR rls_has_any_permission(ARRAY['equipment:create:all', 'equipment:update:all', 'equipment:delete:all'])
  )
  WITH CHECK (
    rls_has_permission('equipment:manage:all')
    OR rls_has_any_permission(ARRAY['equipment:create:all', 'equipment:update:all', 'equipment:delete:all'])
  );

-- ============================================================================
-- UPDATE PAYMENTS RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;

-- New policies using permission system
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.customer_id = auth.uid()
    )
    OR rls_has_permission('payments:read:all')
  );

CREATE POLICY "Admins can manage all payments" ON payments
  FOR ALL USING (
    rls_has_permission('payments:manage:all')
    OR rls_has_any_permission(ARRAY['payments:refund:all', 'payments:approve:all'])
  )
  WITH CHECK (
    rls_has_permission('payments:manage:all')
    OR rls_has_any_permission(ARRAY['payments:refund:all', 'payments:approve:all'])
  );

-- ============================================================================
-- UPDATE USERS RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON users;

-- New policies using permission system
CREATE POLICY "Admins can view all profiles" ON users
  FOR SELECT USING (
    auth.uid() = id
    OR rls_has_permission('customers:read:all')
    OR rls_has_permission('admin_users:read:all')
  );

CREATE POLICY "Admins can manage all profiles" ON users
  FOR ALL USING (
    auth.uid() = id
    OR rls_has_permission('customers:manage:all')
    OR rls_has_permission('admin_users:manage:all')
  )
  WITH CHECK (
    auth.uid() = id
    OR rls_has_permission('customers:manage:all')
    OR rls_has_permission('admin_users:manage:all')
  );

-- ============================================================================
-- UPDATE CONTRACTS RLS POLICIES
-- ============================================================================

-- Drop old admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can manage all contracts" ON contracts;

-- New policies using permission system
CREATE POLICY "Admins can view all contracts" ON contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = contracts.booking_id
      AND bookings.customer_id = auth.uid()
    )
    OR rls_has_permission('contracts:read:all')
  );

CREATE POLICY "Admins can manage all contracts" ON contracts
  FOR ALL USING (
    rls_has_permission('contracts:manage:all')
    OR rls_has_any_permission(ARRAY['contracts:create:all', 'contracts:update:all', 'contracts:send:all'])
  )
  WITH CHECK (
    rls_has_permission('contracts:manage:all')
    OR rls_has_any_permission(ARRAY['contracts:create:all', 'contracts:update:all', 'contracts:send:all'])
  );

-- ============================================================================
-- UPDATE EQUIPMENT MAINTENANCE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can manage maintenance" ON equipment_maintenance;

-- New policy using permission system
CREATE POLICY "Admins can manage maintenance" ON equipment_maintenance
  FOR ALL USING (
    rls_has_permission('equipment:manage:all')
    OR rls_is_admin()
  )
  WITH CHECK (
    rls_has_permission('equipment:manage:all')
    OR rls_is_admin()
  );

-- ============================================================================
-- UPDATE ANALYTICS DATA RLS POLICIES
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Only admins can view analytics" ON analytics_data;

-- New policy using permission system
CREATE POLICY "Only admins can view analytics" ON analytics_data
  FOR SELECT USING (
    rls_has_permission('analytics:read:all')
    OR rls_is_admin()
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant execute on RLS helper functions
GRANT EXECUTE ON FUNCTION rls_has_permission(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION rls_has_any_permission(VARCHAR[]) TO authenticated;
GRANT EXECUTE ON FUNCTION rls_is_admin() TO authenticated;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Ensure indexes exist for permission checks
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_roles_user_active ON user_roles(user_id) WHERE expires_at IS NULL OR expires_at > NOW();

