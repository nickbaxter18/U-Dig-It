# 🚀 Developer Onboarding Guide

Welcome to the Kubota Rental Platform! This guide helps new engineers ramp up quickly on our Supabase + Next.js stack.

---

## 1. Accounts & Access

| Service | Access Needed | Notes |
| --- | --- | --- |
| GitHub | Read/write repo access | Request via engineering lead |
| Supabase | Project member (editor) | Needed for database/storage admin |
| Vercel | Viewer | Monitor builds, logs, analytics |
| Stripe | Developer | View logs, configure webhooks |
| SendGrid | Team member | Review email deliveries |

---

## 2. Local Environment Setup

```bash
git clone https://github.com/nickbaxter18/kubota-rental-platform.git
cd kubota-rental-platform
pnpm install
cp frontend/.env.example frontend/.env.local
# Fill in Supabase, Stripe, SendGrid values (ask lead for secure values)
bash start-frontend-clean.sh
```

Visit http://localhost:3000 to confirm the app is running.

Optional Supabase CLI stack:

```bash
pnpm supabase:start   # start Postgres/Auth/Storage locally
pnpm supabase:status  # check status
pnpm supabase:stop    # stop services
```

---

## 3. Project Orientation

| Topic | Reference |
| --- | --- |
| Overview & commands | `README.md`, `QUICK_COMMANDS.md` |
| Business logic & pricing | `AI_CODING_REFERENCE.md`, `docs/features/` |
| Component catalog | `COMPONENT_INDEX.md` |
| API routes | `API_ROUTES_INDEX.md` |
| Database schema | `supabase/migrations/`, `supabase/types.ts` |
| Operations | `docs/operations/runbooks.md` |

---

## 4. Daily Developer Workflow

```bash
bash start-frontend-clean.sh           # start dev server (protected script)
cd frontend && pnpm type-check         # TypeScript strict mode
pnpm lint                              # lint entire workspace
cd frontend && pnpm test               # unit/integration tests
cd frontend && pnpm test:e2e           # Playwright E2E
```

Before submitting a PR:
1. Run lint, type-check, and tests.
2. Update or add Playwright coverage when behaviour changes.
3. Sync documentation (`docs/`) with any new behaviour.

---

## 5. Coding Principles

- **Supabase-first**: all data access flows through Supabase; no custom backend.
- **Type safety**: regenerate `supabase/types.ts` via `mcp_supabase_generate_typescript_types` after schema changes.
- **Security**: validate inputs with zod, enforce rate limiting, log errors with context.
- **Accessibility**: follow Radix + Tailwind patterns; meet WCAG AA.
- **Testing**: cover business logic with Vitest and flows with Playwright.
- **Documentation**: treat docs as code—update when functionality changes.

See `AI_CODING_REFERENCE.md` for code patterns and examples.

---

## 6. Working with Supabase

```bash
> mcp_supabase_list_tables({ schemas: ['public'] })
> mcp_supabase_execute_sql({ query: 'select * from bookings limit 5' })
> mcp_supabase_apply_migration({ name: 'add_index', query: 'create index ...' })
> mcp_supabase_generate_typescript_types()
```

- Every table exposed to clients must have Row-Level Security and supporting indexes.
- Service-role keys live only on the server (Vercel env vars, Supabase Edge Functions).

---

## 7. Testing Expectations

| Layer | Command |
| --- | --- |
| Unit / integration | `cd frontend && pnpm test` |
| E2E | `cd frontend && pnpm test:e2e` |
| Accessibility | `cd frontend && pnpm test:accessibility` |
| Coverage | `cd frontend && pnpm test:coverage` |

CI runs lint, type-check, Vitest, and a Playwright smoke suite. Keep the pipeline green.

---

## 8. Getting Help

- **Logs/Monitoring**
  - Vercel → Deployments → Build & runtime logs
  - `mcp_supabase_get_logs({ service: 'api' })`, `{ service: 'auth' }`
  - Stripe → Developers → Logs
  - SendGrid → Activity feed
- **Troubleshooting** – `docs/troubleshooting/TROUBLESHOOTING.md`
- **Operations** – `docs/operations/runbooks.md`
- **Team Support** – Slack `#engineering` with context + steps already taken

---

## 9. Learning Resources

- Supabase documentation (RLS, Auth, Storage, Edge Functions)
- Next.js App Router docs
- Stripe docs (PaymentIntents, Checkout, disputes)
- SendGrid email best practices

Bookmark `docs/deployment/PRODUCTION-DEPLOYMENT.md` and `docs/planning/NEXT_STEPS.md` to stay aligned with launch readiness and roadmap.

---

Welcome aboard! Start with a small improvement—update a doc, add a test—to learn our workflow. Let’s ship dependable rentals for Saint John. 🚜

