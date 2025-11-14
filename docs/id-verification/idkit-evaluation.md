# IDKit Capability Evaluation (Drivers Licence Verification Upgrade)

## Feature Coverage vs. Project Priorities
| Priority | IDKit Capability | Fit Notes |
| --- | --- | --- |
| Fraud reduction & anti-spoofing | Face liveness detection (depth sensing, anti-spoofing) plus selfie-to-ID matching | Supports active/passive liveness checks to flag printed or replayed IDs before approval ([IDKit README](https://github.com/FaceOnLive/ID-Verification-OpenKYC?tab=readme-ov-file)). |
| Faster onboarding / automation | Real-time document authentication across 10 000+ global ID types with 99.5% accuracy and ~15 s verification | Eliminates manual review backlog; can auto-clear clean cases and route edge cases to human reviewers. |
| Compliance & auditability | AI-powered document liveness, tamper detection, role-based access control, session intelligence | Provides machine-readable results (pass/fail reasons) that we can log per booking for audit trails; still need to extend our database to persist decision metadata. |
| Cost reduction | One-time on-prem deployment option ($1200 server with unlimited transactions) plus community support | Up-front cost beats per-transaction SaaS pricing at our forecasted volume; requires internal hosting + maintenance headcount. |

## Module-by-Module Assessment
- **Document recognition**: Supports Canadian driver’s licences (and 200+ countries) with OCR to extract licence number, expiry, issuing province. Will allow auto-population of structured fields currently missing from `users` table.
- **Face liveness**: Selfie capture SDK can be integrated into our existing camera flow; outputs liveness confidence we can enforce (e.g., >0.9).
- **Face match**: Compares captured selfie with ID headshot; crucial for preventing imposters in equipment hand-offs.
- **Document liveness**: Detects if the ID image is a screen or photocopy capture—useful for front/back upload validation.
- **Admin dashboards**: Optional moderator UI could complement our own admin hub; double-check RBAC alignment before adopting.

## Hosting & Infrastructure Considerations
- **Self-hosted deployment**: Requires provisioning a dedicated GPU-capable instance (IDKit recommends Nvidia T4 or similar) with secure ingress. If we opt for the $1200 pre-configured server bundle, plan for rack space, redundancy, and patch management.
- **Scalability**: Run verification microservice separately from the booking app; expose an internal API gateway with autoscaling (Kubernetes or container orchestrator) to handle peak season traffic.
- **Storage & retention**: Processed artefacts (cropped faces, OCR text) should stay in encrypted object storage with lifecycle policies aligned to PIPEDA. Avoid keeping raw selfies longer than necessary after verification.
- **Monitoring**: Integrate GPU/CPU metrics, queue depth, and success/failure KPIs into our existing observability stack (Grafana + Supabase logs).

## Alignment with Current Architecture
- **Frontend**: Replace the existing `LicenseUploadSection` file upload UX with IDKit’s capture widgets (document + selfie flows), maintaining our React styling while delegating capture/quality hints to the SDK.
- **Backend**: Add a verification orchestrator service that sends captured media to IDKit, ingests results via webhook/callback, and persists structured outcomes (decision, reason, extracted fields, scores) tied to bookings.
- **Database**: Introduce tables such as `id_verification_requests`, `id_verification_results`, and `id_verification_audits` with Supabase RLS to maintain audit history and reviewer overrides.
- **Admin tools**: Extend admin dashboards to review flagged cases, override decisions, and export compliance reports (leveraging IDKit’s session intelligence metadata).

## Gaps & Follow-Up Questions
- Confirm licence coverage specifics for New Brunswick to tailor OCR field mapping (e.g., `LicenceNo`, `Expiry`, `Class`).
- Validate SDK availability for browser + mobile web; determine whether we need native wrappers for future mobile apps.
- Assess legal/data residency constraints: storing biometric data on-premises may still require consent workflows and retention policies.
- Plan fallback path if IDKit API is unavailable (e.g., temporary manual queue) to avoid blocking bookings.*** End Patch

