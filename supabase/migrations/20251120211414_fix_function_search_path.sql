-- Fix Mutable Search Path in Database Functions
-- Date: 2025-11-20
-- Purpose: Add SET search_path to functions with mutable search_path to prevent search path manipulation attacks
-- Reference: Supabase security advisor recommendations

-- Security-critical RLS functions
ALTER FUNCTION public.rls_has_permission SET search_path = '';
ALTER FUNCTION public.rls_is_admin SET search_path = '';
ALTER FUNCTION public.rls_has_any_permission SET search_path = '';

-- Permission system functions
ALTER FUNCTION public.has_permission SET search_path = '';
ALTER FUNCTION public.has_any_permission SET search_path = '';
ALTER FUNCTION public.has_all_permissions SET search_path = '';
ALTER FUNCTION public.get_user_permissions SET search_path = '';
ALTER FUNCTION public.invalidate_permission_cache SET search_path = '';

-- Cache management functions
ALTER FUNCTION public.rebuild_user_permission_cache SET search_path = '';
ALTER FUNCTION public.update_roles_updated_at SET search_path = '';
ALTER FUNCTION public.update_permissions_updated_at SET search_path = '';

-- Equipment and stats functions
ALTER FUNCTION public.get_equipment_with_stats SET search_path = '';

-- Email and notification functions
ALTER FUNCTION public.get_email_delivery_stats SET search_path = '';
ALTER FUNCTION public.update_email_delivery_logs_updated_at SET search_path = '';
ALTER FUNCTION public.update_notification_queue_updated_at SET search_path = '';
ALTER FUNCTION public.update_automated_notification_rules_updated_at SET search_path = '';

-- Job and scheduling functions
ALTER FUNCTION public.get_job_status_summary SET search_path = '';
ALTER FUNCTION public.update_job_run_duration SET search_path = '';
ALTER FUNCTION public.update_scheduled_reports_updated_at SET search_path = '';
ALTER FUNCTION public.calculate_next_run_date SET search_path = '';

-- Reminder queue functions
ALTER FUNCTION public.queue_booking_reminders SET search_path = '';
ALTER FUNCTION public.queue_maintenance_reminders SET search_path = '';

-- Add comments documenting security improvements
COMMENT ON FUNCTION public.rls_has_permission IS
'SECURITY: SET search_path = '' prevents search path manipulation attacks. Checks if user has specific permission.';

COMMENT ON FUNCTION public.rls_is_admin IS
'SECURITY: SET search_path = '' prevents search path manipulation attacks. Checks if user is admin.';

COMMENT ON FUNCTION public.rls_has_any_permission IS
'SECURITY: SET search_path = '' prevents search path manipulation attacks. Checks if user has any of the specified permissions.';

