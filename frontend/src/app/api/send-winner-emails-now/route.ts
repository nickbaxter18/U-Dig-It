/**
 * POST /api/send-winner-emails-now
 *
 * Manually send winner notification emails to active unredeemed spin sessions
 * Admin-only endpoint for immediate outreach to winners
 *
 * Use this to:
 * - Send emails to existing winners who haven't been notified
 * - Re-send to active winners as a reminder
 * - Test the full email flow
 */

import { sendSpinWinnerEmail } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all active unredeemed winners
    const { data: activeSessions, error: fetchError } = await supabase
      .from('spin_sessions')
      .select('id, email, prize_pct, coupon_code, expires_at')
      .is('used_at', null)
      .eq('completed', true)
      .gt('expires_at', new Date().toISOString())
      .not('email', 'is', null);

    if (fetchError) {
      logger.error('Failed to fetch active sessions', {
        component: 'send-winner-emails-api',
        action: 'fetch_error',
      }, fetchError);
      return NextResponse.json({ error: 'Failed to fetch winners' }, { status: 500 });
    }

    if (!activeSessions || activeSessions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No active unredeemed winners found'
      });
    }

    logger.info('📧 Found active unredeemed winners', {
      component: 'send-winner-emails-api',
      action: 'winners_found',
      metadata: { count: activeSessions.length },
    });

    // Send emails to all active winners
    let sent = 0;
    let failed = 0;
    const results = [];

    for (const session of activeSessions) {
      try {
        await sendSpinWinnerEmail(
          session.email!,
          session.prize_pct!,
          session.coupon_code!,
          new Date(session.expires_at)
        );

        sent++;
        results.push({
          email: session.email,
          prizeAmount: session.prize_pct,
          status: 'sent',
        });

        logger.info('✅ Winner email sent', {
          component: 'send-winner-emails-api',
          action: 'email_sent',
          metadata: {
            sessionId: session.id,
            email: session.email,
            prizeAmount: session.prize_pct,
          },
        });
      } catch (error) {
        failed++;
        results.push({
          email: session.email,
          prizeAmount: session.prize_pct,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        logger.error('❌ Failed to send winner email', {
          component: 'send-winner-emails-api',
          action: 'email_failed',
          metadata: { sessionId: session.id },
        }, error instanceof Error ? error : new Error(String(error)));
      }
    }

    logger.info('🎉 Batch email send complete', {
      component: 'send-winner-emails-api',
      action: 'batch_complete',
      metadata: { sent, failed, total: activeSessions.length },
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: activeSessions.length,
      results,
      message: `Sent ${sent} emails to active winners, ${failed} failed`
    });

  } catch (error) {
    logger.error('❌ Batch email send error', {
      component: 'send-winner-emails-api',
      action: 'batch_error',
    }, error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json({
      success: false,
      error: 'Batch email send failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


