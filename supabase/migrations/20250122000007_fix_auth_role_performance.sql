-- Fix auth.role() Performance Issues - Wrap in (SELECT auth.role())
-- Date: 2025-01-22
-- Purpose: Optimize RLS policies by wrapping auth.role() in SELECT to prevent re-evaluation

-- Fix 1: customer_tags - customer_tags_admin policy
DROP POLICY IF EXISTS "customer_tags_admin" ON public.customer_tags;
CREATE POLICY "customer_tags_admin" ON public.customer_tags
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
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
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
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
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 4: alerts - alerts_admin_write policy
DROP POLICY IF EXISTS "alerts_admin_write" ON public.alerts;
CREATE POLICY "alerts_admin_write" ON public.alerts
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 5: alerts - alerts_admin_read policy
DROP POLICY IF EXISTS "alerts_admin_read" ON public.alerts;
CREATE POLICY "alerts_admin_read" ON public.alerts
FOR SELECT TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 6: booking_bulk_operations - booking_bulk_operations_admin policy
DROP POLICY IF EXISTS "booking_bulk_operations_admin" ON public.booking_bulk_operations;
CREATE POLICY "booking_bulk_operations_admin" ON public.booking_bulk_operations
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 7: booking_conflicts - booking_conflicts_admin policy
DROP POLICY IF EXISTS "booking_conflicts_admin" ON public.booking_conflicts;
CREATE POLICY "booking_conflicts_admin" ON public.booking_conflicts
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 8: booking_notes - booking_notes_admin policy
DROP POLICY IF EXISTS "booking_notes_admin" ON public.booking_notes;
CREATE POLICY "booking_notes_admin" ON public.booking_notes
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 9: booking_wizard_sessions - booking_wizard_sessions_admin policy
DROP POLICY IF EXISTS "booking_wizard_sessions_admin" ON public.booking_wizard_sessions;
CREATE POLICY "booking_wizard_sessions_admin" ON public.booking_wizard_sessions
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 10: campaign_audiences - campaign_audiences_admin policy
DROP POLICY IF EXISTS "campaign_audiences_admin" ON public.campaign_audiences;
CREATE POLICY "campaign_audiences_admin" ON public.campaign_audiences
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 11: customer_consent - customer_consent_admin policy
DROP POLICY IF EXISTS "customer_consent_admin" ON public.customer_consent;
CREATE POLICY "customer_consent_admin" ON public.customer_consent
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 12: customer_timeline_events - customer_timeline_events_admin policy
DROP POLICY IF EXISTS "customer_timeline_events_admin" ON public.customer_timeline_events;
CREATE POLICY "customer_timeline_events_admin" ON public.customer_timeline_events
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 13: dashboard_exports - dashboard_exports_access policy
DROP POLICY IF EXISTS "dashboard_exports_access" ON public.dashboard_exports;
CREATE POLICY "dashboard_exports_access" ON public.dashboard_exports
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 14: dashboard_saved_filters - dashboard_saved_filters_access policy
DROP POLICY IF EXISTS "dashboard_saved_filters_access" ON public.dashboard_saved_filters;
CREATE POLICY "dashboard_saved_filters_access" ON public.dashboard_saved_filters
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR (admin_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 15: financial_exports - financial_exports_admin policy
DROP POLICY IF EXISTS "financial_exports_admin" ON public.financial_exports;
CREATE POLICY "financial_exports_admin" ON public.financial_exports
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 16: installment_schedules - installment_schedules_admin policy
DROP POLICY IF EXISTS "installment_schedules_admin" ON public.installment_schedules;
CREATE POLICY "installment_schedules_admin" ON public.installment_schedules
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 17: insurance_activity - insurance_activity_admin policy
DROP POLICY IF EXISTS "insurance_activity_admin" ON public.insurance_activity;
CREATE POLICY "insurance_activity_admin" ON public.insurance_activity
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 18: insurance_reminders - insurance_reminders_admin policy
DROP POLICY IF EXISTS "insurance_reminders_admin" ON public.insurance_reminders;
CREATE POLICY "insurance_reminders_admin" ON public.insurance_reminders
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 19: logistics_tasks - logistics_tasks_admin policy
DROP POLICY IF EXISTS "logistics_tasks_admin" ON public.logistics_tasks;
CREATE POLICY "logistics_tasks_admin" ON public.logistics_tasks
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 20: maintenance_alerts - maintenance_alerts_admin policy
DROP POLICY IF EXISTS "maintenance_alerts_admin" ON public.maintenance_alerts;
CREATE POLICY "maintenance_alerts_admin" ON public.maintenance_alerts
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 21: manual_payments - manual_payments_admin policy
DROP POLICY IF EXISTS "manual_payments_admin" ON public.manual_payments;
CREATE POLICY "manual_payments_admin" ON public.manual_payments
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 22: payout_reconciliations - payout_reconciliations_admin policy
DROP POLICY IF EXISTS "payout_reconciliations_admin" ON public.payout_reconciliations;
CREATE POLICY "payout_reconciliations_admin" ON public.payout_reconciliations
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 23: pickup_checklists - pickup_checklists_admin policy
DROP POLICY IF EXISTS "pickup_checklists_admin" ON public.pickup_checklists;
CREATE POLICY "pickup_checklists_admin" ON public.pickup_checklists
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 24: support_message_recipients - support_message_recipients_admin policy
DROP POLICY IF EXISTS "support_message_recipients_admin" ON public.support_message_recipients;
CREATE POLICY "support_message_recipients_admin" ON public.support_message_recipients
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 25: support_messages - support_messages_admin policy
DROP POLICY IF EXISTS "support_messages_admin" ON public.support_messages;
CREATE POLICY "support_messages_admin" ON public.support_messages
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 26: support_sla - support_sla_admin policy
DROP POLICY IF EXISTS "support_sla_admin" ON public.support_sla;
CREATE POLICY "support_sla_admin" ON public.support_sla
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 27: support_templates - support_templates_admin policy (also fix auth.uid() in WITH CHECK)
DROP POLICY IF EXISTS "support_templates_admin" ON public.support_templates;
CREATE POLICY "support_templates_admin" ON public.support_templates
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 28: equipment_media - equipment_media_admin policy (also fix auth.uid() in WITH CHECK)
DROP POLICY IF EXISTS "equipment_media_admin" ON public.equipment_media;
CREATE POLICY "equipment_media_admin" ON public.equipment_media
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 29: maintenance_logs - maintenance_logs_admin policy (also fix auth.uid() in WITH CHECK)
DROP POLICY IF EXISTS "maintenance_logs_admin" ON public.maintenance_logs;
CREATE POLICY "maintenance_logs_admin" ON public.maintenance_logs
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 30: maintenance_parts - maintenance_parts_admin policy (also fix auth.uid() in WITH CHECK)
DROP POLICY IF EXISTS "maintenance_parts_admin" ON public.maintenance_parts;
CREATE POLICY "maintenance_parts_admin" ON public.maintenance_parts
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);

-- Fix 31: telematics_snapshots - telematics_snapshots_admin policy (also fix auth.uid() in WITH CHECK)
DROP POLICY IF EXISTS "telematics_snapshots_admin" ON public.telematics_snapshots;
CREATE POLICY "telematics_snapshots_admin" ON public.telematics_snapshots
FOR ALL TO authenticated
USING (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR
  (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (SELECT auth.uid())
    AND u.role = ANY (ARRAY['admin'::users_role_enum, 'super_admin'::users_role_enum])
  ))
);
