# Additional System Prompt Improvements & Opportunities

## 🔍 Deep Analysis - Additional Improvements

After deeper codebase analysis, here are **30+ additional improvements** that would make the system prompt even more powerful:

---

## 🎯 Critical Missing Patterns

### 1. **Decision-Making Framework**
**MISSING**: When to refactor vs add new code, when to create new files vs extend existing.

```typescript
// ✅ DECISION FRAMEWORK
// Before making changes, ask:
// 1. Does similar code exist? → Reuse/extend
// 2. Is the file > 300 lines? → Consider splitting
// 3. Is this a new feature? → Create new file
// 4. Is this a bug fix? → Fix in place
// 5. Is this a pattern change? → Refactor all instances

// Example decision tree:
if (similarComponentExists) {
  // Extend existing component
  return extendComponent(existingComponent, newProps);
} else if (fileIsTooLarge) {
  // Split into smaller components
  return splitIntoSmallerComponents(file);
} else {
  // Create new component
  return createNewComponent();
}
```

**Why it matters**: Prevents code duplication and maintains organization.

---

### 2. **Code Organization Patterns**
**MISSING**: When to create new files, how to organize utilities.

```typescript
// ✅ FILE ORGANIZATION RULES
// Create new file when:
// - Component > 300 lines
// - Utility function is reusable across multiple files
// - Feature has 3+ related functions
// - Complex logic that needs isolation

// File naming:
// - Components: PascalCase (BookingForm.tsx)
// - Utilities: camelCase (validation.ts)
// - Types: camelCase with .types.ts suffix (booking.types.ts)
// - Hooks: camelCase with use prefix (useBooking.ts)

// Directory structure:
// components/
//   booking/
//     BookingForm.tsx        # Main component
//     BookingForm.test.tsx   # Tests
//     booking.types.ts       # Types
//     booking.utils.ts       # Utilities
```

**Why it matters**: Consistent organization improves maintainability.

---

### 3. **Caching Strategy Patterns**
**MISSING**: When and how to use caching.

```typescript
// ✅ CORRECT - Caching patterns
import { cache, CACHE_KEYS, withCache } from '@/lib/cache';

// 1. Use cache for expensive operations
const equipment = await withCache(
  CACHE_KEYS.EQUIPMENT_LIST,
  () => supabaseApi.getEquipmentList(),
  5 * 60 * 1000 // 5 minutes TTL
);

// 2. Invalidate cache on mutations
async function createBooking(data: BookingInsert) {
  const booking = await supabase.from('bookings').insert(data);
  
  // Invalidate related caches
  cache.delete(CACHE_KEYS.BOOKING_HISTORY);
  cache.delete(CACHE_KEYS.ADMIN_STATS);
  
  return booking;
}

// 3. Cache keys should be descriptive
export const CACHE_KEYS = {
  BOOKING_AVAILABILITY: (equipmentId: string, start: string, end: string) =>
    `booking:availability:${equipmentId}:${start}:${end}`,
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
} as const;
```

**Why it matters**: Caching improves performance but needs proper invalidation.

---

### 4. **Form Handling Patterns**
**MISSING**: React form state management patterns.

```typescript
// ✅ CORRECT - Form handling pattern
'use client';

import { useState, useCallback } from 'react';
import { validateEmail, validatePhone } from '@/lib/validation';

export default function BookingForm() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    startDate: '',
    endDate: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validate on blur
  const handleBlur = useCallback((field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'email':
        if (!validateEmail(value)) error = 'Invalid email address';
        break;
      case 'phone':
        if (!validatePhone(value)) error = 'Invalid phone number';
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);
  
  // Handle input changes
  const handleChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);
  
  // Validate before submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit to server (server will validate again)
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      // Handle response...
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with error display */}
    </form>
  );
}
```

**Why it matters**: Consistent form handling improves UX and reduces bugs.

---

### 5. **Validation Strategy (Client vs Server)**
**MISSING**: When to validate client-side vs server-side.

