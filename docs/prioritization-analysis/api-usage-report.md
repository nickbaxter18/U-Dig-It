# API Usage Report

**Generated**: 2025-01-23
**Analysis Period**: Last 7 days (from Supabase logs)
**Purpose**: Categorize API endpoints by usage patterns to identify which features are actively used vs. unused

---

## Executive Summary

**Key Findings**:
- Most API calls are **direct Supabase REST queries** (not Next.js API routes)
- Next.js API routes are primarily used for:
  - Webhook processing (Stripe, SendGrid, IDKit)
  - Complex business logic (booking creation, payment processing)
  - Admin operations requiring service role access
- Many admin API endpoints have **zero or minimal usage** from UI
- External scripts/testing use some diagnostic endpoints

---

## API Usage Categories

### 1. Actively Used (External/Scripts)

These APIs are being called from outside the UI (scripts, testing, webhooks):

#### Webhook Endpoints
- ✅ `POST /api/webhooks/stripe` - **HIGH USAGE** - Payment webhooks
- ✅ `POST /api/webhooks/sendgrid` - **HIGH USAGE** - Email webhooks
- ✅ `POST /api/webhooks/idkit` - **MEDIUM USAGE** - ID verification webhooks

#### Testing/Diagnostic Endpoints
- ✅ `GET /api/admin/test-integrations` - **MEDIUM USAGE** - Used in testing scripts
- ✅ `GET /api/admin/diagnose-email` - **LOW USAGE** - Manual diagnostics
- ✅ `GET /api/health` - **HIGH USAGE** - Health checks

**Status**: These are **essential** and should remain, but may not need UI integration (webhooks are server-to-server)

---

### 2. UI-Integrated (Already Have UI)

These APIs are actively called from UI components:

#### Booking Management
- ✅ `GET /api/admin/bookings` - **HIGH USAGE** - Bookings list page
- ✅ `GET /api/admin/bookings/[id]` - **HIGH USAGE** - Booking details modal
- ✅ `POST /api/admin/bookings` - **MEDIUM USAGE** - Create booking
- ✅ `PUT /api/admin/bookings/[id]` - **MEDIUM USAGE** - Update booking

#### Equipment Management
- ✅ `GET /api/admin/equipment` - **HIGH USAGE** - Equipment list page
- ✅ `GET /api/admin/equipment/[id]` - **HIGH USAGE** - Equipment details
- ✅ `POST /api/admin/equipment` - **MEDIUM USAGE** - Add equipment
- ✅ `PUT /api/admin/equipment/[id]` - **MEDIUM USAGE** - Update equipment

#### Customer Management
- ✅ `GET /api/admin/customers` - **HIGH USAGE** - Customers list page
- ✅ `GET /api/admin/customers/[id]` - **HIGH USAGE** - Customer details

#### Payments
- ✅ `GET /api/admin/payments` - **HIGH USAGE** - Payments list page
- ✅ `POST /api/admin/payments/refund` - **MEDIUM USAGE** - Refund processing

**Status**: These are **working well** and don't need additional UI integration

---

### 3. Unused (No Calls Detected)

These APIs exist but show **zero or minimal usage**:

#### System Administration
- ❌ `GET /api/admin/jobs/status` - **ZERO USAGE** - No UI integration
- ❌ `GET /api/admin/jobs/runs` - **ZERO USAGE** - No UI integration
- ❌ `POST /api/admin/jobs/[name]/trigger` - **ZERO USAGE** - No UI integration

#### Financial Management
- ❌ `GET /api/admin/payments/ledger` - **ZERO USAGE** - Used in component but no dedicated page
- ❌ `POST /api/admin/payments/reconcile` - **ZERO USAGE** - No UI integration
- ❌ `GET /api/admin/payments/manual` - **ZERO USAGE** - No dedicated management page
- ❌ `POST /api/admin/payments/manual` - **ZERO USAGE** - No dedicated management page

#### Logistics
- ❌ `GET /api/admin/logistics/tasks` - **ZERO USAGE** - No UI integration
- ❌ `POST /api/admin/logistics/tasks` - **ZERO USAGE** - No UI integration
- ❌ `POST /api/admin/logistics/assign-driver` - **ZERO USAGE** - No UI integration

#### Maintenance
- ❌ `GET /api/admin/maintenance/alerts` - **ZERO USAGE** - No UI integration
- ❌ `PATCH /api/admin/maintenance/logs/[id]` - **ZERO USAGE** - No edit functionality

#### Telematics
- ❌ `GET /api/admin/telematics/snapshots` - **ZERO USAGE** - No UI integration
- ❌ `GET /api/admin/equipment/[id]/telematics` - **ZERO USAGE** - No UI integration

#### Insurance
- ❌ `GET /api/admin/insurance/[id]/activity` - **ZERO USAGE** - No UI integration
- ❌ `POST /api/admin/insurance/[id]/request-info` - **ZERO USAGE** - No UI integration
- ❌ `POST /api/admin/insurance/[id]/remind` - **ZERO USAGE** - No UI integration

