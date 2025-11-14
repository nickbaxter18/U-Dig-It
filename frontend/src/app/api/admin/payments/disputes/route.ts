import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/payments/disputes
 * Fetch payment disputes from Stripe
 *
 * Admin-only endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const stripe = createStripeClient(await getStripeSecretKey());

    const disputes = await stripe.disputes.list({
      limit: 100,
    });

    logger.info('Disputes fetched', {
      component: 'admin-disputes-api',
      action: 'fetch_success',
      metadata: {
        count: disputes.data.length,
      },
    });

    return NextResponse.json({
      disputes: disputes.data,
      hasMore: disputes.has_more,
    });
  } catch (error: any) {
    logger.error(
      'Disputes API error',
      {
        component: 'admin-disputes-api',
        action: 'error',
      },
      error,
    );
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}







