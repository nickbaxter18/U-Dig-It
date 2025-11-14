# Current Manual Driver's Licence Verification

## Summary
- Customers complete licence uploads through the booking management flow at `/booking/[id]/manage`, using the `LicenseUploadSection` client component to submit an image file or capture a photo in-browser (`frontend/src/components/booking/LicenseUploadSection.tsx`).
- Uploaded images are stored in the private Supabase Storage bucket `driver-licenses`, while the public URL is persisted to `users.driversLicense` (see `docs/features/BOOKING_MANAGEMENT_SYSTEM.md` for bucket configuration details).
- Operations staff currently review the stored image manually (via Supabase Storage explorer or ad-hoc download links) before flagging a booking as cleared. No automated checks (e.g., liveness, tamper detection, OCR) run on the asset.
- Any follow-up questions or rejections are handled through manual email/phone contact with the customer; audit logs are limited to standard Supabase storage metadata.

## Data Collected Today
- **Licence image**: JPEG/PNG/WebP up to 5 MB per upload. Customers can replace the file, overwriting the stored asset under their user folder.
- **Derived fields**: `users.driversLicense` stores the public URL that downstream systems reference for "licence uploaded" status. No structured metadata (number, expiry, issuing province) is extracted or stored.
- **Booking context**: Completion metrics now mark the `license_uploaded` flag only when an approved record exists in `id_verification_requests` or the user has a `drivers_license_verified_at` timestamp.
- **Notifications**: Reminder emails reference licence upload requirements (`frontend/src/lib/email-service.ts`), but there is no event-driven alert when reviewers approve or reject an upload.

## Process Flow (As-Is)
1. **Prompt**: Customer receives booking completion reminders directing them to the Manage Booking dashboard (`BookingManagementDashboard` checklist).
2. **Capture**: Customer uploads a file or uses the built-in camera capture; front/back capture is handled manually by asking for a single combined image.
3. **Storage**: File saved to Supabase Storage path `{user_id}/license_{timestamp}.{ext}` with RLS permitting customer read/write and admin read.
4. **Review**: Operations downloads or previews the stored image, manually validates authenticity/legibility, and tracks approvals outside the product (e.g., spreadsheet or CRM note).
5. **Status Update**: Staff manually update booking status (e.g., set to `confirmed`) once licence, insurance, contract, and payment look satisfactory. There is no dedicated UI state for “Licence approved” beyond the upload presence check.

## Pain Points
- High reviewer effort and long turnaround times due to manual inspection and back-and-forth with customers when images are unclear.
- No automated fraud detection (spoofing, tampering, duplicate IDs) or validation against government ID formats.
- Missing structured data prevents proactive expiry tracking or verifying that the licence matches the customer’s profile.
- Lack of system-level audit trail for who approved/rejected a licence and why, complicating compliance reporting.
- Customers can’t see real-time approval status; they only know the upload succeeded.

## Integration Points for Future Automation
- **Booking Completion Workflow**: Replace the existing `license_uploaded` boolean logic with detailed verification states (e.g., pending → in_review → approved/failed) surfaced in `BookingManagementDashboard`.
- **Storage Pipeline**: Introduce post-upload processing (webhooks/edge function) to hand the asset to IDKit’s document recognition and face matching workflow.
- **Notifications**: Emit structured events (Supabase channel or webhook) after automated checks to trigger customer/admin alerts.
- **Admin UI**: Extend admin dashboards to display verification results, supporting override actions and audit logging per booking/customer.
- **Data Model**: Add tables for verification attempts, extracted fields (licence number, expiry), decision logs, and reviewer actions to satisfy compliance audit requirements.

