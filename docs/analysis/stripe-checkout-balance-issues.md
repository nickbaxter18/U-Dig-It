# Stripe Checkout Balance Issues - Deep Analysis

## Problem Summary
- Checkout showing $395 instead of correct outstanding balance
- Receipt showing $895 (full amount) instead of payment amount
- Manual payments not being properly accounted for

## Root Causes Identified

### 1. **CRITICAL: Webhook Handler Missing Balance Recalculation**
**Location**: `frontend/src/app/api/webhooks/stripe/route.ts`

**Issue**: The webhook handler imports `recalculateBookingBalance` but **NEVER calls it** after payment completion. This means:
- When Stripe payment completes, the payment status is updated to 'completed'
- But the booking `balance_amount` is NOT recalculated
- The balance remains stale until manual recalculation

**Impact**: All Stripe payments complete but don't update the balance, causing:
- Incorrect balance amounts
- Checkout sessions using stale balance
- UI showing wrong outstanding balance

**Fix Required**: Call `recalculateBookingBalance(bookingId)` after payment status is updated to 'completed' in the webhook handler.

---

### 2. **Manual Payment Status Issue**
**Location**: `frontend/src/app/api/admin/payments/manual/route.ts`

**Issue**: Manual payments are created with status 'pending' by default (line 188), but:
- Balance recalculation only counts payments with status 'completed' (balance.ts line 99)
- If admin doesn't mark payment as 'completed', it's not counted in balance
- There's a $100 manual payment with status 'pending' that's not being counted

**Current Data**:
- Manual payment: $100, status 'pending' (created 2025-11-21 23:44:27)
- Manual payment: $100, status 'completed' (created 2025-11-21 23:24:06)

**Impact**: Pending manual payments don't reduce the balance, causing incorrect calculations.

**Fix Required**:
- Option A: Auto-mark manual payments as 'completed' when created (if that's the business logic)
- Option B: Ensure balance recalculation happens when status changes to 'completed'
- Option C: Add UI warning that pending payments don't count toward balance

---

### 3. **Receipt Shows Full Booking Amount**
**Location**: `frontend/src/lib/receipts/generate-payment-receipt.ts` line 148

**Issue**: Receipt generation uses `booking.totalAmount` instead of `payment.amount`:
```typescript
totalAmount: booking.totalAmount ?? payment.amount,
```

**Impact**: Receipt always shows the full booking amount ($895.85) instead of the actual payment amount ($395.85 or whatever was paid).

**Fix Required**: Use `payment.amount` as primary, with `booking.totalAmount` as fallback only if payment amount is missing.

---

### 4. **Multiple Pending Payment Records**
**Location**: `frontend/src/app/api/stripe/create-checkout-session/route.ts`

**Issue**: Every checkout session creation creates a new payment record with status 'pending'. If checkout is abandoned or fails, these records accumulate:
- 5 pending payment records for $395.85 each
- These are created but never completed
- They don't affect balance (only 'completed' payments count)

**Impact**: Database pollution, but doesn't directly affect balance calculation.

**Fix Required**:
- Clean up abandoned payment records periodically
- Or don't create payment record until checkout actually completes

---

### 5. **Balance Calculation Logic**
**Location**: `frontend/src/lib/booking/balance.ts`

**Current Logic**:
```typescript
balance_amount = totalAmount - sum(all_completed_payments)
```

**Issue**: The calculation is correct, but:
- It only counts 'completed' manual payments
- It only counts 'completed' or 'succeeded' Stripe payments
- If webhook doesn't call recalculation, balance becomes stale

**Current State**:
- totalAmount: $895.85
- balance_amount: $395.85 (stale - should be $795.85)
- Manual payments completed: $100
- Expected balance: $895.85 - $100 = $795.85

**Fix Required**: Ensure balance is recalculated after every payment status change.

---

## Fix Priority

1. **CRITICAL**: Fix webhook to call `recalculateBookingBalance` after payment completion
2. **HIGH**: Fix receipt to show payment amount, not totalAmount
3. **MEDIUM**: Add balance recalculation logging to checkout session
4. **LOW**: Clean up pending payment records

---

## Implementation Plan

### Fix 1: Webhook Balance Recalculation
- Add `recalculateBookingBalance(bookingId)` call after payment status update
- Add `updateBillingStatus(bookingId)` call after balance recalculation
- Add comprehensive logging

### Fix 2: Receipt Amount Display
- Change receipt to use `payment.amount` as primary
- Only use `booking.totalAmount` as fallback if payment amount is missing
- Update email template if needed

### Fix 3: Enhanced Logging
- Add detailed logging in checkout session creation
- Log balance before/after recalculation
- Log all payment totals for debugging

### Fix 4: Manual Payment Status
- Document that only 'completed' payments count toward balance
- Add UI indicator for pending payments
- Consider auto-completing manual payments if that's the business logic




