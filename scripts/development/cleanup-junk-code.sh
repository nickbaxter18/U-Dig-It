#!/bin/bash

# ==============================================================================
# JUNK CODE CLEANUP SCRIPT
# ==============================================================================
# Purpose: Remove unused backend, monorepo, and legacy code
# Architecture: Frontend (Supabase backend only)
# Date: October 26, 2025
# ==============================================================================

set -e  # Exit on error

echo "🧹 Kubota Rental Platform - Junk Code Cleanup"
echo "=============================================="
echo ""
echo "⚠️  This will remove:"
echo "  - NestJS backend (/backend)"
echo "  - Monorepo structure (/apps, /packages)"
echo "  - Docker backend files"
echo "  - Archive documentation"
echo "  - Duplicate config files"
echo ""
echo "✅ This will preserve:"
echo "  - Frontend application (/frontend)"
echo "  - Supabase backend (/supabase)"
echo "  - Cursor rules (/.cursor)"
echo "  - Active scripts and configs"
echo ""

# Ask for confirmation
read -p "🤔 Continue with cleanup? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting cleanup..."
echo ""

# ==============================================================================
# 1. REMOVE BACKEND FOLDER (NestJS)
# ==============================================================================
echo "📦 [1/7] Removing NestJS backend..."
if [ -d "backend" ]; then
    rm -rf backend
    echo "✅ Removed /backend"
else
    echo "⚠️  /backend not found (already removed)"
fi

# ==============================================================================
# 2. REMOVE MONOREPO STRUCTURE
# ==============================================================================
echo "📦 [2/7] Removing monorepo structure..."
if [ -d "apps" ]; then
    rm -rf apps
    echo "✅ Removed /apps"
else
    echo "⚠️  /apps not found (already removed)"
fi

if [ -d "packages" ]; then
    rm -rf packages
    echo "✅ Removed /packages"
else
    echo "⚠️  /packages not found (already removed)"
fi

# ==============================================================================
# 3. REMOVE DOCKER BACKEND FILES
# ==============================================================================
echo "📦 [3/7] Removing Docker backend files..."
if [ -d "docker" ]; then
    rm -rf docker
    echo "✅ Removed /docker"
else
    echo "⚠️  /docker not found (already removed)"
fi

if [ -f "docker-compose.yml" ]; then
    rm -f docker-compose.yml
    echo "✅ Removed docker-compose.yml"
fi

if [ -f "docker-compose.production.yml" ]; then
    rm -f docker-compose.production.yml
    echo "✅ Removed docker-compose.production.yml"
fi

# ==============================================================================
# 4. REMOVE ARCHIVE DOCUMENTATION
# ==============================================================================
echo "📦 [4/7] Removing archived documentation..."
if [ -d "docs/archive" ]; then
    rm -rf docs/archive
    echo "✅ Removed /docs/archive"
else
    echo "⚠️  /docs/archive not found (already removed)"
fi

if [ -d "_archive" ]; then
    rm -rf _archive
    echo "✅ Removed /_archive"
else
    echo "⚠️  /_archive not found (already removed)"
fi

# ==============================================================================
# 5. REMOVE MONOREPO CONFIG FILES
# ==============================================================================
echo "📦 [5/7] Removing monorepo config files..."

files_to_remove=(
    "turbo.json"
    "pnpm-workspace.yaml"
    "nest-cli.json"
    "typeorm.config.ts"
    "frontend/package-lock.json"
)

for file in "${files_to_remove[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "✅ Removed $file"
    else
        echo "⚠️  $file not found (already removed)"
    fi
done

# ==============================================================================
# 6. REMOVE LEGACY TEST FILES
# ==============================================================================
echo "📦 [6/7] Removing legacy test files..."
if [ -d "tests" ]; then
    rm -rf tests
    echo "✅ Removed /tests (legacy)"
else
    echo "⚠️  /tests not found (already removed)"
fi

# ==============================================================================
# 7. CLEAN NODE_MODULES CACHE
# ==============================================================================
echo "📦 [7/7] Cleaning node_modules cache..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "✅ Removed root /node_modules"
else
    echo "⚠️  Root /node_modules not found"
fi

# Keep frontend node_modules
echo "✅ Preserved /frontend/node_modules"

echo ""
echo "=============================================="
echo "✅ CLEANUP COMPLETE!"
echo "=============================================="
echo ""
echo "📊 Summary:"
echo "  ✅ Removed NestJS backend"
echo "  ✅ Removed monorepo structure"
echo "  ✅ Removed Docker backend files"
echo "  ✅ Removed archived documentation"
echo "  ✅ Removed duplicate config files"
echo ""
echo "📝 Next Steps:"
echo "  1. Review changes: git status"
echo "  2. Update .gitignore (run update-gitignore.sh)"
echo "  3. Reinstall dependencies: cd frontend && pnpm install"
echo "  4. Test frontend: bash start-frontend-clean.sh"
echo ""
echo "🎉 Your codebase is now clean and focused on Frontend + Supabase!"

