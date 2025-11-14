import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../contact/route';
import { createMockRequest, expectSuccessResponse, expectErrorResponse } from '@/test-utils';

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'contact-123' }, error: null }),
    });
  });

  it('should require name', async () => {
    const request = createMockRequest('POST', {
      email: 'test@example.com',
      message: 'Hello',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /name/i);
  });

  it('should require email', async () => {
    const request = createMockRequest('POST', {
      name: 'John Doe',
      message: 'Hello',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /email/i);
  });

  it('should require message', async () => {
    const request = createMockRequest('POST', {
      name: 'John Doe',
      email: 'test@example.com',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /message/i);
  });

  it('should validate email format', async () => {
    const request = createMockRequest('POST', {
      name: 'John Doe',
      email: 'invalid-email',
      message: 'Hello',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /valid.*email/i);
  });

  it('should create contact submission', async () => {
    const contactData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '5065550100',
      message: 'I need help with booking',
    };

    const request = createMockRequest('POST', contactData);
    const response = await POST(request);

    const data = await expectSuccessResponse(response);
    expect(data.id).toBe('contact-123');
  });

  it('should sanitize input data', async () => {
    const insertMock = vi.fn().mockReturnThis();
    mockSupabase.from.mockReturnValue({
      insert: insertMock,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    });

    const request = createMockRequest('POST', {
      name: '<script>alert("xss")</script>John',
      email: 'test@example.com',
      message: '<img src=x onerror=alert(1)>Help',
    });

    await POST(request);

    const [[insertedData]] = insertMock.mock.calls;
    expect(insertedData.name).not.toContain('<script>');
    expect(insertedData.message).not.toContain('<img');
  });

  it('should handle optional phone number', async () => {
    const request = createMockRequest('POST', {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello',
      phone: '(506) 555-0100',
    });

    const response = await POST(request);
    expect(response.status).toBeLessThan(400);
  });

  it('should send notification email', async () => {
    const request = createMockRequest('POST', {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'I have a question',
    });

    const response = await POST(request);
    const data = await expectSuccessResponse(response);

    expect(data.emailSent).toBe(true);
  });
});


