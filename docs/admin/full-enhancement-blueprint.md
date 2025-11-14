# Admin Dashboard Full Enhancement Blueprint

## Overview
This roadmap translates the high-level enhancement plan into actionable work packages spanning data, API, frontend, integrations, testing, security, and documentation. Each section enumerates required Supabase migrations, API contracts, UI/UX updates, automation, and quality gates.

---

## Phase 1 – Foundations & Infrastructure

### 1. Schema & RLS Audit
- Inventory existing tables, views, functions, and policies via Supabase MCP.
- Document foreign keys, indexes, and policy coverage in `docs/admin/schema-audit.md`.
- Identify new tables needed: `maintenance_logs`, `equipment_media`, `customer_segments`, `notification_queue`, `analytics_snapshots`, `contract_templates`, `promo_rules`, `audit_events`, `manual_payments`, `installment_schedules`, `delivery_assignments`, `support_messages`, `insurance_activity`.
- Define required index additions (e.g., `bookings(status, startDate)`, `payments(status, createdAt)`, `support_tickets(priority, status)`, `insurance_documents(expiresAt)`).

### 2. Performance Groundwork
- Design materialized views:
  - `mv_dashboard_kpis` (daily KPIs, deltas, alerts).
  - `mv_revenue_trends`, `mv_booking_trends`, `mv_equipment_utilization`.
  - `mv_customer_cohorts`, `mv_financial_summary`.
- Plan refresh strategy (cron Edge Function triggered hourly/daily).
- Ensure each view is backed by indexes on filter columns.

### 3. Integrations Inventory
- Stripe: capture required API keys, webhooks, event types (payment_intent, charge, payout, dispute, refund).
- SendGrid: templates, sender identities, suppression groups.
- DocuSign/Adobe Sign: envelope creation, webhook endpoints.
- Maps/Telematics: placeholder API keys, environment variable handling.
- Define secure storage strategy (server-only env, Supabase secrets, HashiCorp Vault placeholder).

### 4. Testing Strategy
- Establish testing matrix spreadsheet (unit, integration, E2E).
- Choose tools: Vitest for logic, Playwright for admin flows, Supertest for API routes.
- Configure CI pipeline to run tests + lint + typecheck on PR.

---

## Phase 2 – Core Feature Expansions

### Dashboard & Analytics
- **Data**: Populate materialized views, add `alerts` table for threshold breaches.
- **API**: Create `/api/admin/dashboard` (GET) returning KPIs, alerts, saved filters; `/api/admin/dashboard/alerts` for acknowledgements.
- **UI**: Add alert banners, export buttons (CSV/PDF), saved filter dropdown, sharing modal; replace fake websocket indicator with Supabase channel health.
- **Automation**: Alert generation cron (Edge Function) writing to `alerts`.
- **Quality**: Snapshot tests for chart data, Playwright scenario verifying export.

### Bookings & Operations
- **Data**: Tables `booking_conflicts`, `booking_notes`, link `delivery_assignments`, `pickup_checklists`.
- **API**: Wizard endpoints `/api/admin/bookings/create` (POST with zod validation), `/api/admin/bookings/bulk-update`, `/api/admin/logistics/assign-driver`.
- **UI**: Multi-step booking modal, bulk action toolbar, enhanced calendar/kanban view, conflict warnings.
- **Automation**: Reminder Edge Functions (deposit due, pickup/return, overdue) queued in `notification_queue`.
- **Quality**: Unit tests for availability/price calculations; E2E for create booking, assign driver, send reminder.

### Equipment & Maintenance
- **Data**: `equipment_media` (storage paths, captions), `maintenance_logs` (work orders, cost, technician, status), `telematics_snapshot` (future integration).
- **API**: Upload endpoints using signed URLs, maintenance CRUD, telematics ingestion stub.
- **UI**: Media gallery, maintenance timeline, utilization insights, CSV import wizard.
- **Automation**: Maintenance reminder job (Edge Function scanning `next_maintenance_due`).
- **Quality**: Integration tests for maintenance CRUD, file upload handling; accessibility review for gallery.

### Customers & Communications
- **Data**: `customer_segments`, `customer_notes`, `customer_risk_scores`, `contact_preferences`.
- **API**: Segment builder endpoints, timeline aggregation, bulk messaging queue writer.
- **UI**: Timeline tab, tags/segments chips, new messaging modal with preview.
- **Automation**: Synchronize SendGrid suppression list nightly; risk scoring job.
- **Quality**: Tests verifying segment filters, timeline pagination, consent handling.

### Payments & Finance
- **Data**: `manual_payments`, `installment_schedules`, `payout_reconciliations`, `financial_exports`.
- **API**: Manual payment entry, installment schedule generator, payout reconciliation importer (Stripe API), finance export generator.
- **UI**: Deposit/balance indicators on bookings, installments tab, reconciliation dashboard.
- **Automation**: Stripe webhook expansion, daily payout reconciliation job.
- **Quality**: Unit tests for payment allocation, Playwright refund + manual payment flows.

