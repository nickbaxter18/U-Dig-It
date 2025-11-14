import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from '../maps/geocode/route';
import { createMockRequest, expectErrorResponse } from '@/test-utils';

describe('GET /api/maps/geocode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should require address parameter', async () => {
    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/maps/geocode',
    });

    const response = await GET(request);
    await expectErrorResponse(response, 400, /address/i);
  });

  it('should geocode valid address', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          geometry: { location: { lat: 45.27, lng: -66.06 } },
          formatted_address: '123 Main St, Saint John, NB',
        }],
      }),
    });

    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/maps/geocode?address=123+Main+St',
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.location).toBeDefined();
  });

  it('should handle geocoding errors', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Geocoding failed' }),
    });

    const request = createMockRequest('GET', undefined, {
      url: 'http://localhost:3000/api/maps/geocode?address=invalid',
    });

    const response = await GET(request);

    await expectErrorResponse(response, 500);
  });
});

