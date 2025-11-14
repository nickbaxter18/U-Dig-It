#!/bin/bash

# Auto-Update Reference Indexes
# Purpose: Keep COMPONENT_INDEX.md and API_ROUTES_INDEX.md up-to-date
# Usage: bash scripts/update-reference-indexes.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend/src"
DOCS_DIR="$PROJECT_ROOT/docs/reference"

echo "🔄 Updating reference indexes..."

# Ensure docs directory exists
mkdir -p "$DOCS_DIR"

# Update Component Index
echo "📦 Updating COMPONENT_INDEX.md..."
cat > "$DOCS_DIR/COMPONENT_INDEX.md" << 'EOF'
# Component Index

**Purpose**: Quick reference catalog of all React components in the codebase.
**Auto-Generated**: Run `bash scripts/update-reference-indexes.sh` to update.

---

## Component Categories

EOF

# Find all components and categorize them
find "$FRONTEND_DIR/components" -type f -name "*.tsx" -o -name "*.ts" | while read -r file; do
    RELATIVE_PATH="${file#$FRONTEND_DIR/}"
    CATEGORY=$(dirname "$RELATIVE_PATH" | cut -d'/' -f2)
    COMPONENT_NAME=$(basename "$file" .tsx | sed 's/.ts$//')

    # Extract component description from JSDoc if available
    DESCRIPTION=$(grep -A 2 "@component\|@description" "$file" | head -1 | sed 's/.*@description\s*//' | sed 's/.*@component\s*//' || echo "No description")

    echo "### $CATEGORY"
    echo "- **$COMPONENT_NAME** - \`$RELATIVE_PATH\`"
    [ -n "$DESCRIPTION" ] && echo "  - $DESCRIPTION"
    echo ""
done | sort -u >> "$DOCS_DIR/COMPONENT_INDEX.md"

# Update API Routes Index
echo "🔌 Updating API_ROUTES_INDEX.md..."
cat > "$DOCS_DIR/API_ROUTES_INDEX.md" << 'EOF'
# API Routes Index

**Purpose**: Quick reference catalog of all API routes in the codebase.
**Auto-Generated**: Run `bash scripts/update-reference-indexes.sh` to update.

---

## API Routes by Category

EOF

# Find all API routes
find "$FRONTEND_DIR/app/api" -type f -name "route.ts" | while read -r file; do
    RELATIVE_PATH="${file#$FRONTEND_DIR/app/}"
    ROUTE_PATH=$(dirname "$RELATIVE_PATH" | sed 's|/route||')

    # Extract HTTP methods
    METHODS=$(grep -E "export (async )?function (GET|POST|PUT|DELETE|PATCH)" "$file" | sed 's/.*function //' | tr '\n' ',' | sed 's/,$//' || echo "Unknown")

    # Extract route description from JSDoc
    DESCRIPTION=$(grep -A 2 "@description\|@route" "$file" | head -1 | sed 's/.*@description\s*//' | sed 's/.*@route\s*//' || echo "No description")

    echo "### \`$ROUTE_PATH\`"
    echo "- **Methods**: $METHODS"
    [ -n "$DESCRIPTION" ] && echo "- **Description**: $DESCRIPTION"
    echo "- **File**: \`$RELATIVE_PATH\`"
    echo ""
done | sort >> "$DOCS_DIR/API_ROUTES_INDEX.md"

echo "✅ Reference indexes updated successfully!"
echo "📊 Updated files:"
echo "   - $DOCS_DIR/COMPONENT_INDEX.md"
echo "   - $DOCS_DIR/API_ROUTES_INDEX.md"
