-- Final RLS optimizations: Standardize auth.uid() wrapper and consolidate remaining duplicates
-- Focus on critical high-traffic tables: bookings, contracts, payments, users, notifications

-- ============================================================================
-- BOOKINGS: Consolidate duplicate policies and standardize auth.uid() wrapper
-- ============================================================================

-- Consolidate and optimize bookings SELECT policies
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings - no recursion" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_policy - no recursion" ON public.bookings;

-- Create consolidated SELECT policy
CREATE POLICY "bookings_select_consolidated" ON public.bookings
FOR SELECT TO public
USING (
    ((SELECT auth.uid()) = "customerId")
    OR check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('bookings:read:all')
);

-- Create consolidated ALL operations policy for admins
CREATE POLICY "bookings_admin_manage_consolidated" ON public.bookings
FOR ALL TO authenticated
USING (
    check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('bookings:manage:all')
    OR (((SELECT auth.uid()) = "customerId") AND rls_has_any_permission(ARRAY['bookings:update:own', 'bookings:cancel:own']))
)
WITH CHECK (
    check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('bookings:manage:all')
    OR (((SELECT auth.uid()) = "customerId") AND rls_has_any_permission(ARRAY['bookings:update:own', 'bookings:cancel:own']))
);

-- Keep bookings_insert_policy and bookings_update_policy as they are, but ensure they use wrapper
-- (They should already use it from previous migration, but verify)

-- ============================================================================
-- CONTRACTS: Consolidate duplicate policies and standardize auth.uid() wrapper
-- ============================================================================

-- Consolidate contracts policies
DROP POLICY IF EXISTS "Admins can manage all contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can manage all contracts - no recursion" ON public.contracts;
DROP POLICY IF EXISTS "Admins can view all contracts" ON public.contracts;

-- Create consolidated SELECT policy
CREATE POLICY "contracts_select_consolidated" ON public.contracts
FOR SELECT TO public
USING (
    (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = contracts."bookingId"
        AND b."customerId" = (SELECT auth.uid())
    ))
    OR check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('contracts:read:all')
);

-- Create consolidated ALL operations policy
CREATE POLICY "contracts_admin_manage_consolidated" ON public.contracts
FOR ALL TO authenticated
USING (
    check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('contracts:manage:all')
    OR rls_has_any_permission(ARRAY['contracts:create:all', 'contracts:update:all', 'contracts:send:all'])
)
WITH CHECK (
    check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('contracts:manage:all')
    OR rls_has_any_permission(ARRAY['contracts:create:all', 'contracts:update:all', 'contracts:send:all'])
);

-- Update contracts_update to use wrapper (if it doesn't already)
DROP POLICY IF EXISTS "contracts_update" ON public.contracts;
CREATE POLICY "contracts_update_consolidated" ON public.contracts
FOR UPDATE TO authenticated
USING (
    (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = contracts."bookingId"
        AND b."customerId" = (SELECT auth.uid())
    ))
    OR check_is_admin((SELECT auth.uid()))
)
WITH CHECK (
    (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = contracts."bookingId"
        AND b."customerId" = (SELECT auth.uid())
    ))
    OR check_is_admin((SELECT auth.uid()))
);

-- ============================================================================
-- PAYMENTS: Consolidate duplicate policies and standardize auth.uid() wrapper
-- ============================================================================

-- Consolidate payments SELECT policies
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view payment health - no recursion" ON public.payments;
DROP POLICY IF EXISTS "payments_authenticated_access" ON public.payments;

-- Create consolidated SELECT policy
CREATE POLICY "payments_select_consolidated" ON public.payments
FOR SELECT TO public
USING (
    (EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = payments."bookingId"
        AND bookings."customerId" = (SELECT auth.uid())
    ))
    OR check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('payments:read:all')
);

