import { createMockRequest, expectErrorResponse } from '@/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '../lead-capture/route';

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('POST /api/lead-capture', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'lead-123' }, error: null }),
    });
  });

  it('should require email', async () => {
    const request = createMockRequest('POST', {
      name: 'John Doe',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /email/i);
  });

  it('should require name', async () => {
    const request = createMockRequest('POST', {
      email: 'test@example.com',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /name/i);
  });

  it('should create lead with valid data', async () => {
    const leadData = {
      email: 'lead@example.com',
      name: 'John Doe',
      phone: '(506) 555-0100',
      message: 'Interested in rental',
    };

    const request = createMockRequest('POST', leadData);
    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('should sanitize input data', async () => {
    const request = createMockRequest('POST', {
      email: 'test@example.com',
      name: '<script>alert("xss")</script>John',
      message: '<img src=x onerror=alert(1)>',
    });

    await POST(request);

    const [[insertData]] = mockSupabase.from().insert.mock.calls;
    expect(insertData.name).not.toContain('<script>');
    expect(insertData.message).not.toContain('<img');
  });

  it('should handle duplicate leads', async () => {
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Duplicate' },
      }),
    });

    const request = createMockRequest('POST', {
      email: 'existing@example.com',
      name: 'John Doe',
    });

    const response = await POST(request);

    expect(response.status).toBeLessThan(500);
  });
});
