# 🚀 Codebase Reorganization - Quick Start Guide

**Last Updated:** November 4, 2025

This is your quick reference for executing the codebase reorganization. For detailed information, see [CODEBASE_REORGANIZATION_PLAN.md](./CODEBASE_REORGANIZATION_PLAN.md).

---

## ⚡ Quick Summary

**Current State:**
- 276 MD files in root 📄
- 30+ top-level directories 📁
- 318 TypeScript files with poor organization 💻
- Legacy NestJS code (unused) 🗑️
- Duplicate files everywhere 🔄

**Goal:**
- Clean, organized, navigable codebase ✨
- Feature-based architecture 🏗️
- Single source of truth for docs 📚
- Developer-friendly structure 👥

---

## 🎯 Execution Phases (26-38 hours total)

### Phase 1: Documentation Cleanup (4-6 hours)
**What:** Archive 276 MD files into organized structure
**Risk:** Low
**Status:** Script ready ✅

```bash
# Run automated script
chmod +x scripts/reorganize/phase1-docs-cleanup.sh
./scripts/reorganize/phase1-docs-cleanup.sh

# Review results
tree docs/

# Commit
git add docs/
git commit -m "Phase 1: Organize documentation into logical structure"
```

**Expected Result:**
- `docs/archive/` - All historical progress reports
- `docs/guides/` - Developer guides
- `docs/architecture/` - System design docs
- `docs/features/` - Feature documentation
- `docs/testing/` - Test guides
- `docs/api/` - API integration docs
- <10 MD files remaining in root

---

### Phase 2: Remove Legacy Code (2-3 hours)
**What:** Archive unused NestJS backend
**Risk:** Medium (verify no active imports)
**Status:** Script ready ✅

```bash
# Run automated script
chmod +x scripts/reorganize/phase2-remove-legacy.sh
./scripts/reorganize/phase2-remove-legacy.sh

# Verify build still works
cd frontend && pnpm run build

# Commit
git add .
git commit -m "Phase 2: Archive legacy NestJS backend"
```

**Expected Result:**
- `_archive/legacy-code-YYYYMMDD/` - All legacy code safely stored
- Removed: `backend/`, `guards/`, `decorators/`, `services/`, `auth/`, `lib/`
- Frontend still builds successfully

---

### Phase 3: Reorganize Scripts (1-2 hours)
**What:** Organize 18 shell scripts into categories
**Risk:** Low
**Status:** Manual execution required

```bash
# Create script structure
mkdir -p scripts/{build,deployment,database,development,setup}

# Move scripts (examples)
git mv setup-stripe-webhook.sh scripts/deployment/
git mv start-frontend.sh scripts/development/
git mv extract_migration_sql.js scripts/database/
git mv configure-sendgrid-smtp.sh scripts/setup/

# Create scripts README
cat > scripts/README.md << 'EOF'
# Scripts Directory

## Categories
- `build/` - Build and bundle scripts
- `deployment/` - Deployment automation
- `database/` - Database migrations and utilities
- `development/` - Dev server and local setup
- `setup/` - Initial configuration scripts

## Usage
See individual script headers for documentation.
EOF

# Commit
git add scripts/
git commit -m "Phase 3: Reorganize scripts into logical categories"
```

---

### Phase 4: Reorganize Components (6-8 hours) ⚠️ MOST COMPLEX
**What:** Feature-based folder structure
**Risk:** High (lots of import updates)
**Status:** Requires careful manual execution

**Approach:** Incremental migration one feature at a time

#### Step 1: Create Feature Structure
```bash
cd frontend/src
mkdir -p features/{booking,equipment,payments,contracts,admin,auth,contest,dashboard}

# Create structure for each feature
for feature in booking equipment payments contracts admin auth contest dashboard; do
    mkdir -p features/$feature/{components,hooks,utils,types}
done
```

#### Step 2: Migrate Booking Feature (Example)
```bash
# Move booking components
mv components/BookingWidget.tsx features/booking/components/
mv components/booking/* features/booking/components/
mv components/EnhancedBookingFlow*.tsx features/booking/components/

# Update imports in these files (manual or codemod)
# Before: import { X } from '@/components/X'
# After:  import { X } from '@/features/booking/components/X'

# Test
pnpm run type-check
pnpm run dev
```

