#!/bin/bash
# Archive deprecated rules
# Run: bash scripts/archive-deprecated-rules.sh

cd "$(dirname "$0")/.."

RULES_DIR=".cursor/rules"
ARCHIVE_DIR=".cursor/rules/archive"

# Create archive directory if it doesn't exist
mkdir -p "$ARCHIVE_DIR"

# Deprecated rules to archive (per README.md)
DEPRECATED_RULES=(
  "api-database-standards.mdc"
  "backend-development.mdc"
  "murmuration-coordinator.mdc"
  "rental-platform-coordinator.mdc"
  "rule-design-excellence-framework.mdc"
  "cognitive-architecture.mdc"
  "ai-coding-assistance.mdc"
  "browser-testing-login.mdc"
  "extension-integration.mdc"
  "frontend-startup-protocol.mdc"
  "kubota-business-logic.mdc"
  "rental-business-logic.mdc"
  "rental-payment-security.mdc"
  "rental-performance-optimization.mdc"
  "rental-testing-quality-assurance.mdc"
  "supabase-backend-priority.mdc"
  "supabase-excellence.mdc"
  "development-standards.mdc"
)

echo "📦 Archiving deprecated rules..."
echo ""

ARCHIVED=0
SKIPPED=0

for rule in "${DEPRECATED_RULES[@]}"; do
  source="$RULES_DIR/$rule"
  dest="$ARCHIVE_DIR/$rule"
  
  if [ -f "$source" ]; then
    # Move to archive
    mv "$source" "$dest"
    echo "✅ Archived: $rule"
    ARCHIVED=$((ARCHIVED + 1))
  else
    echo "⏭️  Skipped: $rule (not found)"
    SKIPPED=$((SKIPPED + 1))
  fi
done

echo ""
echo "📊 Summary:"
echo "   Archived: $ARCHIVED files"
echo "   Skipped: $SKIPPED files"
echo ""
echo "✅ Done! Deprecated rules moved to $ARCHIVE_DIR"
