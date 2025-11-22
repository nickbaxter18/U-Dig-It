import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

/**
 * GET /api/admin/email/delivery-logs
 * Get email delivery logs with filtering
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
    const toEmail = searchParams.get('toEmail');
    const status = searchParams.get('status');
    const templateId = searchParams.get('templateId');
    const campaignId = searchParams.get('campaignId');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    let query = supabase
      .from('email_delivery_logs')
      .select(
        'id, email_id, to_email, from_email, subject, template_id, campaign_id, status, sent_at, delivered_at, opened_at, clicked_at, bounced_at, bounce_reason, bounce_type, spam_reported_at, unsubscribed_at, metadata, created_at, updated_at',
        { count: 'exact' }
      )
      .order('sent_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (toEmail) {
      query = query.eq('to_email', toEmail);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      logger.error(
        'Failed to fetch email delivery logs',
        {
          component: 'admin-email-logs',
          action: 'fetch_failed',
          metadata: { toEmail, status, templateId, campaignId },
        },
        fetchError
      );
      return NextResponse.json({ error: 'Unable to fetch email delivery logs' }, { status: 500 });
    }

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching email delivery logs',
      { component: 'admin-email-logs', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
