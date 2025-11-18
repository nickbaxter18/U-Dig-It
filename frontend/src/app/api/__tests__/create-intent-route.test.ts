/**
 * Comprehensive API Route Tests for Payment Intent Creation
 * Tests payment creation, security, validation, and error handling
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../payments/create-intent/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limiter', () => ({
  rateLimit: vi.fn(),
  RateLimitPresets: {
    VERY_STRICT: { maxRequests: 5, windowMs: 60000 },
  },
}));

vi.mock('@/lib/request-validator', () => ({
  validateRequest: vi.fn(),
  REQUEST_LIMITS: {
    MAX_JSON_SIZE: 1024 * 1024,
    DEFAULT_TIMEOUT: 30000,
  },
  withTimeout: vi.fn((promise) => promise),
  createSafeResponse: vi.fn((data, status) =>
    new Response(JSON.stringify(data), { status })
  ),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Create a shared mock instance using hoisted
const { sharedMockPaymentIntentsCreate, sharedMockStripeInstance } = vi.hoisted(() => {
  const mockCreate = vi.fn();
  return {
    sharedMockPaymentIntentsCreate: mockCreate,
    sharedMockStripeInstance: {
      paymentIntents: {
        create: mockCreate,
      },
    },
  };
});

// Mock Stripe as a constructor class
vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      paymentIntents: any;

      constructor() {
        this.paymentIntents = {
          create: sharedMockPaymentIntentsCreate,
        };
      }
    },
  };
});

vi.mock('@/lib/rate-limiter', () => ({
  rateLimit: vi.fn(),
  RateLimitPresets: {
    VERY_STRICT: { maxRequests: 5, windowMs: 60000 },
  },
}));

vi.mock('@/lib/request-validator', () => ({
  validateRequest: vi.fn(),
  REQUEST_LIMITS: {
    MAX_JSON_SIZE: 1024 * 1024,
    DEFAULT_TIMEOUT: 30000,
  },
  withTimeout: vi.fn((promise) => promise),
  createSafeResponse: vi.fn((data, status) =>
    new Response(JSON.stringify(data), { status })
  ),
}));

describe('API Route: /api/payments/create-intent', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase);

    // Default rate limit success
    const { rateLimit } = await import('@/lib/rate-limiter');
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      headers: new Headers(),
    });

    // Default request validation success
    const { validateRequest } = await import('@/lib/request-validator');
    vi.mocked(validateRequest).mockResolvedValue({
      valid: true,
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        bookingId: 'booking-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if amount is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: 'booking-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 if bookingId is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 404 if booking not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Not found'),
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        bookingId: 'booking-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Booking not found');
  });

  it('should return 403 if user does not own booking', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'booking-1',
              customerId: 'user-2', // Different user
              totalAmount: 1000,
            },
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        bookingId: 'booking-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Unauthorized');
  });

  it('should create payment intent successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockBooking = {
      id: 'booking-1',
      bookingNumber: 'UDR-20251104-001',
      customerId: 'user-1',
      totalAmount: 1000,
      equipment: {
        make: 'Kubota',
        model: 'SVL-75',
      },
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockBooking,
                error: null,
              }),
            }),
          }),
        };
      }
      // payments table
      return {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      };
    });

    sharedMockPaymentIntentsCreate.mockResolvedValue({
      id: 'pi_test123',
      client_secret: 'pi_test123_secret',
      amount: 10000,
      currency: 'cad',
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        bookingId: 'booking-1',
        currency: 'CAD',
        type: 'payment',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clientSecret).toBe('pi_test123_secret');
    expect(data.paymentIntentId).toBe('pi_test123');
    expect(data.amount).toBe(100);
    expect(data.currency).toBe('CAD');
  });

  it('should convert amount to cents for Stripe', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'booking-1',
                  bookingNumber: 'UDR-001',
                  customerId: 'user-1',
                  equipment: { make: 'Kubota', model: 'SVL-75' },
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    });

    sharedMockPaymentIntentsCreate.mockResolvedValue({
      id: 'pi_test',
      client_secret: 'secret',
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 123.45,
        bookingId: 'booking-1',
      }),
    });

    await POST(request);

    expect(sharedMockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 12345, // 123.45 * 100
      })
    );
  });

  it('should handle deposit type correctly', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'booking-1',
                  bookingNumber: 'UDR-001',
                  customerId: 'user-1',
                  equipment: { make: 'Kubota', model: 'SVL-75' },
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    });

    sharedMockPaymentIntentsCreate.mockResolvedValue({
      id: 'pi_test',
      client_secret: 'secret',
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 500,
        bookingId: 'booking-1',
        type: 'deposit',
      }),
    });

    await POST(request);

    expect(sharedMockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('Security Deposit'),
        metadata: expect.objectContaining({
          type: 'deposit',
        }),
      })
    );
  });

  it('should return 429 if rate limit exceeded', async () => {
    const { rateLimit } = await import('@/lib/rate-limiter');
    const resetTime = Date.now() + 45000; // 45 seconds from now
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      reset: resetTime,
      headers: new Headers({ 'X-RateLimit-Remaining': '0' }),
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        bookingId: 'booking-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Too many payment attempts');
    // retryAfter should be approximately 45 seconds (allowing for small timing differences)
    expect(data.retryAfter).toBeGreaterThanOrEqual(44);
    expect(data.retryAfter).toBeLessThanOrEqual(46);
  });

  it('should handle Stripe errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'booking-1',
              customerId: 'user-1',
              bookingNumber: 'UDR-001',
              equipment: {},
            },
            error: null,
          }),
        }),
      }),
    }));

    sharedMockPaymentIntentsCreate.mockRejectedValue(
      new Error('Card declined')
    );

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        bookingId: 'booking-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Card declined');
  });
});


