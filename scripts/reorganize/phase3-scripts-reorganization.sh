#!/bin/bash

# Phase 3: Scripts Reorganization
# This script organizes shell scripts into logical categories

set -e  # Exit on error

echo "📁 Starting Phase 3: Scripts Reorganization"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Safety check
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

# Create backup
echo -e "${YELLOW}Creating backup branch...${NC}"
git checkout -b backup/scripts-reorg-$(date +%Y%m%d-%H%M%S) || true
git add . || true
git commit -m "Backup before scripts reorganization" || true

# Create new script structure
echo -e "${GREEN}Creating script directory structure...${NC}"
mkdir -p scripts/{build,deployment,database,development,setup,testing,monitoring}

# Move build scripts
echo -e "${GREEN}Organizing build scripts...${NC}"
[ -f "cleanup-junk-code.sh" ] && git mv cleanup-junk-code.sh scripts/development/ 2>/dev/null || true

# Move deployment scripts
echo -e "${GREEN}Organizing deployment scripts...${NC}"
[ -f "setup-stripe-webhook.sh" ] && git mv setup-stripe-webhook.sh scripts/deployment/ 2>/dev/null || true
[ -f "CREATE_STRIPE_WEBHOOK.sh" ] && git mv CREATE_STRIPE_WEBHOOK.sh scripts/deployment/ 2>/dev/null || true
[ -f "deploy_all_migrations.sh" ] && git mv deploy_all_migrations.sh scripts/deployment/ 2>/dev/null || true

# Move database scripts
echo -e "${GREEN}Organizing database scripts...${NC}"
[ -f "extract_migration_sql.js" ] && git mv extract_migration_sql.js scripts/database/ 2>/dev/null || true
[ -f "apply_migrations_manually.sql" ] && git mv apply_migrations_manually.sql scripts/database/ 2>/dev/null || true
[ -f "apply_migrations_to_cloud.js" ] && git mv apply_migrations_to_cloud.js scripts/database/ 2>/dev/null || true

# Move development scripts
echo -e "${GREEN}Organizing development scripts...${NC}"

# ⚠️ CRITICAL: DO NOT MOVE THESE STARTUP SCRIPTS (used by Cursor on startup)
echo -e "${YELLOW}Skipping protected startup scripts:${NC}"
echo "  - start-frontend-clean.sh (PROTECTED - used by Cursor)"
echo "  - start-frontend.sh (PROTECTED - standard startup)"
echo "  - restart-dev-server.sh (PROTECTED - may be in use)"

# Only move non-critical utility scripts
[ -f "fix-precommit-hooks.sh" ] && git mv fix-precommit-hooks.sh scripts/development/ 2>/dev/null || true

# Move setup scripts
echo -e "${GREEN}Organizing setup scripts...${NC}"
[ -f "setup-supabase-frontend.sh" ] && git mv setup-supabase-frontend.sh scripts/setup/ 2>/dev/null || true
[ -f "configure-sendgrid-smtp.sh" ] && git mv configure-sendgrid-smtp.sh scripts/setup/ 2>/dev/null || true
[ -f "setup-stripe-webhook.sh" ] && git mv setup-stripe-webhook.sh scripts/setup/ 2>/dev/null || true

# Move frontend scripts to frontend directory
echo -e "${GREEN}Organizing frontend-specific scripts...${NC}"
if [ -d "frontend/scripts" ]; then
    echo "Frontend scripts directory already organized"
else
    mkdir -p frontend/scripts
fi

# Create comprehensive scripts README
echo -e "${GREEN}Creating scripts documentation...${NC}"
cat > scripts/README.md << 'EOF'
# Scripts Directory

Organized utility scripts for development, deployment, and maintenance.

## 📁 Directory Structure

### `build/`
Build and bundle scripts for production deployment.

**Scripts:**
- (To be added)

**Usage:**
```bash
./scripts/build/build-production.sh
```

---

### `deployment/`
Deployment automation and infrastructure scripts.

**Scripts:**
- `setup-stripe-webhook.sh` - Configure Stripe webhooks
- `CREATE_STRIPE_WEBHOOK.sh` - Create Stripe webhook endpoint
- `deploy_all_migrations.sh` - Deploy all database migrations

**Usage:**
```bash
# Setup Stripe webhook
./scripts/deployment/setup-stripe-webhook.sh

# Deploy migrations
./scripts/deployment/deploy_all_migrations.sh
```

---

### `database/`
Database migration and utility scripts.

**Scripts:**
- `extract_migration_sql.js` - Extract migration SQL from files
- `apply_migrations_manually.sql` - Manual migration application
- `apply_migrations_to_cloud.js` - Apply migrations to cloud database

**Usage:**
```bash
# Extract migration SQL
node scripts/database/extract_migration_sql.js

# Apply migrations
node scripts/database/apply_migrations_to_cloud.js
```

---

### `development/`
Development server and local environment scripts.

**Scripts:**
- `start-frontend.sh` - Start frontend development server
- `start-frontend-clean.sh` - Start frontend with clean cache
- `restart-dev-server.sh` - Restart development server
- `fix-precommit-hooks.sh` - Fix pre-commit hook issues
- `cleanup-junk-code.sh` - Clean up temporary files

