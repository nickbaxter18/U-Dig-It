# Kubota Rental Platform – Complete Setup Guide

**Last Updated:** November 2025
**Status:** ✅ Fully operational Supabase + Next.js stack

This guide walks from a clean clone to a running development environment, including Supabase configuration, third-party services, and verification steps.

---

## 1. Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase account with project access
- Stripe account (test + production keys)
- SendGrid account (verified sender or domain)
- Google Cloud project for Maps APIs

> Optional: Supabase CLI (`pnpm exec supabase --version`) if you want to run the database locally.

---

## 2. Clone & Install

```bash
git clone https://github.com/nickbaxter18/kubota-rental-platform.git
cd kubota-rental-platform
pnpm install
```

---

## 3. Configure Environment Variables

Create `frontend/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # server-side only

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=bookings@udigitrentals.com
EMAIL_FROM_NAME=U-Dig It Rentals

# Feature flags
NEXT_PUBLIC_ENABLE_STRIPE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
```

> ⚠️ Do **not** commit `.env.local`. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser—set it only in server environments (Vercel, Supabase Edge Functions, GitHub secrets).

---

## 4. Start the Development Server

```bash
bash start-frontend-clean.sh
```

This protected script:
- kills any leftover Next.js processes
- clears the `.next` cache
- starts the dev server on http://localhost:3000

Open the URL in your browser to confirm the marketing site and booking flow load.

---

## 5. Optional: Run Supabase Locally

```bash
pnpm supabase:start       # spin up Postgres + Auth + Storage
pnpm supabase:status      # check status
pnpm supabase:stop        # stop services
pnpm supabase:reset       # reset with supabase/seed.sql (destructive)
```

Supabase Studio becomes available at http://localhost:54323 while running.

---

## 6. Apply Migrations (Hosted or Local)

```bash
# Push the current schema to the connected project
pnpm supabase db push

# Or ask the AI assistant:
# mcp_supabase_apply_migration({ name: '...', query: '...' })
```

Use `mcp_supabase_generate_typescript_types` after schema changes to refresh `supabase/types.ts`.

---

## 7. Third-Party Service Configuration

### Stripe (Test Mode)
- Dashboard → Developers → API Keys: grab publishable + secret keys.
- Developers → Webhooks: add `http://localhost:3000/api/webhooks/stripe`.
- Select events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
  - `payment_intent.amount_capturable_updated`
  - `charge.dispute.created`

### SendGrid
- Verify sender or domain.
- Set `EMAIL_FROM` / `EMAIL_FROM_NAME`.

### Google Maps
- Enable Places, Geocoding, and Distance Matrix APIs.
- Restrict key for localhost during development.

---

## 8. Verify the Setup

```bash
# Type-check + lint
cd frontend && pnpm type-check
pnpm lint

# Unit/integration tests
cd frontend && pnpm test

# Playwright end-to-end + accessibility
cd frontend && pnpm test:e2e
cd frontend && pnpm test:accessibility
```

Manual smoke tests:
1. Load homepage and view equipment card.
2. Start booking flow (ensure pricing + availability render).
3. Complete a Stripe test payment (4242 4242 4242 4242) and confirm booking status updates.
4. Verify admin dashboard loads for an admin user.
5. Check that SendGrid emails arrive.

---

## 9. Common Issues

| Symptom | Fix |
| --- | --- |
| Port 3000 already in use | `lsof -ti:3000 | xargs kill -9` then rerun `bash start-frontend-clean.sh` |
| Supabase CLI errors | `pnpm supabase:stop && pnpm supabase:start` |
| TypeScript complaints | `cd frontend && pnpm type-check` |
| Missing modules | `cd frontend && pnpm clean && pnpm install` |
| Stripe webhook errors | Re-copy webhook secret and ensure signature header is present |

---

## 10. Production Prep Summary

- Supabase migrations applied and RLS verified.
- Stripe, SendGrid, Google Maps configured for production domains.
- Vercel project connected with env vars (see deployment guide).
- Automated tests + linting pass.
- Manual booking + payment flow verified end-to-end.

---

You now have a fully configured dev environment for the Kubota Rental Platform. If anything feels off, run `node scripts/verify-agent-system.mjs` or ask the AI assistant for targeted Supabase/Vercel diagnostics. Happy shipping! 🚜
# Kubota Rental Platform - Complete Setup Guide

**Last Updated:** October 21, 2025
**Status:** ✅ Fully Operational

---

## 🎯 Quick Start

### Prerequisites
- Node.js 22.x or higher
- npm or pnpm
- Supabase account
- Stripe account

### Start Development Servers

```bash
# Terminal 1 - Start Frontend (Next.js)
cd frontend
npm run dev
# Runs on http://localhost:3000

# Terminal 2 - Start Backend (NestJS)
cd backend
npm run start:minimal
# Runs on http://localhost:3001
```

---

## 📁 Project Structure

