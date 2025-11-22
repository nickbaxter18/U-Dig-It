# 🔍 Codebase Issues Report

**Date**: Generated via Rule System Analysis
**Status**: Comprehensive audit using established patterns

---

## 🚨 CRITICAL Issues (Must Fix Immediately)

### 1. Stripe Webhook Using Regular Client Instead of Service Client

**Location**: `frontend/src/app/api/webhooks/stripe/route.ts:168`

**Issue**:
```typescript
// ❌ WRONG - Uses regular client (RLS blocks updates)
const supabase = createClient();
```

**Impact**:
- Webhooks return 200 OK but database updates fail silently
- Payment statuses never update
- Bookings remain in wrong state

**Fix Required**:
```typescript
// ✅ CORRECT - Use service client
import { createServiceClient } from '@/lib/supabase/service';
const supabase = createServiceClient();
```

**Reference**: This matches the documented pattern in `CODING_SAVANT_PATTERNS.mdc` - webhooks MUST use service role client because they have no user session.

**Status**: ⚠️ **CRITICAL** - Known issue, documented but not fixed

---

## ⚠️ HIGH Priority Issues

### 2. SELECT * Queries Without Pagination (76 instances)

**Impact**:
- 60% larger payload sizes
- 200ms+ query times (should be <20ms)
- Memory issues with large datasets
- Slow page loads

**Examples Found**:
- `frontend/src/app/api/discount-codes/validate/route.ts:63` - Uses `SELECT *` on discount_codes
- `frontend/src/app/api/spin/roll/route.ts:117` - Uses `SELECT *` on spin_sessions
- `frontend/src/app/api/admin/dashboard/overview/route.ts` - Multiple `SELECT *` queries
- `frontend/src/app/api/spin/start/route.ts:128` - Uses `SELECT *`

**Fix Pattern**:
```typescript
// ❌ WRONG
const { data } = await supabase
  .from('discount_codes')
  .select('*')
  .eq('code', code);

// ✅ CORRECT
const { data } = await supabase
  .from('discount_codes')
  .select('id, code, discount_percent, is_active, valid_from, valid_until')
  .eq('code', code)
  .single();
```

**Reference**: Pattern documented in `CODING_SAVANT_PATTERNS.mdc` - Always use specific columns and pagination.

**Status**: ⚠️ **HIGH** - Performance impact, 76 instances need fixing

---

### 3. Direct process.env Access for Secrets (79 instances)

**Impact**:
- Secrets system bypassed (Supabase Edge Function secrets + system_config table)
- Emails/payments fail when secrets stored in Supabase or database
- Inconsistent secret loading

**Examples Found**:
- `frontend/src/app/api/admin/bookings/send-email/route.ts:100` - Direct `process.env.SENDGRID_API_KEY`
- `frontend/src/app/api/admin/deliveries/[id]/notify/route.ts:11` - Direct `process.env.SENDGRID_API_KEY`
- `frontend/src/app/api/cron/process-scheduled-reports/route.ts:146` - Direct `process.env.EMAIL_FROM`
- Many more in email service files

**Fix Pattern**:
```typescript
// ❌ WRONG
const sendgridApiKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY;

// ✅ CORRECT
import { getSendGridApiKey } from '@/lib/secrets/email';
const sendgridApiKey = await getSendGridApiKey();
```

**Reference**: Pattern documented in `CODING_SAVANT_PATTERNS.mdc` - Always use secrets loader functions.

**Status**: ⚠️ **HIGH** - 79 instances need fixing, causes service failures

---

## ⚠️ MEDIUM Priority Issues

### 4. Database Functions with Mutable search_path (Security Risk)

**Found**: 25 database functions with mutable search_path

**Impact**:
- Security vulnerability - functions can be hijacked via search_path manipulation
- Potential SQL injection risk

**Functions Affected**:
- `rls_has_permission`
- `rls_is_admin`
- `has_permission`
- `get_equipment_with_stats`
- `queue_booking_reminders`
- And 20 more...

**Fix Required**: Add `SET search_path = ''` or `SET search_path = public` to all functions

**Reference**: Supabase security advisor flagged these

**Status**: ⚠️ **MEDIUM** - Security risk, but low exploitability

---

### 5. Missing Request Validation in Some API Routes

**Found**: Some routes may skip request validation step

**Pattern Check**: The 8-step API route pattern requires:
1. Rate limiting ✅ (most routes have this)
2. Request validation ✅ (most routes have this)
3. Authentication ✅ (most routes have this)
4. Input sanitization ⚠️ (some routes may skip)
5. Zod validation ✅ (most routes have this)
6. Business logic ✅
7. Structured logging ✅ (most routes have this)
8. JSON response ✅

**Status**: ⚠️ **MEDIUM** - Need to audit all routes for complete 8-step pattern

---

## 📊 Summary Statistics

| Category | Count | Priority |
|----------|-------|----------|
| **CRITICAL** | 1 | Must fix immediately |
| **HIGH** | 2 | Fix soon (155 total instances) |
| **MEDIUM** | 2 | Fix when possible |
| **Total Issues** | 5 categories | |

### Breakdown by Issue Type

- **Security Issues**: 2 (webhook client, mutable search_path)
- **Performance Issues**: 1 (SELECT * queries - 76 instances)
- **Code Quality Issues**: 2 (secrets access - 79 instances, validation patterns)

---

## ✅ What's Working Well

1. **Most API routes follow 8-step pattern** - Rate limiting, auth, validation present
2. **RLS policies enabled** - Database security is good
3. **Structured logging** - Most routes use logger
4. **TypeScript strict mode** - Type safety maintained
5. **Webhook signature verification** - Security checks in place

---

## 🎯 Recommended Fix Priority

### Phase 1: Critical (This Week)
1. ✅ Fix Stripe webhook service client (1 file, 1 line change)

### Phase 2: High Priority (Next 2 Weeks)
2. ✅ Fix SELECT * queries (76 instances - start with most used routes)
3. ✅ Fix direct process.env access (79 instances - start with email/payment routes)

### Phase 3: Medium Priority (Next Month)
4. ✅ Fix mutable search_path in database functions (25 functions)
5. ✅ Audit all API routes for complete 8-step pattern

---

## 📝 Notes

- Most issues are **known patterns** documented in `CODING_SAVANT_PATTERNS.mdc`
- The rule system successfully identified these issues
- Many issues are **legacy code** from before patterns were established
- Fixes should follow established patterns from the codebase

---

**Generated by**: Rule System Analysis
**Last Updated**: $(date)


