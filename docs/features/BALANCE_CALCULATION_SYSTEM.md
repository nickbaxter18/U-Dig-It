# Booking Balance Calculation System

## Overview

The booking balance calculation system ensures accurate tracking of outstanding balances for all bookings. The balance represents the amount still owed after accounting for the deposit and all completed payments.

## Balance Formula

```
outstandingBalance = totalAmount - sum(all_completed_payments)
```

### Components

- **totalAmount**: The total contract amount for the booking
- **all_completed_payments**: Sum of:
  - All manual payments with status = 'completed'
  - All Stripe payments with status IN ('completed', 'succeeded')

**Important**: The deposit is completely separate from the balance calculation.
Security deposits are held separately and do NOT reduce what the customer owes.
The outstanding balance represents only the rental amount, not including deposits.

## Database Schema

### Bookings Table

- `totalAmount` (numeric, camelCase) - Total contract amount
- `depositAmount` (numeric, camelCase) - Security deposit amount
- `balance_amount` (numeric, snake_case) - Calculated outstanding balance

### Payments Table

- `bookingId` (uuid, camelCase) - Foreign key to bookings
- `amount` (numeric) - Payment amount
- `status` (enum) - Payment status ('pending', 'completed', 'succeeded', etc.)

### Manual Payments Table

- `booking_id` (uuid, snake_case) - Foreign key to bookings
- `amount` (numeric) - Payment amount
- `status` (enum) - Payment status ('pending', 'completed', 'voided')
- `deleted_at` (timestamp) - Soft delete flag

## When Balance is Recalculated

Balance is automatically recalculated in the following scenarios:

1. **Stripe Payment Completion** (Webhooks)
   - `checkout.session.completed` event
   - `payment_intent.succeeded` event
   - Location: `frontend/src/app/api/webhook/stripe/route.ts`

2. **Manual Payment Status Changes**
   - When manual payment status changes to/from 'completed'
   - When manual payment is created as 'completed'
   - Location: `frontend/src/app/api/admin/payments/manual/[id]/route.ts`

3. **Finance Panel Refresh**
   - When user clicks "Refresh" button
   - When finance panel is first loaded
   - Location: `frontend/src/components/admin/finance/BookingFinancePanel.tsx`

4. **Booking Creation**
   - Initial balance set: `totalAmount - depositAmount`
   - Location: `frontend/src/app/api/bookings/route.ts` (buildBookingInsert)

5. **Manual API Call**
   - Via `/api/admin/bookings/[id]/recalculate-balance` endpoint
   - Requires admin authentication

## Implementation Details

### Balance Recalculation Function

**File**: `frontend/src/lib/booking/balance.ts`

**Function**: `recalculateBookingBalance(bookingId: string)`

**Process**:
1. Fetch booking details (totalAmount, depositAmount, current balance_amount)
2. Fetch all completed manual payments
3. Fetch all completed Stripe payments
4. Calculate: `totalAmount - depositAmount - totalCollected`
5. Validate balance (no negative, no exceeding max)
6. Update database `balance_amount` column
7. Log calculation details

### Component Calculation

**File**: `frontend/src/components/admin/finance/BookingFinancePanel.tsx`

**Process**:
1. Fetch all payments (manual + Stripe)
2. Filter to completed payments only
3. Calculate total collected
4. Calculate outstanding: `totalAmount - depositAmount - collected`
5. Display calculated value (prioritized over database value for real-time accuracy)

## Validation Rules

1. **No Negative Balances**: Balance is capped at 0 using `Math.max(calculated, 0)`
2. **Maximum Balance**: Balance cannot exceed `totalAmount - depositAmount`
3. **Overpayment Handling**: Collected payments are capped at `totalAmount - depositAmount`
4. **Null Safety**: All calculations handle null/undefined values with defaults

## Edge Cases

### New Booking (No Payments)
- Initial balance = `totalAmount`
- Example: $895.85 total = $895.85 balance
- Note: Deposit is separate and doesn't affect balance

### Partial Payment
- Balance = `totalAmount - paymentAmount`
- Example: $895.85 total - $200 payment = $695.85 balance
- Note: Deposit is separate and doesn't affect balance

### Full Payment
- Balance = 0 (all payments sum to totalAmount)
- Example: $895.85 total - $895.85 payment = $0 balance
- Note: Deposit is separate and doesn't affect balance

### Full Payment
- Balance = 0 (capped at 0)
- All payments sum to `totalAmount - depositAmount`

### Overpayment
- Balance = 0 (capped at 0)
- Collected is capped at `totalAmount - depositAmount`

## API Endpoints

### Recalculate Balance

**POST** `/api/admin/bookings/[id]/recalculate-balance`

**Authentication**: Admin only

**Response**:
```json
{
  "success": true,
  "balance": 395.85
}
```

## Monitoring & Logging

All balance calculations are logged with:
- Component name
- Action type
- Booking ID
- Calculation inputs (totalAmount, depositAmount, payments)
- Calculated balance
- Balance change (old vs new)

**Log Levels**:
- `info`: Successful recalculation
- `debug`: Calculation steps and payment totals
- `warn`: Validation warnings (negative balance, exceeding max)
- `error`: Calculation failures

## Troubleshooting

### Balance Shows Incorrect Amount

1. **Check Payment Status**: Ensure payments are marked as 'completed'
2. **Verify Deposit Amount**: Check `depositAmount` is set correctly
3. **Recalculate Balance**: Use refresh button or API endpoint
4. **Check Logs**: Review calculation logs for errors
5. **Verify Payments**: Ensure all payments are fetched correctly

### Balance Not Updating

1. **Check Webhooks**: Verify Stripe webhooks are firing
2. **Check Manual Payment Updates**: Ensure status changes trigger recalculation
3. **Verify API Calls**: Check network tab for recalculation requests
4. **Check Permissions**: Ensure service client has proper permissions

### Negative Balance

- Should not occur due to `Math.max()` validation
- If it does, check for refund logic or data corruption
- Review logs for validation warnings

## Related Files

- `frontend/src/lib/booking/balance.ts` - Core recalculation function
- `frontend/src/components/admin/finance/BookingFinancePanel.tsx` - UI component
- `frontend/src/app/api/admin/bookings/[id]/recalculate-balance/route.ts` - API endpoint
- `frontend/src/app/api/webhook/stripe/route.ts` - Webhook handlers
- `frontend/src/app/api/admin/payments/manual/[id]/route.ts` - Manual payment updates

## Future Improvements

1. **Database Triggers**: Auto-recalculate on payment status changes
2. **Real-time Updates**: WebSocket updates for balance changes
3. **Balance History**: Track balance changes over time
4. **Refund Handling**: Explicit refund logic and balance adjustments
5. **Batch Recalculation**: Recalculate all bookings periodically