```
Kubota-rental-platform/
├── frontend/              # Next.js 15 + React 19 application
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities and helpers
│   ├── public/
│   │   └── images/       # Static images (logos, equipment photos)
│   └── .env.local        # Frontend environment variables
│
├── backend/               # NestJS 11 API server
│   ├── src/
│   │   ├── modules/      # Feature modules
│   │   ├── entities/     # TypeORM entities
│   │   ├── supabase/     # Supabase service
│   │   └── health/       # Health check endpoints
│   └── .env              # Backend environment variables
│
└── .env                   # Root environment variables
```

---

## ⚙️ Environment Configuration

### Backend Configuration (`backend/.env`)

```bash
# Application
NODE_ENV=development
PORT=3001
APP_BASE_URL=http://localhost:3001

# Supabase Database Configuration
SUPABASE_URL=https://bnimazxnqligusckahab.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Payment Configuration
STRIPE_PUBLIC_KEY=pk_live_51S2N0TFYCEvui16J...
STRIPE_SECRET_KEY=rk_live_51S2N0TFYCEvui16J...
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Node.js SSL/TLS Configuration (Development Only!)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

⚠️ **Important:** `NODE_TLS_REJECT_UNAUTHORIZED=0` is for development only. Remove this in production and configure proper SSL certificates.

### Frontend Configuration (`frontend/.env.local`)

```bash
# Stripe Configuration (Public Key Only!)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_51S2N0TFYCEvui16J...

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

---

## 🗄️ Database Setup (Supabase)

### Connection Details
- **Project URL:** https://bnimazxnqligusckahab.supabase.co
- **Region:** Hosted on Supabase Cloud
- **Connection Method:** REST API via `@supabase/supabase-js`

### Required Tables
The database includes the following tables:
- `users` - Customer and admin accounts
- `equipment` - Kubota SVL-75 equipment inventory
- `bookings` - Rental bookings and reservations
- `payments` - Stripe payment transactions
- `insurance_documents` - Insurance verification documents
- `contracts` - Rental agreements and contracts

### Database Connection in Backend

The backend uses the `SupabaseService` for all database operations:

```typescript
// backend/src/supabase/supabase.service.ts
import { createClient } from '@supabase/supabase-js';
import fetch from 'cross-fetch';

// Configure client with cross-fetch for SSL/TLS support
this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'kubota-rental-platform@1.0.0',
    },
    fetch: fetch, // Use cross-fetch for proper SSL/TLS support
  },
});
```

### Key Dependencies
- `@supabase/supabase-js` - Supabase JavaScript client
- `cross-fetch` - Fetch polyfill with SSL/TLS support (critical for Docker/Node.js environments)

---

## 💳 Stripe Integration

### Configuration
- **Mode:** Live mode (production keys)
- **Public Key:** Used in frontend for Stripe Elements
- **Secret Key:** Used in backend for payment processing
- **Webhook Secret:** For Stripe webhook verification

### Stripe Health Check Note
The health check endpoint `/health/detailed` may show Stripe as "unhealthy" with the error:
```
"The provided key 'rk_live_...' does not have the required permissions for this endpoint"
```

This is **EXPECTED** if you're using a restricted API key. The health check tries to read the balance which requires `rak_balance_read` permission. This doesn't affect payment processing functionality. To fix this, either:
1. Grant `rak_balance_read` permission to your restricted key in Stripe Dashboard, OR
2. Use a standard secret key instead of a restricted key, OR
3. Ignore this warning as it doesn't affect core payment functionality

---

## 🖼️ Static Assets

### Company Branding
- **Logo:** `frontend/public/images/udigit-logo.png`
  - Source file: `b5dd9044-d359-4962-9538-69d82f35c66d.png.PNG`
  - Used in: Navigation bar, Footer, Watermarks

### Equipment Images
- **Kubota SVL-75:** `frontend/public/images/kubota-svl-75-hero.png`
  - Source file: `kubota.png`
  - Used in: Equipment showcase, Product pages

### About Page Photos
- **Father-Son Bucket:** `frontend/public/images/Father-Son-Bucket.webp`
  - Used in: About page "Our Story" section

- **Kid on Tractor:** `frontend/public/images/kid-on-tractor.webp`
  - Used in: About page "Early Beginnings" section

---

## 🚀 Deployment Considerations

### Frontend Deployment
1. Update `NEXT_PUBLIC_API_URL` to production backend URL
2. Configure production Stripe public key
3. Set `NEXTAUTH_URL` to production domain
4. Build: `npm run build`
5. Start: `npm run start`

### Backend Deployment
1. **CRITICAL:** Remove or set `NODE_TLS_REJECT_UNAUTHORIZED=1` for production
2. Update all environment variables to production values
3. Configure proper SSL/TLS certificates
4. Set up proper logging and monitoring
5. Build: `npm run build`
6. Start: `npm run start:prod`

---

## 🔍 Health Checks

### Backend Health Endpoints

```bash
# Basic health check
curl http://localhost:3001/health

# Detailed health with all dependencies
curl http://localhost:3001/health/detailed

# Test Supabase connection specifically
curl http://localhost:3001/health/test-supabase

# Test equipment data
curl http://localhost:3001/health/equipment
```

