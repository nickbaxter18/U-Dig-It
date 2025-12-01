# Admin Payments Page User Guide

## Overview

The Admin Payments Page (`/admin/payments`) provides comprehensive payment management tools for administrators. This page allows you to view, manage, and analyze all payment transactions, process refunds, manage manual payments, and generate financial reports.

## Access Requirements

- **Permission Required**: Admin role or `payments:read:all` permission
- **Location**: `/admin/payments`

## Main Features

### 1. Payments Table

The main payments table displays all payment transactions with the following information:

- **Payment ID**: Unique identifier for each payment
- **Booking Number**: Associated booking reference
- **Customer**: Customer name
- **Amount**: Payment amount and refunded amount (if applicable)
- **Payment Method**: Credit card, bank transfer, cash, check, etc.
- **Status**: Payment status (succeeded, pending, failed, refunded, partially_refunded)
- **Date**: Payment creation date and time
- **Actions**: View details, process refunds, retry failed payments

#### Pagination

The payments table is paginated to improve performance:
- **Page Size**: 50 payments per page
- **Navigation**: Use Previous/Next buttons or click page numbers
- **Results Count**: Shows current page range and total count

#### Filtering

- **Search**: Search by payment ID, booking number, or customer name
- **Status Filter**: Filter by payment status (All, Succeeded, Pending, Failed, Refunded, Partially Refunded)
- **Date Filter**: Filter by time period (All Time, Today, This Week, This Month)

### 2. Financial Reports Section

Displays key financial metrics for the selected date range:

- **Net Revenue**: Total revenue minus refunds, with period comparison
- **Average Transaction Value**: Average payment amount
- **Success Rate**: Percentage of successful payments
- **Revenue Breakdown**: Gross revenue, refunds, and net revenue
- **Payment Method Breakdown**: Revenue by payment method (Card, Bank Transfer, Other)

**Date Range Options**:
- Today
- This Week
- This Month
- This Quarter
- This Year

**Export**: Click "Export Report" to generate a downloadable financial report.

### 3. Manual Payments

Manage cash, cheque, and ACH payments recorded outside of Stripe:

- **View**: See all manual payments with booking reference, amount, method, and status
- **Mark Completed**: Update pending manual payments to completed status
- **Notes**: View payment notes and attachments

**Manual Payment Statuses**:
- **Pending**: Payment recorded but not yet confirmed
- **Completed**: Payment confirmed and applied to booking balance
- **Voided**: Payment cancelled or invalid

### 4. Upcoming Installments

Monitor pending payment installments across all bookings:

- **Booking Number**: Associated booking
- **Customer**: Customer name
- **Due Date**: When payment is due
- **Amount**: Installment amount
- **Status**: Payment status (pending, paid, overdue, cancelled)

### 5. Payout Reconciliation

Reconcile Stripe payouts with your records:

- **View Payouts**: See all Stripe payouts with status and details
- **Sync from Stripe**: Fetch latest payout data from Stripe
- **Update Status**: Mark payouts as reconciled or flag discrepancies
- **Notes**: Add notes for reconciliation tracking

**Payout Statuses**:
- **Pending**: Awaiting reconciliation
- **Reconciled**: Matched with records
- **Discrepancy**: Mismatch detected

### 6. Financial Ledger

View all financial ledger entries:

- **Entry Type**: Type of transaction (payment, refund, manual, etc.)
- **Amount**: Transaction amount
- **Source**: Transaction source
- **Reference**: Related booking or payment ID
- **Description**: Transaction description
- **Date**: Entry creation date

**Filtering**:
- By booking ID
- By entry type
- By date range

### 7. Financial Exports

Generate and download financial reports:

- **Export Types**:
  - Payments Summary
  - Manual Payments
  - Accounts Receivable
  - Payout Summary
- **Status Tracking**: Monitor export generation status
- **Download**: Access completed exports via download links

## Common Workflows

### Processing a Refund