```typescript
// ✅ VALIDATION STRATEGY
// Client-side validation:
// - Immediate feedback for UX
// - Prevents unnecessary API calls
// - Uses same validation functions as server
// - NEVER trust client validation alone

// Server-side validation:
// - MANDATORY for all inputs
// - Security-critical
// - Uses Zod schemas
// - Returns detailed error messages

// ✅ CORRECT - Dual validation
// Client (for UX)
const clientErrors = validateForm(formData);
if (clientErrors.length > 0) {
  setErrors(clientErrors);
  return; // Don't submit
}

// Server (for security)
const response = await fetch('/api/bookings', {
  method: 'POST',
  body: JSON.stringify(formData)
});

const serverData = await response.json();
if (!serverData.success) {
  // Server validation failed
  setErrors(serverData.errors);
  return;
}
```

**Why it matters**: Client validation improves UX, server validation ensures security.

---

### 6. **React Hook Patterns**
**MISSING**: When to use which hooks, optimization patterns.

```typescript
// ✅ HOOK USAGE PATTERNS

// useState - For component state
const [loading, setLoading] = useState(false);

// useEffect - For side effects (API calls, subscriptions)
useEffect(() => {
  fetchData().then(setData);
}, [dependencies]); // Always include dependencies

// useCallback - For function memoization (when passed as props)
const handleClick = useCallback(() => {
  performAction(id);
}, [id]); // Include all dependencies

// useMemo - For expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]); // Only recalculate when data changes

// Custom hooks - For reusable logic
function useBooking(bookingId: string) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchBooking(bookingId).then(data => {
      setBooking(data);
      setLoading(false);
    });
  }, [bookingId]);
  
  return { booking, loading };
}
```

**Why it matters**: Proper hook usage prevents bugs and performance issues.

---

### 7. **Error Boundary Usage**
**MISSING**: When and how to use error boundaries.

```typescript
// ✅ CORRECT - Error boundary usage
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Wrap critical sections
export default function Page() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      }
      onError={(error, errorInfo) => {
        logger.error('Page error', {
          component: 'Page',
          error: error.message,
          errorInfo
        }, error);
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}

// Use for:
// - Page-level components
// - Critical features (booking flow, payment)
// - Third-party component wrappers
```

**Why it matters**: Prevents entire app crashes from component errors.

---

### 8. **API Response Consistency**
**MISSING**: Standardized response formats.

```typescript
// ✅ CORRECT - Consistent API responses

// Success responses
return NextResponse.json({
  success: true,
  data: result,
  message?: string // Optional success message
}, { status: 200 | 201 });

// Error responses
return NextResponse.json({
  success: false,
  error: 'User-friendly error message',
  details?: any, // Optional: validation errors, etc.
  code?: string // Optional: error code for client handling
}, { status: 400 | 401 | 403 | 404 | 500 });

// Pagination responses
return NextResponse.json({
  success: true,
  data: items,
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
});

// List responses
return NextResponse.json({
  success: true,
  data: items,
  count: items.length
});
```

**Why it matters**: Consistent responses make frontend integration easier.

---

### 9. **Loading State Patterns**
**MISSING**: How to handle loading states consistently.

```typescript
// ✅ CORRECT - Loading state patterns

// Component loading state
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState(null);

// Loading UI
if (loading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}

if (!data) {
  return <EmptyState />;
}

return <DataDisplay data={data} />;

// Skeleton loading (better UX)
if (loading) {
  return <SkeletonLoader />;
}

// Optimistic updates
const handleAction = async () => {
  // Update UI immediately
  setData(optimisticData);
  
  try {
    const result = await performAction();
    setData(result); // Update with real data
  } catch (error) {
    setData(originalData); // Revert on error
    setError(error.message);
  }
};
```

**Why it matters**: Good loading states improve perceived performance.

---

### 10. **Query Optimization Patterns**
**MISSING**: How to optimize Supabase queries.

