#!/bin/bash

# Phase 2: Remove Legacy NestJS Backend
# This script safely archives unused legacy code

set -e  # Exit on error

echo "🧹 Starting Phase 2: Remove Legacy Code"
echo "========================================"

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
git checkout -b backup/legacy-removal-$(date +%Y%m%d-%H%M%S) || true
git add . || true
git commit -m "Backup before legacy code removal" || true

# Create archive directory
echo -e "${GREEN}Creating archive directory...${NC}"
mkdir -p _archive/legacy-code-$(date +%Y%m%d)

# Legacy directories to archive (DEPRECATED NestJS backend)
LEGACY_DIRS=(
    "backend"
    "guards"
    "decorators"
    "services"
    "auth"
    "lib"
)

# Verify these directories aren't referenced in active code
echo -e "${YELLOW}Verifying directories are safe to archive...${NC}"

for dir in "${LEGACY_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${YELLOW}Checking references to $dir...${NC}"

        # Check for imports in frontend
        if grep -r "from.*['\"].*$dir" frontend/src 2>/dev/null; then
            echo -e "${RED}ERROR: Found active references to $dir in frontend/src${NC}"
            echo -e "${RED}Cannot safely archive. Please update imports first.${NC}"
            exit 1
        fi

        # Check for imports in scripts
        if grep -r "$dir" scripts/*.{sh,js,ts} 2>/dev/null; then
            echo -e "${RED}WARNING: Found references to $dir in scripts${NC}"
            echo -e "${YELLOW}Review and update scripts before continuing.${NC}"
        fi

        echo -e "${GREEN}✓ $dir appears safe to archive${NC}"
    fi
done

# Archive legacy directories
echo -e "${GREEN}Archiving legacy directories...${NC}"

for dir in "${LEGACY_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${YELLOW}Moving $dir to archive...${NC}"
        mv "$dir" "_archive/legacy-code-$(date +%Y%m%d)/"
    else
        echo -e "${YELLOW}$dir not found, skipping...${NC}"
    fi
done

# Remove other legacy artifacts
echo -e "${GREEN}Removing legacy configuration files...${NC}"

# Legacy docker files
[ -f "docker-compose.yml.backup" ] && mv docker-compose.yml.backup _archive/legacy-code-$(date +%Y%m%d)/

# Legacy config directories
[ -d "test-env" ] && mv test-env _archive/legacy-code-$(date +%Y%m%d)/
[ -d "test-data" ] && mv test-data _archive/legacy-code-$(date +%Y%m%d)/

# Create archive README
echo -e "${GREEN}Creating archive documentation...${NC}"
cat > "_archive/legacy-code-$(date +%Y%m%d)/README.md" << EOF
# Legacy Code Archive

**Archived:** $(date +"%Y-%m-%d %H:%M:%S")
**Reason:** Migration from NestJS backend to Supabase-only architecture

## Archived Directories

$(for dir in "${LEGACY_DIRS[@]}"; do
    if [ -d "_archive/legacy-code-$(date +%Y%m%d)/$dir" ]; then
        echo "- \`$dir/\` - Legacy NestJS code"
    fi
done)

## Context

The Kubota Rental Platform originally used a NestJS backend with TypeORM.
In October 2025, we migrated to a Supabase-only architecture for:

- Better scalability
- Reduced infrastructure complexity
- Real-time capabilities
- Built-in auth and storage
- PostgreSQL expertise
- Cost reduction

## Recovery

If you need to reference this code:

\`\`\`bash
# View archived code
cd _archive/legacy-code-$(date +%Y%m%d)/

# Restore if absolutely necessary (not recommended)
git checkout <backup-tag>
\`\`\`

## Current Architecture

See: \`docs/architecture/ARCHITECTURE.md\`

Current stack:
- Frontend: Next.js 16 + React 19
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Payments: Stripe
- Email: SendGrid
- Hosting: Vercel

---

**DO NOT** restore this code unless absolutely necessary.
The new architecture is superior in every way.
EOF

# Summary
echo ""
echo -e "${GREEN}✅ Phase 2 Complete!${NC}"
echo ""
echo "📊 Summary:"
echo "==========="
echo "Archived directories:"
for dir in "${LEGACY_DIRS[@]}"; do
    if [ -d "_archive/legacy-code-$(date +%Y%m%d)/$dir" ]; then
        size=$(du -sh "_archive/legacy-code-$(date +%Y%m%d)/$dir" | cut -f1)
        echo "  - $dir ($size)"
    fi
done

archive_size=$(du -sh "_archive/legacy-code-$(date +%Y%m%d)" | cut -f1)
echo ""
echo "Total archived: $archive_size"

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Review archived directories in _archive/"
echo "2. Verify frontend still builds: pnpm run build"
echo "3. Run tests: pnpm test"
echo "4. Commit changes: git add . && git commit -m 'Phase 2: Archive legacy code'"
echo "5. Continue to Phase 3: Reorganize Scripts"


