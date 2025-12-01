-- Consolidate additional duplicate RLS policies for better performance
-- This continues the optimization work from the previous consolidation migration

-- ============================================================================
-- equipment: Consolidate duplicate ALL policies
-- ============================================================================
DROP POLICY IF EXISTS "Equipment is manageable by admins" ON public.equipment;
DROP POLICY IF EXISTS "equipment_admin_manage - no recursion" ON public.equipment;
-- Keep equipment_public_read for SELECT, add consolidated admin policy
CREATE POLICY "equipment_admin_manage_consolidated" ON public.equipment
FOR ALL TO authenticated
USING (
    ((SELECT auth.role()) = 'service_role')
    OR check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('equipment:manage:all')
    OR rls_has_any_permission(ARRAY['equipment:create:all', 'equipment:update:all', 'equipment:delete:all'])
)
WITH CHECK (
    ((SELECT auth.role()) = 'service_role')
    OR check_is_admin((SELECT auth.uid()))
    OR rls_has_permission('equipment:manage:all')
    OR rls_has_any_permission(ARRAY['equipment:create:all', 'equipment:update:all', 'equipment:delete:all'])
);

-- ============================================================================
-- id_verification_requests: Consolidate duplicate policies
-- ============================================================================
-- Consolidate INSERT policies
DROP POLICY IF EXISTS "Users can insert own id verification requests" ON public.id_verification_requests;
DROP POLICY IF EXISTS "id_verification_requests_insert_self" ON public.id_verification_requests;
CREATE POLICY "id_verification_requests_insert_consolidated" ON public.id_verification_requests
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Consolidate SELECT policies
DROP POLICY IF EXISTS "Users can view own id verification requests" ON public.id_verification_requests;
DROP POLICY IF EXISTS "id_verification_requests_select_self_or_admin - no recursion" ON public.id_verification_requests;
CREATE POLICY "id_verification_requests_select_consolidated" ON public.id_verification_requests
FOR SELECT TO authenticated
USING (
    (user_id = (SELECT auth.uid()))
    OR check_is_admin((SELECT auth.uid()))
);

-- Consolidate UPDATE policies
DROP POLICY IF EXISTS "Users can update own id verification requests" ON public.id_verification_requests;
DROP POLICY IF EXISTS "id_verification_requests_admin_update - no recursion" ON public.id_verification_requests;
CREATE POLICY "id_verification_requests_update_consolidated" ON public.id_verification_requests
FOR UPDATE TO authenticated
USING (
    (user_id = (SELECT auth.uid()))
    OR check_is_admin((SELECT auth.uid()))
)
WITH CHECK (
    (user_id = (SELECT auth.uid()))
    OR check_is_admin((SELECT auth.uid()))
);

-- ============================================================================
-- id_verification_audits: Consolidate INSERT policies
-- ============================================================================
DROP POLICY IF EXISTS "id_verification_audits_admin_insert" ON public.id_verification_audits;
-- Keep "Admins can manage id verification audits" for ALL operations
-- Keep "id_verification_audits_select_self_or_admin" for SELECT

-- ============================================================================
-- id_verification_results: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own id verification results" ON public.id_verification_results;
DROP POLICY IF EXISTS "id_verification_results_select_self_or_admin - no recursion" ON public.id_verification_results;
CREATE POLICY "id_verification_results_select_consolidated" ON public.id_verification_results
FOR SELECT TO authenticated
USING (
    (EXISTS (
        SELECT 1 FROM id_verification_requests r
        WHERE r.id = id_verification_results.request_id
        AND r.user_id = (SELECT auth.uid())
    ))
    OR check_is_admin((SELECT auth.uid()))
);

-- ============================================================================
-- insurance_documents: Consolidate duplicate policies
-- ============================================================================
DROP POLICY IF EXISTS "insurance_documents_delete_policy - no recursion" ON public.insurance_documents;
DROP POLICY IF EXISTS "insurance_documents_policy - no recursion" ON public.insurance_documents;
DROP POLICY IF EXISTS "insurance_documents_update_policy - no recursion" ON public.insurance_documents;
-- Keep "Admins can manage all insurance documents - no recursion" for ALL operations
-- Keep "insurance_documents_insert_policy" for INSERT (has booking validation)

-- Add consolidated SELECT policy
CREATE POLICY "insurance_documents_select_consolidated" ON public.insurance_documents
FOR SELECT TO authenticated
USING (
    (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = insurance_documents."bookingId"
        AND b."customerId" = (SELECT auth.uid())
    ))
    OR check_is_admin((SELECT auth.uid()))
);

-- Add consolidated UPDATE policy
CREATE POLICY "insurance_documents_update_consolidated" ON public.insurance_documents
FOR UPDATE TO authenticated
USING (
    (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = insurance_documents."bookingId"
        AND b."customerId" = (SELECT auth.uid())
    ))
    OR check_is_admin((SELECT auth.uid()))
)
WITH CHECK (
    (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = insurance_documents."bookingId"
        AND b."customerId" = (SELECT auth.uid())
    ))
    OR check_is_admin((SELECT auth.uid()))
);

-- Add consolidated DELETE policy
CREATE POLICY "insurance_documents_delete_consolidated" ON public.insurance_documents
FOR DELETE TO authenticated
USING (
    (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = insurance_documents."bookingId"
        AND b."customerId" = (SELECT auth.uid())
    ))
    OR check_is_admin((SELECT auth.uid()))
);

-- ============================================================================
-- permission_grants: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all permission grants" ON public.permission_grants;
DROP POLICY IF EXISTS "Users can view own permission grants" ON public.permission_grants;
-- Keep "Admins can manage permission grants" for ALL operations
CREATE POLICY "permission_grants_select_consolidated" ON public.permission_grants
FOR SELECT TO authenticated
USING (
    (user_id = (SELECT auth.uid()))
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- permissions: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Everyone can view permissions" ON public.permissions;
-- Keep "Admins can manage permissions" for ALL operations
CREATE POLICY "permissions_select_consolidated" ON public.permissions
FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- role_permissions: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view role permissions" ON public.role_permissions;
-- Keep "Admins can manage role permissions" for ALL operations
CREATE POLICY "role_permissions_select_consolidated" ON public.role_permissions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- roles: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Everyone can view active roles" ON public.roles;
-- Keep "Admins can manage roles" for ALL operations
CREATE POLICY "roles_select_consolidated" ON public.roles
FOR SELECT TO authenticated
USING (
    (is_active = true)
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- user_roles: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
-- Keep "Admins can manage user roles" for ALL operations
CREATE POLICY "user_roles_select_consolidated" ON public.user_roles
FOR SELECT TO authenticated
USING (
    (user_id = (SELECT auth.uid()))
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- webhook_events: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view webhook events" ON public.webhook_events;
DROP POLICY IF EXISTS "webhook_events_admin_policy" ON public.webhook_events;
-- Keep "webhook_events_service_policy" for service_role
CREATE POLICY "webhook_events_select_consolidated" ON public.webhook_events
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
);






