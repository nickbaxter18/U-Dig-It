-- Fix RLS Circular Dependencies on Contracts and Payments Tables
-- Date: 2025-11-18
-- Purpose: Fix circular dependencies in admin policies on contracts and payments tables

-- ============================================================================
-- Fix 1: Contracts Table - Admin View Policy
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all contracts" ON contracts;
CREATE POLICY "Admins can view all contracts - no recursion" ON contracts
FOR SELECT TO authenticated
USING (
  check_is_admin((SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Admins can manage all contracts" ON contracts;
CREATE POLICY "Admins can manage all contracts - no recursion" ON contracts
FOR ALL TO authenticated
USING (
  check_is_admin((SELECT auth.uid()))
);

-- ============================================================================
-- Fix 2: Payments Table - Admin View Policy
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view payment health" ON payments;
CREATE POLICY "Admins can view payment health - no recursion" ON payments
FOR SELECT TO authenticated
USING (
  check_is_admin((SELECT auth.uid()))
);

-- ============================================================================
-- Add comments
-- ============================================================================
COMMENT ON POLICY "Admins can view all contracts - no recursion" ON contracts IS
'Uses SECURITY DEFINER function to avoid circular dependency when checking admin status.';

COMMENT ON POLICY "Admins can manage all contracts - no recursion" ON contracts IS
'Uses SECURITY DEFINER function to avoid circular dependency when checking admin status.';

COMMENT ON POLICY "Admins can view payment health - no recursion" ON payments IS
'Uses SECURITY DEFINER function to avoid circular dependency when checking admin status.';

