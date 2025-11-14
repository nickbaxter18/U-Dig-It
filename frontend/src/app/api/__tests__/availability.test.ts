import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from '../availability/route';
import { createMockRequest, expectErrorResponse } from '@/test-utils';

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('GET /api/availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
  });

  it('should require equipmentId parameter', async () => {
    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/availability',
    });

    const response = await GET(request);
    await expectErrorResponse(response, 400, /equipmentId/i);
  });

  it('should require startDate parameter', async () => {
    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/availability?equipmentId=eq-123',
    });

    const response = await GET(request);
    await expectErrorResponse(response, 400, /startDate/i);
  });

  it('should require endDate parameter', async () => {
    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/availability?equipmentId=eq-123&startDate=2025-02-01',
    });

    const response = await GET(request);
    await expectErrorResponse(response, 400, /endDate/i);
  });

  it('should return availability for equipment', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: '1', start_at_utc: '2025-02-01T00:00:00Z', end_at_utc: '2025-02-05T00:00:00Z', reason: 'BOOKING' },
        ],
        error: null,
      }),
    });

    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/availability?equipmentId=eq-123&startDate=2025-02-01&endDate=2025-02-28',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.available).toBeDefined();
  });

  it('should detect booking conflicts', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { start_at_utc: '2025-02-10T00:00:00Z', end_at_utc: '2025-02-15T00:00:00Z', reason: 'BOOKING' },
        ],
        error: null,
      }),
    });

    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/availability?equipmentId=eq-123&startDate=2025-02-01&endDate=2025-02-28',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.available).toBe(false);
    expect(data.conflicts).toHaveLength(1);
  });

  it('should detect maintenance blocks', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { start_at_utc: '2025-02-10T00:00:00Z', end_at_utc: '2025-02-12T00:00:00Z', reason: 'MAINTENANCE' },
        ],
        error: null,
      }),
    });

    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/availability?equipmentId=eq-123&startDate=2025-02-01&endDate=2025-02-28',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.maintenanceBlocks).toBeDefined();
  });
});


