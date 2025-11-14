# Testing Strategy & Tooling (Phase 1)

_Date: 2025-11-11_

## Objectives
- Provide regression safety for expanded admin capabilities (bookings, payments, logistics, analytics).
- Ensure backend migrations/API changes are validated before deployment.
- Cover critical user journeys end-to-end with deterministic automation.

## 1. Testing Stack Overview
| Layer | Tooling | Scope |
|-------|---------|-------|
| Unit | **Vitest** + `@testing-library/react` (for components) | Pure functions (pricing, alert rules), utility modules, React components with isolated props. |
| Integration | **Vitest** + **Supertest** (API routes), Supabase Test Client | Server actions/API route validation, Supabase interaction using test schema. |
| E2E | **Playwright** | Admin journeys: login, dashboard review, booking creation workflow, payments/refunds, maintenance scheduling, support ticket handling, insurance approvals, settings updates. |
| Performance | **Artillery** or **k6** | Load testing on analytics/dashboard APIs, bookings bulk operations. |
| Static Analysis | ESLint, TypeScript, Prettier, dependency audit (pnpm audit, Snyk). |

## 2. Test Environments
- **Local**: Developer machines with mock data and Supabase local branch.
- **CI**: GitHub Actions (or equivalent) executing test matrix on pull requests.
- **Staging**: Supabase branch + Vercel preview with seeded data for exploratory testing and Playwright against live services (Stripe test mode, SendGrid sandbox).

### Data Strategy
- Use dedicated Supabase schema/branch for tests (`test` or `ci`); run migrations automatically before integration/E2E suites.
- Provide seed scripts for core entities (equipment, users, bookings) to ensure deterministic results.
- Mock external services where feasible (Stripe via test mode + stripe-mock, SendGrid via sandbox mode, DocuSign via demo account).

## 3. Coverage Targets
| Area | Goal |
|------|------|
| Critical business logic (pricing, conflict detection, alerting) | ≥ 90% branch coverage |
| API routes (bookings, payments, operations, support) | 100% route coverage with success + failure cases |
| React components (forms, dashboards, modals) | Snapshot or behavioral tests for every new component |
| E2E flows | At least 1 happy path + 1 edge case per major module |
| Performance | Baseline throughput for dashboard API (p95 < 300ms) |

## 4. Test Suites to Build
1. **Dashboard Alerts**: Validate alert thresholds, materialized view data mapping.
2. **Booking Wizard**: Unit tests for availability/pricing; API integration tests (create/update); Playwright flow covering conflict, deposit, reminders.
3. **Logistics & Drivers**: Verify Supabase realtime updates, driver assignment validations, route map interactions (use map mock provider).
4. **Equipment Maintenance**: Maintenance log CRUD, reminder scheduling, status transitions.
5. **Customer Segments & Messaging**: Segment builder validation, consent handling, SendGrid API call scaffolding (mock).
6. **Payments & Installments**: Manual payment recording, Stripe webhook handling, installment schedule calculations.
7. **Support Threads & SLA**: Message posting, attachment upload, SLA breach detection.
8. **Insurance Workflow**: Approve/reject/reminder flows with PDF generation stub.
9. **Promotions Rule Engine**: Condition evaluation matrix, schedule activation/deactivation.
10. **Contracts & E-sign**: Template rendering, DocuSign webhook processing (mock), reminder triggers.
11. **Settings & Security**: Secrets proxy API, admin invite + 2FA flows, IP allow-list enforcement.

## 5. Tooling Setup Tasks
- Configure Vitest project references for shared config (`frontend/vitest.config.ts`).
- Establish Playwright project with admin credentials in `.env.test` (use test Supabase branch).
- Integrate Supabase Test Client or Docker-based Postgres for integration suites.
- Add scripts:
  - `pnpm test:unit`
  - `pnpm test:integration`
  - `pnpm test:e2e`
  - `pnpm test:performance`
- Add CI workflow running unit + integration on PR; E2E nightly or on demand.
- Connect Playwright report to CI artifacts, notify Slack/Teams on failures.

## 6. Mocking & Fixtures
- Use MSW (Mock Service Worker) for external HTTP stubs in unit/integration tests.
- Provide fixture factories (e.g., `createBooking`, `createEquipment`) to populate Supabase test database.
- For Stripe, leverage `stripe-mock` container or `stripe-node` test helpers.
- Ensure DocuSign, SendGrid, Maps interactions have adapter interfaces to facilitate mocking.

## 7. Test Data Governance
- Keep test data anonymized; avoid real customer details.
- Clean up seeded data between runs (transaction rollback or `truncate` scripts).
- For Playwright, run in parallel using isolated test accounts (e.g., `aitest2@udigit.ca`).

## 8. Reporting & Observability
- Collect coverage reports (Vitest + Playwright) and upload to codecov (or alternative).
- Log test runtime metrics to identify flaky suites.
- Track E2E flakiness and set budget (<2% failure rate).

## 9. Next Steps
1. Update `package.json` scripts and CI workflow to include new commands.
2. Author baseline unit tests for newly planned materialized views (validate SQL output vs fixtures).
3. Scaffold Playwright tests for existing flows (dashboard load, booking list) to establish baseline before major refactor.
4. Document QA checklist per release based on this strategy.

---
Prepared by: GPT-5 Codex (Phase 1 Foundations).
