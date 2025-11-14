import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '../audit/route.ts';
import { createMockRequest, expectErrorResponse } from '@/test-utils';

const { mockRequireAdmin, mockSupabase } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockSupabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/requireAdmin', () => ({
  requireAdmin: mockRequireAdmin,
}));

describe('GET /api/admin/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReset();
    const auditLogsChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    const usersChain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'audit_logs') {
        return auditLogsChain;
      }
      if (table === 'users') {
        return usersChain;
      }

      return {
        select: vi.fn().mockReturnThis(),
      };
    });

    mockRequireAdmin.mockResolvedValue({
      supabase: mockSupabase,
      user: { id: 'admin-1' },
      role: 'admin',
    });
  });

  it('should require admin authentication', async () => {
    const forbidden = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    mockRequireAdmin.mockResolvedValueOnce({
      supabase: mockSupabase,
      error: forbidden,
    });

    const response = await GET(createMockRequest('GET'));

    expect(response.status).toBe(403);
  });

  it('should return audit logs with transformed data', async () => {
    const mockLogs = [
      {
        id: '1',
        action: 'create',
        table_name: 'bookings',
        record_id: 'abc12345',
        user_id: 'user-123',
        created_at: '2025-11-09T00:00:00Z',
        old_values: null,
        new_values: { status: 'confirmed' },
        ip_address: '1.1.1.1',
        user_agent: 'Chrome',
      },
    ];

    const auditLogsChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockLogs,
        error: null,
      }),
    };

    const usersChain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          { id: 'user-123', firstName: 'Alex', lastName: 'Smith', email: 'alex@example.com' },
        ],
        error: null,
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'audit_logs') return auditLogsChain;
      if (table === 'users') return usersChain;
      return usersChain;
    });

    const response = await GET(createMockRequest('GET'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0]).toMatchObject({
      id: '1',
      adminName: 'Alex Smith',
      severity: 'medium',
    });
  });

  it('should honor limit parameter', async () => {
    const limitSpy = vi.fn().mockResolvedValue({ data: [], error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'audit_logs') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: limitSpy,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    await GET(
      createMockRequest('GET', undefined, {
        url: 'http://localhost:3000/api/admin/audit?limit=50',
      })
    );

    expect(limitSpy).toHaveBeenCalledWith(50);
  });

  it('should propagate errors from Supabase', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'audit_logs') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'DB error' },
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const response = await GET(createMockRequest('GET'));

    await expectErrorResponse(response, 500);
  });
});

