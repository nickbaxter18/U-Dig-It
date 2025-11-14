#!/bin/bash

# ==============================================================================
# UPDATE GITIGNORE FOR SUPABASE-ONLY ARCHITECTURE
# ==============================================================================

echo "📝 Updating .gitignore for Supabase-only architecture..."

cat > .gitignore << 'EOF'
# ==============================================================================
# Kubota Rental Platform - Supabase + Frontend Architecture
# ==============================================================================

# Dependencies
node_modules/
.pnpm-store/
.pnpm-cache/

# Frontend Build
frontend/.next/
frontend/out/
frontend/build/
frontend/dist/

# Environment Variables
.env
.env.local
.env.*.local
frontend/.env
frontend/.env.local

# Supabase
supabase/.branches/
supabase/.temp/

# IDE / Editor
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
frontend/coverage/
frontend/.nyc_output/
frontend/playwright-report/
frontend/test-results/
*.log

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Temporary files
*.tmp
*.temp
.cache/

# Build outputs
*.tsbuildinfo

# Cursor AI
.cursor-tutor/

# ==============================================================================
# REMOVED FOLDERS (NO LONGER IN PROJECT)
# ==============================================================================
# The following are explicitly removed and should never be committed:

# Legacy Backend (removed - using Supabase)
backend/
apps/api/

# Monorepo Structure (removed - using standalone frontend)
apps/
packages/

# Docker Backend (removed - using Supabase)
docker/
docker-compose.yml
docker-compose.production.yml

# Archive Documentation (removed - outdated)
docs/archive/
_archive/

# Legacy Tests (removed - tests are in frontend/e2e)
tests/

# Monorepo Configs (removed)
turbo.json
pnpm-workspace.yaml
nest-cli.json
typeorm.config.ts

EOF

echo "✅ .gitignore updated successfully!"
echo ""
echo "📝 The following are now ignored:"
echo "  - Node modules and caches"
echo "  - Environment files"
echo "  - Build outputs"
echo "  - IDE files"
echo ""
echo "🚫 The following are explicitly blocked:"
echo "  - /backend (NestJS - removed)"
echo "  - /apps (Monorepo - removed)"
echo "  - /packages (Monorepo - removed)"
echo "  - /docker (Backend Docker - removed)"
echo "  - /docs/archive (Old docs - removed)"
echo ""

