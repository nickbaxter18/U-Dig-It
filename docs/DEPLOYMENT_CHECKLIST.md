# Deployment Checklist

## Pre-Deployment

### 1. Backup
- [ ] Create full database backup
- [ ] Verify backup completed successfully
- [ ] Document backup location and timestamp

### 2. Review
- [ ] Review all migrations in order
- [ ] Check security advisors (no critical issues)
- [ ] Check performance advisors
- [ ] Review rollback procedures

### 3. Testing
- [ ] Test in Supabase branch (if available)
- [ ] Run integration tests
- [ ] Verify all features work
- [ ] Performance benchmarks completed

## Deployment Steps

### 1. Apply Migrations
All migrations should be applied in order. The migrations are:
1. pgvector verification
2. PostGIS setup
3. Materialized views
4. Scheduled jobs
5. Webhook infrastructure
6. Storage cleanup

**Note**: Migrations are already applied via Supabase MCP tools. Verify they're in production.

### 2. Verify Extensions
```sql
-- Check all extensions are enabled
SELECT extname, extversion FROM pg_extension
WHERE extname IN ('vector', 'postgis', 'pg_cron', 'pg_graphql', 'http');
```

### 3. Verify Materialized Views
```sql
-- Check materialized views exist
SELECT matviewname FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname LIKE 'mv_%';
```

### 4. Verify Scheduled Jobs
```sql
-- Check scheduled jobs
SELECT jobname, schedule, active FROM cron.job WHERE active = true;
```

### 5. Verify Functions
```sql
-- Check key functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'refresh_dashboard_views',
    'calculate_delivery_fee',
    'search_equipment_by_similarity',
    'trigger_webhooks'
  );
```

## Post-Deployment

### 1. Verification
- [ ] Dashboard loads successfully
- [ ] Search works (keyword and semantic)
- [ ] Delivery fees calculate correctly
- [ ] Scheduled jobs execute
- [ ] Webhooks trigger on events
- [ ] Realtime subscriptions work

### 2. Monitoring
- [ ] Monitor connection pool usage
- [ ] Check materialized view refresh times
- [ ] Verify scheduled jobs run successfully
- [ ] Monitor storage cleanup results
- [ ] Check for errors in logs

### 3. Performance
- [ ] Dashboard load time <100ms
- [ ] Search query time <50ms
- [ ] Delivery fee calculation <10ms
- [ ] No performance regressions

## Rollback Plan

If issues are found:

1. **Disable New Features**
   ```sql
   -- Disable webhook triggers
   DROP TRIGGER IF EXISTS trg_booking_webhook ON bookings;

   -- Disable scheduled jobs
   SELECT cron.unschedule('refresh-dashboard-views');
   SELECT cron.unschedule('storage-cleanup');
   SELECT cron.unschedule('cleanup-old-notifications');
   SELECT cron.unschedule('archive-old-audit-logs');
   SELECT cron.unschedule('generate-daily-analytics');
   ```

2. **Restore Database**
   - Use Supabase backup restore
   - Restore to point before migrations

3. **Revert Code Changes**
   - Revert API route changes
   - Revert component changes
   - Restore previous functions

## Success Criteria

Deployment is successful when:
- ✅ All migrations applied
- ✅ No critical errors
- ✅ All features working
- ✅ Performance targets met
- ✅ Monitoring in place


