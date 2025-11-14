/**
 * Contract Generation API Tests
 * Ensures authentication, authorization, and Supabase RPC behaviors are enforced.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../generate/route';
import { createMockRequest, expectErrorResponse, expectSuccessResponse } from '@/test-utils';

const { mockSupabaseClient } = vi.hoisted(() => ({
  mockSupabaseClient: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabaseClient),
}));

describe('API Route: /api/contracts/generate', () => {
  const mockUser = {
    id: 'user-123',
    email: 'customer@example.com',
    user_metadata: {},
  };

  const createBookingChain = (booking: any, error: any = null) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: booking,
        error,
      }),
    };
    mockSupabaseClient.from.mockReturnValue(chain);
    return chain;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabaseClient.rpc.mockResolvedValue({
      data: 'contract-001',
      error: null,
    });

    createBookingChain({
      id: 'booking-001',
      customerId: mockUser.id,
      bookingNumber: 'BK-123',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const response = await POST(createMockRequest('POST', { bookingId: 'booking-001' }));

    await expectErrorResponse(response, 401);
  });

  it('returns 400 when bookingId missing', async () => {
    const response = await POST(createMockRequest('POST', {}));

    await expectErrorResponse(response, 400, /booking id/i);
  });

  it('returns 404 when booking not found', async () => {
    createBookingChain(null, new Error('Not found'));

    const response = await POST(createMockRequest('POST', { bookingId: 'missing-booking' }));

    await expectErrorResponse(response, 404, /not found/i);
  });

  it('returns 403 when booking belongs to another customer', async () => {
    createBookingChain({
      id: 'booking-999',
      customerId: 'different-user',
    });

    const response = await POST(createMockRequest('POST', { bookingId: 'booking-999' }));

    await expectErrorResponse(response, 403, /unauthorized/i);
  });

  it('allows admin override when customer differs', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          ...mockUser,
          id: 'admin-user',
          user_metadata: { role: 'admin' },
        },
      },
      error: null,
    });

    createBookingChain({
      id: 'booking-999',
      customerId: 'different-user',
    });

    const response = await POST(createMockRequest('POST', { bookingId: 'booking-999' }));
    const data = await expectSuccessResponse(response);

    expect(data.success).toBe(true);
    expect(data.contractId).toBe('contract-001');
  });

  it('returns 500 when Supabase RPC fails', async () => {
    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: { message: 'RPC failure' },
    });

    const response = await POST(createMockRequest('POST', { bookingId: 'booking-001' }));

    await expectErrorResponse(response, 500, /rpc failure/i);
  });

  it('returns contractId on success', async () => {
    mockSupabaseClient.rpc.mockResolvedValue({
      data: 'contract-999',
      error: null,
    });

    const response = await POST(createMockRequest('POST', { bookingId: 'booking-001' }));
    const data = await expectSuccessResponse(response);

    expect(data.contractId).toBe('contract-999');
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('generate_rental_contract', {
      p_booking_id: 'booking-001',
    });
  });
});



















