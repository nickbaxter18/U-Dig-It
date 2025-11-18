import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../capture-security-hold/route';
import { createMockRequest, expectErrorResponse, createTestBooking } from '@/test-utils';

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

const { mockStripe } = vi.hoisted(() => {
  const paymentIntents = {
    capture: vi.fn(),
  };

  return {
    mockStripe: {
      paymentIntents,
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
      paymentIntents: any;
      constructor() {
        this.paymentIntents = mockStripe.paymentIntents;
      }
    };
    return new MockStripe();
  }),
  getStripeSecretKey: vi.fn().mockResolvedValue('sk_test_mock_key'),
}));

// Mock Stripe as a constructor class
vi.mock('stripe', () => ({
  default: class MockStripe {
    paymentIntents: any;

    constructor() {
      this.paymentIntents = mockStripe.paymentIntents;
    }
  },
}));

describe('POST /api/stripe/capture-security-hold', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockBooking = createTestBooking({
    customerId: mockUser.id,
    stripe_payment_intent_id: 'pi_test123',
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockBooking,
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    });

    mockStripe.paymentIntents.capture.mockResolvedValue({
      id: 'pi_test123',
      status: 'succeeded',
    });
  });

  it('should reject unauthenticated requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = createMockRequest('POST', { bookingId: 'booking-123' });
    const response = await POST(request);

    await expectErrorResponse(response, 401);
  });

  it('should require bookingId', async () => {
    const request = createMockRequest('POST', {});
    const response = await POST(request);

    await expectErrorResponse(response, 400);
  });

  it('should reject if no payment intent exists', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockBooking, stripe_payment_intent_id: null },
        error: null,
      }),
    });

    const request = createMockRequest('POST', { bookingId: mockBooking.id });
    const response = await POST(request);

    await expectErrorResponse(response, 400);
  });

  it('should capture payment intent', async () => {
    const request = createMockRequest('POST', { bookingId: mockBooking.id });
    const response = await POST(request);

    if (response.status === 200) {
      expect(mockStripe.paymentIntents.capture).toHaveBeenCalledWith('pi_test123');
    }
  });

  it('should handle Stripe capture errors', async () => {
    mockStripe.paymentIntents.capture.mockRejectedValue(new Error('Capture failed'));

    const request = createMockRequest('POST', { bookingId: mockBooking.id });
    const response = await POST(request);

    await expectErrorResponse(response, 500);
  });
});

