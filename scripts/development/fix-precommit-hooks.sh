#!/bin/bash

# ==============================================================================
# FIX PRE-COMMIT HOOKS - REMOVE MONOREPO CHECKS
# ==============================================================================

echo "🔧 Fixing pre-commit hooks for frontend-only architecture..."

# Check if .husky directory exists
if [ ! -d ".husky" ]; then
    echo "⚠️  No .husky directory found - skipping"
    exit 0
fi

# Backup existing pre-commit hook
if [ -f ".husky/pre-commit" ]; then
    cp .husky/pre-commit .husky/pre-commit.backup
    echo "📦 Backed up existing pre-commit hook"
fi

# Create new simplified pre-commit hook (frontend only)
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Pre-commit Quality Gates - Frontend Only"
echo "=============================================="

# Only run type checks on frontend
echo "📝 Running frontend type checks..."
cd frontend && pnpm run type-check

if [ $? -ne 0 ]; then
    echo "❌ Frontend type check failed!"
    exit 1
fi

echo "✅ All checks passed!"
exit 0
EOF

chmod +x .husky/pre-commit

echo "✅ Pre-commit hooks updated successfully!"
echo ""
echo "📝 Changes:"
echo "  - Removed monorepo package checks"
echo "  - Only checking frontend TypeScript"
echo "  - Faster commit process"
echo ""
echo "🎯 Next commit will only check /frontend code"

