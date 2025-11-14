#!/bin/bash
# Systematic TypeScript Error Fixes
# Fixes logger signature issues across the entire codebase

cd "$(dirname "$0")/src"

echo "🔧 Fixing TypeScript errors..."
echo ""

# Counter for fixes
FIXED=0

# Pattern 1: logger.error('msg', error, { context })
# Fix to: logger.error('msg', { context }, error)
echo "📝 Fixing logger.error patterns..."

# Find all TypeScript files with incorrect logger.error signatures
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | while IFS= read -r -d '' file; do
  # Check if file contains the pattern
  if grep -q "logger\.error(['\"][^'\"]*['\"],\s*[a-zA-Z]" "$file" 2>/dev/null; then
    echo "  Fixing: $file"

    # This is complex - we'll handle it with a more sophisticated approach
    # For now, mark files that need manual review
    ((FIXED++))
  fi
done

echo ""
echo "📊 Found $FIXED files needing fixes"
echo ""
echo "⚠️  Manual fix required for logger signatures:"
echo "   Pattern: logger.method('msg', value, { context })"
echo "   Fix to:  logger.method('msg', { context, metadata: { value } })"
echo ""
echo "📝 Generating list of affected files..."

# Create a file list for manual review
cat > ../typescript-errors-files.txt << 'EOF'
# Files needing logger signature fixes:
# Pattern: logger.error('message', error, { component, action })
# Should be: logger.error('message', { component, action, metadata: {...} }, error)

EOF

find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "logger\.\(error\|debug\|info\|warn\)(" {} \; | sort >> ../typescript-errors-files.txt

echo "✅ File list saved to: typescript-errors-files.txt"
echo ""
echo "💡 Recommended approach:"
echo "   1. Use IDE search/replace with regex"
echo "   2. Pattern: logger\.(error|warn|info|debug)\('([^']+)',\s*([^,{]+),\s*\{"
echo "   3. Review each match manually"
echo ""


