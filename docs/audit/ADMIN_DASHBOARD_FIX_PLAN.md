# Admin Dashboard Backend Fix Plan

**Created**: 2025-01-22
**Based On**: ADMIN_DASHBOARD_BACKEND_AUDIT.md

---

## Overview

This plan addresses all issues identified in the admin dashboard backend audit. The fixes are prioritized by severity and impact.

---

## Priority 1: Critical Security Fixes 🔴

### Fix #1: Customer Update Endpoint (CRITICAL)

**Issue**: CustomerEditModal directly updates database bypassing security.

**Issue**: CustomerEditModal bypasses security by directly updating the database.

**Files to Create**:
- `frontend/src/app/api/admin/customers/[id]/route.ts`

**Files to Update**:
- `frontend/src/components/admin/CustomerEditModal.tsx`

**Implementation Steps**:

1. **Create API Route** (`/api/admin/customers/[id]/route.ts`):
   ```typescript
   - PATCH endpoint
   - Admin authentication (requireAdmin)
   - Rate limiting (STRICT)
   - Zod validation schema matching CustomerEditModal fields
   - Service role client for database update
   - Proper error handling and logging
   ```

2. **Update CustomerEditModal**:
   - Replace direct Supabase update with `fetchWithAuth('/api/admin/customers/[id]', { method: 'PATCH' })`
   - Remove direct database access
   - Add proper error handling

**Expected Fields to Accept**:
- firstName, lastName, phone, companyName, address, city, province, postalCode

**Database Columns**:
- firstName, lastName, phone, companyName, address, city, province, postalCode (all camelCase)

---

### Fix #2: Settings API Routes (CRITICAL)

**Issue**: SettingsPageClient directly reads/writes database bypassing security.

**Files to Create**:
- `frontend/src/app/api/admin/settings/route.ts`

**Files to Update**:
- `frontend/src/components/admin/SettingsPageClient.tsx`

**Implementation Steps**:

1. **Create API Route** (`/api/admin/settings/route.ts`):
   ```typescript
   - GET endpoint to fetch all settings by category
   - PATCH endpoint to update settings by category
   - Admin authentication (requireAdmin)
   - Rate limiting (STRICT)
   - Zod validation for settings structure
   - Service role client for database operations
   - Proper error handling and logging
   ```

2. **Update SettingsPageClient**:
   - Replace direct Supabase read with `fetchWithAuth('/api/admin/settings')`
   - Replace direct Supabase upsert with `fetchWithAuth('/api/admin/settings', { method: 'PATCH' })`
   - Remove direct database access
   - Add proper error handling

**Expected Categories**:
- general, pricing, notifications, integrations, security

**Database Structure**:
- Table: `system_settings`
- Columns: `category` (unique), `settings` (JSONB), `updated_by`, `updated_at`

---

### Fix #3: Review Direct Database Updates

**Locations**:
1. `frontend/src/app/api/stripe/verify-card-hold/route.ts:144` - Updates `stripeCustomerId`
2. `frontend/src/app/admin/security/id-verification/page.tsx:406` - Updates user fields
3. `frontend/src/components/ProfilePictureUpload.tsx:357` - Updates `avatar_url`

**Action**: Review each to determine if direct update is acceptable (may be fine for internal API routes) or if they should use dedicated endpoints.

---

## Priority 2: Missing API Routes 🟠

### Fix #4: Settings API Routes (MOVED TO PRIORITY 1 - See Fix #2)

**Check**: Does SettingsPageClient directly access database or use API routes?

**If Direct Access**: Create `/api/admin/settings/route.ts` with:
- GET endpoint to fetch settings
- PATCH endpoint to update settings by category
- Proper validation for system_settings table structure

---

## Priority 3: Field Mapping & Schema Improvements 🟡

### Fix #5: Booking Update Schema Review

**Current Schema** (minimal):
```typescript
{
  status?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  internalNotes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}
```

**Question**: Should admins be able to update more fields?
- deliveryAddress
- specialInstructions
- deliveryFee
- discount fields
- etc.

**Action**: Review with product team and expand schema if needed.

---

## Priority 4: Documentation & Testing 🟢

### Fix #6: Field Mapping Documentation

**Create**: `docs/reference/FIELD_MAPPINGS.md`

**Content**:
- Database column names (snake_case vs camelCase)
- Frontend field names
- API route field names
- Transformation rules

**Tables to Document**:
- equipment (camelCase)
- bookings (camelCase)
- users (camelCase)
- payments (mixed)
- contracts (camelCase)
- drivers (snake_case)
- support_tickets (snake_case)

---

### Fix #7: Integration Tests

**Create**: Test suite for all admin endpoints

**Coverage**:
- Authentication/authorization
- Field validation
- Database persistence
- Error handling

---

## Implementation Order

### Phase 1: Critical Fixes (Day 1)
1. ✅ Equipment endpoint fixes (DONE)
2. Create customer update endpoint (`/api/admin/customers/[id]/route.ts`)
3. Update CustomerEditModal to use API route
4. Create settings API routes (`/api/admin/settings/route.ts`)
5. Update SettingsPageClient to use API routes

### Phase 2: Review & Documentation (Day 2)
6. Review and document direct database updates (stripe, id-verification, profile)
7. Determine if they should use API routes or are acceptable

### Phase 3: Improvements (Day 3-4)
6. Review booking update schema
7. Create field mapping documentation
8. Add integration tests

---

## Testing Checklist

After each fix:

- [ ] Endpoint accepts correct fields
- [ ] Validation works correctly
- [ ] Database update succeeds
- [ ] Frontend receives correct response
- [ ] Error handling works
- [ ] Audit logs created
- [ ] Rate limiting works
- [ ] Admin authentication required

---

## Success Criteria

- ✅ All admin endpoints use proper API routes
- ✅ No direct database access from frontend components
- ✅ All field mappings documented
- ✅ All endpoints tested
- ✅ Zero security vulnerabilities

---

**Status**: Ready for Implementation
**Estimated Time**: 2-3 days

