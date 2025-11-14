-- ============================================================================
-- KUBOTA RENTAL PLATFORM - DATABASE MONITORING QUERIES
-- Run these monthly or after major changes to track database health
-- ============================================================================

-- Save this file and run queries via Supabase MCP or SQL Editor
-- Recommended frequency: Monthly (1st of each month)

-- ============================================================================
-- QUERY 1: Unused Indexes (Check monthly, remove after 6 months if confirmed)
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as times_used,
  now() - stats_reset as stats_age
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelid NOT IN (
    SELECT indexrelid FROM pg_index WHERE indisprimary
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- Expected: 71 unused indexes (most on new tables with zero data)
-- Action: Monitor for 6 months, then remove if still unused


-- ============================================================================
-- QUERY 2: Table Sizes & Growth Trends
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_autovacuum,
  last_vacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- Top tables by size - monitor growth over time


-- ============================================================================
-- QUERY 3: Cache Hit Ratio (Should be >99%)
-- ============================================================================

SELECT 
  'cache hit ratio' as metric,
  ROUND(
    sum(heap_blks_hit) * 100.0 / 
    NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0),
    2
  ) as percentage,
  CASE 
    WHEN sum(heap_blks_hit) * 100.0 / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) >= 99 
      THEN '✅ Excellent'
    WHEN sum(heap_blks_hit) * 100.0 / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) >= 95 
      THEN '🟡 Good'
    ELSE '🔴 Poor - Increase shared_buffers'
  END as status
FROM pg_statio_user_tables;

-- Target: >99% (excellent database caching)


-- ============================================================================
-- QUERY 4: Connection Monitoring
-- ============================================================================

SELECT 
  datname as database,
  count(*) as active_connections,
  max_conn,
  ROUND(count(*) * 100.0 / max_conn, 2) as percent_used,
  CASE 
    WHEN count(*) * 100.0 / max_conn < 60 THEN '✅ Healthy'
    WHEN count(*) * 100.0 / max_conn < 80 THEN '🟡 Monitor'
    ELSE '🔴 High Usage'
  END as status
FROM pg_stat_activity, 
     (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') mc
WHERE datname IS NOT NULL
GROUP BY datname, max_conn
ORDER BY connections DESC;

-- Warning: If percent_used > 80%, may need connection pooling


-- ============================================================================
-- QUERY 5: Equipment Utilization (Business Metrics)
-- ============================================================================

SELECT 
  e."unitId",
  e.model,
  e.year,
  e.status,
  e."totalEngineHours",
  COUNT(b.id) as total_bookings,
  SUM(b."totalAmount") as revenue_generated,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (b."endDate" - b."startDate"))/86400),
    1
  ) as avg_rental_days,
  ROUND(
    COUNT(b.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM bookings WHERE status != 'cancelled'), 0),
    2
  ) as booking_share_percent
FROM equipment e
LEFT JOIN bookings b ON b."equipmentId" = e.id AND b.status != 'cancelled'
WHERE e."unitId" LIKE 'UNIT-%'
GROUP BY e.id, e."unitId", e.model, e.year, e.status, e."totalEngineHours"
ORDER BY revenue_generated DESC NULLS LAST;

-- Track which equipment units are most profitable


-- ============================================================================
-- QUERY 6: Booking Trends (Last 30 Days)
-- ============================================================================

SELECT 
  DATE(b."createdAt") as booking_date,
  COUNT(*) as bookings_created,
  COUNT(*) FILTER (WHERE b.status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE b.status = 'cancelled') as cancelled,
  SUM(b."totalAmount") FILTER (WHERE b.status != 'cancelled') as revenue,
  ROUND(
    AVG(b."totalAmount") FILTER (WHERE b.status != 'cancelled'),
    2
  ) as avg_booking_value
FROM bookings b
WHERE b."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE(b."createdAt")
ORDER BY booking_date DESC;

-- Track daily booking trends


-- ============================================================================
-- QUERY 7: Payment Success Rate
-- ============================================================================

SELECT 
  DATE(p."createdAt") as payment_date,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE p.status = 'completed') as successful,
  COUNT(*) FILTER (WHERE p.status = 'failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE p.status = 'completed') * 100.0 / COUNT(*),
    2
  ) as success_rate
FROM payments p
WHERE p."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE(p."createdAt")
ORDER BY payment_date DESC;

-- Target success rate: >95%


-- ============================================================================
-- QUERY 8: Customer Engagement Metrics
-- ============================================================================

SELECT 
  COUNT(DISTINCT u.id) as total_customers,
  COUNT(DISTINCT u.id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM bookings WHERE "customerId" = u.id
    )
  ) as customers_with_bookings,
  COUNT(DISTINCT u.id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM bookings 
      WHERE "customerId" = u.id 
      AND status = 'confirmed'
    )
  ) as customers_with_confirmed_bookings,
  ROUND(
    AVG((
      SELECT COUNT(*) FROM bookings 
      WHERE "customerId" = u.id 
      AND status != 'cancelled'
    )),
    2
  ) as avg_bookings_per_customer
FROM users u
WHERE u.role = 'customer';

-- Track customer engagement


-- ============================================================================
-- QUERY 9: Revenue by Month
-- ============================================================================

