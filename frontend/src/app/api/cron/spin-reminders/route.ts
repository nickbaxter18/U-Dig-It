/**
 * GET /api/cron/spin-reminders
 *
 * Sends reminder emails to spin-to-win winners whose codes are expiring soon
 *
 * Schedule: Run this hourly via Vercel Cron or manually
 *
 * Sends:
 * - 24-hour reminder (when code expires in 23-25 hours)
 * - 4-hour reminder (when code expires in 3-5 hours)
 */

import { sendSpinExpiryReminder } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ========================================================================
    // SECURITY: Verify cron authorization
    // ========================================================================
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('[Spin Reminders] Unauthorized cron access attempt', {
        component: 'spin-reminders-cron',
        action: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // ========================================================================
    // 24-HOUR REMINDER
    // ========================================================================
    const twentyThreeHours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const twentyFiveHours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: sessions24h, error: error24h } = await supabase
      .from('spin_sessions')
      .select('id, email, prize_pct, coupon_code, expires_at')
      .is('used_at', null) // Not redeemed yet
      .eq('completed', true) // Has a prize
      .gte('expires_at', twentyThreeHours.toISOString())
      .lte('expires_at', twentyFiveHours.toISOString());

    if (error24h) {
      logger.error('[Spin Reminders] Error fetching 24h sessions', {
        component: 'spin-reminders-cron',
        action: 'fetch_error_24h',
      }, error24h);
    }

    let sent24h = 0;
    if (sessions24h && sessions24h.length > 0) {
      logger.info('[Spin Reminders] Found sessions expiring in 24 hours', {
        component: 'spin-reminders-cron',
        action: 'sessions_found_24h',
        metadata: { count: sessions24h.length },
      });

      for (const session of sessions24h) {
        try {
          await sendSpinExpiryReminder(
            session.email!,
            session.prize_pct!, // Dollar amount: 50, 75, or 100
            session.coupon_code!,
            new Date(session.expires_at)
          );

          sent24h++;
          logger.info('✅ [Spin Reminders] 24h reminder sent', {
            component: 'spin-reminders-cron',
            action: 'reminder_sent_24h',
            metadata: {
              sessionId: session.id,
              email: session.email,
              prizeAmount: session.prize_pct,
            },
          });
        } catch (error) {
          logger.error('❌ [Spin Reminders] Failed to send 24h reminder', {
            component: 'spin-reminders-cron',
            action: 'email_error_24h',
            metadata: { sessionId: session.id },
          }, error as Error);
        }
      }
    }

    // ========================================================================
    // 4-HOUR REMINDER
    // ========================================================================
    const threeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const fiveHours = new Date(now.getTime() + 5 * 60 * 60 * 1000);

    const { data: sessions4h, error: error4h } = await supabase
      .from('spin_sessions')
      .select('id, email, prize_pct, coupon_code, expires_at')
      .is('used_at', null) // Not redeemed yet
      .eq('completed', true) // Has a prize
      .gte('expires_at', threeHours.toISOString())
      .lte('expires_at', fiveHours.toISOString());

    if (error4h) {
      logger.error('[Spin Reminders] Error fetching 4h sessions', {
        component: 'spin-reminders-cron',
        action: 'fetch_error_4h',
      }, error4h);
    }

    let sent4h = 0;
    if (sessions4h && sessions4h.length > 0) {
      logger.info('[Spin Reminders] Found sessions expiring in 4 hours', {
        component: 'spin-reminders-cron',
        action: 'sessions_found_4h',
        metadata: { count: sessions4h.length },
      });

      for (const session of sessions4h) {
        try {
          await sendSpinExpiryReminder(
            session.email!,
            session.prize_pct!,
            session.coupon_code!,
            new Date(session.expires_at)
          );

          sent4h++;
          logger.info('✅ [Spin Reminders] 4h reminder sent', {
            component: 'spin-reminders-cron',
            action: 'reminder_sent_4h',
            metadata: {
              sessionId: session.id,
              email: session.email,
              prizeAmount: session.prize_pct,
            },
          });
        } catch (error) {
          logger.error('❌ [Spin Reminders] Failed to send 4h reminder', {
            component: 'spin-reminders-cron',
            action: 'email_error_4h',
            metadata: { sessionId: session.id },
          }, error as Error);
        }
      }
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    const totalSent = sent24h + sent4h;

    logger.info('[Spin Reminders] Cron job completed', {
      component: 'spin-reminders-cron',
      action: 'cron_completed',
      metadata: {
        sent24h,
        sent4h,
        totalSent,
      },
    });

    return NextResponse.json({
      success: true,
      sent: {
        twentyFourHour: sent24h,
        fourHour: sent4h,
        total: totalSent,
      },
      message: `Sent ${totalSent} reminder emails`,
    });

  } catch (error) {
    logger.error('[Spin Reminders] Cron job failed', {
      component: 'spin-reminders-cron',
      action: 'cron_error',
    }, error as Error);

    return NextResponse.json(
      { error: 'Cron job failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}