#### Step 3: Repeat for Each Feature
- Equipment (EquipmentShowcase, EquipmentSearch, AvailabilityCalendar)
- Payments (PaymentIntegration, PaymentSection, HoldPaymentModal)
- Contracts (ContractSigningSection, EnhancedContractSigner)
- Admin (AdminDashboard, all admin/* components)
- Auth (SignInForm, SignUpForm, OAuthButtons)
- Contest (SpinWheel)
- Dashboard (UserDashboard)

#### Step 4: Update TypeScript Path Aliases
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

#### Step 5: Clean Up Duplicates
```bash
# Remove backup files
rm frontend/src/components/EquipmentShowcase.backup.tsx
rm frontend/src/components/EquipmentShowcase.preview.tsx
rm frontend/src/lib/mock-api.ts.backup
```

**Commit after each feature migration:**
```bash
git add .
git commit -m "Phase 4: Migrate booking feature to features/ directory"
```

---

### Phase 5: Reorganize Lib Directory (3-4 hours)
**What:** Domain-based organization for utilities
**Risk:** Medium (import updates)
**Status:** Manual execution required

```bash
cd frontend/src/lib

# Create domain structure
mkdir -p {supabase,stripe,email,validation,security,analytics,seo,pdf,utils}

# Move files by domain
mv client.ts server.ts auth.ts api-client.ts error-handler.ts supabase/
mv stripe/* stripe/  # Already has directory
mv email-service.ts email-templates.ts email/
mv *sanitizer.ts request-validator.ts validation/
mv rate-limiter.ts device-fingerprint.ts security/
mv analytics.ts performance-monitor.ts monitoring.ts analytics/
mv seo.ts seo-metadata.ts service-area-metadata.ts seo/
mv contract-pdf-template*.ts pdf/

# Update imports
# Before: import { logger } from '@/lib/logger'
# After:  import { logger } from '@/lib/utils/logger'

# Test
pnpm run type-check
pnpm run build

# Commit
git add .
git commit -m "Phase 5: Reorganize lib directory by domain"
```

---

### Phase 6: Consolidate Infrastructure (1-2 hours)
**What:** Single infrastructure directory
**Risk:** Low
**Status:** Manual execution required

```bash
# Create consolidated structure
mkdir -p infrastructure/{docker,kubernetes,terraform,monitoring}

# Move existing infra
mv k8s/* infrastructure/kubernetes/ 2>/dev/null || true
mv infra/* infrastructure/ 2>/dev/null || true
mv monitoring/* infrastructure/monitoring/ 2>/dev/null || true
mv deployment/docker* infrastructure/docker/ 2>/dev/null || true

# Remove empty directories
rmdir k8s infra monitoring ops 2>/dev/null || true

# Create README
cat > infrastructure/README.md << 'EOF'
# Infrastructure

## Directories
- `docker/` - Docker configuration
- `kubernetes/` - K8s manifests
- `terraform/` - Infrastructure as code
- `monitoring/` - Monitoring setup
EOF

# Commit
git add .
git commit -m "Phase 6: Consolidate infrastructure into single directory"
```

---

### Phase 7: Update Configuration (2-3 hours)
**What:** Update configs for new structure
**Risk:** High (can break build)
**Status:** Critical execution

#### Update tsconfig.json
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

#### Update ESLint
```javascript
// eslint.config.mjs
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    plugins: {
      import: importPlugin
    },
    rules: {
      'import/order': ['error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index'
        ],
        'pathGroups': [
          {
            'pattern': '@/features/**',
            'group': 'internal',
            'position': 'after'
          },
          {
            'pattern': '@/components/**',
            'group': 'internal',
            'position': 'after'
          },
          {
            'pattern': '@/lib/**',
            'group': 'internal',
            'position': 'after'
          }
        ],
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }]
    }
  }
];
```

#### Run Lint Fix
```bash
cd frontend
pnpm run lint:fix
pnpm run format
```

---

### Phase 8: Code Quality (2-3 hours)
**What:** Enforce consistency
**Risk:** Low
**Status:** Automated tools

```bash
# Install import sorter
cd frontend
pnpm add -D @trivago/prettier-plugin-sort-imports

# Update .prettierrc
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "importOrder": [
    "^react",
    "^next",
    "^@/features/(.*)$",
    "^@/components/(.*)$",
    "^@/lib/(.*)$",
    "^@/hooks/(.*)$",
    "^[./]"
  ],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true
}
EOF

# Run formatters
pnpm run format
pnpm run lint:fix

# Setup pre-commit hooks
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm run lint-staged
EOF

chmod +x .husky/pre-commit

# Commit
git add .
git commit -m "Phase 8: Enforce code quality standards"
```

---

### Phase 9: Testing & Validation (3-4 hours)
**What:** Verify everything works
**Risk:** Low (just verification)
**Status:** Critical validation

```bash
# Type check
cd frontend
pnpm run type-check

# Build
pnpm run build

# Run tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Manual smoke test
pnpm run dev
# Test:
# - Homepage loads
# - Booking flow works
# - Payment flow works
# - Admin dashboard accessible
# - Auth works

# If all pass, commit
git add .
git commit -m "Phase 9: Validation complete - all tests passing"
```

---

### Phase 10: Documentation (2-3 hours)
**What:** Update all documentation
**Risk:** Low
**Status:** Final polish

Create/update these files:
- `README.md` - New structure explanation
- `CONTRIBUTING.md` - Coding standards
- `docs/guides/DEVELOPER_ONBOARDING.md` - How to navigate codebase
- `docs/architecture/ARCHITECTURE.md` - System overview

---

## 🚨 Emergency Rollback

If anything goes wrong:

```bash
# Method 1: Rollback to backup branch
git checkout backup/pre-reorganization

# Method 2: Use tag
git checkout v1.0-pre-cleanup

# Method 3: Revert specific commits
git revert <commit-hash>

# Method 4: Restore from archive
cp -r _archive/legacy-code-YYYYMMDD/* .
```

---

## ✅ Validation Checklist

Before considering reorganization complete:

- [ ] All TypeScript files compile (`pnpm type-check`)
- [ ] Frontend builds successfully (`pnpm run build`)
- [ ] All tests pass (`pnpm test`)
- [ ] E2E tests pass (`pnpm test:e2e`)
- [ ] Dev server starts without errors (`pnpm dev`)
- [ ] <10 MD files in root directory
- [ ] <10 top-level directories
- [ ] All components in feature directories
- [ ] All scripts categorized
- [ ] Documentation index created
- [ ] No duplicate/backup files
- [ ] Import paths all working
- [ ] Pre-commit hooks set up

---

## 📊 Progress Tracking

| Phase | Status | Time Spent | Notes |
|-------|--------|------------|-------|
| 1. Docs Cleanup | ⏸️ Not Started | 0h | Script ready |
| 2. Remove Legacy | ⏸️ Not Started | 0h | Script ready |
| 3. Scripts | ⏸️ Not Started | 0h | Manual |
| 4. Components | ⏸️ Not Started | 0h | High risk |
| 5. Lib | ⏸️ Not Started | 0h | Medium risk |
| 6. Infrastructure | ⏸️ Not Started | 0h | Low risk |
| 7. Configuration | ⏸️ Not Started | 0h | High risk |
| 8. Code Quality | ⏸️ Not Started | 0h | Automated |
| 9. Testing | ⏸️ Not Started | 0h | Critical |
| 10. Documentation | ⏸️ Not Started | 0h | Final polish |

---

## 🎯 Daily Goals

### Day 1 (6-8 hours)
- [x] Review plan
- [ ] Phase 1: Documentation cleanup
- [ ] Phase 2: Remove legacy code
- [ ] Phase 3: Reorganize scripts

### Day 2 (8 hours)
- [ ] Phase 4: Start component reorganization (booking, equipment)
- [ ] Phase 4: Continue (payments, contracts)

### Day 3 (8 hours)
- [ ] Phase 4: Finish components (admin, auth, contest, dashboard)
- [ ] Phase 5: Reorganize lib directory
- [ ] Phase 6: Consolidate infrastructure

### Day 4 (6-8 hours)
- [ ] Phase 7: Update configuration
- [ ] Phase 8: Code quality tools
- [ ] Phase 9: Testing & validation
- [ ] Phase 10: Documentation

---

## 📞 Need Help?

- **Detailed Plan:** [CODEBASE_REORGANIZATION_PLAN.md](./CODEBASE_REORGANIZATION_PLAN.md)
- **Issues:** Check existing imports before moving files
- **Stuck?:** Create backup, rollback, review logs

---

**Status:** Ready to Execute ✅
**Estimated Completion:** 4 days (26-38 hours)
**Risk Level:** Medium (with proper backups and testing)

**Good luck! 🚀**


