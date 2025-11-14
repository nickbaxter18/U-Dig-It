#!/bin/bash

# Phase 1: Documentation Cleanup
# This script organizes 276 markdown files into a logical structure

set -e  # Exit on error

echo "🏗️  Starting Phase 1: Documentation Cleanup"
echo "================================================"

# Colors for output
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
git checkout -b backup/docs-cleanup-$(date +%Y%m%d-%H%M%S) || true
git add . || true
git commit -m "Backup before docs cleanup" || true

# Create new directory structure
echo -e "${GREEN}Creating new documentation structure...${NC}"
mkdir -p docs/{archive/{2025-10,2025-11},guides,architecture,features,testing,api}

# Archive progress reports by pattern
echo -e "${GREEN}Archiving progress reports...${NC}"

# Move completion reports (✅)
mv ✅_* docs/archive/2025-11/ 2>/dev/null || echo "No ✅ files found"

# Move celebration reports (🎉, 🎊, 🏆)
mv 🎉_* docs/archive/2025-11/ 2>/dev/null || echo "No 🎉 files found"
mv 🎊_* docs/archive/2025-11/ 2>/dev/null || echo "No 🎊 files found"
mv 🏆_* docs/archive/2025-11/ 2>/dev/null || echo "No 🏆 files found"

# Move summary reports (📋, 🎯)
mv 📋_* docs/archive/2025-11/ 2>/dev/null || echo "No 📋 files found"
mv 🎯_* docs/archive/2025-11/ 2>/dev/null || echo "No 🎯 files found"

# Move specific dated files
mv *_OCT27_* docs/archive/2025-10/ 2>/dev/null || echo "No October files found"
mv *_OCT26_* docs/archive/2025-10/ 2>/dev/null || echo "No October 26 files found"
mv *_OCTOBER_* docs/archive/2025-10/ 2>/dev/null || echo "No October files found"
mv *_NOV_3_* docs/archive/2025-11/ 2>/dev/null || echo "No Nov 3 files found"
mv *_NOV_4_* docs/archive/2025-11/ 2>/dev/null || echo "No Nov 4 files found"

# Move COMPLETE, SUCCESS, FINAL files
mv *_COMPLETE*.md docs/archive/2025-11/ 2>/dev/null || echo "No complete files found"
mv *_SUCCESS*.md docs/archive/2025-11/ 2>/dev/null || echo "No success files found"
mv *_FINAL*.md docs/archive/2025-11/ 2>/dev/null || echo "No final files found"

# Move technical documentation to appropriate folders
echo -e "${GREEN}Categorizing technical documentation...${NC}"

# Architecture docs
mv ARCHITECTURE.md docs/architecture/ 2>/dev/null || echo "ARCHITECTURE.md not found"
mv MIGRATION_GUIDE.md docs/architecture/ 2>/dev/null || echo "MIGRATION_GUIDE.md not found"
mv DATABASE_VERIFICATION_SUITE.md docs/architecture/ 2>/dev/null || echo "DATABASE_VERIFICATION_SUITE.md not found"
mv DATABASE_FUNCTION_SECURITY_ANALYSIS.md docs/architecture/ 2>/dev/null || echo "DATABASE_FUNCTION_SECURITY_ANALYSIS.md not found"

# Testing docs
mv BROWSER_TESTING_GUIDE.md docs/testing/ 2>/dev/null || echo "BROWSER_TESTING_GUIDE.md not found"
mv BROWSER_TESTING_SETUP.md docs/testing/ 2>/dev/null || echo "BROWSER_TESTING_SETUP.md not found"
mv MANUAL_TEST_INSTRUCTIONS.md docs/testing/ 2>/dev/null || echo "MANUAL_TEST_INSTRUCTIONS.md not found"
mv AI_TESTING_CAPABILITIES.md docs/testing/ 2>/dev/null || echo "AI_TESTING_CAPABILITIES.md not found"
mv *TEST*.md docs/testing/ 2>/dev/null || echo "No test files found"

# Feature docs
mv *_SYSTEM*.md docs/features/ 2>/dev/null || echo "No system docs found"
mv *_IMPLEMENTATION*.md docs/features/ 2>/dev/null || echo "No implementation docs found"
mv SPIN_WHEEL*.md docs/features/ 2>/dev/null || echo "No spin wheel docs found"
mv PAYMENT*.md docs/features/ 2>/dev/null || echo "No payment docs found"
mv BOOKING*.md docs/features/ 2>/dev/null || echo "No booking docs found"
mv ADMIN*.md docs/features/ 2>/dev/null || echo "No admin docs found"
mv CONTRACT*.md docs/features/ 2>/dev/null || echo "No contract docs found"
mv HOLD_SYSTEM*.md docs/features/ 2>/dev/null || echo "No hold system docs found"

# API docs
mv SUPABASE*.md docs/api/ 2>/dev/null || echo "No Supabase docs found"
mv STRIPE*.md docs/api/ 2>/dev/null || echo "No Stripe docs found"
mv *API*.md docs/api/ 2>/dev/null || echo "No API docs found"

# Guide docs
mv QUICK_START*.md docs/guides/ 2>/dev/null || echo "No quick start found"
mv STARTUP*.md docs/guides/ 2>/dev/null || echo "No startup docs found"
mv START_HERE.md docs/guides/QUICK_START.md 2>/dev/null || echo "START_HERE.md not found"
mv README_*.md docs/guides/ 2>/dev/null || echo "No README_ files found"
mv *DEPLOYMENT*.md docs/guides/ 2>/dev/null || echo "No deployment docs found"
mv *SETUP*.md docs/guides/ 2>/dev/null || echo "No setup docs found"

