# Phase 3 Blueprint – Frontend Architecture & Accessibility

_Date: 2025-11-11_

## Objectives
- Prepare React/Next.js architecture for new admin features (wizard, dashboards, timelines, messaging).
- Ensure caching/data-fetch strategy supports performance and offline resilience.
- Reinforce accessibility and design system alignment.

## 1. Component Architecture
### Shared Components to Build/Update
- `AlertBanner`, `ExportDropdown`, `SavedFilterModal` (Dashboard).
- `BookingWizard` (multi-step modal) with subcomponents per step.
- `BulkActionToolbar` for tables.
- `Timeline` component for tickets/customers/insurance.
- `MediaGallery`, `MaintenanceTimeline`.
- `SegmentBuilder`, `TagPicker`, `ConsentPanel`.
- `InstallmentSchedule`, `LedgerTable`.
- `ChatThread` (support messages) with attachments and composer.
- `RuleBuilder` (promotions) with condition/action editors.
- `SecurityCenter` widgets (audit feed, admin list, secrets table).

### State Management
- Adopt React Query (TanStack Query) for data fetching across admin modules.
  - Configure query keys per module (e.g., `['dashboard', range, filters]`).
  - Use mutations for POST/PATCH operations with optimistic updates.
  - Invalidate queries upon success (e.g., `queryClient.invalidateQueries(['bookings'])`).
- Maintain global context for admin metadata (roles, permissions, feature flags).
- For large forms (wizard), use `react-hook-form` or Zod resolver for validation.

### Routing & Layout
- Continue using `/admin/...` structure; ensure nested layouts (e.g., `admin/dashboard/layout.tsx` if needed for data prefetch).
- Use dynamic imports for heavy charts or map components to improve initial load.

## 2. Data Fetching & Caching
- Standardize API hooks (e.g., `useDashboardData`, `useBookingWizardSession`) returning typed data from Zod parsers.
- Implement caching for consistent data (e.g., segments list, tags) with stale time (5min).
- For realtime data (alerts, support messages), combine React Query with Supabase realtime subscription: on event, `queryClient.setQueryData` to update caches.
- Handle offline/backpressure gracefully (show fallback UI, toast when reconnected).
- Ensure API errors surface descriptive messages with `toast` notifications and log to Sentry (if configured).

## 3. Accessibility & Design System
- All interactive components must be keyboard accessible (tab, shift+tab, space/enter activation).
- Use focus-visible outlines, focus traps in modals.
- Alerts/notifications should use ARIA roles (`role="alert"`).
- Provide alt text for media gallery thumbnails; ensure modal display supports screen readers.
- Charts should include textual summaries for screen reader users.
- Map components should offer textual fallback (address list).
- Follow color contrast guidelines (WCAG AA). Update Tailwind theme tokens if needed for new statuses (severity levels, tags).

## 4. Performance Considerations
- Lazy load heavy components (charts, map) using dynamic imports with suspense fallback.
- Memoize expensive list renders using virtualization (React Window/Virtuoso) for large booking or audit tables.
- Debounce search/filter inputs to reduce API calls.
- Use suspense (React 18) for data fetching where appropriate.
- Monitor bundle size; split promotions rule builder into chunk.

## 5. Error Handling UX
- Provide inline error states for forms (wizard steps, segment builder) using Zod errors.
- Global error boundary for admin layout showing recovery options.
- Use toasts/snackbars for success/failure events; log to monitoring service.
- In support chat, show optimistic message with retry on failure.

## 6. Testing Strategy (Frontend)
- Component tests with React Testing Library for new shared components.
- Playwright tests covering key flows (wizard, timeline interactions, messaging, promotions builder, security center).
- Visual regression snapshots for key pages (if adopting Chromatic or similar).
- Accessibility tests using Axe + Playwright to catch violations.

## 7. Tooling Updates
- Introduce ESLint plugin for accessibility (jsx-a11y) strict mode.
- Ensure TypeScript strict mode enforced on new modules.
- Update `package.json` scripts for `test:component`, `test:e2e`.
- Configure Playwright test projects to cover admin pages using test account.

## 8. Documentation & Dev Experience
- Extend `docs/design/admin-components.md` with new component usage guidelines.
- Provide code snippets for common patterns (React Query hook, mutation patterns).
- Document real-time integration pattern (subscribe via Supabase, update React Query cache).
- Update onboarding doc for new developers to understand admin architecture.

---
Prepared by: GPT-5 Codex.
