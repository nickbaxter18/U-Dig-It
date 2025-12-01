# Testing & Validation Guide

## Overview

This document provides comprehensive testing procedures for all Supabase feature optimizations implemented across the 4 phases.

## Pre-Testing Checklist

- [ ] All migrations applied successfully
- [ ] No critical security issues (check advisors)
- [ ] Database backups created
- [ ] Test branch created (if using Supabase branches)
- [ ] Test data prepared

## Phase 1: Quick Wins Testing

### 1.1 pgvector Semantic Search

**Test Cases**:
1. **Vector Search Function**
   ```sql
   -- Test vector similarity search
   SELECT * FROM search_equipment_by_similarity(
     '[0.1,0.2,0.3,...]'::vector(1536),  -- Replace with actual embedding
     0.7,  -- match threshold
     20,   -- match count
     NULL  -- no status filter
   );
   ```

2. **Embedding Generation API**
   ```bash
   # Test embedding generation endpoint
   curl -X POST http://localhost:3000/api/equipment/generate-embeddings \
     -H "Content-Type: application/json" \
     -d '{"equipmentIds": ["<equipment-id>"], "batchSize": 10}'
   ```

3. **Search API with Semantic Mode**
   ```bash
   # Test semantic search
   curl -X POST http://localhost:3000/api/equipment/search \
     -H "Content-Type: application/json" \
     -d '{
       "query": "excavator for digging",
       "searchMode": "semantic",
       "matchThreshold": 0.7
     }'
   ```

**Success Criteria**:
- ✅ Vector search returns relevant results
- ✅ Embedding generation completes without errors
- ✅ Search query time <50ms
- ✅ Semantic results more relevant than keyword-only

### 1.2 Supabase Analytics

**Test Cases**:
1. **Analytics Enabled**
   ```sql
   -- Verify analytics is enabled
   SELECT * FROM pg_settings WHERE name = 'analytics.enabled';
   ```

2. **Analytics Views**
   ```sql
   -- Test analytics summary view
   SELECT * FROM v_analytics_summary LIMIT 10;
   ```

3. **Admin Dashboard**
   - Navigate to `/admin/analytics`
   - Verify metrics display correctly
   - Check date range filters work

**Success Criteria**:
- ✅ Analytics enabled in config
- ✅ Analytics views return data
- ✅ Admin dashboard loads without errors
- ✅ Metrics display correctly

### 1.3 PostGIS Geographic Queries

**Test Cases**:
1. **PostGIS Extension**
   ```sql
   -- Verify PostGIS is enabled
   SELECT PostGIS_version();
   ```

2. **Geography Columns**
   ```sql
   -- Check geography columns exist
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name IN ('equipment', 'bookings', 'locations')
     AND column_name LIKE '%geography%';
   ```

3. **Distance Calculation**
   ```sql
   -- Test distance calculation function
   SELECT calculate_delivery_distance_km('<booking-id>');
   ```

4. **Delivery Fee Calculation**
   ```sql
   -- Test PostGIS-based delivery fee
   SELECT calculate_delivery_fee('<booking-id>');
   ```

**Success Criteria**:
- ✅ PostGIS extension enabled
- ✅ Geography columns populated
- ✅ Distance calculations accurate
- ✅ Delivery fee calculation <10ms

## Phase 2: Performance Optimizations Testing

### 2.1 Materialized Views

**Test Cases**:
1. **Materialized Views Created**
   ```sql
   -- List all materialized views
   SELECT schemaname, matviewname
   FROM pg_matviews
   WHERE schemaname = 'public';
   ```

2. **View Refresh Function**
   ```sql
   -- Test refresh function
   SELECT refresh_dashboard_views();
   ```

3. **Dashboard API Performance**
   ```bash
   # Measure dashboard load time
   time curl http://localhost:3000/api/admin/dashboard/overview?range=month
   ```

4. **pg_cron Job**
   ```sql
   -- Check scheduled jobs
   SELECT * FROM v_scheduled_jobs WHERE jobname = 'refresh-dashboard-views';
   ```

**Success Criteria**:
- ✅ Materialized views exist
- ✅ Refresh function works
- ✅ Dashboard loads in <100ms
- ✅ pg_cron job scheduled correctly

