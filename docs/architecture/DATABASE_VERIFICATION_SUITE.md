# Database Verification Suite
## October 27, 2025

This document contains SQL queries to verify database integrity, performance, and security using Supabase MCP tools.

---

## ✅ Schema Verification

### Tables Count and RLS Status
```sql
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected**: 25 tables, all with RLS ENABLED

---

## ✅ Index Verification

### All Indexes on Foreign Keys
```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected**: 65+ performance indexes on foreign key columns

---

## ✅ RLS Policy Verification

### Count Policies by Type
```sql
SELECT
  cmd as command_type,
  COUNT(*) as policy_count,
  COUNT(DISTINCT tablename) as tables_covered
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY cmd
ORDER BY policy_count DESC;
```

**Expected**:
- ALL: 34 policies
- SELECT: 21 policies
- INSERT: 6 policies
- UPDATE: 3 policies
- DELETE: 1 policy

### Verify Critical Table Policies
```sql
SELECT
  tablename,
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'bookings', 'payments', 'contracts', 'equipment')
ORDER BY tablename, cmd;
```

**Expected**: Each critical table has appropriate SELECT/INSERT/UPDATE/DELETE policies

---

## ✅ Data Integrity Verification

### Orphaned Records Check
```sql
-- Check for bookings without customers
SELECT COUNT(*) as orphaned_bookings
FROM bookings b
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = b."customerId"
);

-- Check for payments without bookings
SELECT COUNT(*) as orphaned_payments
FROM payments p
WHERE NOT EXISTS (
  SELECT 1 FROM bookings b WHERE b.id = p."bookingId"
);

-- Check for contracts without bookings
SELECT COUNT(*) as orphaned_contracts
FROM contracts c
WHERE NOT EXISTS (
  SELECT 1 FROM bookings b WHERE b.id = c."bookingId"
);
```

**Expected**: All counts = 0 (no orphaned records)

---

## ✅ Security Verification

### Admin Users Count
```sql
SELECT
  role,
  COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY role;
```

**Expected**:
- admin: 1-2 users
- customer: 2-3 users
- super_admin: 0-1 users

### Unconfirmed Email Accounts
```sql
SELECT
  u.email,
  u."createdAt",
  au.email_confirmed_at
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE au.email_confirmed_at IS NULL;
```

**Expected**: 0-1 unconfirmed accounts (test accounts are OK)

---

## ✅ Performance Verification

### Slow Query Check (Simulated)
```sql
-- Check if indexes are being used
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan > 0
ORDER BY idx_scan DESC
LIMIT 20;
```

**Expected**: Indexes showing usage (idx_scan > 0)

---

## ✅ Business Logic Verification

### Active Bookings Summary
```sql
SELECT
  status,
  COUNT(*) as booking_count,
  SUM(CAST("totalAmount" AS DECIMAL)) as total_revenue
FROM bookings
GROUP BY status
ORDER BY booking_count DESC;
```

**Expected**: Bookings distributed across statuses, revenue calculations correct

### Equipment Availability
```sql
SELECT
  model,
  status,
  COUNT(*) as equipment_count
FROM equipment
GROUP BY model, status
ORDER BY model, status;
```

**Expected**: All equipment showing correct status (available/booked/maintenance)

---

## ✅ Audit Trail Verification

### Recent Audit Logs
```sql
SELECT
  table_name,
  action,
  COUNT(*) as event_count,
  MAX(created_at) as last_event
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY table_name, action
ORDER BY last_event DESC;
```

**Expected**: Audit logs capturing user actions

---

## ✅ Financial Verification

### Payment Status Summary
```sql
SELECT
  status,
  COUNT(*) as payment_count,
  SUM(CAST(amount AS DECIMAL)) as total_amount
FROM payments
GROUP BY status
ORDER BY payment_count DESC;
```

**Expected**: All payments accounted for, no negative amounts

### Revenue Calculation Accuracy
```sql
SELECT
  b."bookingNumber",
  CAST(b."totalAmount" AS DECIMAL) as booking_total,
  COALESCE(SUM(CAST(p.amount AS DECIMAL)), 0) as payments_total,
  CAST(b."totalAmount" AS DECIMAL) - COALESCE(SUM(CAST(p.amount AS DECIMAL)), 0) as balance
FROM bookings b
LEFT JOIN payments p ON p."bookingId" = b.id AND p.status = 'completed'
WHERE b.status NOT IN ('cancelled', 'rejected')
GROUP BY b.id, b."bookingNumber", b."totalAmount"
HAVING CAST(b."totalAmount" AS DECIMAL) - COALESCE(SUM(CAST(p.amount AS DECIMAL)), 0) <> 0
LIMIT 10;
```

**Expected**: 0-10 bookings with outstanding balances (pending payments are normal)

---

## ✅ Integration Verification

### External Integrations Status
```sql
SELECT
  name,
  type,
  status,
  last_sync,
  error_count
FROM external_integrations
ORDER BY name;
```

**Expected**:
- Stripe: active, error_count = 0
- Custom contract signing: active (EnhancedContractSigner)
- Other integrations configured

