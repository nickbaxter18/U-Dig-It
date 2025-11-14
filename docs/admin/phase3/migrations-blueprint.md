# Phase 3 Blueprint – Supabase Migrations & Policies

_Date: 2025-11-11_

## Objectives
- Consolidate all schema changes required for Phase 2 features (dashboard, bookings, payments, support, promotions, security).
- Define migration order, dependencies, RLS policies, and rollback strategy.

## 1. Migration Structure
Use numbered migration files (e.g., `20251111_phase3_*`). Group related changes:
1. Dashboard & Analytics
2. Bookings & Logistics
3. Equipment & Maintenance
4. Customers & Communications
5. Payments & Finance
6. Support & Insurance
7. Promotions & Contracts
8. Audit & Security

Each migration includes SQL script plus policy additions. For complex changes, create helper functions/triggers in separate scripts.

## 2. Table & Column Definitions
### Dashboard & Analytics
- Create `alerts`, `dashboard_saved_filters`, `dashboard_exports`.
- Materialized views: `mv_dashboard_kpis`, `mv_revenue_trends`, `mv_booking_trends`, `mv_equipment_utilization`, `mv_alert_candidates`.
- Indexes: ensure unique on saved filters `(admin_id, name)`, concurrency indexes for materialized views.
- Policies: admin read/write; read-only for service role (Edge functions).

### Bookings & Logistics
- Tables: `booking_wizard_sessions`, `booking_conflicts`, `booking_notes`, `logistics_tasks`, `pickup_checklists`, `booking_bulk_operations`.
- Columns: extend `bookings` (pricing_breakdown, deposit/balance fields), `delivery_assignments` (task_id, route_url, eta), `payments` (payout_id).
- Indexes: status/date combos for logistics tasks, booking notes.
- Policies: ensure admin access; wizard sessions limited to creator; enforce row-level security before enabling updates.

### Equipment & Maintenance
- Tables: `equipment_media`, `maintenance_logs`, `maintenance_parts`, `telematics_snapshots`, `maintenance_alerts`.
- Columns: `equipment` new fields (primary_media_id, total_engine_hours, telematics info, maintenance_status).
- Storage: configure Supabase bucket `equipment-media` (via CLI or manual) and set policies.
- Indexes: `(equipment_id, performed_at)` for maintenance logs.
- Policies: admin read/write; internal service role for telematics ingestion.

### Customers & Communications
- Tables: `customer_tags`, `customer_tag_members`, `customer_notes`, `customer_timeline_events`, `customer_consent`, `campaign_audiences` (if not existing).
- Columns: `users` (risk_score, lifetime_value, preferred_contact_method, account_manager_id).
- Indexes: timeline `(customer_id, occurred_at)`, tags.
- Policies: admin read/write; timeline accessible only to admins; ensure `customer_consent` accessible for message sending with RLS enforcing admin roles.

### Payments & Finance
- Tables: `manual_payments`, `installment_schedules`, `payout_reconciliations`, `financial_exports`, `financial_ledger`.
- Columns: `bookings` (billing_status etc.), `payments` (manual_source).
- Indexes: ledger per booking, installment due date.
- Policies: finance/admin roles; ledger read-only for other admins; manual payments limited to creators.

### Support & Insurance
- Tables: `support_messages`, `support_sla`, `support_message_recipients`, `support_templates`, `insurance_activity`, `insurance_reminders`.
- Columns: `support_tickets` (sla fields), `insurance_documents` (requested_info etc.).
- Indexes: `support_messages(ticket_id, created_at)`, `insurance_activity(insurance_document_id, created_at)`.
- Policies: admin read/write; ensure customer data separated (no public access).

### Promotions & Contracts
- Tables: `promo_rules`, `promo_rule_conditions`, `promo_rule_actions`, `promo_rule_segments`, `promo_redemptions`, `promo_analytics_daily` (table or view).
- Contracts: `contract_template_versions`, `contract_events`, `contract_signers`, `contract_reminders` plus columns on `contract_templates` and `contracts`.
- Indexes: promotion rules by status/time; contract events `(contract_id, occurred_at)`.
- Policies: admin/marketing roles; promotions read for pricing service; contract tables admin-only.

### Audit & Security
- Tables: `audit_events`, `audit_event_tags`, `security_incidents`, `admin_invites`, `admin_sessions`, `secret_store`, `settings_change_requests`.
- Columns: `system_settings` (requires_approval, validation_endpoint), `users` (2FA fields).
- Indexes: audit events (GIN on metadata), secret store unique keys.
- Policies: strict admin-only; `secret_store` accessible only by secure service role (Edge function) and super admins.

## 3. RLS Policy Patterns
Use shared SQL functions/policies:
- `policy_admin_read_write(table)` granting admin & super_admin full access.
- `policy_role_based(table, allowed_roles)` for specialized roles (marketing, finance, security).
- For service role operations (Edge functions), rely on service key bypass.
- Ensure new tables default to `ENABLE ROW LEVEL SECURITY` with explicit policies.

## 4. Materialized View Refresh
- After creation, run `REFRESH MATERIALIZED VIEW` once.
- Add unique indexes required for concurrent refresh.
- Document dependencies: ensure base tables exist before view creation; `DROP`/`CREATE` pattern in migration.

## 5. Migration Sequencing
1. Schema additions (tables/columns).
2. Index creation.
3. RLS policies (only after tables exist).
4. Data migrations (populate default values, seed segments/tags if needed).
5. Materialized views.
6. Storage bucket setup (manual step or script). Document in deployment guide.

## 6. Rollback Strategy
- For each migration, provide `DROP TABLE IF EXISTS` or reverse operations.
- Be cautious with data-destructive operations; mark migrations irreversible if necessary and note in changelog.
- Snapshot schema before migration (using Supabase CLI) for backup.

## 7. Testing Migrations
- Use Supabase branch for staging; run migrations via `supabase db push`.
- Create automated tests verifying table existence, RLS policy behavior (with supabase-js test client).
- Ensure migrations idempotent and handle existing data gracefully (default values, backfill scripts).

## 8. Documentation
- Update `docs/admin/schema-audit.md` after implementation.
- Maintain migration index file summarizing each migration file and purpose.
- Provide runbook for operations team on applying migrations and verifying success.

---
Prepared by: GPT-5 Codex.
