#!/bin/bash

# Auto-Update Supabase TypeScript Types
# Purpose: Keep Supabase types always up-to-date
# Usage: bash scripts/update-supabase-types.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TYPES_FILE="$PROJECT_ROOT/supabase/types.ts"

echo "🔄 Updating Supabase TypeScript types..."

cd "$PROJECT_ROOT"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found"
    echo "   Install: npm install -g supabase"
    exit 1
fi

# Check if we're using local Supabase or remote
if [ -f "$PROJECT_ROOT/supabase/config.toml" ]; then
    echo "📦 Generating types from local Supabase..."
    supabase gen types typescript --local > "$TYPES_FILE"
else
    echo "🌐 Generating types from remote Supabase..."
    # You'll need to set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN
    if [ -z "$SUPABASE_PROJECT_REF" ]; then
        echo "❌ Error: SUPABASE_PROJECT_REF not set"
        echo "   Set it in your environment or .env file"
        exit 1
    fi

    supabase gen types typescript --project-id "$SUPABASE_PROJECT_REF" > "$TYPES_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ Types updated successfully: $TYPES_FILE"

    # Count lines to verify it's not empty
    LINE_COUNT=$(wc -l < "$TYPES_FILE")
    if [ "$LINE_COUNT" -lt 10 ]; then
        echo "⚠️  Warning: Types file seems too small ($LINE_COUNT lines)"
    else
        echo "📊 Generated $LINE_COUNT lines of type definitions"
    fi
else
    echo "❌ Error: Failed to generate types"
    exit 1
fi
