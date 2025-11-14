# Quick Commands Reference

Essential commands for AI coding assistance.

---

## 🚀 Server Management

### Start Frontend (MANDATORY)
```bash
bash start-frontend-clean.sh
```
**⚠️ ALWAYS use this script - never `pnpm dev` directly!**

### Check Server Status
```bash
curl http://localhost:3000/api/health
```

---

## 🔍 Type Checking

```bash
# Type check all
pnpm type-check

# Type check verbose
pnpm type-check:verbose

# Type check specific package
pnpm --filter @kubota-rental/web run type-check
```

---

## 🧹 Linting & Formatting

```bash
# Lint all
pnpm lint

# Lint and fix
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

---

## 🧪 Testing

```bash
# Frontend unit & integration tests
cd frontend && pnpm test

# Vitest watch mode
cd frontend && pnpm test:watch

# Coverage report
cd frontend && pnpm test:coverage

# Playwright end-to-end tests
cd frontend && pnpm test:e2e

# Accessibility (axe) suite
cd frontend && pnpm test:accessibility
```

---

## 🗄️ Supabase Operations

```bash
# Start Supabase locally
pnpm supabase:start

# Stop Supabase
pnpm supabase:stop

# Check status
pnpm supabase:status

# Reset database (with seed)
pnpm supabase:reset

# Generate TypeScript types
# Use: mcp_supabase_generate_typescript_types
```

---

## 🏗️ Build Commands

```bash
# Production build
cd frontend && pnpm build

# Validate build without output
cd frontend && pnpm build:check
```

---

## 📦 Package Management

```bash
# Install all dependencies
pnpm install

# Clean install
pnpm install --frozen-lockfile

# Clean cache
pnpm cache:clean

# Update dependencies
pnpm update
```

---

## 🔧 Development Tools

```bash
# Analyze bundle
cd frontend && pnpm test:bundle-analyze
```

---

## 🧹 Cleanup

```bash
# Clean frontend build artifacts
cd frontend && pnpm clean
```

---

## 🔍 Database Queries (Supabase MCP)

### List Tables
```typescript
// Tool: mcp_supabase_list_tables
mcp_supabase_list_tables({ schemas: ['public'] })
```

### Execute SQL
```typescript
// Tool: mcp_supabase_execute_sql
mcp_supabase_execute_sql({ query: 'SELECT * FROM bookings LIMIT 10' })
```

### Apply Migration
```typescript
// Tool: mcp_supabase_apply_migration
mcp_supabase_apply_migration({
  name: 'add_index',
  query: 'CREATE INDEX...'
})
```

### Check Advisors
```typescript
// Security issues
mcp_supabase_get_advisors({ type: 'security' })

// Performance issues
mcp_supabase_get_advisors({ type: 'performance' })
```

### Get Logs
```typescript
// API logs
mcp_supabase_get_logs({ service: 'api' })

// Auth logs
mcp_supabase_get_logs({ service: 'auth' })
```

---

## 🧪 Browser Testing

### Login Sequence
```typescript
// 1. Navigate to sign-in
browser_navigate("http://localhost:3000/auth/signin")

// 2. Click "Sign in with email"
browser_click("Sign in with email button", ref)

// 3. Fill form
browser_fill_form([
  { name: "Email Address", value: "aitest2@udigit.ca" },
  { name: "Password", value: "TestAI2024!@#$" }
])

// 4. Submit
browser_click("Sign In button", ref)

// 5. Verify
browser_wait_for("Welcome back, AI!")
```

---

## 📊 Useful One-Liners

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)

# Check TypeScript errors
pnpm type-check 2>&1 | grep -i error

# Find all console.log statements
grep -r "console.log" frontend/src --exclude-dir=node_modules

# Count components
find frontend/src/components -name "*.tsx" | wc -l

# Find unused imports (requires tool)
pnpm lint 2>&1 | grep "is defined but never used"
```

---

## 🐛 Debugging

```bash
# Check Next.js build errors
pnpm build 2>&1 | tee build-errors.log

# Check for TypeScript errors in specific file
pnpm type-check 2>&1 | grep "filename.tsx"

# View Supabase logs
pnpm supabase:status

# Check environment variables
cat .env.local | grep -v "SECRET\|KEY\|PASSWORD"
```

---

## 📝 Code Quality Checks

```bash
# Run all quality checks
pnpm ci  # lint + type-check + test:smoke

# Check test coverage
pnpm test:coverage:check

# Validate environment
pnpm validate:environment

# Check dependencies
pnpm validate:dependencies
```

---

## 🚨 Emergency Commands

```bash
# Kill all Node processes
pkill -f node

# Kill all Next.js processes
pkill -f "next dev"

# Reset everything (nuclear option)
pnpm clean && rm -rf node_modules && pnpm install
```

---

## 📚 Documentation

```bash
# View this file
cat QUICK_COMMANDS.md

# View coding reference
cat AI_CODING_REFERENCE.md

# View component index
cat COMPONENT_INDEX.md

# View API routes
cat API_ROUTES_INDEX.md
```

---

**Last Updated**: November 2025


