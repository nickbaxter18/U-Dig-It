# Automatic Documentation Reference System

## Overview

This system automatically triggers the correct indexed documentation references when working on related code. Each rule file uses **glob patterns** to auto-attach to relevant files, ensuring documentation is always at hand.

## How It Works

1. **File Type Detection**: When you open or edit a file, Cursor checks which glob patterns match
2. **Auto-Attach Rules**: Matching rules are automatically attached to the conversation
3. **@ Mention Prompts**: The rules instruct me to use `@mentions` for relevant indexed docs
4. **Smart Context**: You get the right documentation context without manual searching

## Rule Files Created

### 1. `auto-reference-supabase-docs.mdc`
**Triggers on**: Supabase files, migrations, API routes, auth code
**References**:
- @Supabase
- @Supabase RLS
- @Supabase Auth
- @Supabase Storage
- @Supabase Functions
- @Supabase Cli
- @Supabase Platform Advisors
- @supabas javascript
- @https://supabase.com/docs/guides/security

### 2. `auto-reference-nextjs-docs.mdc`
**Triggers on**: App router files, pages, layouts, middleware, configs
**References**:
- @next.js docs
- @https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- @https://nextjs.org/docs/app/building-your-application/routing/middleware
- @turbopack
- @https://vercel.com/docs

### 3. `auto-reference-stripe-docs.mdc`
**Triggers on**: Payment code, webhook handlers, billing components
**References**:
- @Stripe Docs
- @Stripe Webhooks
- @Stripe Disputes
- @https://stripe.com/docs/radar

### 4. `auto-reference-testing-docs.mdc`
**Triggers on**: Test files (.test, .spec), E2E tests, test configs
**References**:
- @https://playwright.dev/docs/intro
- @https://vitest.dev/guide/
- @https://testing-library.com/docs/react-testing-library/intro
- @mock service worker
- @tanstack query docs

### 5. `auto-reference-ui-docs.mdc`
**Triggers on**: Components, styles, Storybook stories
**References**:
- @React Dev
- @Radix-UI
- @Tailwind Css
- @storybook

### 6. `auto-reference-email-docs.mdc`
**Triggers on**: Email API routes, email templates, SendGrid code
**References**:
- @Send Grid Docs
- @https://docs.sendgrid.com/for-developers/sending-email/deliverability
- @https://docs.sendgrid.com/for-developers/sending-email/compliance

### 7. `auto-reference-performance-docs.mdc`
**Triggers on**: Next.js configs, components (for optimization)
**References**:
- @https://web.dev/vitals/
- @lighthouse
- @tanstack latest
- @tanstack query docs

### 8. `auto-reference-dev-tools-docs.mdc`
**Triggers on**: Cursor configs, build configs, package.json
**References**:
- @Cursor Rules
- @Cursor API
- @Cursor Learn
- @turbopack
- @storybook
- @https://zod.dev

### 9. `auto-reference-monitoring-docs.mdc`
**Triggers on**: Analytics, monitoring, logging code
**References**:
- @SigNoz
- @OpenTelemetry
- @https://docs.cloud.google.com/docs
- @https://developers.google.com/identity/protocols/oauth2

### 10. `auto-reference-integrations-docs.mdc`
**Triggers on**: Third-party integration code (Cal.com, Trigger.dev, etc.)
**References**:
- @cal.com
- @Trigger.dev
- @Documenso
- @Formbricks
- @MapLibre GL JS
- @Supa Next Starter

## Indexed Documentation Inventory

Based on your Cursor Settings → Indexing & Docs, you have:

### Core Infrastructure (10)
- Supabase (general)
- Supabase RLS
- Supabase Auth
- Supabase Storage
- Supabase Functions
- Supabase CLI
- Supabase Platform Advisors
- Supabase JavaScript client
- Supabase security guide
- Supa Next Starter

### Frontend (5)
- Next.js docs
- Next.js routing/route-handlers
- Next.js routing/middleware
- React Dev
- Turbopack

### UI & Styling (2)
- Radix-UI
- Tailwind CSS

### Payments (4)
- Stripe Docs
- Stripe Webhooks
- Stripe Disputes
- Stripe Radar

### Email (3)
- Send Grid Docs
- SendGrid deliverability
- SendGrid compliance

### Testing (4)
- Playwright docs
- Vitest docs
- Testing Library (React)
- Mock Service Worker

### State Management (2)
- TanStack latest
- TanStack Query docs

### Performance (3)
- Web.dev/vitals
- Lighthouse
- Vercel docs

### Development Tools (6)
- Cursor Rules
- Cursor API
- Cursor Learn
- Zod.dev
- Storybook
- Documenso

### Monitoring & Analytics (4)
- SigNoz
- OpenTelemetry
- Google Cloud docs
- Google OAuth2

### Integrations (5)
- Cal.com
- Trigger.dev
- Formbricks
- MapLibre GL JS
- Google OAuth2

## Usage Examples

### Example 1: Creating a Supabase RLS Policy
```sql
-- File: supabase/migrations/20250118_create_bookings_rls.sql
-- Auto-attached rule: auto-reference-supabase-docs.mdc

-- Rule instructs me to use:
-- @Supabase RLS for policy syntax
-- @Supabase Platform Advisors for performance optimization
```

### Example 2: Building an API Route
```typescript
// File: app/api/bookings/route.ts
// Auto-attached rules:
//   - auto-reference-nextjs-docs.mdc
//   - auto-reference-supabase-docs.mdc

// Rules instruct me to use:
// @https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// @Supabase for database operations
```

### Example 3: Writing Component Tests
```typescript
// File: components/BookingForm/BookingForm.test.tsx
// Auto-attached rules:
//   - auto-reference-testing-docs.mdc
//   - auto-reference-ui-docs.mdc

// Rules instruct me to use:
// @https://testing-library.com/docs/react-testing-library/intro
// @mock service worker for API mocking
// @React Dev for component patterns
```

## Benefits

1. **Zero Manual Work**: No need to remember which docs to reference
2. **Context-Aware**: Right docs at the right time
3. **Consistent**: Always follow the same patterns
4. **Discoverable**: See which docs are available for each file type
5. **Comprehensive**: Covers all 48 indexed documentation sources

## Maintenance

### Adding New Indexed Docs
1. Index the documentation in Cursor Settings
2. Update the relevant auto-reference rule file
3. Add the @ mention to the appropriate section
4. Update this master document

### Testing the System
1. Open a file (e.g., `app/api/test/route.ts`)
2. Check which rules auto-attached in the chat
3. Ask a question - I should reference the appropriate docs
4. Verify @ mentions are being used

## Next Steps

1. **Test the system**: Open various file types and verify rules attach
2. **Monitor usage**: Check if I'm using @ mentions correctly
3. **Adjust glob patterns**: Fine-tune which files trigger which rules
4. **Add missing docs**: If you index new docs, update the rules

## References

- @Cursor Rules - For understanding rule structure and best practices
- Cursor Docs: https://cursor.com/docs/context/rules

