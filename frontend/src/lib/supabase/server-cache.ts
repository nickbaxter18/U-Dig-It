/**
 * Next.js Server-Side Caching Utilities for Supabase Queries
 *
 * This module provides caching wrappers for Supabase queries using Next.js's
 * built-in caching mechanisms (unstable_cache, revalidatePath, revalidateTag).
 *
 * Benefits:
 * - Automatic request deduplication
 * - Integration with Next.js cache revalidation
 * - Reduced database load
 * - Better performance for Server Components
 */

import { unstable_cache } from 'next/cache';
import { revalidatePath, revalidateTag } from 'next/cache';

import { createClient } from './server';

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /**
   * Time in seconds to revalidate the cache
   * Default: 60 (1 minute)
   */
  revalidate?: number;

  /**
   * Cache tags for selective revalidation
   * Example: ['bookings', 'equipment']
   */
  tags?: string[];

  /**
   * Cache key prefix
   * Used to namespace cache entries
   */
  keyPrefix?: string;
}

/**
 * Default cache options
 */
const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
  revalidate: 60,
  tags: [],
  keyPrefix: 'supabase',
};

/**
 * Cached Supabase query wrapper
 *
 * Wraps a Supabase query function with Next.js caching.
 * The query function receives a Supabase client instance.
 *
 * @example
 * ```typescript
 * const bookings = await cachedQuery(
 *   async (supabase) => {
 *     const { data, error } = await supabase
 *       .from('bookings')
 *       .select('id, bookingNumber, status')
 *       .eq('status', 'confirmed');
 *     if (error) throw error;
 *     return data;
 *   },
 *   ['bookings'],
 *   { revalidate: 120, tags: ['bookings'] }
 * );
 * ```
 */
export async function cachedQuery<T>(
  queryFn: (supabase: Awaited<ReturnType<typeof createClient>>) => Promise<T>,
  cacheKey: string | string[],
  options: CacheOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_CACHE_OPTIONS, ...options };
  const key = Array.isArray(cacheKey) ? cacheKey.join('-') : cacheKey;
  const fullKey = opts.keyPrefix ? `${opts.keyPrefix}-${key}` : key;

  return unstable_cache(
    async () => {
      const supabase = await createClient();
      return queryFn(supabase);
    },
    [fullKey],
    {
      revalidate: opts.revalidate,
      tags: opts.tags,
    }
  )();
}

/**
 * Cache configuration presets for common use cases
 */
export const CACHE_PRESETS = {
  /**
   * Static content that rarely changes (24 hours)
   */
  STATIC: {
    revalidate: 86400, // 24 hours
    tags: ['static'],
  } as CacheOptions,

  /**
   * User-specific data (5 minutes)
   */
  USER: {
    revalidate: 300, // 5 minutes
    tags: ['user'],
  } as CacheOptions,

  /**
   * Equipment data (1 hour)
   */
  EQUIPMENT: {
    revalidate: 3600, // 1 hour
    tags: ['equipment'],
  } as CacheOptions,

  /**
   * Booking data (2 minutes)
   */
  BOOKING: {
    revalidate: 120, // 2 minutes
    tags: ['bookings'],
  } as CacheOptions,

  /**
   * Real-time data (30 seconds)
   */
  REALTIME: {
    revalidate: 30, // 30 seconds
    tags: ['realtime'],
  } as CacheOptions,

  /**
   * Analytics data (1 minute)
   */
  ANALYTICS: {
    revalidate: 60, // 1 minute
    tags: ['analytics'],
  } as CacheOptions,

  /**
   * No caching (always fresh)
   */
  NO_CACHE: {
    revalidate: 0,
    tags: [],
  } as CacheOptions,
} as const;

/**
 * Revalidate cache by tag
 *
 * @example
 * ```typescript
 * // After creating a booking, revalidate all booking-related caches
 * await revalidateCacheByTag('bookings');
 * ```
 */
export async function revalidateCacheByTag(tag: string): Promise<void> {
  revalidateTag(tag);
}

/**
 * Revalidate cache by path
 *
 * @example
 * ```typescript
 * // After updating a booking, revalidate the booking page
 * await revalidateCacheByPath('/dashboard/bookings/123');
 * ```
 */
export async function revalidateCacheByPath(path: string): Promise<void> {
  revalidatePath(path);
}

/**
 * Revalidate multiple cache tags
 */
export async function revalidateCacheByTags(tags: string[]): Promise<void> {
  for (const tag of tags) {
    revalidateTag(tag);
  }
}

/**
 * Helper to create a cached query with preset configuration
 */
export function createCachedQuery<T>(
  preset: keyof typeof CACHE_PRESETS = 'BOOKING'
) {
  return (
    queryFn: (supabase: Awaited<ReturnType<typeof createClient>>) => Promise<T>,
    cacheKey: string | string[],
    overrides?: Partial<CacheOptions>
  ) => {
    const presetOptions = CACHE_PRESETS[preset];
    return cachedQuery(queryFn, cacheKey, { ...presetOptions, ...overrides });
  };
}






