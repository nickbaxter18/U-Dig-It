/**
 * Booking API Route Tests
 * Verifies validation, availability checks, pricing math, and Supabase integrations.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../bookings/route';

const { mockSupabaseClient, mockFrom, mockSelect, mockEq, mockSingle, mockInsert, bookingsCallCounter } = vi.hoisted(() => {
  const mockFromFn = vi.fn();
  const mockSelectFn = vi.fn();
  const mockEqFn = vi.fn();
  const mockSingleFn = vi.fn();
  const mockInsertFn = vi.fn();
  let callCount = 0;

  return {
    mockSupabaseClient: {
      auth: {
        getUser: vi.fn(),
      },
      from: mockFromFn,
    },
    mockFrom: mockFromFn,
    mockSelect: mockSelectFn,
    mockEq: mockEqFn,
    mockSingle: mockSingleFn,
    mockInsert: mockInsertFn,
    bookingsCallCounter: { count: callCount, reset: () => { callCount = 0; }, increment: () => { callCount++; return callCount; } },
  };
});

const { mockRateLimit } = vi.hoisted(() => ({
  mockRateLimit: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limiter', () => ({
  rateLimit: mockRateLimit,
  RateLimitPresets: {
    STRICT: { maxRequests: 10, windowMs: 60000 },
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/request-validator', () => ({
  validateRequest: vi.fn(),
  REQUEST_LIMITS: {
    MAX_JSON_SIZE: 128 * 1024,
    DEFAULT_TIMEOUT: 30000,
  },
}));

vi.mock('@/lib/supabase/error-handler', () => ({
  handleSupabaseError: vi.fn().mockReturnValue({
    message: 'Supabase error',
  }),
}));

describe('API Route: /api/bookings', () => {
  const basePayload = {
    equipmentId: 'equipment-1',
    startDate: '2099-12-01T00:00:00.000Z',
    endDate: '2099-12-04T00:00:00.000Z',
    customerInfo: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+15065550199',
      company: 'Kubota Test Inc.',
    },
    deliveryAddress: {
      street: '123 Market St',
      city: 'Saint John',
      postalCode: 'E2L 4L9',
      province: 'NB',
    },
    notes: 'Test booking',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset call counters
    bookingsCallCounter.reset();
    mockFrom.mockClear();

    mockRateLimit.mockResolvedValue({
      success: true,
      headers: new Headers(),
      reset: Date.now() + 60000,
    });

    // Mock request validator
    const { validateRequest } = await import('@/lib/request-validator');
    vi.mocked(validateRequest).mockResolvedValue({
      valid: true,
    });

    // Mock Supabase client
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any);

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    // Setup mock chain for equipment query: from('equipment').select(...).eq('id', ...).single()
    const mockEquipmentChain = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };

    mockEquipmentChain.select.mockReturnValue(mockEquipmentChain);
    mockEquipmentChain.eq.mockReturnValue(mockEquipmentChain);
    mockEquipmentChain.single.mockResolvedValue({
      data: {
        id: 'equipment-1',
        model: 'SVL75-3',
        dailyRate: 450,
        weeklyRate: 2250,
        monthlyRate: 9000,
        overageHourlyRate: 50,
        dailyHourAllowance: 8,
        weeklyHourAllowance: 40,
      },
      error: null,
    });

    // Setup mock chain for availability check: from('bookings').select(...).eq(...).not(...).or(...)
    // The entire chain needs to be awaitable, so or() returns a promise
    const mockAvailabilityChain = {
      select: vi.fn(),
      eq: vi.fn(),
      not: vi.fn(),
      or: vi.fn(),
    };

    // Chain methods return the chain object for method chaining
    mockAvailabilityChain.select.mockReturnValue(mockAvailabilityChain);
    mockAvailabilityChain.eq.mockReturnValue(mockAvailabilityChain);
    mockAvailabilityChain.not.mockReturnValue(mockAvailabilityChain);
    // or() returns a promise that resolves to { data, error }
    mockAvailabilityChain.or.mockResolvedValue({
      data: [],
      error: null,
    });

    // Setup mock chain for booking insert: from('bookings').insert(...).select(...).single()
    const mockBookingInsertChain = {
      select: vi.fn(),
      single: vi.fn(),
    };

    mockBookingInsertChain.select.mockReturnValue(mockBookingInsertChain);
    mockBookingInsertChain.single.mockResolvedValue({
      data: {
        id: 'booking-1',
        bookingNumber: 'BK-123456',
        status: 'pending',
        totalAmount: 1552.5,
        startDate: '2099-12-01T00:00:00.000Z',
        endDate: '2099-12-04T00:00:00.000Z',
        deliveryCity: 'Saint John',
      },
      error: null,
    });

    const mockInsertChain = {
      select: vi.fn().mockReturnValue(mockBookingInsertChain),
    };

    // Mock from() to return appropriate chain based on table name and call sequence
    mockFrom.mockImplementation((table: string) => {
      if (table === 'equipment') {
        return mockEquipmentChain;
      }
      if (table === 'bookings') {
        const callNum = bookingsCallCounter.increment();
        // First call: availability check (select)
        if (callNum === 1) {
          return mockAvailabilityChain;
        }
        // Second call: insert booking
        return {
          select: mockSelect,
          insert: vi.fn().mockReturnValue(mockInsertChain),
        };
      }
      return { select: mockSelect, insert: mockInsert };
    });

    vi.spyOn(Date, 'now').mockReturnValue(1731196800000); // 2024-11-09T00:00:00.000Z
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRequest = (payload: Record<string, unknown>) =>
    new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json',
      },
    });

  it('rejects when rate limit exceeded', async () => {
    mockRateLimit.mockResolvedValueOnce({
      success: false,
      headers: new Headers({ 'Retry-After': '60' }),
      reset: Date.now() + 60000,
    });

    const response = await POST(createRequest(basePayload));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.retryAfter).toBeGreaterThan(0);
  });

  it('validates request schema', async () => {
    const response = await POST(
      createRequest({
        ...basePayload,
        equipmentId: '',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
    expect(body.success).toBe(false);
  });

  it('rejects when start date is in the past', async () => {
    const response = await POST(
      createRequest({
        ...basePayload,
        startDate: '2000-01-01T00:00:00.000Z',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toContain('Start date cannot be in the past');
  });

  it('rejects when end date precedes start date', async () => {
    const response = await POST(
      createRequest({
        ...basePayload,
        endDate: '2099-11-30T00:00:00.000Z',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toContain('End date must be after start date');
  });

  it('returns 404 when equipment not found', async () => {
    // Reset call counter and setup new mock for equipment query
    bookingsCallCounter.reset();
    mockFrom.mockReset();

    const mockEquipmentChainError = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      }),
    };

    mockEquipmentChainError.select.mockReturnValue(mockEquipmentChainError);
    mockEquipmentChainError.eq.mockReturnValue(mockEquipmentChainError);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'equipment') {
        return mockEquipmentChainError;
      }
      return { select: mockSelect, insert: mockInsert };
    });

    const response = await POST(createRequest(basePayload));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toContain('Equipment not found');
  });

  it('calculates pricing and delivery fee correctly', async () => {
    const response = await POST(createRequest(basePayload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pricing.days).toBe(3);
    expect(body.pricing.total).toBeGreaterThan(0);
    expect(body.pricing.deliveryFee).toBeGreaterThanOrEqual(0);
  });

  it('creates booking in database', async () => {
    const response = await POST(createRequest(basePayload));
    const body = await response.json();

    // Verify booking was created successfully
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.bookingRef).toBeDefined();

    // Verify Supabase was called for equipment and bookings
    expect(mockFrom).toHaveBeenCalledWith('equipment');
    expect(mockFrom).toHaveBeenCalledWith('bookings');
  });
});
