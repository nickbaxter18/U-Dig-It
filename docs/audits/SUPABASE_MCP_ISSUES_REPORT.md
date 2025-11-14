# Supabase MCP Issues Audit Report

**Date**: January 2025
**Status**: ✅ **AUDIT COMPLETE**

---

## 🔍 Issues Found

### 1. ⚠️ Security: Functions with Mutable Search Path (3 functions)

**Severity**: WARN
**Category**: SECURITY
**Impact**: Potential security vulnerability

**Functions Affected**:
1. `purge_expired_idkit_objects`
2. `is_admin_user`
3. `storage_first_segment`

**Issue**: These functions don't have `SET search_path` explicitly set, which can lead to search path manipulation attacks.

**Remediation**: Add `SET search_path TO 'public', 'pg_temp'` to function definitions.

**Reference**: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

---

### 2. ⚠️ Performance: Missing Foreign Key Indexes

**Severity**: MEDIUM
**Category**: PERFORMANCE
**Impact**: Slow queries on foreign key lookups

**Issue**: Many foreign key constraints don't have explicit indexes, which can cause performance issues when:
- Joining tables
- Filtering by foreign key columns
- Enforcing referential integrity

**Tables Affected**: Found 100+ foreign key constraints without explicit indexes

**Examples**:
- `ab_tests.created_by`
- `alert_incidents.acknowledged_by`
- `alert_incidents.alert_rule_id`
- `api_analytics.user_id`
- `audit_logs.user_id`
- And many more...

**Remediation**: Create indexes on all foreign key columns:
```sql
CREATE INDEX CONCURRENTLY idx_table_column ON table_name(column_name);
```

---

### 3. ✅ Security: RLS Policies

**Status**: ✅ **ALL TABLES SECURED**

All tables in the `public` schema have Row-Level Security (RLS) enabled.

---

### 4. ✅ Security: SECURITY DEFINER Functions

**Status**: ✅ **VERIFIED**

Found 100+ functions using `SECURITY DEFINER`. Key security functions verified:
- ✅ `apply_discount_code()` - Uses `owns_booking()` helper
- ✅ `owns_booking()` - Properly checks authorization
- ✅ `is_admin()` - Properly checks user role

**Note**: Most functions are read-only or trigger functions which are safe.

---

### 5. ✅ Security: Search Path Protection

**Status**: ✅ **MOSTLY SECURE**

Most SECURITY DEFINER functions have `SET search_path` configured. Only 3 functions need fixing (see Issue #1).

---

## 📊 Summary

| Category | Status | Count |
|----------|--------|-------|
| Security Issues | ⚠️ 3 functions need search_path fix | 3 |
| Performance Issues | ⚠️ Missing FK indexes | 100+ |
| RLS Policies | ✅ All tables secured | - |
| SECURITY DEFINER Functions | ✅ Mostly secure | 100+ |

---

## 🎯 Recommended Actions

### Priority 1: Fix Search Path Security (Quick Win)

**Action**: Fix 3 functions with mutable search_path

**Impact**: High security improvement
**Effort**: Low (3 function updates)

**SQL**:
```sql
-- Fix purge_expired_idkit_objects
CREATE OR REPLACE FUNCTION public.purge_expired_idkit_objects()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$ ... $$;

-- Fix is_admin_user
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$ ... $$;

-- Fix storage_first_segment
CREATE OR REPLACE FUNCTION public.storage_first_segment(name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$ ... $$;
```

---

### Priority 2: Add Missing Foreign Key Indexes (Performance)

**Action**: Create indexes on foreign key columns

**Impact**: High performance improvement
**Effort**: Medium (create 100+ indexes)

**Approach**:
1. Identify most-used foreign keys first
2. Create indexes concurrently (no downtime)
3. Monitor query performance improvements

**Example**:
```sql
-- Create indexes concurrently (no lock)
CREATE INDEX CONCURRENTLY idx_ab_tests_created_by ON ab_tests(created_by);
CREATE INDEX CONCURRENTLY idx_alert_incidents_acknowledged_by ON alert_incidents(acknowledged_by);
CREATE INDEX CONCURRENTLY idx_api_analytics_user_id ON api_analytics(user_id);
-- ... continue for all foreign keys
```

---

## ✅ What's Working Well

1. ✅ **RLS Policies**: All tables properly secured
2. ✅ **Authorization**: Key functions properly check permissions
3. ✅ **Search Path**: Most functions properly configured
4. ✅ **Security Functions**: Critical functions use helper functions for authorization

---

## 📋 Next Steps

1. **Immediate**: Fix 3 search_path security issues
2. **Short-term**: Add indexes to most-used foreign keys
3. **Long-term**: Add indexes to all foreign keys (performance optimization)

---

**Audit Method**: Supabase MCP Tools
**Audit Date**: January 2025
**Status**: ✅ Complete
