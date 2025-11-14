# Supabase Schema & RLS Audit (Phase 1)

_Date: 2025-11-11_

## 1. Table Inventory (public schema)
Derived from `information_schema.tables`:
- Core domain tables: `bookings`, `booking_payments`, `payments`, `payment_schedules`, `equipment`, `equipment_maintenance`, `equipment_utilization`, `insurance_documents`, `support_tickets`, `drivers`, `delivery_assignments`, `discount_codes`, `contracts`, `contract_templates`, `users`, `notifications`, `system_settings`.
- Analytics/monitoring tables: `analytics_data`, `api_analytics`, `customer_behavior_analytics`, `equipment_utilization`, `feature_usage_analytics`, `system_metrics`, `database_performance_metrics`.
- Promotional/contest artefacts: `email_campaigns`, `email_templates`, `customer_segments`, `promo`-like structures (`dynamic_pricing_rules`, `seasonal_pricing`, `discount_codes`).
- Compliance & documentation: `documents`, `document_relations`, `operator_certifications`, `damage_reports`, `insurance_documents`.
- Job/automation scaffolding already present: `backup_jobs`, `schedules`, `workflow_templates`, `notifications`.

**Observations**
- Many auxiliary tables exist (contests, predictive models) not currently surfaced in admin UI.
- Planned Phase 2/3 features will likely require new tables (e.g., `maintenance_logs`, `customer_tags`, `manual_payments`, `alert_events`).

## 2. RLS Coverage Snapshot
Query: `select tablename, count(*) as policy_count from pg_policies where schemaname='public'`.

- High policy coverage (≥1) on all relevant domain tables (`bookings` 5, `payments` 6, `contracts` 5, `insurance_documents` 6, `users` 6, etc.).
- Most analytics/system tables also RLS-protected (single policy), but access semantics need verification (likely `authenticated` read, admin full access).
- Some support/ops tables have minimal policies (`support_tickets` 1). Need review to ensure admin vs. customer separation, especially when adding new columns.
- Future tables must inherit consistent policy patterns (owner read/write, admin elevated access, service-role full control).

## 3. Index Review Highlights
Using `pg_indexes`:

### Bookings & Payments
- `bookings`: multiple indexes on status, customer, equipment, start/end dates, Stripe session, completion email. Covers core query patterns.
- `booking_payments`: indexes on booking_id and idempotency key.
- `payments`: indexes on booking_id, status, stripe checkout session.
- `payment_schedules`: indexes on booking, due_date, payment_id, status.

**Gaps / upcoming needs**:
- No composite index for `(status, startDate)`; `idx_bookings_equipment_dates_status` likely covers status+equipment. When adding booking wizard filters (by location, logistics), consider additional indexes.
- Manual payment tables (to be created) will require indexes on booking_id, created_at, source.

### Equipment & Maintenance
- `equipment`: indexes on category, location, serial uniqueness (`UQ_*`).
- `equipment_maintenance`: indexes on equipment_id and status.
- `equipment_utilization`: unique `(equipment_id, date)` index and booking linkage.

**Needs**:
- Maintenance logs table should include composite index `(equipment_id, performed_at)`.
- Media table will require indexes on equipment_id and type.

### Support & Insurance
- `support_tickets`: indexes on ticket_number, assigned_to, booking_id, customer_id, equipment_id.
- `insurance_documents`: indexes on booking_id, status, plus `(id?)` unique.

**Needs**:
- Add index on `insurance_documents.expiresAt` (currently missing) to support expiry reminders.
- Support message thread table (to be created) should index `(ticket_id, created_at)`.

### Promotions & Communications
- `discount_codes`: unique code index; `email_campaigns`, `email_logs`, `email_templates` have necessary indexes for scheduling and analytics.
- For targeted promotions, new rule tables will need indexes on `segment_id`, `equipment_category`, `effective_range`.

### System & Audit
- `audit_logs`: multiple indexes (action, created_at, table_action, table_name, user_id).
- `notifications`: indexes on user, status, category, read flag.
- `system_settings`: indexes on category, updated_at, updated_by, unique category.

**Needs**:
- Future `audit_events` expansion should maintain indexes on severity, session_id, resource.
- `notifications` may require composite `(user_id, status, category)` when queue volume increases.

## 4. RLS & Security Considerations
- Confirm `enable row level security` is active on new tables post-migration; replicate admin role check pattern (usually `role in ('admin','super_admin')`).
- Evaluate existing policies for analytics tables to ensure admin-only access where required (customer analytics likely sensitive).
- Ensure service role (Edge functions) uses privileged key to bypass RLS where necessary (materialized view refresh, background jobs).

## 5. Identified Schema Gaps for Roadmap
| Capability | Required Additions |
|------------|--------------------|
| Dashboard Alerts | `alerts`, `alert_incidents` already exist; need to confirm usage & extend columns (severity, acknowledged_by). |
| Booking Wizard & Logistics | Confirm columns on `bookings` for price breakdown; add `booking_conflicts`, `booking_notes`, extend `delivery_assignments` (route_url, eta). |
| Maintenance History | Likely need dedicated `maintenance_logs` table (current `equipment_maintenance` may store schedules but not history). |
| Media Management | Add `equipment_media` referencing Supabase storage (path, type, metadata). |
| Customer Segments & Tags | `customer_segments` table exists; need join table `customer_segment_members`. Also add `customer_notes`. |
| Manual Payments & Installments | `payment_schedules` present; need `manual_payments`, `installment_schedules` with audit columns. |
| Support Messaging | No `support_messages` table currently; required for threaded conversations. |
| Insurance Audit Trail | Add `insurance_activity` to log approvals/rejections and notifications. |
| Promotions Rule Engine | Need `promo_rules`, `promo_rule_conditions`, `promo_rule_segments`. |
| Contracts Template Management | `contract_templates` exists; confirm schema supports versioning & placeholders. |
| Notification Queue | `notifications` table exists for user-facing alerts; consider separate `notification_queue` for async processing. |

## 6. Next Actions
1. Export detailed definitions for critical tables (`bookings`, `payments`, `support_tickets`, `insurance_documents`, `system_settings`) for documentation appendix.
2. Draft SQL migrations for identified gap tables and indexes (Phase 3).
3. Review existing RLS policy definitions (saved in `agent-tools/a93b9cda-...`) to ensure admin allowances ahead of feature work.
4. Coordinate with infrastructure to confirm Supabase branch strategy for migrations.

---
Prepared by: GPT-5 Codex (Phase 1 Foundations).
