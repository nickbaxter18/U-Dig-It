# High-Risk Feature Verification Matrix

_Last updated: 2025-11-10 · Source of truth for risk-first QA planning_

## 1. Scoring Framework

- **Impact**: Direct effect on revenue, safety, or compliance (1–5).
- **Failure Likelihood**: Complexity, change velocity, external dependencies (1–5).
- **Exposure**: Regulatory, legal, or reputational risk (1–5).
- **Risk Score**: `impact + likelihood + exposure`
  - **High** ≥ 12, **Medium** 8–11, **Low** ≤ 7.

## 2. High-Risk Feature Inventory

| Feature Area | Key Components & APIs | Impact | Failure Likelihood | Exposure | Risk Score | Notes |
|--------------|-----------------------|:------:|:------------------:|:--------:|:----------:|-------|
| Booking creation & availability validation | `app/book/**/*`, `components/booking/*`, `app/api/bookings/route.ts`, `checkAvailability()` | 5 | 3 | 5 | **13 (High)** | Core revenue path, complex date/pricing checks, must enforce availability + seasonal pricing rules. |
| Stripe payments & security holds | `app/api/create-payment-intent`, `app/api/stripe/*`, `components/booking/PaymentSection.tsx`, Stripe webhooks | 5 | 4 | 5 | **14 (High)** | External API + deposit regulations; failures block revenue or mis-handle funds. |
| Contract generation & signing | `components/contracts/*`, `app/api/contracts/*`, storage bucket `contracts` | 4 | 3 | 5 | **12 (High)** | Legal artefacts; must guarantee integrity, signing, and secure storage with RLS. |
| Insurance COI intake | `components/booking/InsuranceUploadSection.tsx`, `app/api/upload-insurance`, storage policies | 4 | 3 | 5 | **12 (High)** | Compliance requirement; incorrect handling exposes liability and privacy risk. |
| Admin booking operations & RLS | `app/admin/**/*`, `components/admin/*`, `app/api/admin/*`, Supabase RLS policies | 4 | 3 | 4 | **11 (Medium)** | Privileged workflows; misconfigured RLS exposes sensitive data or enables unauthorized actions. |
| Authentication & session management | `app/auth/**/*`, `components/auth/*`, Supabase auth guards | 4 | 3 | 4 | **11 (Medium)** | Controls access to all features; regressions lock out users or bypass protections. |
| Customer communications & notifications | `app/api/contact`, `app/api/lead-capture`, notification triggers | 3 | 2 | 3 | 8 (Medium) | Impacts lead pipeline and user trust; ensure rate limiting and spam protections. |

> **Backlog / Watchlist**: Spin wheel promotions, analytics dashboards, contest endpoints — currently medium-to-low risk but monitor after high-risk areas reach ≥80% automated coverage.

## 3. Verification Coverage & Gaps

| Feature Area | Current Automated Coverage* | Manual / QA Coverage | Identified Gaps | Planned Verification Actions |
|--------------|-----------------------------|----------------------|------------------|------------------------------|
| Booking creation | ~30% unit/integration (per `TESTING_MASTER_INDEX`) | Manual smoke tests noted in `BOOKING_COMPLETION_WORKFLOW.md` | Limited end-to-end validation of availability conflicts, multi-day pricing, deposit calculation edge cases. | Expand Vitest integration tests for pricing & availability; add Playwright flow validating draft → pending; add regression data set covering seasonal pricing. |
| Stripe payments & holds | Focused unit tests around payment helpers; webhook coverage unknown | Manual runs referenced in `PAYMENT_SYSTEM_READY.md` | Missing automated hold release + refund reconciliation; no Supabase ledger cross-check. | Write integration tests mocking Stripe + verifying Supabase persistence; record fixture of webhook payloads; schedule nightly reconciliation script check. |
| Contract generation & signing | Component tests sparse (components coverage 12%); API route tests limited | Manual verification documented in `CONTRACT_SIGNING_ANALYSIS.md` | No automated PDF comparison or signature audit trail validation; storage permissions untested. | Implement contract API integration tests with snapshot of payload metadata; add E2E test covering upload/sign/retrieve; run storage RLS policy tests via Supabase MCP. |
| Insurance COI intake | Minimal automated tests | Manual checklist in `PAYMENT_SYSTEM_READY.md` | File size/type validation and RLS enforcement not covered; no negative-path tests. | Add API tests for upload validator; create Supabase storage policy tests for user-only access; include virus/malicious payload simulation via mocks. |
| Admin operations & RLS | Admin component tests exist but limited; RLS policy tests  stored in `DATABASE_VERIFICATION_SUITE.md` | Manual regression in `ADMIN_DASHBOARD_REVIEW.md` | Coverage gap on role escalation attempts, rate limiter bypass, download/export actions. | Extend Supabase policy tests via `mcp_supabase_execute_sql`; add integration tests for admin APIs ensuring 403 for non-admin; create Playwright scenario for refund + dispute resolution. |
| Authentication & session | Auth components tested (SignIn/Up), client providers partially covered | Manual login smoke tests documented | Missing integration tests for password reset, email link flows, multi-session edge cases. | Add Supabase auth mock tests covering password reset and session invalidation; extend Playwright flows for multi-tab + logout. |
| Communications & notifications | Basic API tests (contact, leads) exist | Manual email checks referenced in `EMAIL_SYSTEM_SETUP_GUIDE.md` | Rate limiting + spam filtering not asserted; notification queue health unchecked. | Add rate-limit regression tests; verify email queue integration with mock transport; include content sanitizer unit tests. |

\*Coverage estimates sourced from `TESTING_MASTER_INDEX.md` and related testing reports; update figures after each coverage run (`pnpm test:coverage:summary`).

## 4. Next Maintenance Steps

- Update scores quarterly or after major releases.
- Record verification status (✅ / ⚠️ / ❌) per feature in this matrix after executing new tests.
- Link new test suites and coverage reports under each feature area for traceability.

---

**Owner:** QA & Automation team
**References:** `AI_CODING_REFERENCE.md`, `COMPONENT_INDEX.md`, `API_ROUTES_INDEX.md`, `TESTING_MASTER_INDEX.md`, feature-specific guides under `docs/features/`



















