#!/bin/bash

# Check Type Sync - Validate frontend type usage
# Purpose: Verify that frontend code uses types correctly and types are in sync
# Usage: bash scripts/check-types-sync.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TYPES_FILE="$PROJECT_ROOT/supabase/types.ts"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🔍 Checking type synchronization..."

cd "$PROJECT_ROOT"

# Check if types file exists
if [ ! -f "$TYPES_FILE" ]; then
    echo "❌ Error: Types file not found: $TYPES_FILE"
    echo "   Run: bash scripts/update-supabase-types.sh"
    exit 1
fi

# Check if types file is recent (within last 7 days)
TYPES_AGE=$(find "$TYPES_FILE" -mtime +7 2>/dev/null || echo "")
if [ -n "$TYPES_AGE" ]; then
    echo "⚠️  Warning: Types file is older than 7 days"
    echo "   Consider regenerating: bash scripts/update-supabase-types.sh"
fi

# Check for common type issues
echo ""
echo "📋 Checking for type issues..."

ISSUES_FOUND=0

# Check for 'as any' usage with Supabase queries
echo "  Checking for 'as any' usage..."
AS_ANY_COUNT=$(grep -r "as any" "$FRONTEND_DIR/src" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "typed-helpers.examples.ts" | grep -v "node_modules" | wc -l || echo "0")
if [ "$AS_ANY_COUNT" -gt 0 ]; then
    echo "  ⚠️  Found $AS_ANY_COUNT instances of 'as any' (excluding examples)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check for untyped Supabase clients
echo "  Checking for untyped Supabase clients..."
UNTYPED_CLIENTS=$(grep -r "supabaseAny\|supabaseClient.*: any" "$FRONTEND_DIR/src" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$UNTYPED_CLIENTS" -gt 0 ]; then
    echo "  ⚠️  Found $UNTYPED_CLIENTS instances of untyped Supabase clients"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check for SELECT * usage
echo "  Checking for SELECT * usage..."
SELECT_STAR=$(grep -r "\.select(['\"]\*['\"])" "$FRONTEND_DIR/src" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$SELECT_STAR" -gt 0 ]; then
    echo "  ❌ Found $SELECT_STAR instances of SELECT * (performance issue)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check if types compile
echo ""
echo "🔍 Verifying types compile..."
cd "$FRONTEND_DIR"
if command -v pnpm &> /dev/null; then
    if pnpm run type-check > /dev/null 2>&1; then
        echo "✅ Types compile successfully"
    else
        echo "❌ Type check failed"
        echo "   Run 'cd frontend && pnpm type-check' to see errors"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo "⚠️  pnpm not found, skipping type compilation check"
    echo "   Install pnpm: npm install -g pnpm"
fi

# Summary
echo ""
if [ "$ISSUES_FOUND" -eq 0 ]; then
    echo "✅ All type checks passed!"
    exit 0
else
    echo "⚠️  Found $ISSUES_FOUND type issue(s)"
    echo ""
    echo "💡 Recommendations:"
    echo "   - Use typed helpers from @/lib/supabase/typed-helpers"
    echo "   - Use specific columns instead of SELECT *"
    echo "   - Avoid 'as any' - use proper types from supabase/types.ts"
    exit 1
fi

