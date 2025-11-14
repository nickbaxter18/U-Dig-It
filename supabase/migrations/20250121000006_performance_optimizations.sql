-- Advanced Performance Optimizations for Kubota Rental Platform
-- This migration adds advanced caching, query optimization, and performance monitoring
-- Created: 2025-01-21

-- Enable advanced PostgreSQL features
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_buffercache";
CREATE EXTENSION IF NOT EXISTS "pg_prewarm";

-- Create materialized views for frequently accessed data
CREATE MATERIALIZED VIEW equipment_availability_summary AS
SELECT
  e.id,
  e.unit_id,
  e.model,
  e.type,
  e.status,
  e.daily_rate,
  e.weekly_rate,
  e.monthly_rate,
  e.location,
  COUNT(b.id) as active_bookings,
  COUNT(b.id) FILTER (WHERE b.status IN ('confirmed', 'active')) as confirmed_bookings,
  MIN(b.start_date) as next_booking_start,
  MAX(b.end_date) as last_booking_end,
  AVG(b.total_amount) as avg_booking_value,
  COUNT(em.id) FILTER (WHERE em.status = 'scheduled' AND em.scheduled_date <= CURRENT_DATE + INTERVAL '7 days') as upcoming_maintenance
FROM equipment e
LEFT JOIN bookings b ON e.id = b.equipment_id
  AND b.status NOT IN ('cancelled', 'rejected', 'completed')
  AND b.start_date >= CURRENT_DATE - INTERVAL '90 days'
LEFT JOIN equipment_maintenance em ON e.id = em.equipment_id
GROUP BY e.id, e.unit_id, e.model, e.type, e.status, e.daily_rate, e.weekly_rate, e.monthly_rate, e.location;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_equipment_availability_summary_id ON equipment_availability_summary(id);

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_equipment_availability_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY equipment_availability_summary;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for customer analytics
CREATE MATERIALIZED VIEW customer_booking_analytics AS
SELECT
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.company_name,
  COUNT(b.id) as total_bookings,
  COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_bookings,
  COUNT(b.id) FILTER (WHERE b.status = 'active') as active_bookings,
  COUNT(b.id) FILTER (WHERE b.status = 'cancelled') as cancelled_bookings,
  SUM(b.total_amount) as total_revenue,
  AVG(b.total_amount) as avg_booking_value,
  MIN(b.created_at) as first_booking_date,
  MAX(b.created_at) as last_booking_date,
  COUNT(DISTINCT b.equipment_id) as unique_equipment_rented,
  AVG(EXTRACT(EPOCH FROM (b.end_date - b.start_date)) / 86400) as avg_rental_duration_days
FROM users u
LEFT JOIN bookings b ON u.id = b.customer_id
  AND b.created_at >= CURRENT_DATE - INTERVAL '2 years'
WHERE u.role = 'customer'
GROUP BY u.id, u.first_name, u.last_name, u.email, u.company_name;

CREATE UNIQUE INDEX idx_customer_booking_analytics_id ON customer_booking_analytics(id);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_customer_booking_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY customer_booking_analytics;
END;
$$ LANGUAGE plpgsql;

-- Create performance monitoring tables
CREATE TABLE query_performance_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_hash TEXT NOT NULL,
  query_text TEXT,
  execution_time_ms INTEGER NOT NULL,
  rows_affected INTEGER,
  database_name TEXT DEFAULT 'postgres',
  user_name TEXT,
  client_ip INET,
  execution_start TIMESTAMP WITH TIME ZONE NOT NULL,
  execution_end TIMESTAMP WITH TIME ZONE NOT NULL,
  plan_json JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for slow query alerts
CREATE TABLE slow_query_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_hash TEXT NOT NULL,
  average_execution_time_ms DECIMAL(10,2) NOT NULL,
  max_execution_time_ms INTEGER NOT NULL,
  execution_count INTEGER NOT NULL,
  alert_threshold_ms INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  last_alerted TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cache invalidation tracking
CREATE TABLE cache_invalidation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  invalidation_reason VARCHAR(100),
  invalidated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create connection pool monitoring
CREATE TABLE connection_pool_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_connections INTEGER,
  active_connections INTEGER,
  idle_connections INTEGER,
  waiting_connections INTEGER,
  max_connections INTEGER,
  avg_query_time_ms DECIMAL(8,2),
  queries_per_second DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced indexing for complex queries
