import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../maps/distance/route';
import { createMockRequest, expectErrorResponse } from '@/test-utils';

describe('POST /api/maps/distance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should require origin', async () => {
    const request = createMockRequest('POST', {
      destination: '123 Main St',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /origin/i);
  });

  it('should require destination', async () => {
    const request = createMockRequest('POST', {
      origin: '456 Other St',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /destination/i);
  });

  it('should calculate distance', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        rows: [{
          elements: [{
            distance: { value: 15500, text: '15.5 km' },
            duration: { value: 900, text: '15 mins' },
          }],
        }],
      }),
    });

    const request = createMockRequest('POST', {
      origin: '1 Main St, Saint John',
      destination: '100 Other St, Saint John',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.distance).toBeDefined();
    expect(data.distance).toBe(15.5);
  });

  it('should return duration', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        rows: [{
          elements: [{
            distance: { value: 15500 },
            duration: { value: 900, text: '15 mins' },
          }],
        }],
      }),
    });

    const request = createMockRequest('POST', {
      origin: 'Point A',
      destination: 'Point B',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.duration).toBeDefined();
  });

  it('should handle unreachable destinations', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        rows: [{
          elements: [{
            status: 'ZERO_RESULTS',
          }],
        }],
      }),
    });

    const request = createMockRequest('POST', {
      origin: 'Saint John, NB',
      destination: 'Invalid Location',
    });

    const response = await POST(request);
    await expectErrorResponse(response, 400, /not found|unreachable/i);
  });
});

