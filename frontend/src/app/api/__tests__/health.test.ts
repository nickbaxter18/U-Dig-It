import { describe, expect, it } from 'vitest';
import { GET } from '../health/route';

describe('GET /api/health', () => {
  it('should return 200 OK', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('should return health status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('ok');
  });

  it('should include timestamp', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
  });

  it('should include service information', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.service).toBe('kubota-rental-platform');
  });
});

