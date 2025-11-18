# 🚀 Development Tools Guide

**Godlike coding and development powers for the Kubota Rental Platform**

This guide covers all the power tools installed to supercharge your development workflow.

---

## 📋 Table of Contents

1. [Tool Overview](#tool-overview)
2. [Quick Start Commands](#quick-start-commands)
3. [MSW (Mock Service Worker)](#msw-mock-service-worker)
4. [Storybook](#storybook)
5. [Size Limit](#size-limit)
6. [Knip](#knip)
7. [Husky + Snyk](#husky--snyk)
8. [PostHog (Analytics)](#posthog-analytics)
9. [Chromatic (Visual Regression)](#chromatic-visual-regression)
10. [Best Practices](#best-practices)

---

## Tool Overview

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Vitest** | Unit/integration testing | Every new feature, bug fix |
| **Playwright** | E2E browser testing | Critical user flows |
| **MSW** | API mocking | Testing without real APIs |
| **Storybook** | Component development | Building UI in isolation |
| **Size Limit** | Bundle size monitoring | Before deployment |
| **Knip** | Unused code detection | Code cleanup, refactoring |
| **Snyk** | Security scanning | Every commit (automatic) |
| **Husky** | Git hooks | Pre-commit quality gates |

---

## Quick Start Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm storybook              # Start Storybook

# Testing
pnpm test                   # Run unit tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Generate coverage report
pnpm test:e2e               # Run E2E tests

# Code Quality
pnpm lint                   # ESLint
pnpm type-check             # TypeScript
pnpm format                 # Prettier
pnpm quality:fast           # Lint + Type Check
pnpm quality:all            # Full quality check

# Security
pnpm security:scan          # Snyk code scan
pnpm security:deps          # Snyk dependency check
pnpm security:all           # Both scans

# Bundle Analysis
pnpm size                   # Check bundle sizes
pnpm size:why               # Detailed analysis
pnpm analyze                # Full bundle analyzer

# Code Cleanup
pnpm knip                   # Find unused code
pnpm unused                 # Alias for knip
```

---

## MSW (Mock Service Worker)

**Purpose**: Mock API responses in tests and Storybook without hitting real endpoints.

### Benefits
- ✅ Fast, reliable tests
- ✅ No network flakiness
- ✅ Easy error state testing
- ✅ Works in browser and Node.js
- ✅ Same code as production

### Configuration Files
- `src/test/mocks/handlers.ts` - Mock API handlers
- `src/test/mocks/server.ts` - Node.js server (for Vitest)
- `src/test/mocks/browser.ts` - Browser worker (for Storybook)

### Example: Mocking Supabase Query

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

test('fetches equipment', async () => {
  render(<EquipmentList />);

  // MSW intercepts the request automatically
  await waitFor(() => {
    expect(screen.getByText('Kubota SVL-75')).toBeInTheDocument();
  });
});

test('handles errors', async () => {
  // Override handler for this test
  server.use(
    http.get('*/rest/v1/equipment', () => {
      return HttpResponse.json({ error: 'Failed' }, { status: 500 });
    })
  );

  render(<EquipmentList />);

  await waitFor(() => {
    expect(screen.getByText(/Error/)).toBeInTheDocument();
  });
});
```

### Adding New Handlers

Edit `src/test/mocks/handlers.ts`:

```typescript
export const handlers = [
  // New endpoint
  http.post('/api/bookings', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 'new-booking-id',
      status: 'confirmed',
    });
  }),
];
```

### Using in Storybook

Uncomment lines in `.storybook/preview.tsx` to enable MSW in Storybook.

---

## Storybook

**Purpose**: Develop and test UI components in isolation.

### Start Storybook

```bash
pnpm storybook
# Opens http://localhost:6006
```

### Creating Stories

Create `ComponentName.stories.tsx` next to your component:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Click me',
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
    children: 'Loading...',
  },
};
```

### Benefits
- 🎨 Visual component testing
- 📚 Living documentation
- ♿ Accessibility testing (built-in)
- 🔍 Interactive prop exploration
- 📸 Visual regression with Chromatic

### Addons Included
- **Essentials**: Controls, Actions, Docs
- **A11y**: Accessibility testing
- **Interactions**: User interaction testing
- **Coverage**: Test coverage in Storybook

---

## Size Limit

**Purpose**: Prevent bundle bloat by enforcing size limits.

### Check Bundle Sizes

```bash
pnpm size

# Output:
# ✓ Client Bundle (First Load JS)  145 KB (limit: 150 KB)
# ✓ Main CSS                        28 KB (limit: 30 KB)
# ✓ Booking Flow Bundle             75 KB (limit: 80 KB)
```

### Detailed Analysis

```bash
pnpm size:why

# Shows what's in each bundle
```

### Configuration

Edit `.size-limit.json`:

```json
[
  {
    "name": "Client Bundle",
    "path": ".next/static/**/*.js",
    "limit": "150 KB"
  }
]
```

### CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Check bundle size
  run: pnpm size
```

---

## Knip

**Purpose**: Find unused files, dependencies, exports, and types.

### Find Unused Code

```bash
pnpm knip

# Output:
# Unused files (2)
#   src/components/OldComponent.tsx
#   src/utils/deprecated.ts
#
# Unused dependencies (3)
#   moment (use date-fns instead)
#
# Unused exports (5)
#   src/lib/helpers.ts: unusedFunction
```

### Production Only

```bash
pnpm knip:production

# Only checks production code (ignores test files)
```

### Fix Issues

```bash
# Remove unused dependencies
pnpm remove moment lodash

# Delete unused files
rm src/components/OldComponent.tsx
```

### Configuration

Edit `knip.json` to customize ignored files/patterns.

---

## Husky + Snyk

**Purpose**: Automated quality gates and security scanning on commit.

### Pre-commit Hook

Automatically runs on `git commit`:

1. **Lint & Format** - ESLint + Prettier
2. **Type Check** - TypeScript compilation
3. **Snyk Security Scan** - Find vulnerabilities

### What Happens

```bash
git commit -m "Add feature"

# 🔍 Pre-commit Quality Gates + Security Scan
# 🎨 Running lint-staged...
# ✓ ESLint passed
# ✓ Prettier passed
#
# 📝 Running type checks...
# ✓ No type errors
#
# 🛡️  Running Snyk code scan...
# ✓ No high-severity issues found
#
# ✅ All quality gates passed!
```

### If Issues Found

```bash
# Fix linting issues
pnpm lint:fix

# Fix type errors
pnpm type-check:verbose

# Fix security issues
pnpm security:scan
# Follow Snyk recommendations
```

### Skip Hook (Emergency Only)

```bash
git commit --no-verify -m "Emergency fix"

# ⚠️ Only use in emergencies!
```

---

## PostHog (Analytics)

**Purpose**: Track user behavior and product analytics.

### Installation (Already Installed)

```bash
# Already added: posthog-js
```

### Setup (Add to your app)

```typescript
// src/lib/posthog.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.opt_out_capturing();
      }
    },
  });
}

export default posthog;
```

### Track Events

```typescript
import posthog from '@/lib/posthog';

// Track booking creation
posthog.capture('booking_created', {
  equipment_id: equipmentId,
  total_amount: totalAmount,
  duration_days: days,
});

// Track feature usage
posthog.capture('feature_used', {
  feature: 'spin_wheel',
  result: 'discount_10_percent',
});
```

---

## Chromatic (Visual Regression)

**Purpose**: Catch visual bugs by comparing component screenshots.

### Setup

```bash
# Already installed: chromatic

# Get project token from https://www.chromatic.com/
npx chromatic --project-token=<your-token>
```

### Run Visual Tests

```bash
# Build Storybook and upload to Chromatic
pnpm chromatic

# Output:
# ✓ 45 stories tested
# ✓ 2 changes detected
# → Review changes at https://chromatic.com/build?...
```

### CI Integration

Add to `.github/workflows/chromatic.yml`:

```yaml
- name: Run Chromatic
  uses: chromaui/action@v1
  with:
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

---

## Best Practices

### Daily Workflow

1. **Start Development**
   ```bash
   pnpm dev              # Main app
   pnpm storybook        # Component development
   ```

2. **Before Committing**
   ```bash
   pnpm quality:fast     # Quick check
   pnpm test             # Run tests
   # Husky runs automatically on commit
   ```

3. **Before Pushing**
   ```bash
   pnpm quality:all      # Full quality check
   pnpm size             # Check bundle size
   ```

4. **Weekly Maintenance**
   ```bash
   pnpm knip             # Find unused code
   pnpm security:all     # Security audit
   ```

### Testing Strategy

```
Unit Tests (Vitest + MSW)
├─ Business logic
├─ Utilities
├─ API interactions (mocked)
└─ Component behavior

E2E Tests (Playwright)
├─ Critical user flows
├─ Booking process
├─ Payment flow
└─ Admin operations

Visual Tests (Storybook + Chromatic)
├─ Component variations
├─ Responsive layouts
└─ Theme changes
```

### Performance Budget

| Metric | Target | Tool |
|--------|--------|------|
| First Load JS | < 150 KB | Size Limit |
| CSS Bundle | < 30 KB | Size Limit |
| Time to Interactive | < 2s | Lighthouse |
| Lighthouse Score | > 90 | Lighthouse CI |

### Security Checklist

- [x] Snyk runs on every commit (automatic)
- [x] Dependency updates reviewed weekly
- [x] High-severity issues blocked
- [x] Environment variables validated
- [x] Input sanitization tested

---

## Troubleshooting

### MSW Not Working

```bash
# Ensure service worker is registered
npx msw init public/ --save

# Check setup.ts includes server setup
grep "server.listen" src/test/setup.ts
```

### Storybook Build Fails

```bash
# Clear cache
rm -rf node_modules/.cache storybook-static

# Rebuild
pnpm build-storybook
```

### Size Limit Exceeded

```bash
# Analyze what's large
pnpm size:why

# Common fixes:
# 1. Dynamic imports for large components
# 2. Remove unused dependencies
# 3. Use lighter alternatives
```

### Husky Not Running

```bash
# Reinstall hooks
pnpm prepare

# Check hook exists
cat .husky/pre-commit

# Test manually
bash .husky/pre-commit
```

---

## Resources

- **MSW**: https://mswjs.io/docs/
- **Storybook**: https://storybook.js.org/
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/
- **Size Limit**: https://github.com/ai/size-limit
- **Knip**: https://knip.dev/
- **Snyk**: https://docs.snyk.io/
- **PostHog**: https://posthog.com/docs

---

## Next Steps

1. ✅ Tools installed and configured
2. ✅ Example tests and stories created
3. ✅ Git hooks active
4. 🎯 Write tests for your features
5. 🎯 Create Storybook stories for components
6. 🎯 Monitor bundle sizes
7. 🎯 Run security scans regularly

---

**You now have godlike development powers! 🚀**

Use these tools daily to:
- Write better tests
- Catch bugs early
- Ship faster
- Maintain quality
- Stay secure

