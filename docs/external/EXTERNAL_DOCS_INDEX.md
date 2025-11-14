# External Documentation Index

Curated list of external resources we should index for fast reference inside Cursor. Each entry includes a short rationale and the primary topics we rely on during development, operations, or support.

| Provider | Section / URL | Why It Matters | Key Topics |
| --- | --- | --- | --- |
| **Supabase Docs** | [https://supabase.com/docs](https://supabase.com/docs) | Our primary backend; covers auth, PostgREST, storage, functions, RLS. | Auth, Postgres & SQL, storage buckets, edge functions, advisors, CLI. |
| Supabase Auth | https://supabase.com/docs/guides/auth | Login flows, email magic links, policies for user management. | Session management, MFA, email templates, policy examples. |
| Supabase Row Level Security | https://supabase.com/docs/guides/auth/row-level-security | Ensures every table access pattern is correct. | Policy creation, troubleshooting, performance indexing. |
| Supabase Storage | https://supabase.com/docs/guides/storage | Contracts, insurance docs, signed URLs. | Bucket configuration, RLS for files, signed URL generation. |
| Supabase Functions & Edge | https://supabase.com/docs/guides/functions | Scheduling, serverless logic. | Edge runtime, cron jobs, secrets. |
| Supabase CLI | https://supabase.com/docs/guides/cli | Local development, migrations, type generation. | CLI commands, project linking, seeding. |
| Supabase Advisors | https://supabase.com/docs/guides/platform/advisors | Security/performance recommendations we already track. | Advisor categories, remediation steps. |
| **Next.js Docs** | https://nextjs.org/docs | Frontend framework reference. | App Router, Routing, Server Actions, caching, middleware. |
| Next.js API Routes | https://nextjs.org/docs/app/building-your-application/routing/router-handlers | Serverless endpoints for payments, emails. | Request/response helpers, edge vs node runtime. |
| Next.js Middleware & Edge | https://nextjs.org/docs/app/building-your-application/routing/middleware | Security headers, rate limiting scaffolding. | Edge runtime limits, config examples. |
| **React 19 / RSC** | https://react.dev/reference/react | Staying aligned with Suspense, transitions, server/client patterns. | Suspense, server components, hooks updates. |
| **Radix UI** | https://www.radix-ui.com/primitives/docs/overview/introduction | Accessible components powering UI. | Composition patterns, accessibility guidelines. |
| **Tailwind CSS** | https://tailwindcss.com/docs | Utility-first styling consistent with design rules. | Utilities, responsive design, theming. |
| **Stripe Docs** | https://stripe.com/docs | Payment intents, holds, refunds, disputes. | PaymentIntents API, webhooks, Radar, refunds. |
| Stripe Webhooks | https://stripe.com/docs/webhooks | Booking flow depends on confirmed webhooks. | Signature verification, handling retries. |
| Stripe Disputes | https://stripe.com/docs/disputes | Procedure when a customer disputes a charge. | Evidence submission, timeline, best practices. |
| **SendGrid Docs** | https://docs.sendgrid.com | Booking confirmations, receipts, reminders. | Mail Send API, templates, suppression management, analytics. |
| SendGrid Deliverability | https://docs.sendgrid.com/for-developers/sending-email/deliverability | Keep transactional emails out of spam. | Domain authentication, suppression, monitoring. |
| **Playwright Docs** | https://playwright.dev/docs/intro | E2E & accessibility testing. | Test runner API, axe integration, CI configuration. |
| **Vitest & Testing Library** | https://vitest.dev/guide/ | Unit/integration testing standards. | Mocking, setup/teardown, coverage. |
| React Testing Library | https://testing-library.com/docs/react-testing-library/intro | Component testing best practices. | Queries, user-event, accessibility assertions. |
| **Zod** | https://zod.dev | Input validation for API routes. | Schema design, type inference, error handling. |
| **Lighthouse & Core Web Vitals** | https://web.dev/vitals/ | Performance targets defined in docs. | Metrics, thresholds, optimization strategies. |
| **Vercel Platform Docs** | https://vercel.com/docs | Deployment, secrets, Edge runtime, logs. | Environment variables, build pipeline, analytics. |
| **Supabase Security** | https://supabase.com/docs/guides/security | Align with our security checklist. | Secrets handling, network policies, auditing. |
| Stripe Radar & Compliance | https://stripe.com/docs/radar | Fraud protection for bookings. | Radar rules, risk evaluation. |
| SendGrid Compliance | https://docs.sendgrid.com/for-developers/sending-email/compliance | Regulatory requirements for email campaigns. | CAN-SPAM, unsubscribes, consent. |

> Additions: Update this file when new dependencies or integrations require quick reference inside Cursor. Keep URLs stable and prefer canonical docs over community tutorials.***

