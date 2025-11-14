# Housekeeping Pre-Flight Snapshot
**Date:** 2025-10-25
**Branch:** main
**Repository:** Kubota Rental Platform

## System Information

### Runtime Versions
- **Node.js:** v22.21.0
- **pnpm:** 9.12.0
- **Package Manager:** pnpm@9.0.0 (from packageManager field)

### Git Information
- **Current Branch:** main
- **Remote:** origin https://github.com/nickbaxter18/Kubota-rental-platform.git
- **Default Branch:** main

## Environment Files
- ✅ `.env` (present - contains secrets, not displayed)
- ✅ `.env.cloudflare` (present - contains secrets, not displayed)
- ✅ `.env.example` (present - template file)

## Lockfile Integrity
- **pnpm-lock.yaml hash:** 1855a0cbe75a715c751fc073dfebacfbda4d52ad009dec9163ba3816b37056fd

## Scripts Analysis
### Root Package Scripts (from package.json)
- **install:all:** pnpm install
- **build:** pnpm --recursive --parallel run build
- **dev:** pnpm --parallel --filter udigit-rentals-frontend run dev
- **dev:backend:** pnpm --filter udigit-rentals-backend run start:dev
- **dev:frontend:** pnpm --filter udigit-rentals-frontend run dev
- **start:** pnpm --parallel run start
- **lint:** pnpm --recursive --parallel run lint
- **lint:fix:** pnpm --recursive --parallel run lint --fix
- **test:** pnpm --recursive --parallel run test
- **test:watch:** pnpm --recursive --parallel run test:watch
- **test:smoke:** pnpm --filter frontend run build && pnpm --filter backend run build
- **test:coverage:** pnpm --recursive --parallel run test:coverage
- **test:coverage:frontend:** pnpm --filter frontend run test:coverage
- **test:coverage:backend:** pnpm --filter backend run test:coverage
- **test:coverage:report:** pnpm test:coverage && open coverage/lcov-report/index.html
- **test:coverage:check:** pnpm test:coverage -- --coverageReporters=json && node scripts/coverage-check.js
- **test:accessibility:** pnpm --filter frontend run test:e2e --config=playwright.config.ts --project=accessibility
- **test:visual-regression:** pnpm --filter frontend run test:e2e --config=playwright.config.ts --project=visual-regression
- **test:performance:** pnpm --filter frontend run test:e2e --grep='performance'
- **test:critical:** pnpm --filter backend run test:critical
- **test:integration:** pnpm --recursive run test:integration
- **test:health:** node scripts/test-health-report.js
- **validate:environment:** bash scripts/test-infrastructure-validator.sh
- **validate:health:** pnpm validate:environment && pnpm test:health
- **validate:dependencies:** node scripts/dependency-consistency-validator.js
- **test:flaky:** node scripts/flaky-test-detector.js
- **test:redis:start:** bash scripts/start-test-redis.sh
- **test:redis:stop:** bash scripts/stop-test-redis.sh
- **test:with-redis:** pnpm test:redis:start && pnpm test && pnpm test:redis:stop
- **ci:download-artifacts:** bash scripts/download-ci-artifacts.sh
- **monitor:** node scripts/monitoring-alerts.js run
- **monitor:setup:** node scripts/monitoring-alerts.js setup
- **test:all:** node scripts/test-runner.js all
- **test:debug:** node scripts/test-runner.js debug
- **test:setup:** node scripts/test-runner.js --setup
- **type-check:** pnpm --recursive --parallel run type-check
- **type-check:all:** pnpm --recursive run type-check
- **type-check:verbose:** pnpm --recursive --parallel run type-check:verbose
- **prepare:** husky install
- **ci:** pnpm lint && pnpm type-check && pnpm test:smoke
- **clean:** pnpm --recursive --parallel run clean && rm -rf node_modules .pnpm-debug.log
- **db:migrate:** pnpm --filter backend run migration:run
- **db:seed:** pnpm --filter backend run seed
- **docker:build:** docker-compose build
- **docker:up:** docker-compose up -d
- **docker:down:** docker-compose down
- **format:** prettier --write "**/*.{ts,tsx,js,jsx,json,md}"
- **format:check:** prettier --check "**/*.{ts,tsx,js,jsx,json,md}"
- **cache:clean:** pnpm store prune && pnpm install --frozen-lockfile
- **dev:full:** concurrently "pnpm dev:frontend" "pnpm dev:backend"

## Top-Level Dependencies
### Dev Dependencies
- @axe-core/playwright 4.11.0
- @lhci/cli 0.12.0
- @playwright/test 1.56.1
- @types/node 20.19.23
- @typescript-eslint/eslint-plugin 6.21.0
- @typescript-eslint/parser 6.21.0
- eslint 8.57.1
- eslint-config-prettier 9.1.2
- eslint-plugin-import 2.32.0
- eslint-plugin-jsx-a11y 6.10.2
- eslint-plugin-react 7.37.5
- eslint-plugin-react-hooks 4.6.2
- eslint-plugin-security 2.1.1
- husky 8.0.3
- lint-staged 15.5.2

## Repository Structure
- **Monorepo:** Yes (pnpm workspaces)
- **Apps:** apps/ directory
- **Packages:** packages/ directory
- **Build Tools:** Turbo, Vite
- **Testing:** Jest, Playwright, Vitest
- **Linting:** ESLint, Prettier
- **CI/CD:** GitHub Actions (multiple workflows)
- **Database:** Supabase with PostgreSQL
- **Deployment:** Docker, Kubernetes

## CI Status
⚠️ **Status:** Unknown (no recent CI run visible)
**CI Workflows:** ci.yml, elite-ci-cd.yml, quality-checks.yml

## Risk Assessment
- **Complexity:** High (monorepo with multiple apps and packages)
- **Dependencies:** Complex (workspace dependencies between apps and packages)
- **Build Process:** Multi-stage (frontend + backend)
- **Testing:** Comprehensive (unit, integration, e2e, performance, accessibility)
- **Deployment:** Multi-environment (Docker, K8s, Supabase)

## Recommendations
1. Test all scripts before making changes
2. Validate workspace dependencies carefully
3. Ensure environment variables are preserved
4. Test build process end-to-end
5. Verify CI workflows after changes





