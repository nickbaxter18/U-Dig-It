-- Add Critical Foreign Key Indexes
-- Date: 2025-01-22
-- Purpose: Improve query performance by adding indexes on foreign key columns

-- Fix 1: insurance_activity.actor_id
-- Note: Using regular CREATE INDEX (not CONCURRENTLY) for migration compatibility
CREATE INDEX IF NOT EXISTS idx_insurance_activity_actor_id
ON public.insurance_activity(actor_id);

-- Fix 2: insurance_reminders.insurance_document_id
CREATE INDEX IF NOT EXISTS idx_insurance_reminders_insurance_document_id
ON public.insurance_reminders(insurance_document_id);

-- Fix 3: support_templates.created_by
CREATE INDEX IF NOT EXISTS idx_support_templates_created_by
ON public.support_templates(created_by);

-- Add comments documenting performance improvements
COMMENT ON INDEX idx_insurance_activity_actor_id IS
'PERFORMANCE: Index on foreign key for faster joins and lookups. Improves query performance.';

COMMENT ON INDEX idx_insurance_reminders_insurance_document_id IS
'PERFORMANCE: Index on foreign key for faster joins and lookups. Improves query performance.';

COMMENT ON INDEX idx_support_templates_created_by IS
'PERFORMANCE: Index on foreign key for faster joins and lookups. Improves query performance.';
