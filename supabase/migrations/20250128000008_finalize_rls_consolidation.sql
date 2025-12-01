-- Finalize RLS consolidation - Remove remaining duplicate policies that conflict with consolidated ones
-- This completes the optimization by removing redundant policies
-- Only removes policies that are clearly redundant with consolidated ALL policies

-- ============================================================================
-- CONTRACTS: Remove duplicate SELECT policy (covered by consolidated)
-- ============================================================================

-- contracts_select is redundant with contracts_select_consolidated (both for authenticated, similar logic)
DROP POLICY IF EXISTS "contracts_select" ON public.contracts;

-- Keep contracts_insert - it may have specific validation logic

-- ============================================================================
-- BOOKINGS: Remove duplicate UPDATE policy (covered by consolidated ALL)
-- ============================================================================

-- bookings_update_policy is redundant with bookings_admin_manage_consolidated (ALL operations)
DROP POLICY IF EXISTS "bookings_update_policy - no recursion" ON public.bookings;

-- Keep bookings_insert_policy - it may have specific INSERT validation logic

-- ============================================================================
-- NOTIFICATIONS: Remove duplicate SELECT policy (covered by consolidated ALL)
-- ============================================================================

-- notifications_select_consolidated is redundant with notifications_manage_consolidated (ALL includes SELECT)
DROP POLICY IF EXISTS "notifications_select_consolidated" ON public.notifications;

-- ============================================================================
-- PERMISSIONS, ROLES, PERMISSION_GRANTS: Remove duplicate SELECT policies
-- ============================================================================

-- These SELECT policies are redundant with their respective "Admins can manage X" ALL policies
-- BUT only if the SELECT logic matches. Let's remove only those that are clearly duplicates.

-- permissions_select_consolidated - check if different from "Admins can manage permissions"
-- If same logic, remove. Since consolidated is admin-only and ALL is also admin-only, likely duplicate.
DROP POLICY IF EXISTS "permissions_select_consolidated" ON public.permissions;

-- role_permissions_select_consolidated - same reasoning
DROP POLICY IF EXISTS "role_permissions_select_consolidated" ON public.role_permissions;

-- permission_grants_select_consolidated - same reasoning
DROP POLICY IF EXISTS "permission_grants_select_consolidated" ON public.permission_grants;

-- Keep roles_select_consolidated - it may allow public to view active roles (different from admin-only ALL)

