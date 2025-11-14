# Integrations Inventory & Secret Handling (Phase 1)

_Date: 2025-11-11_

## 1. Stripe
- **Code**: `frontend/src/lib/payments.ts`, `frontend/src/lib/stripe/config.ts`, API routes under `frontend/src/app/api/stripe/*` and `.../payments/*`.
- **Functions**: Payment intent creation, checkout sessions, verification holds, refunds, receipt generation, Stripe webhook handler.
- **Secret Sources**:
  - Primary: `system_config` table keys `stripe_secret_key`, `stripe_publishable_key` (loaded server-side via Supabase service role).
  - Secondary fallback: environment vars `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
  - Development fallback: hard-coded test keys (`STRIPE_TEST_FALLBACK_KEY`, `STRIPE_TEST_FALLBACK_PUBLISHABLE_KEY`) in `stripe/config.ts` (used when env/db keys absent).
  - Webhook secret expected via `STRIPE_WEBHOOK_SECRET` (checked in API routes).
- **Notes / Risks**:
  - Hard-coded fallback keys should be removed for production readiness; rely on env/config only.
  - Keys pulled via service-role Supabase client; ensure service key not bundled client-side.
  - Need secure storage/rotation policy (Phase 2 settings upgrade).

## 2. SendGrid Email
- **Code**: `frontend/src/lib/sendgrid.ts`, `lib/email-service.ts`, email templates under `lib/email-templates`.
- **Secret Sources**:
  - Environment variables `SENDGRID_API_KEY` or `EMAIL_API_KEY` (template file instructs to set these).
  - Sender details `EMAIL_FROM`, `EMAIL_FROM_NAME`.
- **Usage**: Admin emails, booking confirmations, payment receipts, marketing campaigns.
- **Notes**:
  - No database override; purely env-based.
  - Ensure API key stored server-side only; avoid exposing to client bundler.
  - Consider storing verified sender + template IDs in `system_config` for admin UI management.

## 3. DocuSign / E-Signature
- **Current State**: UI references DocuSign info (contracts page) but no implementation modules or environment variables present.
- **Work Needed**: Add integration module with client ID/secret, redirect URI, and webhook handling. Document secrets strategy (likely server-only env + secure storage table).

## 4. Google Maps / Geocoding
- **Configuration**: `ENV_TEMPLATE.txt` expects `GOOGLE_MAPS_API_KEY` (instructions warn about regeneration & restrictions).
- **Usage**: Likely operations map/route features (not yet implemented). Confirm actual usage in code (currently minimal).
- **Notes**:
  - Key currently loaded from `process.env.GOOGLE_MAPS_API_KEY` where needed; ensure key not sent to client where unnecessary.
  - Map integration planned for Phase 2 operations enhancements.

## 5. Supabase
- **Client Config**: `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` for client-side, `SUPABASE_SERVICE_ROLE_KEY` for server tasks.
- **Fallback Keys**: Template includes fallback project keys (exposed). Should replace with actual project-specific values and remove fallback secrets from repo.
- **Security**: Service role should only be used server-side (Edge functions, Stripe key retrieval). Double-check no client bundle consumes service key.

## 6. Other References
- `external_integrations` table exists (likely for integration metadata).
- Notification services in `lib/notification-service.ts` rely on env toggles but no SMS provider configured.
- No Twilio or Firebase config detected.

## 7. Secret Handling Observations
- Relying on `.env.local` + Supabase `system_config` table.
- Need centralized secret management plan:
  - Server-only environment variables for primary keys.
  - Admin settings UI should proxy operations via server API (never expose secrets to client).
  - Remove hard-coded fallback keys from repo before production cutover.
  - Add audit logging when secrets updated (Phase 2 settings work).

## 8. Action Items
1. Replace Stripe fallback keys with safer development-only mechanism (e.g., require env/test config).
2. Create doc for storing Stripe/SendGrid keys in Supabase `system_config` with encryption or KMS integration.
3. Define environment variable validation script to run at boot (ensures secrets present when required).
4. Plan DocuSign integration scaffolding (env placeholders: `DOCUSIGN_CLIENT_ID`, `DOCUSIGN_CLIENT_SECRET`, `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_BASE_URL`).
5. Restrict Google Maps key with referrer/IP rules; move instructions from `ENV_TEMPLATE.txt` into admin settings doc with enforcement checks.
