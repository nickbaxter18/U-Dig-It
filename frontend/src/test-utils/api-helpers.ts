import { vi } from 'vitest';

import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for API route testing
 */
export const createMockRequest = (
  method: string,
  body?: unknown,
  options?: {
    headers?: Record<string, string>;
    url?: string;
    searchParams?: Record<string, string>;
  }
) => {
  const url = new URL(options?.url || 'http://localhost:3000/api/test');

  // Add search params if provided
  if (options?.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  return new NextRequest(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * Expect a successful API response
 */
export const expectSuccessResponse = async (response: Response) => {
  expect(response.ok).toBe(true);
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);

  const data = await response.json();
  expect(data.error).toBeUndefined();

  return data;
};

/**
 * Expect an error response with specific status
 */
export const expectErrorResponse = async (
  response: Response,
  expectedStatus: number,
  errorMessage?: string | RegExp
) => {
  expect(response.ok).toBe(false);
  expect(response.status).toBe(expectedStatus);

  const data = await response.json();
  expect(data.error).toBeDefined();

  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      expect(data.error).toContain(errorMessage);
    } else {
      expect(data.error).toMatch(errorMessage);
    }
  }

  return data;
};

/**
 * Mock Supabase client for API route tests
 */
export const createMockSupabaseClient = (overrides?: unknown) => {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      ...overrides?.auth,
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      ...overrides?.from,
    }),
    ...overrides,
  };
};

/**
 * Create mock API response
 */
export const createMockResponse = (data: unknown, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Test API route authentication
 */
export const expectUnauthorized = async (response: Response) => {
  return expectErrorResponse(response, 401);
};

/**
 * Test API route authorization (forbidden)
 */
export const expectForbidden = async (response: Response) => {
  return expectErrorResponse(response, 403);
};

/**
 * Test API route validation errors
 */
export const expectValidationError = async (response: Response) => {
  const data = await expectErrorResponse(response, 400);
  expect(data.errors || data.error).toBeDefined();
  return data;
};

/**
 * Mock authenticated request
 */
export const createAuthenticatedRequest = (
  method: string,
  body?: unknown,
  userId: string = 'test-user-id'
) => {
  return createMockRequest(method, body, {
    headers: {
      Authorization: `Bearer mock-token-${userId}`,
    },
  });
};

/**
 * Mock admin request
 */
export const createAdminRequest = (method: string, body?: unknown) => {
  return createMockRequest(method, body, {
    headers: {
      Authorization: 'Bearer mock-admin-token',
      'X-User-Role': 'admin',
    },
  });
};

type RateLimitResult = {
  success: boolean;
  headers: Headers;
  reset?: number;
};

/**
 * Create a reusable mock implementation for the rate limiter module.
 * Provides controllable `rateLimit` behaviour and exposes common presets.
 */
export const createRateLimiterModuleMock = (result?: Partial<RateLimitResult>) => {
  const defaultResult: RateLimitResult = {
    success: true,
    headers: new Headers(),
    reset: Date.now() + 60_000,
  };

  const moduleMock = {
    rateLimit: vi.fn().mockResolvedValue({ ...defaultResult, ...result }),
    RateLimitPresets: {
      VERY_STRICT: { maxRequests: 5, windowMs: 60_000 },
      STRICT: { maxRequests: 10, windowMs: 60_000 },
      MODERATE: { maxRequests: 30, windowMs: 60_000 },
      LENIENT: { maxRequests: 100, windowMs: 60_000 },
    },
  };

  return moduleMock;
};

/**
 * Create a reusable mock implementation for the request validator module.
 * Defaults to successful validation and exposes helper utilities.
 */
export const createRequestValidatorModuleMock = (options?: {
  valid?: boolean;
  errorStatus?: number;
  errorBody?: unknown;
}) => {
  const {
    valid = true,
    errorStatus = 400,
    errorBody = { error: 'Invalid request' },
  } = options ?? {};

  const validationResult = valid
    ? { valid: true }
    : {
        valid: false,
        error: createMockResponse(errorBody, errorStatus),
      };

  const moduleMock = {
    validateRequest: vi.fn().mockResolvedValue(validationResult),
    REQUEST_LIMITS: {
      MAX_JSON_SIZE: 1024 * 1024,
      DEFAULT_TIMEOUT: 30_000,
    },
    withTimeout: vi.fn((promise: Promise<unknown>) => promise),
    createSafeResponse: vi.fn((data: unknown, status = 200) => createMockResponse(data, status)),
  };

  return moduleMock;
};
