# Receipt Generation Audit Findings

## Phase 1: Current System Audit Results

### 1.1 Data Flow Analysis

#### Payment Lookup Flow
- **File**: `frontend/src/lib/receipts/generate-payment-receipt.ts`
  - ✅ `fetchStripePayment()` - Correctly queries payments table
  - ✅ `fetchManualPayment()` - Correctly queries manual_payments table
  - ✅ Lookup priority: Stripe first, then manual (lines 529-534)
  - ✅ Both functions normalize data to `NormalizedPayment` interface

#### Payment History Flow
- **File**: `frontend/src/lib/receipts/generate-payment-receipt.ts`
  - ✅ `fetchPaymentHistory()` - Queries both tables (lines 435-511)
  - ⚠️ **ISSUE**: Uses invalid status 'succeeded' (line 453) - should be 'completed'
  - ✅ Fetches manual payments correctly (lines 474-497)
  - ✅ Sorts by date (line 508)
  - ✅ Sets `isCurrentPayment` flag correctly

#### Email Template Generation
- **File**: `frontend/src/lib/email-service.ts`
  - ✅ `buildInvoicePaymentReceiptEmail()` receives payment history
  - ✅ Payment history HTML rendering (lines 1584-1604)
  - ⚠️ **ISSUE**: Balance calculation may not account for all payment types correctly
  - ✅ Payment method labels are applied

### 1.2 Database Schema Verification

#### payments table
- ✅ Has: `id`, `amount`, `method`, `status`, `processedAt`, `createdAt`, `paymentNumber`
- ✅ Valid statuses: `pending`, `processing`, `completed`, `failed`, `cancelled`, `refunded`, `partially_refunded`
- ⚠️ **ISSUE**: Code checks for 'succeeded' which doesn't exist

#### manual_payments table
- ✅ Has: `id`, `amount`, `method`, `status`, `received_at`, `created_at`, `notes`
- ✅ Valid statuses: `pending`, `completed`, `voided`
- ✅ Soft delete support: `deleted_at` field
- ✅ Field mappings match code expectations

### 1.3 Issues Identified

#### Critical Issues

1. **Invalid Status Check** (Line 453 in generate-payment-receipt.ts)
   - Code checks for 'succeeded' status which doesn't exist in enum
   - Should check for 'completed' instead
   - Also affects line 1578 in email-service.ts

2. **Payment History Status Filtering**
   - Stripe payments: Uses 'succeeded' (invalid) - should use 'completed'
   - Manual payments: Correctly uses 'completed' and 'pending'
   - May cause some completed payments to be excluded from history

3. **Balance Calculation Logic**
   - Current logic (lines 1567-1572 in email-service.ts) may not correctly handle:
     - Multiple manual payments
     - Mixed payment types (Stripe + manual)
     - Refunds from both payment types

#### Potential Issues

4. **Payment Method Label Mapping**
   - Manual payment methods may not all have labels in `PAYMENT_METHOD_LABELS`
   - Need to verify all manual payment method enum values are covered

5. **Payment History Display**
   - Payment history section only shows when `length > 1` (line 1583)
   - Single payment receipts won't show history even if other payments exist
   - Should show history if there are ANY other payments for the booking

6. **Date Handling**
   - Manual payments use `received_at` or `created_at` (line 492)
   - Stripe payments use `processedAt` or `createdAt` (line 459)
   - Need to ensure consistent date handling

## Phase 2: Issue Identification Summary

### Payment History Issues
- ❌ Invalid status 'succeeded' prevents some payments from appearing
- ⚠️ Payment history only shows when multiple payments exist
- ✅ Manual payments are included in history
- ✅ `isCurrentPayment` flag works correctly
- ⚠️ Payment method labels may be missing for some manual payment types

### Balance Calculation Issues
- ⚠️ May not correctly account for all payment types
- ⚠️ Refunds may not be properly subtracted
- ✅ Handles pending vs completed payment status
- ⚠️ May not handle multiple payments correctly

### Display Issues
- ✅ Payment method labels display correctly (when mapped)
- ✅ Payment dates show correctly
- ⚠️ Payment notes may not be displayed
- ✅ Payment status (pending/completed) is shown
- ⚠️ Payment history section may not show all payments

## Next Steps

1. Fix invalid status check ('succeeded' → 'completed')
2. Ensure payment history always shows when other payments exist
3. Verify balance calculations work for all payment scenarios
4. Add missing payment method labels
5. Enhance payment history display to show notes
6. Test with real data scenarios


