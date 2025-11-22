/**
 * Rate Limiter - API Protection
 *
 * Prevents abuse and DDoS attacks by limiting request frequency
 * Uses in-memory LRU cache with automatic cleanup
 *
 * @module rate-limiter
 */
import { createHash } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from './logger';

type RateLimitConfig = {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  uniqueTokenPerInterval: number; // Max unique tokens tracked
  skipAdmins?: boolean; // Whether to skip rate limiting for admin users
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
};

// Simple in-memory cache with LRU eviction
class LRUCache<T> {
  private cache: Map<string, { value: T; expiry: number }>;
  private max: number;

  constructor(max: number) {
    this.cache = new Map();
    this.max = max;
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: string, value: T, ttl: number): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.max) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Token counters cache
const tokenCache = new LRUCache<number[]>(500);

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  // Very strict for critical payment endpoints (captures, refunds)
  VERY_STRICT: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute (increased from 5)
    uniqueTokenPerInterval: 500,
    skipAdmins: true, // Admins can bypass for testing
  },

  // Strict for sensitive endpoints (auth, card verification)
  STRICT: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute (increased from 10)
    uniqueTokenPerInterval: 500,
    skipAdmins: true, // Admins can bypass for testing
  },

  // Moderate for booking and general API endpoints
  MODERATE: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 requests per minute (increased from 30)
    uniqueTokenPerInterval: 500,
    skipAdmins: true, // Admins can bypass
  },

  // Relaxed for public endpoints
  RELAXED: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute (increased from 60)
    uniqueTokenPerInterval: 500,
    skipAdmins: false, // Public endpoints don't skip
  },
};

function serializePresets() {
  const sortedKeys = Object.keys(RateLimitPresets).sort();
  return JSON.stringify(
    sortedKeys.map((key) => ({
      name: key,
      config: RateLimitPresets[key as keyof typeof RateLimitPresets],
    }))
  );
}

const RATE_LIMIT_PRESET_SIGNATURE = createHash('sha256').update(serializePresets()).digest('hex');
const RATE_LIMIT_SIGNATURE_KEY = '__RATE_LIMIT_PRESET_SIGNATURE__';

function initializeRateLimitPresetMonitor() {
  const previousSignature = Reflect.get(globalThis, RATE_LIMIT_SIGNATURE_KEY) as string | undefined;

  if (!previousSignature) {
    logger.info('Rate limiter presets initialized', {
      component: 'rate-limiter',
      metadata: {
        signature: RATE_LIMIT_PRESET_SIGNATURE,
        presets: RateLimitPresets,
      },
    });
  } else if (previousSignature !== RATE_LIMIT_PRESET_SIGNATURE) {
    logger.warn('Rate limiter presets signature changed during runtime', {
      component: 'rate-limiter',
      metadata: {
        previousSignature,
        signature: RATE_LIMIT_PRESET_SIGNATURE,
        presets: RateLimitPresets,
      },
    });
  }

  Reflect.set(globalThis, RATE_LIMIT_SIGNATURE_KEY, RATE_LIMIT_PRESET_SIGNATURE);
}

initializeRateLimitPresetMonitor();

export function getRateLimitPresetSignature() {
  return RATE_LIMIT_PRESET_SIGNATURE;
}

/**
 * Get client identifier for rate limiting
 * Uses IP address, or fallback to user ID, or x-forwarded-for header
 */
function getClientIdentifier(req: NextRequest): string {
  // Priority 1: X-Forwarded-For header (most common in production)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  // Priority 2: X-Real-IP header
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback: Use a combination of headers
  const userAgent = req.headers.get('user-agent') || '';
  return `${userAgent.substring(0, 50)}`;
}

/**
 * Apply rate limiting to a request
 *
 * @param req - Next.js request object
 * @param config - Rate limit configuration
 * @returns Result with success status and headers
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const result = await rateLimit(req, RateLimitPresets.STRICT);
 *   if (!result.success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       { status: 429, headers: result.headers }
 *     );
 *   }
 *   // Process request...
 * }
 * ```
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Check if admin should skip rate limiting
  if (config.skipAdmins) {
    const shouldSkip = await shouldSkipRateLimit(req);
    if (shouldSkip) {
      return {
        success: true,
        remaining: 999,
        reset: Date.now() + config.interval,
        headers: {
          'X-RateLimit-Limit': '999',
          'X-RateLimit-Remaining': '999',
          'X-RateLimit-Reset': new Date(Date.now() + config.interval).toISOString(),
        },
      };
    }
  }

  const token = getClientIdentifier(req);
  const now = Date.now();
  const windowStart = now - config.interval;

  // Get or initialize token count
  let tokenCount = tokenCache.get(token);
  if (!tokenCount) {
    tokenCount = [0];
    tokenCache.set(token, tokenCount, config.interval);
  }

  // Clean up old requests outside the window
  tokenCount = tokenCount.filter((timestamp: unknown) => timestamp > windowStart);

  // Add current request
  tokenCount.push(now);

  // Update cache
  tokenCache.set(token, tokenCount, config.interval);

  const currentUsage = tokenCount.length;
  const isRateLimited = currentUsage > config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - currentUsage);
  const resetTime = now + config.interval;

  // Calculate retry-after in seconds
  const retryAfter = Math.ceil(config.interval / 1000);

  const headers = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    ...(isRateLimited && { 'Retry-After': retryAfter.toString() }),
  };

  return {
    success: !isRateLimited,
    remaining,
    reset: resetTime,
    headers,
  };
}

/**
 * Rate limit middleware wrapper for API routes
 *
 * Supports both static routes (no params) and dynamic routes (with params).
 *
 * @example Static route:
 * ```typescript
 * export const POST = withRateLimit(
 *   RateLimitPresets.STRICT,
 *   async (req: NextRequest) => {
 *     // Your handler code here
 *     return NextResponse.json({ success: true });
 *   }
 * );
 * ```
 *
 * @example Dynamic route:
 * ```typescript
 * export const GET = withRateLimit(
 *   RateLimitPresets.MODERATE,
 *   async (req: NextRequest, { params }: { params: { id: string } }) => {
 *     // Your handler code here
 *     return NextResponse.json({ success: true });
 *   }
 * );
 * ```
 */
export function withRateLimit<T extends { params?: unknown } = { params?: never }>(
  config: RateLimitConfig,
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
): (req: NextRequest, context?: T) => Promise<NextResponse> {
  return async (req: NextRequest, context?: T) => {
    const result = await rateLimit(req, config);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          retryAfter: result.headers['Retry-After'],
        },
        {
          status: 429,
          headers: result.headers,
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(req, context);
    Object.entries(result.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Skip rate limiting for admin users
 */
export async function shouldSkipRateLimit(_req: NextRequest): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase/server');
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if user is admin or super_admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin';

    if (isAdmin) {
      logger.info('Admin user bypassing rate limit', {
        component: 'rate-limiter',
        action: 'admin_bypass',
        metadata: { userId: user.id, role: userData?.role },
      });
    }

    return isAdmin;
  } catch {
    // If check fails, apply rate limiting for safety
    return false;
  }
}
