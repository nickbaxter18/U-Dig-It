import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../contest/enter/route';
import { createMockRequest, expectSuccessResponse, expectErrorResponse } from '@/test-utils';

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('POST /api/contest/enter', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      insert: vi.fn().mockResolvedValue({ data: { id: 'entry-123' }, error: null }),
    });
  });

  it('should require name', async () => {
    const request = createMockRequest('POST', {
      email: 'test@example.com',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /name/i);
  });

  it('should require email', async () => {
    const request = createMockRequest('POST', {
      name: 'John Doe',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /email/i);
  });

  it('should validate email format', async () => {
    const request = createMockRequest('POST', {
      name: 'John Doe',
      email: 'invalid-email',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /valid.*email/i);
  });

  it('should create contest entry', async () => {
    const entryData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '5065550100',
    };

    const request = createMockRequest('POST', entryData);
    const response = await POST(request);

    const data = await expectSuccessResponse(response);
    expect(data.entryId).toBeDefined();
  });

  it('should prevent duplicate entries', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'existing', email: 'test@example.com' },
        error: null,
      }),
    });

    const request = createMockRequest('POST', {
      name: 'John Doe',
      email: 'test@example.com',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /already.*entered/i);
  });

  it('should sanitize input data', async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      insert: insertMock,
    });

    const request = createMockRequest('POST', {
      name: '<script>alert("xss")</script>John',
      email: 'test@example.com',
    });

    await POST(request);

    const [[insertedData]] = insertMock.mock.calls;
    expect(insertedData.name).not.toContain('<script>');
  });
});

