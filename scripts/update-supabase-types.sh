#!/bin/bash

# Auto-Update Supabase TypeScript Types
# Purpose: Keep Supabase types always up-to-date with validation and checksum comparison
# Usage: bash scripts/update-supabase-types.sh [--force]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TYPES_FILE="$PROJECT_ROOT/supabase/types.ts"
TYPES_CHECKSUM_FILE="$PROJECT_ROOT/supabase/.types.checksum"
FORCE_UPDATE="${1:-}"

echo "🔄 Updating Supabase TypeScript types..."

cd "$PROJECT_ROOT"

# Calculate checksum of existing types file (if it exists)
OLD_CHECKSUM=""
if [ -f "$TYPES_FILE" ]; then
    OLD_CHECKSUM=$(sha256sum "$TYPES_FILE" | cut -d' ' -f1)
    echo "📋 Current types checksum: ${OLD_CHECKSUM:0:16}..."
fi

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found"
    echo "   Install: npm install -g supabase"
    echo ""
    echo "💡 Note: Types are automatically regenerated via MCP tools during migrations."
    echo "   This script is for manual type updates only."
    exit 1
fi

# Check if we're using local Supabase or remote
if [ -f "$PROJECT_ROOT/supabase/config.toml" ]; then
    echo "📦 Generating types from local Supabase..."
    supabase gen types typescript --local > "$TYPES_FILE.tmp"
else
    echo "🌐 Generating types from remote Supabase..."
    # You'll need to set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN
    if [ -z "$SUPABASE_PROJECT_REF" ]; then
        echo "❌ Error: SUPABASE_PROJECT_REF not set"
        echo "   Set it in your environment or .env file"
        echo ""
        echo "💡 Note: Types are automatically regenerated via MCP tools during migrations."
        echo "   This script is for manual type updates only."
        exit 1
    fi

    supabase gen types typescript --project-id "$SUPABASE_PROJECT_REF" > "$TYPES_FILE.tmp"
fi

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to generate types"
    rm -f "$TYPES_FILE.tmp"
    exit 1
fi

# Validate generated types file
if [ ! -f "$TYPES_FILE.tmp" ]; then
    echo "❌ Error: Generated types file not found"
    exit 1
fi

LINE_COUNT=$(wc -l < "$TYPES_FILE.tmp" 2>/dev/null || echo "0")
if [ "$LINE_COUNT" -lt 10 ]; then
    echo "❌ Error: Generated types file seems too small ($LINE_COUNT lines)"
    echo "   This usually indicates a generation error"
    rm -f "$TYPES_FILE.tmp"
    exit 1
fi

# Check for basic TypeScript syntax
if ! grep -q "export type Database" "$TYPES_FILE.tmp" 2>/dev/null; then
    echo "❌ Error: Generated types file missing 'export type Database'"
    echo "   This indicates invalid type generation"
    rm -f "$TYPES_FILE.tmp"
    exit 1
fi

# Calculate new checksum
NEW_CHECKSUM=$(sha256sum "$TYPES_FILE.tmp" | cut -d' ' -f1)

# Compare checksums
if [ "$OLD_CHECKSUM" = "$NEW_CHECKSUM" ] && [ "$FORCE_UPDATE" != "--force" ]; then
    echo "✅ Types are already up-to-date (checksum matches)"
    echo "   Use --force to regenerate anyway"
    rm -f "$TYPES_FILE.tmp"
    exit 0
fi

# Replace old file with new one
mv "$TYPES_FILE.tmp" "$TYPES_FILE"

# Save checksum
echo "$NEW_CHECKSUM" > "$TYPES_CHECKSUM_FILE"

# Verify types compile
echo "🔍 Verifying types compile..."
cd "$PROJECT_ROOT/frontend"
if command -v pnpm &> /dev/null; then
    if pnpm run type-check > /dev/null 2>&1; then
        echo "✅ Types compile successfully"
    else
        echo "⚠️  Warning: Type check failed after generation"
        echo "   Run 'cd frontend && pnpm type-check' to see errors"
        echo "   Types file has been updated, but may need fixes"
    fi
else
    echo "⚠️  pnpm not found, skipping type compilation check"
    echo "   Install pnpm: npm install -g pnpm"
fi

echo ""
echo "✅ Types updated successfully: $TYPES_FILE"
echo "📊 Generated $LINE_COUNT lines of type definitions"
echo "🔐 Checksum: ${NEW_CHECKSUM:0:16}..."
if [ "$OLD_CHECKSUM" != "" ] && [ "$OLD_CHECKSUM" != "$NEW_CHECKSUM" ]; then
    echo "📝 Changes detected (checksum changed)"
fi
