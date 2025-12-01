# Quick Start Testing Guide

## Overview

This guide provides quick verification steps to ensure all Supabase optimizations are working correctly.

## Prerequisites

- Supabase local instance running
- Database connection available
- Frontend development server (optional, for full testing)

## Quick Verification (5 minutes)

### 1. Run Verification Script

```bash
# Verify all implementations
./scripts/verify-implementation.sh
```

This script checks:
- ✅ All extensions enabled
- ✅ Materialized views created
- ✅ Scheduled jobs active
- ✅ Webhook infrastructure in place
- ✅ Storage functions available

### 2. Run Performance Benchmarks

```bash
# Benchmark performance improvements
./scripts/benchmark-performance.sh
```

This script tests:
- Dashboard query performance
- Vector search speed
- PostGIS distance calculation
- Materialized view refresh time

### 3. Manual SQL Verification

```sql
-- Check extensions
SELECT extname, extversion FROM pg_extension
WHERE extname IN ('vector', 'postgis', 'pg_cron', 'pg_graphql', 'http');

-- Check materialized views
SELECT matviewname FROM pg_matviews WHERE schemaname = 'public';

-- Check scheduled jobs
SELECT jobname, schedule, active FROM cron.job WHERE active = true;

-- Check webhook infrastructure
SELECT COUNT(*) FROM webhook_endpoints;
SELECT COUNT(*) FROM webhook_events;
```

## Feature-Specific Testing

### Test Semantic Search

1. **Generate Embeddings** (if not already done):
   ```bash
   curl -X POST http://localhost:3000/api/equipment/generate-embeddings \
     -H "Content-Type: application/json" \
     -d '{"batchSize": 10}'
   ```

2. **Test Search API**:
   ```bash
   curl -X POST http://localhost:3000/api/equipment/search \
     -H "Content-Type: application/json" \
     -d '{
       "query": "excavator",
       "searchMode": "semantic",
       "matchThreshold": 0.7
     }'
   ```

### Test Materialized Views

```sql
-- Refresh views manually
SELECT refresh_dashboard_views();

-- Query dashboard overview
SELECT * FROM mv_dashboard_overview;

-- Check last refresh time
SELECT MAX(last_updated) FROM mv_dashboard_overview;
```

### Test PostGIS

```sql
-- Test distance calculation
SELECT calculate_delivery_distance_km('<booking-id>');

-- Test delivery fee calculation
SELECT calculate_delivery_fee('<booking-id>');

-- Test geography point creation
SELECT create_geography_point(45.2733, -66.0633);
```

### Test Scheduled Jobs

```sql
-- List all jobs
SELECT * FROM v_scheduled_jobs;

-- Test job functions manually
SELECT cleanup_old_notifications();
SELECT generate_daily_analytics();
SELECT run_storage_cleanup();
```

### Test Webhooks

```sql
-- Create test webhook endpoint
INSERT INTO webhook_endpoints (name, url, event_types, enabled)
VALUES (
  'test-webhook',
  'https://httpbin.org/post',
  ARRAY['booking.created', 'booking.status_changed'],
  true
);

-- Create test booking to trigger webhook
-- (This will automatically trigger the webhook)

-- Check webhook events
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 5;
```

### Test Realtime

1. **Open browser console** on a page using Realtime hooks
2. **Create/update a booking**
3. **Verify real-time update received** in console

## Expected Results

### Performance Targets
- ✅ Dashboard query: <100ms
- ✅ Search query: <50ms
- ✅ Delivery fee: <10ms
- ✅ View refresh: <5s

### Functional Checks
- ✅ All extensions enabled
- ✅ All views refreshable
- ✅ All jobs scheduled
- ✅ All functions callable
- ✅ All triggers active

## Troubleshooting

### If Verification Fails

1. **Check Migration Status**:
   ```sql
   SELECT version, name FROM supabase_migrations.schema_migrations
   ORDER BY version DESC LIMIT 10;
   ```

2. **Check for Errors**:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```

3. **Review Logs**:
   - Check Supabase logs
   - Check application logs
   - Review migration errors

### Common Issues

**Materialized views not refreshing**:
- Check pg_cron is enabled
- Verify job is scheduled: `SELECT * FROM cron.job WHERE jobname = 'refresh-dashboard-views';`
- Manually refresh: `SELECT refresh_dashboard_views();`

**Webhooks not triggering**:
- Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trg_booking_webhook';`
- Verify webhook endpoint is enabled
- Check webhook_events table for errors

**PostGIS functions failing**:
- Verify PostGIS extension: `SELECT PostGIS_version();`
- Check geography columns populated
- Verify coordinates are valid

## Next Steps

After quick verification:
1. Run full test suite (see `docs/TESTING_VALIDATION.md`)
2. Test in production-like environment
3. Monitor performance metrics
4. Deploy to production (see `docs/DEPLOYMENT_CHECKLIST.md`)


