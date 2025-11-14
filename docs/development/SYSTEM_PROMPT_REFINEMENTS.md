# System Prompt Refinements & Improvements

## 🔍 Analysis Summary

After reviewing the codebase, I've identified **20+ refinements and missed opportunities** to make the system prompt more powerful and accurate.

---

## ✅ Critical Additions

### 1. Admin Route Helper Pattern

**MISSING**: The `requireAdmin` helper is a common pattern that should be documented.

```typescript
// ✅ CORRECT - Use requireAdmin helper for admin routes
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export async function POST(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  
  if (adminResult.error) {
    return adminResult.error; // Already a NextResponse with 401/403
  }
  
  // adminResult contains: { supabase, user, role }
  const { supabase, user, role } = adminResult;
  
  // Proceed with admin operation...
}
```

**Why it matters**: This is used extensively in admin routes and provides consistent auth handling.

---

### 2. Supabase Error Handling Pattern

**MISSING**: The `handleSupabaseError` utility provides consistent error handling.

```typescript
// ✅ CORRECT - Use handleSupabaseError for Supabase errors
import { handleSupabaseError, getErrorMessage } from '@/lib/supabase/error-handler';

try {
  const { data, error } = await supabase.from('bookings').insert(...);
  
  if (error) {
    const supabaseError = handleSupabaseError(error);
    logger.error('Database operation failed', {
      component: 'booking-api',
      error: supabaseError.code
    });
    
    return NextResponse.json(
      { error: getErrorMessage(supabaseError) },
      { status: supabaseError.code === 'UNAUTHORIZED' ? 403 : 400 }
    );
  }
} catch (error) {
  // Handle other errors...
}
```

**Why it matters**: Provides user-friendly error messages and consistent error handling.

---

### 3. Input Sanitization Functions

**MISSING**: Specific sanitization functions for different input types.

```typescript
// ✅ CORRECT - Use specific sanitization functions
import { 
  sanitizeTextInput, 
  sanitizeEmail, 
  sanitizePhone,
  sanitizeBookingFormData 
} from '@/lib/input-sanitizer';

// Sanitize before validation
const sanitizedEmail = sanitizeEmail(body.email);
const sanitizedPhone = sanitizePhone(body.phone);
const sanitizedNotes = sanitizeTextInput(body.notes, 2000); // Max 2000 chars

// Or use composite sanitizer
const sanitized = sanitizeBookingFormData(body);
const validated = bookingSchema.parse(sanitized);
```

**Why it matters**: Different input types need different sanitization rules.

---

### 4. Notification Service Pattern

**MISSING**: In-app notification creation pattern.

```typescript
// ✅ CORRECT - Create in-app notifications
import { createInAppNotification } from '@/lib/notification-service';

await createInAppNotification({
  supabase, // Optional - pass existing client
  userId: user.id,
  title: 'Booking Confirmed',
  message: `Your booking ${booking.bookingNumber} has been confirmed`,
  category: 'booking',
  priority: 'high',
  actionUrl: `/booking/${booking.id}`,
  ctaLabel: 'View Booking',
  metadata: { bookingId: booking.id }
});
```

**Why it matters**: Notifications are a core feature and should be documented.

---

### 5. Test Utilities & Factories

**MISSING**: Test data factories and helpers.

```typescript
// ✅ CORRECT - Use test utilities
import { 
  createTestUser, 
  createTestBooking, 
  createTestEquipment,
  renderWithProviders 
} from '@/test-utils';

describe('Booking API', () => {
  it('creates booking', async () => {
    const testUser = createTestUser({ role: 'customer' });
    const testEquipment = createTestEquipment({ status: 'available' });
    const testBooking = createTestBooking({
      customerId: testUser.id,
      equipmentId: testEquipment.id
    });
    
    // Test with realistic data...
  });
});
```

**Why it matters**: Consistent test data makes tests more maintainable.

---

### 6. Logger Signature Pattern

**MISSING**: The logger has a specific signature that should be documented.

```typescript
// ✅ CORRECT - Logger signature
logger.info(message: string, context?: LogContext): void;
logger.error(message: string, context?: LogContext, error?: Error): void;
logger.warn(message: string, context?: LogContext): void;
logger.debug(message: string, context?: LogContext): void;

// Context structure
interface LogContext {
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

// Usage
logger.info('Booking created', {
  component: 'booking-api',
  action: 'create',
  metadata: { bookingId, customerId }
});

logger.error('Payment failed', {
  component: 'payment-api',
  action: 'payment_error',
  metadata: { bookingId }
}, error); // Error as third parameter
```

**Why it matters**: Consistent logging structure improves debugging.

---

### 7. Rate Limit Preset Selection

**MISSING**: Guidance on which rate limit preset to use when.

