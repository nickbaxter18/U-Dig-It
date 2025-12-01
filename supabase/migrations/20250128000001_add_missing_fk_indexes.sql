-- Add missing indexes for unindexed foreign keys
-- This improves query performance for FK lookups and joins
-- Note: Regular CREATE INDEX is used here (not CONCURRENTLY) because migrations run in transactions
-- For production hot-swaps, these could be created with CONCURRENTLY outside of migrations

-- 1. automated_notification_rules.created_by -> users.id
CREATE INDEX IF NOT EXISTS idx_automated_notification_rules_created_by
ON automated_notification_rules(created_by);

-- 2. job_runs.triggered_by -> users.id
CREATE INDEX IF NOT EXISTS idx_job_runs_triggered_by
ON job_runs(triggered_by);

-- 3. notification_queue.template_id -> notification_templates.id
CREATE INDEX IF NOT EXISTS idx_notification_queue_template_id
ON notification_queue(template_id);

-- 4. permission_audit_log.permission_id -> permissions.id
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_permission_id
ON permission_audit_log(permission_id);

-- 5. permission_audit_log.role_id -> roles.id
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_role_id
ON permission_audit_log(role_id);

-- 6. permission_grants.granted_by -> users.id
CREATE INDEX IF NOT EXISTS idx_permission_grants_granted_by
ON permission_grants(granted_by);

-- 7. role_permissions.granted_by -> users.id
CREATE INDEX IF NOT EXISTS idx_role_permissions_granted_by
ON role_permissions(granted_by);

-- 8. user_roles.assigned_by -> users.id
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by
ON user_roles(assigned_by);

-- Note: These indexes improve performance for:
-- - FK constraint checks during updates/deletes
-- - JOIN queries involving these relationships
-- - Queries filtering or sorting by these columns

