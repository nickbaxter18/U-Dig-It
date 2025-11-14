import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../upload-insurance/route';
import { createMockRequest, expectErrorResponse } from '@/test-utils';

const mockSupabase = {
  auth: { getUser: vi.fn() },
  storage: {
    from: vi.fn(),
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('POST /api/upload-insurance', () => {
  const mockUser = { id: 'user-123' };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: { path: 'insurance/file.pdf' },
        error: null,
      }),
    });
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const formData = new FormData();
    formData.append('file', new File(['content'], 'insurance.pdf'));

    const request = new Request('http://localhost:3000/api/upload-insurance', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as any);
    await expectErrorResponse(response, 401);
  });

  it('should require file upload', async () => {
    const request = createMockRequest('POST', {});
    const response = await POST(request);

    await expectErrorResponse(response, 400, /file/i);
  });

  it('should validate file type', async () => {
    const formData = new FormData();
    formData.append('file', new File(['content'], 'document.txt', { type: 'text/plain' }));

    const request = new Request('http://localhost:3000/api/upload-insurance', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as any);

    await expectErrorResponse(response, 400, /file.*type/i);
  });

  it('should validate file size', async () => {
    // Create 11MB file
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', largeFile);

    const request = new Request('http://localhost:3000/api/upload-insurance', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as any);

    await expectErrorResponse(response, 400, /file.*size|too large/i);
  });

  it('should upload valid file', async () => {
    const file = new File(['insurance content'], 'insurance.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bookingId', 'booking-123');

    const request = new Request('http://localhost:3000/api/upload-insurance', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as any);

    expect(response.status).toBeLessThan(400);
  });
});

