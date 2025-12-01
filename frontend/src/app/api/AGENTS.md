# API Route Development (Quick Reference)

## Before Creating API Route

Check: @docs/reference/API_ROUTES_INDEX.md

## 8-Step API Route Pattern

Follow the exact pattern from YOUR codebase:
@frontend/src/app/api/bookings/route.ts:72-297

### Step-by-Step Reference

1. **Rate limit FIRST** with `rateLimit(request, RateLimitPresets.STRICT)`
   - See: @frontend/src/app/api/bookings/route.ts:74
   - Reference: @frontend/src/lib/rate-limiter.ts

2. **Validate request size/content-type**
   - See: @frontend/src/app/api/bookings/route.ts:90-97
   - Reference: @frontend/src/lib/request-validator.ts

3. **Authenticate** with `supabase.auth.getUser()`
   - See: @frontend/src/app/api/bookings/route.ts:133-145
   - Reference: @frontend/src/lib/supabase/server.ts

4. **Sanitize input** with `sanitizeBookingFormData()`
   - See: @frontend/src/app/api/bookings/route.ts:101-102
   - Reference: @frontend/src/lib/input-sanitizer.ts

5. **Validate with Zod schema**
   - See: @frontend/src/app/api/bookings/route.ts:100-101

6. **Process business logic**
   - See: @frontend/src/app/api/bookings/route.ts:147-214

7. **Log with structured logger**
   - See: @frontend/src/app/api/bookings/route.ts:226-235
   - Reference: @frontend/src/lib/logger.ts
   - **IMPORTANT**: Error signature is `logger.error('message', context, error)` - error LAST

8. **Return JSON response**
   - See: @frontend/src/app/api/bookings/route.ts:237-266

## Real Examples to Follow

### Booking Creation

@frontend/src/app/api/bookings/route.ts:72-297

### Discount Code Validation

@frontend/src/app/api/discount-codes/validate/route.ts:14-214

### Spin Wheel Start

@frontend/src/app/api/spin/start/route.ts:49-374

### ID Verification Submit

@frontend/src/app/api/id-verification/submit/route.ts:40-419

- File upload handling
- External API integration pattern
- Error recovery with metadata updates (lines 350-389)

### Contact Form (Public Endpoint)

@frontend/src/app/api/contact/route.ts:17-131

- Public endpoint pattern (no auth)
- Malicious content detection (lines 58-70)
- Simple error handling pattern

## Common Patterns

### Rate Limiting

```typescript
const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
if (!rateLimitResult.success) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429, headers: rateLimitResult.headers }
  );
}
```

### Request Validation

```typescript
const requestValidation = await validateRequest(request, {
  maxSize: 128 * 1024,
  allowedContentTypes: ['application/json'],
});
if (!requestValidation.valid) {
  return requestValidation.error!;
}
```

### Authentication

```typescript
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Error Handling

```typescript
try {
  // ... operation
} catch (error) {
  logger.error(
    'Operation error',
    {
      component: 'api-route-name',
      action: 'error',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    },
    error instanceof Error ? error : undefined
  );

  return NextResponse.json(
    { success: false, error: 'Something went wrong' },
    { status: 500 }
  );
}
```

## Dynamic Routes with Route Parameters

### Next.js 16 Pattern (REQUIRED)

In Next.js 16, route parameters are **Promises** and must be awaited before use.

#### With `withRateLimit` (Recommended Pattern)

```typescript
export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    // Await params in Next.js 16 (params is a Promise)
    const { id } = await params;

    // Now use id safely
    const { data } = await supabase
      .from('equipment')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    return NextResponse.json({ data });
  }
);
```

**Reference**: @frontend/src/app/api/admin/equipment/[id]/route.ts:39-136

#### Without `withRateLimit` (Alternative Pattern)

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Handle params as either Promise or direct object (Next.js 16 compatibility)
  const resolvedParams = params instanceof Promise ? await params : params;
  const { id } = resolvedParams;

  // Use id safely
  return NextResponse.json({ id });
}
```

**Reference**: @frontend/src/app/api/payments/receipt/[id]/route.ts:14-37

#### ❌ WRONG - Old Pattern (DO NOT USE)

```typescript
// ❌ This will fail in Next.js 16
export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, context?: { params: { id: string } }) => {
    const { params } = context;
    // params.id is undefined because params is a Promise!
    const { data } = await supabase.from('equipment').eq('id', params.id);
  }
);
```

## Common Mistakes

1. **Don't use regular client for webhooks** - use service client: `createServiceClient()` from `@/lib/supabase/service`
   - ✅ Correct: IDKit webhook: @frontend/src/app/api/webhooks/idkit/route.ts:79
   - ✅ Correct: SendGrid webhook: @frontend/src/app/api/webhooks/sendgrid/route.ts:19
   - ⚠️ Should update: Stripe webhook: @frontend/src/app/api/webhooks/stripe/route.ts:168
2. **Always await route params in Next.js 16** - params is a Promise, must be awaited
   - ❌ **WRONG**: `{ params }: { params: { id: string } }` then `params.id`
   - ✅ **CORRECT**: `{ params }: { params: Promise<{ id: string }> }` then `const { id } = await params`
   - **Reference**: @frontend/src/app/api/admin/equipment/[id]/route.ts:39-136
3. **Always validate input server-side** - use Zod schemas
4. **Always use structured logging** - logger.error('message', context, error) - error LAST
5. **Always handle errors gracefully** - use try/catch with proper logging
6. **Use specific columns in Supabase queries** - NEVER use `.select('*')` or `.select("*")`
   - ❌ **FORBIDDEN**: `.select('*')` - Causes 60% larger payloads and slower queries
   - ✅ **REQUIRED**: `.select('id, name, status, createdAt')` - Use specific columns
   - **Performance Impact**: 60% payload reduction, 200ms → 15ms query time improvement
   - **ESLint Rule**: Automatically detects and errors on SELECT \* usage
   - **Pre-commit Hook**: Blocks commits with SELECT \* usage
   - **Reference**: @frontend/src/app/api/bookings/route.ts:147-153 for correct pattern
