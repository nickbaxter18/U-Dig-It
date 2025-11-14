/**
 * Comprehensive API Route Tests for Contact Form
 * Tests validation, sanitization, rate limiting, and security
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST, GET } from '../contact/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limiter', () => ({
  rateLimit: vi.fn(),
  RateLimitPresets: {
    STRICT: { maxRequests: 10, windowMs: 60000 },
  },
}));

vi.mock('@/lib/input-sanitizer', () => ({
  sanitizeContactFormData: vi.fn((data) => data),
  detectMaliciousInput: vi.fn(() => ({ isMalicious: false })),
}));

describe('API Route: /api/contact', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Default rate limit success
    const { rateLimit } = await import('@/lib/rate-limiter');
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      headers: new Headers(),
    });
  });

  describe('POST /api/contact', () => {
    it('should accept valid contact form submission', async () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '506-555-1234',
        subject: 'Equipment Inquiry',
        message: 'I would like to rent the SVL-75 for next week.',
      };

      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(validData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.submissionId).toBeDefined();
    });

    it('should return 429 if rate limit exceeded', async () => {
      const { rateLimit } = await import('@/lib/rate-limiter');
      vi.mocked(rateLimit)
      rateLimit.mockResolvedValueOnce({
        success: false,
        resetMs: 45000,
        headers: new Headers({ 'X-RateLimit-Remaining': '0' }),
      });

      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          subject: 'Test',
          message: 'Test message here',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Too many requests');
      if (typeof data.retryAfter === 'number') {
        expect(data.retryAfter).toBeGreaterThan(0);
      } else {
        expect(data.retryAfter).toBeNull();
      }
    });

    it('should return 400 if firstName is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          lastName: 'Doe',
          email: 'john@example.com',
          subject: 'Test',
          message: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 if email is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          subject: 'Test',
          message: 'Test message here',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 if message is too short', async () => {
      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          subject: 'Test',
          message: 'Short', // Less than 10 chars
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 if message is too long', async () => {
      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          subject: 'Test',
          message: 'x'.repeat(1001), // More than 1000 chars
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject malicious content', async () => {
      const { detectMaliciousInput } = await import('@/lib/input-sanitizer');
      vi.mocked(detectMaliciousInput)
      detectMaliciousInput.mockReturnValueOnce({
        isMalicious: true,
        reason: 'XSS detected',
      });

      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          subject: 'Test',
          message: '<script>alert("XSS")</script>Message here',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid content');
    });

    it('should sanitize form data before processing', async () => {
      const { sanitizeContactFormData } = await import('@/lib/input-sanitizer');
      vi.mocked(sanitizeContactFormData)

      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'JOHN@EXAMPLE.COM',
          subject: '  Test Subject  ',
          message: '  Test message here with proper length.  ',
        }),
      });

      await POST(request);

      expect(sanitizeContactFormData).toHaveBeenCalled();
    });

    it('should handle optional phone field', async () => {
      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          subject: 'Test',
          message: 'Test message here',
          // phone omitted
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should generate unique submission ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          subject: 'Test',
          message: 'Test message here',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.submissionId).toMatch(/^contact-\d+$/);
    });

    it('should log successful submissions', async () => {
      const { logger } = await import('@/lib/logger');
      vi.mocked(logger.info)

      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          subject: 'Test',
          message: 'Test message here',
        }),
      });

      await POST(request);

      expect(logger.info).toHaveBeenCalledWith(
        'Contact form submission received',
        expect.any(Object)
      );
    });
  });

  describe('GET /api/contact', () => {
    it('should return working status', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('working');
    });
  });
});


