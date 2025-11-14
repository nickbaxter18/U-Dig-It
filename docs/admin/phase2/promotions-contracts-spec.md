# Phase 2 Spec – Promotions Rule Engine & Contracts Enhancements

_Date: 2025-11-11_

## Objectives
- Provide flexible promotions/discount rules with targeting, scheduling, and analytics.
- Upgrade contract management with template editing, multi-signature workflows, and status sync.

## 1. Data Model & Migrations
### Promotions
- `promo_rules` (id uuid, name, description, status draft|scheduled|active|expired, start_at, end_at, priority, stackable boolean, discount_type percentage|fixed, discount_value numeric, created_by, created_at, updated_at).
- `promo_rule_conditions` (id uuid, rule_id, condition_type equipment_category|customer_segment|booking_value|duration|season|custom, operator equals|not_equals|in|gte|lte, value jsonb).
- `promo_rule_actions` (id uuid, rule_id, action_type discount|free_delivery|bonus_points, parameters jsonb).
- `promo_rule_segments` (id uuid, rule_id, segment_id) referencing `customer_segments`.
- `promo_redemptions` (id uuid, rule_id, booking_id, customer_id, redeemed_at, value_applied, source booking|admin).
- `promo_analytics_daily` (date, rule_id, impressions, redemptions, revenue_impact) materialized view or table.

### Contracts
- Extend `contract_templates`: add `version integer`, `is_active boolean`, `content markdown/html`, `placeholders jsonb`, `preview_path`, `last_published_at`.
- `contract_template_versions` (id uuid, template_id, version, content, placeholders, created_by, created_at).
- `contract_events` (id uuid, contract_id, event_type sent|viewed|signed|voided|reminder_sent|completed, actor_id, metadata jsonb, occurred_at).
- `contract_signers` (id uuid, contract_id, signer_role customer|admin|third_party, signer_name, signer_email, status pending|signed|declined, signed_at, auth_method email|sms|login).
- `contract_reminders` (id uuid, contract_id, scheduled_at, status pending|sent|cancelled, sent_at).

## 2. API Endpoints
### Promotions
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/promotions/rules` | GET/POST | List/create rules (with filters by status, date range). |
| `/api/admin/promotions/rules/{id}` | GET/PATCH/DELETE | Retrieve/update/delete rule; handle publish/unpublish. |
| `/api/admin/promotions/rules/{id}/analytics` | GET | Fetch performance metrics, breakdowns. |
| `/api/admin/promotions/evaluate` | POST | Validate rule conditions for a simulated booking request. |
| `/api/admin/promotions/schedule` | POST | Bulk activation/deactivation; adjust priority ordering. |

### Contracts
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/contracts/templates` | GET/POST | Manage templates (list/create). |
| `/api/admin/contracts/templates/{id}` | GET/PATCH/DELETE | View/update template, publish new version. |
| `/api/admin/contracts/templates/{id}/preview` | POST | Generate preview PDF/HTML. |
| `/api/admin/contracts/{id}/signers` | GET/POST/PATCH | Manage signers (add admin/third-party). |
| `/api/admin/contracts/{id}/remind` | POST | Send reminder to outstanding signers. |
| `/api/admin/contracts/webhook` | POST | Endpoint for DocuSign/Adobe Sign events.
| `/api/admin/contracts/{id}/events` | GET | Timeline of contract events.

### Validation & Security
- Promotions: require `admin` or `marketing` role; ensure only active rules apply to new bookings.
- Contracts: admin role; ensure template editing tracked via audit logs; enforce placeholders sanitized.
- Evaluate endpoint sanitized to prevent injecting custom SQL.

## 3. Rule Engine Logic
- Rules evaluated server-side during booking pricing (existing `pricing.ts` updated). Conditions matched via SQL or domain logic using DSL.
- Priority order: lower number = higher priority; stackable rules apply additive discount; non-stackable stops further evaluation.
- Scheduling: CRON job activates or deactivates rules at start/end times.
- Conflict detection: API warns if overlapping rules target same segment/equipment with conflicting priorities.
- Analytics data computed via materialized view `promo_analytics_daily` or nightly job summarizing `promo_redemptions`.

## 4. Promotions UI
- Rule builder wizard: define name, timeframe, targeting conditions (segments, equipment, spend), actions, stacking policy.
- Timeline view showing upcoming promotions and status.
- Analytics dashboard: KPI cards (redemptions, revenue impact), charts, top segments, export button.
- Promotion detail shows redemption history, affected bookings, ability to pause/resume.

## 5. Contracts Enhancements
- Template editor: use rich text/Markdown editor with preview, placeholder insertion, version history.
- Multi-signer support: configure order (sequential vs parallel), assign roles, contact methods.
- Webhook integration: DocuSign status updates (envelope events) map to `contract_events`; fallback polling job.
- Reminders scheduled automatically (3 days, 1 day before expiry) with ability to resend manually.
- Document storage: signed contracts stored in `contracts/` bucket; ensure versioning and access controls.

## 6. Automation
- Promotion scheduler job: runs every 15 minutes to activate/deactivate rules, send notifications.
- Redemption logging: occurs at booking pricing/commit stage; ensures ledger updates.
- Contract reminder job: checks `contract_reminders` table hourly.
- Contract webhook signature verification for DocuSign; store events for compliance.

## 7. Testing Plan
- Unit: promotion DSL evaluation, stacking logic, contract placeholder rendering, signer flow.
- Integration: promotions API, evaluation endpoint, template versioning, webhook handler.
- E2E: create promotion, schedule activation, booking receives discount; create contract, send, sign (simulate webhook), reminder triggers.
- Mock DocuSign events and ensure audit logs captured.

## 8. Dependencies & Risks
- Promotions heavily relies on accurate booking pricing; need to ensure new logic does not degrade performance (cache results, use materialized view).
- DocuSign integration requires secure storage of credentials (Phase 3 secret management); placeholder should be built with env variables.
- Must handle timezone differences for scheduling (store in UTC, display in local).
- Personal data in contracts must be handled securely; ensure access controls and AES encryption for template storage if necessary.

## 9. Implementation Checklist
1. Create migrations for promotions + contract tables/columns, indexes, RLS.
2. Implement rule evaluation service and integrate into pricing logic.
3. Build promotions APIs, analytics view, background scheduler.
4. Implement promotion UI components (rule builder, analytics, timeline).
5. Update contract template management, signers, reminders, webhook handler.
6. Add automated tests and update docs (marketing operations, contract playbook).

---
Prepared by: GPT-5 Codex.
