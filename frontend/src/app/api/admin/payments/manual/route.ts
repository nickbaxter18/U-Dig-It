import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { manualPaymentCreateSchema } from '@/lib/validators/admin/payments';

const BUCKET_ID = 'manual-payment-attachments';

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    let query = supabase
      .from('manual_payments')
      .select(
        `
        *,
        booking:booking_id (
          id,
          bookingNumber,
          totalAmount,
          depositAmount,
          balanceAmount:balance_amount
        ),
        customer:customer_id (
          id,
          firstName,
          lastName,
          email,
          phone
        )
      `
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }

    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      if ((fetchError as any)?.code === '42P01') {
        logger.warn(
          'manual_payments table not found; returning empty result',
          { component: 'admin-manual-payments', action: 'table_missing' },
          fetchError
        );
        return NextResponse.json({ manualPayments: [] });
      }
      logger.error(
        'Failed to fetch manual payments',
        { component: 'admin-manual-payments', action: 'fetch_failed', metadata: { bookingId } },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to load manual payments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ manualPayments: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching manual payments',
      { component: 'admin-manual-payments', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const body = await request.json();
    const payload = manualPaymentCreateSchema.parse(body);

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: 'Storage configuration unavailable' },
        { status: 500 }
      );
    }

    const { data: manualPayment, error: insertError } = await supabase
      .from('manual_payments')
      .insert({
        booking_id: payload.bookingId,
        customer_id: payload.customerId ?? null,
        amount: payload.amount,
        currency: payload.currency,
        method: payload.method,
        status: 'pending',
        received_at: payload.receivedAt ?? null,
        recorded_by: user.id,
        notes: payload.notes ?? null,
        attachments: payload.attachments ?? [],
      })
      .select()
      .single();

    if (insertError || !manualPayment) {
      logger.error(
        'Failed to record manual payment',
        {
          component: 'admin-manual-payments',
          action: 'create_failed',
          metadata: { bookingId: payload.bookingId, adminId: user.id },
        },
        insertError ?? new Error('Missing manual payment data')
      );
      return NextResponse.json(
        { error: 'Unable to record manual payment' },
        { status: 500 }
      );
    }

    const ledgerEntry = {
      booking_id: manualPayment.booking_id,
      entry_type: 'manual',
      amount: manualPayment.amount,
      currency: manualPayment.currency,
      source: 'manual',
      reference_id: manualPayment.id,
      description: payload.notes ?? 'Manual payment recorded',
      created_by: user.id,
    };

    const { error: ledgerError } = await supabase
      .from('financial_ledger')
      .insert(ledgerEntry);

    if (ledgerError) {
      logger.warn(
        'Manual payment recorded but ledger entry failed',
        {
          component: 'admin-manual-payments',
          action: 'ledger_insert_failed',
          metadata: { manualPaymentId: manualPayment.id },
        },
        ledgerError
      );
    }

    logger.info('Manual payment recorded', {
      component: 'admin-manual-payments',
      action: 'manual_payment_created',
      metadata: { manualPaymentId: manualPayment.id, bookingId: manualPayment.booking_id, adminId: user.id },
    });

    return NextResponse.json({ manualPayment });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating manual payment',
      { component: 'admin-manual-payments', action: 'create_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Internal server error while recording manual payment' },
      { status: 500 }
    );
  }
}


