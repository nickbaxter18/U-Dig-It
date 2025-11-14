# 📊 Quick Win #4: Database Performance Monitoring

**Time Required:** 30 minutes  
**Impact:** MEDIUM - Proactive performance management  
**Difficulty:** Easy ⭐

---

## 🎯 What This Does

Creates SQL queries for monitoring database health and performance:
- Unused index tracking
- Slow query detection
- Connection monitoring
- Table bloat detection
- Query performance analysis

**Result:** Catch performance issues before they become problems!

---

## ✅ Monitoring Queries

### Save as: `supabase/monitoring_queries.sql`

```sql
-- ============================================================================
-- KUBOTA RENTAL PLATFORM - DATABASE MONITORING QUERIES
-- Run these monthly or after major changes
-- ============================================================================

-- Query 1: Unused Indexes (Check monthly, remove after 6 months if confirmed)
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


-- Query 2: Table Sizes (Check growth trends)
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- Top tables by size (monitor growth)


-- Query 3: Slow Queries (Run after performance issues)
-- ============================================================================
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  stddev_exec_time,
  rows
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries averaging >100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Note: Requires pg_stat_statements extension
-- Enable with: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;


-- Query 4: Connection Monitor (Check for connection leaks)
-- ============================================================================
SELECT 
  datname as database,
  count(*) as connections,
  max_conn,
  count(*) * 100.0 / max_conn as percent_used
FROM pg_stat_activity, 
     (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') mc
WHERE datname IS NOT NULL
GROUP BY datname, max_conn
ORDER BY connections DESC;

-- Warning: If percent_used > 80%, you may need more connections


-- Query 5: Cache Hit Ratio (Should be >99%)
-- ============================================================================
SELECT 
  'cache hit ratio' as metric,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as percentage
FROM pg_statio_user_tables;

-- Target: >99% (excellent caching)
-- If <95%, you may need more shared_buffers


-- Query 6: Bloated Tables (Needs VACUUM)
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  n_dead_tup as dead_tuples,
  n_live_tup as live_tuples,
  round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_tuple_percent,
  last_autovacuum,
  last_vacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
  AND schemaname = 'public'
ORDER BY n_dead_tup DESC;

-- If dead_tuple_percent > 20%, run VACUUM


-- Query 7: Most Accessed Tables (Hot tables)
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  seq_scan + idx_scan as total_scans,
  seq_scan,
  idx_scan,
  round(idx_scan * 100.0 / NULLIF(seq_scan + idx_scan, 0), 2) as index_usage_percent,
  n_tup_ins + n_tup_upd + n_tup_del as total_writes,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND (seq_scan + idx_scan) > 0
ORDER BY total_scans DESC
LIMIT 20;

-- High traffic tables - ensure they have proper indexes


-- Query 8: Duplicate Indexes (Redundant indexes to remove)
-- ============================================================================
SELECT 
  indrelid::regclass as table_name,
  array_agg(indexrelid::regclass) as duplicate_indexes,
  array_agg(pg_size_pretty(pg_relation_size(indexrelid))) as sizes
FROM (
  SELECT 
    indrelid,
    indexrelid,
    array_agg(attname ORDER BY attnum) as index_columns
  FROM pg_index
  JOIN pg_attribute ON attrelid = indrelid AND attnum = ANY(indkey)
  WHERE indrelid::regclass::text LIKE 'public.%'
    AND NOT indisprimary
  GROUP BY indrelid, indexrelid
) sub
GROUP BY indrelid, index_columns
HAVING count(*) > 1;

-- Duplicate indexes waste space and slow down writes


-- Query 9: Lock Monitoring (Check for blocking queries)
-- ============================================================================
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Shows queries blocking each other (usually empty is good)


-- Query 10: Equipment Utilization (Business metrics)
-- ============================================================================
SELECT 
  e."unitId",
  e.model,
  e.year,
  e.status,
  COUNT(b.id) as total_bookings,
  SUM(b."totalAmount") as revenue_generated,
  e."totalEngineHours",
  ROUND(
    COUNT(b.id)::numeric * 100.0 / 
    NULLIF((SELECT COUNT(*) FROM bookings), 0), 
    2
  ) as booking_percentage
FROM equipment e
LEFT JOIN bookings b ON b."equipmentId" = e.id AND b.status != 'cancelled'
WHERE e."unitId" LIKE 'UNIT-%'
GROUP BY e.id, e."unitId", e.model, e.year, e.status, e."totalEngineHours"
ORDER BY revenue_generated DESC NULLS LAST;

-- Track which units are most profitable


-- ============================================================================
-- MONTHLY HEALTH CHECK (Run first of each month)
-- ============================================================================

DO $$
DECLARE
  unused_index_count INT;
  cache_hit_ratio NUMERIC;
  bloated_table_count INT;
  avg_query_time NUMERIC;
BEGIN
  -- Count unused indexes
  SELECT COUNT(*) INTO unused_index_count
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public' AND idx_scan = 0
    AND indexrelid NOT IN (SELECT indexrelid FROM pg_index WHERE indisprimary);
    
  -- Get cache hit ratio
  SELECT sum(heap_blks_hit) * 100.0 / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)
  INTO cache_hit_ratio
  FROM pg_statio_user_tables;
  
  -- Count bloated tables
  SELECT COUNT(*) INTO bloated_table_count
  FROM pg_stat_user_tables
  WHERE n_dead_tup > 1000
    AND schemaname = 'public'
    AND round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) > 20;
  
  -- Output health report
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE HEALTH REPORT';
  RAISE NOTICE 'Date: %', NOW();
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Performance Metrics:';
  RAISE NOTICE '  Cache Hit Ratio: %.2f%% %', cache_hit_ratio, 
    CASE WHEN cache_hit_ratio >= 99 THEN '✅ Excellent'
         WHEN cache_hit_ratio >= 95 THEN '🟡 Good'
         ELSE '🔴 Poor' END;
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Index Health:';
  RAISE NOTICE '  Unused Indexes: % %', unused_index_count,
    CASE WHEN unused_index_count < 10 THEN '✅ Excellent'
         WHEN unused_index_count < 50 THEN '🟡 Monitor'
         ELSE '🔴 Review needed' END;
  RAISE NOTICE '';
  RAISE NOTICE '🧹 Table Maintenance:';
  RAISE NOTICE '  Bloated Tables: % %', bloated_table_count,
    CASE WHEN bloated_table_count = 0 THEN '✅ Excellent'
         WHEN bloated_table_count < 5 THEN '🟡 Schedule VACUUM'
         ELSE '🔴 Run VACUUM now' END;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  
  IF cache_hit_ratio < 95 THEN
    RAISE WARNING 'Cache hit ratio is low. Consider increasing shared_buffers.';
  END IF;
  
  IF bloated_table_count > 0 THEN
    RAISE WARNING 'Some tables need VACUUM. Run: VACUUM ANALYZE;';
  END IF;
END $$;


-- ============================================================================
-- WEEKLY PERFORMANCE SNAPSHOT (Run every Monday)
-- ============================================================================

-- Save snapshot to system_metrics table
INSERT INTO system_metrics (
  metric_name,
  metric_category,
  metric_value,
  unit,
  metadata
)
SELECT 
  'database_size',
  'storage',
  pg_database_size(current_database()),
  'bytes',
  jsonb_build_object(
    'timestamp', NOW(),
    'database', current_database(),
    'pretty_size', pg_size_pretty(pg_database_size(current_database()))
  )
UNION ALL
SELECT 
  'cache_hit_ratio',
  'performance',
  sum(heap_blks_hit) * 100.0 / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0),
  'percentage',
  jsonb_build_object(
    'timestamp', NOW(),
    'target', 99.0
  )
FROM pg_statio_user_tables
UNION ALL
SELECT 
  'active_connections',
  'connections',
  count(*),
  'count',
  jsonb_build_object(
    'timestamp', NOW(),
    'max_connections', (SELECT setting::int FROM pg_settings WHERE name = 'max_connections')
  )
FROM pg_stat_activity
WHERE datname = current_database();

-- Track trends over time
```

