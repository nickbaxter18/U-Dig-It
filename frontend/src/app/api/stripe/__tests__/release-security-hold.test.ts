import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../release-security-hold/route';
import { createMockRequest, expectSuccessResponse, expectErrorResponse, createTestBooking } from '@/test-utils';

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

const mockStripe = {
  paymentIntents: {
    cancel: vi.fn(),
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}));

describe('POST /api/stripe/release-security-hold', () => {
  const mockUser = { id: 'user-123' };
  const booking = createTestBooking({
    customerId: mockUser.id,
    security_hold_intent_id: 'pi_test123',
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
      single: vi.fn().mockResolvedValue({ data: booking, error: null }),
      update: vi.fn().mockReturnThis(),
    });

    mockStripe.paymentIntents.cancel.mockResolvedValue({
      id: 'pi_test123',
      status: 'canceled',
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

  it('should cancel payment intent', async () => {
    const request = createMockRequest('POST', { bookingId: booking.id });
    await POST(request);

    expect(mockStripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_test123');
  });

  it('should update booking status', async () => {
    const updateMock = vi.fn().mockResolvedValue({ data: {}, error: null });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: booking, error: null }),
      update: updateMock,
    });

    const request = createMockRequest('POST', { bookingId: booking.id });
    await POST(request);

    expect(updateMock).toHaveBeenCalled();
  });

  it('should handle Stripe errors', async () => {
    mockStripe.paymentIntents.cancel.mockRejectedValue(new Error('Stripe error'));

    const request = createMockRequest('POST', { bookingId: booking.id });
    const response = await POST(request);

    await expectErrorResponse(response, 500);
  });
});
