# Database Function Security Analysis

**Date**: October 27, 2025  
**Task**: DAY 2.4 - Fix database function security (SECURITY DEFINER)  
**Status**: ⚠️ **IN PROGRESS** - Critical vulnerabilities found

## Executive Summary

Found **38 functions** using `SECURITY DEFINER` across the database. Of these:
- **10 System Functions** (extensions, storage, vault) - ✅ Secure (maintained by Supabase)
- **28 Custom Functions** (public schema) - ⚠️ **REQUIRES SECURITY REVIEW**

## Critical Security Vulnerabilities

### 🚨 CRITICAL: Privilege Escalation Risks

The following functions use `SECURITY DEFINER` without proper authorization checks, allowing **ANY authenticated user** to execute admin-level operations:

#### 1. ⚠️ `apply_discount_code()` - **MEDIUM RISK**
**Issue**: Any user can apply discount codes to any booking
**Attack Vector**: User can apply unlimited discounts to other users' bookings
**Fix Required**: Add user ownership verification

```sql
-- VULNERABLE CODE
SELECT * INTO booking_record FROM bookings WHERE id = p_booking_id;
-- NO CHECK: Does the current user own this booking?
```

**Recommended Fix**:
```sql
-- Verify user owns the booking or is admin
IF booking_record."customerId" != auth.uid() AND NOT is_admin() THEN
  RAISE EXCEPTION 'Unauthorized: You can only apply discounts to your own bookings';
END IF;
```

#### 2. 🚨 `generate_rental_contract()` - **HIGH RISK**
**Issue**: Any user can generate contracts for any booking
**Attack Vector**: User can access contract data for other customers
**Fix Required**: Add user ownership verification

```sql
-- VULNERABLE CODE
SELECT b.*, u.email, u."firstName", u."lastName"...
FROM public.bookings b
WHERE b.id = p_booking_id;
-- NO CHECK: Does the current user own this booking?
```

**Recommended Fix**:
```sql
-- Verify user owns the booking or is admin
IF v_booking."customerId" != auth.uid() AND NOT is_admin() THEN
  RAISE EXCEPTION 'Unauthorized: You can only generate contracts for your own bookings';
END IF;
```

#### 3. 🚨 `get_booking_details()` - **HIGH RISK**
**Issue**: Any user can view detailed booking information for any booking
**Attack Vector**: Privacy violation - access to other customers' personal and financial data
**Fix Required**: Add user ownership or admin verification

**Recommended Fix**:
```sql
-- Add at the start of function
DECLARE
  v_user_id uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT role IN ('admin', 'super_admin') INTO v_is_admin
  FROM users WHERE id = v_user_id;
  
  -- Verify authorization
  IF NOT v_is_admin THEN
    -- Customer can only view their own bookings
    IF NOT EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = p_booking_id AND "customerId" = v_user_id
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Access denied';
    END IF;
  END IF;
  -- Continue with function logic...
```

#### 4. 🚨 `confirm_stripe_payment()` - **CRITICAL RISK**
**Issue**: Any user can mark any payment as completed
**Attack Vector**: Payment fraud - users can bypass payment without actually paying
**Fix Required**: **IMMEDIATE - Remove SECURITY DEFINER or add strict validation**

```sql
-- VULNERABLE CODE - Overloaded function 1
UPDATE payments
SET status = 'completed'::payments_status_enum
WHERE bookingId = booking_id AND status = 'processing';
-- NO CHECK: User authorization, Stripe webhook validation
```

**Recommended Fix**:
```sql
-- This function should ONLY be callable from verified Stripe webhooks
-- Add webhook signature verification
DECLARE
  v_is_admin boolean;
BEGIN
  -- Only admins or system can confirm payments
  SELECT role IN ('admin', 'super_admin') INTO v_is_admin
  FROM users WHERE id = auth.uid();
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Payment confirmation requires admin privileges';
  END IF;
  
  -- TODO: Add Stripe webhook signature verification
  -- Verify payment_intent_id matches Stripe's confirmation
```

#### 5. ⚠️ `process_stripe_refund()` - **HIGH RISK**
**Issue**: Any user can process refunds for any charge
**Attack Vector**: Financial fraud - unauthorized refunds
**Fix Required**: Admin-only access

**Recommended Fix**:
```sql
-- Add admin check at function start
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT role IN ('admin', 'super_admin') INTO v_is_admin
  FROM users WHERE id = auth.uid();
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Refund processing requires admin privileges';
  END IF;
```

### ⚠️ MEDIUM: Admin-Only Functions Without Authorization

These functions perform admin operations but don't verify admin role:

1. **`generate_weekly_report()`** - Business analytics should be admin-only
2. **`get_dashboard_metrics()`** - Business metrics should be admin-only
3. **`monitor_database_performance()`** - System monitoring should be admin-only
4. **`optimize_database_performance()`** - Database operations should be admin-only
5. **`create_maintenance_reminders()`** - Operational function should be admin-only

