import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

// Verify SendGrid webhook signature (reserved for future signature verification)
const _SENDGRID_WEBHOOK_SECRET = process.env.SENDGRID_WEBHOOK_SECRET || '';

/**
 * POST /api/webhooks/sendgrid
 * Handle SendGrid webhook events for email delivery tracking
 * Configure webhook in SendGrid: Settings > Mail Settings > Event Webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events = Array.isArray(body) ? body : [body];

    const supabaseAdmin = createServiceClient();
    if (!supabaseAdmin) {
      logger.error('Service client unavailable for SendGrid webhook', {
        component: 'sendgrid-webhook',
        action: 'missing_client',
      });
      return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
    }

    let processedCount = 0;

    for (const event of events) {
      try {
        const {
          email,
          event: eventType,
          sg_message_id,
          timestamp,
          reason,
          status,
          type: bounceType,
          url,
          ...otherData
        } = event;

        // Extract message ID (format: <message_id@domain>)
        const messageId = sg_message_id ? sg_message_id.split('@')[0].replace('<', '') : null;

        if (!email) {
          logger.warn('SendGrid webhook event missing email', {
            component: 'sendgrid-webhook',
            action: 'missing_email',
            metadata: { eventType, sg_message_id },
          });
          continue;
        }

        // Find existing log entry by email_id or create new one
        let logEntry: any = null;
        if (messageId) {
          const { data: existing } = await supabaseAdmin
            .from('email_delivery_logs')
            .select('*')
            .eq('email_id', messageId)
            .maybeSingle();

          logEntry = existing;
        }

        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
          metadata: {
            ...(logEntry?.metadata || {}),
            [eventType]: {
              timestamp,
              ...otherData,
            },
          },
        };

        // Update status and timestamps based on event type
        switch (eventType) {
          case 'processed':
            updateData.status = 'sent';
            updateData.sent_at = timestamp
              ? new Date(timestamp * 1000).toISOString()
              : new Date().toISOString();
            break;

          case 'delivered':
            updateData.status = 'delivered';
            updateData.delivered_at = timestamp
              ? new Date(timestamp * 1000).toISOString()
              : new Date().toISOString();
            break;

          case 'open':
            updateData.status = 'opened';
            if (!logEntry?.opened_at) {
              updateData.opened_at = timestamp
                ? new Date(timestamp * 1000).toISOString()
                : new Date().toISOString();
            }
            break;

          case 'click':
            updateData.status = 'clicked';
            if (!logEntry?.clicked_at) {
              updateData.clicked_at = timestamp
                ? new Date(timestamp * 1000).toISOString()
                : new Date().toISOString();
            }
            if (url) {
              updateData.metadata = {
                ...updateData.metadata,
                clicked_url: url,
              };
            }
            break;

          case 'bounce':
            updateData.status = 'bounced';
            updateData.bounced_at = timestamp
              ? new Date(timestamp * 1000).toISOString()
              : new Date().toISOString();
            updateData.bounce_reason = reason || status || 'Unknown bounce reason';
            updateData.bounce_type = bounceType || 'hard';
            break;

          case 'dropped':
            updateData.status = 'dropped';
            updateData.bounced_at = timestamp
              ? new Date(timestamp * 1000).toISOString()
              : new Date().toISOString();
            updateData.bounce_reason = reason || 'Email dropped by SendGrid';
            updateData.bounce_type = 'hard';
            break;

          case 'deferred':
            updateData.status = 'deferred';
            break;

          case 'spamreport':
            updateData.status = 'spam_report';
            updateData.spam_reported_at = timestamp
              ? new Date(timestamp * 1000).toISOString()
              : new Date().toISOString();
            break;

          case 'unsubscribe':
            updateData.status = 'unsubscribed';
            updateData.unsubscribed_at = timestamp
              ? new Date(timestamp * 1000).toISOString()
              : new Date().toISOString();
            break;

          case 'group_unsubscribe':
            updateData.status = 'unsubscribed';
            updateData.unsubscribed_at = timestamp
              ? new Date(timestamp * 1000).toISOString()
              : new Date().toISOString();
            break;

          default:
            // Unknown event type, just log it
            logger.info('Unhandled SendGrid event type', {
              component: 'sendgrid-webhook',
              action: 'unhandled_event',
              metadata: { eventType, email, sg_message_id },
            });
            continue;
        }

        if (logEntry) {
          // Update existing log entry
          const { error: updateError } = await supabaseAdmin
            .from('email_delivery_logs')
            .update(updateData)
            .eq('id', logEntry.id);

          if (updateError) {
            logger.error(
              'Failed to update email delivery log',
              {
                component: 'sendgrid-webhook',
                action: 'update_log_failed',
                metadata: { logId: logEntry.id, eventType },
              },
              updateError
            );
          } else {
            processedCount++;
          }
        } else {
          // Create new log entry if we have enough info
          if (messageId && eventType === 'processed') {
            const { error: insertError } = await supabaseAdmin.from('email_delivery_logs').insert({
              email_id: messageId,
              to_email: email,
              from_email: otherData.from || 'noreply@udigitrentals.com',
              subject: otherData.subject || null,
              status: 'sent',
              sent_at: timestamp
                ? new Date(timestamp * 1000).toISOString()
                : new Date().toISOString(),
              metadata: updateData.metadata,
            });

            if (insertError) {
              logger.error(
                'Failed to create email delivery log',
                {
                  component: 'sendgrid-webhook',
                  action: 'create_log_failed',
                  metadata: { email, eventType, messageId },
                },
                insertError
              );
            } else {
              processedCount++;
            }
          }
        }
      } catch (eventError) {
        logger.error(
          'Error processing SendGrid webhook event',
          {
            component: 'sendgrid-webhook',
            action: 'event_processing_error',
            metadata: { event },
          },
          eventError instanceof Error ? eventError : new Error(String(eventError))
        );
        // Continue processing other events
      }
    }

    logger.info('SendGrid webhook processed', {
      component: 'sendgrid-webhook',
      action: 'processed',
      metadata: {
        totalEvents: events.length,
        processedCount,
      },
    });

    return NextResponse.json({ received: true, processed: processedCount });
  } catch (error) {
    logger.error(
      'SendGrid webhook processing failed',
      {
        component: 'sendgrid-webhook',
        action: 'processing_failed',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
