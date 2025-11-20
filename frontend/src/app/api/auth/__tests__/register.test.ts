import { createMockRequest, expectErrorResponse } from '@/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '../register/route.ts';

const mockSupabase = {
  auth: {
    signUp: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    });
  });

  describe('Input Validation', () => {
    it('should require email', async () => {
      const request = createMockRequest('POST', {
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['email'] })])
      );
    });

    it('should require password', async () => {
      const request = createMockRequest('POST', {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['password'] })])
      );
    });

    it('should require firstName', async () => {
      const request = createMockRequest('POST', {
        email: 'test@example.com',
        password: 'Password123!',
        lastName: 'Doe',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['firstName'] })])
      );
    });

    it('should require lastName', async () => {
      const request = createMockRequest('POST', {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['lastName'] })])
      );
    });

    it('should validate email format', async () => {
      const request = createMockRequest('POST', {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['email'] })])
      );
    });

    it('should validate password strength', async () => {
      const request = createMockRequest('POST', {
        email: 'test@example.com',
        password: '123', // Too weak
        firstName: 'John',
        lastName: 'Doe',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['password'] })])
      );
    });
  });

  describe('User Creation', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const request = createMockRequest('POST', userData);
      await POST(request);

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: expect.objectContaining({
          data: expect.objectContaining({
            first_name: userData.firstName,
            last_name: userData.lastName,
          }),
        }),
      });
    });

    it('should handle duplicate email error', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const request = createMockRequest('POST', {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      const response = await POST(request);
      await expectErrorResponse(response, 400, /already.*registered/i);
    });

    it('should sanitize user inputs', async () => {
      const request = createMockRequest('POST', {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: '<script>alert("xss")</script>John',
        lastName: 'Doe',
      });

      await POST(request);

      const [[signUpData]] = mockSupabase.auth.signUp.mock.calls;
      expect(signUpData.options.data.first_name).not.toContain('<script>');
    });
  });

  describe('Optional Fields', () => {
    it('should accept phone number', async () => {
      const request = createMockRequest('POST', {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '(506) 555-0100',
      });

      const response = await POST(request);

      expect(response.status).toBeLessThan(400);
    });

    it('should accept company name', async () => {
      const request = createMockRequest('POST', {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Test Corp',
      });

      const response = await POST(request);

      expect(response.status).toBeLessThan(400);
    });
  });
});
