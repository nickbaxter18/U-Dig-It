import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFeatureFlags, isFeatureEnabled } from '../feature-flags';

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Feature Flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { enabled: true },
        error: null,
      }),
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: 'NEW_BOOKING_FLOW', enabled: true },
          error: null,
        }),
      });

      const enabled = await isFeatureEnabled('NEW_BOOKING_FLOW');
      expect(enabled).toBe(true);
    });

    it('should return false for disabled features', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: 'BETA_FEATURE', enabled: false },
          error: null,
        }),
      });

      const enabled = await isFeatureEnabled('BETA_FEATURE');
      expect(enabled).toBe(false);
    });

    it('should return false for unknown features', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      });

      const enabled = await isFeatureEnabled('UNKNOWN_FEATURE');
      expect(enabled).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Database error')),
      });

      const enabled = await isFeatureEnabled('SOME_FEATURE');
      expect(enabled).toBe(false);
    });
  });

  describe('getFeatureFlags', () => {
    it('should return all feature flags', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { name: 'FEATURE_A', enabled: true, description: 'Feature A' },
            { name: 'FEATURE_B', enabled: false, description: 'Feature B' },
          ],
          error: null,
        }),
      });

      const flags = await getFeatureFlags();
      expect(flags).toHaveLength(2);
      expect(flags[0].name).toBe('FEATURE_A');
    });

    it('should return empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error' },
        }),
      });

      const flags = await getFeatureFlags();
      expect(flags).toEqual([]);
    });
  });

  describe('Environment-based flags', () => {
    it('should enable dev-only features in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: 'DEBUG_PANEL', enabled: true, dev_only: true },
          error: null,
        }),
      });

      const enabled = await isFeatureEnabled('DEBUG_PANEL');
      expect(enabled).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should disable dev-only features in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: 'DEBUG_PANEL', enabled: true, dev_only: true },
          error: null,
        }),
      });

      const enabled = await isFeatureEnabled('DEBUG_PANEL');
      expect(enabled).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('User-specific flags', () => {
    it('should check user-specific overrides', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            name: 'BETA_ACCESS',
            enabled: false,
            user_overrides: ['user-123'],
          },
          error: null,
        }),
      });

      const enabled = await isFeatureEnabled('BETA_ACCESS', 'user-123');
      expect(enabled).toBe(true);
    });

    it('should respect global disable even with user override', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            name: 'DISABLED_FEATURE',
            enabled: false,
            force_disabled: true,
            user_overrides: ['user-123'],
          },
          error: null,
        }),
      });

      const enabled = await isFeatureEnabled('DISABLED_FEATURE', 'user-123');
      expect(enabled).toBe(false);
    });
  });

  describe('Percentage rollout', () => {
    it('should enable features based on rollout percentage', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            name: 'GRADUAL_ROLLOUT',
            enabled: true,
            rollout_percentage: 50,
          },
          error: null,
        }),
      });

      const enabled = await isFeatureEnabled('GRADUAL_ROLLOUT', 'user-123');
      expect(typeof enabled).toBe('boolean');
    });
  });
});