```typescript
// ✅ CORRECT - Query optimization

// 1. Select only needed columns
const { data } = await supabase
  .from('bookings')
  .select('id, bookingNumber, status, totalAmount') // Not *
  .eq('customerId', userId);

// 2. Use pagination
const { data, count } = await supabase
  .from('bookings')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)
  .limit(limit);

// 3. Use indexes (ensure columns are indexed)
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('customerId', userId) // Uses idx_bookings_customer_id
  .eq('status', 'confirmed'); // Uses idx_bookings_status

// 4. Avoid N+1 queries (use joins)
const { data } = await supabase
  .from('bookings')
  .select(`
    *,
    equipment:equipmentId(id, name, dailyRate),
    customer:customerId(id, firstName, lastName)
  `)
  .eq('customerId', userId);

// 5. Use RPC for complex queries
const { data } = await supabase.rpc('get_booking_stats', {
  customer_id: userId,
  start_date: startDate,
  end_date: endDate
});
```

**Why it matters**: Optimized queries improve performance and reduce costs.

---

### 11. **Accessibility Patterns (Enhanced)**
**MISSING**: More comprehensive accessibility requirements.

```typescript
// ✅ CORRECT - Comprehensive accessibility

// Form accessibility
<form aria-label="Booking form" noValidate>
  <label htmlFor="email">
    Email Address
    <span className="sr-only" aria-label="Required">*</span>
  </label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={errors.email ? 'true' : 'false'}
    aria-describedby={errors.email ? 'email-error' : 'email-help'}
    aria-label="Email address"
  />
  {errors.email && (
    <div id="email-error" role="alert" aria-live="polite">
      {errors.email}
    </div>
  )}
  <div id="email-help" className="sr-only">
    Enter your email address
  </div>
</form>

// Button accessibility
<button
  aria-label="Close modal"
  aria-describedby="modal-description"
  onClick={handleClose}
>
  <span aria-hidden="true">×</span>
</button>

// Loading states
<button disabled={loading} aria-busy={loading}>
  {loading ? (
    <>
      <LoadingSpinner aria-hidden="true" />
      <span className="sr-only">Processing...</span>
    </>
  ) : (
    'Submit'
  )}
</button>

// Error messages
{error && (
  <div role="alert" aria-live="assertive" className="error-message">
    {error}
  </div>
)}
```

**Why it matters**: Accessibility is a legal requirement and improves UX for all users.

---

### 12. **Performance Optimization Patterns**
**MISSING**: Specific performance optimization techniques.

```typescript
// ✅ CORRECT - Performance optimizations

// 1. Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <SkeletonLoader />,
  ssr: false // Disable SSR if not needed
});

// 2. Image optimization
import Image from 'next/image';

<Image
  src="/equipment.jpg"
  alt="Equipment"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>

// 3. Memoization for expensive renders
const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});

// 4. Virtual scrolling for long lists
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});

// 5. Debounce expensive operations
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value: string) => {
    performSearch(value);
  },
  300 // 300ms delay
);
```

**Why it matters**: Performance directly impacts user experience and conversion.

---

### 13. **State Management Patterns**
**MISSING**: When to use local state vs context vs global state.

```typescript
// ✅ STATE MANAGEMENT DECISIONS

// Local state - Component-specific
const [isOpen, setIsOpen] = useState(false);

// Context - Shared across component tree
const AuthContext = createContext<AuthContextType | null>(null);

// Global state - App-wide (use sparingly)
// Consider: Zustand, Jotai, or Redux for complex state

// ✅ CORRECT - Context pattern
'use client';

const BookingContext = createContext<BookingContextType | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  
  return (
    <BookingContext.Provider value={{ booking, setBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}
```

**Why it matters**: Proper state management prevents prop drilling and improves maintainability.

---

### 14. **Testing Patterns (Enhanced)**
**MISSING**: More comprehensive testing strategies.

