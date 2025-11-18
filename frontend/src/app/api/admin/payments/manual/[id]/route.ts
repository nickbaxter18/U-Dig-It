import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { manualPaymentUpdateSchema } from '@/lib/validators/admin/payments';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    

    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    const payload = manualPaymentUpdateSchema.parse(await request.json());

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ success: true });
    }

    const updateBody: Record<string, unknown> = {};
    if (payload.amount !== undefined) updateBody.amount = payload.amount;
    if (payload.status) updateBody.status = payload.status;
    if (payload.notes !== undefined) updateBody.notes = payload.notes ?? null;
    if (payload.attachments !== undefined) updateBody.attachments = payload.attachments;
    updateBody.updated_at = new Date().toISOString();

    const { data, error: updateError } = await supabase
      .from('manual_payments')
      .update(updateBody)
      .eq('id', params.id)
      .is('deleted_at', null)
      .select()
      .single();

    if (updateError) {
      logger.error(
        'Failed to update manual payment',
        {
          component: 'admin-manual-payments',
          action: 'update_failed',
          metadata: { manualPaymentId: params.id, adminId: user?.id || 'unknown' },
        },
        updateError
      );
      return NextResponse.json(
        { error: 'Unable to update manual payment' },
        { status: 500 }
      );
    }

    logger.info('Manual payment updated', {
      component: 'admin-manual-payments',
      action: 'manual_payment_updated',
      metadata: { manualPaymentId: params.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ manualPayment: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error updating manual payment',
      { component: 'admin-manual-payments', action: 'update_unexpected', metadata: { manualPaymentId: params.id } },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    

    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    const { error: deleteError } = await supabase
      .from('manual_payments')
      .update({ deleted_at: new Date().toISOString(), status: 'voided' })
      .eq('id', params.id);

    if (deleteError) {
      logger.error(
        'Failed to delete manual payment',
        {
          component: 'admin-manual-payments',
          action: 'delete_failed',
          metadata: { manualPaymentId: params.id, adminId: user?.id || 'unknown' },
        },
        deleteError
      );
      return NextResponse.json(
        { error: 'Unable to delete manual payment' },
        { status: 500 }
      );
    }

    logger.info('Manual payment soft deleted', {
      component: 'admin-manual-payments',
      action: 'manual_payment_deleted',
      metadata: { manualPaymentId: params.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error(
      'Unexpected error deleting manual payment',
      { component: 'admin-manual-payments', action: 'delete_unexpected', metadata: { manualPaymentId: params.id } },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


