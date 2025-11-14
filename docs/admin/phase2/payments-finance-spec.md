# Phase 2 Spec – Payments, Installments & Reconciliation

_Date: 2025-11-11_

## Objectives
- Provide complete financial workflows for deposits, balances, manual payments, installments, and Stripe reconciliation.
- Deliver transparency on payouts, AR balances, and finance reporting.

## 1. Data Model & Migrations
- **Tables**:
  - `manual_payments` (id uuid, booking_id, customer_id, amount numeric, currency, method cash|ach|check|pos|other, status pending|completed|voided, received_at, recorded_by, notes, attachments jsonb, created_at, updated_at).
  - `installment_schedules` (id uuid, booking_id, installment_number, due_date, amount, status pending|paid|overdue|cancelled, payment_id (nullable), paid_at, reminder_sent_at, created_at).
  - `payout_reconciliations` (id uuid, stripe_payout_id, arrival_date, amount, currency, status pending|reconciled|discrepancy, details jsonb, reconciled_by, reconciled_at).
  - `financial_exports` (id uuid, admin_id, export_type, parameters jsonb, file_path, status, created_at, completed_at).
  - `financial_ledger` (id uuid, booking_id, entry_type deposit|balance|refund|manual|adjustment|fee, amount, currency, source stripe|manual|system, reference_id, description, created_at, created_by).
- **Column Additions**:
  - `bookings`: add `deposit_amount`, `balance_amount`, `balance_due_at`, `billing_status` (pending|deposit_paid|balance_paid|overdue), `finance_notes` text.
  - `payments`: add `manual_source` boolean (or reference to manual payment), `payout_id` (stripe payout).
  - `payment_schedules`: ensure compatibility with new `installment_schedules` (may deprecate old table or migrate data).
- **Indexes**:
  - `manual_payments`: `(booking_id)`, `(status, received_at)`.
  - `installment_schedules`: `(booking_id, due_date)`, `(status)`.
  - `payout_reconciliations`: `(arrival_date)`, `(status)`.
  - `financial_ledger`: `(booking_id, created_at)`, `(entry_type)`.

## 2. API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/payments/manual` | POST | Record manual payment intake (supports attachments). |
| `/api/admin/payments/manual/{id}` | PATCH/DELETE | Update status (void), edit notes/amount, delete (soft). |
| `/api/admin/bookings/{id}/installments` | GET/POST | Fetch schedule or create plan (auto-splits). |
| `/api/admin/installments/{id}/status` | PATCH | Mark installment paid, send reminder, defer. |
| `/api/admin/payments/reconcile` | POST | Trigger reconciliation for fetched Stripe payouts (manual kick). |
| `/api/admin/payments/reconcile/{payoutId}` | GET/PATCH | View reconciliation details, mark resolved. |
| `/api/admin/payments/ledger` | GET | Query ledger entries with filters (date range, type, booking). |
| `/api/admin/payments/exports` | POST/GET | Request/export finance reports (e.g., AR aging, payout report). |
| `/api/admin/payments/deposit-reminders` | POST | Force send deposit/balance reminders for a booking (optional). |

### Validation & Security
- Admin+ finance role required (introduce `role in ('admin','super_admin','finance')`).
- Zod schema for manual payment payload, installment plan configuration.
- Adjust RLS: new finance tables accessible only to admins/finance roles (no customer access).

## 3. Installment & Schedule Logic
- Default installment plan: split remaining balance into equal payments (e.g., 3 weekly) if booking > threshold.
- Provide manual override to edit amounts/dates (must sum to balance).
- On mark paid: create ledger entry, update booking balance, optionally capture Stripe payment (if card on file).
- Automatic reminders: 3 days before due, day-of, overdue escalation.

## 4. Manual Payments Workflow
- Intake UI: capture amount, method, receipt photo (attachment), notes, deposit/balance allocation.
- Approvals: optionally require dual approval for manual payments > threshold (future extension).
- Ledger entry created with link to manual payment record.
- Optionally generate receipt using existing template.

## 5. Stripe Reconciliation
- Nightly job fetches Stripe payouts (`stripe.payouts.list`) and charges/transfer grouped; populates `payout_reconciliations` with expected vs actual amounts.
- Admin UI shows payouts, associated bookings/payments, discrepancies.
- Allow manual adjustments (mark as reconciled, note difference).
- Stripe webhook handler (existing) extended to log payout events.

## 6. Reporting & Exports
- Provide presets: Accounts Receivable Ageing, Collected vs Outstanding, Upcoming Installments, Payout Summary.
- Exports generated via Edge Function (similar to dashboard export) and stored in `financial_exports` (CSV/PDF).
- Integrate with finance dashboards (materialized views + new summary UI).

## 7. UI Enhancements
- **Booking Detail**: Finance tab with deposit/balance progress, installments list, manual payment log, ledger timeline.
- **Payments List**: filters for manual vs Stripe, deposit status, installment status.
- **Reconciliation View**: table of payouts with statuses, drill-down into charges/refunds.
- **Ledger Explorer**: searchable entries by booking, type, date.

## 8. Automation & Notifications
- Reminder job for installments and overdue balances ( ties into notification service ).
- Deposit due reminders triggered after booking creation if unpaid.
- Overdue escalations: log alert (dashboard alert system) + email to finance team.

## 9. Testing Plan
- Unit: installment calculation, ledger entry creation, reconciliation diff algorithm.
- Integration: manual payment API, installment schedule updates, ledger query filters.
- E2E: record manual payment, mark installment paid, run reconciliation, download export.
- Mock Stripe API (use stripe-mock or stub) for reconciliation tests.

## 10. Dependencies & Risks
- Requires reliable sync with Stripe; ensure API keys and webhook signing secure.
- Manual payments need attachments storage (create bucket `manual-payment-attachments` with RLS).
- Balance calculations must be consistent across old/new bookings; plan data migration for existing deposit logic.
- Financial data accuracy critical; implement transaction wrap for ledger updates.

## 11. Implementation Checklist
1. Create migrations for new tables, columns, indexes, RLS policies.
2. Extend Stripe webhook handler for payouts, update service modules.
3. Implement manual payment + installment APIs with tests.
4. Build reconciliation job & UI components.
5. Integrate ledger view & exports.
6. Add reminder jobs to notification service.
7. Write unit/integration/E2E tests per plan.
8. Update finance documentation, SOPs, and changelog.

---
Prepared by: GPT-5 Codex.
