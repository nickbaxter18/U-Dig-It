import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from '../maps/autocomplete/route';
import { createMockRequest, expectErrorResponse } from '@/test-utils';

describe('GET /api/maps/autocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should require input parameter', async () => {
    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/maps/autocomplete',
    });

    const response = await GET(request);
    await expectErrorResponse(response, 400, /input/i);
  });

  it('should return autocomplete suggestions', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        predictions: [
          { description: '123 Main St, Saint John, NB', place_id: 'place1' },
          { description: '456 King St, Saint John, NB', place_id: 'place2' },
        ],
      }),
    });

    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/maps/autocomplete?input=Main+St',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.predictions).toHaveLength(2);
  });

  it('should bias results to New Brunswick', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ predictions: [] }),
    });

    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/maps/autocomplete?input=Main',
    });

    await GET(request);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('components=country:CA'),
      expect.any(Object)
    );
  });

  it('should handle no results', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ predictions: [] }),
    });

    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/maps/autocomplete?input=xyz123',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.predictions).toHaveLength(0);
  });
});

