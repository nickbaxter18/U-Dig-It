import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import {
  reconciliationQuerySchema,
  reconciliationTriggerSchema,
} from '@/lib/validators/admin/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { supabase, error } = await requireAdmin(request);
  if (error) return error;

  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = reconciliationQuerySchema.safeParse({
    status: searchParams.status ?? undefined,
    limit: searchParams.limit ? Number(searchParams.limit) : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { status, limit } = parsed.data;

  let query = supabase
    .from('payout_reconciliations')
    .select('*')
    .order('arrival_date', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error: fetchError } = await query;

  if (fetchError) {
    logger.error(
      'Failed to fetch payout reconciliations',
      { component: 'admin-reconciliation', action: 'fetch_failed', metadata: { status, limit } },
      fetchError
    );
    return NextResponse.json(
      { error: 'Unable to load payout reconciliations' },
      { status: 500 }
    );
  }

  return NextResponse.json({ payouts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user, error } = await requireAdmin(request);
  if (error) return error;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // ignore empty body
  }

  const parsed = reconciliationTriggerSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const sinceISO = parsed.data.since ?? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const sinceDate = new Date(sinceISO);
    if (Number.isNaN(sinceDate.valueOf())) {
      return NextResponse.json(
        { error: 'Invalid date supplied for "since"' },
        { status: 400 }
      );
    }

    const arrivalGte = Math.floor(sinceDate.getTime() / 1000);

    const secretKey = await getStripeSecretKey();
    const stripe = createStripeClient(secretKey);

    const payouts = await stripe.payouts.list({
      limit: 50,
      arrival_date: { gte: arrivalGte },
      expand: ['data.summary'],
    });

    const payoutIds = payouts.data.map(payout => payout.id);

    const serviceClient = createServiceClient();
    const dbClient = serviceClient ?? supabase;

    let existingStatusMap = new Map<string, string>();
    if (payoutIds.length > 0) {
      const { data: existingRows, error: existingError } = await dbClient
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

    for (const payout of payouts.data) {
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
          summary: payout.summary ?? null,
        },
        updated_at: nowIso,
      };

      if (existingCreated === nowIso) {
        payloadRow.created_at = nowIso;
      }

      const { error: upsertError } = await dbClient
        .from('payout_reconciliations')
        .upsert(payloadRow, { onConflict: 'stripe_payout_id' });

      if (upsertError) {
        logger.error(
          'Failed to upsert payout reconciliation record',
          {
            component: 'admin-reconciliation',
            action: 'sync_failed',
            metadata: { payoutId: payout.id },
          },
          upsertError
        );
        continue;
      }

      processedIds.push(payout.id);
    }

    logger.info('Stripe payout reconciliation sync complete', {
      component: 'admin-reconciliation',
      action: 'sync_success',
      metadata: { processedCount: processedIds.length, adminId: user.id },
    });

    return NextResponse.json({
      synced: processedIds.length,
      payoutIds: processedIds,
    });
  } catch (err) {
    logger.error(
      'Stripe payout reconciliation sync failed',
      { component: 'admin-reconciliation', action: 'sync_error' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Failed to sync payouts from Stripe' },
      { status: 500 }
    );
  }
}