1. Navigate to the payments table
2. Find the payment you want to refund
3. Click the **"Refund"** button (only available for succeeded payments with remaining balance)
4. Enter the refund amount (cannot exceed available balance)
5. Enter a reason for the refund
6. Click **"Process Refund"**
7. The refund will be processed through Stripe (if applicable) and the payment status will be updated

**Note**: Partial refunds are supported. The payment status will update to "partially_refunded" or "refunded" based on the refund amount.

### Recording a Manual Payment

1. Navigate to the **Manual Payments** section
2. Click **"Record Manual Payment"** (if available)
3. Enter booking reference, amount, payment method, and notes
4. Select status (pending or completed)
5. Save the payment
6. The booking balance will be automatically recalculated

### Completing a Manual Payment

1. Find the pending manual payment in the **Manual Payments** table
2. Click **"Mark Completed"**
3. The payment status will update and the booking balance will be recalculated
4. If the booking balance reaches $0, the booking status will automatically update to "paid"

### Viewing Payment Details

1. Click **"View"** on any payment in the payments table
2. A modal will display:
   - Payment information (ID, booking, customer, amount, method, status)
   - Timeline (created, processed, refunded dates)
   - Refund information (if applicable)
   - Stripe information (if applicable)
3. Click outside the modal or the close button to dismiss

### Generating Financial Reports

1. Select a date range using the date filter
2. Review the financial metrics displayed
3. Click **"Export Report"** to generate a downloadable report
4. Wait for the export to complete (status shown in Financial Exports section)
5. Download the report when ready

### Reconciling Payouts

1. Navigate to the **Payout Reconciliation** section
2. Click **"Sync from Stripe"** to fetch latest payout data
3. Review each payout and compare with your records
4. Update status:
   - **Reconciled**: If payout matches your records
   - **Discrepancy**: If there's a mismatch
5. Add notes for any discrepancies or important information

## Payment Statuses

- **Succeeded**: Payment completed successfully
- **Pending**: Payment is being processed
- **Failed**: Payment failed (can be retried)
- **Refunded**: Full refund processed
- **Partially Refunded**: Partial refund processed

## Payment Methods

- **Credit/Debit Card**: Stripe card payments
- **Bank Transfer**: ACH or wire transfers
- **Cash**: Cash payments
- **Check**: Cheque payments
- **Other**: Other payment methods

## Tips and Best Practices

1. **Regular Reconciliation**: Reconcile Stripe payouts regularly to catch discrepancies early
2. **Document Refunds**: Always provide a clear reason when processing refunds
3. **Monitor Failed Payments**: Review failed payments and retry when appropriate
4. **Export Reports**: Generate financial reports regularly for record-keeping
5. **Check Manual Payments**: Review pending manual payments and complete them promptly
6. **Use Filters**: Use search and filters to quickly find specific payments
7. **Review Financial Metrics**: Monitor key metrics to track business performance

## Troubleshooting

### Payment Not Showing

- Check date filters - payments may be outside the selected date range
- Check status filters - payment may be filtered out
- Refresh the page to reload data

### Refund Not Processing

- Verify payment status is "succeeded"
- Check that refund amount doesn't exceed available balance
- Ensure Stripe connection is working (for Stripe payments)
- Check browser console for error messages

### Manual Payment Not Updating Balance

- Ensure payment status is set to "completed"
- Check that booking ID is correct
- Verify payment amount is correct
- Refresh the page to see updated balance

### Export Not Generating

- Check export status in Financial Exports section
- Wait a few moments for processing
- Try generating export again if it fails
- Check browser console for error messages

## Keyboard Shortcuts

- **Tab**: Navigate between form fields and buttons
- **Enter**: Submit forms or activate buttons
- **Escape**: Close modals
- **Arrow Keys**: Navigate pagination (when focused)

## Support

For issues or questions:
1. Check this guide first
2. Review error messages in the browser console
3. Contact system administrator
4. Check audit logs for payment history

---

**Last Updated**: 2025-01-22
**Version**: 1.0

