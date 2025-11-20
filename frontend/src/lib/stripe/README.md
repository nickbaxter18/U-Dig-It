# Stripe Integration with Retry Logic

## Usage

### Basic Stripe API Calls with Retry

For any Stripe API call that might fail due to network issues or rate limits, use `retryStripeCall`:

```typescript
import { getStripeInstance } from '@/lib/stripe/config';
import { retryStripeCall } from '@/lib/stripe/retry';

const stripe = await getStripeInstance();

// ✅ CORRECT - Wrapped with retry logic
const customer = await retryStripeCall(
  () =>
    stripe.customers.create({
      email: 'customer@example.com',
      name: 'John Doe',
    }),
  { maxRetries: 3 }
);

// ✅ CORRECT - Wrap payment intent creation
const paymentIntent = await retryStripeCall(() =>
  stripe.paymentIntents.create({
    amount: 10000,
    currency: 'cad',
    customer: customerId,
  })
);
```

### When to Use Retry Logic

**Always use retry for:**

- Customer creation/updates
- Payment intent creation/confirmation
- Subscription management
- Charge captures
- Any API call in critical user flows

**Don't use retry for:**

- Webhook signature verification (fail fast)
- Listing/searching operations (use pagination instead)
- Operations that should fail immediately (e.g., invalid card)

### Retry Configuration

```typescript
const result = await retryStripeCall(() => stripe.customers.create({ email }), {
  maxRetries: 3, // Default: 3
  initialDelayMs: 1000, // Default: 1 second
  maxDelayMs: 10000, // Default: 10 seconds
  jitterFactor: 0.3, // Default: 30% jitter
});
```

### Error Handling

The retry logic automatically retries these errors:

- Network errors (ECONNREFUSED, ETIMEDOUT, etc.)
- Rate limit errors (HTTP 429)
- Temporary API errors (HTTP 500, 503)
- Stripe API connection errors

Non-retryable errors (fail immediately):

- Authentication errors
- Invalid request errors
- Card errors
- Idempotency errors

### Examples

#### Example 1: Create Customer with Retry

```typescript
import { getStripeInstance } from '@/lib/stripe/config';
import { retryStripeCall } from '@/lib/stripe/retry';

export async function createCustomer(email: string, name: string) {
  const stripe = await getStripeInstance();

  return await retryStripeCall(() => stripe.customers.create({ email, name }), { maxRetries: 3 });
}
```

#### Example 2: Create Payment Intent with Retry

```typescript
import { getStripeInstance } from '@/lib/stripe/config';
import { retryStripeCall } from '@/lib/stripe/retry';

export async function createPaymentIntent(
  amount: number,
  customerId: string,
  metadata: Record<string, string>
) {
  const stripe = await getStripeInstance();

  return await retryStripeCall(
    () =>
      stripe.paymentIntents.create({
        amount,
        currency: 'cad',
        customer: customerId,
        metadata,
      }),
    { maxRetries: 3 }
  );
}
```

#### Example 3: Error Handling

```typescript
import { retryStripeCall, isRateLimitError, isNetworkError } from '@/lib/stripe/retry';

try {
  const result = await retryStripeCall(
    () => stripe.customers.create({ email }),
    { maxRetries: 3 }
  );
  return { success: true, data: result };
} catch (error) {
  if (isRateLimitError(error)) {
    // Handle rate limit specifically
    return { success: false, error: 'Rate limit exceeded, try again later' };
  } else if (isNetworkError(error)) {
    // Handle network error
    return { success: false, error: 'Network error, please check connection' };
  } else {
    // Handle other errors
    return { success: false, error: 'Failed to create customer' };
  }
}
```

## Logging

All retry attempts are logged with structured logging:

```typescript
// Successful retry after failures
logger.info('Stripe API call succeeded after retry', {
  component: 'stripe-retry',
  action: 'retry_success',
  metadata: { attempt: 2, totalAttempts: 3 },
});

// Retry attempt
logger.warn('Stripe API call failed - retrying', {
  component: 'stripe-retry',
  action: 'retry_attempt',
  metadata: { attempt: 1, totalAttempts: 3, delayMs: 1000, errorType: 'rate_limit' },
});

// Final failure
logger.error('Stripe API call failed - not retrying', {
  component: 'stripe-retry',
  action: 'retry_exhausted',
  metadata: { attempt: 3, totalAttempts: 3, errorType: 'rate_limit' },
});
```

## Testing

To test retry logic:

```typescript
import { vi } from 'vitest';

import { retryStripeCall } from '@/lib/stripe/retry';

test('retries on network error', async () => {
  let attempts = 0;
  const mockFn = vi.fn(async () => {
    attempts++;
    if (attempts < 3) {
      const error: any = new Error('Network error');
      error.code = 'ECONNREFUSED';
      throw error;
    }
    return { id: 'cus_123' };
  });

  const result = await retryStripeCall(mockFn, { maxRetries: 3 });

  expect(result.id).toBe('cus_123');
  expect(attempts).toBe(3);
  expect(mockFn).toHaveBeenCalledTimes(3);
});
```

## Performance

- **First attempt**: Immediate
- **Retry 1**: ~1s delay (with jitter)
- **Retry 2**: ~2s delay (with jitter)
- **Retry 3**: ~4s delay (with jitter)
- **Max delay**: 10s

Total max time for 3 retries: ~17s (in worst case)

## See Also

- `@Stripe Docs` - Stripe API documentation
- `@Stripe Webhooks` - Webhook handling
- `frontend/src/lib/stripe/config.ts` - Stripe configuration
- `frontend/src/lib/stripe/retry.ts` - Retry implementation
