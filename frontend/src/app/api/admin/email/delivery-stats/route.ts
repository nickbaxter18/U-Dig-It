import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

/**
 * GET /api/admin/email/delivery-stats
 * Get email delivery statistics
 */
export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const templateId = searchParams.get('templateId');
    const campaignId = searchParams.get('campaignId');

    // Call database function for stats
    const { data: stats, error: statsError } = await supabase.rpc('get_email_delivery_stats', {
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_template_id: templateId || null,
      p_campaign_id: campaignId || null,
    });

    if (statsError) {
      logger.error(
        'Failed to fetch email delivery stats',
        {
          component: 'admin-email-stats',
          action: 'stats_failed',
          metadata: { startDate, endDate, templateId, campaignId },
        },
        statsError
      );
      return NextResponse.json(
        { error: 'Unable to fetch email delivery statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stats:
        stats && stats.length > 0
          ? stats[0]
          : {
              total_sent: 0,
              total_delivered: 0,
              total_opened: 0,
              total_clicked: 0,
              total_bounced: 0,
              total_spam_reported: 0,
              total_unsubscribed: 0,
              delivery_rate: null,
              open_rate: null,
              click_rate: null,
              bounce_rate: null,
            },
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching email delivery stats',
      { component: 'admin-email-stats', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