### Expected Healthy Response
```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T19:10:49.554Z",
  "uptime": 1818,
  "version": "1.0.0",
  "environment": "development",
  "dependencies": {
    "database": {
      "status": "healthy",
      "responseTime": 641,
      "lastChecked": "2025-10-21T19:10:48.913Z"
    },
    "cache": {
      "status": "healthy",
      "responseTime": 0,
      "lastChecked": "2025-10-21T19:10:49.554Z"
    }
  }
}
```

---

## 🐛 Troubleshooting

### Issue: Backend won't start - "EADDRINUSE: address already in use"

**Solution:** Kill existing processes on port 3001
```bash
# Find and kill processes
ps aux | grep "node.*main.minimal" | grep -v grep | awk '{print $2}' | xargs kill -9
# OR
ps aux | grep nest | grep -v grep | awk '{print $2}' | xargs kill -9

# Wait a few seconds
sleep 3

# Restart backend
cd backend && npm run start:minimal
```

### Issue: Supabase connection fails - "TypeError: fetch failed"

**Solution:** This was resolved by:
1. Installing `cross-fetch` package: `npm install cross-fetch --save`
2. Configuring Supabase client to use cross-fetch in `supabase.service.ts`
3. Setting `NODE_TLS_REJECT_UNAUTHORIZED=0` for development

**Root Cause:** Node.js built-in fetch (undici) has SSL/TLS compatibility issues in Docker containers. The `cross-fetch` library provides a more compatible implementation.

### Issue: Images not loading (404 errors)

**Solution:** Ensure images are in `frontend/public/images/` directory. Next.js serves files from the `public` directory at the root URL.

Example:
- File location: `frontend/public/images/logo.png`
- URL: `http://localhost:3000/images/logo.png`
- React component: `<Image src="/images/logo.png" ... />`

---

## 📊 Current System Status

### ✅ Operational Services

| Service | Status | URL | Notes |
|---------|--------|-----|-------|
| Frontend | ✅ Healthy | http://localhost:3000 | Next.js 15 + React 19 |
| Backend | ✅ Healthy | http://localhost:3001 | NestJS 11 |
| Database | ✅ Connected | Supabase Cloud | PostgreSQL with REST API |
| Cache | ✅ Healthy | Redis | In-memory caching |
| Stripe | ⚠️ Configured | - | Restricted key permissions warning (expected) |

### 🔧 Technical Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- TypeScript (strict mode)

**Backend:**
- NestJS 11
- TypeORM
- Supabase (PostgreSQL)
- Stripe
- TypeScript (strict mode)

**Infrastructure:**
- Supabase (Database + Auth)
- Stripe (Payments)
- Redis (Caching)
- Docker (Development environment)

---

## 🔐 Security Notes

### Development vs Production

**Development:**
- `NODE_TLS_REJECT_UNAUTHORIZED=0` is set for easier development
- This bypasses SSL certificate verification
- **DO NOT USE IN PRODUCTION**

**Production:**
- Remove `NODE_TLS_REJECT_UNAUTHORIZED` or set it to `1`
- Configure proper SSL/TLS certificates
- Use production Stripe keys
- Enable all security headers
- Implement rate limiting
- Enable CORS restrictions

### API Keys Security
- Never commit `.env` files to version control
- Use environment variables for all secrets
- Rotate keys regularly
- Use restricted keys when possible
- Monitor API usage and set up alerts

---

## 📝 Next Steps

Now that your platform is fully operational, you can:

1. **Add Equipment Inventory** - Use Supabase dashboard or backend API
2. **Test Booking Flow** - Create test bookings through the frontend
3. **Configure Stripe Webhooks** - Set up webhook endpoints for payment events
4. **Add Users** - Create admin and customer accounts
5. **Test Payment Processing** - Use Stripe test mode for development
6. **Deploy to Production** - Follow deployment checklist above

---

## 🆘 Support

### Health Check URLs
- Frontend: http://localhost:3000
- Backend Health: http://localhost:3001/health
- Detailed Health: http://localhost:3001/health/detailed
- Supabase Test: http://localhost:3001/health/test-supabase

### Logs
Backend logs show in the terminal where you ran `npm run start:minimal`

### Common Commands
```bash
# Check if services are running
curl http://localhost:3000
curl http://localhost:3001/health

# View backend logs
cd backend && npm run start:minimal

# Rebuild backend
cd backend && npm run build

# Run tests
cd backend && npm test
cd frontend && npm test
```

---

## ✅ Verification Checklist

Use this checklist to verify your setup:

- [ ] Frontend loads at http://localhost:3000
- [ ] Backend health check passes at http://localhost:3001/health
- [ ] Database status shows "healthy" in detailed health check
- [ ] Supabase test endpoint returns `{"success":true}`
- [ ] Equipment endpoint returns Kubota SVL-75 data
- [ ] Company logo displays in navigation and footer
- [ ] Kubota image displays in equipment showcase
- [ ] Family photos display on About page
- [ ] No console errors in browser
- [ ] No hydration mismatches

---

**Documentation Status:** ✅ Complete and Verified
**Last Test Date:** October 21, 2025
**System Health:** All Critical Services Operational


