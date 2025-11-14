# Phase 2 Spec – Equipment Media & Maintenance Enhancements

_Date: 2025-11-11_

## Objectives
- Enrich equipment management with media gallery, detailed maintenance history, and telematics readiness.
- Support better operational insight (utilization, service status) and documentation.

## 1. Data Model & Migrations
- **Tables**:
  - `equipment_media` (id uuid, equipment_id, media_type image|video|document, storage_path, caption, metadata jsonb, uploaded_by, uploaded_at, is_primary boolean).
  - `maintenance_logs` (id uuid, equipment_id, maintenance_type routine|repair|inspection, performed_at, technician, notes, cost numeric, duration_hours numeric, status pending|completed, next_due_at, documents jsonb array, created_by, created_at).
  - `telematics_snapshots` (id uuid, equipment_id, captured_at, latitude, longitude, engine_hours numeric, battery_level numeric, source, raw_payload jsonb).
  - `maintenance_parts` (id uuid, log_id, part_name, quantity, cost_per_unit, supplier).
  - `maintenance_alerts` (id uuid, equipment_id, alert_type hours_based|calendar_based|fault_code, threshold_value, triggered_at, resolved_at, resolved_by).
- **Column Additions** to `equipment`:
  - `primary_media_id` (FK to `equipment_media`).
  - `total_engine_hours` (numeric).
  - `telematics_provider` (text), `telematics_device_id`.
  - `maintenance_status` (enum: normal|due|overdue|out_of_service).
- **Indexes**:
  - `equipment_media`: `(equipment_id, media_type)`, `(is_primary)`.
  - `maintenance_logs`: `(equipment_id, performed_at DESC)`, `(status, next_due_at)`.
  - `telematics_snapshots`: `(equipment_id, captured_at DESC)`.
  - `maintenance_alerts`: `(equipment_id, alert_type, triggered_at)`.

## 2. API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/equipment/{id}/media` | GET/POST/DELETE | Manage media entries (upload via signed URL). |
| `/api/admin/equipment/{id}/maintenance` | GET/POST | List maintenance logs, create new entry with parts & attachments. |
| `/api/admin/maintenance/logs/{id}` | PATCH/DELETE | Update status, cost, next due; soft delete. |
| `/api/admin/maintenance/alerts` | GET/POST/PATCH | Configure and manage maintenance alerts. |
| `/api/admin/telematics/snapshots` | POST | Ingest telematics data (webhook-style) – placeholder until provider integration. |
| `/api/admin/equipment/{id}/telematics` | GET | Fetch latest telematics snapshot for equipment. |

### Validation & Security
- Use Zod schemas for media upload metadata, maintenance log payloads, telematics snapshots (optional keys depending on provider).
- Enforce admin role and audit log for maintenance updates.
- Media upload uses Supabase Storage signed URLs (`equipment-media` bucket) with server-side generation.

## 3. Media Management
- Upload flow: request POST -> API returns signed URL + metadata -> client uploads file -> confirm via API to create `equipment_media` row.
- Allow marking a primary photo; ensure only one `is_primary` per equipment (enforced via trigger).
- Support categorization (photos vs manuals vs compliance docs) via `media_type` + metadata.
- Integrate preview component with lightbox/gallery view on equipment detail page.
- Add bulk upload support (drag/drop) with progress indicators.

## 4. Maintenance History
- New maintenance timeline showing past service events with cost, notes, attachments.
- Create maintenance log via modal capturing type, date, technician, parts used, cost breakdown.
- Attach documents/photos by linking `documents` table or storage paths.
- Show next due maintenance (based on `next_due_at` or engine hours threshold) with alert badges.
- Support exporting maintenance history to CSV/PDF.

## 5. Telematics Placeholder
- Accept ingestion via REST endpoint (for later integration with third-party telematics provider).
- Store snapshots for map display and utilization calculations.
- Provide simulated data generator (for dev/staging) to populate snapshots.
- Frontend map view (Phase 2 operations) uses `telematics_snapshots` for last known location.

## 6. UI Enhancements
- **Equipment List**: Add badges for maintenance status (due/overdue), last service date, location (from telematics).
- **Detail Drawer / Modal**:
  - Tabs: Overview, Media, Maintenance, Telematics.
  - Media tab: gallery grid, upload button, delete/primary controls.
  - Maintenance tab: timeline, add log button, filter by type.
  - Telematics tab: map with breadcrumb trail, engine hours chart.
- **Maintenance Dashboard**: summary cards (overdue count, upcoming service, total cost MTD), filterable list.

## 7. Automation & Alerts
- Cron job to evaluate maintenance alerts daily (and after telematics ingestion) – writes to `maintenance_alerts`, queues notifications.
- Integration with dashboard alerts (Phase 2) to surface overdue maintenance.
- Optional auto-generation of maintenance logs from telematics fault codes (placeholder for future work).

## 8. Testing Plan
- Unit tests: primary media trigger, maintenance alert threshold logic, telematics payload validation.
- Integration tests: media upload flow (signed URL handshake), maintenance log creation with parts, telematics snapshot ingestion.
- E2E: upload multiple media, create maintenance log, view timeline, update alert settings.
- Mock storage interactions using Supabase storage client in test mode.

## 9. Dependencies & Risks
- Supabase Storage bucket `equipment-media` must be configured with appropriate RLS (authenticated admins only).
- Need to ensure large file uploads don’t exceed limits; consider chunking/resumable for videos.
- Telematics API integration dependent on external provider (placeholder ensures future compatibility).
- Maintenance alerts must coordinate with scheduling/notifications, avoid duplicate reminders.

## 10. Implementation Checklist
1. Draft migrations for new tables/columns/indexes + RLS policies.
2. Configure Supabase Storage bucket & policies for equipment media.
3. Implement media upload/download API endpoints with auditing.
4. Build maintenance log APIs and UI components.
5. Implement telematics ingestion placeholder and map UI.
6. Create alert evaluation job + integration with dashboard alerts.
7. Write tests and update documentation (maintenance guide, media handling policy).

---
Prepared by: GPT-5 Codex.
