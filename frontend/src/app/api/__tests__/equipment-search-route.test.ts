/**
 * Comprehensive API Route Tests for Equipment Search
 * Tests filtering, pagination, sorting, and error handling
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../equipment/search/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('API Route: /api/equipment/search', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock Supabase client with chainable query methods
    mockSupabase = {
      from: vi.fn(),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase);
  });

  it('should search equipment with default parameters', async () => {
    const mockData = [
      { id: '1', unitId: 'SVL-001', make: 'Kubota', model: 'SVL-75' },
      { id: '2', unitId: 'SVL-002', make: 'Kubota', model: 'SVL-75' },
    ];

    // Mock the query chain
    const queryChain = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: 2,
      }),
    };

    mockSupabase.from.mockReturnValue(queryChain);

    const request = new NextRequest('http://localhost:3000/api/equipment/search', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.total).toBe(2);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(20);
  });

  it('should filter by equipment type', async () => {
    const queryChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };

    mockSupabase.from.mockReturnValue(queryChain);

    const request = new NextRequest('http://localhost:3000/api/equipment/search', {
      method: 'POST',
      body: JSON.stringify({
        equipmentType: 'skid-steer',
      }),
    });

    await POST(request);

    expect(queryChain.eq).toHaveBeenCalledWith('equipmentType', 'skid-steer');
  });

  it('should filter by make', async () => {
    const queryChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };

    mockSupabase.from.mockReturnValue(queryChain);

    const request = new NextRequest('http://localhost:3000/api/equipment/search', {
      method: 'POST',
      body: JSON.stringify({
        make: 'Kubota',
      }),
    });

    await POST(request);

    expect(queryChain.eq).toHaveBeenCalledWith('make', 'Kubota');
  });

  it('should filter by price range', async () => {
    const queryChain = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };

    mockSupabase.from.mockReturnValue(queryChain);

    const request = new NextRequest('http://localhost:3000/api/equipment/search', {
      method: 'POST',
      body: JSON.stringify({
        minDailyRate: 400,
        maxDailyRate: 500,
      }),
    });

    await POST(request);

    expect(queryChain.gte).toHaveBeenCalledWith('dailyRate', 400);
    expect(queryChain.lte).toHaveBeenCalledWith('dailyRate', 500);
  });

  it('should support pagination', async () => {
    const queryChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 50,
      }),
    };

    mockSupabase.from.mockReturnValue(queryChain);

    const request = new NextRequest('http://localhost:3000/api/equipment/search', {
      method: 'POST',
      body: JSON.stringify({
        page: 2,
        limit: 10,
      }),
    });

    await POST(request);

    // Page 2 with limit 10 = offset 10 to 19
    expect(queryChain.range).toHaveBeenCalledWith(10, 19);
  });

  it('should support sorting', async () => {
    const queryChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };

    mockSupabase.from.mockReturnValue(queryChain);

    const request = new NextRequest('http://localhost:3000/api/equipment/search', {
      method: 'POST',
      body: JSON.stringify({
        sortBy: 'dailyRate',
        sortOrder: 'DESC',
      }),
    });

    await POST(request);

    expect(queryChain.order).toHaveBeenCalledWith('dailyRate', { ascending: false });
  });

  it('should search across multiple fields', async () => {
    const queryChain = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };

    mockSupabase.from.mockReturnValue(queryChain);

    const request = new NextRequest('http://localhost:3000/api/equipment/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'SVL-75',
      }),
    });

    await POST(request);

    expect(queryChain.or).toHaveBeenCalled();
  });

  it('should calculate total pages correctly', async () => {
    const queryChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 47,
      }),
    };

    mockSupabase.from.mockReturnValue(queryChain);

    const request = new NextRequest('http://localhost:3000/api/equipment/search', {
      method: 'POST',
      body: JSON.stringify({
        limit: 10,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.totalPages).toBe(5); // Math.ceil(47/10) = 5
  });

  it('should handle database errors gracefully', async () => {
    const queryChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: 0,
      }),
    };

    mockSupabase.from.mockReturnValue(queryChain);

    const request = new NextRequest('http://localhost:3000/api/equipment/search', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it('should handle invalid JSON gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/equipment/search', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});


