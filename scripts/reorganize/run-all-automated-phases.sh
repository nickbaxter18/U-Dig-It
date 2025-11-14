#!/bin/bash

# Master Script: Run All Automated Reorganization Phases
# This script executes all automated phases in sequence

set -e  # Exit on error

echo "🚀 Kubota Rental Platform - Codebase Reorganization"
echo "===================================================="
echo ""
echo "This script will run all automated phases:"
echo "  Phase 1: Documentation cleanup (5 min)"
echo "  Phase 2: Remove legacy code (2 min)"
echo "  Phase 3: Scripts reorganization (1 min)"
echo "  Phase 5: Clean duplicates (1 min + confirmation)"
echo "  Phase 8: Setup code quality tools (3 min)"
echo ""
echo "Total estimated time: ~15 minutes"
echo ""
echo "Manual phases (4, 6, 7, 9, 10) require separate execution."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Safety check
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

# Show what will be protected
echo -e "${GREEN}🛡️  PROTECTED FILES (will NOT be touched):${NC}"
echo "  ✅ start-frontend-clean.sh"
echo "  ✅ start-frontend.sh"
echo "  ✅ restart-dev-server.sh"
echo "  ✅ All source code in frontend/src/"
echo "  ✅ package.json and configs"
echo ""

# Confirm before starting
echo -e "${YELLOW}⚠️  WARNING: This will make significant changes to your codebase${NC}"
echo -e "${YELLOW}A backup branch will be created automatically.${NC}"
echo -e "${GREEN}See PROTECTED_FILES.md for complete list of protected files.${NC}"
echo ""
echo -e "${BLUE}Do you want to continue? (yes/no)${NC}"
read -r response

if [ "$response" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

# Create master backup
echo ""
echo -e "${GREEN}Creating master backup branch...${NC}"
git checkout -b backup/full-reorganization-$(date +%Y%m%d-%H%M%S)
git add .
git commit -m "Backup before full reorganization" || echo "Nothing to commit"

# Return to main working branch
git checkout -

# Track start time
start_time=$(date +%s)

# Phase 1: Documentation Cleanup
echo ""
echo "======================================"
echo -e "${BLUE}Phase 1: Documentation Cleanup${NC}"
echo "======================================"
./scripts/reorganize/phase1-docs-cleanup.sh

# Phase 2: Remove Legacy Code
echo ""
echo "======================================"
echo -e "${BLUE}Phase 2: Remove Legacy Code${NC}"
echo "======================================"
./scripts/reorganize/phase2-remove-legacy.sh

# Phase 3: Scripts Reorganization
echo ""
echo "======================================"
echo -e "${BLUE}Phase 3: Scripts Reorganization${NC}"
echo "======================================"
./scripts/reorganize/phase3-scripts-reorganization.sh

# Phase 5: Clean Duplicates
echo ""
echo "======================================"
echo -e "${BLUE}Phase 5: Clean Duplicate Files${NC}"
echo "======================================"
./scripts/reorganize/phase5-cleanup-duplicates.sh

# Phase 8: Setup Code Quality
echo ""
echo "======================================"
echo -e "${BLUE}Phase 8: Setup Code Quality Tools${NC}"
echo "======================================"
./scripts/reorganize/phase8-setup-code-quality.sh

# Calculate elapsed time
end_time=$(date +%s)
elapsed=$((end_time - start_time))
minutes=$((elapsed / 60))
seconds=$((elapsed % 60))

# Final Summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ All Automated Phases Complete!${NC}"
echo "======================================"
echo ""
echo "📊 Summary:"
echo "  ✅ Phase 1: Documentation cleanup"
echo "  ✅ Phase 2: Legacy code removed"
echo "  ✅ Phase 3: Scripts organized"
echo "  ✅ Phase 5: Duplicates cleaned"
echo "  ✅ Phase 8: Code quality tools setup"
echo ""
echo "⏱️  Total time: ${minutes}m ${seconds}s"
echo ""

# Check current state
root_md_count=$(find . -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)
echo "📈 Impact:"
echo "  • Root MD files: ${root_md_count} (was 276)"
echo "  • Documentation organized in docs/"
echo "  • Legacy code archived in _archive/"
echo "  • Scripts organized in scripts/"
echo "  • Code quality tools configured"
echo ""

echo "⏸️  Remaining Manual Phases:"
echo "  Phase 4: Component migration (6-8 hours)"
echo "  Phase 6: Infrastructure consolidation (1-2 hours)"
echo "  Phase 7: Configuration updates (2-3 hours)"
echo "  Phase 9: Testing & validation (3-4 hours)"
echo "  Phase 10: Documentation updates (2-3 hours)"
echo ""
echo "📚 See these guides:"
echo "  • scripts/reorganize/PHASE4_COMPONENT_MIGRATION_GUIDE.md"
echo "  • REORGANIZATION_QUICK_START.md"
echo ""

echo -e "${GREEN}🎯 Next Steps:${NC}"
echo "1. Review changes: git status"
echo "2. Test application: cd frontend && pnpm dev"
echo "3. Verify build: pnpm run build"
echo "4. Run tests: pnpm test"
echo "5. Commit changes: git add . && git commit -m 'Complete automated reorganization phases'"
echo "6. Continue with manual phases when ready"
echo ""
echo -e "${YELLOW}💾 Backup available at: backup/full-reorganization-*${NC}"
echo ""
echo -e "${GREEN}Congratulations! You've completed the automated phases! 🎉${NC}"