```typescript
// ✅ CORRECT - Testing patterns

// Unit tests - Test individual functions
describe('calculateBookingTotal', () => {
  it('calculates correctly with discount', () => {
    const result = calculateBookingTotal({
      dailyRate: 100,
      days: 7,
      deliveryFee: 50
    });
    expect(result.total).toBe(expectedTotal);
  });
});

// Integration tests - Test API routes
describe('POST /api/bookings', () => {
  it('creates booking with valid data', async () => {
    const response = await POST(createMockRequest({...}));
    expect(response.status).toBe(201);
  });
});

// Component tests - Test React components
describe('BookingForm', () => {
  it('validates email on blur', async () => {
    render(<BookingForm />);
    const emailInput = screen.getByLabelText('Email');
    fireEvent.blur(emailInput, { target: { value: 'invalid' } });
    expect(await screen.findByText('Invalid email')).toBeInTheDocument();
  });
});

// E2E tests - Test user flows
test('complete booking flow', async () => {
  await page.goto('/book');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/booking\/\w+/);
});
```

**Why it matters**: Comprehensive testing prevents regressions and bugs.

---

### 15. **Code Review Checklist**
**MISSING**: What to check before considering code complete.

```typescript
// ✅ CODE REVIEW CHECKLIST

// Before submitting code, verify:
// [ ] TypeScript compiles without errors
// [ ] All linter errors resolved
// [ ] Tests written and passing
// [ ] Error handling comprehensive
// [ ] Input validation present
// [ ] Security considerations addressed
// [ ] Performance acceptable
// [ ] Accessibility requirements met
// [ ] Code follows project conventions
// [ ] Documentation added for complex logic
// [ ] No console.log statements
// [ ] No commented-out code
// [ ] No hardcoded values (use constants)
// [ ] No duplicate code
// [ ] Proper error messages
// [ ] Loading states handled
// [ ] Edge cases considered
```

**Why it matters**: Ensures code quality before merge.

---

### 16. **Migration Patterns**
**MISSING**: How to handle database migrations safely.

```sql
-- ✅ CORRECT - Safe migration pattern

-- 1. Add column with default (non-breaking)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';

-- 2. Backfill data (if needed)
UPDATE bookings
SET priority = 'high'
WHERE totalAmount > 1000;

-- 3. Make column NOT NULL (after backfill)
ALTER TABLE bookings
ALTER COLUMN priority SET NOT NULL;

-- 4. Add index CONCURRENTLY (no locks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_priority
ON bookings(priority);

-- 5. Add RLS policy
CREATE POLICY "bookings_priority_select" ON bookings
FOR SELECT TO authenticated
USING (true); -- Adjust as needed

-- ⚠️ DANGEROUS - Requires approval
-- DROP COLUMN (backup first!)
-- DROP TABLE (backup first!)
-- DELETE without WHERE (NEVER!)
```

**Why it matters**: Safe migrations prevent production issues.

---

### 17. **Error Recovery Patterns**
**MISSING**: How to handle errors gracefully and recover.

```typescript
// ✅ CORRECT - Error recovery

// Retry with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // Retry on 5xx errors
      if (response.status >= 500 && i < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error('Max retries exceeded');
}

// Fallback values
const equipment = await getEquipment(id).catch(() => ({
  id,
  name: 'Unknown Equipment',
  status: 'unavailable'
}));

// Graceful degradation
try {
  const stats = await fetchAdminStats();
  return <StatsDashboard stats={stats} />;
} catch (error) {
  logger.error('Failed to load stats', { error });
  return <StatsDashboardUnavailable />;
}
```

**Why it matters**: Error recovery improves resilience and UX.

---

### 18. **Documentation Patterns**
**MISSING**: How to document code effectively.

