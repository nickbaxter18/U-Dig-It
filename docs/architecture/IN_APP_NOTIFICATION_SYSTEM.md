# In-App Notification System Architecture

## Overview
- Establish a unified, Supabase-backed in-app notification experience across the Kubota Rental Platform
- Provide real-time delivery, reliable persistence, and consistent UX spanning customer and admin workflows
- Align email/push strategies with in-app surfacing so important events always appear in the product, even if emails are missed

## Goals
- Deliver context-rich notifications for bookings, payments, equipment events, and system alerts
- Support prioritisation, CTAs, and read/unread state with per-user row-level security
- Enable automated and manual notification creation from API routes, background jobs, and workflows
- Provide a performant, responsive UI (badge + dropdown + inbox) with Supabase Realtime updates
- Maintain auditable history for compliance and customer support investigation

## Key Components
- **Database**: `notifications` table with new `category`, `read_at`, `action_url`, and `cta_label` columns. `notification_category` enum captures domain-specific categories (booking, payment, equipment, system, reminder, support, compliance, marketing).
- **Security**: Row-Level Security with policies:
  - Customers may `SELECT` their own notifications
  - Customers mark notifications as read via dedicated PostgreSQL RPC functions (`mark_notification_read`, `mark_all_notifications_read`)
  - Admins (`admin`/`super_admin`) can view/manage all notifications via policy + service role operations
- **Indices**: `idx_notifications_user_read`, `idx_notifications_category`, `idx_notifications_user_type_status` for fast unread queries & dashboards
- **Supabase Functions**: Security-definer RPC helpers ensure read operations only change `read_at`/`delivered_at` and enforce ownership checks
- **Server Utilities**: `notificationService.createInAppNotification` centralises creation logic, enforces defaults, and attaches structured metadata
- **API Layer**: New Next.js routes expose paginated lists and mutation endpoints (mark read, mark all read) for non-Realtime clients & testing hooks
- **UI Layer**:
  - `NotificationProvider` + `useNotifications` hook share state across navigation and dashboard
  - `NotificationBell` (badge) + `NotificationDropdown` for quick access
  - Dashboard module to view full history and filter by category/priority

## Data Lifecycle
1. **Creation**: triggered by domain events (booking confirmed, payment failed, maintenance scheduled) via email service, job scheduler, or manual admin actions
2. **Storage**: persisted in Supabase with channel = `in_app`, category, metadata, default status `sent`
3. **Delivery**: Supabase Realtime channel `notifications-{user_id}` pushes new rows to clients; UI updates badge count instantly
4. **Read State**: Client calls RPC functions to set `read_at` (and `status` => `delivered`). Unread count recalculated optimistically and confirmed server-side
5. **Retention**: Notifications remain accessible for audit/logging; future cleanup handled by scheduled job (e.g., archive older than 18 months)

## Integration Points
- Email service piggybacks to ensure every email-triggered event also stores an in-app counterpart
- Payment/hold edge-case handlers create high-priority alerts with deep links to resolve actions
- Admin tooling uses service role to broadcast operational updates or compliance alerts to multiple users
- Workflow engine may enqueue template-driven notifications based on automated conditions

## UX Considerations
- Responsive design ensures dropdown works on desktop/tablet; mobile flows fall back to inbox page
- Iconography and colour coding by category + priority (Kubota brand palette) for quick scanning
- Keyboard navigation & accessible semantics
- Batched mark-as-read for power users

## Testing Strategy
- Unit tests for notification service helper (input validation, metadata coercion)
- Integration tests for API routes (auth, RLS, RPC side effects)
- Playwright flows verifying badge updates, dropdown interactions, mark-read actions, and persistence across refresh
- Supabase verification suite (`DATABASE_VERIFICATION_SUITE.md`) gains notification-specific queries to validate RLS, counts, and unread filters

## Rollout Plan
1. Apply Supabase migration (types/columns/policies/functions)
2. Regenerate TypeScript types (`mcp_supabase_generate_typescript_types`)
3. Implement server helpers & API routes
4. Update UI components + navigation integration
5. Backfill existing notification inserts to set channel/category/action URLs
6. QA (unit + e2e) followed by documentation updates

## Future Enhancements
- User-configurable notification preferences (channels, categories)
- Scheduled digest notifications combining email + in-app summaries
- Push notification support (web/mobile) leveraging same pipeline
- Analytics dashboards for notification engagement & delivery health
