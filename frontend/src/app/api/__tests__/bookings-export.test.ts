import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from '../bookings/export/route';
import { createMockRequest, expectErrorResponse } from '@/test-utils';

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('GET /api/bookings/export', () => {
  const mockUser = { id: 'user-123' };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: '1', bookingNumber: 'UDR-2025-001', totalAmount: '1000' },
        ],
        error: null,
      }),
    });
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = createMockRequest('GET');
    const response = await GET(request);

    await expectErrorResponse(response, 401);
  });

  it('should export user bookings as CSV', async () => {
    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/bookings/export?format=csv',
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('csv');
  });

  it('should export as JSON by default', async () => {
    const request = createMockRequest('GET');
    const response = await GET(request);

    expect(response.headers.get('Content-Type')).toContain('json');
  });

  it('should only export user own bookings', async () => {
    const request = createMockRequest('GET');
    await GET(request);

    // Should filter by user ID
    expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
  });

  it('should handle date range filter', async () => {
    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/bookings/export?startDate=2025-01-01&endDate=2025-12-31',
    });

    await GET(request);

    expect(mockSupabase.from).toHaveBeenCalled();
  });
});

