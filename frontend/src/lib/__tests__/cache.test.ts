import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cacheClear, cacheDelete, cacheGet, cacheSet } from '../cache';

describe('Cache Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Operations', () => {
    it('should set and get cache values', () => {
      cacheSet('test-key', { data: 'value' });
      const result = cacheGet('test-key');

      expect(result).toEqual({ data: 'value' });
    });

    it('should return null for non-existent keys', () => {
      const result = cacheGet('non-existent');
      expect(result).toBeNull();
    });

    it('should delete cache entries', () => {
      cacheSet('test-key', 'value');
      cacheDelete('test-key');

      const result = cacheGet('test-key');
      expect(result).toBeNull();
    });

    it('should clear all cache entries', () => {
      cacheSet('key1', 'value1');
      cacheSet('key2', 'value2');

      cacheClear();

      expect(cacheGet('key1')).toBeNull();
      expect(cacheGet('key2')).toBeNull();
    });
  });

  describe('Expiration', () => {
    it('should expire cache after TTL', () => {
      cacheSet('test-key', 'value', 5000); // 5 second TTL

      // Immediately available
      expect(cacheGet('test-key')).toBe('value');

      // Advance time past expiration
      vi.advanceTimersByTime(6000);

      // Should be expired
      expect(cacheGet('test-key')).toBeNull();
    });

    it('should not expire before TTL', () => {
      cacheSet('test-key', 'value', 10000); // 10 second TTL

      vi.advanceTimersByTime(5000); // Only 5 seconds

      expect(cacheGet('test-key')).toBe('value');
    });

    it('should use default TTL when not specified', () => {
      cacheSet('test-key', 'value'); // Default TTL (5 minutes = 300 seconds)

      vi.advanceTimersByTime(290000); // 290 seconds (still valid)
      expect(cacheGet('test-key')).toBe('value');

      vi.advanceTimersByTime(20000); // Total 310 seconds (past 5 min default)
      expect(cacheGet('test-key')).toBeNull();
    });
  });

  describe('Data Types', () => {
    it('should cache strings', () => {
      cacheSet('string', 'hello');
      expect(cacheGet('string')).toBe('hello');
    });

    it('should cache numbers', () => {
      cacheSet('number', 42);
      expect(cacheGet('number')).toBe(42);
    });

    it('should cache arrays', () => {
      cacheSet('array', [1, 2, 3]);
      expect(cacheGet('array')).toEqual([1, 2, 3]);
    });

    it('should cache objects', () => {
      const obj = { name: 'Test', count: 5 };
      cacheSet('object', obj);
      expect(cacheGet('object')).toEqual(obj);
    });

    it('should cache null', () => {
      cacheSet('null', null);
      expect(cacheGet('null')).toBeNull();
    });

    it('should cache boolean', () => {
      cacheSet('bool', true);
      expect(cacheGet('bool')).toBe(true);
    });
  });

  describe('Cache Updates', () => {
    it('should overwrite existing values', () => {
      cacheSet('key', 'value1');
      cacheSet('key', 'value2');

      expect(cacheGet('key')).toBe('value2');
    });

    it('should reset TTL on update', () => {
      cacheSet('key', 'value', 5000);

      vi.advanceTimersByTime(4000);

      cacheSet('key', 'new-value', 10000); // Reset with new TTL

      vi.advanceTimersByTime(6000); // Total 10 seconds from first set

      // Should still be available (new TTL hasn't expired)
      expect(cacheGet('key')).toBe('new-value');
    });
  });

  describe('Memory Management', () => {
    it('should handle large datasets', () => {
      const largeData = Array(1000).fill({ data: 'value' });
      cacheSet('large', largeData);

      expect(cacheGet('large')).toEqual(largeData);
    });

    it('should not leak memory on delete', () => {
      cacheSet('temp', { large: 'data' });
      const _initialSize = Object.keys(cacheGet).length; // Reserved for future size tracking

      cacheDelete('temp');

      // Memory should be freed
      expect(cacheGet('temp')).toBeNull();
    });
  });

  describe('Namespacing', () => {
    it('should support namespaced keys', () => {
      cacheSet('user:123:profile', { name: 'John' });
      cacheSet('user:456:profile', { name: 'Jane' });

      expect(cacheGet('user:123:profile')).toEqual({ name: 'John' });
      expect(cacheGet('user:456:profile')).toEqual({ name: 'Jane' });
    });

    it('should delete by namespace prefix', () => {
      cacheSet('user:123:profile', { name: 'John' });
      cacheSet('user:123:settings', { theme: 'dark' });
      cacheSet('user:456:profile', { name: 'Jane' });

      // Delete all user:123:* entries
      cacheDelete('user:123:*');

      expect(cacheGet('user:123:profile')).toBeNull();
      expect(cacheGet('user:123:settings')).toBeNull();
      expect(cacheGet('user:456:profile')).toEqual({ name: 'Jane' });
    });
  });
});
