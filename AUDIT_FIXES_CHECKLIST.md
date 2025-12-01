# Comprehensive Code Audit - Actionable Fixes Checklist

**Date**: 2025-01-27
**Total Issues**: 127
**Estimated Total Effort**: ~40 hours

---

## 🔴 Critical Priority Fixes (12 issues)

### CRIT-1: Fix TypeScript Type Errors (8 errors)

**Files**:
1. `frontend/src/app/admin/equipment/page.tsx:1473`
2. `frontend/src/app/api/admin/equipment/[id]/route.ts:22,32,41,74`
3. `frontend/src/app/api/admin/equipment/route.ts:23,31,77`

**Fix**:
```typescript
// File: frontend/src/app/admin/equipment/page.tsx:1473
// BEFORE:
{someValue} // Type 'unknown' is not assignable to type 'ReactNode'

// AFTER:
{someValue as ReactNode} // Or properly type the value

// Files: frontend/src/app/api/admin/equipment/[id]/route.ts, route.ts
// BEFORE:
logger.error('Error message'); // Wrong signature

// AFTER:
logger.error('Error message', {
  component: 'equipment-api',
  action: 'error',
  metadata: { /* context */ }
}, error); // Correct signature: logger.error('message', context, error)

// File: frontend/src/app/api/admin/equipment/[id]/route.ts:74,77
// BEFORE:
const supabaseAdmin = createAdminClient(); // Possibly null

// AFTER:
const supabaseAdmin = createAdminClient();
if (!supabaseAdmin) {
  return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
}
```

**Effort**: 2 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

### CRIT-2: Fix Secrets Management (12+ files)

**Pattern**: Replace direct `process.env` access with secrets loader functions

**Files to Fix** (grep for `process.env.SENDGRID_API_KEY`, `process.env.STRIPE_SECRET_KEY`, `process.env.EMAIL_API_KEY`):
- All files using email/payment functionality

**Fix**:
```typescript
// BEFORE:
const apiKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

// AFTER:
import { getSendGridApiKey } from '@/lib/secrets/email';
import { getStripeSecretKey } from '@/lib/stripe/config';

const apiKey = await getSendGridApiKey();
const stripeKey = await getStripeSecretKey();
```

**Reference**: `.cursor/rules/api-keys-secrets-management.mdc`

**Effort**: 4 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

### CRIT-3: Fix Booking Availability Check

**File**: `frontend/src/app/api/bookings/route.ts:165-170`

**Issue**: Only checks `startDate`/`endDate`, not `actual_start_date`/`actual_end_date` for active rentals

**Fix**:
```typescript
// BEFORE:
const { data: conflictingBookings, error: availabilityError } = await supabase
  .from('bookings')
  .select('id, startDate, endDate')
  .eq('equipmentId', equipment.id)
  .not('status', 'in', '("cancelled","rejected","no_show")')
  .or(`and(startDate.lte.${sanitized.endDate},endDate.gte.${sanitized.startDate})`);

// AFTER:
const { data: conflictingBookings, error: availabilityError } = await supabase
  .from('bookings')
  .select('id, startDate, endDate, actualStartDate, actualEndDate, status')
  .eq('equipmentId', equipment.id)
  .not('status', 'in', '("cancelled","rejected","no_show")')
  .or(`and(startDate.lte.${sanitized.endDate},endDate.gte.${sanitized.startDate}),and(actualStartDate.lte.${sanitized.endDate},actualEndDate.gte.${sanitized.startDate})`);
```

**Effort**: 1 hour
**Dependencies**: None
**Status**: ⬜ Not Started

---

## 🟠 High Priority Fixes (35 issues)

### HIGH-1: Fix API Route Pattern Violations

**File**: `frontend/src/app/api/spin/start/route.ts:54-88`

**Issue**: Rate limiting is step 2 (after request validation), should be step 1 (FIRST)

**Fix**:
```typescript
// BEFORE:
// 1. REQUEST VALIDATION
const validation = await validateRequest(request, {...});
if (!validation.valid) { return validation.error!; }

// 2. RATE LIMITING (API-level)
const apiRateLimit = await rateLimit(request, {...});

// AFTER:
// 1. RATE LIMITING (FIRST - before any processing)
const apiRateLimit = await rateLimit(request, {
  ...RateLimitPresets.STRICT,
  skipAdmins: false,
});
if (!apiRateLimit.success) {
  logger.warn('[Spin API] Rate limit exceeded', {...});
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: apiRateLimit.headers }
  );
}

// 2. REQUEST VALIDATION
const validation = await validateRequest(request, {...});
if (!validation.valid) { return validation.error!; }
```

