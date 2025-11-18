import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../create-checkout-session/route';
import { createMockRequest, expectErrorResponse, createTestBooking } from '@/test-utils';

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

const { mockStripe } = vi.hoisted(() => {
  const checkout = {
    sessions: {
      create: vi.fn(),
    },
  };

  return {
    mockStripe: {
      checkout,
    },
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// Mock stripe/config to return our mocked Stripe instance
vi.mock('@/lib/stripe/config', () => ({
  createStripeClient: vi.fn(() => {
    const MockStripe = class {
      checkout: any;
      constructor() {
        this.checkout = mockStripe.checkout;
      }
    };
    return new MockStripe();
  }),
  getStripeSecretKey: vi.fn().mockResolvedValue('sk_test_mock_key'),
  getStripePublishableKey: vi.fn().mockResolvedValue('pk_test_mock_key'),
}));

// Mock Stripe as a constructor class
vi.mock('stripe', () => ({
  default: class MockStripe {
    checkout: any;

    constructor() {
      this.checkout = mockStripe.checkout;
    }
  },
}));

describe('POST /api/stripe/create-checkout-session', () => {
  const mockUser = { id: 'user-123' };
  const booking = createTestBooking({ customerId: mockUser.id });

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: booking, error: null }),
    });

    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/pay/cs_test123',
    });
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = createMockRequest('POST', { bookingId: booking.id });
    const response = await POST(request);

    await expectErrorResponse(response, 401);
  });

  it('should require bookingId', async () => {
    const request = createMockRequest('POST', {});
    const response = await POST(request);

    await expectErrorResponse(response, 400, /bookingId/i);
  });

  it('should verify booking ownership', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...booking, customerId: 'different-user' },
        error: null,
      }),
    });

    const request = createMockRequest('POST', { bookingId: booking.id });
    const response = await POST(request);

    await expectErrorResponse(response, 403);
  });

  it('should create Stripe checkout session', async () => {
    const request = createMockRequest('POST', {
      bookingId: booking.id,
      paymentType: 'deposit',
    });

    await POST(request);

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        success_url: expect.any(String),
        cancel_url: expect.any(String),
      })
    );
  });

  it('should return checkout URL', async () => {
    const request = createMockRequest('POST', {
      bookingId: booking.id,
      paymentType: 'deposit',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test123');
  });

  it('should handle Stripe errors', async () => {
    mockStripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe error'));

    const request = createMockRequest('POST', { bookingId: booking.id });
    const response = await POST(request);

    await expectErrorResponse(response, 500);
  });
});
