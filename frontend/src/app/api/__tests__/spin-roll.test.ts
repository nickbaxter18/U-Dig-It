import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../spin/roll/route';
import { createMockRequest, expectSuccessResponse, expectErrorResponse } from '@/test-utils';

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('POST /api/spin/roll', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      insert: vi.fn().mockResolvedValue({ data: { segment: 2, prize: '10% off' }, error: null }),
      update: vi.fn().mockReturnThis(),
    });
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = createMockRequest('POST', {});
    const response = await POST(request);

    await expectErrorResponse(response, 401);
  });

  it('should allow one spin per user', async () => {
    // User already spun
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'spin-123', has_spun: true },
        error: null,
      }),
    });

    const request = createMockRequest('POST', {});
    const response = await POST(request);

    await expectErrorResponse(response, 400, /already.*spun/i);
  });

  it('should generate random prize', async () => {
    const request = createMockRequest('POST', {});
    const response = await POST(request);

    const data = await expectSuccessResponse(response);
    expect(data.prize).toBeDefined();
    expect(data.segment).toBeDefined();
  });

  it('should save spin result', async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      insert: insertMock,
    });

    const request = createMockRequest('POST', {});
    await POST(request);

    expect(insertMock).toHaveBeenCalled();
  });

  it('should return prize segment for animation', async () => {
    const request = createMockRequest('POST', {});
    const response = await POST(request);

    const data = await expectSuccessResponse(response);
    expect(data.segment).toBeGreaterThanOrEqual(0);
    expect(data.segment).toBeLessThan(8);
  });
});

