# Kubota Rental Platform - Architecture

**Last Updated:** October 26, 2025
**Status:** ✅ Production-Ready Supabase Architecture

---

## 🏗️ System Architecture

### **Current Stack (Simplified)**

```
┌─────────────────────────────────────────────┐
│                                             │
│           FRONTEND (Next.js 15)             │
│         /frontend/ (Port 3000)              │
│                                             │
│  - React 19 + TypeScript                   │
│  - Tailwind CSS + Radix UI                 │
│  - Server Components                       │
│  - Client-side Auth                        │
│                                             │
└──────────────────┬──────────────────────────┘
                   │
                   │ Direct API Calls
                   │
                   ▼
┌─────────────────────────────────────────────┐
│                                             │
│          SUPABASE (Backend)                 │
│         supabase/ (Cloud)                   │
│                                             │
│  - PostgreSQL Database                     │
│  - Authentication (Row Level Security)     │
│  - Storage (File uploads)                  │
│  - Edge Functions                          │
│  - Realtime subscriptions                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
kubota-rental-platform/
├── frontend/                    # ✅ ACTIVE - Next.js Application
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities & Supabase client
│   │   │   └── supabase/       # Supabase configuration
│   │   └── hooks/              # Custom React hooks
│   ├── public/                 # Static assets
│   └── package.json
│
├── supabase/                    # ✅ ACTIVE - Backend Configuration
│   ├── migrations/             # Database schema migrations
│   ├── seed.sql               # Test/demo data
│   └── config.toml            # Supabase local config
│
├── .cursor/                     # ✅ ACTIVE - AI Rules & Config
│   └── rules/                  # Cursor AI development rules
│
├── docs/                        # ✅ ACTIVE - Documentation
│   ├── development/
│   ├── deployment/
│   └── setup/
│
├── scripts/                     # ✅ ACTIVE - Helper scripts
│   └── startup-services.sh
│
├── start-frontend-clean.sh      # ✅ ACTIVE - Frontend startup
├── cleanup-junk-code.sh        # 🆕 Cleanup script
├── update-gitignore.sh         # 🆕 Update .gitignore
├── fix-precommit-hooks.sh      # 🆕 Fix git hooks
│
└── README.md                    # ✅ ACTIVE - Main documentation
```

---

## 🚫 What Was Removed

### **Legacy Backend (NestJS)** ❌ Removed
```
/backend/                        # NestJS API server (replaced by Supabase)
/apps/api/                       # Monorepo NestJS duplicate
/docker/                         # Docker backend containers
docker-compose.yml              # Docker orchestration
```

**Why Removed:**
- ✅ Supabase provides all backend functionality
- ❌ NestJS had critical issues (290+ zombie processes)
- ❌ Database conflicts and configuration errors
- ❌ Unnecessary complexity for rental platform

### **Monorepo Structure** ❌ Removed
```
/apps/web/                       # Duplicate frontend
/packages/shared/                # Shared packages (had TS errors)
/packages/contracts/
/packages/testing/
/packages/config/
/packages/ui/
pnpm-workspace.yaml             # Monorepo config
turbo.json                      # Turborepo config
```

**Why Removed:**
- ✅ Standalone `/frontend` is simpler
- ❌ Monorepo complexity not needed for single app
- ❌ TypeScript errors in shared packages
- ❌ Failed pre-commit hooks

### **Archive Documentation** ❌ Removed
```
/docs/archive/                   # Old outdated documentation
/_archive/                       # Historical backups
```

**Why Removed:**
- ❌ Outdated and irrelevant
- ❌ Replaced by current docs
- ❌ Caused confusion

---

## 🔄 Data Flow

### **Authentication Flow**
```
User Login
    ↓
Frontend (Supabase Auth)
    ↓
Supabase (JWT Token)
    ↓
Frontend (Store Session)
    ↓
Protected Routes (Check Auth State)
```

### **Data Operations**
```
Frontend Component
    ↓
Supabase Client Library
    ↓
Supabase API (REST/GraphQL)
    ↓
PostgreSQL Database
    ↓
Row Level Security (RLS)
    ↓
Return Data to Frontend
```

### **File Uploads**
```
User Selects File
    ↓
Frontend (Supabase Storage)
    ↓
Supabase Storage Bucket
    ↓
Return Public URL
```

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.9
- **UI Library:** React 19
- **Styling:** Tailwind CSS 3.4
- **Components:** Radix UI (shadcn/ui)
- **State:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion

### **Backend (Supabase)**
- **Database:** PostgreSQL 15
- **Auth:** Supabase Auth (JWT + Row Level Security)
- **Storage:** Supabase Storage
- **Functions:** Edge Functions (Deno)
- **Realtime:** WebSocket subscriptions

### **DevOps**
- **Version Control:** Git + GitHub
- **Package Manager:** pnpm
- **CI/CD:** GitHub Actions
- **Deployment:** Vercel (Frontend) + Supabase Cloud
- **Monitoring:** Sentry

---

## 📊 Database Schema

Located in: `supabase/migrations/`

### **Core Tables**
- `users` - User profiles (extends Supabase auth.users)
- `equipment` - Kubota SVL-75 equipment inventory
- `bookings` - Customer rental bookings
- `payments` - Payment transactions (Stripe integration)
- `contracts` - Digital rental contracts

### **Row Level Security (RLS)**
All tables use RLS policies for security:
- Users can only access their own data
- Admin users can access all data
- Public read access for equipment listings

---

## 🚀 Development Workflow

### **Local Development**
```bash
# 1. Start Supabase (optional - can use cloud)
npx supabase start

# 2. Start Frontend
bash start-frontend-clean.sh

# Frontend runs at: http://localhost:3000
# Supabase Studio: http://localhost:54323
```

### **Making Changes**
```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes in /frontend

# 3. Test locally
npm run dev

# 4. Commit (pre-commit hooks run)
git commit -m "feat: your feature"

# 5. Push to GitHub
git push origin feature/your-feature
```

### **Database Migrations**
```bash
# Create new migration
npx supabase migration new migration_name

# Apply to local
npx supabase db reset

# Apply to production
# (automatic via Supabase dashboard)
```

---

## 🔐 Environment Variables

### **Frontend (.env.local)**
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### **Supabase (config.toml)**
```toml
[api]
port = 54321

[db]
port = 54322

[studio]
port = 54323
```

---

## 📈 Deployment

### **Frontend (Vercel)**
1. Connected to GitHub repository
2. Auto-deploys on push to `main`
3. Environment variables configured in Vercel dashboard

### **Backend (Supabase Cloud)**
1. Managed Supabase instance
2. Automatic backups
3. Edge functions deployed via CLI

---

## 🎯 Architecture Benefits

### **✅ Advantages**
- **Simpler:** No backend to maintain
- **Faster:** Direct database access
- **Cheaper:** No backend hosting costs
- **Scalable:** Supabase handles scaling
- **Secure:** Built-in RLS and auth
- **Modern:** Latest Next.js features

### **🔧 Trade-offs**
- **Vendor Lock-in:** Tied to Supabase
- **Learning Curve:** New team members learn Supabase
- **Flexibility:** Less custom backend logic

---

## 📚 Further Reading

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Frontend README](/frontend/README.md)
- [Database Migrations](/supabase/migrations/)

---

**Questions or Issues?**
Create an issue on GitHub or contact the development team.