```typescript
// ✅ CORRECT - Choose appropriate preset
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';

// VERY_STRICT: Payment captures, refunds (10 req/min)
const result = await rateLimit(request, RateLimitPresets.VERY_STRICT);

// STRICT: Auth, card verification (20 req/min)
const result = await rateLimit(request, RateLimitPresets.STRICT);

// MODERATE: Booking creation, general API (60 req/min)
const result = await rateLimit(request, RateLimitPresets.MODERATE);

// RELAXED: Public endpoints, equipment listing (120 req/min)
const result = await rateLimit(request, RateLimitPresets.RELAXED);
```

**Why it matters**: Different endpoints need different rate limits.

---

### 8. Response Format Consistency

**MISSING**: Some APIs use `success: false`, others use `error`. Should be consistent.

```typescript
// ✅ CORRECT - Consistent response format
// Success responses
return NextResponse.json({ 
  success: true, 
  data: result 
}, { status: 201 });

// Error responses
return NextResponse.json({ 
  success: false,
  error: 'User-friendly message',
  details?: errorDetails // Optional for validation errors
}, { status: 400 });
```

**Why it matters**: Consistent API responses improve developer experience.

---

### 9. Type Safety with Database Types

**MISSING**: Using generated Supabase types.

```typescript
// ✅ CORRECT - Use generated types
import { Database } from '@/../../supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

// Use in functions
function createBooking(data: BookingInsert): Promise<Booking> {
  // ...
}

// Use enum types
type NotificationCategory = Database['public']['Enums']['notification_category'];
type BookingStatus = Database['public']['Enums']['booking_status'];
```

**Why it matters**: Type safety prevents bugs and improves IDE support.

---

### 10. Environment Variable Patterns

**MISSING**: Which env vars to use and when.

```typescript
// ✅ CORRECT - Environment variable usage

// Public (frontend) - Safe to expose
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
process.env.NEXT_PUBLIC_APP_URL

// Private (server-only) - NEVER expose
process.env.SUPABASE_SERVICE_ROLE_KEY // Only in server routes
process.env.STRIPE_SECRET_KEY // Only in server routes
process.env.SENDGRID_API_KEY // Only in server routes

// Always validate
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}
```

**Why it matters**: Prevents accidentally exposing secrets.

---

## 🎯 Business Logic Refinements

### 11. Booking Status Transitions

**MISSING**: Valid state transitions should be documented.

```typescript
// ✅ CORRECT - Valid status transitions
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['paid', 'cancelled'],
  paid: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [] // Terminal state
};

function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

**Why it matters**: Prevents invalid state transitions.

---

### 12. Pricing Calculation Edge Cases

**MISSING**: Edge cases in pricing calculations.

```typescript
// ✅ CORRECT - Handle edge cases
export function calculateBookingTotal(booking: BookingInput): BookingTotal {
  // Validate dates
  if (booking.endDate <= booking.startDate) {
    throw new Error('End date must be after start date');
  }
  
  const days = calculateDays(booking.startDate, booking.endDate);
  
  // Minimum 1 day rental
  if (days < 1) {
    throw new Error('Rental must be at least 1 day');
  }
  
  // Maximum 365 days (1 year)
  if (days > 365) {
    throw new Error('Rental cannot exceed 365 days');
  }
  
  // Calculate with rounding
  const baseCost = Math.round(days * booking.dailyRate * 100) / 100;
  // ... rest of calculation
}
```

**Why it matters**: Edge cases can cause calculation errors.

---

### 13. Availability Check Optimization

**MISSING**: Optimized availability checking pattern.

```typescript
// ✅ CORRECT - Optimized availability check
export async function checkAvailability(
  equipmentId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilityResult> {
  const supabase = await createClient();
  
  // Single query with OR condition (more efficient)
  const { data: conflicts } = await supabase
    .from('availability_blocks')
    .select('id, start_at_utc, end_at_utc, reason')
    .eq('equipment_id', equipmentId)
    .or(`and(start_at_utc.lte.${endDate},end_at_utc.gte.${startDate})`)
    .in('reason', ['booking', 'maintenance', 'blackout']);
  
  // Check equipment status
  const { data: equipment } = await supabase
    .from('equipment')
    .select('status')
    .eq('id', equipmentId)
    .single();
  
  if (equipment?.status !== 'available') {
    return {
      available: false,
      message: `Equipment is ${equipment?.status}`
    };
  }
  
  return {
    available: conflicts.length === 0,
    conflicts: conflicts || []
  };
}
```

**Why it matters**: More efficient queries improve performance.

---

## 🔧 Technical Refinements

### 14. Migration Patterns

**MISSING**: How to structure migrations.

```sql
-- ✅ CORRECT - Migration structure
-- File: supabase/migrations/YYYYMMDDHHMMSS_description.sql

-- 1. Create table
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add indexes CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_new_table_created_at 
ON new_table(created_at DESC);

-- 3. Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "new_table_select" ON new_table
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 5. Add updated_at trigger
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON new_table
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Why it matters**: Consistent migrations are easier to maintain.

---

### 15. Stripe Webhook Pattern

**MISSING**: Webhook handling pattern.

```typescript
// ✅ CORRECT - Stripe webhook handling
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', {
      component: 'stripe-webhook',
      error: err
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  // Handle event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
      break;
    default:
      logger.warn('Unhandled webhook event', {
        component: 'stripe-webhook',
        eventType: event.type
      });
  }
  
  return NextResponse.json({ received: true });
}
```

**Why it matters**: Webhooks are critical for payment processing.

---

### 16. File Upload Pattern

**MISSING**: Storage upload pattern.

```typescript
// ✅ CORRECT - File upload to Supabase Storage
export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const supabase = await createClient();
  
  // Validate file type and size
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    logger.error('File upload failed', {
      component: 'file-upload',
      bucket,
      path,
      error
    });
    throw error;
  }
  
  // Get public URL
  const { data: urlData } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);
  
  return urlData?.signedUrl || '';
}
```

**Why it matters**: File uploads need validation and error handling.

---

### 17. Component Error Boundaries

**MISSING**: Error boundary pattern for React components.

```typescript
// ✅ CORRECT - Error boundary usage
'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Page() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong</div>}
      onError={(error, errorInfo) => {
        logger.error('Component error', {
          component: 'Page',
          error: error.message,
          errorInfo
        });
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

**Why it matters**: Prevents entire app crashes from component errors.

---

### 18. Accessibility Patterns

**MISSING**: More specific accessibility requirements.

```typescript
// ✅ CORRECT - Accessibility patterns
<button
  aria-label="Close modal"
  aria-describedby="modal-description"
  onClick={handleClose}
>
  <span aria-hidden="true">×</span>
</button>

<form aria-label="Booking form">
  <label htmlFor="start-date">
    Start Date
    <span className="sr-only">Required</span>
  </label>
  <input
    id="start-date"
    type="date"
    aria-required="true"
    aria-invalid={errors.startDate ? 'true' : 'false'}
    aria-describedby={errors.startDate ? 'start-date-error' : undefined}
  />
  {errors.startDate && (
    <div id="start-date-error" role="alert" className="text-red-600">
      {errors.startDate}
    </div>
  )}
</form>
```

**Why it matters**: Accessibility is a legal requirement and improves UX.

---

### 19. Performance Optimization Patterns

**MISSING**: Specific performance patterns.

```typescript
// ✅ CORRECT - Performance optimizations

// 1. Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <SkeletonLoader />,
  ssr: false
});

