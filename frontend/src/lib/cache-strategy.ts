// Intelligent caching strategies for optimal performance
export interface CacheConfig {
  maxAge: number;
  staleWhileRevalidate?: number;
  cacheKey: string;
  tags?: string[];
}

export class CacheStrategy {
  private static instance: CacheStrategy;
  private cache = new Map<string, { data: unknown; timestamp: number; config: CacheConfig }>();
  private maxCacheSize = 100;
  private cleanupInterval = 300000; // 5 minutes

  private constructor() {
    this.startCleanupInterval();
  }

  public static getInstance(): CacheStrategy {
    if (!CacheStrategy.instance) {
      CacheStrategy.instance = new CacheStrategy();
    }
    return CacheStrategy.instance;
  }

  public set<T>(key: string, data: T, config: CacheConfig): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value || '';
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      config,
    });
  }

  public get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if cache is still valid
    if (age > cached.config.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  public getOrSet<T>(key: string, fetcher: () => Promise<T>, config: CacheConfig): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) {
      return Promise.resolve(cached);
    }

    return fetcher().then(data => {
      this.set(key, data, config);
      return data;
    });
  }

  public invalidateByTag(tag: string): void {
    for (const [key, value] of this.cache.entries()) {
      if (value.config.tags?.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  public invalidate(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; tags?: string[] }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: now - value.timestamp,
      tags: value.config.tags,
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses
      entries,
    };
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      const age = now - value.timestamp;
      if (age > value.config.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// Cache configurations for different types of data
export const CACHE_CONFIGS = {
  // Static content that rarely changes
  STATIC: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    staleWhileRevalidate: 7 * 24 * 60 * 60 * 1000, // 7 days
    cacheKey: 'static',
    tags: ['static'],
  },

  // User-specific data
  USER: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: 30 * 60 * 1000, // 30 minutes
    cacheKey: 'user',
    tags: ['user'],
  },

  // Equipment data
  EQUIPMENT: {
    maxAge: 60 * 60 * 1000, // 1 hour
    staleWhileRevalidate: 6 * 60 * 60 * 1000, // 6 hours
    cacheKey: 'equipment',
    tags: ['equipment'],
  },

  // Booking data
  BOOKING: {
    maxAge: 2 * 60 * 1000, // 2 minutes
    staleWhileRevalidate: 10 * 60 * 1000, // 10 minutes
    cacheKey: 'booking',
    tags: ['booking'],
  },

  // API responses
  API: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: 30 * 60 * 1000, // 30 minutes
    cacheKey: 'api',
    tags: ['api'],
  },
};

// Export singleton instance
export const cacheStrategy = CacheStrategy.getInstance();

// Utility functions for common caching patterns
export const cacheStaticData = <T>(key: string, fetcher: () => Promise<T>) => {
  return cacheStrategy.getOrSet(key, fetcher, CACHE_CONFIGS.STATIC);
};

export const cacheUserData = <T>(key: string, fetcher: () => Promise<T>) => {
  return cacheStrategy.getOrSet(key, fetcher, CACHE_CONFIGS.USER);
};

export const cacheEquipmentData = <T>(key: string, fetcher: () => Promise<T>) => {
  return cacheStrategy.getOrSet(key, fetcher, CACHE_CONFIGS.EQUIPMENT);
};

export const cacheBookingData = <T>(key: string, fetcher: () => Promise<T>) => {
  return cacheStrategy.getOrSet(key, fetcher, CACHE_CONFIGS.BOOKING);
};

export const cacheApiData = <T>(key: string, fetcher: () => Promise<T>) => {
  return cacheStrategy.getOrSet(key, fetcher, CACHE_CONFIGS.API);
};
