# ID Verification Integration Architecture & Rollout Strategy

## End-to-End Workflow
1. **Capture & Consent (Frontend)**
   - Replace `LicenseUploadSection` with an IDKit-powered workflow that collects (a) government ID images (front/back), (b) live selfie with liveness challenge, and (c) explicit consent for biometric processing.
   - Store raw captures in a temporary, encrypted Supabase bucket `idkit-intake` with short TTL (e.g., auto-expire after 48 h).

2. **Verification Request (Backend)**
   - A new edge function `submit-id-verification` validates booking ownership, generates a signed request, and forwards artefacts to the IDKit API.
   - Create `id_verification_requests` row (status `submitted`) keyed by booking + user + attempt.

3. **IDKit Processing**
   - IDKit runs document authentication, OCR, face liveness, and selfie-to-ID matching.
   - Configurable thresholds determine automatic pass/fail (e.g., liveness score ≥ 0.9, face match ≥ 0.85, document integrity pass).

4. **Webhook Callback**
   - New `app/api/webhooks/idkit/route.ts` endpoint ingests results, verifies HMAC signature, and updates `id_verification_results` with structured data (scores, extracted fields, failure reasons).
   - `id_verification_requests` status transitions to `approved`, `manual_review`, or `rejected`.
   - Trigger Supabase realtime event to refresh booking completion checklist.

5. **Reviewer Overrides (Admin)**
   - Admin dashboard gains an “ID Verification” tab to review flagged cases, view artefacts (with masked PII), and override outcomes.
   - Overrides logged in `id_verification_audits` capturing user, decision, notes, and timestamp.

6. **Downstream Actions**
   - Booking completion logic requires `id_verification_requests.status` = `approved` (auto or manual).
   - Extracted fields populate new columns in `users` (e.g., `drivers_license_number`, `drivers_license_expiry`, `drivers_license_province`) and feed compliance reporting.

## Core Components
| Layer | Responsibilities |
| --- | --- |
| Frontend (`frontend/src/components/booking/IdVerificationFlow.tsx`) | Orchestrates IDKit JS SDK, manages consent, handles success/failure messaging. |
| Edge Functions (`supabase/functions/idkit-submit`, `idkit-webhook`) | Securely communicate with IDKit using service role key, perform input validation, and enforce rate limiting. |
| Database (Supabase) | Tables: `id_verification_requests`, `id_verification_results`, `id_verification_audits`. Add indexes on `(booking_id, status)` and `(user_id, created_at)` for reporting. |
| Admin Interface | New views under `/admin/security/id-verification` for queue, decision history, and export. |
| Monitoring | Alerts on verification failures, latency spikes, and webhook signature mismatches. Metrics stored in Grafana/Prometheus. |

## Security & Compliance Controls
- **Authentication & Authorization**:
  - Only authenticated customers can initiate verification; enforce RBAC in edge functions.
  - Admin override endpoints require `admin` or `super_admin` roles checked via Supabase RLS policies.
- **Data Protection**:
  - Encrypt stored artefacts at rest; implement lifecycle policies to purge raw media post-verification.
  - Persist only necessary derived fields; redact PII in logs.
  - Maintain customer consent records linked to each verification attempt.
- **Transport Security**:
  - Validate TLS certificate pinning for outbound requests to IDKit.
  - Require webhook signatures and replay protection (nonce + expiry).
- **Auditability**:
  - Capture full decision trace (inputs, scores, operator overrides) in `id_verification_audits`.
  - Use structured logging (`logger.info/error`) with booking & user metadata for compliance review.
  - Schedule quarterly data retention and policy audits.

## Failure Handling & Fallbacks
- **Transient API Errors**: Queue retry jobs with exponential back-off; surface “verification pending” to users.
- **Confidence Below Threshold**: Route to manual review queue; notify admins via email/Slack integration.
- **Customer Experience**: Provide clear guidance and allow up to N attempts before requiring support contact.
- **System Outage**: Enable manual upload fallback that routes directly to reviewer queue without automation.

## Testing Strategy
- **Unit Tests**:
  - Validate edge function request/response schemas with Zod.
  - Mock IDKit API to test happy/failure paths.
- **Integration Tests**:
  - Simulate entire flow with Playwright: capture, submit, webhook callback, dashboard update.
  - Include anti-spoof regression suite with known fake samples.
- **Performance & Load**:
  - Artillery tests to ensure IDKit request throughput meets peak demand (>50 concurrent verifications).
  - Monitor GPU utilization when self-hosted.
- **Compliance Audits**:
  - Run quarterly verification of consent capture, data retention scripts, and admin override logs.

## Rollout Plan
1. **Internal Pilot (Weeks 1–2)**: Test with staff accounts; validate hardware sizing and capture UX.
2. **Beta with Selected Customers (Weeks 3–4)**: Run in parallel with manual review, compare automation accuracy vs. baseline.
3. **Full Launch (Week 5)**: Switch booking completion requirement to automated approval; maintain manual override queue.
4. **Post-Launch Monitoring (Week 6+)**: Track KPIs (average verification time, automated approval rate, fraud catch rate, customer completion rate, cost per verification). Adjust thresholds as needed.
5. **Continuous Improvement**: Schedule model updates, refresh test datasets, and refine admin tooling based on feedback.