---

## ✅ Feature Flags Verification

### Active Feature Flags
```sql
SELECT
  key,
  value->>'enabled' as is_enabled,
  value->>'description' as description
FROM system_config
WHERE category = 'feature_flags'
  OR key LIKE 'feature_%'
ORDER BY key;
```

**Expected**: Feature flags configured, critical features enabled

---

## 🔒 Security Audit Queries

### Users with Admin Privileges
```sql
SELECT
  u.id,
  u.email,
  u.role,
  u."createdAt",
  u."lastLoginAt"
FROM users u
WHERE u.role IN ('admin', 'super_admin')
ORDER BY u.role, u."createdAt";
```

**Action**: Verify all admin users are authorized

### Failed Login Attempts (from auth logs)
```sql
SELECT
  email,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM auth.audit_log_entries
WHERE action = 'failed_login'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY email
HAVING COUNT(*) > 10
ORDER BY failed_attempts DESC;
```

**Action**: Investigate accounts with excessive failed logins

---

## 📊 Performance Metrics

### Database Size
```sql
SELECT
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  pg_size_pretty(pg_total_relation_size('bookings')) as bookings_size,
  pg_size_pretty(pg_total_relation_size('users')) as users_size,
  pg_size_pretty(pg_total_relation_size('equipment')) as equipment_size,
  pg_size_pretty(pg_total_relation_size('payments')) as payments_size;
```

### Table Statistics
```sql
SELECT
  schemaname,
  relname as table_name,
  n_tup_ins as rows_inserted,
  n_tup_upd as rows_updated,
  n_tup_del as rows_deleted,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC
LIMIT 15;
```

### Index Usage Statistics
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC
LIMIT 20;
```

---

## ✅ Test Account Verification

### Test Account Status
```sql
SELECT
  u.email,
  u.role,
  u."emailVerified",
  au.email_confirmed_at,
  u."createdAt"
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.email LIKE '%test%' OR u.email LIKE '%ai%'
ORDER BY u."createdAt" DESC;
```

**Expected**: aitest2@udigit.ca exists, email confirmed, role = customer

---

## 🚀 Automated Verification Script

### Run All Checks (Copy to Supabase SQL Editor)
```sql
DO $$
DECLARE
  v_tables_count INT;
  v_rls_enabled_count INT;
  v_policies_count INT;
  v_indexes_count INT;
  v_orphaned_bookings INT;
  v_orphaned_payments INT;
  v_orphaned_contracts INT;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO v_tables_count
  FROM pg_tables WHERE schemaname = 'public';

  -- Count RLS enabled
  SELECT COUNT(*) INTO v_rls_enabled_count
  FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

  -- Count policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies WHERE schemaname = 'public';

  -- Count indexes
  SELECT COUNT(*) INTO v_indexes_count
  FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

  -- Check orphaned records
  SELECT COUNT(*) INTO v_orphaned_bookings
  FROM bookings b
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = b."customerId");

  SELECT COUNT(*) INTO v_orphaned_payments
  FROM payments p
  WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.id = p."bookingId");

  SELECT COUNT(*) INTO v_orphaned_contracts
  FROM contracts c
  WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.id = c."bookingId");

  -- Output results
  RAISE NOTICE '=== DATABASE VERIFICATION RESULTS ===';
  RAISE NOTICE 'Tables: % (Expected: 25)', v_tables_count;
  RAISE NOTICE 'RLS Enabled: % (Expected: 25)', v_rls_enabled_count;
  RAISE NOTICE 'RLS Policies: % (Expected: 45+)', v_policies_count;
  RAISE NOTICE 'Performance Indexes: % (Expected: 65+)', v_indexes_count;
  RAISE NOTICE 'Orphaned Bookings: % (Expected: 0)', v_orphaned_bookings;
  RAISE NOTICE 'Orphaned Payments: % (Expected: 0)', v_orphaned_payments;
  RAISE NOTICE 'Orphaned Contracts: % (Expected: 0)', v_orphaned_contracts;

  -- Verification status
  IF v_tables_count = 25 AND
     v_rls_enabled_count = 25 AND
     v_policies_count >= 45 AND
     v_indexes_count >= 65 AND
     v_orphaned_bookings = 0 AND
     v_orphaned_payments = 0 AND
     v_orphaned_contracts = 0 THEN
    RAISE NOTICE '✅ ALL VERIFICATIONS PASSED';
  ELSE
    RAISE WARNING '⚠️  SOME VERIFICATIONS FAILED - Review results above';
  END IF;
END$$;
```

---

## 🎯 Verification Checklist

- [ ] All 25 tables exist
- [ ] All tables have RLS enabled
- [ ] 45+ RLS policies configured
- [ ] 65+ performance indexes applied
- [ ] No orphaned records
- [ ] No duplicate policies
- [ ] Admin users verified
- [ ] Test accounts functional
- [ ] Integration status healthy
- [ ] No security vulnerabilities

---

*Generated on: October 27, 2025*
*Last Updated: October 27, 2025*
*Status: ACTIVE*

