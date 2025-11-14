import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    // Get date range parameter
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '30d';

    // Calculate date filter
    let dateFilter = new Date();
    switch (dateRange) {
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      case 'all':
        dateFilter = new Date('2020-01-01'); // Far past date
        break;
    }

    // ✅ Fetch campaigns from Supabase
    const { data: campaigns, error: campaignsError } = await supabase
      .from('email_campaigns')
      .select('*')
      .gte('created_at', dateFilter.toISOString())
      .order('created_at', { ascending: false });

    if (campaignsError) {
      throw new Error(`Database error: ${campaignsError.message}`);
    }

    // ✅ Transform data to match frontend interface
    const transformedCampaigns = (campaigns || []).map((campaign: any) => ({
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
      createdAt: campaign.created_at
    }));

    // ✅ Calculate stats
    const stats = {
      totalCampaigns: transformedCampaigns.length,
      activeCampaigns: transformedCampaigns.filter(c =>
        ['scheduled', 'sending', 'sent'].includes(c.status)
      ).length,
      totalEmailsSent: transformedCampaigns.reduce((sum: any, c: any) => sum + c.emailsSent, 0),
      averageOpenRate: transformedCampaigns.length > 0
        ? transformedCampaigns.reduce((sum: any, c: any) => {
            const rate = c.emailsSent > 0 ? (c.emailsOpened / c.emailsSent) * 100 : 0;
            return sum + rate;
          }, 0) / transformedCampaigns.length
        : 0,
      averageClickRate: transformedCampaigns.length > 0
        ? transformedCampaigns.reduce((sum: any, c: any) => {
            const rate = c.emailsSent > 0 ? (c.emailsClicked / c.emailsSent) * 100 : 0;
            return sum + rate;
          }, 0) / transformedCampaigns.length
        : 0,
      totalRecipients: transformedCampaigns.reduce((sum: any, c: any) => sum + c.recipientCount, 0)
    };

    logger.info('Campaigns fetched successfully', {
      component: 'communications-api',
      action: 'fetch_campaigns',
      metadata: { count: transformedCampaigns.length, dateRange }
    });

    return NextResponse.json({
      campaigns: transformedCampaigns,
      stats
    });
  } catch (error: any) {
    logger.error('Failed to fetch campaigns', {
      component: 'communications-api',
      action: 'fetch_campaigns_error',
      metadata: { error: error.message }
    }, error);

    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const body = await request.json();
    const {
      name,
      subject,
      templateId,
      htmlContent,
      textContent,
      recipientFilter,
      scheduledAt,
      sendImmediately = false
    } = body;

    // Validate required fields
    if (!name || !subject) {
      return NextResponse.json(
        { error: 'Name and subject are required' },
        { status: 400 }
      );
    }

    // Get recipient count based on filter
    let recipientCount = 0;
    if (recipientFilter) {
      // Build query based on filter
      let query = supabase.from('users').select('id', { count: 'exact', head: true });

      if (recipientFilter.segment === 'all') {
        // All customers
        query = query.eq('role', 'customer');
      } else if (recipientFilter.segment === 'active') {
        // Active customers (have bookings)
        const { data: bookingCustomers } = await supabase
          .from('bookings')
          .select('customerId')
          .limit(10000);

        const customerIds = bookingCustomers?.map(b => b.customerId) || [];
        query = query
          .eq('role', 'customer')
          .in('id', customerIds);
      } else if (recipientFilter.segment === 'inactive') {
        // Inactive customers (no bookings)
        const { data: bookingCustomers } = await supabase
          .from('bookings')
          .select('customerId')
          .limit(10000);

        const customerIds = bookingCustomers?.map(b => b.customerId) || [];
        query = query
          .eq('role', 'customer')
          .not('id', 'in', customerIds);
      }

      const { count } = await query;
      recipientCount = count || 0;
    }

    // Determine status
    let status = 'draft';
    let scheduled_at = null;
    let sent_at = null;

    if (sendImmediately) {
      status = 'sending';
      sent_at = new Date().toISOString();
    } else if (scheduledAt) {
      status = 'scheduled';
      scheduled_at = new Date(scheduledAt).toISOString();
    }

    // Get template content if templateId provided
    let finalHtmlContent = htmlContent;
    let finalTextContent = textContent;

    if (templateId && !htmlContent) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('html_content, text_content')
        .eq('id', templateId)
        .single();

      if (template) {
        finalHtmlContent = template.html_content;
        finalTextContent = template.text_content;
      }
    }

    // Create campaign
    const { data: newCampaign, error: insertError } = await supabase
      .from('email_campaigns')
      .insert([
        {
          name,
          subject,
          template_id: templateId,
          html_content: htmlContent,
          text_content: textContent,
          status,
          scheduled_at: scheduledAt,
          recipient_filter: recipientFilter,
          send_immediately: sendImmediately,
          recipient_count: recipientCount,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }

    // If sending immediately, trigger email sending (async)
    if (sendImmediately && recipientCount > 0) {
      // This would trigger a background job to send emails
      // For now, we'll just log it
      logger.info('Campaign created for immediate sending', {
        component: 'communications-api',
        action: 'create_campaign_immediate',
        metadata: { campaignId: newCampaign.id, recipientCount }
      });
    }

    logger.info('Campaign created successfully', {
      component: 'communications-api',
      action: 'create_campaign',
      metadata: { campaignId: newCampaign.id, name, status }
    });

    return NextResponse.json({
      campaign: {
        id: newCampaign.id,
        name: newCampaign.name,
        subject: newCampaign.subject,
        status: newCampaign.status,
        recipientCount: newCampaign.recipient_count,
        scheduledAt: newCampaign.scheduled_at,
        createdAt: newCampaign.created_at
      }
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Failed to create campaign', {
      component: 'communications-api',
      action: 'create_campaign_error',
      metadata: { error: error.message }
    }, error);

    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
