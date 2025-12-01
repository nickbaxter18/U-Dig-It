# Stripe Checkout Balance Fixes - Summary

## Issues Found and Fixed

### 1. **CRITICAL: Balance Recalculation Query Bug**
**Problem**: The balance recalculation function was querying the `payments` table with `.is('deleted_at', null)`, but the `payments` table doesn't have a `deleted_at` column. This caused the query to fail silently, preventing balance updates.

**Fix**: Removed the `deleted_at` filter from the payments query in `frontend/src/lib/booking/balance.ts` line 121.

**Impact**: Balance recalculation now works correctly for Stripe payments.

---

### 2. **Invalid Payment Status Query**
**Problem**: The balance recalculation was querying for status `'succeeded'`, but the `payments` table enum only has: `pending`, `processing`, `completed`, `failed`, `cancelled`, `refunded`, `partially_refunded`. There is no `'succeeded'` status.

**Fix**: Changed query from `.in('status', ['completed', 'succeeded'])` to `.eq('status', 'completed')` in:
- `frontend/src/lib/booking/balance.ts` line 121
- `frontend/src/components/admin/finance/BookingFinancePanel.tsx` line 252

**Impact**: Balance calculation now correctly counts only completed payments.

---

### 3. **Missing Webhook Balance Recalculation**
**Problem**: The Stripe webhook handler was updating payment status to 'completed' but NOT calling `recalculateBookingBalance()`, leaving the database balance stale.

**Fix**: Added balance recalculation call in `frontend/src/app/api/webhooks/stripe/route.ts` after payment status update (lines 326-346).

**Impact**: Balance now updates automatically after Stripe payments complete.

---

### 4. **Receipt Showing Full Amount**
**Problem**: Receipt generation was using `booking.totalAmount` instead of `payment.amount`, showing the full booking amount instead of the actual payment.

**Fix**: Changed `frontend/src/lib/receipts/generate-payment-receipt.ts` line 148 to use `payment.amount` as primary, with `booking.totalAmount` as fallback.

**Impact**: Receipts now show the correct payment amount.

---

### 5. **Parent Component Not Refreshing**
**Problem**: When manual payments were updated, the parent component (`BookingDetailPage`) wasn't refreshing the booking data, so stale `balanceAmount` prop was passed.

**Fix**:
- Added `onBalanceUpdated` callback prop to `BookingFinancePanel`
- Callback triggers `fetchBookingDetails` to refresh booking data
- Callback is called after manual payment creation and completion

**Impact**: Parent component now refreshes booking data when balance changes.

---

### 6. **Checkout Session Using Stale Balance**
**Problem**: Checkout session creation was using potentially stale `balance_amount` from database without recalculating first.

**Fix**: Added balance recalculation BEFORE creating checkout session in `frontend/src/app/api/stripe/create-checkout-session/route.ts` (lines 149-206).

**Impact**: Checkout sessions now use accurate outstanding balance.

---

## Files Modified

1. `frontend/src/lib/booking/balance.ts` - Fixed payment query (removed deleted_at, fixed status)
2. `frontend/src/app/api/webhooks/stripe/route.ts` - Added balance recalculation after payment completion
3. `frontend/src/lib/receipts/generate-payment-receipt.ts` - Fixed receipt amount display
4. `frontend/src/app/api/stripe/create-checkout-session/route.ts` - Added balance recalculation before checkout
5. `frontend/src/components/admin/finance/BookingFinancePanel.tsx` - Added callback, fixed status filter
6. `frontend/src/app/admin/bookings/[id]/page.tsx` - Added refresh callback

---

## Testing Verification

**Before Fixes**:
- Manual payment: $100 completed
- Database balance_amount: $862.50 (WRONG - should be $762.50)
- Checkout showing: $395 (WRONG)
- Receipt showing: $895 (WRONG)

**After Fixes**:
- Manual payment: $100 completed
- Database balance_amount: $762.50 (CORRECT)
- Checkout should show: $762.50 (correct outstanding balance)
- Receipt should show: Payment amount (not totalAmount)

---

## Root Causes

1. **Database Schema Mismatch**: Querying for columns that don't exist (`deleted_at` on payments table)
2. **Invalid Enum Values**: Querying for status values that don't exist in the enum (`'succeeded'`)
3. **Missing Balance Updates**: Webhook not calling balance recalculation after payment completion
4. **Stale Data**: Parent components not refreshing when child components update data

---

## Next Steps for Testing

1. Record a new manual payment and mark it as 'completed'
2. Verify balance_amount updates in database
3. Verify UI shows correct outstanding balance
4. Create Stripe checkout and verify amount matches outstanding balance
5. Complete Stripe payment and verify balance updates
6. Generate receipt and verify it shows payment amount, not totalAmount




