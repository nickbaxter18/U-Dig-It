import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '../bookings/route.ts';
import { createMockRequest } from '@/test-utils';

const mockQueryChain = () => {
  const chain: any = {
    select: vi.fn().mockImplementation(() => chain),
    eq: vi.fn().mockImplementation(() => chain),
    ilike: vi.fn().mockImplementation(() => chain),
    order: vi.fn().mockImplementation(() => chain),
    range: vi.fn().mockResolvedValue({
      data: [],
      count: 0,
      error: null,
    }),
  };
  return chain;
};

const { mockSupabase, mockRequireAdmin } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
  },
  mockRequireAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/requireAdmin', () => ({
  requireAdmin: mockRequireAdmin,
}));

describe('GET /api/admin/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReset();
    mockSupabase.from.mockReturnValue(mockQueryChain());

    mockRequireAdmin.mockResolvedValue({
      supabase: mockSupabase,
      user: { id: 'admin-123' },
      role: 'admin',
    });
  });

  it('should require admin role', async () => {
    const forbidden = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    mockRequireAdmin.mockResolvedValueOnce({
      supabase: mockSupabase,
      error: forbidden,
    });

    const response = await GET(createMockRequest('GET'));

    expect(response.status).toBe(403);
  });

  it('should return paginated bookings', async () => {
    const query = mockQueryChain();
    query.range.mockResolvedValue({
      data: [{ id: 'booking-1' }],
      count: 42,
      error: null,
    });
    mockSupabase.from.mockReturnValue(query);

    const response = await GET(
      createMockRequest('GET', undefined, {
        url: 'http://localhost:3000/api/admin/bookings?page=2&limit=10',
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(query.range).toHaveBeenCalledWith(10, 19);
    expect(body).toMatchObject({
      bookings: [{ id: 'booking-1' }],
      total: 42,
      page: 2,
      pageSize: 10,
    });
  });

  it('should filter by status', async () => {
    const query = mockQueryChain();
    mockSupabase.from.mockReturnValue(query);

    await GET(
      createMockRequest('GET', undefined, {
        url: 'http://localhost:3000/api/admin/bookings?status=CONFIRMED',
      })
    );

    expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
    expect(query.eq).toHaveBeenCalledWith('status', 'CONFIRMED');
  });

  it('should sort bookings', async () => {
    const query = mockQueryChain();
    mockSupabase.from.mockReturnValue(query);

    await GET(
      createMockRequest('GET', undefined, {
        url: 'http://localhost:3000/api/admin/bookings?sortBy=createdAt&sortOrder=desc',
      })
    );

    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should search bookings by booking number', async () => {
    const query = mockQueryChain();
    mockSupabase.from.mockReturnValue(query);

    await GET(
      createMockRequest('GET', undefined, {
        url: 'http://localhost:3000/api/admin/bookings?search=UDR-2025',
      })
    );

    expect(query.ilike).toHaveBeenCalledWith('bookingNumber', '%UDR-2025%');
  });
});
