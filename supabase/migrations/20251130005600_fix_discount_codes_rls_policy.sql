-- Fix RLS Policy for Discount Codes
-- Date: 2025-11-30
-- Purpose: Add WITH CHECK clause to allow INSERT operations for admins
--
-- The existing policy "Admins can manage discount codes" only has USING clause,
-- which is sufficient for SELECT, UPDATE, and DELETE, but INSERT operations
-- require a WITH CHECK clause to validate the new row being inserted.

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage discount codes" ON discount_codes;

-- Recreate policy with WITH CHECK clause for INSERT operations
CREATE POLICY "Admins can manage discount codes" ON discount_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Ensure RLS is enabled
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;



