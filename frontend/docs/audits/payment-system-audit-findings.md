# Payment System Audit Findings

## Phase 1: Database Integrity Audit

### 1.1 Schema Validation
- ✅ No orphaned payments (payments without valid bookings)
- ✅ No orphaned manual_payments
- ✅ No orphaned financial_ledger entries
- ✅ Payment status enum values are correct: pending, processing, completed, failed, cancelled, refunded, partially_refunded

### 1.2 Data Consistency Issues Found

#### Critical: Balance Mismatches
Found 4 bookings with incorrect balances:

1. **Booking BK-MIA9ASYQ-PTCRMQ** (c2c00a7b-476b-41dc-9d1c-89ba4d0d5cad)
   - Total: $895.85
   - Stored balance: $695.85
   - Manual payments: $900.00 (overpaid by $4.15)
   - Calculated balance: -$4.15 (should be $0.00)
   - **Issue**: Overpayment not handled correctly

2. **Booking BK-MIA8Z6DL-ERY155** (652b4410-c038-44f2-ab3f-ee7ac75cf4bd)
   - Total: $862.50
   - Stored balance: $762.50
   - Manual payments: $1,650.00 (overpaid by $787.50)
   - Calculated balance: -$787.50 (should be $0.00)
   - **Issue**: Overpayment not handled correctly

3. **Booking BK-MIA9JW2K-WM6VWT** (0ad1e551-4bd6-4ff9-8a3f-b1f950feddb8)
   - Total: $862.50
   - Stored balance: $579.00
   - Manual payments: $2,551.50 (overpaid by $1,689.00)
   - Calculated balance: -$1,689.00 (should be $0.00)
   - **Issue**: Overpayment not handled correctly

4. **Booking BK-MI9HJYRH-MFG5CX** (643b54c0-86d4-44e2-97d3-7c4fae02575a)
   - Total: $895.85
   - Stored balance: $395.85
   - Manual payments: $700.00
   - Calculated balance: $195.85
   - Balance difference: $200.00
   - **Issue**: Balance not recalculated after payments

#### Issue: Duplicate Payments
Found 12 bookings with duplicate pending payments (same amount, same day):
- Multiple payment intents created for same booking
- Could indicate retry logic issues or race conditions
- Example: Booking `0ad1e551-4bd6-4ff9-8a3f-b1f950feddb8` has 6 pending payments of $395.85

#### Issue: Refunds Not Subtracted
Found 3 refunded payments:
- Refunds exist but balance calculation doesn't subtract `amountRefunded`
- This causes balances to be incorrect after refunds

---

## Phase 2: Balance Calculation Audit

### 2.1 Critical Bug: Refunds Not Subtracted

**File**: `frontend/src/lib/booking/balance.ts`

**Issue**: The `recalculateBookingBalance()` function does NOT subtract refunds from the total collected amount.

**Current Code** (lines 164-174):
```typescript
const manualPaymentsTotal = ...;
const stripePaymentsTotal = ...;
const totalCollected = manualPaymentsTotal + stripePaymentsTotal;
// ❌ Missing: Subtract refunds!
const newBalance = Math.max(totalAmount - totalCollected, 0);
```

**Should be**:
```typescript
const manualPaymentsTotal = ...;
const stripePaymentsTotal = ...;
const totalRefunded = ...; // Sum of amountRefunded from all payments
const totalCollected = manualPaymentsTotal + stripePaymentsTotal - totalRefunded;
const newBalance = Math.max(totalAmount - totalCollected, 0);
```

### 2.2 Issue: Overpayments Not Handled

When `totalCollected > totalAmount`, the balance should be $0.00, not negative. The code uses `Math.max(..., 0)` which prevents negative balances, but the stored balance doesn't reflect overpayments correctly.

**Recommendation**:
- Store overpayment amount separately or in a separate field
- Display "PAID IN FULL" when balance is $0.00 or negative
- Consider refunding overpayments automatically

---

## Phase 2: Balance Calculation Audit - COMPLETED

### Fixed: Refunds Not Subtracted
**File**: `frontend/src/lib/booking/balance.ts`

**Fix Applied**: Added refund calculation to subtract `amountRefunded` from total collected:
- Fetches all payments (not just completed) to get refund amounts
- Calculates `totalRefunded` by summing `amountRefunded` from all payments
- Updates formula: `totalCollected = manualPaymentsTotal + stripePaymentsTotal - totalRefunded`

### Fixed: Refund Route Missing Balance Recalculation
**File**: `frontend/src/app/api/admin/payments/refund/route.ts`

**Fix Applied**: Added balance recalculation after refund processing:
- Calls `recalculateBookingBalance()` after refund is processed
- Updates billing status after balance recalculation
- Returns new balance in response

## Phase 3: API Routes Audit - IN PROGRESS

### Admin Payment APIs - Status

| Route | Status | Issues Found | Fixed |
|-------|--------|--------------|-------|
| `/api/admin/payments/refund` | ✅ Fixed | Missing balance recalculation | ✅ Yes |
| `/api/admin/payments/manual` | ✅ Good | None | - |
| `/api/admin/payments/manual/[id]` | ✅ Good | None | - |
| `/api/admin/payments/receipt/[id]` | ✅ Good | None | - |
| `/api/admin/payments/ledger` | ✅ Good | None | - |
| `/api/admin/payments/retry/[id]` | ✅ Good | None | - |
| `/api/admin/payments/disputes` | ✅ Good | None | - |
| `/api/admin/payments/reconcile` | ⏳ Pending | - | - |
| `/api/admin/payments/exports` | ⏳ Pending | - | - |
| `/api/admin/payments/stripe/link` | ⏳ Pending | - | - |

### Customer Payment APIs - Status

| Route | Status | Issues Found | Fixed |
|-------|--------|--------------|-------|
| `/api/payments/create-intent` | ✅ Good | None | - |
| `/api/payments/mark-completed` | ✅ Good | None (dev only) | - |
| `/api/payments/receipt/[id]` | ⏳ Pending | - | - |

### Webhook APIs - Status

| Route | Status | Issues Found | Fixed |
|-------|--------|--------------|-------|
| `/api/webhooks/stripe` | ✅ Good | None | - |

## Next Steps

1. ✅ Fix balance calculation to subtract refunds - DONE
2. ✅ Fix refund route to recalculate balance - DONE
3. ⏳ Audit remaining admin routes (reconcile, exports, stripe/link)
4. ⏳ Audit receipt generation for refund display
5. ⏳ Audit frontend components
6. ⏳ Add tests for refund scenarios

