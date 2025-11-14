# Phase 2 Spec – Dashboard & Analytics Enhancements

_Date: 2025-11-11_

## Objectives
- Deliver production-grade admin dashboard with near real-time KPIs, alerting, exports, and saved filters.
- Provide performant data APIs backed by materialized views outlined in Phase 1.
- Replace placeholder websocket indicator with actual connection health checks.

## 1. Data Model & Migrations
- **Materialized Views** (from Phase 1):
  - `mv_dashboard_kpis`, `mv_revenue_trends`, `mv_booking_trends`, `mv_equipment_utilization`, `mv_alert_candidates`.
- **Tables**:
  - `alerts` (id uuid pk, type, severity, entity_type, entity_id, summary, details jsonb, detected_at, acknowledged_at, acknowledged_by, status).
  - `dashboard_saved_filters` (id uuid, admin_id, name, filter_payload jsonb, default boolean, created_at, updated_at).
  - `dashboard_exports` (id uuid, admin_id, export_type, parameters jsonb, file_path, status, created_at, completed_at).
- **Indexes**: ensure unique `(admin_id, name)` for saved filters; `alerts(status, detected_at)`; `dashboard_exports(admin_id, created_at)`.

## 2. API Endpoints
| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/api/admin/dashboard` | GET | Returns KPI bundle, trends, alerts summary, last refresh timestamps. | Sources from materialized views; query params `range`, `filters`. |
| `/api/admin/dashboard/alerts` | GET | Paginated list of alert entities with filtering (status, severity, type). | Supports `before`/`after` for infinite scroll. |
| `/api/admin/dashboard/alerts/{id}/ack` | POST | Acknowledge alert with optional note. | Logs to audit. |
| `/api/admin/dashboard/filters` | GET/POST/PATCH/DELETE | CRUD for saved filters per admin. | Validated via Zod schemas. |
| `/api/admin/dashboard/export` | POST | Queue export (CSV/PDF) for KPIs/trends; returns job id. | Triggers Edge Function to generate file, store signed URL. |
| `/api/admin/dashboard/export/{id}` | GET | Fetch export status + download URL. | Requires RLS check. |
| `/api/admin/dashboard/health` | GET | Returns realtime channel status (latency, last heartbeat). | Used by frontend indicator. |

### Validation & Security
- All endpoints require admin role (`requireAdmin`).
- Rate limiting per endpoint (`RateLimitPresets.STRICT`).
- Logging: structured logger with `component: 'dashboard-api'` and action per endpoint.
- Responses shaped `{ data, meta, error }`.

## 3. Background Jobs & Automation
- **Refresh Orchestrator**: Edge Function triggered via cron or on-demand (`refresh_materialized_views`).
- **Alert Generation Worker**: Edge Function evaluating `mv_alert_candidates`, inserting into `alerts`, emitting notifications.
- **Export Worker**: Edge Function converts metrics to CSV/PDF using `dashboard_exports` queue (render via React PDF or templating library).
- **Health Monitor**: Worker pinging Supabase Realtime service, storing metrics for `/health` endpoint.

## 4. Frontend Updates
### Layout & UI
- Extend existing dashboard page to consume new API responses.
- Components:
  - `DashboardKpiGrid` – consumes KPI payload; handles positive/negative growth visuals.
  - `AlertBannerList` – sticky top area for critical alerts with ack buttons.
  - `SavedFilterSelector` – dropdown + manage modal (create/update/delete).
  - `ExportDropdown` – choose CSV/PDF/full report; shows progress via `dashboard_exports` polling.
  - `TimelineCharts` – leverage new trends data; support tooltips, zoom.
  - `RealtimeStatusIndicator` – reads `/health`, displays connection quality (green/yellow/red).
- Accessibility: ensure ARIA labels for alerts and status indicator; keyboard navigation for filter management.

### State Management
- Use React Query to fetch `/api/admin/dashboard` with caching keyed by filter hash.
- Background refetch interval (60s), manual refresh button triggers `invalidateQueries`.
- Websocket channel subscribes to `alerts` table changes; merges optimistic ack updates.

## 5. Alerting Logic
- Alert types: `low_utilization`, `overdue_insurance`, `sla_breach`, `payout_delay`, `booking_conflict`, `payment_failure_spike`.
- Severity mapping and UI color coding defined in design tokens.
- Acknowledgement flow updates `alerts.status` and logs to `audit_logs`.
- Optionally email/push notifications via notification service for high severity (Phase 3 automation ties in).

## 6. Export Functionality
- Export options: `kpi_snapshot.csv`, `kpi_snapshot.pdf`, `alert_report.csv`.
- Parameter payload includes filter range, segments, admin id.
- Exports stored in Supabase Storage (`admin_exports` bucket) with signed URLs (1 hour expiration).
- UI shows toast when export ready (listening to `dashboard_exports` status change via API polling or Supabase channel).

## 7. Analytics & Telemetry
- Log dashboard load metrics (time to data, API response time) via existing monitoring tools.
- Report front-end analytics events for filter changes, export usage.
- Monitor view staleness (last refresh timestamps) and surface warnings when stale > threshold.

## 8. Testing Plan
- Unit tests for alert severity mapping, filter serialization, export parameter builder.
- Integration tests for `/api/admin/dashboard` with seeded data (verify metrics, RLS).
- Playwright scenarios: loads dashboard, acknowledges alert, saves filter, triggers export.
- Performance tests on `/api/admin/dashboard` to ensure p95 < 300ms.

## 9. Dependencies & Risks
- Requires completion of Phase 1 materialized view setup and refresh jobs.
- Export generation may exceed Edge Function limits; consider background queue (or Vercel serverless) with streaming PDF generation.
- Realtime channel reliability: ensure fallback polling if WebSocket down.

## 10. Implementation Checklist
1. Create migrations for `alerts`, `dashboard_saved_filters`, `dashboard_exports` + indexes and policies.
2. Implement materialized view SQL scripts.
3. Build Edge Functions for refresh, alert generator, export worker.
4. Implement API routes with validation and tests.
5. Update frontend components + hooks.
6. Write unit/integration/E2E tests per plan.
7. Update documentation (admin user guide, runbooks) and changelog.

---
Prepared by: GPT-5 Codex.
