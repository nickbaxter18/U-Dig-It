# Phase 2 Spec – Bookings & Operations Enhancements

_Date: 2025-11-11_

## Objectives
- Provide admin-side booking creation/edit workflow with availability, pricing, and deposit management.
- Enable bulk operations on bookings for faster workflows.
- Integrate logistics (delivery/pickup) with driver assignments, route planning, and reminders.

## 1. Data Model & Migrations
- **Tables**:
  - `booking_wizard_sessions` (id uuid, admin_id, payload jsonb, status, created_at, expires_at) for in-progress wizard state.
  - `booking_conflicts` (id uuid, booking_id, conflicting_booking_id, conflict_type, detected_at).
  - `booking_notes` (id uuid, booking_id, admin_id, note, visibility, created_at).
  - `logistics_tasks` (id uuid, booking_id, task_type delivery|pickup, scheduled_at, address, status, driver_id, route_url, eta, special_instructions, completed_at).
  - Extend `delivery_assignments`: add `task_id` FK, `route_url`, `eta_minutes`, `started_at`, `completed_at`, `signature_url`.
  - Extend `bookings`: add `pricing_breakdown jsonb`, `deposit_amount`, `balance_due`, `source` (web|admin), `last_modified_by`.
  - `pickup_checklists` (id uuid, booking_id, checklist jsonb, inspector_id, signed_at, photos jsonb array).
  - `booking_bulk_operations` (id uuid, admin_id, action, filter_payload jsonb, status, summary jsonb, created_at, completed_at).
- **Indexes**:
  - `booking_conflicts`: `(booking_id)`, `(conflict_type, detected_at)`.
  - `logistics_tasks`: `(task_type, scheduled_at)`, `(driver_id, status)`.
  - `booking_notes`: `(booking_id, created_at)`.
  - `booking_bulk_operations`: `(admin_id, created_at)`.

## 2. API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/bookings/wizard/start` | POST | Create wizard session with initial data (customer, equipment, dates). |
| `/api/admin/bookings/wizard/{id}` | PATCH/GET | Update or fetch wizard state (pricing, logistics selections). |
| `/api/admin/bookings/wizard/{id}/commit` | POST | Validate and create/modify booking, handling payments/deposits. |
| `/api/admin/bookings/conflicts` | POST | Check conflicts for given equipment/dates; returns conflict detail. |
| `/api/admin/bookings/bulk-actions` | POST | Submit bulk action (status update, export, email). |
| `/api/admin/bookings/bulk-actions/{id}` | GET | Retrieve bulk action status/result summary. |
| `/api/admin/bookings/{id}/notes` | GET/POST | Manage internal notes. |
| `/api/admin/logistics/tasks` | GET/POST | CRUD logistics tasks (delivery/pickup). |
| `/api/admin/logistics/tasks/{id}/status` | PATCH | Update task status (scheduled → en route → completed). |
| `/api/admin/logistics/assign-driver` | POST | Assign driver to task with route planning data. |
| `/api/admin/logistics/pickup-checklist` | POST | Submit pickup/return inspection data (photos + checklist). |

### Validation & Security
- All endpoints require `requireAdmin` check.
- Use shared Zod schemas for wizard payload, pricing breakdown, logistics tasks.
- Rate limit conflict checks & bulk actions to prevent abuse.
- Audit logging for wizard commit, bulk operations, logistics updates.

## 3. Booking Wizard Workflow
1. **Step 1 – Customer & Equipment**: Select existing customer or create new; choose equipment with search/filter.
2. **Step 2 – Dates & Availability**: View calendar, check conflicts via `/conflicts` endpoint (returns overlapping bookings, maintenance blocks).
3. **Step 3 – Pricing & Add-ons**: Display pricing breakdown (base, delivery, insurance, operator, discounts), allow adjustments. Persist to wizard session.
4. **Step 4 – Payment & Deposit**: Choose payment method (Stripe, manual), compute deposit vs balance; optionally capture payment intent.
5. **Step 5 – Logistics**: Configure delivery/pickup tasks, driver assignment placeholder, special instructions.
6. **Review & Confirm**: Summarize booking, conflicts, notes; commit to create/replace booking record. Optionally trigger emails and deposit collection.
- Wizard session expires after 30 minutes of inactivity.
- Support edit mode for existing bookings (preload data, track changes).

## 4. Bulk Operations
- Actions: status update (e.g., confirm, cancel), send email, export bookings, assign driver, mark deposit received.
- Selection: filter-based selection (status, date range, customer segment) with preview count.
- Execution: create `booking_bulk_operations` record, process asynchronously (Edge Function) to avoid blocking.
- Result: summary (success count, failures, error reason) accessible via GET endpoint; notify admin upon completion.

## 5. Logistics Integration
- `logistics_tasks` unify delivery/pickup tasks with states: `pending`, `scheduled`, `en_route`, `completed`, `cancelled`.
- Driver assignment updates both `logistics_tasks.driver_id` and `delivery_assignments` table (legacy). Prefer new `logistics_tasks`, maintain compatibility with existing UI.
- Route planning: integrate Google Maps Directions API – store `route_url`, `eta_minutes`.
- Notifications: queue reminders for upcoming tasks (Edge Function from Phase 1 refresh plan).
- Pickup checklist: store inspection data (structured JSON) and photos stored in Supabase Storage (`checklists/` bucket) with references in `pickup_checklists`.

## 6. UI Enhancements
- **Booking List**: Add bulk action toolbar, selection checkboxes (with virtualization for performance).
- **Wizard Modal**: Multi-step modal with progress indicator, validation summary, chat-style notes sidebar.
- **Logistics Dashboard**: Extend existing operations page to show `logistics_tasks`; include map view (via shared component).
- **Timeline**: In booking details modal, show timeline entries (notes, payments, logistics status changes).
- **Conflict Banner**: Display conflicts with quick navigation to conflicting booking.

## 7. Automation & Reminders
- Edge Function `process_booking_bulk_operation` consuming queue.
- Reminders:
  - Deposit due (3 days before start if balance outstanding).
  - Delivery reminder (24h before scheduled_at).
  - Pickup reminder + return checklist (day of pickup).
- All reminders use notification service (email + optional SMS) and log to `notifications` table.

## 8. Testing Plan
- Unit tests: pricing breakdown adjustments, conflict detection, wizard step validators.
- Integration: wizard commit (new booking), update existing booking, logistics task creation, pickup checklist submission.
- E2E (Playwright): start booking wizard, complete booking with deposit, run bulk status update, assign driver and view operations board.
- Mock external services: Stripe (payment intent creation), Maps API (route URL) using MSW.

## 9. Dependencies & Risks
- Requires Stripe manual payment enhancements (Phase 2 payments spec) for deposit handling.
- Need careful migration path to avoid breaking existing delivery assignments; maintain backward compatibility.
- Conflict detection must handle high-volume queries efficiently (consider precomputed availability blocks).
- Ensure wizard commit transactions maintain consistency across bookings, payments, logistics tables.

## 10. Implementation Checklist
1. Author SQL migrations for new tables/columns/indexes + RLS policies.
2. Implement wizard session storage (Supabase, TTL cleanup job).
3. Build API endpoints with validation, logging, testing.
4. Update frontend (wizard UI, bulk toolbar, logistics view).
5. Implement Edge Functions for bulk processing and reminders.
6. Write automated tests per plan.
7. Update documentation (admin guide for booking wizard, logistics workflows).

---
Prepared by: GPT-5 Codex.
