-- Optimize RLS Policies Phase 2 - Replace auth.uid() with (SELECT auth.uid())
-- Date: 2025-01-22
-- Purpose: Continue optimizing RLS policies for better performance

-- Fix 1: alerts - alerts_admin_write policy (WITH CHECK needs fixing)
DROP POLICY IF EXISTS "alerts_admin_write" ON public.alerts;
CREATE POLICY "alerts_admin_write" ON public.alerts
FOR ALL TO authenticated
USING (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 2: booking_bulk_operations - booking_bulk_operations_admin policy
DROP POLICY IF EXISTS "booking_bulk_operations_admin" ON public.booking_bulk_operations;
CREATE POLICY "booking_bulk_operations_admin" ON public.booking_bulk_operations
FOR ALL TO authenticated
USING (
  (auth.role() = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  (auth.role() = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 3: booking_conflicts - booking_conflicts_admin policy
DROP POLICY IF EXISTS "booking_conflicts_admin" ON public.booking_conflicts;
CREATE POLICY "booking_conflicts_admin" ON public.booking_conflicts
FOR ALL TO authenticated
USING (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 4: booking_notes - booking_notes_admin policy
DROP POLICY IF EXISTS "booking_notes_admin" ON public.booking_notes;
CREATE POLICY "booking_notes_admin" ON public.booking_notes
FOR ALL TO authenticated
USING (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 5: booking_wizard_sessions - booking_wizard_sessions_admin policy
DROP POLICY IF EXISTS "booking_wizard_sessions_admin" ON public.booking_wizard_sessions;
CREATE POLICY "booking_wizard_sessions_admin" ON public.booking_wizard_sessions
FOR ALL TO authenticated
USING (
  (auth.role() = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  (auth.role() = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 6: campaign_audiences - campaign_audiences_admin policy
DROP POLICY IF EXISTS "campaign_audiences_admin" ON public.campaign_audiences;
CREATE POLICY "campaign_audiences_admin" ON public.campaign_audiences
FOR ALL TO authenticated
USING (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 7: customer_consent - customer_consent_admin policy
DROP POLICY IF EXISTS "customer_consent_admin" ON public.customer_consent;
CREATE POLICY "customer_consent_admin" ON public.customer_consent
FOR ALL TO authenticated
USING (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 8: customer_timeline_events - customer_timeline_events_admin policy
DROP POLICY IF EXISTS "customer_timeline_events_admin" ON public.customer_timeline_events;
CREATE POLICY "customer_timeline_events_admin" ON public.customer_timeline_events
FOR ALL TO authenticated
USING (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  (auth.role() = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 9: dashboard_exports - dashboard_exports_access policy
DROP POLICY IF EXISTS "dashboard_exports_access" ON public.dashboard_exports;
CREATE POLICY "dashboard_exports_access" ON public.dashboard_exports
FOR ALL TO authenticated
USING (
  (auth.role() = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  (auth.role() = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 10: dashboard_saved_filters - dashboard_saved_filters_access policy
DROP POLICY IF EXISTS "dashboard_saved_filters_access" ON public.dashboard_saved_filters;
CREATE POLICY "dashboard_saved_filters_access" ON public.dashboard_saved_filters
FOR ALL TO authenticated
USING (
  (auth.role() = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  (auth.role() = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);