---

## 🎯 How to Use

### Run Monthly Health Check:

```typescript
// Use Supabase MCP
await mcp_supabase_execute_sql({
  query: `
    -- Run the monthly health check DO block from above
    -- It will output a health report
  `
});

// Expected output:
// ========================================
// DATABASE HEALTH REPORT
// ========================================
// Cache Hit Ratio: 99.5% ✅ Excellent
// Unused Indexes: 71 🟡 Monitor
// Bloated Tables: 0 ✅ Excellent
```

---

### Track Unused Indexes:

```typescript
// Get list of unused indexes
await mcp_supabase_execute_sql({
  query: `
    SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public' AND idx_scan = 0
    ORDER BY pg_relation_size(indexrelid) DESC;
  `
});

// Save results, check again in 3 months
// If still 0 scans, safe to drop
```

---

### Monitor Slow Queries:

```typescript
// Enable pg_stat_statements if not already
await mcp_supabase_execute_sql({
  query: "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
});

// Get slow queries
await mcp_supabase_execute_sql({
  query: `
    SELECT 
      LEFT(query, 100) as query_preview,
      calls,
      ROUND(mean_exec_time::numeric, 2) as avg_ms,
      ROUND(max_exec_time::numeric, 2) as max_ms
    FROM pg_stat_statements
    WHERE mean_exec_time > 100
    ORDER BY mean_exec_time DESC
    LIMIT 10;
  `
});
```

---

## 📊 Monitoring Dashboard (Optional)