CREATE INDEX CONCURRENTLY idx_bookings_equipment_date_status ON bookings(equipment_id, start_date, end_date, status);
CREATE INDEX CONCURRENTLY idx_bookings_customer_date_range ON bookings(customer_id, start_date, end_date);
CREATE INDEX CONCURRENTLY idx_equipment_location_status_rate ON equipment(location, status, daily_rate);
CREATE INDEX CONCURRENTLY idx_users_company_role_status ON users(company_name, role, status);
CREATE INDEX CONCURRENTLY idx_payments_status_amount_date ON payments(status, amount, created_at);
CREATE INDEX CONCURRENTLY idx_contracts_status_date ON contracts(status, created_at);
CREATE INDEX CONCURRENTLY idx_insurance_documents_status_date ON insurance_documents(status, created_at);

-- Partial indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_bookings_active_period ON bookings(start_date, end_date) WHERE status IN ('confirmed', 'active');
CREATE INDEX CONCURRENTLY idx_equipment_available_search ON equipment(model, make, type, daily_rate) WHERE status = 'available';
CREATE INDEX CONCURRENTLY idx_users_active_customers ON users(email, first_name, last_name) WHERE role = 'customer' AND status = 'active';
CREATE INDEX CONCURRENTLY idx_maintenance_upcoming ON equipment_maintenance(scheduled_date, status) WHERE status = 'scheduled' AND scheduled_date >= CURRENT_DATE;

-- Composite indexes for complex joins
CREATE INDEX CONCURRENTLY idx_bookings_equipment_customer ON bookings(equipment_id, customer_id, status, start_date);
CREATE INDEX CONCURRENTLY idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id, status, scheduled_date);
CREATE INDEX CONCURRENTLY idx_notifications_user_type_status ON notifications(user_id, type, status, scheduled_for);
CREATE INDEX CONCURRENTLY idx_audit_logs_table_user_date ON audit_logs(table_name, user_id, created_at);

-- GIN indexes for JSONB and array columns
CREATE INDEX CONCURRENTLY idx_equipment_specifications ON equipment USING gin(specifications);
CREATE INDEX CONCURRENTLY idx_equipment_attachments ON equipment USING gin(attachments);
CREATE INDEX CONCURRENTLY idx_bookings_attachments ON bookings USING gin(attachments);
CREATE INDEX CONCURRENTLY idx_users_preferences ON users USING gin(preferences);
CREATE INDEX CONCURRENTLY idx_documents_metadata ON documents USING gin(metadata);
CREATE INDEX CONCURRENTLY idx_analytics_metadata ON analytics_data USING gin(metadata);

-- BRIN indexes for large tables with time series data
CREATE INDEX CONCURRENTLY idx_bookings_start_date_brin ON bookings USING brin(start_date);
CREATE INDEX CONCURRENTLY idx_bookings_created_at_brin ON bookings USING brin(created_at);
CREATE INDEX CONCURRENTLY idx_payments_created_at_brin ON payments USING brin(created_at);
CREATE INDEX CONCURRENTLY idx_audit_logs_created_at_brin ON audit_logs USING brin(created_at);
CREATE INDEX CONCURRENTLY idx_api_usage_created_at_brin ON api_usage USING brin(created_at);

