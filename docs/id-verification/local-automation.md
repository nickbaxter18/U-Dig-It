# Local ID Verification Automation

## Overview

The hosted IDKit integration is optional. When credentials are missing or the edge
function call fails, the platform now executes a fully local verification
pipeline that validates customer artefacts and reaches an autonomous decision.
This document describes the data flow, quality thresholds, and operational
playbooks for the in-house reviewer.

## Data Flow

1. **Capture (Client)**
   `LicenseUploadSection` collects licence front/back and a live selfie. The
   component runs quick heuristics (brightness, sharpness, aspect ratio) and
   uploads artefacts to the `idkit-intake` storage bucket under
   `userId/bookingId/*`.

2. **Submit API**
   `/api/id-verification/submit` validates ownership, records a new
   `id_verification_requests` row, and tries to call the `idkit-submit` edge
   function. When the call fails or returns `mode !== 'idkit'`, the local worker
   executes.

3. **Local Worker (`runLocalIdVerification`)**
   - Downloads artefacts using a short-lived signed URL from `idkit-intake`.
   - Computes image stats via `sharp`: resolution, brightness, Laplacian
     sharpness, and skin coverage.
   - Runs `@vladmandic/human` (TensorFlow/ONNX) to detect faces and produce face
     descriptors for licence portrait and selfie.
   - Uses `@zxing/library` to decode PDF417 barcodes on the back of the licence.
   - Calculates cosine similarity between descriptors; thresholds are tuned to
     flag mismatches (`0.45` minimum).
   - Writes structured scores to `id_verification_results`, updates request
     status (`approved`, `manual_review`, `rejected`), and records an audit row.

4. **Booking Checklist**
   Successful submissions trigger `triggerCompletionCheck`, which lets the
   booking management UI refresh the “Upload License” checklist step automatically.

## Quality Thresholds

| Check                               | Requirement / Threshold                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| Licence resolution                  | ≥ 600×400 px                                                |
| Licence aspect ratio                | Between 1.3 and 1.95 (landscape)                            |
| Selfie resolution                   | ≥ 400×400 px                                                |
| Selfie aspect ratio                 | Between 0.6 and 1.4                                         |
| Brightness                          | Between 0.20 and 0.85 (all images)                          |
| Sharpness (Laplacian)               | Front/back ≥ 18, selfie ≥ 12                                |
| Barcode detection (back image)      | Must decode a PDF417 payload                                |
| Face detection (front + selfie)     | Human detector confidence ≥ 0.4 / 0.5 respectively          |
| Face match similarity               | Cosine similarity ≥ 0.45                                    |
| Face hash collisions                | Front/back/selfie hashes must differ (handled client-side)  |

Any critical failure (missing barcode, missing faces, low similarity) pushes
the request to `rejected`. Recoverable issues (slightly blurry, brightness out
of range) move to `manual_review`.

## Storage & Retention

- Bucket: `idkit-intake` (private, user-scoped RLS).
- Artefacts are auto-purged via `purge_expired_idkit_objects()` (default 72 hours).
- Audit trail lives in `id_verification_audits`.

## Admin Console Enhancements

The reviewer queue (`/admin/security/id-verification`) now shows:

- Automation scorecards (face match, document and selfie sharpness).
- Signed URL previews for front/back/selfie artefacts (10-minute expiry).
- Raw failure reasons and extracted barcode data when available.

## Operational Checklist

1. **Dependencies**
   Install native libs after cloning: `pnpm install` (requires build toolchain
   for `canvas` and `tfjs-node`).

2. **Scheduled Tasks**
   - Trigger `/api/jobs/process` via cron to keep the job table clean if used
     elsewhere.
   - Schedule `select purge_expired_idkit_objects('72 hours');` (e.g., daily).

3. **Monitoring**
   - Observe `id_verification_requests.status` trends; high rejection rates may
     indicate threshold tuning needed.
   - Capture warnings from the local worker (barcode or face detection failures).

4. **Manual Review**
   Reviewers can open artefact previews, iterate notes, and override status
   (approve/reject) with audit logging baked in.

## Testing Guidelines

- **Unit tests**: `id-verification-submit.test.ts` mocks Supabase and verifies
  that the submit route falls back to the local worker and records decisions.
- **Manual**: Upload known-good and known-bad sample artefacts to confirm
  expected outcomes (approved vs rejected).
- **Performance**: Expect ~1–2 seconds per verification on a modern CPU once
  models are warm.

## Future Enhancements

- Integrate OCR (tesseract) to extract licence number/expiry automatically.
- Add selfie pose/liveness prompts (e.g., turn head) to increase spoof resistance.
- Persist hashed embeddings to detect duplicate faces across multiple accounts.