// 2. Memoization for expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// 3. Callback memoization
const handleClick = useCallback(() => {
  performAction(id);
}, [id]);

// 4. Pagination for large lists
const { data, count } = await supabase
  .from('bookings')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)
  .limit(limit);
```

**Why it matters**: Performance affects user experience.

---

### 20. Contract Generation Pattern

**MISSING**: PDF contract generation pattern.

```typescript
// ✅ CORRECT - Contract generation
import { generateContractPDF } from '@/lib/contract-generator';

export async function generateContract(bookingId: string): Promise<Buffer> {
  // Fetch booking data
  const booking = await getBooking(bookingId);
  
  // Generate PDF
  const pdfBuffer = await generateContractPDF({
    bookingNumber: booking.bookingNumber,
    customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
    equipmentName: booking.equipment.name,
    startDate: booking.startDate,
    endDate: booking.endDate,
    totalAmount: booking.totalAmount,
    // ... more fields
  });
  
  // Store in Supabase Storage
  const storagePath = `contracts/${bookingId}/contract.pdf`;
  await uploadToStorage(pdfBuffer, 'contracts', storagePath);
  
  return pdfBuffer;
}
```

**Why it matters**: Contracts are a core business feature.

---

## 📋 Summary of Improvements

### High Priority Additions:
1. ✅ `requireAdmin` helper pattern
2. ✅ `handleSupabaseError` utility
3. ✅ Input sanitization functions
4. ✅ Notification service pattern
5. ✅ Logger signature documentation
6. ✅ Rate limit preset selection guide
7. ✅ Type safety with Database types
8. ✅ Environment variable patterns

### Medium Priority Additions:
9. ✅ Test utilities & factories
10. ✅ Response format consistency
11. ✅ Booking status transitions
12. ✅ Pricing edge cases
13. ✅ Availability check optimization
14. ✅ Migration patterns
15. ✅ Stripe webhook pattern

### Nice-to-Have Additions:
16. ✅ File upload pattern
17. ✅ Error boundary patterns
18. ✅ Accessibility patterns
19. ✅ Performance optimization patterns
20. ✅ Contract generation pattern

---

## 🎯 Next Steps

1. **Update the main prompt** with these additions
2. **Create quick reference cards** for common patterns
3. **Add more examples** from actual codebase
4. **Create pattern library** for easy lookup
