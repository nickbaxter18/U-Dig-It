import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { reconciliationUpdateSchema } from '@/lib/validators/admin/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (request: NextRequest, { params }: { params: { payoutId: string } }) => {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { data, error: fetchError } = await supabase
      .from('payout_reconciliations')
      .select(
        'id, stripe_payout_id, arrival_date, amount, currency, status, details, reconciled_by, reconciled_at, created_at, updated_at'
      )
      .eq('stripe_payout_id', params.payoutId)
      .maybeSingle();

    if (fetchError) {
      logger.error(
        'Failed to fetch payout reconciliation detail',
        {
          component: 'admin-reconciliation',
          action: 'detail_fetch_failed',
          metadata: { payoutId: params.payoutId },
        },
        fetchError
      );
      return NextResponse.json({ error: 'Unable to load payout reconciliation' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Payout reconciliation not found' }, { status: 404 });
    }

    return NextResponse.json({ payout: data });
  }
);

export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: { payoutId: string } }) => {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { user } = adminResult;

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      // ignore empty payload
    }

    const parsed = reconciliationUpdateSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('payout_reconciliations')
      .select('details')
      .eq('stripe_payout_id', params.payoutId)
      .maybeSingle();

    const existingDetails =
      existing?.details && typeof existing.details === 'object'
        ? (existing.details as Record<string, unknown>)
        : {};

    const previousNotes =
      typeof existingDetails['notes'] === 'string'
        ? (existingDetails['notes'] as string)
        : undefined;
    const previousDiscrepancy =
      typeof existingDetails['discrepancyAmount'] === 'number'
        ? (existingDetails['discrepancyAmount'] as number)
        : undefined;

    const updates: Record<string, unknown> = {
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
      details: {
        ...existingDetails,
        notes: parsed.data.notes ?? previousNotes ?? null,
        discrepancyAmount: parsed.data.discrepancyAmount ?? previousDiscrepancy ?? null,
      },
    };

    if (parsed.data.status === 'reconciled') {
      updates.reconciled_at = new Date().toISOString();
      updates.reconciled_by = user?.id || 'unknown';
    }

    const { data, error: updateError } = await supabase
      .from('payout_reconciliations')
      .update(updates)
      .eq('stripe_payout_id', params.payoutId)
      .select()
      .maybeSingle();

    if (updateError) {
      logger.error(
        'Failed to update payout reconciliation status',
        {
          component: 'admin-reconciliation',
          action: 'detail_update_failed',
          metadata: { payoutId: params.payoutId, adminId: user?.id || 'unknown' },
        },
        updateError
      );
      return NextResponse.json(
        { error: 'Unable to update payout reconciliation' },
        { status: 500 }
      );
    }

    logger.info('Payout reconciliation updated', {
      component: 'admin-reconciliation',
      action: 'detail_update_success',
      metadata: {
        payoutId: params.payoutId,
        adminId: user?.id || 'unknown',
        status: parsed.data.status,
      },
    });

    return NextResponse.json({ payout: data });
  }
);
