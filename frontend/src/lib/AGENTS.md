# Utility Library Patterns (Quick Reference)

## Core Utilities

### Logger

@frontend/src/lib/logger.ts

- **Info**: `logger.info('message', { component, action, metadata })`
- **Error**: `logger.error('message', context, error)` - **error LAST**
- **Warn**: `logger.warn('message', context)`
- **Debug**: `logger.debug('message', context)`

See actual usage: @frontend/src/app/api/bookings/route.ts:226-235

### Error Handler

@frontend/src/lib/error-handler.ts

- `errorHandler.handleError(error, options)`
- `errorHandler.normalizeError(error)`
- `errorHandler.isRetryableError(error)`

### Rate Limiter

@frontend/src/lib/rate-limiter.ts

- Use: `rateLimit(request, RateLimitPresets.STRICT)`
- Presets: `VERY_STRICT`, `STRICT`, `MODERATE`, `RELAXED`
- See usage: @frontend/src/app/api/bookings/route.ts:74

### Request Validator

@frontend/src/lib/request-validator.ts

- `validateRequest(request, { maxSize, allowedContentTypes })`
- See usage: @frontend/src/app/api/bookings/route.ts:90-97

### Input Sanitizer

@frontend/src/lib/input-sanitizer.ts

- `sanitizeBookingFormData(data)`
- `sanitizeBookingPayload(data)`
- See usage: @frontend/src/app/api/bookings/route.ts:101-102

## Supabase Utilities

### Server Client

@frontend/src/lib/supabase/server.ts

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
```

### Client Client (Browser)

@frontend/src/lib/supabase/client.ts

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
```

### Service Client (Service Role)

@frontend/src/lib/supabase/service.ts

- Use for webhooks and admin operations
- Bypasses RLS policies
- Created with `createServiceClient()`

**Real Example**: @frontend/src/app/api/webhooks/idkit/route.ts:79

## Secrets Management

**IMPORTANT**: Always use secrets loader functions, never access `process.env` directly!

### Email Secrets

@frontend/src/lib/secrets/email.ts

```typescript
import { getSendGridApiKey } from '@/lib/secrets/email';

const apiKey = await getSendGridApiKey();
```

### Stripe Secrets

@frontend/src/lib/stripe/config.ts

```typescript
import { getStripeSecretKey } from '@/lib/stripe/config';

const stripeKey = await getStripeSecretKey();
```

### Supabase Secrets

@frontend/src/lib/secrets/supabase.ts

```typescript
import { getSupabaseServiceRoleKey } from '@/lib/secrets/supabase';

const key = await getSupabaseServiceRoleKey();
```

## Common Patterns

### Supabase Query Pattern

```typescript
// ✅ CORRECT - Specific columns, pagination
const { data, error, count } = await supabase
  .from('bookings')
  .select('id, bookingNumber, status, totalAmount', { count: 'exact' })
  .eq('status', 'confirmed')
  .order('created_at', { ascending: false })
  .range(0, 19)
  .limit(20);
```

See actual examples:

- Equipment query: @frontend/src/app/api/bookings/route.ts:147-153
- Availability check: @frontend/src/app/api/bookings/route.ts:165-170

## Common Mistakes

1. **Don't access process.env directly** - use secrets loaders
2. **Use correct logger signature** - error LAST: `logger.error('message', context, error)`
3. **Always use specific columns** - never SELECT \* without pagination
4. **Use service role client for webhooks** - regular client will fail with RLS
5. **Handle errors gracefully** - use error handler, not bare try/catch
