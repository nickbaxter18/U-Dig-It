/**
 * Admin Route Rate Limiting
 *
 * Dedicated rate limiting for admin API routes.
 * Admin routes have stricter rate limits to prevent abuse and brute-force attacks.
 *
 * Reference: @https://web.dev/vitals/ (security best practices)
 */
import { NextRequest, NextResponse } from 'next/server';

// Reserved for future preset usage
import { logger } from '@/lib/logger';
import { RateLimitPresets as _RateLimitPresets, rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin-specific rate limit presets
 */
export const AdminRateLimitPresets = {
  // Read operations (GET)
  READ: {
    requests: 120, // 120 requests
    window: 60, // per minute
  },
  // Write operations (POST, PUT, PATCH)
  WRITE: {
    requests: 30, // 30 requests
    window: 60, // per minute
  },
  // Delete operations (DELETE)
  DELETE: {
    requests: 20, // 20 requests
    window: 60, // per minute
  },
  // Bulk operations
  BULK: {
    requests: 10, // 10 requests
    window: 60, // per minute
  },
  // Export operations (typically slow)
  EXPORT: {
    requests: 5, // 5 requests
    window: 60, // per minute
  },
  // Email/notification operations
  COMMUNICATION: {
    requests: 15, // 15 requests
    window: 60, // per minute
  },
} as const;

/**
 * Verifies that the user is an admin
 */
async function verifyAdminAccess(_request: NextRequest): Promise<{
  // Reserved for future request processing
  isAdmin: boolean;
  userId: string | null;
  userRole: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { isAdmin: false, userId: null, userRole: null };
    }

    // Fetch user role from database
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !userData) {
      return { isAdmin: false, userId: user.id, userRole: null };
    }

    const isAdmin = ['admin', 'super_admin'].includes(userData.role);
    return { isAdmin, userId: user.id, userRole: userData.role };
  } catch (err) {
    logger.error(
      'Failed to verify admin access',
      {
        component: 'admin-rate-limit',
        action: 'verify_admin_failed',
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return { isAdmin: false, userId: null, userRole: null };
  }
}

/**
 * Applies rate limiting and admin verification to an admin route handler
 *
 * @example
 * ```typescript
 * import { withAdminRateLimit, AdminRateLimitPresets } from '@/lib/api/admin-rate-limit';
 *
 * export const GET = withAdminRateLimit(
 *   async (request: NextRequest) => {
 *     // Your handler logic here
 *     return NextResponse.json({ success: true });
 *   },
 *   { limit: AdminRateLimitPresets.READ }
 * );
 * ```
 */
export function withAdminRateLimit(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>,
  options: {
    limit?: { requests: number; window: number };
    skipAuth?: boolean;
  } = {}
) {
  const { limit = AdminRateLimitPresets.WRITE, skipAuth = false } = options;

  return async function (request: NextRequest, context?: unknown): Promise<NextResponse> {
    try {
      // 1. Apply rate limiting FIRST
      const rateLimitResult = await rateLimit(request, {
        requests: limit.requests,
        window: limit.window,
      });

      if (!rateLimitResult.success) {
        logger.warn('Admin route rate limit exceeded', {
          component: 'admin-rate-limit',
          action: 'rate_limit_exceeded',
          metadata: {
            ip: rateLimitResult.identifier,
            limit: limit.requests,
            window: limit.window,
          },
        });

        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: limit.window,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(limit.window),
              'X-RateLimit-Limit': String(limit.requests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Date.now() + limit.window * 1000),
            },
          }
        );
      }

      // 2. Verify admin access (unless skipped)
      if (!skipAuth) {
        const { isAdmin, userId, userRole } = await verifyAdminAccess(request);

        if (!isAdmin) {
          logger.warn('Unauthorized admin route access attempt', {
            component: 'admin-rate-limit',
            action: 'unauthorized_access',
            metadata: { userId, userRole },
          });

          return NextResponse.json(
            {
              error: 'Forbidden',
              message: 'Admin access required',
            },
            { status: 403 }
          );
        }

        // Log successful admin access (for audit trail)
        logger.info('Admin route accessed', {
          component: 'admin-rate-limit',
          action: 'admin_access',
          metadata: {
            userId,
            userRole,
            path: request.nextUrl.pathname,
            method: request.method,
          },
        });
      }

      // 3. Call the actual handler
      return await handler(request, context);
    } catch (error: unknown) {
      logger.error(
        'Admin route handler error',
        {
          component: 'admin-rate-limit',
          action: 'handler_error',
          metadata: {
            path: request.nextUrl.pathname,
            method: request.method,
          },
        },
        error
      );

      return NextResponse.json(
        {
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware-style admin protection (for use in middleware.ts)
 *
 * @example
 * ```typescript
 * // In middleware.ts
 * import { adminRateLimitMiddleware } from '@/lib/api/admin-rate-limit';
 *
 * export async function middleware(request: NextRequest) {
 *   if (request.nextUrl.pathname.startsWith('/api/admin')) {
 *     return adminRateLimitMiddleware(request);
 *   }
 *   return NextResponse.next();
 * }
 * ```
 */
export async function adminRateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Apply rate limiting
  const limit = request.method === 'GET' ? AdminRateLimitPresets.READ : AdminRateLimitPresets.WRITE;

  const rateLimitResult = await rateLimit(request, {
    requests: limit.requests,
    window: limit.window,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.window),
        },
      }
    );
  }

  // Verify admin access
  const { isAdmin } = await verifyAdminAccess(request);

  if (!isAdmin) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Admin access required',
      },
      { status: 403 }
    );
  }

  // Allow request to proceed
  return null;
}

/**
 * Helper to determine appropriate rate limit based on operation type
 */
export function getAdminRateLimitForOperation(
  path: string,
  method: string
): { requests: number; window: number } {
  const lowerPath = path.toLowerCase();

  // Export operations
  if (lowerPath.includes('/export')) {
    return AdminRateLimitPresets.EXPORT;
  }

  // Bulk operations
  if (lowerPath.includes('/bulk')) {
    return AdminRateLimitPresets.BULK;
  }

  // Communication operations
  if (
    lowerPath.includes('/email') ||
    lowerPath.includes('/notification') ||
    lowerPath.includes('/communicate')
  ) {
    return AdminRateLimitPresets.COMMUNICATION;
  }

  // Method-based rate limits
  switch (method) {
    case 'GET':
      return AdminRateLimitPresets.READ;
    case 'DELETE':
      return AdminRateLimitPresets.DELETE;
    case 'POST':
    case 'PUT':
    case 'PATCH':
      return AdminRateLimitPresets.WRITE;
    default:
      return AdminRateLimitPresets.WRITE;
  }
}