### Support & Insurance
- **Data**: `support_messages`, `support_sla`, `insurance_activity`, `insurance_reminders`.
- **API**: Conversation endpoints (send message, upload attachment), SLA metrics endpoint, insurance reminder scheduler.
- **UI**: Threaded view, reply composer with templates, SLA badges, insurance audit trail panel.
- **Automation**: SLA breach alerts, insurance expiry notifications.
- **Quality**: Tests for message sending, SLA calculations, reminder pipelines.

### Promotions & Contracts
- **Data**: `promo_rules`, `promo_segments`, `contract_templates`, `contract_events`.
- **API**: Promotion targeting evaluator, scheduling jobs, contract template CRUD, e-sign webhook handler.
- **UI**: Rule builder (conditions/actions), schedule calendar, template editor with preview, contract status badges/reminders.
- **Automation**: Promotion activation/deactivation job, DocuSign status polling fallback.
- **Quality**: Unit tests for rule evaluation, contract lifecycle E2E.

### Audit & Settings
- **Data**: `audit_events` (expanded schema), `admin_invites`, `ip_allow_list`, `security_settings`.
- **API**: Real-time audit streaming (Supabase channel), admin invite lifecycle, 2FA management, IP allow list CRUD.
- **UI**: Live audit feed, risk-level filters, security center dashboard, secrets management forms (server-only operations).
- **Automation**: High-severity alerts to notification queue, session cleanup job.
- **Quality**: Tests for audit logging coverage, security settings update flows.

---

## Phase 3 – API & Data Modeling Execution

1. **Migrations Blueprint**
   - Draft SQL migrations for each new table/index/view with triggers for `updated_at`.
   - Define RLS policies for new tables (ownership, admin roles, read-only service roles).
   - Prepare rollback scripts and seed data for testing.

2. **API Contracts**
   - Document request/response schemas in `docs/admin/api-contracts.md` with zod definitions.
   - Ensure standardized response format `{ data, error, meta }` and structured logging (component/action/metadata).
   - Integrate rate limiting middleware (e.g., Upstash Redis, edge-based).

3. **Notification Services**
   - Build service module supporting email (SendGrid), SMS (Twilio placeholder), push (FCM placeholder).
   - Queue notifications in `notification_queue` with worker Edge Function for dispatch + retry/backoff.

4. **Background Jobs & Edge Functions**
   - Jobs: analytics snapshot refresh, booking reminders, insurance expiry, SLA alerts, Stripe payout reconciliation.
   - Implement guardrails (idempotency keys, logging to `job_runs`, alert on failure).

---

## Phase 4 – Frontend Architecture & UX

1. **Component Library Enhancements**
   - Create reusable components: `AlertBanner`, `ExportDropdown`, `Timeline`, `MediaGallery`, `SegmentBuilder`, `KanbanBoard`, `RouteMap`, `InstallmentSchedule`, `SLAIndicator`.
   - Adopt React Query for data fetching/caching; configure Supabase real-time hooks per module.

2. **Accessibility & Design System**
   - Update design tokens for alerts, badges, and status colors; ensure WCAG AA contrast.
   - Add keyboard navigation and screen reader labels to new components.
   - Document component usage in `docs/design/admin-components.md`.

3. **State Management & Performance**
   - Introduce optimistic updates for critical interactions (status changes, tagging).
   - Implement pagination/infinite scrolling for high-volume tables.
   - Use Suspense-aware loading states and skeletons.

4. **Mapping & Telematics Integration**
   - Abstract map provider (Google Maps default with extension to Mapbox).
   - Provide environment-driven toggles for telematics integration.

---

## Phase 5 – Testing, Security, Deployment, Documentation

1. **Testing Plan**
   - Unit tests for pricing engine, conflict detection, alert generation, promotions rule evaluation.
   - Integration tests for API routes (auth + validation), background jobs, notification service.
   - Playwright suites: booking wizard, driver assignment, maintenance update, contract send/sign, promotion rule creation, security settings update.
   - Performance tests (Artillery) for analytics endpoints.

2. **Security Hardening**
   - Enforce admin 2FA, password rotation, IP allow-list enforcement middleware.
   - Move secrets to server environment (no client exposure), add validation/test buttons with server proxy.
   - Expand audit logging coverage (settings changes, manual payments, promotion edits) with severity levels.

3. **Deployment Readiness**
   - Provision staging Supabase branch, run migrations, populate seed data.
   - Implement feature flagging for gradual rollout.
   - Set up monitoring dashboards (Supabase logs, Stripe alerts, Sentry performance) and pager escalation.

4. **Documentation & Training**
   - Update admin user guide per module, create quick start videos, produce API reference.
   - Maintain changelog entries per feature release.
   - Draft migration playbooks, rollback procedures, and support runbooks.

---

## Execution Timeline (Indicative)
- **Sprint 1–2**: Foundations audit, schema blueprint, jobs design, testing setup.
- **Sprint 3–4**: Dashboard/analytics, bookings/logistics enhancements, notifications scaffold.
- **Sprint 5–6**: Equipment, customers, payments modules; Stripe and SendGrid integrations.
- **Sprint 7–8**: Support, insurance, promotions, contracts improvements; background jobs.
- **Sprint 9–10**: Audit/security center, settings upgrades, telematics integration prep.
- **Sprint 11**: Comprehensive testing, performance tuning, documentation, release readiness.

Adjust sequencing based on stakeholder priorities and integration dependencies.