#### Reports
- ❌ `GET /api/admin/reports/scheduled` - **ZERO USAGE** - Component exists but no page
- ❌ `POST /api/admin/reports/scheduled` - **ZERO USAGE** - Component exists but no page

**Status**: These are **candidates for UI integration** or **deprecation** if not needed

---

### 4. Low Usage (Minimal Calls)

These APIs have some usage but infrequent:

#### Permissions
- ⚠️ `GET /api/admin/permissions` - **LOW USAGE** - Used in settings page
- ⚠️ `GET /api/admin/permissions/audit` - **LOW USAGE** - Component exists but rarely accessed

#### Analytics
- ⚠️ `GET /api/admin/analytics/export` - **LOW USAGE** - Export button may not be working
- ⚠️ `POST /api/admin/analytics/generate-report` - **LOW USAGE** - May not be fully functional

**Status**: These may need **UI improvements** or **verification** that they work correctly

---

## Usage Patterns Analysis

### Pattern 1: Direct Supabase Queries (Most Common)

**Finding**: Most data fetching uses direct Supabase REST queries, not Next.js API routes.

**Examples from Logs**:
- `/rest/v1/bookings` - Direct booking queries
- `/rest/v1/equipment` - Direct equipment queries
- `/rest/v1/users` - Direct user queries
- `/rest/v1/maintenance_logs` - Direct maintenance queries

**Implication**:
- Many features work without Next.js API routes
- API routes are primarily for complex operations (webhooks, business logic)
- Some "missing UI" features may actually work via direct Supabase queries

### Pattern 2: Webhook-Heavy Architecture

**Finding**: High usage of webhook endpoints indicates server-to-server communication.

**Examples**:
- Stripe webhooks (payment processing)
- SendGrid webhooks (email delivery)
- IDKit webhooks (ID verification)

**Implication**:
- These don't need UI integration (they're automated)
- Focus UI integration on admin-facing features

### Pattern 3: Testing Script Usage

**Finding**: Some endpoints are used primarily in testing scripts.

**Examples**:
- `/api/admin/test-integrations` - Used in `TEST_YOUR_PLATFORM.sh`
- `/api/dev/complete-all-steps` - Used in manual testing

**Implication**:
- These may not need UI integration
- Keep for testing/debugging purposes

---

## Recommendations by Category

### High Priority for UI Integration

1. **Jobs Monitoring** (`/api/admin/jobs/*`)
   - **Reason**: Critical for system health monitoring
   - **Current**: Zero usage, no UI
   - **Recommendation**: Create `/admin/system/jobs` page

2. **Payment Ledger** (`/api/admin/payments/ledger`)
   - **Reason**: Financial tracking is critical
   - **Current**: Used in component but no dedicated page
   - **Recommendation**: Create `/admin/payments/ledger` page

3. **Maintenance Alerts** (`/api/admin/maintenance/alerts`)
   - **Reason**: Equipment availability depends on maintenance
   - **Current**: Zero usage, no UI
   - **Recommendation**: Add to dashboard or create alerts page

4. **Logistics Tasks** (`/api/admin/logistics/tasks`)
   - **Reason**: Core operations functionality
   - **Current**: Zero usage, no UI
   - **Recommendation**: Create `/admin/operations/logistics` page

### Medium Priority for UI Integration

1. **Scheduled Reports** (`/api/admin/reports/scheduled`)
   - **Reason**: Component exists, just needs page integration
   - **Current**: Component exists but no page
   - **Recommendation**: Create `/admin/reports/scheduled` page

2. **Manual Payments** (`/api/admin/payments/manual`)
   - **Reason**: Important for off-platform payments
   - **Current**: Zero usage, no dedicated page
   - **Recommendation**: Create `/admin/payments/manual` page

3. **Telematics** (`/api/admin/telematics/*`)
   - **Reason**: Useful for equipment tracking
   - **Current**: Zero usage, no UI
   - **Recommendation**: Add to equipment details page

### Low Priority / Deprecation Candidates

1. **Insurance Activity** (`/api/admin/insurance/[id]/activity`)
   - **Reason**: Low business value, infrequent use
   - **Recommendation**: Defer or deprecate if not needed

2. **Permission Audit** (`/api/admin/permissions/audit`)
   - **Reason**: Component exists but rarely accessed
   - **Recommendation**: Verify if actually needed, may be low priority

---

## Next Steps

1. **Verify Direct Supabase Usage**: Check which "missing UI" features actually work via direct queries
2. **Prioritize by Business Value**: Focus on high-impact features first
3. **User Validation**: Interview admins to confirm which features they actually need
4. **Deprecation Review**: Consider removing unused endpoints to reduce maintenance burden

---

**Status**: ✅ Complete
**Next Document**: User Workflow Analysis









