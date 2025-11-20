-- Fix Users Table RLS Circular Dependency
-- Date: 2025-11-18
-- Purpose: Fix circular dependency where admin policies query the users table they're protecting
-- Issue: "Admins can view all profiles" policy tries to SELECT from users to check if user is admin,
--        but this policy IS ON the users table, creating infinite recursion!

-- ============================================================================
-- Step 1: Drop problematic policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON users;

-- ============================================================================
-- Step 2: Create helper function that uses service role to check admin status
-- ============================================================================
-- This function uses SECURITY DEFINER to bypass RLS and check admin status
CREATE OR REPLACE FUNCTION public.check_is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with function owner's privileges (bypasses RLS)
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.check_is_admin(UUID) TO authenticated;

-- ============================================================================
-- Step 3: Recreate policies using the helper function
-- ============================================================================

-- Policy: Admins can view all profiles (using helper function)
CREATE POLICY "Admins can view all profiles - no recursion" ON users
FOR SELECT TO authenticated
USING (
  check_is_admin((SELECT auth.uid()))
);

-- Policy: Admins can manage all profiles (using helper function)
CREATE POLICY "Admins can manage all profiles - no recursion" ON users
FOR ALL TO authenticated
USING (
  check_is_admin((SELECT auth.uid()))
);

-- ============================================================================
-- Step 4: Ensure base user policy exists (users can view their own record)
-- ============================================================================
-- This policy should already exist as "users_select_for_rls"
-- But let's verify it handles the base case (user selecting their own record)

-- Drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "users_select_for_rls" ON users;
CREATE POLICY "users_select_own_profile" ON users
FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())  -- Users can always see their own profile
);

-- ============================================================================
-- Add comments
-- ============================================================================
COMMENT ON FUNCTION public.check_is_admin(UUID) IS
'SECURITY DEFINER function to check admin status without RLS recursion. Bypasses RLS policies on users table.';

COMMENT ON POLICY "Admins can view all profiles - no recursion" ON users IS
'Uses SECURITY DEFINER function to avoid circular dependency when checking admin status.';

COMMENT ON POLICY "Admins can manage all profiles - no recursion" ON users IS
'Uses SECURITY DEFINER function to avoid circular dependency when checking admin status.';

COMMENT ON POLICY "users_select_own_profile" ON users IS
'Base policy: Users can always select their own profile. No circular dependency.';

