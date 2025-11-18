# Utility Functions Index

**Purpose**: Quick reference for all utility functions in `frontend/src/lib/` directory.

**Last Updated**: 2025-01-21

---

## 📚 Table of Contents

- [Formatting & Display](#formatting--display)
- [Date & Time](#date--time)
- [Booking & Pricing](#booking--pricing)
- [Validation](#validation)
- [Input Sanitization](#input-sanitization)
- [Rate Limiting](#rate-limiting)
- [Logging](#logging)
- [Error Handling](#error-handling)
- [Supabase Utilities](#supabase-utilities)
- [Performance & Optimization](#performance--optimization)

---

## Formatting & Display

### `cn(...inputs: ClassValue[]): string`
**Location**: `lib/utils.ts`

Merge Tailwind CSS classes with conflict resolution.

```typescript
import { cn } from '@/lib/utils';

// Merge classes
cn('bg-red-500', 'text-white'); // 'bg-red-500 text-white'

// Handle conflicts (last wins)
cn('p-4', 'p-8'); // 'p-8'

// Conditional classes
cn('base-class', isActive && 'active-class');
```

---

### `formatCurrency(amount: number, currency?: string): string`
**Location**: `lib/utils.ts`

Format number as currency (default: CAD).

```typescript
import { formatCurrency } from '@/lib/utils';

formatCurrency(1234.56); // '$1,234.56'
formatCurrency(1234.56, 'USD'); // '$1,234.56'
```

**Parameters:**
- `amount`: Number to format
- `currency`: Currency code (default: `'CAD'`)

---

### `getInitials(firstName?: string, lastName?: string): string`
**Location**: `lib/utils.ts`

Get user initials from name.

```typescript
import { getInitials } from '@/lib/utils';

getInitials('John', 'Doe'); // 'JD'
getInitials('John'); // 'J'
getInitials(); // 'U'
```

---

### `getStatusColor(status: string): string`
**Location**: `lib/utils.ts`

Get Tailwind CSS classes for status badge colors.

```typescript
import { getStatusColor } from '@/lib/utils';

getStatusColor('confirmed'); // 'bg-green-100 text-green-800'
getStatusColor('pending'); // 'bg-yellow-100 text-yellow-800'
getStatusColor('cancelled'); // 'bg-red-100 text-red-800'
```

**Status Mappings:**
- `confirmed`, `completed` → Green
- `pending`, `processing` → Yellow
- `in_progress`, `active` → Blue
- `cancelled`, `failed` → Red
- `draft`, `inactive` → Gray

---

### `getStatusText(status: string): string`
**Location**: `lib/utils.ts`

Get human-readable status text.

```typescript
import { getStatusText } from '@/lib/utils';

getStatusText('confirmed'); // 'Confirmed'
getStatusText('in_progress'); // 'In Progress'
```

---

## Date & Time

### `formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string`
**Location**: `lib/utils.ts`

Format date with Canadian locale.

```typescript
import { formatDate } from '@/lib/utils';

formatDate('2025-01-21'); // 'January 21, 2025'
formatDate(new Date(), { month: 'short' }); // 'Jan 21, 2025'
```

**Default Options:**
- `year: 'numeric'`
- `month: 'long'`
- `day: 'numeric'`

---

### `formatDateTime(date: string | Date): string`
**Location**: `lib/utils.ts`

Format date and time with Canadian locale.

```typescript
import { formatDateTime } from '@/lib/utils';

formatDateTime('2025-01-21T10:30:00Z');
// 'Jan 21, 2025, 10:30 AM'
```

---

## Booking & Pricing

### `calculateRentalDays(startDate: string, endDate: string): number`
**Location**: `lib/utils.ts`

Calculate number of rental days between dates.

```typescript
import { calculateRentalDays } from '@/lib/utils';

calculateRentalDays('2025-01-01', '2025-01-05'); // 4
```

**Returns:** Number of days (inclusive, rounded up)

---

### `calculateRentalCost(startDate: string, endDate: string, dailyRate?: number, taxRate?: number)`
**Location**: `lib/utils.ts`

Calculate rental cost breakdown.

```typescript
import { calculateRentalCost } from '@/lib/utils';

const result = calculateRentalCost(
  '2025-01-01',
  '2025-01-05',
  450,
  0.15
);
// {
//   days: 4,
//   subtotal: 1800,
//   taxes: 270,
//   total: 2070
// }
```

**Returns:**
- `days`: Number of rental days
- `subtotal`: Subtotal before taxes
- `taxes`: Tax amount
- `total`: Total amount

---

### `calculateBookingPricing(input: BookingPricingInput): BookingPricingResult`
**Location**: `lib/booking/pricing.ts`

Comprehensive booking pricing calculation with discounts, add-ons, and coupons.

```typescript
import { calculateBookingPricing } from '@/lib/booking/pricing';

const pricing = calculateBookingPricing({
  equipment: {
    dailyRate: 450,
    weeklyRate: 2250,
    monthlyRate: 9000,
    overageHourlyRate: 50,
    dailyHourAllowance: 8,
    weeklyHourAllowance: 40,
  },
  startDate: '2025-01-01',
  endDate: '2025-01-05',
  delivery: { distanceKm: 25 },
  includeInsurance: true,
  includeOperator: false,
  coupon: { type: 'percentage', value: 10 },
});
```

**Returns:**
- `days`: Rental days
- `rentalCost`: Base rental cost
- `discount`: Long-term discount (weekly/monthly)
- `insuranceFee`: Insurance fee (8% of rental cost)
- `operatorFee`: Operator fee ($150/day)
- `deliveryFee`: Delivery fee (based on distance)
- `couponDiscount`: Coupon discount
- `subtotal`: Subtotal before taxes
- `taxes`: HST (15%)
- `total`: Total amount
- `deposit`: Security deposit (30% of total)
- `breakdown`: Itemized breakdown array

---

### `calculateDeliveryFee(distanceKm?: number | null): number`
**Location**: `lib/booking/pricing.ts`

Calculate delivery fee based on distance.

```typescript
import { calculateDeliveryFee } from '@/lib/booking/pricing';

calculateDeliveryFee(5); // 50
calculateDeliveryFee(15); // 75
calculateDeliveryFee(30); // 125
calculateDeliveryFee(60); // 145 (125 + (60-50)*2)
```

**Pricing:**
- ≤ 10 km: $50
- ≤ 25 km: $75
- ≤ 50 km: $125
- > 50 km: $125 + ($2/km for each km over 50)

---

### `generateBookingNumber(): string`
**Location**: `lib/utils.ts`

Generate unique booking number.

```typescript
import { generateBookingNumber } from '@/lib/utils';

generateBookingNumber(); // 'UDR-20250121-123'
```

**Format:** `UDR-YYYYMMDD-RRR` (RRR = random 3-digit)

---

### `generateContractNumber(bookingNumber?: string | null): string`
**Location**: `lib/utils.ts`

Generate contract number from booking number.

```typescript
import { generateContractNumber } from '@/lib/utils';

generateContractNumber('UDR-20250121-123'); // 'CT-UDR-20250121-123'
generateContractNumber(); // 'CT-{timestamp}-{random}'
```

---

### `generatePaymentNumber(): string`
**Location**: `lib/utils.ts`

Generate unique payment number.

```typescript
import { generatePaymentNumber } from '@/lib/utils';

generatePaymentNumber(); // 'PAY-20250121-123'
```

**Format:** `PAY-YYYYMMDD-RRR` (RRR = random 3-digit)

---

## Validation

### `validateEmail(email: string): boolean`
**Location**: `lib/utils.ts`, `lib/validation.ts`

Validate email address format.

```typescript
import { validateEmail } from '@/lib/utils';

validateEmail('user@example.com'); // true
validateEmail('invalid'); // false
```

**Rules:**
- Must not start/end with dot
- No consecutive dots
- Valid domain with TLD

---

### `validatePhone(phone: string): boolean`
**Location**: `lib/utils.ts`, `lib/validation.ts`

Validate phone number format.

```typescript
import { validatePhone } from '@/lib/utils';

validatePhone('+1-506-555-1234'); // true
validatePhone('5065551234'); // true
validatePhone('123'); // false
```

**Rules:**
- Minimum 10 digits
- Optional `+` prefix
- Must start with non-zero digit

---

### `validatePostalCode(postalCode: string, country?: string): boolean`
**Location**: `lib/utils.ts`, `lib/validation.ts`

Validate postal/ZIP code format.

```typescript
import { validatePostalCode } from '@/lib/utils';

validatePostalCode('E2K 1A1'); // true (Canadian)
validatePostalCode('E2K1A1'); // true
validatePostalCode('12345'); // false
```

**Canadian Format:** `A1A 1A1` (letter-digit-letter-digit-letter-digit)

---

### `validateDateRange(startDate: string, endDate: string): boolean`
**Location**: `lib/validation.ts`

Validate date range for bookings.

```typescript
import { validateDateRange } from '@/lib/validation';

validateDateRange('2025-01-01', '2025-01-05'); // true
validateDateRange('2025-01-05', '2025-01-01'); // false
```

**Rules:**
- Start date must be today or later
- End date must be after start date

---

### `validateBookingForm(formData: BookingFormData): ValidationResult`
**Location**: `lib/validation.ts`

Validate complete booking form.

```typescript
import { validateBookingForm } from '@/lib/validation';

const result = validateBookingForm({
  startDate: '2025-01-01',
  endDate: '2025-01-05',
  deliveryAddress: '123 Main St',
  deliveryCity: 'Saint John',
  customerEmail: 'user@example.com',
  customerName: 'John Doe',
});

if (!result.isValid) {
  console.log(result.errors); // { startDate: '...', ... }
}
```

**Returns:**
- `isValid`: Boolean
- `errors`: Object with field names and error messages

---

## Input Sanitization

### `sanitizeTextInput(input: string, maxLength?: number): string`
**Location**: `lib/input-sanitizer.ts`

Sanitize text input to prevent XSS.

```typescript
import { sanitizeTextInput } from '@/lib/input-sanitizer';

sanitizeTextInput('<script>alert("xss")</script>'); // 'alert("xss")'
sanitizeTextInput('Hello World', 5); // 'Hello'
```

**Removes:**
- Null bytes
- Control characters (except newlines/tabs)
- Zero-width spaces
- Text direction overrides

---

### `sanitizeEmail(email: string): string`
**Location**: `lib/input-sanitizer.ts`

Sanitize email address.

```typescript
import { sanitizeEmail } from '@/lib/input-sanitizer';

sanitizeEmail('  USER@EXAMPLE.COM  '); // 'user@example.com'
sanitizeEmail('user@example@com'); // 'user@examplecom'
```

**Rules:**
- Converts to lowercase
- Trims whitespace
- Removes invalid characters
- Max length: 254 characters

---

### `sanitizePhone(phone: string): string`
**Location**: `lib/input-sanitizer.ts`

Sanitize phone number.

```typescript
import { sanitizePhone } from '@/lib/input-sanitizer';

sanitizePhone('(506) 555-1234'); // '(506) 555-1234'
sanitizePhone('506-555-1234 ext. 123'); // '506-555-1234 ext. 123'
```

**Removes:** All characters except digits, spaces, hyphens, parentheses, plus

---

### `sanitizeAddress(address: string): string`
**Location**: `lib/input-sanitizer.ts`

Sanitize street address.

```typescript
import { sanitizeAddress } from '@/lib/input-sanitizer';

sanitizeAddress('123 Main St., Apt. #4'); // '123 Main St., Apt. #4'
```

**Removes:** Dangerous characters, limits to 200 characters

---

### `sanitizePostalCode(postalCode: string, country?: string): string`
**Location**: `lib/input-sanitizer.ts`

Sanitize postal/ZIP code.

```typescript
import { sanitizePostalCode } from '@/lib/input-sanitizer';

sanitizePostalCode('e2k 1a1', 'CA'); // 'E2K 1A1'
sanitizePostalCode('12345-6789', 'US'); // '12345-6789'
```

---

### `sanitizeBookingFormData(data: BookingFormData)`
**Location**: `lib/input-sanitizer.ts`

Comprehensive booking form sanitization.

```typescript
import { sanitizeBookingFormData } from '@/lib/input-sanitizer';

const sanitized = sanitizeBookingFormData({
  equipmentId: 'uuid-here',
  startDate: '2025-01-01',
  endDate: '2025-01-05',
  deliveryAddress: '123 Main St',
  deliveryCity: 'Saint John',
  deliveryProvince: 'NB',
  deliveryPostalCode: 'E2K 1A1',
  notes: 'Please deliver before 9 AM',
});
```

**Throws:** Error if malicious content detected

---

### `detectMaliciousInput(input: string): { isMalicious: boolean; reason?: string }`
**Location**: `lib/input-sanitizer.ts`

Detect potentially malicious input patterns.

```typescript
import { detectMaliciousInput } from '@/lib/input-sanitizer';

const result = detectMaliciousInput('<script>alert("xss")</script>');
// { isMalicious: true, reason: 'Script tag detected' }
```

**Detects:**
- XSS patterns (`<script>`, event handlers, `javascript:`)
- SQL injection patterns
- Command injection patterns
- Path traversal patterns
- NoSQL injection patterns

---

## Rate Limiting

### `rateLimit(req: NextRequest, config: RateLimitConfig): Promise<RateLimitResult>`
**Location**: `lib/rate-limiter.ts`

Apply rate limiting to API requests.

```typescript
import { rateLimit, RateLimitPresets } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const result = await rateLimit(req, RateLimitPresets.STRICT);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: result.headers }
    );
  }

  // Process request...
}
```

**Presets:**
- `VERY_STRICT`: 10 req/min (payment endpoints)
- `STRICT`: 20 req/min (auth, sensitive endpoints)
- `MODERATE`: 50 req/min (booking endpoints)
- `RELAXED`: 100 req/min (public endpoints)

**Returns:**
- `success`: Boolean
- `remaining`: Remaining requests
- `reset`: Reset timestamp
- `headers`: Rate limit headers

---

### `withRateLimit(config: RateLimitConfig, handler: Function)`
**Location**: `lib/rate-limiter.ts`

Rate limit middleware wrapper.

```typescript
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limiter';

export const POST = withRateLimit(
  RateLimitPresets.STRICT,
  async (req: NextRequest) => {
    return NextResponse.json({ success: true });
  }
);
```

---

## Logging

### `logger.error(message: string, context?: LogContext, error?: Error)`
**Location**: `lib/logger.ts`

Log error with context.

```typescript
import { logger } from '@/lib/logger';

logger.error('Payment failed', {
  component: 'payment-api',
  action: 'process_payment',
  metadata: { bookingId: '123', amount: 1000 },
}, error);
```

---

### `logger.warn(message: string, context?: LogContext)`
**Location**: `lib/logger.ts`

Log warning with context.

```typescript
import { logger } from '@/lib/logger';

logger.warn('Rate limit approaching', {
  component: 'rate-limiter',
  action: 'check_limit',
  metadata: { remaining: 5 },
});
```

---

### `logger.info(message: string, context?: LogContext)`
**Location**: `lib/logger.ts`

Log info message with context.

```typescript
import { logger } from '@/lib/logger';

logger.info('Booking created', {
  component: 'booking-api',
  action: 'create',
  metadata: { bookingId: '123' },
});
```

---

### `logger.debug(message: string, context?: LogContext)`
**Location**: `lib/logger.ts`

Log debug message (development only).

```typescript
import { logger } from '@/lib/logger';

logger.debug('Cache hit', {
  component: 'cache',
  action: 'get',
  metadata: { key: 'equipment-list' },
});
```

**Log Levels:**
- `ERROR` (0): Always logged
- `WARN` (1): Logged in production
- `INFO` (2): Logged in production
- `DEBUG` (3): Development only

---

## Error Handling

### `handleSupabaseError(error: any): SupabaseError`
**Location**: `lib/supabase/error-handler.ts`

Convert Supabase errors to standardized format.

```typescript
import { handleSupabaseError } from '@/lib/supabase/error-handler';

try {
  await supabase.from('bookings').insert(data);
} catch (error) {
  const supabaseError = handleSupabaseError(error);
  // Handle error...
}
```

**Error Codes:**
- `PGRST116`: No data found
- `PGRST301`: Access denied
- `23505`: Duplicate entry
- `23503`: Foreign key violation
- `auth/invalid-credentials`: Invalid credentials

---

### `getErrorMessage(error: SupabaseError): string`
**Location**: `lib/supabase/error-handler.ts`

Get user-friendly error message.

```typescript
import { getErrorMessage, handleSupabaseError } from '@/lib/supabase/error-handler';

const error = handleSupabaseError(supabaseError);
const message = getErrorMessage(error);
// 'Invalid email or password. Please check your credentials and try again.'
```

---

## Supabase Utilities

### `createClient(): SupabaseClient`
**Location**: `lib/supabase/client.ts`

Create browser Supabase client.

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data } = await supabase.from('bookings').select('*');
```

**Uses:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public key)

---

### `createClient(): Promise<SupabaseClient>`
**Location**: `lib/supabase/server.ts`

Create server Supabase client (uses cookies for auth).

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**Uses:** Server-side cookies for authentication

---

### `createServiceClient(): SupabaseClient`
**Location**: `lib/supabase/service.ts`

Create service role client (admin operations only).

```typescript
import { createServiceClient } from '@/lib/supabase/service';

const supabase = createServiceClient();
// Bypasses RLS - use with caution!
```

**⚠️ Warning:** Bypasses RLS - only use for admin operations

---

## Performance & Optimization

### `debounce<T>(func: T, wait: number): Function`
**Location**: `lib/utils.ts`

Debounce function calls.

```typescript
import { debounce } from '@/lib/utils';

const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300);

debouncedSearch('equipment'); // Called after 300ms of inactivity
```

---

### `throttle<T>(func: T, limit: number): Function`
**Location**: `lib/utils.ts`

Throttle function calls.

```typescript
import { throttle } from '@/lib/utils';

const throttledScroll = throttle(() => {
  updateScrollPosition();
}, 100);

// Called at most once per 100ms
```

---

## Quick Reference

### Common Patterns

**Format currency:**
```typescript
formatCurrency(1234.56); // '$1,234.56'
```

**Calculate rental days:**
```typescript
calculateRentalDays('2025-01-01', '2025-01-05'); // 4
```

**Sanitize user input:**
```typescript
sanitizeTextInput(userInput, 1000);
```

**Validate email:**
```typescript
if (!validateEmail(email)) {
  // Show error
}
```

**Rate limit API route:**
```typescript
const result = await rateLimit(req, RateLimitPresets.STRICT);
if (!result.success) return errorResponse;
```

**Log with context:**
```typescript
logger.info('Action completed', {
  component: 'module-name',
  action: 'action-name',
  metadata: { key: 'value' },
});
```

---

**Remember**:
- 🛡️ **Always sanitize user input**
- ✅ **Validate on both client and server**
- 📊 **Use structured logging**
- ⚡ **Rate limit API endpoints**
- 🔒 **Never expose service role keys**



