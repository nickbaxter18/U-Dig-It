import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitPresets, rateLimit } from '../rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await rateLimit(request, RateLimitPresets.MODERATE);
      expect(result.success).toBe(true);
    });

    it('should block requests exceeding limit', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // Make requests up to limit
      for (let i = 0; i < 30; i++) {
        await rateLimit(request, RateLimitPresets.MODERATE);
      }

      // Next request should fail
      const result = await rateLimit(request, RateLimitPresets.MODERATE);
      expect(result.success).toBe(false);
    });

    it('should reset limit after window expires', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });

      // Exhaust limit
      for (let i = 0; i < 30; i++) {
        await rateLimit(request, RateLimitPresets.MODERATE);
      }

      // Advance time past window (60 seconds)
      vi.advanceTimersByTime(61000);

      // Should allow requests again
      const result = await rateLimit(request, RateLimitPresets.MODERATE);
      expect(result.success).toBe(true);
    });
  });

  describe('Rate Limit Presets', () => {
    it('should apply VERY_STRICT preset', async () => {
      const request = new Request('http://localhost:3000/api/payment', {
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });

      // VERY_STRICT: 5 requests per minute
      for (let i = 0; i < 5; i++) {
        const result = await rateLimit(request, RateLimitPresets.VERY_STRICT);
        expect(result.success).toBe(true);
      }

      // 6th request should fail
      const result = await rateLimit(request, RateLimitPresets.VERY_STRICT);
      expect(result.success).toBe(false);
    });

    it('should apply STRICT preset', async () => {
      const request = new Request('http://localhost:3000/api/auth', {
        headers: { 'x-forwarded-for': '192.168.1.4' },
      });

      // STRICT: 10 requests per minute
      for (let i = 0; i < 10; i++) {
        const result = await rateLimit(request, RateLimitPresets.STRICT);
        expect(result.success).toBe(true);
      }

      const result = await rateLimit(request, RateLimitPresets.STRICT);
      expect(result.success).toBe(false);
    });

    it('should apply MODERATE preset', async () => {
      const request = new Request('http://localhost:3000/api/data', {
        headers: { 'x-forwarded-for': '192.168.1.5' },
      });

      // MODERATE: 30 requests per minute
      for (let i = 0; i < 30; i++) {
        const result = await rateLimit(request, RateLimitPresets.MODERATE);
        expect(result.success).toBe(true);
      }

      const result = await rateLimit(request, RateLimitPresets.MODERATE);
      expect(result.success).toBe(false);
    });

    it('should apply RELAXED preset', async () => {
      const request = new Request('http://localhost:3000/api/public', {
        headers: { 'x-forwarded-for': '192.168.1.6' },
      });

      // RELAXED: 100 requests per minute
      for (let i = 0; i < 100; i++) {
        const result = await rateLimit(request, RateLimitPresets.RELAXED);
        expect(result.success).toBe(true);
      }

      const result = await rateLimit(request, RateLimitPresets.RELAXED);
      expect(result.success).toBe(false);
    });
  });

  describe('Headers', () => {
    it('should include rate limit headers', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.7' },
      });

      const result = await rateLimit(request, RateLimitPresets.MODERATE);

      expect(result.headers['X-RateLimit-Limit']).toBe('30');
      expect(result.headers['X-RateLimit-Remaining']).toBeDefined();
      expect(result.headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should set Retry-After header when blocked', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.8' },
      });

      // Exhaust limit
      for (let i = 0; i < 30; i++) {
        await rateLimit(request, RateLimitPresets.MODERATE);
      }

      const result = await rateLimit(request, RateLimitPresets.MODERATE);
      expect(result.headers['Retry-After']).toBeDefined();
    });
  });

  describe('IP Detection', () => {
    it('should use x-forwarded-for header', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '203.0.113.1' },
      });

      const result = await rateLimit(request, RateLimitPresets.MODERATE);
      expect(result.success).toBe(true);
    });

    it('should use x-real-ip header', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: { 'x-real-ip': '203.0.113.2' },
      });

      const result = await rateLimit(request, RateLimitPresets.MODERATE);
      expect(result.success).toBe(true);
    });

    it('should handle localhost', async () => {
      const request = new Request('http://localhost:3000/api/test');

      const result = await rateLimit(request, RateLimitPresets.MODERATE);
      expect(result.success).toBe(true);
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom limit', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.9' },
      });

      const customConfig = {
        limit: 5,
        windowMs: 60000,
      };

      for (let i = 0; i < 5; i++) {
        const result = await rateLimit(request, customConfig);
        expect(result.success).toBe(true);
      }

      const result = await rateLimit(request, customConfig);
      expect(result.success).toBe(false);
    });

    it('should accept custom window', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.10' },
      });

      const customConfig = {
        limit: 10,
        windowMs: 30000, // 30 seconds
      };

      // Exhaust limit
      for (let i = 0; i < 10; i++) {
        await rateLimit(request, customConfig);
      }

      // Advance past window
      vi.advanceTimersByTime(31000);

      const result = await rateLimit(request, customConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('Admin Bypass', () => {
    it('should skip rate limit for admins when enabled', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.11',
          'authorization': 'Bearer admin-token',
        },
      });

      const config = {
        ...RateLimitPresets.VERY_STRICT,
        skipAdmins: true,
      };

      // Make many requests
      for (let i = 0; i < 100; i++) {
        const result = await rateLimit(request, config);
        expect(result.success).toBe(true);
      }
    });
  });
});
