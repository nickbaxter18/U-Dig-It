# Phase 2 Spec – Customer Segments, Timeline & Communications

_Date: 2025-11-11_

## Objectives
- Deliver CRM-style insights: timeline of customer interactions, tagging/segmentation, and messaging workflows.
- Enable targeted campaigns and bulk messaging from admin dashboard.

## 1. Data Model & Migrations
- **Tables**:
  - `customer_tags` (id uuid, name unique, color, description, created_by, created_at).
  - `customer_tag_members` (customer_id uuid, tag_id uuid, assigned_by, assigned_at) with composite PK.
  - `customer_notes` (id uuid, customer_id, admin_id, note, type info|warning|action, visibility internal|shared, created_at).
  - `customer_timeline_events` (id uuid, customer_id, event_type booking|payment|support|note|campaign|logistics|promotion, reference_id, occurred_at, metadata jsonb, created_at).
  - `customer_consent` (customer_id, channel email|sms|push, enabled boolean, granted_at, revoked_at, source).
  - `campaign_audiences` (campaign_id, segment_snapshot jsonb, generated_at, count).
- **Column Additions**:
  - `users` table: add `risk_score`, `lifetime_value`, `preferred_contact_method`, `account_manager_id`.
- **Indexes**:
  - `customer_tag_members`: `(customer_id)`, `(tag_id)`.
  - `customer_notes`: `(customer_id, created_at DESC)`.
  - `customer_timeline_events`: `(customer_id, occurred_at DESC)`; partial indexes per event_type if needed.
  - `customer_consent`: `(customer_id, channel)` (unique).

## 2. API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/customers/{id}/timeline` | GET | Fetch paginated timeline events with filters (event types, date range). |
| `/api/admin/customers/{id}/notes` | GET/POST | Manage internal notes (with tagging/visibility). |
| `/api/admin/customers/{id}/tags` | GET/POST/DELETE | Assign/remove tags. |
| `/api/admin/customer-tags` | GET/POST/PATCH/DELETE | CRUD tag definitions. |
| `/api/admin/customers/{id}/consent` | GET/PATCH | View/update communication consents. |
| `/api/admin/customers/segments` | GET/POST/DELETE | Manage saved segments (filter definitions). |
| `/api/admin/customers/segments/evaluate` | POST | Preview segment members (paged). |
| `/api/admin/communications/audience` | POST | Generate segment snapshot for campaign (writes `campaign_audiences`). |
| `/api/admin/communications/bulk-message` | POST | Queue bulk email/SMS/push based on segment or ad-hoc filter. |

### Validation & Security
- Admin-only endpoints; additional permission checks for messaging (e.g., require `communications` role).
- Respect `customer_consent` when sending messages.
- Audit logging for tag/segment modifications, messaging campaigns.

## 3. Segment Builder
- Filter options: location, booking count, equipment categories, last booking date, spend, tags, risk score, campaign engagement.
- UI: multi-step modal with condition builder (AND/OR), preview table, save option with description.
- Saved segments stored as JSON filter structure (DSL) in `customer_segments` (existing table). Ensure migrations align with new DSL schema.
- Evaluate endpoint executes DSL -> SQL translation safely (use parameterized queries).

## 4. Customer Timeline
- Aggregate events from:
  - Bookings (`bookings`, `logistics_tasks`).
  - Payments (`payments`, `manual_payments`).
  - Support (`support_tickets`, `support_messages`).
  - Insurance (`insurance_documents`).
  - Communications (`email_logs`, new bulk messages).
  - Notes (`customer_notes`).
- Precompute events via triggers or scheduled job that writes to `customer_timeline_events` for performance.
- UI timeline: date grouping, icons per event type, quick filter toggles.
- Provide export to CSV for audit/compliance.

## 5. Messaging Workflows
- Bulk message creation: choose segment or manual selection; compose message with templates (email/SMS); schedule send.
- Integrate with existing communications module routing (`/admin/communications/...`).
- Respect unsubscribes/consent (filter out via `customer_consent` + SendGrid suppression list).
- Logging: record message events in `customer_timeline_events` and `email_logs` or SMS equivalent.
- Provide message preview, throttling (batch send), and analytics (open/click) via existing communications APIs.

## 6. Risk & Value Indicators
- Compute `risk_score` + `lifetime_value` via nightly job (Phase 3 analytics). Expose in UI with badges.
- Allow admin to override risk level; log change in timeline.
- Display upcoming expirations/overdue balances in summary header.

## 7. UI Enhancements
- **Customer List**: columns for tags, segments, risk score, consents; advanced filter panel.
- **Customer Detail Drawer**:
  - Summary header with risk, LTV, last booking, tags.
  - Tabs: Timeline, Notes, Segments, Communications.
  - Tag management UI (add/remove via search + color-coded chips).
  - Consent panel with toggles (requires double confirm for disabling contact).
- **Segment Manager**: list saved segments, usage metrics, last modified, ability to duplicate.

## 8. Automation
- Nightly task to recompute segments flagged for auto-refresh (stores snapshot count).
- Notification when customer hits certain thresholds (e.g., VIP LTV, churn risk) using `alerts` system.
- Sync opt-outs from SendGrid back to `customer_consent` via webhook/cron.

## 9. Testing Plan
- Unit tests: segment DSL parser, timeline event aggregator, consent enforcement.
- Integration tests: tag assignment, note creation, bulk message queueing (ensuring consents respected), segment evaluate endpoint.
- E2E: assign tags, view timeline, create segment, send bulk email, verify timeline entry.
- Mock SendGrid/Twilio via MSW; use local storage bucket for attachments if needed.

## 10. Dependencies & Risks
- Segment DSL must be secure (prevent SQL injection) – use parameter binding and whitelisted fields.
- Messaging volume may trigger rate limits; ensure queuing/backoff in notification service.
- Consent handling must be robust; fallback to manual review if ambiguous.
- Need to coordinate with analytics metrics (risk score computation) – placeholder values allowed initially.

## 11. Implementation Checklist
1. Create migrations for new tables, columns, indexes, and RLS policies.
2. Implement tag, note, timeline APIs with tests.
3. Update communications module to use new audience builder endpoints.
4. Build segment builder UI and customer detail enhancements.
5. Integrate consent checks in messaging pipeline.
6. Implement timeline aggregation job (initially via SQL view + cron).
7. Add tests and documentation (CRM guide, messaging SOP).

---
Prepared by: GPT-5 Codex.
