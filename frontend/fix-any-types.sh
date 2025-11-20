#!/bin/bash
# Bulk fix common 'any' type patterns

cd "$(dirname "$0")/src"

echo "🔧 Fixing common 'any' type patterns..."

# Fix Record<string, any> -> Record<string, unknown>
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/Record<string,\s*any>/Record<string, unknown>/g' {} \;
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/Record<[^>]*,\s*any>/Record<string, unknown>/g' {} \;

# Fix Array<any> -> unknown[]
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/Array<any>/unknown[]/g' {} \;

# Fix any[] -> unknown[]
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/any\[\]/unknown[]/g' {} \;

# Fix : any; -> : unknown; (but be careful with this one)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/: any;/: unknown;/g' {} \;

# Fix : any) -> : unknown) (function parameters)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/: any)/: unknown)/g' {} \;

# Fix : any, -> : unknown, (function parameters)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/: any,/: unknown,/g' {} \;

# Fix : any => -> : unknown =>
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/: any =>/: unknown =>/g' {} \;

echo "✅ Done! Run 'pnpm lint' to check results."



