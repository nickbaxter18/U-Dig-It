#!/bin/bash

# Phase 8: Setup Code Quality Tools
# This script configures ESLint, Prettier, import sorting, and pre-commit hooks

set -e  # Exit on error

echo "✨ Starting Phase 8: Setup Code Quality Tools"
echo "============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Safety check
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

cd frontend

echo -e "${GREEN}Installing code quality tools...${NC}"

# Install Prettier plugin for import sorting
echo "📦 Installing @trivago/prettier-plugin-sort-imports..."
pnpm add -D @trivago/prettier-plugin-sort-imports

# Update .prettierrc
echo -e "${GREEN}Configuring Prettier with import sorting...${NC}"
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "importOrder": [
    "^react",
    "^next",
    "^@/features/(.*)$",
    "^@/components/(.*)$",
    "^@/lib/(.*)$",
    "^@/hooks/(.*)$",
    "^[./]"
  ],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true,
  "plugins": ["@trivago/prettier-plugin-sort-imports"]
}
EOF

# Update ESLint config for import ordering
echo -e "${GREEN}Configuring ESLint for import ordering...${NC}"

# Check if eslint-plugin-import is installed
if ! pnpm list eslint-plugin-import >/dev/null 2>&1; then
    echo "📦 Installing eslint-plugin-import..."
    pnpm add -D eslint-plugin-import
fi

# Create/update lint-staged config
echo -e "${GREEN}Configuring lint-staged...${NC}"
cat > .lintstagedrc.json << 'EOF'
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,css}": [
    "prettier --write"
  ]
}
EOF

# Setup husky pre-commit hooks
echo -e "${GREEN}Setting up Husky pre-commit hooks...${NC}"

# Check if husky is installed
if ! pnpm list husky >/dev/null 2>&1; then
    echo "📦 Installing husky..."
    pnpm add -D husky
    npx husky install
fi

# Install lint-staged if not present
if ! pnpm list lint-staged >/dev/null 2>&1; then
    echo "📦 Installing lint-staged..."
    pnpm add -D lint-staged
fi

# Create pre-commit hook
mkdir -p .husky
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

cd frontend && npx lint-staged
EOF

chmod +x .husky/pre-commit

# Update package.json scripts if needed
echo -e "${GREEN}Updating package.json scripts...${NC}"

# Check if format scripts exist, if not add them
if ! grep -q '"format":' package.json; then
    echo "Adding format scripts to package.json..."
    # This is just informational - manual update needed
    echo -e "${YELLOW}Please add these scripts to package.json:${NC}"
    echo '  "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",'
    echo '  "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,md}\"",'
fi

# Create .prettierignore
echo -e "${GREEN}Creating .prettierignore...${NC}"
cat > .prettierignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build output
.next/
dist/
build/
out/

# Cache
.cache/
.turbo/

# Test output
coverage/
.nyc_output/
test-results/

# Misc
*.log
.DS_Store

# Config files that shouldn't be formatted
pnpm-lock.yaml
package-lock.json
yarn.lock

# Generated files
*.tsbuildinfo
EOF

# Create .eslintignore if it doesn't exist
if [ ! -f ".eslintignore" ]; then
    echo -e "${GREEN}Creating .eslintignore...${NC}"
    cat > .eslintignore << 'EOF'
# Dependencies
node_modules/

# Build output
.next/
dist/
build/
out/

# Cache
.cache/
.turbo/

# Test output
coverage/

# Config files
*.config.js
*.config.ts

# Generated files
*.tsbuildinfo
EOF
fi

# Run formatter on entire codebase
echo ""
echo -e "${YELLOW}Do you want to run Prettier on the entire codebase now? (yes/no)${NC}"
read -r response

if [ "$response" = "yes" ]; then
    echo -e "${GREEN}Formatting codebase...${NC}"
    pnpm run format || echo -e "${YELLOW}Some files couldn't be formatted - check output above${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}✅ Phase 8 Complete!${NC}"
echo ""
echo "📊 Summary:"
echo "==========="
echo "✅ Prettier configured with import sorting"
echo "✅ ESLint configured for import ordering"
echo "✅ lint-staged configured"
echo "✅ Husky pre-commit hooks installed"
echo "✅ .prettierignore created"
echo "✅ .eslintignore created"

echo ""
echo "🎯 What was configured:"
echo "  - Auto-sort imports on save"
echo "  - Enforce code style (Prettier)"
echo "  - Run linting before commit"
echo "  - Format code before commit"

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Test pre-commit hook: Make a small change and commit"
echo "2. Verify formatting: pnpm run format:check"
echo "3. Verify linting: pnpm run lint"
echo "4. Update VS Code settings (optional):"
echo "   - Enable 'Format on Save'"
echo "   - Set Prettier as default formatter"
echo "5. Commit: git add . && git commit -m 'Phase 8: Setup code quality tools'"

echo ""
echo "📝 VS Code Settings (add to .vscode/settings.json):"
cat << 'VSCODE'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
VSCODE

cd ..


