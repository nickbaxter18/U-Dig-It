import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';

const JOB_NAME = 'reconcile_stripe_payouts';

// Verify cron secret to prevent unauthorized runs
const CRON_SECRET = process.env.CRON_SECRET || 'development-cron-secret';

/**
 * GET /api/cron/reconcile-stripe-payouts
 * Automatically fetch and reconcile Stripe payouts
 * Should be called by cron service nightly
 */
export async function GET(request: NextRequest) {
  let jobRun: any = null;
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');

    const isAuthorized =
      authHeader === `Bearer ${CRON_SECRET}` ||
      cronSecret === CRON_SECRET ||
      request.headers.get('x-vercel-cron') === 'true';

    if (!isAuthorized) {
      logger.warn('Unauthorized payout reconciliation access', {
        component: 'cron-reconcile-payouts',
        action: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceClient();
    if (!supabaseAdmin) {
      logger.error('Service client unavailable for payout reconciliation', {
        component: 'cron-reconcile-payouts',
        action: 'missing_client',
      });
      return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
    }

    // Create job run record
    const { data: jobRunData, error: jobRunError } = await supabaseAdmin
      .from('job_runs')
      .insert({
        job_name: JOB_NAME,
        job_type: 'cron',
        status: 'running',
        metadata: {
          triggered_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (jobRunError) {
      logger.error(
        'Failed to create job run record',
        {
          component: 'cron-reconcile-payouts',
          action: 'create_run_failed',
        },
        jobRunError
      );
      // Continue anyway
    } else {
      jobRun = jobRunData;
    }

    // Fetch payouts from last 14 days
    const sinceDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const arrivalGte = Math.floor(sinceDate.getTime() / 1000);

    const secretKey = await getStripeSecretKey();
    if (!secretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = createStripeClient(secretKey);

    // Fetch payouts from Stripe
    const payouts = await stripe.payouts.list({
      limit: 100,
      arrival_date: { gte: arrivalGte },
      expand: ['data.summary'],
    });

    const payoutIds = payouts.data.map(payout => payout.id);

    // Get existing payout records
    let existingStatusMap = new Map<string, string>();
    if (payoutIds.length > 0) {
      const { data: existingRows, error: existingError } = await supabaseAdmin
        .from('payout_reconciliations')
        .select('stripe_payout_id, status')
        .in('stripe_payout_id', payoutIds);

      if (!existingError && existingRows) {
        existingStatusMap = new Map(
          existingRows.map(row => [row.stripe_payout_id as string, row.status as string])
        );
      }
    }

    const processedIds: string[] = [];
    const nowIso = new Date().toISOString();
    let successCount = 0;
    let failureCount = 0;

    // Process each payout
    for (const payout of payouts.data) {
      try {
        const status = existingStatusMap.get(payout.id) ?? 'pending';
        const existingCreated = existingStatusMap.has(payout.id) ? undefined : nowIso;

        const payloadRow: Record<string, unknown> = {
          stripe_payout_id: payout.id,
          amount: Number(payout.amount ?? 0) / 100,
          currency: payout.currency?.toUpperCase() ?? 'CAD',
          arrival_date: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
          status,
          details: {
            stripeStatus: payout.status,
            automatic: payout.automatic,
            balanceTransaction: payout.balance_transaction,
            failureCode: payout.failure_code,
            failureMessage: payout.failure_message,
            method: payout.method,
            metadata: payout.metadata ?? {},
            summary: (payout as any).summary ?? null,
          },
          updated_at: nowIso,
        };

        if (existingCreated === nowIso) {
          payloadRow.created_at = nowIso;
        }

        const { error: upsertError } = await supabaseAdmin
          .from('payout_reconciliations')
          .upsert(payloadRow, { onConflict: 'stripe_payout_id' });

        if (upsertError) {
          logger.error(
            'Failed to upsert payout reconciliation record',
            {
              component: 'cron-reconcile-payouts',
              action: 'sync_failed',
              metadata: { payoutId: payout.id },
            },
            upsertError
          );
          failureCount++;
          continue;
        }

        processedIds.push(payout.id);
        successCount++;
      } catch (error) {
        logger.error(
          'Error processing payout',
          {
            component: 'cron-reconcile-payouts',
            action: 'process_payout_error',
            metadata: { payoutId: payout.id },
          },
          error instanceof Error ? error : new Error(String(error))
        );
        failureCount++;
      }
    }

    logger.info('Stripe payout reconciliation sync complete', {
      component: 'cron-reconcile-payouts',
      action: 'sync_success',
      metadata: {
        processedCount: processedIds.length,
        successCount,
        failureCount,
        totalPayouts: payouts.data.length,
      },
    });

    // Update job run record
    if (jobRun) {
      await supabaseAdmin
        .from('job_runs')
        .update({
          status: failureCount === 0 ? 'success' : 'failed',
          finished_at: new Date().toISOString(),
          processed_count: payouts.data.length,
          success_count: successCount,
          failure_count: failureCount,
        })
        .eq('id', jobRun.id);
    }

    return NextResponse.json({
      success: true,
      processed: processedIds.length,
      successes: successCount,
      failures: failureCount,
      totalPayouts: payouts.data.length,
    });
  } catch (error) {
    logger.error(
      'Unexpected error reconciling Stripe payouts',
      {
        component: 'cron-reconcile-payouts',
        action: 'unexpected_error',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    // Update job run record with error
    if (jobRun) {
      const supabaseAdmin = createServiceClient();
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('job_runs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : String(error),
          })
          .eq('id', jobRun.id);
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


