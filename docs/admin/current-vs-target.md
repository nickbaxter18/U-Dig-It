# Admin Dashboard Current State vs. Target Capabilities

## Dashboard & Analytics
- **Current**: KPI cards, charts (revenue, utilization, bookings), auto-refresh timer, basic WebSocket indicator.
- **Gaps**:
  - Alerting for anomalies (e.g., utilization drop, overdue payments).
  - Scheduled/recurring reporting and export/download options (CSV, PDF, share links).
  - Saved filter/date presets and role-based dashboards.
  - Real-time connection indicator tied to actual Supabase channel health.
  - Backing data relies on live queries; no materialized views or caching layer.

## Bookings & Logistics
- **Current**: Table + calendar view, filters, booking detail modal, status updates, cancellations, flagged bookings, upcoming deliveries/returns, realtime Supabase updates, CSV export, logistics indicators.
- **Gaps**:
  - Admin-side booking creation wizard with availability/price simulation.
  - Bulk operations (status change, export with filters, mass notification).
  - Automated conflict detection, deposit reminders, pickup/return reminders.
  - Integrated logistics workflows tied to drivers (assignment, route planning, signature capture).
  - SLA tracking and audit logging for booking changes.

## Equipment & Maintenance
- **Current**: Equipment CRUD, status filtering, maintenance scheduling modal, utilization/revenue calculations, summary stats.
- **Gaps**:
  - Media gallery (photos, documents) with Supabase storage.
  - Maintenance history log, parts/labor tracking, and upcoming service alerts.
  - Telematics placeholders (location, runtime hours) and integration hooks.
  - Bulk import/update (CSV) with validation feedback.
  - Equipment categories/types, accessories, and compatibility rules for pricing/promotions.

## Customers & Accounts
- **Current**: Customer list, stats, filters, profile modal, edit form, email modal, suspend/activate, summary metrics.
- **Gaps**:
  - Customer timeline (bookings, payments, support tickets) with pagination.
  - Segments/tags, CRM notes, and credit/risk indicators.
  - Bulk messaging/export filtered by segment.
  - Verification workflows (insurance, certification) and compliance storage.
  - Self-service portals/invites and admin impersonation safeguards.

## Payments & Finance
- **Current**: Payment list with filters, refunds, receipts download/view, Stripe deep links, disputes section, finance reports component, summary KPIs.
- **Gaps**:
  - Manual payment recording (cash, ACH) and adjustments with double-entry audit.
  - Deposit vs. balance tracking, installment scheduling UI, auto reminders.
  - Stripe payout reconciliation dashboard and webhook coverage for all events.
  - Financial exports (general ledger, tax summaries) with drill-down.
  - Risk alerts for failed payments, chargebacks, or pending verifications.

## Field Operations
- **Current**: Delivery list, driver assignment modal, status updates, driver summary, date filter, summary KPIs.
- **Gaps**:
  - Calendar/kanban view for deliveries/pickups with drag-and-drop scheduling.
  - Map view with route planning, ETAs, traffic overlays, driver mobile notifications.
  - Pickup/return workflows (inspection checklist, photos, damage logging).
  - Driver availability management, certifications, and shift scheduling.
  - Integration with telematics or GPS providers for real-time tracking.

## Support & Communications
- **Support Tickets – Current**: Ticket list with filters, detail modal, reassignment, status updates, SLA stats.
- **Support – Gaps**:
  - Rich reply composer with email/SMS integration, canned responses, attachments.
  - SLA timers with escalation rules and alerting.
  - Customer-facing ticket history and satisfaction surveys.
  - Knowledge base linking and analytics dashboard.

- **Communications – Current**: Campaign/Template lists, stats cards, filters, navigation to create forms.
- **Communications – Gaps**:
  - Audience builder (segment selection, exclusions, test sends).
  - Schedule, throttling, A/B testing, deliverability analytics.
  - Template editor with preview, versioning, shared assets.
  - Unsubscribe/suppression list management synced to Supabase.

## Insurance & Compliance
- **Current**: Document list with filters, approval/rejection, stats, detail modal with notes.
- **Gaps**:
  - Automated reminder scheduling for expiring documents.
  - Audit trail of reviewer actions, comments, and notifications.
  - Request-more-info workflow and customer communications.
  - Metadata validation (coverage limits, dates) with compliance rules.
  - Integration with booking flows to enforce insurance prerequisites.

## Promotions & Pricing
- **Current**: Discount CRUD, toggle active, metrics per code, summary stats.
- **Gaps**:
  - Targeting (customer segments, equipment types, booking value thresholds).
  - Scheduling windows, stackability rules, performance analytics.
  - Approval workflow and change history.
  - Integration with pricing engine for validation and conflict detection.

## Contracts & E-Signature
- **Current**: Contracts list, filters, detail modal, send/download actions.
- **Gaps**:
  - Template builder, multi-signer support, dynamic placeholder management.
  - DocuSign/Adobe Sign status polling and webhook processing for envelope events.
  - Reminder automation, expiry handling, signed contract storage with versioning.
  - Integration with booking lifecycle to trigger contracts automatically.

## Audit Logging & Security
- **Current**: Audit log viewer with filters, export, severity indicators, detail modal.
- **Gaps**:
  - Real-time feed with anomaly alerts and correlation by session/IP.
  - Long-term archival and retention policies.
  - Automatic classification of high-risk actions with escalations.
  - Integration with security center (2FA events, failed logins, IP changes).

## Settings & Administration
- **Current**: System settings tabs (general, pricing, notifications, integrations, security), admin list, save workflow.
- **Gaps**:
  - Server-managed secrets (remove client exposure), validation/test buttons for integrations.
  - Admin invitations, role management granularity, 2FA enforcement, IP allow-list editor.
  - Session timeout warnings and forced logout controls.
  - Auditing changes with approvals and revert options.

## Infrastructure & Quality
- **Current**: Extensive UI, some logging, RLS policies in place, Stripe/SendGrid integrations, testing docs.
- **Gaps**:
  - Materialized views/functions for analytics, background jobs for reminders and reconciliations.
  - Comprehensive test coverage (unit, integration, Playwright) for new features.
  - Centralized notification service, observability dashboards, and staging rollout process.

---

This gap analysis will guide detailed implementation planning across data, API, integration, and UX layers to reach production-grade parity for each admin module.
