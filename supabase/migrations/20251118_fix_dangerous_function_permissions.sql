-- Fix Dangerous Function Permissions
-- Date: 2025-11-18
-- Purpose: Revoke dangerous permissions from authenticated users and add permission checks
-- Reference: @Supabase security best practices - SECURITY_DEFINER functions need explicit permission checks

-- ============================================================================
-- Fix 1: Revoke maintain_indexes() from authenticated users
-- ============================================================================
REVOKE EXECUTE ON FUNCTION maintain_indexes() FROM authenticated;
GRANT EXECUTE ON FUNCTION maintain_indexes() TO postgres, service_role;

-- Add permission check to the function itself
CREATE OR REPLACE FUNCTION maintain_indexes()
RETURNS TABLE (
  index_name TEXT,
  table_name TEXT,
  maintenance_action TEXT,
  space_reclaimed_mb DECIMAL(10,2)
) AS $$
DECLARE
  v_index_record RECORD;
BEGIN
  -- SECURITY: Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Admin access required for index maintenance';
  END IF;

  -- Reindex bloated indexes
  FOR v_index_record IN
    SELECT
      indexname,
      tablename,
      pg_relation_size(indexrelid) / 1024 / 1024 as size_mb
    FROM pg_indexes pi
    JOIN pg_stat_user_tables ps ON pi.tablename = ps.relname
    WHERE pi.schemaname = 'public'
      AND ps.schemaname = 'public'
      AND ps.n_dead_tup > ps.n_live_tup * 0.2 -- More than 20% dead tuples
      AND (pg_relation_size(pi.indexrelid) / 1024 / 1024) > 50 -- Larger than 50MB
    ORDER BY size_mb DESC
    LIMIT 5
  LOOP
    -- Log before reindexing
    RETURN QUERY SELECT
      v_index_record.indexname,
      v_index_record.tablename,
      'REINDEX performed'::TEXT,
      0::DECIMAL(10,2);

    -- Perform reindex
    EXECUTE format('REINDEX INDEX CONCURRENTLY %I', v_index_record.indexname);
  END LOOP;

  -- Update table statistics
  FOR v_index_record IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ANALYZE %I', v_index_record.tablename);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION maintain_indexes() IS
'SECURITY: Admin-only function for index maintenance. Includes permission check.';

-- ============================================================================
-- Fix 2: Revoke cleanup_old_data() from authenticated users
-- ============================================================================
REVOKE EXECUTE ON FUNCTION cleanup_old_data() FROM authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO service_role;

-- Add permission check if the function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_data'
  ) THEN
    -- Recreate with permission check
    EXECUTE '
    CREATE OR REPLACE FUNCTION cleanup_old_data()
    RETURNS TABLE (
      table_name TEXT,
      rows_deleted INTEGER,
      space_reclaimed_mb DECIMAL(10,2)
    ) AS $func$
    DECLARE
      v_deleted_count INTEGER;
    BEGIN
      -- SECURITY: Only service_role should call this
      -- If called via RPC, check for admin role
      IF current_setting(''request.jwt.claims'', true)::json->''role'' IS NOT NULL THEN
        IF NOT EXISTS (
          SELECT 1 FROM users
          WHERE id = (SELECT auth.uid())
          AND role IN (''admin'', ''super_admin'')
        ) THEN
          RAISE EXCEPTION ''Permission denied: Admin access required for data cleanup'';
        END IF;
      END IF;

      -- Cleanup old audit logs (older than 1 year)
      DELETE FROM audit_logs
      WHERE created_at < NOW() - INTERVAL ''1 year'';
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

      RETURN QUERY SELECT
        ''audit_logs''::TEXT,
        v_deleted_count,
        0::DECIMAL(10,2);

      -- Cleanup old API usage logs (older than 6 months)
      DELETE FROM api_usage
      WHERE created_at < NOW() - INTERVAL ''6 months'';
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

      RETURN QUERY SELECT
        ''api_usage''::TEXT,
        v_deleted_count,
        0::DECIMAL(10,2);

      -- Cleanup old webhook events (older than 3 months)
      DELETE FROM webhook_events
      WHERE created_at < NOW() - INTERVAL ''3 months'';
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

      RETURN QUERY SELECT
        ''webhook_events''::TEXT,
        v_deleted_count,
        0::DECIMAL(10,2);

      -- Vacuum to reclaim space
      EXECUTE ''VACUUM ANALYZE audit_logs, api_usage, webhook_events'';
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
    ';
  END IF;
END $$;

COMMENT ON FUNCTION cleanup_old_data() IS
'SECURITY: Service role only function for cleaning up old data. Includes permission check.';

-- ============================================================================
-- Fix 3: Review and restrict other SECURITY_DEFINER functions
-- ============================================================================

-- Find all SECURITY_DEFINER functions (for audit purposes)
DO $$
DECLARE
  v_function RECORD;
BEGIN
  RAISE NOTICE 'Auditing SECURITY_DEFINER functions:';
  FOR v_function IN
    SELECT
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE prosecdef = true  -- SECURITY_DEFINER functions
      AND n.nspname = 'public'
  LOOP
    RAISE NOTICE 'Function: %.% (SECURITY_DEFINER)',
      v_function.schema_name,
      v_function.function_name;
  END LOOP;
END $$;

-- ============================================================================
-- Verification
-- ============================================================================
-- Run this to verify permissions:
-- SELECT
--   routine_name,
--   routine_type,
--   security_type,
--   grantee,
--   privilege_type
-- FROM information_schema.routine_privileges
-- WHERE routine_schema = 'public'
--   AND routine_name IN ('maintain_indexes', 'cleanup_old_data')
-- ORDER BY routine_name, grantee;

