#!/bin/bash
# Cursor IDE Setup Verification Script

echo "🔍 Verifying Cursor IDE Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check rules
echo "📋 Rules Configuration:"
TOTAL_RULES=$(ls -1 .cursor/rules/*.mdc 2>/dev/null | wc -l)
ALWAYS_APPLIED=$(grep -l "alwaysApply: true" .cursor/rules/*.mdc 2>/dev/null | wc -l)
echo "  Total rules: $TOTAL_RULES"
if [ "$ALWAYS_APPLIED" -le 7 ]; then
  echo -e "  ${GREEN}✅ Always-applied rules: $ALWAYS_APPLIED${NC}"
else
  echo -e "  ${YELLOW}⚠️ Always-applied rules: $ALWAYS_APPLIED (consider reducing)${NC}"
fi

# Check CODING_SAVANT_PATTERNS rule
if [ -f .cursor/rules/CODING_SAVANT_PATTERNS.mdc ]; then
  echo -e "  ${GREEN}✅ CODING_SAVANT_PATTERNS.mdc exists${NC}"
else
  echo -e "  ${RED}❌ CODING_SAVANT_PATTERNS.mdc missing${NC}"
fi

# Check config files
echo ""
echo "⚙️ Configuration Files:"
[ -f .cursor/cursor-2.0-config.json ] && echo -e "  ${GREEN}✅ cursor-2.0-config.json${NC}" || echo -e "  ${RED}❌ cursor-2.0-config.json missing${NC}"
[ -f .cursor/mcp-resources.json ] && echo -e "  ${GREEN}✅ mcp-resources.json${NC}" || echo -e "  ${RED}❌ mcp-resources.json missing${NC}"
[ -f .cursor/actions.json ] && echo -e "  ${GREEN}✅ actions.json${NC}" || echo -e "  ${RED}❌ actions.json missing${NC}"
[ -f .vscode/settings.json ] && echo -e "  ${GREEN}✅ .vscode/settings.json${NC}" || echo -e "  ${RED}❌ .vscode/settings.json missing${NC}"

# Check templates
echo ""
echo "📝 MCP Templates:"
TEMPLATE_COUNT=$(ls -1 .cursor/mcp-resources/*.ts .cursor/mcp-resources/*.tsx .cursor/mcp-resources/*.sql 2>/dev/null | wc -l)
echo "  Total templates: $TEMPLATE_COUNT"
if [ "$TEMPLATE_COUNT" -ge 4 ]; then
  echo -e "  ${GREEN}✅ Good template coverage${NC}"
else
  echo -e "  ${YELLOW}⚠️ Consider adding more templates${NC}"
fi

# Check .cursorignore
echo ""
echo "🚫 Indexing Optimization:"
if [ -f .cursorignore ]; then
  echo -e "  ${GREEN}✅ .cursorignore exists${NC}"
  EXCLUSIONS=$(grep -c "^" .cursorignore 2>/dev/null || echo "0")
  echo "  Exclusions configured: $EXCLUSIONS"
else
  echo -e "  ${YELLOW}⚠️ .cursorignore missing (recommended for faster indexing)${NC}"
fi

# Check documentation
echo ""
echo "📚 Documentation:"
[ -f .cursor/CURSOR-2.0-SETUP-GUIDE.md ] && echo -e "  ${GREEN}✅ Setup guide exists${NC}" || echo -e "  ${RED}❌ Setup guide missing${NC}"
[ -f .cursor/KEYBOARD-SHORTCUTS.md ] && echo -e "  ${GREEN}✅ Keyboard shortcuts documented${NC}" || echo -e "  ${RED}❌ Keyboard shortcuts missing${NC}"
[ -f docs/reference/CODING_SAVANT_CHEAT_SHEET.md ] && echo -e "  ${GREEN}✅ Cheat sheet exists${NC}" || echo -e "  ${YELLOW}⚠️ Cheat sheet missing${NC}"

# Check memory system
echo ""
echo "🧠 Memory System:"
if [ -f .cursor/memories/CODING_SAVANT_MEMORIES.md ]; then
  MEMORY_COUNT=$(grep -c "^## 🔥" .cursor/memories/CODING_SAVANT_MEMORIES.md 2>/dev/null || echo "0")
  echo "  Memories documented: $MEMORY_COUNT"
  echo -e "  ${YELLOW}⚠️ Note: Memories need manual saving in Cursor UI${NC}"
else
  echo -e "  ${RED}❌ Memory file missing${NC}"
fi

# Check if CODING_SAVANT_PATTERNS rule exists (better than memories)
if grep -q "CODING_SAVANT_PATTERNS" .cursor/rules/*.mdc 2>/dev/null; then
  echo -e "  ${GREEN}✅ CODING_SAVANT_PATTERNS rule exists (always-applied)${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ISSUES=0
WARNINGS=0

# Count issues
[ ! -f .cursor/cursor-2.0-config.json ] && ISSUES=$((ISSUES+1))
[ ! -f .cursor/mcp-resources.json ] && ISSUES=$((ISSUES+1))
[ ! -f .cursorignore ] && WARNINGS=$((WARNINGS+1))
[ ! -f .cursor/rules/CODING_SAVANT_PATTERNS.mdc ] && ISSUES=$((ISSUES+1))

if [ "$ISSUES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "${GREEN}✅ Setup is excellent!${NC}"
elif [ "$ISSUES" -eq 0 ]; then
  echo -e "${YELLOW}⚠️ Setup is good with $WARNINGS minor optimization(s)${NC}"
else
  echo -e "${RED}❌ Setup has $ISSUES issue(s) and $WARNINGS warning(s)${NC}"
fi

echo ""
echo "📖 Next Steps:"
echo "  1. Review .cursor/CURSOR_IDE_OPTIMIZATION_AUDIT.md"
echo "  2. Complete Priority 1 actions (verification)"
echo "  3. Create .cursorignore if missing"
echo "  4. Test Cursor 2.0 features"