**Usage:**
```bash
# Start dev server
./scripts/development/start-frontend.sh

# Clean restart
./scripts/development/start-frontend-clean.sh

# Fix hooks
./scripts/development/fix-precommit-hooks.sh
```

---

### `setup/`
Initial project setup and configuration scripts.

**Scripts:**
- `setup-supabase-frontend.sh` - Configure Supabase for frontend
- `configure-sendgrid-smtp.sh` - Configure SendGrid email
- `setup-stripe-webhook.sh` - Setup Stripe webhook integration

**Usage:**
```bash
# First-time setup
./scripts/setup/setup-supabase-frontend.sh
./scripts/setup/configure-sendgrid-smtp.sh
```

---

### `testing/`
Test execution and validation scripts.

**Scripts:**
- (Frontend test scripts in `frontend/scripts/`)

**Usage:**
```bash
# Run tests
cd frontend
./scripts/browser-test.ts
```

---

### `monitoring/`
Monitoring and alerting scripts.

**Scripts:**
- (To be added - see root `scripts/monitoring-alerts.js`)

---

### `reorganize/`
Codebase reorganization automation scripts.

**Scripts:**
- `phase1-docs-cleanup.sh` - Organize documentation
- `phase2-remove-legacy.sh` - Remove legacy code
- `phase3-scripts-reorganization.sh` - Reorganize scripts (this script!)
- `README.md` - Scripts documentation

**Usage:**
```bash
# Run reorganization phases
./scripts/reorganize/phase1-docs-cleanup.sh
./scripts/reorganize/phase2-remove-legacy.sh
./scripts/reorganize/phase3-scripts-reorganization.sh
```

---

## 🔧 Common Tasks

### Start Development Server
```bash
./scripts/development/start-frontend.sh
```

### Deploy to Production
```bash
# 1. Build
pnpm run build

# 2. Deploy migrations
./scripts/deployment/deploy_all_migrations.sh

# 3. Deploy (handled by Vercel on git push)
```

### Setup New Environment
```bash
# 1. Install dependencies
pnpm install

# 2. Setup Supabase
./scripts/setup/setup-supabase-frontend.sh

# 3. Configure services
./scripts/setup/configure-sendgrid-smtp.sh
./scripts/setup/setup-stripe-webhook.sh
```

---

## 📝 Script Naming Conventions

- Use kebab-case: `my-script.sh`
- Descriptive names: `setup-stripe-webhook.sh` not `stripe.sh`
- Include action: `deploy-`, `setup-`, `start-`, `fix-`
- Include target: `-frontend`, `-database`, `-server`

---

## 🛡️ Safety Guidelines

1. **Always backup** before destructive operations
2. **Test in development** before production
3. **Use set -e** to exit on errors
4. **Validate inputs** before execution
5. **Log operations** for debugging

---

## 🔄 Adding New Scripts

When adding a new script:

1. Create in appropriate subdirectory
2. Make executable: `chmod +x script-name.sh`
3. Add shebang: `#!/bin/bash`
4. Add description comment at top
5. Update this README with usage
6. Test thoroughly before committing

Example:
```bash
#!/bin/bash
# Deploy frontend to production
# Usage: ./scripts/deployment/deploy-frontend.sh

set -e

echo "Deploying frontend..."
# ... implementation
```

---

## 📚 Related Documentation

- [Deployment Guide](../../docs/guides/DEPLOYMENT.md)
- [Developer Onboarding](../../docs/guides/DEVELOPER_ONBOARDING.md)
- [Troubleshooting](../../docs/testing/TROUBLESHOOTING.md)

---

**Last Updated:** November 4, 2025
EOF

# Make all scripts executable
echo -e "${GREEN}Making scripts executable...${NC}"
find scripts -type f -name "*.sh" -exec chmod +x {} \;

# Summary
echo ""
echo -e "${GREEN}✅ Phase 3 Complete!${NC}"
echo ""
echo "📊 Summary:"
echo "==========="

build_count=$(find scripts/build -type f 2>/dev/null | wc -l)
echo "Build scripts: $build_count"

deploy_count=$(find scripts/deployment -type f 2>/dev/null | wc -l)
echo "Deployment scripts: $deploy_count"

db_count=$(find scripts/database -type f 2>/dev/null | wc -l)
echo "Database scripts: $db_count"

dev_count=$(find scripts/development -type f 2>/dev/null | wc -l)
echo "Development scripts: $dev_count"

setup_count=$(find scripts/setup -type f 2>/dev/null | wc -l)
echo "Setup scripts: $setup_count"

root_scripts=$(find . -maxdepth 1 -name "*.sh" 2>/dev/null | wc -l)
echo "Remaining in root: $root_scripts"

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Review scripts/ directory structure"
echo "2. Update any hardcoded script paths in code"
echo "3. Test a few scripts to ensure they still work"
echo "4. Commit: git add scripts/ && git commit -m 'Phase 3: Reorganize scripts'"
echo "5. Continue to Phase 4: Reorganize Components"

