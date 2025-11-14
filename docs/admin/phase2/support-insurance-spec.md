# Phase 2 Spec – Support Messaging, SLA & Insurance Enhancements

_Date: 2025-11-11_

## Objectives
- Upgrade support module to full conversation threads with SLA tracking and alerts.
- Extend insurance workflows with audit trails, reminders, and request-for-info loops.

## 1. Data Model & Migrations
- **Tables**:
  - `support_messages` (id uuid, ticket_id, sender_type admin|customer|system, sender_id, message_text, attachments jsonb array, created_at, internal boolean).
  - `support_sla` (id uuid, ticket_id, priority, target_response_minutes, target_resolution_minutes, first_response_at, resolved_at, breached_response boolean, breached_resolution boolean).
  - `support_message_recipients` (id uuid, message_id, recipient_type customer|admin, recipient_id, delivered_at, read_at).
  - `support_templates` (id uuid, name, channel email|sms|note, subject, body, created_by, created_at).
  - `insurance_activity` (id uuid, insurance_document_id, action submitted|approved|rejected|info_requested|reminder_sent, actor_id, details jsonb, created_at).
  - `insurance_reminders` (id uuid, insurance_document_id, reminder_type expiry|missing_info, scheduled_at, status pending|sent|cancelled, sent_at, created_at).
- **Column Additions**:
  - `support_tickets`: add `sla_priority`, `first_response_at`, `last_message_at`, `customer_last_reply_at`.
  - `insurance_documents`: add `requested_info jsonb`, `last_reminder_at`, `audit_status`, `reviewer_notes`.
- **Indexes**:
  - `support_messages`: `(ticket_id, created_at)`, `(sender_type)`.
  - `support_sla`: `(ticket_id)`.
  - `insurance_activity`: `(insurance_document_id, created_at)`.
  - `insurance_reminders`: `(scheduled_at, status)`.

## 2. API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/support/tickets/{id}/messages` | GET/POST | Fetch conversation thread, post reply (email + SMS integration). |
| `/api/admin/support/messages/{id}/attachments` | POST | Upload attachments (signed URL flow). |
| `/api/admin/support/tickets/{id}/sla` | GET/PATCH | View SLA metrics, adjust priority, override targets. |
| `/api/admin/support/templates` | GET/POST/PATCH/DELETE | Manage canned responses/templates. |
| `/api/admin/support/tickets/{id}/assign` | POST | Reassign ticket with optional note.
| `/api/admin/support/tickets/{id}/remind` | POST | Trigger SLA reminder to assignee/customer.
| `/api/admin/insurance/{id}/activity` | GET | Fetch audit trail for document.
| `/api/admin/insurance/{id}/request-info` | POST | Request additional documentation from customer (updates `requested_info`).
| `/api/admin/insurance/{id}/remind` | POST | Send reminder (respects reminder schedule table).

### Security & Validation
- Admin auth required; message posting triggers send via notification service and logs to timeline.
- Validate attachments (size/type) and store in `insurance-docs` or `support-attachments` bucket with proper RLS.
- Ensure SLA updates audited; only admins with support role can modify targets.

## 3. Support Messaging Flow
- Threaded UI similar to inbox: messages grouped chronologically, show sender avatar/role.
- Reply composer supports email format (rich text), attachments, templates, internal notes toggle.
- Messages persisted, and outbound email/SMS sent via notification service (SendGrid + optional SMS provider placeholder).
- `support_message_recipients` tracks delivery/read receipts for future analytics.

## 4. SLA Tracking & Alerts
- Configure default SLA per priority (e.g., critical=1h response/4h resolution).
- On ticket creation, insert `support_sla` record with targets; update fields as events happen.
- Cron job checks for SLA breaches; updates `breached_*` flags, creates alerts, notifies assignee.
- Dashboard widgets show SLA compliance metrics (tying into Phase 2 analytics).

## 5. Insurance Audit Trail & Reminders
- Every action recorded in `insurance_activity` (including reviewer comments, requests, approvals, rejections, reminders).
- Request for information: stores requested fields/instructions, notifies customer (via CRM/email) and logs status.
- Reminders scheduled 7 days before expiry, 3 days before, day of; auto-cancel if document approved/updated.
- Provide audit view in insurance page with timeline and downloadable log.

## 6. UI Enhancements
- **Support Page**:
  - Ticket list includes SLA badges (time remaining, breached state), conversation snippet, unread count.
  - Ticket detail shows thread, SLA panel, quick actions (assign, wait for customer, close).
  - Templates dropdown in composer for quick replies.
  - Attachment preview (images/PDFs) via modal.
- **Insurance Page**:
  - Timeline panel with reviewer actions, reminders, communication log.
  - CTA for request info (predefined checklist), track outstanding items.
  - Reminder schedule indicator (next reminder time).

## 7. Automation & Notifications
- SLA job: triggers when first response due or resolution overdue; send email + Slack/Teams message (if integration configured).
- Insurance reminder job: runs daily, sends emails to customers and alerts to admins.
- Support message notifications: uses notification service for email/SMS, optionally push to driver/customer via mobile app.

## 8. Testing Plan
- Unit tests: SLA calculation, reminder scheduling logic, insurance activity logging.
- Integration tests: support message API (with attachments), SLA update, insurance request for info, reminder dispatch.
- E2E: post support message, upload attachment, check SLA alert, request insurance info, send reminder.
- Mock email/SMS services in test suite; confirm audit logs recorded.

## 9. Dependencies & Risks
- Attachment storage requires RLS to ensure only authorized admins access support/insurance files.
- SLA notifications rely on accurate server time; ensure cron schedules set with timezone awareness.
- Need to ensure customer notifications respect consent and do not leak sensitive details.
- Potential integration with external ticketing system in future – design API to allow extensions.

## 10. Implementation Checklist
1. Author migrations for new tables/columns + RLS policies.
2. Implement support messaging APIs with integration to notification service.
3. Build SLA cron job and alert integration.
4. Implement insurance activity logging and reminder scheduler.
5. Update support/insurance UI components to new design.
6. Add automated tests (unit/integration/E2E).
7. Update documentation (support playbook, insurance SOP, SLA policy).

---
Prepared by: GPT-5 Codex.