# Move session summaries and reports to archive
mv SESSION*.md docs/archive/2025-11/ 2>/dev/null || echo "No session docs found"
mv AUDIT*.md docs/archive/2025-11/ 2>/dev/null || echo "No audit docs found"
mv PROGRESS_REPORT*.md docs/archive/2025-11/ 2>/dev/null || echo "No progress reports found"
mv COMPREHENSIVE*.md docs/archive/2025-11/ 2>/dev/null || echo "No comprehensive docs found"

# Create archive index
echo -e "${GREEN}Creating archive index...${NC}"
cat > docs/archive/index.md << 'EOF'
# Documentation Archive

This directory contains historical documentation, progress reports, and completed status updates.

## Directory Structure

- `2025-10/` - October 2025 progress reports and updates
- `2025-11/` - November 2025 progress reports and updates

## File Naming Conventions

- `✅_*` - Completion reports
- `🎉_*` - Success/celebration reports
- `🎊_*` - Final achievement reports
- `🏆_*` - Final verification reports
- `📋_*` - Session summaries
- `🎯_*` - Action plans and targets

## When to Archive

Documents should be moved to archive when:
1. They represent completed work (not ongoing reference)
2. They are progress reports or status updates
3. They document temporary issues that have been resolved
4. They are historical implementation records

## Active Documentation

For current, active documentation, see:
- `/docs/guides/` - Developer and user guides
- `/docs/architecture/` - System architecture documentation
- `/docs/features/` - Feature-specific documentation
- `/docs/testing/` - Testing guides and procedures
- `/docs/api/` - API integration documentation
EOF

# Create main docs README
echo -e "${GREEN}Creating documentation index...${NC}"
cat > docs/README.md << 'EOF'
# Kubota Rental Platform - Documentation

Welcome to the comprehensive documentation for the Kubota Rental Platform.

## 📚 Documentation Structure

### 🎯 [Guides](./guides/)
Developer and user guides for getting started and working with the platform.

- [Quick Start Guide](./guides/QUICK_START.md)
- [Developer Onboarding](./guides/DEVELOPER_ONBOARDING.md)
- [Deployment Guide](./guides/DEPLOYMENT.md)
- [Troubleshooting](./guides/TROUBLESHOOTING.md)

### 🏗️ [Architecture](./architecture/)
System architecture, database schemas, and design decisions.

- [System Architecture](./architecture/ARCHITECTURE.md)
- [Database Schema](./architecture/DATABASE_VERIFICATION_SUITE.md)
- [Migration Guide](./architecture/MIGRATION_GUIDE.md)
- [Security Analysis](./architecture/DATABASE_FUNCTION_SECURITY_ANALYSIS.md)

### ✨ [Features](./features/)
Feature-specific documentation and implementation details.

- Booking System
- Payment Processing
- Contract Signing
- Admin Dashboard
- Spin-to-Win Contest

### 🧪 [Testing](./testing/)
Testing strategies, guides, and procedures.

- [Browser Testing Guide](./testing/BROWSER_TESTING_GUIDE.md)
- [Manual Test Instructions](./testing/MANUAL_TEST_INSTRUCTIONS.md)
- [AI Testing Capabilities](./testing/AI_TESTING_CAPABILITIES.md)

### 🔌 [API](./api/)
API integration documentation for Supabase, Stripe, and other services.

- Supabase Integration
- Stripe Payment Processing
- Email Services

### 📦 [Archive](./archive/)
Historical documentation and progress reports.

- [Archive Index](./archive/index.md)

## 🔍 Quick Links

- [Main README](../README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Changelog](../CHANGELOG.md)

## 🆘 Need Help?

If you can't find what you're looking for:

1. Check the [Quick Start Guide](./guides/QUICK_START.md)
2. Search the [Archive](./archive/) for historical context
3. Review the [Architecture](./architecture/) for system design
4. Consult the [Testing](./testing/) guides for quality assurance

## 📝 Contributing to Documentation

When adding new documentation:

1. Place in appropriate directory (guides, architecture, features, etc.)
2. Use clear, descriptive filenames
3. Update this index
4. Follow markdown best practices
5. Include code examples where relevant

---

**Last Updated:** November 4, 2025
EOF

# Count results
echo -e "${GREEN}Cleanup complete!${NC}"
echo ""
echo "📊 Summary:"
echo "==========="
total_archived=$(find docs/archive -name "*.md" | wc -l)
echo "Files archived: $total_archived"

guides_count=$(find docs/guides -name "*.md" | wc -l)
echo "Guide docs: $guides_count"

arch_count=$(find docs/architecture -name "*.md" | wc -l)
echo "Architecture docs: $arch_count"

features_count=$(find docs/features -name "*.md" | wc -l)
echo "Feature docs: $features_count"

testing_count=$(find docs/testing -name "*.md" | wc -l)
echo "Testing docs: $testing_count"

api_count=$(find docs/api -name "*.md" | wc -l)
echo "API docs: $api_count"

root_count=$(find . -maxdepth 1 -name "*.md" | wc -l)
echo "Remaining in root: $root_count"

echo ""
echo -e "${GREEN}✅ Phase 1 Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the docs/ directory structure"
echo "2. Verify important docs weren't missed"
echo "3. Update links in README.md"
echo "4. Run: git add docs/"
echo "5. Run: git commit -m 'Phase 1: Organize documentation'"
echo "6. Continue to Phase 2: Remove Legacy Code"