**Reference**: `frontend/src/app/api/bookings/route.ts:72-87` (correct pattern)

**Effort**: 1 hour
**Dependencies**: None
**Status**: ⬜ Not Started

---

### HIGH-2: Add Missing Database Indexes

**Issue**: Missing indexes on foreign keys cause full table scans

**Fix** (Create migration):
```sql
-- File: supabase/migrations/YYYYMMDDHHMMSS_add_missing_fk_indexes.sql

-- Check which foreign keys are missing indexes
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = tc.table_name
      AND indexdef LIKE '%' || kcu.column_name || '%'
  );

-- Add indexes for missing foreign keys
-- Example:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_table_name_fk_column
ON table_name(fk_column);
```

**Reference**:
- `supabase/migrations/20250122000004_add_critical_fk_indexes.sql`
- `supabase/migrations/20250122000006_add_more_fk_indexes.sql`

**Effort**: 3 hours
**Dependencies**: Test in branch first
**Status**: ⬜ Not Started

---

### HIGH-3: Fix RLS Policy Performance

**Issue**: RLS policies using `auth.uid()` directly instead of `(SELECT auth.uid())` wrapper (30% performance loss)

**Files to Fix**:
- `supabase/migrations/20250123000003_rls_permission_integration.sql` - Lines 155, 163, 170, 207, 233, 240, 245, 264
- `supabase/migrations/20251107_in_app_notifications.sql` - Lines 37, 41, 48, 55, 78, 99
- `supabase/migrations/20251112_id_verification_storage.sql` - Lines 33, 40, 47, 51, 58
- `supabase/migrations/20251112_id_verification_schema.sql` - Lines 113, 125, 131, 137, 138, 156

**Fix** (Create migration):
```sql
-- File: supabase/migrations/YYYYMMDDHHMMSS_fix_rls_auth_uid_wrapper.sql

-- BEFORE:
USING (auth.uid() = user_id);
WITH CHECK (auth.uid() = user_id);

-- AFTER:
USING ((SELECT auth.uid()) = user_id);
WITH CHECK ((SELECT auth.uid()) = user_id);
```

**Reference**: `supabase/migrations/20251118_fix_rls_auth_uid_wrapper.sql`

**Effort**: 2 hours
**Dependencies**: Test in branch first
**Status**: ⬜ Not Started

---

### HIGH-4: Add Pagination to Queries

**Issue**: Many queries missing pagination (could cause memory issues)

