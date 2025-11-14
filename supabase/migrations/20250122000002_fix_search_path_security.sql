-- Fix Search Path Security Issues
-- Date: 2025-01-22
-- Purpose: Add SET search_path to functions with mutable search_path to prevent search path manipulation attacks

-- Fix 1: purge_expired_idkit_objects - SECURITY DEFINER function needs search_path
CREATE OR REPLACE FUNCTION public.purge_expired_idkit_objects(max_age INTERVAL DEFAULT INTERVAL '72 hours')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'idkit-intake'
    AND created_at < NOW() - max_age;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN COALESCE(deleted_count, 0);
END;
$$;

-- Fix 2: is_admin_user - Add search_path for security best practices
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
  );
$$;

-- Fix 3: storage_first_segment - Add search_path for security best practices (even though IMMUTABLE)
CREATE OR REPLACE FUNCTION public.storage_first_segment(path text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT NULLIF(split_part(path, '/', 1), '')
$$;

-- Add comments documenting security improvements
COMMENT ON FUNCTION public.purge_expired_idkit_objects(INTERVAL) IS
'SECURITY: SET search_path prevents search path manipulation attacks. Cleans up expired ID verification objects.';

COMMENT ON FUNCTION public.is_admin_user() IS
'SECURITY: SET search_path prevents search path manipulation attacks. Checks if current user has admin privileges.';

COMMENT ON FUNCTION public.storage_first_segment(TEXT) IS
'SECURITY: SET search_path prevents search path manipulation attacks. Helper function to extract first segment from storage path.';

-- Ensure permissions are maintained
GRANT EXECUTE ON FUNCTION public.purge_expired_idkit_objects(INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.storage_first_segment(TEXT) TO authenticated, anon;