SELECT 
  TO_CHAR(DATE_TRUNC('month', b."createdAt"), 'YYYY-MM') as month,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE b.status = 'confirmed') as confirmed_bookings,
  SUM(b."totalAmount") FILTER (WHERE b.status != 'cancelled') as total_revenue,
  ROUND(AVG(b."totalAmount") FILTER (WHERE b.status != 'cancelled'), 2) as avg_booking_value,
  SUM(b."securityDeposit") as total_deposits_held
FROM bookings b
WHERE b."createdAt" >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', b."createdAt")
ORDER BY month DESC;

-- Track monthly revenue trends


-- ============================================================================
-- QUERY 10: System Health Summary (Run this monthly)
-- ============================================================================

DO $$
DECLARE
  v_cache_hit_ratio NUMERIC;
  v_unused_indexes INT;
  v_bloated_tables INT;
  v_connection_percent NUMERIC;
  v_total_size TEXT;
BEGIN
  -- Calculate cache hit ratio
  SELECT ROUND(sum(heap_blks_hit) * 100.0 / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2)
  INTO v_cache_hit_ratio
  FROM pg_statio_user_tables;
  
  -- Count unused indexes
  SELECT COUNT(*)
  INTO v_unused_indexes
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public' 
    AND idx_scan = 0
    AND indexrelid NOT IN (SELECT indexrelid FROM pg_index WHERE indisprimary);
  
  -- Count bloated tables (>20% dead tuples)
  SELECT COUNT(*)
  INTO v_bloated_tables
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
    AND n_dead_tup > 1000
    AND n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0) > 20;
  
  -- Get connection usage
  SELECT ROUND(count(*) * 100.0 / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'), 2)
  INTO v_connection_percent
  FROM pg_stat_activity
  WHERE datname = current_database();
  
  -- Get database size
  SELECT pg_size_pretty(pg_database_size(current_database()))
  INTO v_total_size;
  
  -- Output comprehensive health report
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   KUBOTA RENTAL PLATFORM - DATABASE HEALTH REPORT  ║';
  RAISE NOTICE '║   Generated: %                          ║', TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI');
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  
  RAISE NOTICE '📊 PERFORMANCE METRICS:';
  RAISE NOTICE '   Cache Hit Ratio: %.2f%% %',
    v_cache_hit_ratio,
    CASE 
      WHEN v_cache_hit_ratio >= 99 THEN '✅ Excellent'
      WHEN v_cache_hit_ratio >= 95 THEN '🟡 Good'
      ELSE '🔴 Needs attention'
    END;
  RAISE NOTICE '   Connection Usage: %.2f%% %',
    v_connection_percent,
    CASE 
      WHEN v_connection_percent < 60 THEN '✅ Healthy'
      WHEN v_connection_percent < 80 THEN '🟡 Monitor'
      ELSE '🔴 High usage'
    END;
  RAISE NOTICE '';
  
  RAISE NOTICE '💾 STORAGE:';
  RAISE NOTICE '   Database Size: %', v_total_size;
  RAISE NOTICE '';
  
  RAISE NOTICE '🔍 INDEX HEALTH:';
  RAISE NOTICE '   Unused Indexes: % %',
    v_unused_indexes,
    CASE 
      WHEN v_unused_indexes < 10 THEN '✅ Excellent'
      WHEN v_unused_indexes < 50 THEN '🟡 Monitor (new tables)'
      ELSE '🔴 Review needed'
    END;
  RAISE NOTICE '';
  
  RAISE NOTICE '🧹 TABLE MAINTENANCE:';
  RAISE NOTICE '   Bloated Tables: % %',
    v_bloated_tables,
    CASE 
      WHEN v_bloated_tables = 0 THEN '✅ Excellent'
      WHEN v_bloated_tables < 5 THEN '🟡 Schedule VACUUM'
      ELSE '🔴 Run VACUUM ANALYZE now'
    END;
  RAISE NOTICE '';
  
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Warnings
  IF v_cache_hit_ratio < 95 THEN
    RAISE WARNING 'Cache hit ratio is below 95%%. Consider optimizing queries or increasing shared_buffers.';
  END IF;
  
  IF v_connection_percent > 80 THEN
    RAISE WARNING 'Connection usage is above 80%%. Consider implementing connection pooling.';
  END IF;
  
  IF v_bloated_tables > 0 THEN
    RAISE WARNING '% table(s) need VACUUM. Run: VACUUM ANALYZE;', v_bloated_tables;
  END IF;
  
  IF v_unused_indexes > 50 THEN
    RAISE NOTICE 'NOTE: % unused indexes found. Most are on new tables. Monitor for 6 months before removing.', v_unused_indexes;
  END IF;
  
  RAISE NOTICE '✅ Health check complete!';
  RAISE NOTICE '';
END $$;


-- ============================================================================
-- QUERY 11: Index Usage Report (Which indexes are actually used)
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as size,
  CASE 
    WHEN idx_scan = 0 THEN '❌ Never used'
    WHEN idx_scan < 100 THEN '🟡 Rarely used'
    WHEN idx_scan < 1000 THEN '✅ Moderate use'
    ELSE '🚀 Heavy use'
  END as usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Helps identify which indexes to keep/remove


-- ============================================================================
-- SAVE FOR PRODUCTION MONITORING
-- ============================================================================