### 2.2 Connection Pooling

**Test Cases**:
1. **Pool Configuration**
   ```sql
   -- Check pool configuration
   SELECT * FROM v_pooler_config;
   ```

2. **Pool Health**
   ```sql
   -- Check connection pool health
   SELECT * FROM check_connection_pool_health();
   ```

3. **Connection Stats**
   ```sql
   -- Monitor connection usage
   SELECT * FROM v_connection_pool_stats;
   ```

**Success Criteria**:
- ✅ Pool configuration correct
- ✅ Health check returns status
- ✅ Connection usage monitored
- ✅ No connection pool errors

### 2.3 pg_cron Scheduled Jobs

**Test Cases**:
1. **Scheduled Jobs List**
   ```sql
   -- List all scheduled jobs
   SELECT * FROM v_scheduled_jobs;
   ```

2. **Job Execution History**
   ```sql
   -- Check job run history (if available)
   SELECT * FROM cron.job_run_details
   ORDER BY start_time DESC
   LIMIT 10;
   ```

3. **Manual Job Execution**
   ```sql
   -- Test cleanup job manually
   SELECT cleanup_old_notifications();
   SELECT archive_old_audit_logs();
   SELECT generate_daily_analytics();
   ```

**Success Criteria**:
- ✅ All jobs scheduled correctly
- ✅ Jobs execute without errors
- ✅ Job history tracked
- ✅ Scheduled times correct

## Phase 3: Advanced Features Testing

### 3.1 GraphQL API

**Test Cases**:
1. **GraphQL Endpoint**
   ```bash
   # Test GraphQL query
   curl -X POST http://localhost:54321/rest/v1/graphql \
     -H "Content-Type: application/json" \
     -H "apikey: <anon-key>" \
     -d '{
       "query": "{ equipmentCollection(first: 5) { edges { node { id unitId } } } }"
     }'
   ```

2. **Schema Introspection**
   ```graphql
   query IntrospectionQuery {
     __schema {
       types {
         name
         kind
       }
     }
   }
   ```

**Success Criteria**:
- ✅ GraphQL endpoint accessible
- ✅ Queries return data
- ✅ RLS policies enforced
- ✅ Documentation complete

### 3.2 Database Webhooks

**Test Cases**:
1. **Webhook Infrastructure**
   ```sql
   -- Check webhook tables exist
   SELECT * FROM webhook_endpoints;
   SELECT * FROM webhook_events LIMIT 10;
   ```

