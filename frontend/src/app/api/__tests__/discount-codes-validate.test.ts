import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../discount-codes/validate/route';
import { createMockRequest, expectSuccessResponse, expectErrorResponse } from '@/test-utils';

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('POST /api/discount-codes/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require code parameter', async () => {
    const request = createMockRequest('POST', {});
    const response = await POST(request);

    await expectErrorResponse(response, 400, /code/i);
  });

  it('should validate active discount code', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          code: 'SAVE10',
          discount_percent: 10,
          active: true,
        },
        error: null,
      }),
    });

    const request = createMockRequest('POST', { code: 'SAVE10' });
    const response = await POST(request);

    const data = await expectSuccessResponse(response);
    expect(data.valid).toBe(true);
    expect(data.discount).toBe(10);
  });

  it('should reject invalid code', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    });

    const request = createMockRequest('POST', { code: 'INVALID' });
    const response = await POST(request);

    await expectErrorResponse(response, 404, /invalid.*code|not found/i);
  });

  it('should reject expired codes', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          code: 'EXPIRED',
          expires_at: yesterday.toISOString(),
          active: true,
        },
        error: null,
      }),
    });

    const request = createMockRequest('POST', { code: 'EXPIRED' });
    const response = await POST(request);

    await expectErrorResponse(response, 400, /expired/i);
  });

  it('should reject inactive codes', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          code: 'INACTIVE',
          active: false,
        },
        error: null,
      }),
    });

    const request = createMockRequest('POST', { code: 'INACTIVE' });
    const response = await POST(request);

    await expectErrorResponse(response, 400, /inactive|not active/i);
  });

  it('should check usage limits', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          code: 'LIMITED',
          max_uses: 10,
          times_used: 10,
          active: true,
        },
        error: null,
      }),
    });

    const request = createMockRequest('POST', { code: 'LIMITED' });
    const response = await POST(request);

    await expectErrorResponse(response, 400, /limit.*reached|no longer valid/i);
  });
});

