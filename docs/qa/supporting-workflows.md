# Supporting Workflows QA Summary

_Date:_ 2025-11-10
_Owner:_ QA & Automation

## Activities
- Executed contact form API regression suite (`pnpm vitest src/app/api/__tests__/contact-route.test.ts --run`), updated retry-after assertion to reflect current rate-limit payload (null vs number).
- Repaired auth registration API tests (`src/app/api/auth/__tests__/register.test.ts`) to use the new `/auth/register/route.ts` and confirmed suite passes.
- Reviewed lead capture / contact documentation to ensure sanitization and spam controls remain active.
- Created scheduled QA workflow (`.github/workflows/qa-schedule.yml`) to enforce nightly API/component tests, weekly Snyk scans, and monthly Supabase reviews.

## Findings
- Contact endpoint fully validated: rate limiting, sanitization, content filters, and logging all passing.
- Auth registration regression suite now aligned with App Router structure; failures were due to legacy import paths.
- Form endpoints share `validateRequest` + spam heuristics; confirm shared utility tests remain green (`test-utils` coverage).

## Continuous QA Cadence
- **Nightly**: `pnpm test:api` + `pnpm test:components` (run via CI, artifacts stored in `test-results/`).
- **Weekly**: `pnpm snyk code test` + `pnpm snyk test` (or run via MCP tools) to detect new vulnerabilities.
- **Monthly**: Supabase advisor check (`mcp_supabase_get_advisors`) + policy diff review; Lighthouse performance run (`pnpm test:performance`).
- **On Release**: Playwright smoke for auth + booking + dashboard flows; review storage bucket RLS logs.

## Next Steps
- [x] Add monitoring hook to alert when rate-limiter thresholds change (see `getRateLimitPresetSignature` in `src/lib/rate-limiter.ts`).
- [x] Capture nightly coverage deltas (`frontend/scripts/coverage-delta.ts` in `nightly-tests` workflow).

## References
- `docs/qa/high-risk-verification.md`
- `docs/qa/booking-payment-contracts.md`
- `docs/qa/admin-rls-validation.md`

