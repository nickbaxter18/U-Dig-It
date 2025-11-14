#!/bin/bash
# Fix alwaysApply flags for redundant rules
# Run: bash scripts/fix-rules-always-apply.sh

cd "$(dirname "$0")/.."

RULES_DIR=".cursor/rules"

# Rules that should NOT be always applied
RULES_TO_FIX=(
  "extension-integration.mdc"
  "ai-coding-assistance.mdc"
  "development-standards.mdc"
  "supabase-backend-priority.mdc"
  "browser-testing-login.mdc"
  "frontend-startup-protocol.mdc"
  "supabase-excellence.mdc"
  "kubota-business-logic.mdc"
  "rental-platform-coordinator.mdc"
  "murmuration-coordinator.mdc"
  "rule-design-excellence-framework.mdc"
  "cognitive-architecture.mdc"
  "advanced-prompting.mdc"
  "ethical-ai-responsibility.mdc"
)

echo "🔧 Fixing alwaysApply flags..."
echo ""

for rule in "${RULES_TO_FIX[@]}"; do
  file="$RULES_DIR/$rule"
  if [ -f "$file" ]; then
    # Check if it has alwaysApply: true
    if grep -q "alwaysApply: true" "$file"; then
      # Replace alwaysApply: true with alwaysApply: false
      sed -i 's/alwaysApply: true/alwaysApply: false/g' "$file"
      echo "✅ Fixed: $rule"
    else
      echo "⏭️  Skipped: $rule (already false or not found)"
    fi
  else
    echo "⚠️  Not found: $rule"
  fi
done

echo ""
echo "✅ Done! Review changes with: git diff .cursor/rules/"
