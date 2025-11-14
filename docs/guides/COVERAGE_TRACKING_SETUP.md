# 📊 Coverage Tracking & Quality Gates Setup
## Kubota Rental Platform

---

## 🎯 COVERAGE CONFIGURATION

### Update vitest.config.ts

**File:** `frontend/vitest.config.ts`

Add these enhanced coverage thresholds:

```typescript
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,

    // ✅ ENHANCED COVERAGE CONFIGURATION
    coverage: {
      provider: 'v8',
      reporter: [
        'text',           // Console output
        'text-summary',   // Brief summary
        'json',           // Machine-readable
        'json-summary',   // Summary metrics
        'html',           // Visual HTML report
        'lcov',           // For CI/CD tools
      ],
      reportsDirectory: './coverage',

      // Files to exclude from coverage
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'dist/',
        'build/',
        'e2e/',
        'cypress/',
        'storybook-static/',
        '.next/',
        'next.config.js',
        'postcss.config.js',
        'tailwind.config.js',
        'vitest.config.ts',
        'playwright.config.ts',
        'jest.config.js',
        'src/types/**',
        'src/styles/**',
        'src/middleware.ts',
      ],

      // ✅ PROGRESSIVE COVERAGE THRESHOLDS
      thresholds: {
        // Global baseline (current: ~65%)
        global: {
          branches: 65,      // Start at current, increase to 80
          functions: 70,     // Start at current, increase to 80
          lines: 70,         // Start at current, increase to 80
          statements: 70,    // Start at current, increase to 80
        },

        // Component files (target: 90%)
        './src/components/': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },

        // Critical business logic (target: 95%)
        './src/components/EnhancedBookingFlow.tsx': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        './src/components/booking/': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },

        // API routes (target: 85%)
        './src/app/api/': {
          branches: 60,      // Start lower, many untested
          functions: 65,
          lines: 65,
          statements: 65,
        },

        // Critical API routes (higher standards)
        './src/app/api/bookings/': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        './src/app/api/stripe/': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },

        // Lib utilities (target: 90%)
        './src/lib/': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },

        // Security & validation (must be 100%)
        './src/lib/input-sanitizer.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        './src/lib/validation.ts': {
          branches: 95,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        './src/lib/html-sanitizer.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },

        // Auth & Supabase (critical: 95%)
        './src/lib/supabase/': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        './src/components/providers/SupabaseAuthProvider.tsx': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },

      // ✅ WATERMARKS FOR VISUAL INDICATORS
      watermarks: {
        lines: [65, 90],      // Yellow at 65%, green at 90%
        functions: [70, 90],
        branches: [65, 85],
        statements: [70, 90],
      },

      // Include all source files even if not imported in tests
      all: true,
      include: ['src/**/*.{ts,tsx}'],

      // Clean coverage directory before each run
      clean: true,

      // Report uncovered lines
      skipFull: false,
    },

    // ✅ OPTIMIZED TEST EXECUTION
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 6,          // Up from 6 (was limited due to memory)
        minForks: 1,
        isolate: true,
      },
    },
    maxConcurrency: 8,        // Up from 5
    isolate: true,
    fileParallelism: true,    // ✅ Enable parallel execution

    // Test timeout and retry
    testTimeout: 15000,
    retry: 2,
    bail: process.env.CI ? 1 : 0,

    // Reporters
    reporters: process.env.CI
      ? ['verbose', 'github-actions', 'json']
      : ['verbose'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 📜 PACKAGE.JSON SCRIPTS

**File:** `frontend/package.json`

Add these scripts:

```json
{
  "scripts": {
    // Existing...
    "test": "NODE_OPTIONS='--max-old-space-size=8192' vitest",
    "test:ui": "NODE_OPTIONS='--max-old-space-size=8192' vitest --ui",
    "test:run": "NODE_OPTIONS='--max-old-space-size=8192' vitest run",

    // ✅ NEW COVERAGE SCRIPTS
    "test:coverage": "NODE_OPTIONS='--max-old-space-size=8192' vitest run --coverage",
    "test:coverage:watch": "NODE_OPTIONS='--max-old-space-size=8192' vitest --coverage --watch",
    "test:coverage:ui": "NODE_OPTIONS='--max-old-space-size=8192' vitest --coverage --ui",
    "test:coverage:summary": "NODE_OPTIONS='--max-old-space-size=8192' vitest run --coverage && node scripts/coverage-summary.js",
    "test:coverage:open": "NODE_OPTIONS='--max-old-space-size=8192' vitest run --coverage && open coverage/index.html",
    "test:coverage:check": "NODE_OPTIONS='--max-old-space-size=8192' vitest run --coverage && node scripts/coverage-check.js",

    // ✅ COMPONENT-SPECIFIC COVERAGE
    "test:coverage:components": "vitest run --coverage src/components/",
    "test:coverage:api": "vitest run --coverage src/app/api/",
    "test:coverage:lib": "vitest run --coverage src/lib/",

    // ✅ QUALITY GATES
    "test:quality": "node scripts/quality-gate.js",
    "test:all": "pnpm test:run && pnpm test:e2e && pnpm test:quality"
  }
}
```

---

## 📊 COVERAGE SCRIPTS

### Script 1: Coverage Summary
**File:** `frontend/scripts/coverage-summary.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const summaryPath = path.join(__dirname, '../coverage/coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error('❌ Coverage summary not found. Run tests with --coverage first.');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const total = summary.total;

console.log('\n📊 COVERAGE SUMMARY\n');
console.log('┌─────────────┬────────┬───────┬──────────┬───────────┐');
console.log('│ Category    │ Lines  │ Funcs │ Branches │ Stmts     │');
console.log('├─────────────┼────────┼───────┼──────────┼───────────┤');

const formatPercent = (pct) => `${pct.toFixed(1)}%`.padStart(6);
const formatCovered = (c, t) => `${c}/${t}`.padStart(10);

console.log(
  `│ Global      │ ${formatPercent(total.lines.pct)} │ ${formatPercent(total.functions.pct)} │ ${formatPercent(total.branches.pct)}   │ ${formatPercent(total.statements.pct)}  │`
);

console.log('└─────────────┴────────┴───────┴──────────┴───────────┘\n');

// Detailed breakdown
console.log('Detailed:');
console.log(`  Lines:      ${formatCovered(total.lines.covered, total.lines.total)} (${formatPercent(total.lines.pct)})`);
console.log(`  Functions:  ${formatCovered(total.functions.covered, total.functions.total)} (${formatPercent(total.functions.pct)})`);
console.log(`  Branches:   ${formatCovered(total.branches.covered, total.branches.total)} (${formatPercent(total.branches.pct)})`);
console.log(`  Statements: ${formatCovered(total.statements.covered, total.statements.total)} (${formatPercent(total.statements.pct)})`);
console.log();

// Pass/fail indicators
const passed = {
  lines: total.lines.pct >= 70,
  functions: total.functions.pct >= 70,
  branches: total.branches.pct >= 65,
  statements: total.statements.pct >= 70,
};

const allPassed = Object.values(passed).every(Boolean);

if (allPassed) {
  console.log('✅ All coverage thresholds met!');
} else {
  console.log('⚠️  Some thresholds not met:');
  if (!passed.lines) console.log('  ❌ Lines < 70%');
  if (!passed.functions) console.log('  ❌ Functions < 70%');
  if (!passed.branches) console.log('  ❌ Branches < 65%');
  if (!passed.statements) console.log('  ❌ Statements < 70%');
}

console.log('\n📁 Full report: coverage/index.html\n');
```

### Script 2: Coverage Check (Quality Gate)
**File:** `frontend/scripts/coverage-check.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const summaryPath = path.join(__dirname, '../coverage/coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error('❌ Coverage summary not found. Run tests with --coverage first.');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const total = summary.total;

// Define thresholds (match vitest.config.ts)
const thresholds = {
  lines: 70,
  functions: 70,
  branches: 65,
  statements: 70,
};

console.log('\n🎯 COVERAGE QUALITY GATE\n');

const checks = {
  lines: total.lines.pct >= thresholds.lines,
  functions: total.functions.pct >= thresholds.functions,
  branches: total.branches.pct >= thresholds.branches,
  statements: total.statements.pct >= thresholds.statements,
};

const results = [];

Object.entries(checks).forEach(([metric, passed]) => {
  const value = total[metric].pct.toFixed(1);
  const threshold = thresholds[metric];
  const status = passed ? '✅' : '❌';
  const symbol = passed ? '≥' : '<';

  console.log(`${status} ${metric.padEnd(11)}: ${value}% ${symbol} ${threshold}%`);
  results.push({ metric, value: parseFloat(value), threshold, passed });
});

const allPassed = Object.values(checks).every(Boolean);

if (allPassed) {
  console.log('\n✅ QUALITY GATE: PASSED\n');
  process.exit(0);
} else {
  console.log('\n❌ QUALITY GATE: FAILED\n');
  console.log('Please increase test coverage before merging.\n');
  process.exit(1);
}
```

### Script 3: Quality Gate (Combined)
**File:** `frontend/scripts/quality-gate.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔍 RUNNING QUALITY GATES\n');

// 1. Check coverage
const summaryPath = path.join(__dirname, '../coverage/coverage-summary.json');
let coveragePassed = true;

if (fs.existsSync(summaryPath)) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const total = summary.total;

  coveragePassed =
    total.lines.pct >= 70 &&
    total.functions.pct >= 70 &&
    total.branches.pct >= 65 &&
    total.statements.pct >= 70;

  console.log(`${coveragePassed ? '✅' : '❌'} Coverage: ${total.lines.pct.toFixed(1)}%`);
} else {
  console.log('⚠️  Coverage report not found (run pnpm test:coverage first)');
  coveragePassed = false;
}

// 2. Check test results
const testResultsPath = path.join(__dirname, '../test-results/results.json');
let testsPassed = true;

if (fs.existsSync(testResultsPath)) {
  const results = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
  testsPassed = results.numFailedTests === 0;

  console.log(`${testsPassed ? '✅' : '❌'} Tests: ${results.numPassedTests}/${results.numTotalTests} passing`);
} else {
  console.log('⚠️  Test results not found');
}

// 3. Summary
console.log('\n' + '─'.repeat(50));

const allPassed = coveragePassed && testsPassed;

if (allPassed) {
  console.log('\n✅ ALL QUALITY GATES PASSED\n');
  process.exit(0);
} else {
  console.log('\n❌ QUALITY GATES FAILED\n');
  if (!coveragePassed) console.log('  → Increase test coverage');
  if (!testsPassed) console.log('  → Fix failing tests');
  console.log();
  process.exit(1);
}
```

---

## 📊 GITHUB ACTIONS INTEGRATION

**File:** `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests with coverage
        run: |
          cd frontend
          pnpm test:coverage

      - name: Run quality gate
        run: |
          cd frontend
          pnpm test:quality

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: unittests
          name: frontend-coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: frontend/coverage/

      - name: Comment PR with coverage
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./frontend/coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## 📈 USAGE EXAMPLES

### Run Coverage Locally
```bash
cd frontend

# Run all tests with coverage
pnpm test:coverage

# Open HTML report
pnpm test:coverage:open

# Get summary
pnpm test:coverage:summary

# Check quality gate
pnpm test:coverage:check
```

### Check Specific Coverage
```bash
# Components only
pnpm test:coverage:components

# API routes only
pnpm test:coverage:api

# Lib utilities only
pnpm test:coverage:lib
```

### Watch Mode
```bash
# Watch tests with coverage
pnpm test:coverage:watch

# Watch with UI
pnpm test:coverage:ui
```

---

## 📊 PROGRESSIVE THRESHOLD UPDATES

As you add tests, gradually increase thresholds:

### Month 1 (Current → 85%)
```typescript
global: { branches: 65, functions: 70, lines: 70, statements: 70 }
```

### Month 2 (85% → 95%)
```typescript
global: { branches: 75, functions: 80, lines: 80, statements: 80 }
```

### Final (95%+)
```typescript
global: { branches: 85, functions: 90, lines: 90, statements: 90 }
```

---

## ✅ SETUP CHECKLIST

- [ ] Update `vitest.config.ts` with new coverage configuration
- [ ] Add coverage scripts to `package.json`
- [ ] Create `scripts/coverage-summary.js`
- [ ] Create `scripts/coverage-check.js`
- [ ] Create `scripts/quality-gate.js`
- [ ] Make scripts executable: `chmod +x frontend/scripts/*.js`
- [ ] Test coverage report: `pnpm test:coverage`
- [ ] Verify quality gate works: `pnpm test:quality`
- [ ] Add GitHub Actions workflow (optional)

---

## 🎯 EXPECTED OUTPUT

### Coverage Summary
```
📊 COVERAGE SUMMARY

┌─────────────┬────────┬───────┬──────────┬───────────┐
│ Category    │ Lines  │ Funcs │ Branches │ Stmts     │
├─────────────┼────────┼───────┼──────────┼───────────┤
│ Global      │  72.3% │  74.1%│   67.8%  │   73.2%   │
└─────────────┴────────┴───────┴──────────┴───────────┘

✅ All coverage thresholds met!

📁 Full report: coverage/index.html
```

### Quality Gate
```
🎯 COVERAGE QUALITY GATE

✅ lines      : 72.3% ≥ 70%
✅ functions  : 74.1% ≥ 70%
✅ branches   : 67.8% ≥ 65%
✅ statements : 73.2% ≥ 70%

✅ QUALITY GATE: PASSED
```

---

**Time to Set Up:** 30-45 minutes
**Impact:** Automated coverage tracking, quality enforcement
**Status:** Ready to implement



