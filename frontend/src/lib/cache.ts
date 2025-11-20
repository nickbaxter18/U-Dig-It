// Simple in-memory cache for performance optimization
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const [_key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }
}

export const cache = new MemoryCache();

// Cache keys
export const CACHE_KEYS = {
  BOOKING_AVAILABILITY: 'booking:availability',
  USER_PROFILE: 'user:profile',
  ADMIN_STATS: 'admin:stats',
  EQUIPMENT_LIST: 'equipment:list',
  BOOKING_HISTORY: 'booking:history',
} as const;

// Cache utilities
export const withCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> => {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
};

// Clear cache for specific patterns
export const clearCachePattern = (pattern: string) => {
  for (const key of cache['cache'].keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Exported utility functions for testing and convenience
export const cacheGet = <T>(key: string): T | null => cache.get<T>(key);
export const cacheSet = <T>(key: string, data: T, ttl?: number): void => cache.set(key, data, ttl);
export const cacheDelete = (key: string): void => {
  // Support wildcard deletion for namespaces
  if (key.includes('*')) {
    clearCachePattern(key.replace('*', ''));
  } else {
    cache.delete(key);
  }
};
export const cacheClear = (): void => cache.clear();
