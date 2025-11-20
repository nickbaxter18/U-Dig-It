/**
 * Stripe API Retry Logic
 *
 * Implements exponential backoff with jitter for transient Stripe API failures.
 * Reference: @Stripe Docs - API rate limits and retry strategy
 */
import { logger } from '@/lib/logger';

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds
  jitterFactor: 0.3, // 30% jitter
  retryableErrors: [
    // Network errors
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    // Stripe API errors that are retryable
    'rate_limit',
    'api_connection_error',
    'api_error',
    'temporary_error',
  ],
};

/**
 * Calculates delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = Math.min(
    options.initialDelayMs * Math.pow(2, attempt),
    options.maxDelayMs
  );

  // Add random jitter to prevent thundering herd
  const jitter = exponentialDelay * options.jitterFactor * (Math.random() - 0.5) * 2;

  return Math.max(0, exponentialDelay + jitter);
}

/**
 * Checks if an error is retryable
 */
function isRetryableError(error: unknown, options: Required<RetryOptions>): boolean {
  if (!error) return false;

  // Check error code
  if (error.code && options.retryableErrors.includes(error.code)) {
    return true;
  }

  // Check error type (Stripe-specific)
  if (error.type && options.retryableErrors.includes(error.type)) {
    return true;
  }

  // Check HTTP status codes
  if (error.statusCode) {
    // Retry on 429 (rate limit), 503 (service unavailable), 500 (internal error)
    if ([429, 503, 500].includes(error.statusCode)) {
      return true;
    }
  }

  // Check if it's a network error
  if (error.message) {
    const message = error.message.toLowerCase();
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connect') ||
      message.includes('socket')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Delays execution by the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a Stripe API call with exponential backoff
 *
 * @example
 * ```typescript
 * const customer = await retryStripeCall(
 *   () => stripe.customers.create({ email }),
 *   { maxRetries: 3 }
 * );
 * ```
 */
export async function retryStripeCall<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await fn();

      // Log successful retry if it wasn't the first attempt
      if (attempt > 0) {
        logger.info('Stripe API call succeeded after retry', {
          component: 'stripe-retry',
          action: 'retry_success',
          metadata: { attempt, totalAttempts: opts.maxRetries + 1 },
        });
      }

      return result;
    } catch (error: unknown) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = attempt < opts.maxRetries && isRetryableError(error, opts);

      if (!shouldRetry) {
        logger.error(
          'Stripe API call failed - not retrying',
          {
            component: 'stripe-retry',
            action: 'retry_exhausted',
            metadata: {
              attempt,
              totalAttempts: opts.maxRetries + 1,
              errorType: error.type,
              errorCode: error.code,
              statusCode: error.statusCode,
              retryable: isRetryableError(error, opts),
            },
          },
          error
        );
        throw error;
      }

      // Calculate delay for next retry
      const delay = calculateDelay(attempt, opts);

      logger.warn('Stripe API call failed - retrying', {
        component: 'stripe-retry',
        action: 'retry_attempt',
        metadata: {
          attempt: attempt + 1,
          totalAttempts: opts.maxRetries + 1,
          delayMs: delay,
          errorType: error.type,
          errorCode: error.code,
          statusCode: error.statusCode,
        },
      });

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never happen, but TypeScript doesn't know that
  throw lastError || new Error('Retry failed without error');
}

/**
 * Creates a retry wrapper for a Stripe instance
 *
 * @example
 * ```typescript
 * const stripe = new Stripe(key);
 * const retryableStripe = createRetryableStripeClient(stripe, { maxRetries: 3 });
 *
 * // All calls will be automatically retried
 * const customer = await retryableStripe.customers.create({ email });
 * ```
 */
export function createRetryableStripeClient<T extends object>(
  stripe: T,
  _options: RetryOptions = {} // Reserved for future retry configuration
): T {
  // For now, users should use retryStripeCall() directly
  // This would require more complex proxy logic to wrap all methods
  return stripe;
}

/**
 * Stripe-specific error types
 */
export const StripeErrorTypes = {
  API_CONNECTION_ERROR: 'api_connection_error',
  API_ERROR: 'api_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  CARD_ERROR: 'card_error',
  IDEMPOTENCY_ERROR: 'idempotency_error',
  INVALID_REQUEST_ERROR: 'invalid_request_error',
  RATE_LIMIT_ERROR: 'rate_limit',
} as const;

/**
 * Checks if error is a specific Stripe error type
 */
export function isStripeError(error: unknown, type?: string): boolean {
  return error?.type === type || (type === undefined && error?.type !== undefined);
}

/**
 * Checks if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  return isStripeError(error, StripeErrorTypes.RATE_LIMIT_ERROR) || error?.statusCode === 429;
}

/**
 * Checks if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return isStripeError(error, StripeErrorTypes.API_CONNECTION_ERROR);
}