2. **Webhook Trigger**
   ```sql
   -- Create test booking to trigger webhook
   INSERT INTO bookings (...)
   VALUES (...);

   -- Check webhook event was created
   SELECT * FROM webhook_events
   WHERE entity_table = 'bookings'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **Webhook Function**
   ```sql
   -- Test webhook call function
   SELECT call_webhook(
     '<webhook-id>',
     'test.event',
     '{"test": "data"}'::jsonb
   );
   ```

**Success Criteria**:
- ✅ Webhook tables created
- ✅ Triggers fire on events
- ✅ Webhook events logged
- ✅ HTTP calls succeed

### 3.3 Enhanced Realtime

**Test Cases**:
1. **Realtime Hooks**
   ```typescript
   // Test useRealtimeBooking hook
   const { booking, loading, error } = useRealtimeBooking({
     bookingId: '<booking-id>',
     onUpdate: (booking) => console.log('Updated:', booking)
   });
   ```

2. **Realtime Dashboard**
   ```typescript
   // Test useRealtimeDashboard hook
   const { metrics, refresh } = useRealtimeDashboard({
     onMetricsUpdate: (metrics) => console.log('Metrics:', metrics)
   });
   ```

3. **Realtime Subscriptions**
   - Open browser console
   - Create/update booking
   - Verify realtime update received

**Success Criteria**:
- ✅ Hooks work without errors
- ✅ Real-time updates received
- ✅ Subscriptions clean up properly
- ✅ No memory leaks

## Phase 4: Infrastructure Testing

### 4.1 Backups

**Test Cases**:
1. **Backup Configuration**
   - Navigate to Supabase Dashboard
   - Check backup settings
   - Verify retention policy

2. **Backup Verification**
   - Check backup history
   - Verify recent backups succeeded
   - Check backup sizes

**Success Criteria**:
- ✅ Backups enabled
- ✅ Retention policy configured
- ✅ Recent backups successful
- ✅ Documentation complete

### 4.2 Storage Optimization

**Test Cases**:
1. **Storage Usage Stats**
   ```sql
   -- Check storage usage
   SELECT * FROM v_storage_usage;
   ```

2. **Cleanup Functions**
   ```sql
   -- Test orphaned file cleanup (dry run)
   SELECT * FROM cleanup_orphaned_files('user-uploads', true);

   -- Test old file cleanup (dry run)
   SELECT * FROM cleanup_old_files('user-uploads', 90, true);
   ```

3. **Scheduled Cleanup**
   ```sql
   -- Check cleanup job scheduled
   SELECT * FROM v_scheduled_jobs WHERE jobname = 'storage-cleanup';
   ```

**Success Criteria**:
- ✅ Storage stats available
- ✅ Cleanup functions work
- ✅ Scheduled job configured
- ✅ No orphaned files (after cleanup)

## Performance Benchmarking

### Before/After Metrics

**Dashboard Load Time**:
- Before: 2-5 seconds
- Target: <100ms
- Test: Measure API response time

**Search Query Time**:
- Before: 100-200ms
- Target: <50ms
- Test: Measure search API response time

**Delivery Fee Calculation**:
- Before: 100-200ms
- Target: <10ms
- Test: Measure function execution time

### Benchmark Script

```sql
-- Dashboard query benchmark
EXPLAIN ANALYZE
SELECT * FROM mv_dashboard_overview;

-- Search query benchmark
EXPLAIN ANALYZE
SELECT * FROM search_equipment_by_similarity(
  '[0.1,0.2,...]'::vector(1536),
  0.7, 20, NULL
);

-- Delivery fee benchmark
EXPLAIN ANALYZE
SELECT calculate_delivery_fee('<booking-id>');
```

## Integration Testing

### End-to-End Tests

1. **Complete Booking Flow**
   - Create booking with delivery
   - Verify geography point stored
   - Check delivery fee calculated
   - Verify webhook triggered

2. **Dashboard Load**
   - Load admin dashboard
   - Verify materialized views used
   - Check real-time updates work
   - Verify metrics accurate

3. **Search Flow**
   - Perform keyword search
   - Switch to semantic search
   - Verify results relevant
   - Check performance

## Rollback Procedures

### If Issues Found

1. **Disable New Features**
   ```sql
   -- Disable webhook triggers
   DROP TRIGGER IF EXISTS trg_booking_webhook ON bookings;

   -- Disable pg_cron jobs
   SELECT cron.unschedule('refresh-dashboard-views');
   SELECT cron.unschedule('storage-cleanup');
   ```

2. **Restore Previous Functions**
   - Revert function changes
   - Restore previous delivery fee calculation
   - Remove materialized views if needed

3. **Database Restore**
   - Use Supabase backup restore
   - Restore to point before migrations

## Test Results Template

```
## Test Results - [Date]

### Phase 1: Quick Wins
- [ ] pgvector: ✅/❌
- [ ] Analytics: ✅/❌
- [ ] PostGIS: ✅/❌

### Phase 2: Performance
- [ ] Materialized Views: ✅/❌
- [ ] Connection Pooling: ✅/❌
- [ ] pg_cron: ✅/❌

### Phase 3: Advanced Features
- [ ] GraphQL: ✅/❌
- [ ] Webhooks: ✅/❌
- [ ] Realtime: ✅/❌

### Phase 4: Infrastructure
- [ ] Backups: ✅/❌
- [ ] Storage: ✅/❌

### Performance Metrics
- Dashboard Load: ___ms (target: <100ms)
- Search Query: ___ms (target: <50ms)
- Delivery Fee: ___ms (target: <10ms)

### Issues Found
1. [Issue description]
2. [Issue description]

### Next Steps
- [ ] Fix issues
- [ ] Re-test
- [ ] Deploy to production
```


