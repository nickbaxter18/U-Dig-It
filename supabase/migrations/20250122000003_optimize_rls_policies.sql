-- Optimize RLS Policies - Replace auth.uid() with (SELECT auth.uid())
-- Date: 2025-01-22
-- Purpose: Improve RLS policy performance by preventing re-evaluation of auth.uid() for each row

-- Fix 1: customer_tags - customer_tags_admin policy
DROP POLICY IF EXISTS "customer_tags_admin" ON public.customer_tags;
CREATE POLICY "customer_tags_admin" ON public.customer_tags
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

-- Fix 2: customer_tag_members - customer_tag_members_admin policy
DROP POLICY IF EXISTS "customer_tag_members_admin" ON public.customer_tag_members;
CREATE POLICY "customer_tag_members_admin" ON public.customer_tag_members
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

-- Fix 3: customer_notes - customer_notes_admin policy
DROP POLICY IF EXISTS "customer_notes_admin" ON public.customer_notes;
CREATE POLICY "customer_notes_admin" ON public.customer_notes
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

-- Fix 4: id_verification_requests - "Users can update own id verification requests" policy
DROP POLICY IF EXISTS "Users can update own id verification requests" ON public.id_verification_requests;
CREATE POLICY "Users can update own id verification requests" ON public.id_verification_requests
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Fix 5: manual_payments - manual_payments_admin policy
DROP POLICY IF EXISTS "manual_payments_admin" ON public.manual_payments;
CREATE POLICY "manual_payments_admin" ON public.manual_payments
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

-- Add comment documenting optimization
COMMENT ON POLICY "customer_tags_admin" ON public.customer_tags IS
'PERFORMANCE: Uses (SELECT auth.uid()) wrapper to prevent re-evaluation for each row. Improves query performance at scale.';

COMMENT ON POLICY "customer_tag_members_admin" ON public.customer_tag_members IS
'PERFORMANCE: Uses (SELECT auth.uid()) wrapper to prevent re-evaluation for each row. Improves query performance at scale.';

COMMENT ON POLICY "customer_notes_admin" ON public.customer_notes IS
'PERFORMANCE: Uses (SELECT auth.uid()) wrapper to prevent re-evaluation for each row. Improves query performance at scale.';

COMMENT ON POLICY "Users can update own id verification requests" ON public.id_verification_requests IS
'PERFORMANCE: Uses (SELECT auth.uid()) wrapper to prevent re-evaluation for each row. Improves query performance at scale.';

COMMENT ON POLICY "manual_payments_admin" ON public.manual_payments IS
'PERFORMANCE: Uses (SELECT auth.uid()) wrapper to prevent re-evaluation for each row. Improves query performance at scale.';
