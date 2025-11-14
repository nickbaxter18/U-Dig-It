import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../stripe/route';
import { createMockRequest } from '@/test-utils';

const mockStripe = {
  webhooks: {
    constructEvent: vi.fn(),
  },
};

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}));

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('POST /api/webhook/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
    });
  });

  it('should verify webhook signature', async () => {
    const request = createMockRequest('POST', {}, {
      headers: { 'stripe-signature': 'sig_test' },
    });

    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test' } },
    });

    await POST(request);

    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled();
  });

  it('should handle payment_intent.succeeded event', async () => {
    const request = createMockRequest('POST', {}, {
      headers: { 'stripe-signature': 'sig_test' },
    });

    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test123',
          metadata: { bookingId: 'booking-123' },
        },
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('should handle charge.refunded event', async () => {
    const request = createMockRequest('POST', {}, {
      headers: { 'stripe-signature': 'sig_test' },
    });

    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_test123',
          metadata: { bookingId: 'booking-123' },
        },
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('should reject invalid signature', async () => {
    const request = createMockRequest('POST', {}, {
      headers: { 'stripe-signature': 'invalid' },
    });

    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should handle unknown event types', async () => {
    const request = createMockRequest('POST', {}, {
      headers: { 'stripe-signature': 'sig_test' },
    });

    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'unknown.event',
      data: { object: {} },
    });

    const response = await POST(request);

    expect(response.status).toBe(200); // Still return 200 to acknowledge
  });
});