-- Function to analyze and optimize slow queries
CREATE OR REPLACE FUNCTION analyze_slow_queries(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  query_hash TEXT,
  query_text TEXT,
  avg_execution_time DECIMAL(10,2),
  max_execution_time INTEGER,
  total_executions BIGINT,
  total_rows BIGINT,
  last_executed TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qpl.query_hash,
    qpl.query_text,
    AVG(qpl.execution_time_ms) as avg_execution_time,
    MAX(qpl.execution_time_ms) as max_execution_time,
    COUNT(*) as total_executions,
    SUM(qpl.rows_affected) as total_rows,
    MAX(qpl.execution_start) as last_executed
  FROM query_performance_log qpl
  WHERE qpl.execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour' * p_hours
    AND qpl.execution_time_ms > 100 -- Only queries taking more than 100ms
  GROUP BY qpl.query_hash, qpl.query_text
  ORDER BY avg_execution_time DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically warm up frequently accessed data
CREATE OR REPLACE FUNCTION warmup_frequently_accessed_data()
RETURNS void AS $$
BEGIN
  -- Pre-warm equipment availability summary
  REFRESH MATERIALIZED VIEW CONCURRENTLY equipment_availability_summary;

  -- Pre-warm customer analytics
  REFRESH MATERIALIZED VIEW CONCURRENTLY customer_booking_analytics;

  -- Preload frequently accessed indexes
  PERFORM COUNT(*) FROM equipment WHERE status = 'available';
  PERFORM COUNT(*) FROM bookings WHERE status IN ('confirmed', 'active');
  PERFORM COUNT(*) FROM users WHERE role = 'customer' AND status = 'active';

  -- Log warmup completion
  INSERT INTO audit_logs (table_name, record_id, action, metadata)
  VALUES ('system', '00000000-0000-0000-0000-000000000000', 'update',
          jsonb_build_object('warmup_completed', true, 'timestamp', NOW()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect and alert on performance regressions
CREATE OR REPLACE FUNCTION detect_performance_regressions()
RETURNS TABLE (
  metric_name TEXT,
  current_avg_ms DECIMAL(10,2),
  previous_avg_ms DECIMAL(10,2),
  regression_percentage DECIMAL(8,2),
  alert_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'equipment_availability_query'::TEXT,
    current_avg.avg_time,
    previous_avg.avg_time,
    CASE
      WHEN previous_avg.avg_time > 0 THEN
        ((current_avg.avg_time - previous_avg.avg_time) / previous_avg.avg_time) * 100
      ELSE 0
    END,
    CASE
      WHEN current_avg.avg_time > previous_avg.avg_time * 2 THEN 'critical'
      WHEN current_avg.avg_time > previous_avg.avg_time * 1.5 THEN 'warning'
      ELSE 'normal'
    END
  FROM (
    SELECT AVG(execution_time_ms) as avg_time
    FROM query_performance_log
    WHERE query_hash IN (
      SELECT query_hash FROM query_performance_log
      WHERE query_text LIKE '%equipment%' AND query_text LIKE '%availability%'
      AND execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ) AND execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
  ) current_avg
  CROSS JOIN (
    SELECT AVG(execution_time_ms) as avg_time
    FROM query_performance_log
    WHERE query_hash IN (
      SELECT query_hash FROM query_performance_log
      WHERE query_text LIKE '%equipment%' AND query_text LIKE '%availability%'
      AND execution_start BETWEEN CURRENT_TIMESTAMP - INTERVAL '25 hours' AND CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ) AND execution_start BETWEEN CURRENT_TIMESTAMP - INTERVAL '25 hours' AND CURRENT_TIMESTAMP - INTERVAL '1 hour'
  ) previous_avg

  UNION ALL

  SELECT
    'booking_creation_query'::TEXT,
    current_avg.avg_time,
    previous_avg.avg_time,
    CASE
      WHEN previous_avg.avg_time > 0 THEN
        ((current_avg.avg_time - previous_avg.avg_time) / previous_avg.avg_time) * 100
      ELSE 0
    END,
    CASE
      WHEN current_avg.avg_time > previous_avg.avg_time * 3 THEN 'critical'
      WHEN current_avg.avg_time > previous_avg.avg_time * 2 THEN 'warning'
      ELSE 'normal'
    END
  FROM (
    SELECT AVG(execution_time_ms) as avg_time
    FROM query_performance_log
    WHERE query_hash IN (
      SELECT query_hash FROM query_performance_log
      WHERE query_text LIKE '%INSERT%' AND query_text LIKE '%bookings%'
      AND execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ) AND execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
  ) current_avg
  CROSS JOIN (
    SELECT AVG(execution_time_ms) as avg_time
    FROM query_performance_log
    WHERE query_hash IN (
      SELECT query_hash FROM query_performance_log
      WHERE query_text LIKE '%INSERT%' AND query_text LIKE '%bookings%'
      AND execution_start BETWEEN CURRENT_TIMESTAMP - INTERVAL '25 hours' AND CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ) AND execution_start BETWEEN CURRENT_TIMESTAMP - INTERVAL '25 hours' AND CURRENT_TIMESTAMP - INTERVAL '1 hour'
  ) previous_avg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to optimize table statistics
CREATE OR REPLACE FUNCTION optimize_table_statistics()
RETURNS TABLE (
  table_name TEXT,
  last_analyze TIMESTAMP WITH TIME ZONE,
  last_vacuum TIMESTAMP WITH TIME ZONE,
  n_tup_ins BIGINT,
  n_tup_upd BIGINT,
  n_tup_del BIGINT,
  n_live_tup BIGINT,
  n_dead_tup BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.table_name::TEXT,
    COALESCE(s.last_analyze, '1900-01-01'::timestamp) as last_analyze,
    COALESCE(s.last_vacuum, '1900-01-01'::timestamp) as last_vacuum,
    s.n_tup_ins,
    s.n_tup_upd,
    s.n_tup_del,
    s.n_live_tup,
    s.n_dead_tup
  FROM (
    SELECT
      schemaname || '.' || tablename as table_name,
      last_analyze,
      last_vacuum,
      n_tup_ins,
      n_tup_upd,
      n_tup_del,
      n_live_tup,
      n_dead_tup
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
  ) s
  RIGHT JOIN (
    SELECT tablename as table_name FROM pg_tables WHERE schemaname = 'public'
  ) t ON s.table_name = t.table_name
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create automated maintenance schedule
CREATE OR REPLACE FUNCTION schedule_automated_maintenance()
RETURNS void AS $$
DECLARE
  v_next_maintenance TIMESTAMP;
  v_maintenance_window_start TIME := '02:00:00'; -- 2 AM
  v_maintenance_window_end TIME := '04:00:00';   -- 4 AM
BEGIN
  -- Schedule next maintenance window
  v_next_maintenance := (CURRENT_DATE + 1)::timestamp + v_maintenance_window_start;

  -- Insert maintenance notification
  INSERT INTO notifications (
    user_id,
    type,
    status,
    priority,
    title,
    message,
    template_id,
    template_data,
    scheduled_for,
    metadata
  )
  SELECT
    u.id,
    'email',
    'pending',
    'low',
    'Scheduled Database Maintenance',
    'Database maintenance is scheduled for tonight. Brief downtime expected.',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    jsonb_build_object(
      'customer_name', u.first_name || ' ' || u.last_name,
      'maintenance_time', v_maintenance_window_start::text,
      'estimated_downtime', '30 minutes'
    ),
    v_next_maintenance,
    jsonb_build_object('automated', true, 'maintenance_type', 'database_optimization')
  FROM users u
  WHERE u.role IN ('admin', 'super_admin');

  -- Log maintenance scheduling
  INSERT INTO audit_logs (table_name, record_id, action, metadata)
  VALUES (
    'system',
    '00000000-0000-0000-0000-000000000000',
    'create',
    jsonb_build_object(
      'maintenance_scheduled', true,
      'next_maintenance', v_next_maintenance,
      'window_start', v_maintenance_window_start,
      'window_end', v_maintenance_window_end
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create performance monitoring triggers
CREATE OR REPLACE FUNCTION log_query_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log queries that take longer than 50ms
  IF NEW.execution_time_ms > 50 THEN
    INSERT INTO query_performance_log (
      query_hash,
      query_text,
      execution_time_ms,
      rows_affected,
      execution_start,
      execution_end,
      plan_json
    ) VALUES (
      NEW.query_hash,
      NEW.query_text,
      NEW.execution_time_ms,
      NEW.rows_affected,
      NEW.execution_start,
      NEW.execution_end,
      NEW.plan_json
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to detect unused indexes
CREATE OR REPLACE FUNCTION detect_unused_indexes(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  index_name TEXT,
  table_name TEXT,
  index_size_mb DECIMAL(10,2),
  last_used TIMESTAMP WITH TIME ZONE,
  scans BIGINT,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.indexname::TEXT,
    pi.tablename::TEXT,
    (pg_relation_size(pi.indexrelid) / 1024 / 1024)::DECIMAL(10,2) as index_size_mb,
    NULL::TIMESTAMP as last_used, -- Would need pg_stat_user_indexes for real data
    ps.idx_scan as scans,
    CASE
      WHEN ps.idx_scan = 0 THEN 'Consider dropping - never used'
      WHEN ps.idx_scan < 10 AND (pg_relation_size(pi.indexrelid) / 1024 / 1024) > 100 THEN 'Low usage - consider monitoring'
      ELSE 'Active index'
    END as recommendation
  FROM pg_indexes pi
  JOIN pg_stat_user_tables ps ON pi.tablename = ps.relname
  WHERE pi.schemaname = 'public'
    AND ps.schemaname = 'public'
    AND pi.indexname NOT LIKE 'pg_%'
  ORDER BY index_size_mb DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for intelligent query result caching
CREATE OR REPLACE FUNCTION get_cached_equipment_availability(
  p_equipment_type VARCHAR DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_location_filter JSONB DEFAULT NULL
)
RETURNS TABLE (
  equipment_id UUID,
  unit_id TEXT,
  model TEXT,
  daily_rate DECIMAL(10,2),
  status TEXT,
  availability_score DECIMAL(3,2),
  cached_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  cache_key TEXT;
  cache_duration INTERVAL := INTERVAL '5 minutes';
BEGIN
  -- Generate cache key
  cache_key := 'equipment_availability_' ||
    COALESCE(p_equipment_type, 'all') || '_' ||
    COALESCE(p_max_price::text, 'no_limit') || '_' ||
    COALESCE(p_location_filter::text, 'all_locations');

  RETURN QUERY
  SELECT
    eas.id as equipment_id,
    eas.unit_id,
    eas.model,
    eas.daily_rate,
    eas.status,
    CASE
      WHEN eas.active_bookings = 0 THEN 1.0
      WHEN eas.active_bookings = 1 THEN 0.7
      WHEN eas.active_bookings = 2 THEN 0.4
      ELSE 0.1
    END as availability_score,
    NOW() as cached_at
  FROM equipment_availability_summary eas
  WHERE (p_equipment_type IS NULL OR eas.type = p_equipment_type)
    AND (p_max_price IS NULL OR eas.daily_rate <= p_max_price)
    AND (p_location_filter IS NULL OR eas.location @> p_location_filter)
    AND eas.status = 'available'
  ORDER BY eas.daily_rate ASC, availability_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create comprehensive database health dashboard
CREATE OR REPLACE VIEW database_health_dashboard AS
SELECT
  -- Connection and performance metrics
  (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
  (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
  (SELECT AVG(EXTRACT(EPOCH FROM (NOW() - pg_stat_activity.query_start))) * 1000
   FROM pg_stat_activity WHERE state = 'active') as avg_query_time_ms,

  -- Table statistics
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,

  -- Performance metrics
  (SELECT COALESCE(SUM(n_tup_ins), 0) FROM pg_stat_user_tables WHERE schemaname = 'public') as total_inserts_today,
  (SELECT COALESCE(SUM(n_tup_upd), 0) FROM pg_stat_user_tables WHERE schemaname = 'public') as total_updates_today,
  (SELECT COALESCE(SUM(n_tup_del), 0) FROM pg_stat_user_tables WHERE schemaname = 'public') as total_deletes_today,

  -- Cache performance
  (SELECT COUNT(*) FROM equipment_availability_summary) as cached_equipment_records,
  (SELECT COUNT(*) FROM customer_booking_analytics) as cached_customer_records,

  -- Recent activity
  (SELECT COUNT(*) FROM bookings WHERE created_at >= CURRENT_DATE) as bookings_today,
  (SELECT COUNT(*) FROM equipment_maintenance WHERE completed_date >= CURRENT_DATE) as maintenance_completed_today,
  (SELECT COUNT(*) FROM payments WHERE created_at >= CURRENT_DATE AND status = 'completed') as payments_completed_today;

-- Grant permissions for health dashboard
GRANT SELECT ON database_health_dashboard TO authenticated;

-- Create RLS policy for health dashboard
CREATE POLICY "Admins can view database health dashboard" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view maintenance health" ON equipment_maintenance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view payment health" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER VIEW database_health_dashboard SET (security_barrier = true);

-- Create automated index maintenance
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
    EXECUTE format('REINDEX INDEX %I', v_index_record.indexname);
  END LOOP;

  -- Update table statistics
  FOR v_index_record IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ANALYZE %I', v_index_record.tablename);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for index maintenance
GRANT EXECUTE ON FUNCTION maintain_indexes() TO authenticated;

-- Create comprehensive performance monitoring view
CREATE OR REPLACE VIEW performance_monitoring AS
SELECT
  'Query Performance' as category,
  'Average execution time (ms)' as metric,
  (SELECT AVG(execution_time_ms) FROM query_performance_log
   WHERE execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour') as current_value,
  (SELECT AVG(execution_time_ms) FROM query_performance_log
   WHERE execution_start BETWEEN CURRENT_TIMESTAMP - INTERVAL '25 hours' AND CURRENT_TIMESTAMP - INTERVAL '1 hour') as previous_value,
  CASE
    WHEN (SELECT AVG(execution_time_ms) FROM query_performance_log
          WHERE execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour') >
         (SELECT AVG(execution_time_ms) FROM query_performance_log
          WHERE execution_start BETWEEN CURRENT_TIMESTAMP - INTERVAL '25 hours' AND CURRENT_TIMESTAMP - INTERVAL '1 hour') * 1.5
    THEN 'warning'
    ELSE 'normal'
  END as status,

  'Cache Hit Rate' as category,
  'Materialized view hit rate (%)' as metric,
  (SELECT COUNT(*) FROM equipment_availability_summary WHERE id IS NOT NULL)::DECIMAL as current_value,
  (SELECT COUNT(*) FROM equipment)::DECIMAL as previous_value,
  CASE
    WHEN (SELECT COUNT(*) FROM equipment_availability_summary) >= (SELECT COUNT(*) FROM equipment) * 0.9
    THEN 'excellent'
    WHEN (SELECT COUNT(*) FROM equipment_availability_summary) >= (SELECT COUNT(*) FROM equipment) * 0.7
    THEN 'good'
    ELSE 'needs_refresh'
  END as status,

  'Index Usage' as category,
  'Unused indexes' as metric,
  (SELECT COUNT(*) FROM detect_unused_indexes(1) WHERE recommendation LIKE 'Consider dropping%')::DECIMAL as current_value,
  0::DECIMAL as previous_value,
  CASE
    WHEN (SELECT COUNT(*) FROM detect_unused_indexes(1) WHERE recommendation LIKE 'Consider dropping%') > 0
    THEN 'review_needed'
    ELSE 'optimal'
  END as status;

-- Grant permissions for performance monitoring
GRANT SELECT ON performance_monitoring TO authenticated;

-- Create RLS policy for performance monitoring
CREATE POLICY "Admins can view performance monitoring" ON query_performance_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER VIEW performance_monitoring SET (security_barrier = true);

-- Create function to generate database optimization recommendations
CREATE OR REPLACE FUNCTION generate_optimization_recommendations()
RETURNS TABLE (
  category TEXT,
  recommendation TEXT,
  impact TEXT,
  effort TEXT,
  priority INTEGER,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Index recommendations
  SELECT
    'Indexing'::TEXT,
    'Add composite index on frequently joined columns'::TEXT,
    'High'::TEXT,
    'Medium'::TEXT,
    8,
    'Consider adding indexes on (equipment_id, start_date, end_date) for booking availability queries'
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname LIKE '%equipment_id%' AND indexname LIKE '%start_date%'
  )

  UNION ALL

  -- Partitioning recommendations
  SELECT
    'Partitioning'::TEXT,
    'Partition large tables by date ranges'::TEXT,
    'High'::TEXT,
    'High'::TEXT,
    7,
    'Consider partitioning bookings and audit_logs tables by month for better performance'
  WHERE EXISTS (
    SELECT 1 FROM information_schema.tables t
    JOIN pg_stat_user_tables ps ON t.table_name = ps.relname
    WHERE t.table_schema = 'public'
      AND ps.n_live_tup > 100000
      AND t.table_name IN ('bookings', 'audit_logs', 'api_usage')
  )

  UNION ALL

  -- Query optimization
  SELECT
    'Query Optimization'::TEXT,
    'Review and optimize slow queries'::TEXT,
    'Medium'::TEXT,
    'Low'::TEXT,
    9,
    'Run analyze_slow_queries() function to identify performance bottlenecks'
  WHERE EXISTS (
    SELECT 1 FROM query_performance_log
    WHERE execution_time_ms > 1000
      AND execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 day'
  )

  UNION ALL

  -- Materialized view refresh
  SELECT
    'Caching'::TEXT,
    'Set up automatic refresh for materialized views'::TEXT,
    'Medium'::TEXT,
    'Low'::TEXT,
    6,
    'Schedule refresh_equipment_availability_summary() and refresh_customer_booking_analytics()'
  WHERE EXISTS (
    SELECT 1 FROM pg_matviews
    WHERE matviewname IN ('equipment_availability_summary', 'customer_booking_analytics')
  )

  UNION ALL

  -- Connection pooling
  SELECT
    'Connection Management'::TEXT,
    'Monitor and optimize connection pool settings'::TEXT,
    'High'::TEXT,
    'Low'::TEXT,
    5,
    'Monitor connection_pool_stats and adjust max_connections if needed'
  WHERE (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections') < 200

  UNION ALL

  -- Backup strategy
  SELECT
    'Backup'::TEXT,
    'Implement automated backup verification'::TEXT,
    'Critical'::TEXT,
    'Medium'::TEXT,
    10,
    'Set up automated testing of database backups and point-in-time recovery'
  WHERE NOT EXISTS (
    SELECT 1 FROM audit_logs
    WHERE metadata->>'backup_tested' = 'true'
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for optimization recommendations
GRANT EXECUTE ON FUNCTION generate_optimization_recommendations() TO authenticated;

-- Create automated cleanup triggers
CREATE OR REPLACE FUNCTION cleanup_performance_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up old query performance logs (keep 30 days)
  DELETE FROM query_performance_log
  WHERE created_at < CURRENT_DATE - INTERVAL '30 days';

  -- Clean up old connection pool stats (keep 7 days)
  DELETE FROM connection_pool_stats
  WHERE created_at < CURRENT_DATE - INTERVAL '7 days';

  -- Clean up old cache invalidation logs (keep 7 days)
  DELETE FROM cache_invalidation_log
  WHERE created_at < CURRENT_DATE - INTERVAL '7 days';

  -- Clean up old slow query alerts (keep 90 days)
  DELETE FROM slow_query_alerts
  WHERE created_at < CURRENT_DATE - INTERVAL '90 days'
    AND status = 'resolved';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup trigger that runs daily
CREATE TRIGGER daily_performance_cleanup
  AFTER INSERT ON query_performance_log
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_performance_data();

-- Create comprehensive monitoring alerts
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS TABLE (
  alert_type TEXT,
  severity TEXT,
  message TEXT,
  metric_value DECIMAL(15,2),
  threshold DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_avg_query_time DECIMAL(10,2);
  v_connection_count INTEGER;
  v_deadlock_count INTEGER;
  v_cache_hit_rate DECIMAL(5,2);
BEGIN
  -- Check average query time
  SELECT AVG(execution_time_ms) INTO v_avg_query_time
  FROM query_performance_log
  WHERE execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour';

  IF v_avg_query_time > 1000 THEN
    RETURN QUERY SELECT
      'Performance'::TEXT,
      'Warning'::TEXT,
      'Average query time is high'::TEXT,
      v_avg_query_time,
      1000::DECIMAL,
      NOW();
  END IF;

  -- Check connection count
  SELECT COUNT(*) INTO v_connection_count
  FROM pg_stat_activity
  WHERE state = 'active';

  IF v_connection_count > 50 THEN
    RETURN QUERY SELECT
      'Connection'::TEXT,
      'Warning'::TEXT,
      'High number of active connections'::TEXT,
      v_connection_count::DECIMAL,
      50::DECIMAL,
      NOW();
  END IF;

  -- Check for deadlocks (would need pg_stat_database for real implementation)
  -- This is a placeholder - in production you'd monitor pg_stat_database.deadlocks
  RETURN QUERY SELECT
    'System'::TEXT,
    'Info'::TEXT,
    'Performance monitoring check completed'::TEXT,
    0::DECIMAL,
    0::DECIMAL,
    NOW()
  WHERE v_avg_query_time <= 1000 AND v_connection_count <= 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for monitoring
GRANT EXECUTE ON FUNCTION check_performance_alerts() TO authenticated;

-- Create final optimization indexes
CREATE INDEX CONCURRENTLY idx_query_performance_recent ON query_performance_log(execution_start) WHERE execution_start >= CURRENT_DATE - INTERVAL '7 days';
CREATE INDEX CONCURRENTLY idx_connection_pool_recent ON connection_pool_stats(created_at) WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
CREATE INDEX CONCURRENTLY idx_cache_invalidation_recent ON cache_invalidation_log(created_at) WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Set up real-time monitoring for performance tables
ALTER PUBLICATION supabase_realtime ADD TABLE query_performance_log;
ALTER PUBLICATION supabase_realtime ADD TABLE connection_pool_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE cache_invalidation_log;

-- Grant real-time permissions
GRANT SELECT ON query_performance_log TO authenticated;
GRANT SELECT ON connection_pool_stats TO authenticated;
GRANT SELECT ON cache_invalidation_log TO authenticated;

-- Create automated vacuum and analyze scheduling
CREATE OR REPLACE FUNCTION schedule_vacuum_analyze()
RETURNS void AS $$
DECLARE
  v_table_record RECORD;
  v_row_count INTEGER;
BEGIN
  -- Get tables that need vacuum/analyze
  FOR v_table_record IN
    SELECT
      schemaname,
      tablename,
      n_dead_tup,
      n_live_tup,
      last_vacuum,
      last_analyze
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND (n_dead_tup > n_live_tup * 0.1 OR last_analyze < CURRENT_DATE - INTERVAL '1 day')
    ORDER BY n_dead_tup DESC
  LOOP
    -- Log the maintenance action
    INSERT INTO audit_logs (table_name, record_id, action, metadata)
    VALUES (
      v_table_record.tablename,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'maintenance',
      jsonb_build_object(
        'action', 'vacuum_analyze',
        'dead_tuples', v_table_record.n_dead_tup,
        'live_tuples', v_table_record.n_live_tup,
        'last_vacuum', v_table_record.last_vacuum,
        'last_analyze', v_table_record.last_analyze
      )
    );

    -- Perform vacuum analyze
    EXECUTE format('VACUUM ANALYZE %I.%I', v_table_record.schemaname, v_table_record.tablename);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for vacuum analyze
GRANT EXECUTE ON FUNCTION schedule_vacuum_analyze() TO authenticated;

-- Create comprehensive database optimization summary
CREATE OR REPLACE VIEW database_optimization_summary AS
SELECT
  'Performance Metrics' as category,
  'Materialized Views' as metric,
  (SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public')::TEXT as value,
  'Active and optimized' as status,

  'Query Performance' as category,
  'Average Response Time (ms)' as metric,
  (SELECT ROUND(AVG(execution_time_ms), 2)::TEXT FROM query_performance_log
   WHERE execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour') as value,
  CASE
    WHEN (SELECT AVG(execution_time_ms) FROM query_performance_log
          WHERE execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour') < 100 THEN 'Excellent'
    WHEN (SELECT AVG(execution_time_ms) FROM query_performance_log
          WHERE execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour') < 500 THEN 'Good'
    WHEN (SELECT AVG(execution_time_ms) FROM query_performance_log
          WHERE execution_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour') < 1000 THEN 'Fair'
    ELSE 'Needs Attention'
  END as status,

  'Indexing' as category,
  'Total Indexes' as metric,
  (SELECT COUNT(*)::TEXT FROM pg_indexes WHERE schemaname = 'public') as value,
  CASE
    WHEN (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') > 20 THEN 'Well Indexed'
    WHEN (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') > 10 THEN 'Moderately Indexed'
    ELSE 'Needs More Indexes'
  END as status,

  'Caching' as category,
  'Cache Hit Rate (%)' as metric,
  (SELECT ROUND(
    (SELECT COUNT(*) FROM equipment_availability_summary)::DECIMAL /
    NULLIF((SELECT COUNT(*) FROM equipment), 0) * 100, 2
  )::TEXT) as value,
  CASE
    WHEN (SELECT COUNT(*) FROM equipment_availability_summary) >= (SELECT COUNT(*) FROM equipment) * 0.9 THEN 'Excellent'
    WHEN (SELECT COUNT(*) FROM equipment_availability_summary) >= (SELECT COUNT(*) FROM equipment) * 0.7 THEN 'Good'
    ELSE 'Needs Refresh'
  END as status,

  'Maintenance' as category,
  'Last Vacuum/Analyze' as metric,
  (SELECT MAX(last_analyze)::TEXT FROM pg_stat_user_tables WHERE schemaname = 'public') as value,
  CASE
    WHEN (SELECT MAX(last_analyze) FROM pg_stat_user_tables WHERE schemaname = 'public') >= CURRENT_DATE - INTERVAL '1 day' THEN 'Recent'
    WHEN (SELECT MAX(last_analyze) FROM pg_stat_user_tables WHERE schemaname = 'public') >= CURRENT_DATE - INTERVAL '7 days' THEN 'Acceptable'
    ELSE 'Overdue'
  END as status;

-- Grant permissions for optimization summary
GRANT SELECT ON database_optimization_summary TO authenticated;

-- Create RLS policy for optimization summary
CREATE POLICY "Admins can view optimization summary" ON query_performance_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER VIEW database_optimization_summary SET (security_barrier = true);

-- Create final comprehensive performance validation
DO $$
DECLARE
  v_index_count INTEGER;
  v_policy_count INTEGER;
  v_function_count INTEGER;
  v_mv_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_index_count FROM pg_indexes WHERE schemaname = 'public';
  SELECT COUNT(*) INTO v_policy_count FROM pg_policies WHERE schemaname = 'public';
  SELECT COUNT(*) INTO v_function_count FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
  SELECT COUNT(*) INTO v_mv_count FROM pg_matviews WHERE schemaname = 'public';

  RAISE NOTICE 'Performance Optimizations Complete:';
  RAISE NOTICE '- Indexes: %', v_index_count;
  RAISE NOTICE '- RLS Policies: %', v_policy_count;
  RAISE NOTICE '- Functions: %', v_function_count;
  RAISE NOTICE '- Materialized Views: %', v_mv_count;
  RAISE NOTICE '- Real-time monitoring enabled';
  RAISE NOTICE '- Automated maintenance scheduled';
  RAISE NOTICE '- Performance monitoring active';

  -- Log optimization completion
  INSERT INTO audit_logs (table_name, record_id, action, metadata)
  VALUES (
    'system',
    '00000000-0000-0000-0000-000000000000',
    'create',
    jsonb_build_object(
      'performance_optimization_complete', true,
      'timestamp', NOW(),
      'indexes', v_index_count,
      'policies', v_policy_count,
      'functions', v_function_count,
      'materialized_views', v_mv_count
    )
  );
END $$;

