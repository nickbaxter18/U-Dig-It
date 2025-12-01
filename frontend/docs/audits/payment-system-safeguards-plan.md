# Payment System Safeguards & Validation Plan

## Overview

Comprehensive measures, tests, and checks to ensure payment system functionality with absolute best results. Multi-layered approach covering database constraints, automated validation, monitoring, and testing.

---

## 1. Database-Level Safeguards

### 1.1 Balance Validation Trigger
**Purpose**: Automatically validate balance accuracy after payment changes

**Implementation**: Create database trigger that:
- Fires after INSERT/UPDATE on `payments` or `manual_payments`
- Calculates expected balance
- Compares with stored `balance_amount`
- Logs discrepancies to `balance_validation_log` table
- Optionally auto-corrects if discrepancy is small (< $0.01)

**File**: New migration `supabase/migrations/YYYYMMDD_balance_validation_trigger.sql`

---

### 1.2 Payment Amount Constraints
**Purpose**: Prevent invalid payment amounts

**Implementation**: Add CHECK constraints:
- `amount > 0` (positive amounts only)
- `amountRefunded <= amount` (can't refund more than paid)
- `amountRefunded >= 0` (no negative refunds)

**File**: New migration `supabase/migrations/YYYYMMDD_payment_amount_constraints.sql`

---

### 1.3 Duplicate Payment Prevention
**Purpose**: Prevent duplicate pending payments

**Implementation**: Create unique partial index:
```sql
CREATE UNIQUE INDEX CONCURRENTLY idx_payments_duplicate_prevention
ON payments(bookingId, amount, type)
WHERE status IN ('pending', 'processing')
AND created_at > NOW() - INTERVAL '1 hour';
```

**File**: New migration `supabase/migrations/YYYYMMDD_duplicate_payment_prevention.sql`

---

### 1.4 Balance Consistency Check Function
**Purpose**: Function to validate balance for a booking

**Implementation**: Create function `validate_booking_balance(booking_id UUID)`:
- Calculates expected balance
- Compares with stored balance
- Returns discrepancy amount
- Can be called by scheduled jobs or API endpoints

**File**: New migration `supabase/migrations/YYYYMMDD_balance_validation_function.sql`

---

## 2. Automated Balance Validation

### 2.1 Scheduled Balance Reconciliation
**Purpose**: Periodically validate all booking balances

**Implementation**:
- Create API endpoint `/api/admin/payments/validate-balances`
- Runs balance validation for all bookings
- Reports discrepancies
- Optionally auto-corrects small discrepancies

**File**: `frontend/src/app/api/admin/payments/validate-balances/route.ts`

**Schedule**: Run daily via cron job or scheduled task

---

### 2.2 Balance Validation on Payment Events
**Purpose**: Validate balance immediately after payment changes

**Implementation**:
- Add validation call after `recalculateBookingBalance()`
- Log discrepancies immediately
- Alert if discrepancy > threshold ($1.00)

**Files**:
- `frontend/src/lib/booking/balance.ts` - Add validation after recalculation
- `frontend/src/lib/booking/balance-validator.ts` - New validation utility

---

### 2.3 Balance Validation API Endpoint
**Purpose**: Manual trigger for balance validation

**Implementation**:
- GET `/api/admin/payments/validate-balance?bookingId=xxx` - Validate single booking
- POST `/api/admin/payments/validate-balances` - Validate all bookings
- Returns validation report with discrepancies

**File**: `frontend/src/app/api/admin/payments/validate-balance/route.ts`

---

## 3. Integration Tests

### 3.1 Payment Flow Integration Tests
**Purpose**: Test complete payment flows end-to-end

**Test Scenarios**:
1. Customer creates payment intent → Stripe webhook → balance updates → receipt generated
2. Admin records manual payment → balance updates → billing status updates
3. Admin processes refund → Stripe refund → balance updates → receipt shows refund
4. Multiple payments on same booking → correct balance calculation
5. Overpayment scenario → balance shows $0.00, "PAID IN FULL"

**File**: `frontend/e2e/payment-flows.spec.ts`

---

### 3.2 Balance Calculation Integration Tests
**Purpose**: Test balance calculation with various scenarios

**Test Scenarios**:
1. Single payment clears balance
2. Multiple payments (Stripe + manual)
3. Payment with refund
4. Partial refund
5. Overpayment
6. Payment status changes (pending → completed)

**File**: `frontend/src/lib/booking/__tests__/balance-integration.test.ts`

---

### 3.3 Refund Flow Integration Tests
**Purpose**: Test complete refund flow

**Test Scenarios**:
1. Full refund → balance increases correctly
2. Partial refund → balance increases correctly
3. Refund on payment with multiple payments → correct balance
4. Refund updates billing status
5. Refund appears in receipt

**File**: `frontend/src/app/api/admin/__tests__/payments-refund-integration.test.ts`

---

## 4. Health Checks & Monitoring

### 4.1 Payment System Health Check
**Purpose**: Monitor payment system health

**Implementation**: API endpoint `/api/health/payments` that checks:
- Database connectivity
- Stripe API connectivity
- Recent payment processing success rate
- Balance discrepancies (last 24 hours)
- Duplicate payment detection

**File**: `frontend/src/app/api/health/payments/route.ts`

---

### 4.2 Balance Discrepancy Alerting
**Purpose**: Alert when balance discrepancies are detected

**Implementation**:
- Monitor `balance_validation_log` table
- Send alerts when discrepancy > threshold
- Dashboard showing recent discrepancies
- Automated email to admins for critical discrepancies

**Files**:
- `frontend/src/lib/monitoring/balance-alerts.ts` - Alert logic
- `frontend/src/app/api/admin/payments/balance-alerts/route.ts` - Alert endpoint

---

### 4.3 Payment Processing Metrics
**Purpose**: Track payment processing health

**Metrics to Track**:
- Payment success rate
- Average payment processing time
- Refund processing time
- Balance recalculation failures
- Duplicate payment attempts

**File**: `frontend/src/lib/monitoring/payment-metrics.ts`

---

## 5. Data Integrity Checks

### 5.1 Automated Data Integrity Validation
**Purpose**: Periodic validation of data integrity

**Checks**:
- Orphaned payments (payments without valid bookings)
- Orphaned manual_payments
- Payments with invalid status transitions
- Financial_ledger entries matching actual payments
- Balance mismatches

**File**: `frontend/src/lib/validation/data-integrity.ts`

**Schedule**: Run daily

---

### 5.2 Payment Status Transition Validation
**Purpose**: Ensure valid payment status transitions

**Implementation**: Function to validate status transitions:
- `pending` → `processing` → `completed` ✅
- `pending` → `failed` ✅
- `completed` → `refunded` ✅
- `completed` → `partially_refunded` ✅
- Invalid transitions → log error

**File**: `frontend/src/lib/validation/payment-status.ts`

---

## 6. Pre-Commit & CI/CD Checks

### 6.1 Pre-Commit Hooks
**Purpose**: Prevent issues before code is committed

**Checks**:
- No `SELECT *` usage (ESLint rule)
- Balance calculation functions have tests
- Payment API routes have validation
- No hardcoded payment amounts

**File**: `.husky/pre-commit` (update existing)

---

### 6.2 CI/CD Validation
**Purpose**: Automated checks in CI pipeline

**Checks**:
- All payment tests pass
- Balance calculation tests pass
- No TypeScript errors
- No linting errors
- Payment API routes have tests
- Receipt generation tests pass

**File**: `.github/workflows/payment-validation.yml` (new)

---

## 7. Automated Reconciliation

### 7.1 Daily Balance Reconciliation
**Purpose**: Daily automated reconciliation

**Implementation**:
- Scheduled job runs daily
- Validates all booking balances
- Reports discrepancies
- Auto-corrects small discrepancies (< $0.01)
- Flags large discrepancies for manual review

**File**: `frontend/src/lib/jobs/daily-balance-reconciliation.ts`

---

### 7.2 Payment Reconciliation Report
**Purpose**: Weekly reconciliation report

**Implementation**:
- Generates weekly report
- Shows all balance discrepancies
- Payment processing statistics
- Refund statistics
- Recommendations

**File**: `frontend/src/app/api/admin/payments/reconciliation-report/route.ts`

---

## 8. Testing Coverage

### 8.1 Unit Tests
**Current**: 53 payment calculation tests ✅

**Add**:
- Balance calculation with refunds (edge cases)
- Overpayment scenarios
- Multiple payment scenarios
- Refund calculation edge cases

**File**: `frontend/src/lib/__tests__/payment-calculations.test.ts` (enhance)

---

### 8.2 Integration Tests
**Current**: 10 manual payment API tests ✅

**Add**:
- Balance recalculation after refund
- Balance recalculation after manual payment
- Multiple payment scenarios
- Overpayment handling

**File**: `frontend/src/app/api/admin/__tests__/payments-balance-integration.test.ts` (new)

---

### 8.3 E2E Tests
**Current**: 12 admin payments E2E tests ✅

**Add**:
- Complete refund flow
- Manual payment → balance update
- Overpayment display
- Receipt generation with refunds

**File**: `frontend/e2e/payment-balance-flows.spec.ts` (new)

---

## 9. Alerting & Notifications

### 9.1 Critical Payment Alerts
**Purpose**: Alert on critical payment issues

**Alerts**:
- Balance discrepancy > $10.00
- Payment processing failure rate > 5%
- Duplicate payment detected
- Refund processing failure
- Balance recalculation failure

**File**: `frontend/src/lib/monitoring/payment-alerts.ts`

---

### 9.2 Balance Discrepancy Dashboard
**Purpose**: Admin dashboard for balance issues

**Features**:
- List of bookings with balance discrepancies
- Discrepancy amount and date
- Auto-fix button for small discrepancies
- Manual review flag for large discrepancies

**File**: `frontend/src/app/admin/payments/balance-validation/page.tsx` (new)

---

## 10. Documentation & Runbooks

### 10.1 Payment System Runbook
**Purpose**: Operational procedures for payment issues

**Contents**:
- How to fix balance discrepancies
- How to handle duplicate payments
- How to process refunds correctly
- How to validate balance accuracy
- Emergency procedures

**File**: `frontend/docs/runbooks/payment-system-runbook.md`

---

### 10.2 Payment System Health Dashboard
**Purpose**: Real-time monitoring dashboard

**Metrics**:
- Current balance discrepancies
- Payment processing health
- Refund processing status
- Recent validation results
- System alerts

**File**: `frontend/src/app/admin/payments/health/page.tsx` (new)

---

## Implementation Priority

### Phase 1: Critical Safeguards (Week 1)
1. Balance validation trigger
2. Payment amount constraints
3. Duplicate payment prevention index
4. Balance validation function

### Phase 2: Automated Validation (Week 2)
5. Scheduled balance reconciliation
6. Balance validation on payment events
7. Balance validation API endpoint
8. Health check endpoint

### Phase 3: Testing & Monitoring (Week 3)
9. Integration tests for payment flows
10. Balance discrepancy alerting
11. Payment processing metrics
12. Data integrity checks

### Phase 4: Advanced Features (Week 4)
13. Automated reconciliation
14. Reconciliation reports
15. Health dashboard
16. Runbook documentation

---

## Success Metrics

### Validation Coverage
- 100% of payment changes trigger balance validation
- 100% of bookings validated daily
- < 0.1% balance discrepancy rate

### Test Coverage
- 90%+ code coverage for payment logic
- 100% of critical flows have E2E tests
- All edge cases covered

### Monitoring
- < 5 minute detection time for balance discrepancies
- 100% of critical alerts sent
- Daily automated reconciliation runs

---

## Files to Create

### Database Migrations
1. `supabase/migrations/YYYYMMDD_balance_validation_trigger.sql`
2. `supabase/migrations/YYYYMMDD_payment_amount_constraints.sql`
3. `supabase/migrations/YYYYMMDD_duplicate_payment_prevention.sql`
4. `supabase/migrations/YYYYMMDD_balance_validation_function.sql`

### API Routes
5. `frontend/src/app/api/admin/payments/validate-balance/route.ts`
6. `frontend/src/app/api/admin/payments/validate-balances/route.ts`
7. `frontend/src/app/api/health/payments/route.ts`
8. `frontend/src/app/api/admin/payments/reconciliation-report/route.ts`

### Utilities
9. `frontend/src/lib/booking/balance-validator.ts`
10. `frontend/src/lib/validation/data-integrity.ts`
11. `frontend/src/lib/validation/payment-status.ts`
12. `frontend/src/lib/monitoring/balance-alerts.ts`
13. `frontend/src/lib/monitoring/payment-metrics.ts`
14. `frontend/src/lib/jobs/daily-balance-reconciliation.ts`

### Tests
15. `frontend/src/lib/booking/__tests__/balance-integration.test.ts`
16. `frontend/src/app/api/admin/__tests__/payments-balance-integration.test.ts`
17. `frontend/e2e/payment-balance-flows.spec.ts`

### UI Components
18. `frontend/src/app/admin/payments/balance-validation/page.tsx`
19. `frontend/src/app/admin/payments/health/page.tsx`

### Documentation
20. `frontend/docs/runbooks/payment-system-runbook.md`

---

## Expected Outcomes

1. **Zero Balance Discrepancies**: Automated validation catches and fixes issues immediately
2. **Zero Duplicate Payments**: Idempotency checks prevent duplicates
3. **100% Test Coverage**: All critical flows tested
4. **Real-time Monitoring**: Issues detected within minutes
5. **Automated Recovery**: Small discrepancies auto-corrected
6. **Complete Audit Trail**: All validations logged for compliance

---

**Status**: Plan ready for implementation
**Estimated Implementation Time**: 4 weeks
**Priority**: High - Critical for payment system reliability


