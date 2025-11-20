import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { sendAdminEmail } from '@/lib/sendgrid';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const MAX_RECIPIENTS = Number(process.env.COMMUNICATIONS_MAX_RECIPIENTS ?? '500');

type RecipientFilter =
  | undefined
  | {
      segment?: 'all' | 'active' | 'inactive';
      tags?: string[];
    };

interface Recipient {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

async function getBookingCustomerIds(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>['supabase']>
) {
  const { data, error } = await supabase
    .from('bookings')
    .select('customerId')
    .not('customerId', 'is', null);

  if (error) throw error;

  const ids = new Set<string>();
  (data ?? []).forEach((row) => {
    if (row.customerId) {
      ids.add(row.customerId);
    }
  });
  return Array.from(ids);
}

function buildNotInList(ids: string[]) {
  return `(${ids.map((id) => `"${id}"`).join(',')})`;
}

async function buildRecipientCountQuery(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>['supabase']>,
  filter: RecipientFilter
) {
  let query = supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'customer');

  if (filter?.segment === 'active' || filter?.segment === 'inactive') {
    const customerIds = await getBookingCustomerIds(supabase);
    if (filter.segment === 'active') {
      if (customerIds.length === 0) {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      } else {
        query = query.in('id', customerIds);
      }
    } else if (filter.segment === 'inactive') {
      if (customerIds.length > 0) {
        query = query.not('id', 'in', buildNotInList(customerIds));
      }
    }
  }

  return query;
}

async function fetchRecipients(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>['supabase']>,
  filter: RecipientFilter
) {
  let query = supabase
    .from('users')
    .select('id, email, firstName, lastName', { count: 'exact' })
    .eq('role', 'customer')
    .order('createdAt', { ascending: false })
    .limit(MAX_RECIPIENTS + 1);

  if (filter?.segment === 'active' || filter?.segment === 'inactive') {
    const customerIds = await getBookingCustomerIds(supabase);
    if (filter.segment === 'active') {
      if (customerIds.length === 0) {
        return { recipients: [], count: 0 };
      }
      query = query.in('id', customerIds);
    } else if (filter.segment === 'inactive') {
      if (customerIds.length > 0) {
        query = query.not('id', 'in', buildNotInList(customerIds));
      }
    }
  }

  const { data, count, error } = await query;
  if (error) throw error;

  if ((count ?? data?.length ?? 0) > MAX_RECIPIENTS) {
    throw new Error(
      `Recipient count (${count}) exceeds the maximum of ${MAX_RECIPIENTS}. Please refine your filter.`
    );
  }

  return {
    recipients: (data ?? []) as Recipient[],
    count: count ?? data?.length ?? 0,
  };
}

