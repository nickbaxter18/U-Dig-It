/**
 * Booking API Route Tests
 * Verifies validation, availability checks, pricing math, and Supabase integrations.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../bookings/route';

const { mockSupabaseApi } = vi.hoisted(() => {
  return {
    mockSupabaseApi: {
      getEquipment: vi.fn(),
      checkAvailability: vi.fn(),
      createBooking: vi.fn(),
    },
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

vi.mock('@/lib/supabase/api-client', () => ({
  supabaseApi: mockSupabaseApi,
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

  beforeEach(() => {
    vi.clearAllMocks();

    mockRateLimit.mockResolvedValue({
      success: true,
      headers: new Headers(),
      reset: Date.now() + 60000,
    });

    mockSupabaseApi.getEquipment.mockResolvedValue({
      id: 'equipment-1',
      dailyRate: 450,
    });

    mockSupabaseApi.checkAvailability.mockResolvedValue({
      available: true,
      message: 'Available',
    });

    mockSupabaseApi.createBooking.mockResolvedValue({
      bookingNumber: 'BK-123456',
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
    mockSupabaseApi.getEquipment.mockResolvedValueOnce(null);

    const response = await POST(createRequest(basePayload));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toContain('Equipment not found');
  });

  it('returns 400 when equipment is unavailable', async () => {
    mockSupabaseApi.checkAvailability.mockResolvedValueOnce({
      available: false,
      message: 'Equipment not available',
    });

    const response = await POST(createRequest(basePayload));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toContain('Equipment not available');
  });

  it('calculates pricing and delivery fee correctly', async () => {
    const response = await POST(createRequest(basePayload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pricing.days).toBe(3);
    expect(body.pricing.dailyRate).toBe(450);
    expect(body.pricing.subtotal).toBe(1350);
    expect(body.pricing.tax).toBeCloseTo(202.5);
    expect(body.pricing.deliveryFee).toBe(300);
    expect(body.pricing.total).toBeCloseTo(1552.5);
  });

  it('passes calculated booking data to Supabase', async () => {
    await POST(createRequest(basePayload));

    expect(mockSupabaseApi.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        equipmentId: 'equipment-1',
        dailyRate: 450,
        subtotal: 1350,
        taxes: 202.5,
        deliveryFee: 300,
        totalAmount: 1552.5,
        securityDeposit: 500,
        status: 'pending',
        type: 'delivery',
      })
    );
  });
});


