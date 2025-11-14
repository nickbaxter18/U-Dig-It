# Development Environment Setup

The Kubota Rental Platform runs entirely on the Next.js frontend with Supabase handling authentication, database, storage, and scheduled jobs. Use the protected startup script to guarantee a consistent experience in Cursor.

---

## 🚀 Quick Start

```bash
pnpm install                 # first-time dependency install
bash start-frontend-clean.sh # launches Next.js at http://localhost:3000
```

The script automatically:
- stops any stray Next.js processes
- clears the `.next` cache
- starts the dev server on port **3000**

Open http://localhost:3000 in your browser and you’re ready to build.

---

## 💾 Optional: Local Supabase Stack

Most development can point at the hosted Supabase project. If you need a local database (offline dev, schema experiments), use the Supabase CLI helpers:

```bash
pnpm supabase:start   # start Postgres, Auth, Storage locally
pnpm supabase:status  # check health
pnpm supabase:stop    # stop services
pnpm supabase:reset   # reset DB with seed data (destructive)
```

Supabase Studio runs at `http://localhost:54323` while the stack is up.

---

## 🔁 Daily Workflow

```bash
bash start-frontend-clean.sh        # start dev server
cd frontend && pnpm type-check      # static analysis
pnpm lint                           # repo-wide lint
cd frontend && pnpm test            # unit/integration tests
cd frontend && pnpm test:e2e        # Playwright E2E
cd frontend && pnpm test:accessibility
```

Hot reload is enabled automatically. If file watching stops inside the devcontainer, run `./.devcontainer/fix-file-watching.sh`.

---

## 🧪 Helpful Commands

```bash
cd frontend && pnpm clean                 # remove build artifacts
cd frontend && pnpm build                 # production build
cd frontend && pnpm start                 # serve production build locally
cd frontend && pnpm test:bundle-analyze   # inspect bundle size
```

---

## 🧾 Environment Variables

Create `frontend/.env.local` with the following keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=bookings@udigitrentals.com
EMAIL_FROM_NAME=U-Dig It Rentals
NEXT_PUBLIC_ENABLE_STRIPE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
```

> ⚠️ Keep `SUPABASE_SERVICE_ROLE_KEY` out of `.env.local`. Store it only in secure server-side environments (Vercel project settings, Supabase Edge Functions, GitHub Actions secrets).

---

## 🛠️ Troubleshooting

### Port 3000 already in use
```bash
lsof -ti:3000 | xargs kill -9
bash start-frontend-clean.sh
```

### Supabase CLI won’t start
```bash
pnpm supabase:stop && pnpm supabase:start
pnpm supabase db reset        # destructive reset using supabase/seed.sql
```

### TypeScript or lint errors
```bash
cd frontend && pnpm type-check
pnpm lint:fix
```

### Stale cache or missing modules
```bash
cd frontend && pnpm clean
pnpm install
```

---

## 🛑 Stopping Services

```bash
# Stop Next.js dev server
Ctrl+C  # in the terminal running start-frontend-clean.sh

# Stop local Supabase stack
pnpm supabase:stop

# Kill stubborn Next.js processes
pkill -f "next"
```

---

## 📦 Production Build Check

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm build
pnpm start  # serves the production bundle on port 3000
```

---

Need extra validation? Run `node scripts/verify-agent-system.mjs` for automated checks or ask the team. Happy building! 🎯

