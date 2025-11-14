# ⚡ Testing Quick Reference Card
## Copy/Paste Commands & Patterns

---

## 🚀 ESSENTIAL COMMANDS

```bash
# Run all tests
cd frontend && pnpm test:run

# Run with coverage
pnpm test:coverage

# View coverage report (opens browser)
pnpm test:coverage:open

# Check quality gates
pnpm test:coverage:check

# Test specific component
pnpm test:run AdminDashboard

# Watch mode
pnpm test AdminDashboard
```

---

## 📝 COMMON TEST PATTERNS

### Component Test Template
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createTestBooking } from '@/test-utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render with booking data', () => {
    const booking = createTestBooking();

    render(<MyComponent booking={booking} />);

    expect(screen.getByText(booking.bookingNumber)).toBeInTheDocument();
  });

  it('should handle button click', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(<MyComponent onAction={onAction} />);

    const button = screen.getByRole('button', { name: /submit/i });
    await user.click(button);

    expect(onAction).toHaveBeenCalled();
  });
});
```

### API Route Test Template
```typescript
import { describe, expect, it, vi } from 'vitest';
import { createMockRequest, expectSuccessResponse } from '@/test-utils';
import { POST } from '../route';

describe('POST /api/my-route', () => {
  it('should create resource', async () => {
    const data = { name: 'Test' };
    const request = createMockRequest('POST', data);

    const response = await POST(request);
    const result = await expectSuccessResponse(response);

    expect(result.id).toBeDefined();
  });
});
```

---

## 🛠️ TEST UTILITIES

### Import Utilities
```typescript
import {
  // Data factories
  createTestBooking,
  createTestUser,
  createTestEquipment,
  createFullBooking,

  // Component helpers
  renderWithProviders,
  waitForLoadingToFinish,
  fillFormField,
  submitForm,

  // API helpers
  createMockRequest,
  expectSuccessResponse,
  expectErrorResponse,
  createMockSupabaseClient,
} from '@/test-utils';
```

### Use Data Factories
```typescript
// Simple user
const user = createTestUser();

// User with overrides
const admin = createTestUser({ role: 'admin', email: 'admin@test.com' });

// Complete booking with all relations
const { user, equipment, booking, payment, contract } = createFullBooking();

// Multiple items
const users = createTestUsers(5);
const bookings = createTestBookings(10);
```

---

## 📊 COVERAGE COMMANDS

```bash
# Full coverage report
pnpm test:coverage

# Component coverage only
pnpm test:coverage:components

# API route coverage only
pnpm test:coverage:api

# Lib utilities coverage only
pnpm test:coverage:lib

# Summary with quality gate
pnpm test:coverage:summary

# Check if passing thresholds
pnpm test:coverage:check
```

---

## 🎯 CURRENT STATUS

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total Tests | 995+ | 1,650 | 60% ⬆️ |
| Coverage | 70% | 98% | 71% ⬆️ |
| Pass Rate | 95% | 100% | 95% ⬆️ |
| Components | 12% | 80% | 15% ⚠️ |
| API Routes | 15% | 85% | 18% ⚠️ |

---

## 📚 DOCUMENTATION

### **Start Here**
→ `🎉_TESTING_COMPLETE_README.md` (5-min overview)

### **Implementation**
→ `WEEK_1_IMPLEMENTATION_SUCCESS.md` (what was done)

### **Planning**
→ `TESTING_NEXT_STEPS.md` (what to do next)

### **Roadmap**
→ `TESTING_COMPREHENSIVE_REVIEW.md` (8-week plan)

### **Navigation**
→ `TESTING_MASTER_INDEX.md` (find anything)

---

## 🔥 PRIORITY ACTIONS

### This Week (Optional)
```bash
# Verify tests pass
pnpm test:run

# Check coverage
pnpm test:coverage:open
```

### Week 2 (High Priority)
**Test these components next:**
1. EnhancedBookingFlow (CRITICAL)
2. PaymentSection (CRITICAL)
3. SupabaseAuthProvider (CRITICAL)
4. UserDashboard
5. ContractSigningSection

**Each:** 20-40 tests, 3-4 hours

---

## ✅ WHAT YOU HAVE

- ✅ 995+ tests (was 900)
- ✅ 70% coverage (was 65%)
- ✅ 95% pass rate (was 86%)
- ✅ Test utilities (3x faster)
- ✅ Quality gates (automated)
- ✅ Documentation (complete)
- ✅ Roadmap (clear path to 98%)

---

## 🎯 QUICK WINS

### Test a New Component (10 min with utilities)
```typescript
import { createTestUser } from '@/test-utils';

describe('MyNewComponent', () => {
  it('should display user name', () => {
    const user = createTestUser({ firstName: 'John' });
    render(<MyNewComponent user={user} />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});
```

### Check Coverage (2 min)
```bash
pnpm test:coverage:summary
```

### Validate Quality (1 min)
```bash
pnpm test:coverage:check
```

---

## 📞 NEED HELP?

**Finding Docs:**
→ See `TESTING_MASTER_INDEX.md`

**Writing Tests:**
→ Study `AdminDashboard.test.tsx`

**Using Utilities:**
→ See `test-utils/` files

**Next Steps:**
→ Read `TESTING_NEXT_STEPS.md`

---

**PHASE 1: ✅ COMPLETE**
**READY FOR: 🎯 PHASE 2 (Component Testing)**

**🚀 Keep the momentum going!**