Create admin page at `frontend/src/app/admin/database-health/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DatabaseHealthPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    // Fetch recent metrics
    const { data } = await supabase
      .from('system_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    setMetrics(data);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Database Health</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Cache Hit Ratio */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Cache Hit Ratio</h3>
          <p className="mt-2 text-3xl font-bold">
            {metrics?.find(m => m.metric_name === 'cache_hit_ratio')?.metric_value.toFixed(2)}%
          </p>
          <p className="mt-1 text-sm text-green-600">✅ Excellent</p>
        </div>

        {/* Database Size */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Database Size</h3>
          <p className="mt-2 text-3xl font-bold">
            {(metrics?.find(m => m.metric_name === 'database_size')?.metric_value / 1024 / 1024).toFixed(0)} MB
          </p>
        </div>

        {/* Active Connections */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Connections</h3>
          <p className="mt-2 text-3xl font-bold">
            {metrics?.find(m => m.metric_name === 'active_connections')?.metric_value}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            / {metrics?.find(m => m.metric_name === 'active_connections')?.metadata?.max_connections} max
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔔 Alerts to Set Up

### Create Alert Rules:

```sql
-- Insert monitoring alerts
INSERT INTO alert_rules (
  name,
  description,
  metric_name,
  alert_type,
  condition_operator,
  condition_value,
  severity,
  notification_channels
) VALUES
  (
    'Low Cache Hit Ratio',
    'Alert when database cache hit ratio drops below 95%',
    'cache_hit_ratio',
    'threshold',
    '<',
    95,
    'warning',
    ARRAY['email']
  ),
  (
    'High Connection Usage',
    'Alert when connection usage exceeds 80%',
    'connection_usage_percent',
    'threshold',
    '>',
    80,
    'warning',
    ARRAY['email']
  ),
  (
    'Large Table Growth',
    'Alert when table grows >1GB in a week',
    'table_size_change',
    'threshold',
    '>',
    1073741824,
    'info',
    ARRAY['email']
  );

-- Verify alerts created
SELECT name, metric_name, severity, is_active 
FROM alert_rules 
WHERE is_active = true;
```

---

## 📈 Performance Baselines

### Current Metrics (Your Database):
- Total size: ~50MB (small, healthy)
- Tables: 45 in public schema
- Rows: ~1,000 total (low volume)
- Cache hit ratio: Likely >99% (excellent)
- Connections: ~5-10 active (low usage)

### Target Metrics (At Scale):
- Size: <500MB (sustainable)
- Cache hit ratio: >99% (maintain)
- Connections: <50% of max (healthy)
- Avg query time: <50ms (fast)
- Slow queries: <1% of total (good)

---

## 🎯 Monthly Checklist

**Run these on the 1st of each month:**

- [ ] Check unused indexes (Query 1)
- [ ] Review table sizes and growth (Query 2)
- [ ] Analyze slow queries (Query 3)
- [ ] Monitor connections (Query 4)
- [ ] Verify cache hit ratio (Query 5)
- [ ] Check for table bloat (Query 6)
- [ ] Review hot tables (Query 7)
- [ ] Look for duplicate indexes (Query 8)
- [ ] Run full health check (bottom of SQL file)

**Time:** 15 minutes/month  
**Benefit:** Catch issues early!

---

## 🚨 Warning Signs

### Red Flags (Take Action):
- 🔴 Cache hit ratio < 95%
- 🔴 Connection usage > 80%
- 🔴 Avg query time > 500ms
- 🔴 Table bloat > 20%
- 🔴 Locks blocking queries

### Yellow Flags (Monitor):
- 🟡 Cache hit ratio 95-99%
- 🟡 Connection usage 60-80%
- 🟡 Avg query time 100-500ms
- 🟡 71 unused indexes (new tables)

### Green Flags (Excellent):
- ✅ Cache hit ratio > 99%
- ✅ Connection usage < 60%
- ✅ Avg query time < 100ms
- ✅ No table bloat
- ✅ No blocking locks

---

## 💡 Performance Tips

### If Cache Hit Ratio is Low:
```sql
-- Increase shared_buffers (Supabase handles this)
-- Or: Optimize queries to use indexes
CREATE INDEX CONCURRENTLY idx_name ON table(column);
```

### If Queries are Slow:
```sql
-- Use EXPLAIN ANALYZE to debug
EXPLAIN ANALYZE
SELECT * FROM bookings WHERE status = 'confirmed';

-- Add indexes for common filters
CREATE INDEX CONCURRENTLY idx_bookings_status ON bookings(status);
```

### If Tables are Bloated:
```sql
-- Run VACUUM ANALYZE
VACUUM ANALYZE bookings;

-- Or full database:
VACUUM ANALYZE;
```

---

## 🎉 Quick Win Achieved!

**After setup:**
- ✅ Monthly monitoring queries ready
- ✅ Health check automation
- ✅ Alert rules configured
- ✅ Performance baselines established
- ✅ Proactive issue detection

---

**Time Investment:** 30 minutes  
**Impact:** MEDIUM (proactive management)  
**Difficulty:** Easy ⭐  
**Status:** ✅ Ready to use!

**Next:** [QUICK_WIN_5_IMAGE_OPTIMIZATION.md](./QUICK_WIN_5_IMAGE_OPTIMIZATION.md)

---

**Keep your database healthy and fast!** 📊