function applyTemplateVariables(content: string, recipient: Recipient, campaignName: string) {
  const name = `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim() || recipient.email;
  return content
    .replace(/\{\{customerName\}\}/gi, name)
    .replace(/\{\{customerEmail\}\}/gi, recipient.email)
    .replace(/\{\{campaignName\}\}/gi, campaignName);
}

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

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
    const transformedCampaigns = (campaigns || []).map((campaign: unknown) => ({
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
    }));

    // ✅ Calculate stats
    const stats = {
      totalCampaigns: transformedCampaigns.length,
      activeCampaigns: transformedCampaigns.filter((c) =>
        ['scheduled', 'sending', 'sent'].includes(c.status)
      ).length,
      totalEmailsSent: transformedCampaigns.reduce(
        (sum: unknown, c: unknown) => sum + c.emailsSent,
        0
      ),
      averageOpenRate:
        transformedCampaigns.length > 0
          ? transformedCampaigns.reduce((sum: unknown, c: unknown) => {
              const rate = c.emailsSent > 0 ? (c.emailsOpened / c.emailsSent) * 100 : 0;
              return sum + rate;
            }, 0) / transformedCampaigns.length
          : 0,
      averageClickRate:
        transformedCampaigns.length > 0
          ? transformedCampaigns.reduce((sum: unknown, c: unknown) => {
              const rate = c.emailsSent > 0 ? (c.emailsClicked / c.emailsSent) * 100 : 0;
              return sum + rate;
            }, 0) / transformedCampaigns.length
          : 0,
      totalRecipients: transformedCampaigns.reduce(
        (sum: unknown, c: unknown) => sum + c.recipientCount,
        0
      ),
    };

    logger.info('Campaigns fetched successfully', {
      component: 'communications-api',
      action: 'fetch_campaigns',
      metadata: { count: transformedCampaigns.length, dateRange },
    });

    return NextResponse.json({
      campaigns: transformedCampaigns,
      stats,
    });
  } catch (error: unknown) {
    logger.error(
      'Failed to fetch campaigns',
      {
        component: 'communications-api',
        action: 'fetch_campaigns_error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    const supabase = adminResult.supabase;

    if (!supabase) {
      logger.error('Supabase client unavailable for campaign creation', {
        component: 'communications-api',
        action: 'missing_client',
      });
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      name,
      subject,
      templateId,
      htmlContent,
      textContent,
      recipientFilter,
      scheduledAt,
      sendImmediately = false,
    } = body;

    // Validate required fields
    if (!name || !subject) {
      return NextResponse.json({ error: 'Name and subject are required' }, { status: 400 });
    }

    const countQuery = await buildRecipientCountQuery(supabase, recipientFilter);
    const { count: countedRecipients, error: countError } = await countQuery;
    if (countError) {
      throw countError;
    }
    let recipientCount = countedRecipients ?? 0;

    // Determine status
    let status = 'draft';
    let scheduled_at: string | null = null;
    let sent_at: string | null = null;

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
          html_content: finalHtmlContent,
          text_content: finalTextContent,
          status,
          scheduled_at,
          sent_at,
          recipient_filter: recipientFilter,
          send_immediately: sendImmediately,
          recipient_count: recipientCount,
          created_by: user?.id || 'unknown',
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }

    let deliverySummary: { sent: number; failed: number; failures: string[] } | undefined;
    let responseStatus = newCampaign.status;

    if (sendImmediately) {
      let recipientsResult;
      try {
        recipientsResult = await fetchRecipients(supabase, recipientFilter);
      } catch (recipientError: unknown) {
        logger.warn('Failed to resolve recipients', {
          component: 'communications-api',
          action: 'recipient_resolution_failed',
          metadata: { campaignId: newCampaign.id },
        });
        return NextResponse.json(
          { error: recipientError?.message || 'Unable to build recipient list' },
          { status: 400 }
        );
      }

      const { recipients, count } = recipientsResult;
      recipientCount = count;

      if (recipients.length === 0) {
        return NextResponse.json(
          { error: 'No recipients match the selected filter.' },
          { status: 400 }
        );
      }

      const emailFrom = process.env.EMAIL_FROM || 'notifications@udigit.ca';
      const emailFromName = process.env.EMAIL_FROM_NAME || 'Kubota Rentals';

      let sentCount = 0;
      const failures: string[] = [];

      for (const recipient of recipients) {
        const recipientName =
          `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim() || recipient.email;

        const personalizedHtml = finalHtmlContent
          ? applyTemplateVariables(finalHtmlContent, recipient, name)
          : undefined;
        const personalizedText = finalTextContent
          ? applyTemplateVariables(finalTextContent, recipient, name)
          : undefined;

        const { data: emailLog } = await supabase
          .from('email_logs')
          .insert({
            recipient_email: recipient.email,
            recipient_name: recipientName,
            subject,
            status: 'queued',
            sent_at: new Date().toISOString(),
            metadata: {
              campaignId: newCampaign.id,
              recipientId: recipient.id,
            },
          })
          .select()
          .single();

        try {
          await sendAdminEmail({
            to: recipient.email,
            from: {
              email: emailFrom,
              name: emailFromName,
            },
            subject,
            text: personalizedText ?? personalizedHtml ?? '',
            html: personalizedHtml,
          });

          sentCount += 1;

          if (emailLog?.id) {
            await supabase
              .from('email_logs')
              .update({
                status: 'delivered',
                delivered_at: new Date().toISOString(),
              })
              .eq('id', emailLog.id);
          }
        } catch (sendError: unknown) {
          const message = sendError?.message || `Failed to send to ${recipient.email}`;
          failures.push(`${recipient.email}: ${message}`);

          if (emailLog?.id) {
            await supabase
              .from('email_logs')
              .update({
                status: 'failed',
                failed_at: new Date().toISOString(),
                error_message: message,
              })
              .eq('id', emailLog.id);
          }
        }
      }

      const finalStatus =
        sentCount === 0 && failures.length > 0
          ? 'failed'
          : failures.length > 0
            ? 'partial'
            : 'sent';
      responseStatus = finalStatus;

      await supabase
        .from('email_campaigns')
        .update({
          status: finalStatus,
          sent_at: new Date().toISOString(),
        })
        .eq('id', newCampaign.id);

      deliverySummary = {
        sent: sentCount,
        failed: failures.length,
        failures: failures.slice(0, 10),
      };

      logger.info('Campaign sent immediately', {
        component: 'communications-api',
        action: 'campaign_sent',
        metadata: {
          campaignId: newCampaign.id,
          sent: sentCount,
          failed: failures.length,
        },
      });
    } else {
      logger.info('Campaign created for scheduling', {
        component: 'communications-api',
        action: 'create_campaign_scheduled',
        metadata: { campaignId: newCampaign.id, recipientCount, scheduledAt: scheduled_at },
      });
    }

    logger.info('Campaign created successfully', {
      component: 'communications-api',
      action: 'create_campaign',
      metadata: { campaignId: newCampaign.id, name, status },
    });

    return NextResponse.json(
      {
        campaign: {
          id: newCampaign.id,
          name: newCampaign.name,
          subject: newCampaign.subject,
          status: responseStatus,
          recipientCount,
          scheduledAt: newCampaign.scheduled_at,
          createdAt: newCampaign.created_at,
        },
        delivery: deliverySummary,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error(
      'Failed to create campaign',
      {
        component: 'communications-api',
        action: 'create_campaign_error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