**Files to Review**: All API routes with list queries (63 files use `.range()`/`.limit()`, but many don't)

**Fix Pattern**:
```typescript
// BEFORE:
const { data } = await supabase
  .from('bookings')
  .select('id, bookingNumber, status')
  .eq('customerId', userId);

// AFTER:
const { data, count } = await supabase
  .from('bookings')
  .select('id, bookingNumber, status', { count: 'exact' })
  .eq('customerId', userId)
  .order('created_at', { ascending: false })
  .range(0, 19)
  .limit(20);
```

**Reference**: `frontend/src/app/api/bookings/route.ts:147-153`

**Effort**: 4 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

### HIGH-5: Fix Logger Signature Issues

**Files**: Multiple files using incorrect logger signature

**Fix**:
```typescript
// BEFORE:
logger.error('Error message');

// AFTER:
logger.error('Error message', {
  component: 'component-name',
  action: 'action-name',
  metadata: { /* context */ }
}, error); // Error LAST
```

**Reference**: `frontend/src/lib/logger.ts:202-210`

**Effort**: 2 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

## 🟡 Medium Priority Fixes (48 issues)

### MED-1: Review setTimeout Cleanup

**Issue**: 67 instances of `setTimeout` found, need to verify cleanup patterns

**Files to Review**:
- `frontend/src/components/booking/PaymentSuccessHandler.tsx:127`
- All other files with `setTimeout`

**Fix Pattern**:
```typescript
// BEFORE:
useEffect(() => {
  const timer = setTimeout(() => {
    router.push('/dashboard');
  }, 3000);
  return () => clearTimeout(timer);
}, []);

// AFTER:
useEffect(() => {
  let mounted = true;
  const timer = setTimeout(() => {
    if (mounted) {
      router.push('/dashboard');
    }
  }, 3000);
  return () => {
    mounted = false;
    clearTimeout(timer);
  };
}, []);
```

**Effort**: 3 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

### MED-2: Run Bundle Analysis

**Command**: `cd frontend && pnpm analyze`

**Action**: Review results and optimize:
- Large dependencies
- Duplicate dependencies
- Code splitting opportunities

**Effort**: 2 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

### MED-3: Measure Test Coverage

**Command**: `cd frontend && pnpm test:coverage`

**Action**:
- Identify files with <80% coverage
- Add tests for critical paths
- Review test quality

**Effort**: 4 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

### MED-4: Review Component Performance

**Action**: Review components for:
- Missing `useMemo` for expensive calculations
- Missing `useCallback` for event handlers
- Unnecessary re-renders
- Large component files (>500 lines)

**Effort**: 4 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

### MED-5: Dependency Audit

**Command**: `cd frontend && pnpm audit`

**Action**:
- Fix vulnerabilities
- Update outdated dependencies
- Remove unused dependencies (from Knip results)

**Effort**: 2 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

## 🟢 Low Priority Fixes (32 issues)

### LOW-1: Fix Formatting Issues

**Command**: `cd frontend && pnpm format`

**Action**: Auto-fix all Prettier formatting issues

**Effort**: 30 minutes
**Dependencies**: None
**Status**: ⬜ Not Started

---

### LOW-2: Remove Unused Code

**Action**: Review Knip results and remove:
- Unused exports
- Unused dependencies
- Dead code

**Effort**: 2 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

### LOW-3: Documentation Updates

**Action**: Add/update:
- JSDoc comments on public functions
- API endpoint documentation
- README files for complex modules

**Effort**: 3 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

### LOW-4: Code Organization

**Action**: Review and refactor:
- Large files (>500 lines)
- Components doing too much
- Duplicate code patterns
- Circular dependencies

**Effort**: 4 hours
**Dependencies**: None
**Status**: ⬜ Not Started

---

## Fix Execution Order

### Week 1: Critical Fixes
1. ✅ CRIT-1: Fix TypeScript errors (2h)
2. ✅ CRIT-2: Fix secrets management (4h)
3. ✅ CRIT-3: Fix booking availability (1h)

### Week 2: High Priority
1. ✅ HIGH-1: Fix API route patterns (1h)
2. ✅ HIGH-2: Add database indexes (3h)
3. ✅ HIGH-3: Fix RLS policies (2h)
4. ✅ HIGH-4: Add pagination (4h)
5. ✅ HIGH-5: Fix logger signatures (2h)

### Week 3: Medium Priority
1. ✅ MED-1: Review setTimeout cleanup (3h)
2. ✅ MED-2: Bundle analysis (2h)
3. ✅ MED-3: Test coverage (4h)
4. ✅ MED-4: Component performance (4h)
5. ✅ MED-5: Dependency audit (2h)

### Week 4: Low Priority
1. ✅ LOW-1: Formatting (30m)
2. ✅ LOW-2: Remove unused code (2h)
3. ✅ LOW-3: Documentation (3h)
4. ✅ LOW-4: Code organization (4h)

---

## Progress Tracking

### Critical (12 issues)
- [ ] CRIT-1: TypeScript errors (0/8 fixed)
- [ ] CRIT-2: Secrets management (0/12+ fixed)
- [ ] CRIT-3: Booking availability (0/1 fixed)

### High (35 issues)
- [ ] HIGH-1: API route patterns (0/1 fixed)
- [ ] HIGH-2: Database indexes (0/many fixed)
- [ ] HIGH-3: RLS policies (0/8+ fixed)
- [ ] HIGH-4: Pagination (0/many fixed)
- [ ] HIGH-5: Logger signatures (0/many fixed)

### Medium (48 issues)
- [ ] MED-1: setTimeout cleanup (0/67 reviewed)
- [ ] MED-2: Bundle analysis (0/1 done)
- [ ] MED-3: Test coverage (0/1 measured)
- [ ] MED-4: Component performance (0/many reviewed)
- [ ] MED-5: Dependency audit (0/1 done)

### Low (32 issues)
- [ ] LOW-1: Formatting (0/1 done)
- [ ] LOW-2: Unused code (0/many removed)
- [ ] LOW-3: Documentation (0/many updated)
- [ ] LOW-4: Code organization (0/many refactored)

---

## Notes

- **Test all fixes in Supabase branch** before applying to production
- **Review each fix** with team before merging
- **Update this checklist** as fixes are completed
- **Schedule follow-up audit** after all critical/high fixes complete

---

**Last Updated**: 2025-01-27
**Total Estimated Effort**: ~40 hours
**Current Progress**: 0/127 issues fixed (0%)


