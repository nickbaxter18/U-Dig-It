import { createMockRequest } from '@/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NextResponse } from 'next/server';

import { GET } from '../analytics/export/route';

const { requireAdminMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
}));

vi.mock('@/lib/supabase/requireAdmin', () => ({
  requireAdmin: requireAdminMock,
}));

type SupabaseMockOptions = {
  bookingsData?: unknown[];
  equipmentData?: unknown[];
  equipmentBookingsMap?: Record<string, unknown[]>;
  userRole?: 'admin' | 'super_admin' | 'customer';
};

function createSupabaseMock(options: SupabaseMockOptions = {}) {
  const {
    bookingsData = [],
    equipmentData = [],
    equipmentBookingsMap = {},
    userRole = 'admin',
  } = options;

  const orderMock = vi.fn().mockResolvedValue({
    data: bookingsData,
    error: null,
  });

  const bookingsSelectResult = {
    gte: vi.fn(() => ({
      order: orderMock,
    })),
    eq: vi.fn((column: string, value: string) => ({
      gte: vi.fn(() =>
        Promise.resolve({
          data: equipmentBookingsMap[value] ?? [],
          error: null,
        })
      ),
    })),
  };

  return {
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'admin-123', email: 'admin@test.com' } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { role: userRole },
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === 'bookings') {
        return {
          select: vi.fn(() => bookingsSelectResult),
        };
      }

      if (table === 'equipment') {
        return {
          select: vi.fn().mockResolvedValue({
            data: equipmentData,
            error: null,
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('GET /api/admin/analytics/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when requireAdmin rejects request', async () => {
    const unauthorized = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    requireAdminMock.mockResolvedValueOnce({ supabase: null, error: unauthorized });

    const request = createMockRequest('GET');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when user does not have admin role', async () => {
    const supabase = createSupabaseMock({ userRole: 'customer' });
    requireAdminMock.mockResolvedValue({ supabase, error: null });

    const request = createMockRequest('GET');
    const response = await GET(request);

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.error).toMatch(/admin access required/i);
  });

  it('generates CSV with booking metrics for default month range', async () => {
    const bookingsData = [
      { totalAmount: '500.00', status: 'completed' },
      { totalAmount: '750.00', status: 'pending' },
    ];
    const supabase = createSupabaseMock({ bookingsData, equipmentData: [] });
    requireAdminMock.mockResolvedValue({ supabase, error: null });

    const request = createMockRequest('GET');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv');

    const csv = await response.text();
    expect(csv).toContain('"Metric","Value","Period","Unit"');
    expect(csv).toContain('Total Revenue');
    expect(csv).toContain('Total Bookings');
    expect(csv).toContain('Average Booking Value');
  });

  it('supports week/quarter/year date ranges without error', async () => {
    const supabase = createSupabaseMock();
    requireAdminMock.mockResolvedValue({ supabase, error: null });

    for (const dateRange of ['week', 'quarter', 'year']) {
      const request = createMockRequest('GET', undefined, {
        url: `https://example.com/api/admin/analytics/export?dateRange=${dateRange}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
    }
  });

  it('includes equipment utilization metrics when equipment is present', async () => {
    const equipmentData = [{ id: 'eq-1', make: 'Kubota', model: 'SVL-75', status: 'available' }];
    const equipmentBookingsMap = {
      'eq-1': [{ status: 'confirmed' }, { status: 'in_progress' }, { status: 'cancelled' }],
    };

    const supabase = createSupabaseMock({
      bookingsData: [],
      equipmentData,
      equipmentBookingsMap,
    });
    requireAdminMock.mockResolvedValue({ supabase, error: null });

    const request = createMockRequest('GET');
    const response = await GET(request);
    const csv = await response.text();

    expect(csv).toContain('Equipment Utilization - Kubota SVL-75');
    expect(csv).toContain('"active bookings"');
  });
});
