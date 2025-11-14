/**
 * Comprehensive API Route Tests for Availability Endpoint
 * Tests availability checking, rate limiting, validation, and error handling
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from '../availability/route';
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
    MODERATE: { maxRequests: 30, windowMs: 60000 },
  },
}));

vi.mock('@/lib/supabase/api-client', () => ({
  supabaseApi: {
    getEquipmentList: vi.fn(),
    checkAvailability: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/error-handler', () => ({
  handleSupabaseError: vi.fn((error) => ({
    message: error.message || 'Database error',
    code: 'DB_ERROR',
  })),
}));

describe('API Route: /api/availability', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Default mock implementations
    const { rateLimit } = await import('@/lib/rate-limiter');
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      headers: new Headers(),
    });
  });

  describe('GET /api/availability', () => {
    it('should return 400 if startDate is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/availability?endDate=2025-11-10'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('startDate and endDate are required');
    });

    it('should return 400 if endDate is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/availability?startDate=2025-11-01'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('startDate and endDate are required');
    });

    it('should return 429 if rate limit exceeded', async () => {
      const { rateLimit } = await import('@/lib/rate-limiter');
      vi.mocked(rateLimit).mockResolvedValueOnce({
        success: false,
        resetMs: 30000,
        headers: new Headers({ 'X-RateLimit-Remaining': '0' }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/availability?startDate=2025-11-01&endDate=2025-11-10'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Too many availability checks');
      expect(data.retryAfter).toBe(30);
    });

    it('should return availability when equipment exists and is available', async () => {
      const { supabaseApi } = await import('@/lib/supabase/api-client');

      supabaseApi.getEquipmentList.mockResolvedValue([
        {
          id: 'equip-1',
          dailyRate: 450,
          weeklyRate: 2500,
          monthlyRate: 8000,
          overageHourlyRate: 50,
        },
      ]);

      supabaseApi.checkAvailability.mockResolvedValue({
        available: true,
        message: 'Equipment is available',
        alternatives: [],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/availability?startDate=2025-11-01&endDate=2025-11-10'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
      expect(data.equipmentId).toBe('equip-1');
      expect(data.pricing.dailyRate).toBe(450);
      expect(data.pricing.currency).toBe('CAD');
      expect(data.pricing.taxes).toBe(0.15);
    });

    it('should return unavailable when equipment is not available', async () => {
      const { supabaseApi } = await import('@/lib/supabase/api-client');

      supabaseApi.getEquipmentList.mockResolvedValue([
        {
          id: 'equip-1',
          dailyRate: 450,
        },
      ]);

      supabaseApi.checkAvailability.mockResolvedValue({
        available: false,
        message: 'Equipment is booked',
        alternatives: ['equip-2'],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/availability?startDate=2025-11-01&endDate=2025-11-10'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(false);
      expect(data.message).toBe('Equipment is booked'); // Uses the message from checkAvailability
      expect(data.alternatives).toEqual(['equip-2']);
    });

    it('should handle specific equipment ID in query', async () => {
      const { supabaseApi } = await import('@/lib/supabase/api-client');

      supabaseApi.getEquipmentList.mockResolvedValue([
        { id: 'equip-1', dailyRate: 450 },
      ]);

      supabaseApi.checkAvailability.mockResolvedValue({
        available: true,
        alternatives: [],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/availability?startDate=2025-11-01&endDate=2025-11-10&equipmentId=equip-specific'
      );

      const response = await GET(request);

      expect(supabaseApi.checkAvailability).toHaveBeenCalledWith(
        'equip-specific',
        '2025-11-01',
        '2025-11-10'
      );
    });

    it('should return fallback pricing when equipment data is incomplete', async () => {
      const { supabaseApi } = await import('@/lib/supabase/api-client');

      supabaseApi.getEquipmentList.mockResolvedValue([
        { id: 'equip-1' }, // No pricing data
      ]);

      supabaseApi.checkAvailability.mockResolvedValue({
        available: true,
        alternatives: [],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/availability?startDate=2025-11-01&endDate=2025-11-10'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.pricing.dailyRate).toBe(450); // Default
      expect(data.pricing.overageHourlyRate).toBe(50); // Default
    });

    it('should return error when no equipment configured', async () => {
      const { supabaseApi } = await import('@/lib/supabase/api-client');

      supabaseApi.getEquipmentList.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/availability?startDate=2025-11-01&endDate=2025-11-10'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(false);
      expect(data.message).toContain('No equipment configured');
    });

    it('should handle database errors gracefully', async () => {
      const { supabaseApi } = await import('@/lib/supabase/api-client');

      supabaseApi.getEquipmentList.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/availability?startDate=2025-11-01&endDate=2025-11-10'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.available).toBe(false);
    });

    it('should include cache headers in successful response', async () => {
      const { supabaseApi } = await import('@/lib/supabase/api-client');

      supabaseApi.getEquipmentList.mockResolvedValue([
        { id: 'equip-1', dailyRate: 450 },
      ]);

      supabaseApi.checkAvailability.mockResolvedValue({
        available: true,
        alternatives: [],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/availability?startDate=2025-11-01&endDate=2025-11-10'
      );

      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('s-maxage=300');
    });
  });

  describe('OPTIONS /api/availability', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
  });
});


