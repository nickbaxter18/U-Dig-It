import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

/**
 * GET /api/admin/payments/disputes
 * Fetch payment disputes from Stripe
 *
 * Admin-only endpoint
 */
export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    const stripe = createStripeClient(await getStripeSecretKey());

    // Get pagination parameters (Stripe uses limit/cursor)
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 100);
    const startingAfter = searchParams.get('startingAfter') || undefined;

    const disputes = await stripe.disputes.list({
      limit,
      starting_after: startingAfter,
    });

    logger.info('Disputes fetched', {
      component: 'admin-disputes-api',
      action: 'fetch_success',
      metadata: {
        count: disputes.data.length,
        hasMore: disputes.has_more,
      },
    });

    // Convert Stripe pagination to standard format
    const lastDispute = disputes.data[disputes.data.length - 1];
    const nextCursor = disputes.has_more && lastDispute ? lastDispute.id : null;

    return NextResponse.json({
      disputes: disputes.data,
      pagination: {
        page: 1, // Stripe uses cursor-based pagination
        pageSize: limit,
        total: disputes.data.length, // Stripe doesn't provide total count
        totalPages: disputes.has_more ? null : 1,
        hasMore: disputes.has_more,
        nextCursor,
      },
    });
  } catch (error: unknown) {
    logger.error(
      'Disputes API error',
      {
        component: 'admin-disputes-api',
        action: 'error',
      },
      error
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
});
