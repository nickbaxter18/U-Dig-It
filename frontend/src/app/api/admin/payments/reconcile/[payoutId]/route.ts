import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { reconciliationUpdateSchema } from '@/lib/validators/admin/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  const { supabase, error } = await requireAdmin(request);
  if (error) return error;

  const { data, error: fetchError } = await supabase
    .from('payout_reconciliations')
    .select('*')
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
    return NextResponse.json(
      { error: 'Unable to load payout reconciliation' },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Payout reconciliation not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ payout: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  const { supabase, user, error } = await requireAdmin(request);
  if (error) return error;

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
    updates.reconciled_by = user.id;
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
        metadata: { payoutId: params.payoutId, adminId: user.id },
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
    metadata: { payoutId: params.payoutId, adminId: user.id, status: parsed.data.status },
  });

  return NextResponse.json({ payout: data });
}


