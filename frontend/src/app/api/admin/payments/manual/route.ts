import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { recalculateBookingBalance } from '@/lib/booking/balance';
import { updateBillingStatus } from '@/lib/booking/billing-status';
import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { manualPaymentCreateSchema } from '@/lib/validators/admin/payments';

const _BUCKET_ID = 'manual-payment-attachments'; // Reserved for future file attachments

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const status = searchParams.get('status');

    // Get pagination parameters
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    let query = supabase
      .from('manual_payments')
      .select(
        `
        id,
        booking_id,
        customer_id,
        amount,
        currency,
        method,
        received_at,
        notes,
        status,
        recorded_by,
        created_at,
        updated_at,
        deleted_at,
        booking:booking_id (
          id,
          bookingNumber,
          totalAmount,
          depositAmount,
          balance_amount
        ),
        customer:customer_id (
          id,
          firstName,
          lastName,
          email,
          phone
        )
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null);

    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false }).range(rangeStart, rangeEnd);

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      if ((fetchError as any)?.code === '42P01') {
        logger.warn('manual_payments table not found; returning empty result', {
          component: 'admin-manual-payments',
          action: 'table_missing',
        });
        return NextResponse.json({ manualPayments: [] });
      }
      logger.error(
        'Failed to fetch manual payments',
        {
          component: 'admin-manual-payments',
          action: 'fetch_failed',
          metadata: {
            bookingId,
            status,
            errorCode: (fetchError as any)?.code,
            errorMessage: fetchError.message,
            errorDetails: (fetchError as any)?.details,
            errorHint: (fetchError as any)?.hint,
          },
        },
        fetchError
      );
      return NextResponse.json(
        {
          error: 'Unable to load manual payments',
          details:
            process.env.NODE_ENV === 'development'
              ? fetchError.message || 'Database query failed'
              : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      manualPayments: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching manual payments',
      {
        component: 'admin-manual-payments',
        action: 'fetch_unexpected',
        metadata: {
          errorName: err instanceof Error ? err.name : typeof err,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : undefined,
        },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined,
      },
      { status: 500 }
    );
  }
});

export const POST = withRateLimit(RateLimitPresets.STRICT, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { user } = adminResult;

    const body = await request.json();
    const payload = manualPaymentCreateSchema.parse(body);

    const serviceClient = await createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Storage configuration unavailable' }, { status: 500 });
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
        recorded_by: user?.id || 'unknown',
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
          metadata: { bookingId: payload.bookingId, adminId: user?.id || 'unknown' },
        },
        insertError ?? new Error('Missing manual payment data')
      );
      return NextResponse.json({ error: 'Unable to record manual payment' }, { status: 500 });
    }

    // Recalculate balance if payment is created as 'completed'
    // Otherwise, balance will be updated when payment status changes to 'completed' (handled in PATCH route)
    if (payload.status === 'completed') {
      logger.info('Triggering balance recalculation after manual payment creation (completed)', {
        component: 'admin-manual-payments',
        action: 'balance_recalculation_triggered',
        metadata: {
          bookingId: payload.bookingId,
          manualPaymentId: manualPayment.id,
          amount: payload.amount,
        },
      });

      const newBalance = await recalculateBookingBalance(payload.bookingId);
      if (newBalance === null) {
        logger.error('Balance recalculation failed after manual payment creation', {
          component: 'admin-manual-payments',
          action: 'balance_recalculation_failed',
          metadata: { bookingId: payload.bookingId, manualPaymentId: manualPayment.id },
        });
      } else {
        logger.info('Balance recalculated successfully after manual payment creation', {
          component: 'admin-manual-payments',
          action: 'balance_recalculated',
          metadata: {
            bookingId: payload.bookingId,
            manualPaymentId: manualPayment.id,
            newBalance,
            paymentAmount: payload.amount,
          },
        });
        // Update billing status after balance recalculation
        const newBillingStatus = await updateBillingStatus(payload.bookingId);
        if (newBillingStatus === null) {
          logger.warn('Billing status update failed after manual payment creation', {
            component: 'admin-manual-payments',
            action: 'billing_status_update_failed',
            metadata: { bookingId: payload.bookingId, manualPaymentId: manualPayment.id },
          });
        }

        // Update booking status to 'paid' if balance reaches 0
        if (newBalance === 0) {
          const { error: statusUpdateError } = await serviceClient
            .from('bookings')
            .update({ status: 'paid' })
            .eq('id', payload.bookingId);

          if (statusUpdateError) {
            logger.warn(
              'Failed to update booking status to paid',
              {
                component: 'admin-manual-payments',
                action: 'booking_status_update_failed',
                metadata: {
                  bookingId: payload.bookingId,
                  manualPaymentId: manualPayment.id,
                  error: statusUpdateError.message,
                },
              },
              statusUpdateError
            );
          } else {
            logger.info('Booking status updated to paid after manual payment', {
              component: 'admin-manual-payments',
              action: 'booking_status_updated',
              metadata: {
                bookingId: payload.bookingId,
                manualPaymentId: manualPayment.id,
                newBalance,
              },
            });
          }
        }
      }
    }

    const ledgerEntry = {
      booking_id: manualPayment.booking_id,
      entry_type: 'manual',
      amount: manualPayment.amount,
      currency: manualPayment.currency,
      source: 'manual',
      reference_id: manualPayment.id,
      description: payload.notes ?? 'Manual payment recorded',
      created_by: user?.id || 'unknown',
    };

    const { error: ledgerError } = await supabase.from('financial_ledger').insert(ledgerEntry);

    if (ledgerError) {
      logger.warn('Manual payment recorded but ledger entry failed', {
        component: 'admin-manual-payments',
        action: 'ledger_insert_failed',
        metadata: { manualPaymentId: manualPayment.id, error: ledgerError?.message },
      });
    }

    logger.info('Manual payment recorded', {
      component: 'admin-manual-payments',
      action: 'manual_payment_created',
      metadata: {
        manualPaymentId: manualPayment.id,
        bookingId: manualPayment.booking_id,
        adminId: user?.id || 'unknown',
      },
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
});
