import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { id } = params;

    // ✅ Fetch campaign from Supabase
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError) {
      if (campaignError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      throw new Error(`Database error: ${campaignError.message}`);
    }

    // ✅ Transform data to match frontend interface
    const transformedCampaign = {
      id: campaign.id,
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status,
      recipientCount: campaign.recipient_count || 0,
      emailsSent: campaign.emails_sent || 0,
      emailsDelivered: campaign.emails_delivered || 0,
      emailsOpened: campaign.emails_opened || 0,
      emailsClicked: campaign.emails_clicked || 0,
      emailsFailed: campaign.emails_failed || 0,
      scheduledAt: campaign.scheduled_at,
      sentAt: campaign.sent_at,
      createdAt: campaign.created_at,
      htmlContent: campaign.html_content,
      textContent: campaign.text_content,
      recipientFilter: campaign.recipient_filter,
    };

    logger.info('Campaign detail fetched successfully', {
      component: 'communications-api',
      action: 'fetch_campaign_detail',
      metadata: { campaignId: id },
    });

    return NextResponse.json({
      campaign: transformedCampaign,
    });
  } catch (error: unknown) {
    logger.error(
      'Failed to fetch campaign detail',
      {
        component: 'communications-api',
        action: 'fetch_campaign_detail_error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json({ error: 'Failed to fetch campaign detail' }, { status: 500 });
  }
}