```typescript
// ✅ CORRECT - Documentation patterns

/**
 * Calculates the total cost for a booking including all fees and taxes.
 * 
 * @param booking - The booking input data
 * @param options - Optional calculation options
 * @returns The calculated total with breakdown
 * @throws {ValidationError} If booking data is invalid
 * 
 * @example
 * ```typescript
 * const total = calculateBookingTotal({
 *   dailyRate: 100,
 *   days: 5,
 *   deliveryCity: 'Saint John'
 * });
 * console.log(total.total); // 632.50
 * ```
 */
export function calculateBookingTotal(
  booking: BookingInput,
  options?: CalculationOptions
): BookingTotal {
  // Implementation...
}

// JSDoc for complex types
/**
 * @typedef {Object} BookingInput
 * @property {string} equipmentId - UUID of the equipment
 * @property {string} startDate - ISO date string
 * @property {string} endDate - ISO date string
 * @property {DeliveryAddress} deliveryAddress - Delivery address object
 */
```

**Why it matters**: Good documentation helps future developers understand code.

---

### 19. **Security Patterns (Enhanced)**
**MISSING**: More security considerations.

```typescript
// ✅ CORRECT - Enhanced security

// 1. CSRF protection (Next.js handles this, but verify)
// Ensure SameSite cookies are set

// 2. XSS prevention
import DOMPurify from 'isomorphic-dompurify';

const cleanHTML = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
  ALLOWED_ATTR: []
});

// 3. SQL injection (Supabase handles this, but verify)
// Always use parameterized queries (Supabase does this automatically)
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('id', userId); // Safe - parameterized

// 4. Rate limiting (already covered, but emphasize)
// ALL API routes must have rate limiting

// 5. Input size limits
const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB
if (file.size > MAX_INPUT_SIZE) {
  throw new Error('File too large');
}

// 6. Content Security Policy (in next.config.js)
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];
```

**Why it matters**: Security is non-negotiable for production apps.

---

### 20. **Monitoring & Observability**
**MISSING**: How to add monitoring and observability.

```typescript
// ✅ CORRECT - Monitoring patterns

// 1. Performance monitoring
import { performanceMonitor } from '@/lib/performance-monitor';

const timer = performanceMonitor.start('booking_creation');
try {
  await createBooking(data);
  performanceMonitor.end(timer, { success: true });
} catch (error) {
  performanceMonitor.end(timer, { success: false, error });
  throw error;
}

// 2. Error tracking
import { errorTracker } from '@/lib/error-tracker';

try {
  await operation();
} catch (error) {
  errorTracker.captureException(error, {
    tags: { component: 'booking-api' },
    extra: { bookingId, userId }
  });
  throw error;
}

// 3. Analytics events
import { analytics } from '@/lib/analytics';

analytics.track('booking_created', {
  bookingId: booking.id,
  totalAmount: booking.totalAmount,
  equipmentType: booking.equipment.type
});
```

**Why it matters**: Monitoring helps identify issues in production.

---

## 📊 Summary of Additional Improvements

### High Priority (10):
1. ✅ Decision-making framework
2. ✅ Code organization patterns
3. ✅ Caching strategy patterns
4. ✅ Form handling patterns
5. ✅ Validation strategy (client vs server)
6. ✅ React hook patterns
7. ✅ Error boundary usage
8. ✅ API response consistency
9. ✅ Loading state patterns
10. ✅ Query optimization patterns

### Medium Priority (10):
11. ✅ Accessibility patterns (enhanced)
12. ✅ Performance optimization patterns
13. ✅ State management patterns
14. ✅ Testing patterns (enhanced)
15. ✅ Code review checklist
16. ✅ Migration patterns
17. ✅ Error recovery patterns
18. ✅ Documentation patterns
19. ✅ Security patterns (enhanced)
20. ✅ Monitoring & observability

---

## 🎯 Impact Assessment

Adding these improvements would make the prompt:
- **More comprehensive**: Covers 30+ additional patterns
- **More actionable**: Provides decision frameworks
- **More maintainable**: Code organization guidance
- **More performant**: Optimization patterns
- **More resilient**: Error recovery patterns
- **More observable**: Monitoring patterns

---

## 🚀 Next Steps

1. **Add to main prompt**: Integrate these patterns into the main system prompt
2. **Create quick reference**: Extract common patterns into a quick reference card
3. **Create decision trees**: Visual decision trees for common scenarios
4. **Add examples**: More real-world examples from codebase