-- Create consolidated ALL operations policy
CREATE POLICY "payments_admin_manage_consolidated" ON public.payments
FOR ALL TO authenticated
USING (
    (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = payments."bookingId"
        AND b."customerId" = (SELECT auth.uid())
    ))
    OR check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('payments:manage:all')
    OR rls_has_any_permission(ARRAY['payments:refund:all', 'payments:approve:all'])
)
WITH CHECK (
    (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = payments."bookingId"
        AND b."customerId" = (SELECT auth.uid())
    ))
    OR check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('payments:manage:all')
    OR rls_has_any_permission(ARRAY['payments:refund:all', 'payments:approve:all'])
);

-- ============================================================================
-- USERS: Consolidate duplicate policies and standardize auth.uid() wrapper
-- ============================================================================

-- Consolidate users policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all profiles - no recursion" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;

-- Create consolidated SELECT policy
CREATE POLICY "users_select_consolidated" ON public.users
FOR SELECT TO public
USING (
    ((SELECT auth.uid()) = id)
    OR check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('customers:read:all')
    OR rls_has_permission('admin_users:read:all')
);

-- Create consolidated ALL operations policy
CREATE POLICY "users_admin_manage_consolidated" ON public.users
FOR ALL TO authenticated
USING (
    ((SELECT auth.uid()) = id)
    OR check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('customers:manage:all')
    OR rls_has_permission('admin_users:manage:all')
)
WITH CHECK (
    ((SELECT auth.uid()) = id)
    OR check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('customers:manage:all')
    OR rls_has_permission('admin_users:manage:all')
);

-- Update users_select_own_profile and users_update_own_record to use wrapper
DROP POLICY IF EXISTS "users_select_own_profile" ON public.users;
CREATE POLICY "users_select_own_profile" ON public.users
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "users_update_own_record" ON public.users;
CREATE POLICY "users_update_own_record" ON public.users
FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- ============================================================================
-- NOTIFICATIONS: Consolidate duplicate policies and standardize auth.uid() wrapper
-- ============================================================================

-- Consolidate notifications policies
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_authenticated_manage" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;

-- Create consolidated SELECT policy
CREATE POLICY "notifications_select_consolidated" ON public.notifications
FOR SELECT TO authenticated
USING (
    (user_id = (SELECT auth.uid()))
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
);

-- Create consolidated ALL operations policy
CREATE POLICY "notifications_manage_consolidated" ON public.notifications
FOR ALL TO authenticated
USING (
    (user_id = (SELECT auth.uid()))
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    (user_id = (SELECT auth.uid()))
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
);

-- Keep "Users can create their notifications" as is, but ensure it uses wrapper
DROP POLICY IF EXISTS "Users can create their notifications" ON public.notifications;
CREATE POLICY "Users can create their notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- ALERTS: Standardize auth.uid() wrapper
-- ============================================================================

-- Update alerts policies to use wrapper
DROP POLICY IF EXISTS "alerts_admin_read" ON public.alerts;
CREATE POLICY "alerts_admin_read" ON public.alerts
FOR SELECT TO authenticated
USING (
    ((SELECT auth.role()) = 'service_role')
    OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = (SELECT auth.uid())
        AND u.role IN ('admin', 'super_admin')
    )
);

DROP POLICY IF EXISTS "alerts_admin_write" ON public.alerts;
CREATE POLICY "alerts_admin_write" ON public.alerts
FOR ALL TO authenticated
USING (
    ((SELECT auth.role()) = 'service_role')
    OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = (SELECT auth.uid())
        AND u.role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    ((SELECT auth.role()) = 'service_role')
    OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = (SELECT auth.uid())
        AND u.role IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- API_USAGE: Consolidate duplicate SELECT policies
-- ============================================================================

-- Consolidate api_usage SELECT policies
DROP POLICY IF EXISTS "API usage access" ON public.api_usage;
DROP POLICY IF EXISTS "Admins can view all API usage" ON public.api_usage;

CREATE POLICY "api_usage_select_consolidated" ON public.api_usage
FOR SELECT TO authenticated
USING (
    (user_id = (SELECT auth.uid()))
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
);






