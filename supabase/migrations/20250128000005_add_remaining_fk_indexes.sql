-- Add remaining missing foreign key indexes identified by performance advisors
-- These 6 FKs were identified after the initial batch

-- alert_incidents.alert_rule_id -> alert_rules.id
CREATE INDEX IF NOT EXISTS idx_alert_incidents_alert_rule_id
ON public.alert_incidents(alert_rule_id);

-- booking_attachments.attachment_id -> equipment_attachments.id
CREATE INDEX IF NOT EXISTS idx_booking_attachments_attachment_id
ON public.booking_attachments(attachment_id);

-- booking_bulk_operations.admin_id -> users.id
CREATE INDEX IF NOT EXISTS idx_booking_bulk_operations_admin_id
ON public.booking_bulk_operations(admin_id);

-- booking_wizard_sessions.admin_id -> users.id
CREATE INDEX IF NOT EXISTS idx_booking_wizard_sessions_admin_id
ON public.booking_wizard_sessions(admin_id);

-- contest_events.entrant_id -> contest_entrants.id
CREATE INDEX IF NOT EXISTS idx_contest_events_entrant_id
ON public.contest_events(entrant_id);

-- contest_winners.entrant_id -> contest_entrants.id
CREATE INDEX IF NOT EXISTS idx_contest_winners_entrant_id
ON public.contest_winners(entrant_id);






