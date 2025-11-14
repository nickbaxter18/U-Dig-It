# Phase 2 Spec – Audit Stream, Security Center & Secrets Management

_Date: 2025-11-11_

## Objectives
- Enhance audit logging with realtime stream, anomaly detection, and retention policies.
- Build security center UI for managing secrets, admin access, 2FA, IP allow lists.
- Improve settings management with validation and approval workflows.

## 1. Data Model & Migrations
- **Tables**:
  - `audit_events` (id uuid, event_type enum, actor_id, actor_role, resource_type, resource_id, action, severity low|medium|high|critical, metadata jsonb, ip_address, user_agent, session_id, occurred_at).
  - `audit_event_tags` (audit_id, tag) for quick filtering.
  - `security_incidents` (id uuid, incident_type, severity, description, detected_at, resolved_at, resolved_by, resolution_notes).
  - `admin_invites` (id uuid, email, role, invited_by, invite_token, expires_at, accepted_at).
  - `admin_sessions` (id uuid, admin_id, issued_at, expires_at, last_seen_at, ip_address, user_agent, revoked boolean, revoked_at).
  - `secret_store` (id uuid, key text unique, value_encrypted bytea, created_at, created_by, updated_at, updated_by).
  - `settings_change_requests` (id uuid, category, payload jsonb, status pending|approved|rejected, requested_by, approved_by, created_at, acted_at).
- **Columns/Additions**:
  - `system_settings`: add `requires_approval boolean`, `validation_endpoint` (optional URL to test config).
  - `users`: add `two_factor_enabled boolean`, `two_factor_method` (authenticator|sms|email), `last_password_change_at`.
  - `notifications`: extend to include security notifications (type `security_alert`).
- **Indexes**:
  - `audit_events`: `(occurred_at DESC)`, `(resource_type, resource_id)`, `(actor_id)`, gin on `metadata` for JSON queries.
  - `security_incidents`: `(severity, detected_at)`.
  - `secret_store`: `(key)` unique.
  - `settings_change_requests`: `(status, created_at)`.

## 2. API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/audit/events` | GET | Paginated audit events with filters (date, severity, action, actor, resource). |
| `/api/admin/audit/events/stream` | GET (SSE/WebSocket) | Realtime audit feed for security center. |
| `/api/admin/audit/events/{id}` | GET | Detailed view including metadata json. |
| `/api/admin/security/incidents` | GET/POST/PATCH | Manage incidents (create, update status). |
| `/api/admin/security/admins` | GET | List admins with 2FA status, last login, sessions. |
| `/api/admin/security/admins/invite` | POST | Send admin invitation. |
| `/api/admin/security/admins/{id}/sessions` | GET/DELETE | View/revoke sessions. |
| `/api/admin/security/twofactor/setup` | POST | Initialize 2FA (generate secret, QR). |
| `/api/admin/security/ip-allowlist` | GET/POST/DELETE | Manage IP ranges allowed for admin access. |
| `/api/admin/security/secrets` | GET/POST/PATCH/DELETE | Manage secrets (proxied, no plaintext returned after create). |
| `/api/admin/settings/change-request` | POST | Submit change for system settings requiring approval. |
| `/api/admin/settings/change-request/{id}` | PATCH | Approve/reject change, apply if approved. |
| `/api/admin/settings/validate` | POST | Run validation/test for integration settings (Stripe, SendGrid, DocuSign). |

### Security & Validation
- All endpoints require `super_admin` or specific roles (e.g., `security` for audit, `config` for settings).
- Secrets stored encrypted (use KMS or libsodium). API returns masked values except immediate response on creation.
- Change requests audited; apply operations executed server-side with transaction.
- 2FA setup flow uses TOTP or SMS; enforce backup codes (Phase 3).

## 3. Realtime Audit Stream & Alerts
- Supabase realtime channel `audit_events` emits new events; security center subscribes.
- On high/critical severity events (e.g., failed admin login, secret access), trigger notifications (email/Slack).
- Provide anomaly detection rules (e.g., multiple failed logins from same IP) via background job writing to `security_incidents`.
- Retention policy: archive old audit records to cold storage (S3) after 12 months; maintain metadata for quick search.

## 4. Security Center UI
- **Dashboard**: cards for recent critical events, open incidents, admin 2FA coverage, IP allow list summary.
- **Audit Explorer**: advanced filters (free text, tags, resource, actor). Live mode toggled to auto-scroll with stream.
- **Admin Management**: list admins with role, 2FA status, last login, session list + revoke button, invite new admin.
- **Secrets Manager**: table of secrets with last updated, updated by, usage (where referenced). Create/edit via modal; value masked; test button to verify integration.
- **IP Allow List**: add/remove IP ranges; show rule precedence; require confirmation.
- **Settings Approval**: list pending change requests with diff view; approve/deny with comment.

## 5. Secrets Handling Workflow
- Secrets stored in `secret_store` encrypted; associated metadata (tiling to system_config values or services).
- Settings UI fetches mask (*****123) and allows rotation via API (users must re-enter new value, optionally run validation).
- Application reads secrets via server-side service (Edge function or backend) – ensure code updated to pull from secret store rather than plain env (Phase 3 actual implementation).
- Audit all secret read/write events with `severity=high`.

## 6. Two-Factor & Session Control
- 2FA opt-in/out managed via `/security/twofactor` endpoints; store per-user state.
- Force logout ability: revoke active sessions from `admin_sessions` table.
- Optionally enforce session timeout (configurable) and idle warnings.

## 7. Automation & Monitoring
- Nightly job to detect anomalies (various heuristics) and create `security_incidents` records.
- Cron to clean expired invites and archived sessions.
- Backup job for secrets store (encrypted dump) stored securely.
- Integration with monitoring dashboards (create panel for audit event rate, incident counts).

## 8. Testing Plan
- Unit: secret encryption/decryption, change request diff logic, anomaly detection rules, IP allowlist validation.
- Integration: audit events API filtering, secret create/update, admin invite acceptance, settings change approval path.
- E2E: create admin invite, set up 2FA, rotate secret with validation, approve settings change, view realtime audit feed.
- Security tests: ensure secrets not returned in logs or responses; verify unauthorized access denied.

## 9. Dependencies & Risks
- Requires secure key management (KMS integration recommended). For initial phase, use environment-based master key with plan to migrate to managed service.
- Changing secrets store implies updating existing services to read from new source (Phase 3 implementation to follow).
- Real-time audit stream dependent on Supabase throughput; ensure filtering/preprocessing for high volumes.
- Need to handle migration of existing system_config values into secret store carefully.

## 10. Implementation Checklist
1. Create migrations for audit/security tables, indexes, RLS (admin-only).
2. Implement audit event publisher (wrap existing logging to insert full events).
3. Build realtime stream endpoint and UI.
4. Develop security center pages (audit, admins, secrets, IP list, incidents).
5. Implement secret store API with encryption utilities.
6. Add settings approval workflow and integration validation endpoints.
7. Introduce 2FA setup and session management backend + UI.
8. Write tests and update security documentation, incident response playbook.

---
Prepared by: GPT-5 Codex.