**Recommended Fix for All**:
```sql
-- Add at function start
IF NOT EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
) THEN
  RAISE EXCEPTION 'Unauthorized: Admin privileges required';
END IF;
```

### ✅ SECURE: Functions with Proper Authorization

These functions have appropriate security checks:

1. ✅ `generate_contract_upload_path()` - Verifies user ownership or admin
2. ✅ `get_signed_contract_url()` - Verifies user ownership or admin
3. ✅ `generate_license_upload_path()` - Uses user's own ID
4. ✅ `generate_insurance_upload_path()` - Uses booking ownership

### ⚠️ LOW: Search and Read-Only Functions

These are read-only but expose data without RLS protection:

1. `search_equipment()` - Read-only, filtered to available equipment ✅
2. `search_equipment_semantic()` - Read-only, filtered to available equipment ✅
3. `search_equipment_hybrid()` - Read-only, filtered to available equipment ✅
4. `global_search()` - Read-only search ⚠️ Should respect RLS

## Trigger Functions Analysis

### ✅ SECURE: Automated Triggers
These run automatically and are properly scoped:

1. ✅ `handle_new_user()` - Syncs auth.users to public.users (safe)
2. ✅ `audit_table_changes()` - Audit logging (safe)
3. ✅ `auto_create_contract_after_payment()` - Automated workflow (safe)
4. ✅ `broadcast_*` functions - Realtime notifications (safe)
5. ✅ `sync_booking_to_availability()` - Data synchronization (safe)

## System Schema Functions

### ✅ SECURE: Maintained by Supabase
- `extensions.*` - Supabase-maintained (pgaudit)
- `storage.*` - Supabase Storage system functions
- `vault.*` - Supabase Vault system functions
- `graphql.*` - Supabase GraphQL system functions
- `pgbouncer.*` - Connection pooling system

## Security Recommendations

### Immediate Actions Required (CRITICAL)

1. **🚨 Fix Payment Functions** (CRITICAL)
   - `confirm_stripe_payment()` - Add Stripe webhook validation
   - `process_stripe_payment()` - Add admin-only access
   - `process_stripe_refund()` - Add admin-only access

2. **🚨 Fix Booking Access Functions** (HIGH)
   - `apply_discount_code()` - Add ownership verification
   - `generate_rental_contract()` - Add ownership verification
   - `get_booking_details()` - Add ownership verification

3. **⚠️ Fix Admin Functions** (MEDIUM)
   - Add admin role verification to all analytics functions
   - Add admin role verification to system maintenance functions

### Implementation Strategy

#### Option 1: Add Authorization Checks (RECOMMENDED)
```sql
-- Create helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$$;

-- Create ownership verification function
CREATE OR REPLACE FUNCTION public.owns_booking(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = p_booking_id
      AND "customerId" = auth.uid()
  ) OR public.is_admin();
$$;
```

#### Option 2: Change to SECURITY INVOKER
For read-only functions that should respect RLS:
```sql
ALTER FUNCTION public.search_equipment(text) SECURITY INVOKER;
```

#### Option 3: Remove SECURITY DEFINER Where Not Needed
For functions that don't need elevated privileges:
```sql
-- Recreate without SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.function_name(...)
RETURNS ...
LANGUAGE plpgsql
-- REMOVE: SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
...
$function$;
```

## Prioritized Fix List

### 🚨 Phase 1: Critical Payment Security (IMMEDIATE)
1. `confirm_stripe_payment()` - Add webhook validation + admin check
2. `process_stripe_payment()` - Add admin-only access
3. `process_stripe_refund()` - Add admin-only access

### 🚨 Phase 2: High-Risk Data Access (URGENT)
4. `get_booking_details()` - Add ownership verification
5. `generate_rental_contract()` - Add ownership verification
6. `apply_discount_code()` - Add ownership verification

### ⚠️ Phase 3: Medium-Risk Admin Functions (HIGH PRIORITY)
7. `generate_weekly_report()` - Add admin check
8. `get_dashboard_metrics()` - Add admin check
9. `monitor_database_performance()` - Add admin check
10. `optimize_database_performance()` - Add admin check
11. All analytics dashboard functions - Add admin check

### ✅ Phase 4: Low-Risk Optimizations (NORMAL PRIORITY)
12. Review search functions for RLS compatibility
13. Optimize helper functions
14. Document security model

## Testing Requirements

After implementing fixes, test:

1. **✅ Ownership Verification**: Customer can only access their own data
2. **✅ Admin Access**: Admins can access all data
3. **✅ Payment Security**: Payment functions reject unauthorized calls
4. **✅ RLS Integration**: Functions respect Row Level Security policies
5. **✅ Error Handling**: Proper error messages for unauthorized access

## Migration Plan

1. Create helper functions (`is_admin()`, `owns_booking()`)
2. Update critical payment functions (Phase 1)
3. Update data access functions (Phase 2)
4. Update admin analytics functions (Phase 3)
5. Run comprehensive security tests
6. Deploy with monitoring

---

**Next Steps**: Begin implementing fixes starting with Phase 1 (Critical Payment Security)






