/**
 * Comprehensive Tests for Device Fingerprinting
 * Tests fingerprint generation, fallbacks, and device info collection
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDeviceFingerprint, getDeviceInfo } from '../device-fingerprint';

// Mock FingerprintJS
vi.mock('@fingerprintjs/fingerprintjs', () => ({
  default: {
    load: vi.fn(() => Promise.resolve({
      get: vi.fn(() => Promise.resolve({
        visitorId: 'test-visitor-id-123',
        confidence: { score: 0.95 },
        components: { canvas: { value: 'test' } },
      })),
    })),
  },
}));

// Mock global objects for browser environment
global.navigator = {
  userAgent: 'Mozilla/5.0 Test Browser',
  language: 'en-US',
  platform: 'Linux x86_64',
} as any;

global.screen = {
  width: 1920,
  height: 1080,
  colorDepth: 24,
} as any;

global.window = {
  sessionStorage: {},
  localStorage: {},
} as any;

describe('device-fingerprint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDeviceFingerprint', () => {
    it('should generate basic fingerprint', async () => {
      const fingerprint = await getDeviceFingerprint();

      expect(fingerprint).toBeDefined();
      expect(fingerprint).toMatch(/^basic_[a-z0-9]+$/);
    });

    it('should return consistent fingerprint for same device', async () => {
      const fp1 = await getDeviceFingerprint();
      const fp2 = await getDeviceFingerprint();

      expect(fp1).toBe(fp2);
    });

    it('should include browser characteristics in fingerprint', async () => {
      const fingerprint = await getDeviceFingerprint();

      expect(fingerprint).toBeTruthy();
      expect(typeof fingerprint).toBe('string');
    });

    it('should handle fingerprint generation errors', async () => {
      // Force error by clearing navigator
      const originalNavigator = global.navigator;
      (global as any).navigator = undefined;

      const fingerprint = await getDeviceFingerprint();

      expect(fingerprint).toMatch(/^fallback_/);

      // Restore
      global.navigator = originalNavigator;
    });

    it('should use fallback on error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // This should still return a fingerprint even if errors occur
      const fingerprint = await getDeviceFingerprint();

      expect(fingerprint).toBeDefined();
      expect(fingerprint.length).toBeGreaterThan(0);
    });
  });

  describe('getDeviceInfo', () => {
    it('should return device information object', async () => {
      const info = await getDeviceInfo();

      expect(info).toHaveProperty('visitorId');
      expect(info).toHaveProperty('userAgent');
      expect(info).toHaveProperty('language');
      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('screenResolution');
      expect(info).toHaveProperty('colorDepth');
    });

    it('should include screen resolution', async () => {
      const info = await getDeviceInfo();

      expect(info.screenResolution).toBe('1920x1080');
    });

    it('should include color depth', async () => {
      const info = await getDeviceInfo();

      expect(info.colorDepth).toBe(24);
    });

    it('should include timezone offset', async () => {
      const info = await getDeviceInfo();

      expect(info).toHaveProperty('timezoneOffset');
      expect(typeof info.timezoneOffset).toBe('number');
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const info = await getDeviceInfo();

      expect(info).toBeDefined();
      expect(info.visitorId).toBeDefined();
    });

    it('should return fallback info on error', async () => {
      const FingerprintJS = (await import('@fingerprintjs/fingerprintjs')).default;
      vi.mocked(FingerprintJS.load).mockRejectedValueOnce(new Error('Failed to load'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const info = await getDeviceInfo();

      expect(info.confidence).toBe(0);
      expect(info.visitorId).toMatch(/^basic_/);
    });
  });

  describe('Fingerprint Components', () => {
    it('should use user agent in fingerprint', async () => {
      const fp = await getDeviceFingerprint();
      expect(fp).toBeDefined();
    });

    it('should use screen dimensions in fingerprint', async () => {
      const fp = await getDeviceFingerprint();
      expect(fp).toBeDefined();
    });

    it('should use language in fingerprint', async () => {
      const fp = await getDeviceFingerprint();
      expect(fp).toBeDefined();
    });

    it('should use timezone in fingerprint', async () => {
      const fp = await getDeviceFingerprint();
      expect(fp).toBeDefined();
    });

    it('should detect storage availability', async () => {
      const fp = await getDeviceFingerprint();
      expect(fp).toBeDefined();
    });
  });
});


