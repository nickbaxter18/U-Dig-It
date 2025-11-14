import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { installmentStatusUpdateSchema } from '@/lib/validators/admin/payments';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = installmentStatusUpdateSchema.parse(await request.json());

    const updateBody: Record<string, unknown> = {
      status: payload.status,
    };

    if (payload.paymentId) updateBody.payment_id = payload.paymentId;
    if (payload.manualPaymentId) updateBody.manual_payment_id = payload.manualPaymentId;
    if (payload.paidAt) updateBody.paid_at = payload.paidAt;
    if (payload.status === 'paid' && !updateBody.paid_at) {
      updateBody.paid_at = new Date().toISOString();
    }
    if (payload.deferUntil) {
      updateBody.due_date = payload.deferUntil;
      updateBody.status = 'pending';
    }

    const { data, error: updateError } = await supabase
      .from('installment_schedules')
      .update(updateBody)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      logger.error(
        'Failed to update installment status',
        {
          component: 'admin-installments',
          action: 'status_update_failed',
          metadata: { installmentId: params.id, adminId: user.id },
        },
        updateError
      );
      return NextResponse.json(
        { error: 'Unable to update installment status' },
        { status: 500 }
      );
    }

    logger.info('Installment status updated', {
      component: 'admin-installments',
      action: 'status_updated',
      metadata: { installmentId: params.id, adminId: user.id, status: payload.status },
    });

    return NextResponse.json({ installment: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error updating installment status',
      { component: 'admin-installments', action: 'status_update_unexpected', metadata: { installmentId: params.id } },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


