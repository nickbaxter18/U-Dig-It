# Admin Dashboard E2E Tests

## Overview

Comprehensive end-to-end test suite for all 15 admin dashboard pages, ensuring complete functionality, performance, security, and accessibility.

## Test Structure

```
frontend/tests/e2e/
├── admin/
│   ├── dashboard.test.ts          # Dashboard page tests
│   ├── bookings.test.ts           # Bookings management tests
│   ├── equipment.test.ts          # Equipment management tests
│   ├── customers.test.ts          # Customer management tests
│   ├── payments.test.ts           # Payment processing tests
│   └── remaining-pages.test.ts    # Tests for other 9 pages
├── helpers/
│   ├── auth.ts                    # Authentication helpers
│   ├── navigation.ts              # Navigation utilities
│   ├── accessibility.ts           # Accessibility testing
│   └── performance.ts             # Performance measurement
└── fixtures/
    └── test-data.ts               # Test data fixtures
```

## Running Tests

### Run All Admin Tests

```bash
pnpm test:e2e:admin
```

### Run Specific Page Tests

```bash
# Dashboard only
pnpm test:e2e:admin -- dashboard

# Bookings only
pnpm test:e2e:admin -- bookings
```

### Interactive UI Mode

```bash
pnpm test:e2e:admin:ui
```

### Debug Mode

```bash
pnpm test:e2e:admin:debug
```

## Test Account

The tests use a dedicated admin test account:

- **Email**: `aitest2@udigit.ca`
- **Password**: `TestAI2024!@#$`
- **Role**: `super_admin`

**Important**: This account must exist in your Supabase database with admin privileges.

## Test Coverage

### Dashboard (`/admin/dashboard`)
- ✅ Page loads without errors
- ✅ Stats cards display data
- ✅ Charts render correctly
- ✅ Date range filtering works
- ✅ Refresh functionality
- ✅ Export functionality
- ✅ System alerts display
- ✅ Recent bookings section
- ✅ Real-time connection indicator
- ✅ Performance targets met
- ✅ Accessibility compliance
- ✅ Responsive design

### Bookings (`/admin/bookings`)
- ✅ Page loads
- ✅ Bookings table displays
- ✅ Status filtering
- ✅ Search functionality
- ✅ Table/Calendar view toggle
- ✅ Booking details modal
- ✅ Export functionality
- ✅ Accessibility

### Equipment (`/admin/equipment`)
- ✅ Page loads
- ✅ Equipment list displays
- ✅ Search functionality
- ✅ Status filtering
- ✅ Add equipment modal
- ✅ View equipment details
- ✅ Export functionality
- ✅ Accessibility

### Customers (`/admin/customers`)
- ✅ Page loads
- ✅ Customers list displays
- ✅ Search functionality
- ✅ Edit customer modal
- ✅ Accessibility

### Payments (`/admin/payments`)
- ✅ Page loads
- ✅ Payments list displays
- ✅ Status filtering
- ✅ Receipt download
- ✅ Accessibility

### Remaining Pages
- ✅ Operations (`/admin/operations`)
- ✅ Support (`/admin/support`)
- ✅ Insurance (`/admin/insurance`)
- ✅ Promotions (`/admin/promotions`)
- ✅ Contracts (`/admin/contracts`)
- ✅ Communications (`/admin/communications`)
- ✅ Analytics (`/admin/analytics`)
- ✅ Audit Log (`/admin/audit`)
- ✅ Settings (`/admin/settings`)
- ✅ ID Verification (`/admin/security/id-verification`)

## Test Helpers

### AdminAuthHelper

Handles authentication for admin tests:

```typescript
const authHelper = new AdminAuthHelper(page, context);
await authHelper.login();
await authHelper.navigateToAdmin('/admin/dashboard');
```

### AdminNavigationHelper

Provides navigation utilities:

```typescript
const navHelper = new AdminNavigationHelper(page);
await navHelper.goToAdminPage('/admin/bookings');
await navHelper.verifyPageLoaded();
await navHelper.waitForDataLoad();
```

### AccessibilityHelper

Runs accessibility audits:

```typescript
const a11yHelper = new AccessibilityHelper(page);
await a11yHelper.audit();
await a11yHelper.checkKeyboardNavigation();
await a11yHelper.verifyAriaLabels();
```

### PerformanceHelper

Measures page performance:

```typescript
const perfHelper = new PerformanceHelper(page);
const metrics = await perfHelper.measurePageLoad('/admin/dashboard');
await perfHelper.assertPerformanceTargets(metrics);
```

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { AdminAuthHelper } from '../../e2e/helpers/auth';
import { AdminNavigationHelper } from '../../e2e/helpers/navigation';

test.describe('Admin New Page', () => {
  let authHelper: AdminAuthHelper;
  let navHelper: AdminNavigationHelper;

  test.beforeEach(async ({ page, context }) => {
    authHelper = new AdminAuthHelper(page, context);
    navHelper = new AdminNavigationHelper(page);
    await authHelper.login();
  });

  test('should load page', async ({ page }) => {
    await navHelper.goToAdminPage('/admin/new-page');
    await navHelper.verifyPageLoaded();
    await expect(page.getByText(/new page/i)).toBeVisible();
  });
});
```

## Troubleshooting

### Tests Fail to Login

1. Verify test account exists: `aitest2@udigit.ca`
2. Check account has `super_admin` role
3. Verify password is correct: `TestAI2024!@#$`

### Page Not Loading

1. Ensure frontend server is running: `pnpm dev`
2. Check server is on `http://localhost:3000`
3. Verify no console errors in browser

### Timeout Errors

1. Increase timeout in test: `test.setTimeout(60000)`
2. Check network connectivity
3. Verify Supabase connection

### Accessibility Failures

1. Review violations in test output
2. Fix ARIA labels and keyboard navigation
3. Improve color contrast if needed

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Admin E2E Tests
  run: |
    pnpm install
    pnpm test:e2e:admin
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Performance Targets

- **Page Load**: < 3 seconds
- **DOMContentLoaded**: < 2 seconds
- **First Contentful Paint**: < 2 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **API Calls**: < 1 second each

## Accessibility Standards

Tests verify WCAG 2.1 AA compliance:
- Keyboard navigation
- ARIA labels
- Color contrast
- Focus indicators
- Screen reader compatibility

## Maintenance

### Updating Test Data

Edit `tests/e2e/fixtures/test-data.ts` to update test data fixtures.

### Adding New Pages

1. Create test file: `tests/e2e/admin/new-page.test.ts`
2. Add to `remaining-pages.test.ts` or create dedicated file
3. Update this documentation

### Updating Helpers

Helpers are in `e2e/helpers/`. Update as needed for new functionality.

## Best Practices

1. **Always login in `beforeEach`** - Ensures clean state
2. **Use helpers** - Don't duplicate navigation/auth logic
3. **Wait for data** - Use `waitForDataLoad()` before assertions
4. **Handle optional elements** - Use `isVisible().catch(() => false)`
5. **Test accessibility** - Include a11y checks in critical tests
6. **Measure performance** - Add perf tests for key pages

## Support

For issues or questions:
1. Check test output for specific errors
2. Review browser console logs
3. Verify test account credentials
4. Check Supabase connection

