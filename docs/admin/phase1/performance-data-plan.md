# Performance & Data Refresh Design (Phase 1)

_Date: 2025-11-11_

## Goals
- Provide low-latency data for admin dashboards, analytics charts, and alerts.
- Reduce heavy live queries against transactional tables (`bookings`, `payments`, `equipment_utilization`).
- Establish deterministic refresh strategy (cron/Edge Functions) with audit logging.

## 1. Materialized View Portfolio

| View | Purpose | Source Tables | Key Columns | Indexing |
|------|---------|---------------|-------------|----------|
| `mv_dashboard_kpis` | Aggregate daily metrics (bookings, revenue, utilization, active customers, outstanding balances) with growth deltas and alert flags. | `bookings`, `payments`, `equipment_utilization`, `payment_schedules`, `insurance_documents` | `snapshot_date`, metrics JSON, `alerts` jsonb | PK on `snapshot_date`; GIN on `alerts` |
| `mv_revenue_trends` | Time-series revenue, deposits vs. balance, refunds. | `payments`, `booking_payments`, `payment_schedules` | `bucket_date`, `gross_revenue`, `deposits`, `balance`, `refunds` | PK `(bucket_date)` |
| `mv_booking_trends` | Daily booking counts by status, cancellations, insurance state. | `bookings`, `insurance_documents` | `bucket_date`, `status_counts`, `insurance_pending` | PK `(bucket_date)` |
| `mv_equipment_utilization` | Utilization %, revenue, maintenance indicators per equipment per period. | `equipment_utilization`, `bookings`, `equipment_maintenance` | `snapshot_date`, `equipment_id`, `utilization_pct`, `rented_days`, `maintenance_due`, `revenue` | PK `(snapshot_date, equipment_id)`; index `(equipment_id)` |
| `mv_customer_cohorts` | Customer cohort metrics (new vs returning, retention). | `users`, `bookings`, `payments`, `customer_segments` | `cohort_month`, `new_customers`, `returning_customers`, `retention_rate`, `avg_ltv` | PK `(cohort_month)` |
| `mv_support_sla` | SLA performance, open tickets by priority. | `support_tickets`, `notifications` | `bucket_date`, `priority_counts`, `sla_breaches` | PK `(bucket_date)` |
| `mv_financial_summary` | Finance KPIs (AR, payouts, manual vs. Stripe). | `payments`, `manual_payments`, `payout_reconciliations`, `financial_transactions` | `snapshot_date`, `stripe_collections`, `manual_collections`, `ar_balance`, `payouts_pending` | PK `(snapshot_date)` |
| `mv_alert_candidates` | Precomputed threshold breaches (low utilization, overdue insurance, SLA breaches). | Various transactional tables | `alert_type`, `entity_id`, `detected_at`, `severity`, `payload` | Index `(alert_type, severity)` |

### Notes
- Use JSONB for metric bundles where schema may evolve (ensure consumer-side typing via Zod).
- Views should avoid joining large tables without filters; compute in stages if necessary (CTEs per metric).
- Leverage existing analytics tables (`analytics_data`, `equipment_utilization`) when performant.

## 2. Refresh Strategy

### Frequency
| View | Refresh Interval | Rationale |
|------|------------------|-----------|
| `mv_dashboard_kpis` | Every 15 minutes during business hours (06:00–22:00 local); hourly otherwise. | Keeps KPIs near real-time without constant heavy queries. |
| `mv_revenue_trends`, `mv_booking_trends` | Hourly | Trend charts tolerate slight delay; hourly satisfies reporting. |
| `mv_equipment_utilization` | Hourly + on-demand when booking status changes (triggered job). | Supports ops view and alerts. |
| `mv_customer_cohorts` | Nightly (02:00 local) | Cohort metrics change minimally intra-day. |
| `mv_support_sla` | Every 5 minutes | SLA monitoring requires timely data. |
| `mv_financial_summary` | Hourly + run immediately after Stripe payout webhook events. | Syncs with finance operations. |
| `mv_alert_candidates` | Every 5 minutes + triggered by relevant events (support, insurance, equipment). | Enables near-real-time alerting. |

### Execution Mechanism
- Supabase Edge Function `refresh_materialized_views(id text)` orchestrating `REFRESH MATERIALIZED VIEW CONCURRENTLY ...` per view.
- Schedule via Supabase Cron (or external scheduler) using prefixes:
  - `cron_dashboard_15min`, `cron_dashboard_hourly`, `cron_dashboard_nightly`.
- On-demand triggers:
  - Postgres triggers on `bookings`, `payments`, `support_tickets`, `insurance_documents` enqueue refresh jobs (write to `schedules` or custom `refresh_queue`).
  - Edge Function reads `refresh_queue`, deduplicates per view, executes with concurrency guard.
- Logging table `job_runs` capturing execution metadata (view, started_at, duration, success, error_message).

### Concurrency & Locking
- Use `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid blocking readers (requires unique index on materialized view).
- For heavy views (e.g., `mv_financial_summary`), consider incremental refresh pattern: partition by month using standard views + `ALTER MATERIALIZED VIEW ... NO SCHEMA BINDING`.
- Implement advisory lock (e.g., `pg_try_advisory_xact_lock`) in Edge Function to prevent overlapping refresh runs per view.

## 3. Dependencies & Prerequisites
- Ensure all materialized views have unique indexes as required for concurrent refresh.
- Confirm Supabase plan supports cron + Edge Functions at desired cadence.
- Add service role key to Edge Function environment for privileged access (RLS bypass).
- Validate that new tables (manual payments, recon, alerts) exist with data before hooking into views.

## 4. Alerting & Monitoring
- Edge Function logs to Supabase (or Sentry) with structured metadata.
- On repeated refresh failures (>3), insert incident into `alert_incidents` and notify engineering channel.
- Add Grafana/Metabase dashboards for view staleness (last_refreshed timestamp).

## 5. Next Steps
1. Draft SQL definitions for each materialized view (Phase 3 migrations).
2. Prototype Edge Function refresh logic with `job_runs` table.
3. Configure Supabase cron schedules (document values in infrastructure repo).
4. Update admin dashboard API contracts to source from these views.

---
Prepared by: GPT-5 Codex (Phase 1 Foundations).
