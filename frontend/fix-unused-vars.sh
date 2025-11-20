#!/bin/bash
# Fix common unused variable patterns by prefixing with underscore

cd "$(dirname "$0")/src"

echo "🔧 Fixing unused variables..."

# Fix unused error variables in catch blocks (err, error, e)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/catch (\(err\))/catch (_err)/g' {} \;
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/catch (\(error\))/catch (_error)/g' {} \;
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/catch (\(e\))/catch (_e)/g' {} \;

# Fix unused imports (expect, useMemo, createClient, logger, etc.) - be careful with these
# We'll do these manually to avoid breaking code

echo "✅ Done! Run 'pnpm lint' to check results."
echo "⚠️  Note: Some unused imports may need manual review."



