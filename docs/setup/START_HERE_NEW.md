# 👋 Welcome to the Kubota Rental Platform

**Status:** ✅ Fully Operational
**Last Updated:** November 2025

---

## 🚀 Get Started in 3 Steps

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Copy environment template**
   ```bash
   cp frontend/.env.example frontend/.env.local
   # Fill in Supabase, Stripe, SendGrid keys
   ```

3. **Start the dev server**
   ```bash
   bash start-frontend-clean.sh
   ```

Your app will be available at **http://localhost:3000**.

---

## 🧭 Where to Look First

| Need | Start Here |
| --- | --- |
| Project overview | `README.md` |
| Step-by-step setup | `docs/setup/SETUP_GUIDE.md` |
| Environment variables | `frontend/.env.example` |
| Supabase schema | `supabase/migrations/` + `supabase/types.ts` |
| Component patterns | `AI_CODING_REFERENCE.md` & `COMPONENT_INDEX.md` |

---

## 🔧 Useful Commands

```bash
bash start-frontend-clean.sh   # start dev server (always use this)
pnpm supabase:start            # optional: local Supabase stack
cd frontend && pnpm type-check # TypeScript
pnpm lint                      # lint whole workspace
cd frontend && pnpm test       # unit/integration tests
cd frontend && pnpm test:e2e   # Playwright
```

---

## ❗ Having Trouble?

```bash
# Port already in use
lsof -ti:3000 | xargs kill -9

# Reset local Supabase
pnpm supabase:stop && pnpm supabase:start

# Stale cache
cd frontend && pnpm clean
```

Still stuck? Run `node scripts/verify-agent-system.mjs` or check `docs/troubleshooting/TROUBLESHOOTING.md`.

---

Welcome aboard! 🎉 The Supabase-first architecture means no backend server to juggle—focus on the Next.js frontend, leverage Supabase MCP tools for database work, and ship confidently. +#+
# 👋 Welcome to the Kubota Rental Platform

**Status:** ✅ Fully Operational | **Last Updated:** October 21, 2025

---

## 🚀 Get Started in 3 Steps

### 1. Read the Overview
Start with **[README.md](./README.md)** to understand what this platform does.

### 2. Set Up Your Environment
Follow **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for complete setup instructions.

### 3. Start Developing
```bash
# Terminal 1
cd frontend && npm run dev

# Terminal 2
cd backend && npm run start:minimal
```

**Done!** Your platform is running at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## 📖 Documentation Guide

### For First-Time Setup
1. **[README.md](./README.md)** - Project overview, features, and tech stack
2. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
3. **[CURRENT_SETUP_STATUS.md](./CURRENT_SETUP_STATUS.md)** - Current system status

### When You Have Problems
1. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
2. Check backend terminal for error messages
3. Check browser console (F12) for frontend errors
4. Verify health: `curl http://localhost:3001/health`

### For Development
1. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute code
2. **[TESTING.md](./TESTING.md)** - Testing guidelines
3. **[backend/DATABASE_SETUP.md](./backend/DATABASE_SETUP.md)** - Database schema
4. **[CHANGELOG.md](./CHANGELOG.md)** - Version history

### For Deployment
1. **[PRODUCTION-DEPLOYMENT.md](./PRODUCTION-DEPLOYMENT.md)** - Deployment guide
2. **[SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)** - Supabase configuration
3. Security checklist in SETUP_GUIDE.md

---

## ⚡ Quick Commands

### Start Services
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run start:minimal
```

### Health Checks
```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:3001/health

# Database
curl http://localhost:3001/health/test-supabase

# Full System
curl http://localhost:3001/health/detailed
```

### Stop Services
```bash
# Stop backend properly
pkill -9 -f nest

# Stop frontend
# Use Ctrl+C in the terminal running npm run dev
```

---

## 🎯 What to Do Next

### If You're Setting Up for the First Time
👉 Go to **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**

### If Services Are Already Running
👉 Open http://localhost:3000 in your browser

### If You're Having Issues
👉 Check **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

### If You Want to Contribute
👉 Read **[CONTRIBUTING.md](./CONTRIBUTING.md)**

---

## 🔍 System Status Summary

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ Running | http://localhost:3000 |
| Backend | ✅ Running | http://localhost:3001 |
| Database | ✅ Connected | Supabase Cloud |
| Payments | ✅ Configured | Stripe API |

**All systems operational!** 🎉

---

## 💡 Pro Tips

1. **Always check health first:**
   ```bash
   curl http://localhost:3001/health/detailed
   ```

2. **If backend won't start, check port 3001:**
   ```bash
   ps aux | grep nest
   pkill -9 -f nest  # Kill if needed
   ```

3. **Keep terminal windows organized:**
   - Terminal 1: Frontend logs
   - Terminal 2: Backend logs
   - Terminal 3: Commands and testing

4. **Use browser DevTools (F12):**
   - Console tab: See frontend errors
   - Network tab: See API calls
   - Application tab: Check local storage

---

## 🆘 Need Help?

### Quick Diagnostics
```bash
# Check if services are running
curl -I http://localhost:3000
curl http://localhost:3001/health

# Check backend logs for errors
# (View the terminal where you ran npm run start:minimal)

# Check frontend logs
# (View the terminal where you ran npm run dev)
```

### Common Issues
1. **"Port 3001 already in use"** → See TROUBLESHOOTING.md, Issue #1
2. **"Supabase connection failed"** → See TROUBLESHOOTING.md, Issue #2
3. **Images not loading (404)** → See TROUBLESHOOTING.md, "Images Return 404 Errors"

### Still Stuck?
Check **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for detailed solutions.

---

**Platform Status:** ✅ All Systems Operational
**Documentation:** ✅ Up to Date
**Ready For:** Development, Testing, Deployment Preparation


