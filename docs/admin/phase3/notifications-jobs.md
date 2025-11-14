# Phase 3 Blueprint – Notification Service & Background Jobs

_Date: 2025-11-11_

## Objectives
- Centralize notification handling (email, SMS, push) with queueing and retry logic.
- Implement background jobs supporting reminders, alerts, analytics refresh, and reconciliation tasks.

## 1. Architecture Overview
- **Notification Service Module** (`lib/notification-service.ts` expansion):
  - Interfaces for `email`, `sms`, `push`, `inApp` channels.
  - Queue table `notification_queue` storing payloads and status, processed by Edge Function worker.
  - Integration adapters: SendGrid, Twilio/SMS placeholder, Web Push (future), in-app notifications via `notifications` table.

- **Job Scheduler**: Use Supabase Edge Functions triggered by cron schedules or on-demand events.
  - Jobs: dashboard view refresh, alerts generation, booking reminders, maintenance reminders, installment reminders, SLA alerts, insurance reminders, promotion scheduler, contract reminders, Stripe reconciliation.

## 2. Queue Schema
Create table `notification_queue` (id uuid, channel email|sms|push|inapp, to jsonb (address/ids), template_id uuid optional, subject string optional, payload jsonb, scheduled_at timestamptz, status queued|processing|sent|failed|cancelled, attempts int default 0, last_attempt_at timestamptz, error text, metadata jsonb, created_at timestamptz default now()).

Indexes: `(status, scheduled_at)`, `(channel)`, `(created_at)`.

RLS: admin/service roles only; Edge Function uses service key. No direct customer access.

## 3. Notification Flow
1. API writes to queue via service module (e.g., deposit reminder adds record).
2. Edge Function `process_notifications` runs every minute or triggered via HTTP; fetches `queued` records where `scheduled_at <= now()`.
3. For each record:
   - Acquire advisory lock to prevent double processing.
   - Mark status `processing`, increment attempts, call channel adapter.
   - On success: update status `sent`, set `sent_at` (use `metadata` JSON).
   - On failure: log error, set status `failed` if attempts exceed threshold (e.g., 3), else schedule retry with exponential backoff.
4. SendGrid/Twilio responses logged for analytics; update `notifications` table for in-app alerts.

## 4. Templates & Personalization
- Store templates in `notification_templates` table (existing) with channels metadata and placeholders.
- Notification service fetches template, merges with payload (using mustache/handlebars).
- Support inline overrides for subject/body.
- Ensure customer consent is checked before queueing (using `customer_consent`).

## 5. Background Jobs Catalog
| Job | Frequency | Description |
|-----|-----------|-------------|
| `refresh_materialized_views` | 5-60 min depending on view | Refresh analytics materialized views (Phase 1 design). |
| `generate_dashboard_alerts` | 5 min | Evaluate `mv_alert_candidates`, create alerts & queue notifications. |
| `booking_reminders` | Hourly | Deposit, pickup, return reminders; uses notification queue. |
| `maintenance_reminders` | Daily | Check `maintenance_logs`/`maintenance_alerts`, queue notifications. |
| `installment_reminders` | Hourly | Send payment due reminders, escalate overdue. |
| `sla_monitor` | 5 min | Check `support_sla`, create alerts. |
| `insurance_reminders` | Daily | Send info/expiry reminders. |
| `promotion_scheduler` | 15 min | Activate/deactivate promotions, notify stakeholders. |
| `contract_reminders` | Hourly | Check pending signatures, send reminders. |
| `payout_reconciliation` | Nightly | Fetch Stripe payouts, update `payout_reconciliations`. |
| `segment_refresh` | Nightly | Recompute auto-refresh segments. |
| `audit_anomaly_detector` | Hourly | Identify suspicious activity, log incidents, queue notifications. |

Jobs implemented as Edge Functions accessible via supabase cron or manual trigger endpoints with authentication.

## 6. Failure Handling & Monitoring
- Log job runs to `job_runs` table (id, job_name, started_at, finished_at, status success|failed, error_message).
- On repeated failures (>3), send critical alert to security center (using queue).
- Add health endpoint `/api/admin/jobs/status` to show last run & status per job.
- Consider Sentry integration for job errors.

## 7. Testing & Staging
- Provide local scripts to trigger jobs manually (`supabase functions invoke`).
- For testing, use sandbox keys (SendGrid sandbox, Twilio test credentials) and mark messages accordingly.
- Unit tests for notification service adapters (with mocks), job scheduling logic, backoff.
- Integration tests for queue processing, ensuring `customer_consent` enforced.

## 8. Security & Compliance
- Notification queue should mask sensitive data; store minimal PII (IDs, hashed addresses if possible).
- Ensure outbound email complies with CAN-SPAM/consent; include unsubscribe links where applicable.
- Cron functions should use service role keys stored securely.

## 9. Implementation Checklist
1. Create `notification_queue` table and `job_runs` table with indexes + policies.
2. Update notification service module to enqueue/dequeue and call channel adapters.
3. Implement Edge Functions for each job with configuration (cron schedule, environment vars).
4. Integrate API endpoints to use queue for reminders/messages.
5. Set up monitoring dashboards for queue length, job failures.
6. Document runbooks for job troubleshooting and manual replays.

---
Prepared by: GPT-5 Codex.
