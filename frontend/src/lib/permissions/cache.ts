/**
 * Enterprise Permission System - Permission Cache
 * Advanced caching layer for permissions
 */
import type { PermissionString } from './types';

interface CacheEntry {
  permissions: PermissionString[];
  roles: string[];
  timestamp: number;
}

// In-memory cache with TTL
class PermissionCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(userId: string): CacheEntry | null {
    const entry = this.cache.get(userId);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(userId);
      return null;
    }

    return entry;
  }

  set(userId: string, permissions: PermissionString[], roles: string[]): void {
    this.cache.set(userId, {
      permissions,
      roles,
      timestamp: Date.now(),
    });
  }

  delete(userId: string): void {
    this.cache.delete(userId);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(userId);
      }
    }
  }

  // Get cache stats
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Singleton cache instance
export const permissionCache = new PermissionCache();

// Cleanup expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    permissionCache.cleanup();
  }, 60 * 1000);
}
