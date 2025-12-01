/**
 * Server-Side Data Fetching for Admin Dashboard
 *
 * These functions fetch dashboard data server-side for use in Server Components.
 * They can be used to create Server Component wrappers that pass initial data
 * to Client Components for interactivity.
 */

import { createClient } from '@/lib/supabase/server';
import { cachedQuery, CACHE_PRESETS } from '@/lib/supabase/server-cache';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import type {
  DashboardOverviewResponse,
  DashboardSummary,
  DashboardChartsPayload,
  DateRangeKey,
} from '@/types/dashboard';

/**
 * Fetch dashboard overview data server-side
 *
 * This function replicates the logic from /api/admin/dashboard/overview
 * but can be called directly from Server Components.
 *
 * @param range - Date range key ('today', 'week', 'month', 'quarter', 'year')
 * @param startDate - Optional custom start date (YYYY-MM-DD)
 * @param endDate - Optional custom end date (YYYY-MM-DD)
 */
export async function fetchDashboardOverview(
  range: DateRangeKey = 'month',
  startDate?: string,
  endDate?: string
): Promise<DashboardOverviewResponse | null> {
  try {
    // Note: In a real Server Component, you'd get the request from headers/cookies
    // For now, this is a helper that can be called from Server Components
    // that have already verified admin access

    // This would need to be called from a Server Component that has already
    // verified the user is an admin using requireAdmin or similar

    // For now, return null - this is a placeholder for the conversion pattern
    // The actual implementation would call the same Supabase queries as the API route

    return null;
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return null;
  }
}

/**
 * Helper to resolve date ranges (same logic as API route)
 */
function resolveDateRanges(range: DateRangeKey) {
  const now = new Date();
  const currentStart = new Date(now);
  const currentEnd = new Date(now);
  let previousStart = new Date(now);
  let previousEnd = new Date(now);

  switch (range) {
    case 'today':
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setDate(previousStart.getDate() - 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    case 'week':
      currentStart.setDate(currentStart.getDate() - 6);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setDate(previousStart.getDate() - 13);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(previousEnd.getDate() - 7);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    case 'month':
      currentStart.setMonth(currentStart.getMonth() - 1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setMonth(previousStart.getMonth() - 2);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setMonth(previousEnd.getMonth() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    case 'quarter':
      currentStart.setMonth(currentStart.getMonth() - 3);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setMonth(previousStart.getMonth() - 6);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setMonth(previousEnd.getMonth() - 3);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    case 'year':
      currentStart.setFullYear(currentStart.getFullYear() - 1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setFullYear(previousStart.getFullYear() - 2);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setFullYear(previousEnd.getFullYear() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      break;
  }

  return { currentStart, currentEnd, previousStart, previousEnd };
}

/**
 * Convert Date to YYYY-MM-DD string (local timezone)
 */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}






