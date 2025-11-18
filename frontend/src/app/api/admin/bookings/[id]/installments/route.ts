import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { installmentCreateSchema } from '@/lib/validators/admin/payments';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;
    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { data, error: fetchError } = await supabase
      .from('installment_schedules')
      .select('*')
      .eq('booking_id', params.id)
      .order('due_date', { ascending: true });

    if (fetchError) {
      if ((fetchError as any)?.code === '42P01') {
        logger.warn(
          'installment_schedules table not found; returning empty schedule',
          {
            component: 'admin-installments',
            action: 'table_missing',
            metadata: { bookingId: params.id, error: fetchError?.message },
          }
        );
        return NextResponse.json({ installments: [] });
      }
      logger.error(
        'Failed to fetch installment schedule',
        {
          component: 'admin-installments',
          action: 'fetch_failed',
          metadata: { bookingId: params.id },
        },
        fetchError
      );
      return NextResponse.json({ error: 'Unable to load installment schedule' }, { status: 500 });
    }

    return NextResponse.json({ installments: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching installment schedule',
      {
        component: 'admin-installments',
        action: 'fetch_unexpected',
        metadata: { bookingId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;



    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }



    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    const payload = installmentCreateSchema.parse(await request.json());

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('totalAmount, depositAmount, balanceAmount:balance_amount')
      .eq('id', params.id)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const planned = payload.installments.reduce((sum, installment) => sum + installment.amount, 0);
    const balanceAmount =
      Number(booking.balanceAmount ?? 0) ||
      Math.max(Number(booking.totalAmount ?? 0) - Number(booking.depositAmount ?? 0), 0);

    if (Math.abs(planned - balanceAmount) > 1) {
      return NextResponse.json(
        { error: 'Installment amounts must sum to outstanding balance' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('installment_schedules')
      .delete()
      .eq('booking_id', params.id)
      .neq('status', 'paid');

    if (deleteError) {
      if ((deleteError as any)?.code === '42P01') {
        logger.warn(
          'installment_schedules table not found when clearing schedule',
          {
            component: 'admin-installments',
            action: 'table_missing_delete',
            metadata: { bookingId: params.id, error: deleteError?.message },
          }
        );
        return NextResponse.json({ installments: [] });
      }
      logger.error(
        'Failed to clear existing installment schedule',
        {
          component: 'admin-installments',
          action: 'clear_failed',
          metadata: { bookingId: params.id },
        },
        deleteError
      );
      return NextResponse.json({ error: 'Unable to reset existing schedule' }, { status: 500 });
    }

    const rows = payload.installments.map((installment, index) => ({
      booking_id: params.id,
      installment_number: index + 1,
      due_date: installment.dueDate,
      amount: installment.amount,
      status: 'pending',
    }));

    const { data, error: insertError } = await supabase
      .from('installment_schedules')
      .insert(rows)
      .select();

    if (insertError) {
      if ((insertError as any)?.code === '42P01') {
        logger.warn(
          'installment_schedules table not found when inserting; skipping creation',
          {
            component: 'admin-installments',
            action: 'table_missing_insert',
            metadata: { bookingId: params.id, error: insertError?.message },
          }
        );
        return NextResponse.json({ installments: [] });
      }
      logger.error(
        'Failed to create installment schedule',
        {
          component: 'admin-installments',
          action: 'create_failed',
          metadata: { bookingId: params.id },
        },
        insertError
      );
      return NextResponse.json({ error: 'Unable to create installment schedule' }, { status: 500 });
    }

    logger.info('Installment schedule created', {
      component: 'admin-installments',
      action: 'schedule_created',
      metadata: { bookingId: params.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ installments: data ?? [] });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating installment schedule',
      {
        component: 'admin-installments',
        action: 'create_unexpected',
        metadata: { bookingId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
