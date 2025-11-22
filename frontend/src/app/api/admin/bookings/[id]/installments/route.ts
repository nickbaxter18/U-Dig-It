import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { installmentCreateSchema } from '@/lib/validators/admin/payments';

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      // Handle params as either Promise or direct object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      const bookingId = resolvedParams?.id;

      logger.info('Fetching installment schedule', {
        component: 'admin-installments',
        action: 'fetch_start',
        metadata: {
          bookingId: bookingId || 'undefined',
          paramsType: params instanceof Promise ? 'Promise' : 'object',
          url: request.url,
        },
      });

      if (
        !bookingId ||
        bookingId === 'undefined' ||
        bookingId === 'null' ||
        typeof bookingId !== 'string'
      ) {
        logger.warn('Invalid booking ID provided', {
          component: 'admin-installments',
          action: 'invalid_booking_id',
          metadata: {
            bookingId: bookingId || 'undefined',
            bookingIdType: typeof bookingId,
            url: request.url,
          },
        });
        return NextResponse.json(
          { error: 'Booking ID is required and must be a valid UUID' },
          { status: 400 }
        );
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(bookingId)) {
        return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
      }

      const adminResult = await requireAdmin(request);
      if (adminResult.error) return adminResult.error;
      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get pagination parameters (installments are typically small, but add pagination for consistency)
      const { searchParams } = new URL(request.url);
      const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
      const pageSize = Math.min(
        Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1),
        100
      );
      const rangeStart = (page - 1) * pageSize;
      const rangeEnd = rangeStart + pageSize - 1;

      const query = supabase
        .from('installment_schedules')
        .select(
          'id, booking_id, installment_number, due_date, amount, status, payment_id, manual_payment_id, paid_at, reminder_sent_at, created_at, updated_at',
          { count: 'exact' }
        )
        .eq('booking_id', bookingId);

      const {
        data,
        error: fetchError,
        count,
      } = await query.order('due_date', { ascending: true }).range(rangeStart, rangeEnd);

      if (fetchError) {
        if ((fetchError as any)?.code === '42P01') {
          logger.warn('installment_schedules table not found; returning empty schedule', {
            component: 'admin-installments',
            action: 'table_missing',
            metadata: { bookingId, error: fetchError?.message },
          });
          return NextResponse.json({ installments: [] });
        }
        logger.error(
          'Failed to fetch installment schedule',
          {
            component: 'admin-installments',
            action: 'fetch_failed',
            metadata: {
              bookingId,
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
            error: 'Unable to load installment schedule',
            details:
              process.env.NODE_ENV === 'development'
                ? fetchError.message || 'Database query failed'
                : undefined,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        installments: data ?? [],
        pagination: {
          page,
          pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / pageSize),
        },
      });
    } catch (err) {
      logger.error(
        'Unexpected error fetching installment schedule',
        {
          component: 'admin-installments',
          action: 'fetch_unexpected',
          metadata: {
            bookingId: bookingId || 'unknown',
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
            process.env.NODE_ENV === 'development' && err instanceof Error
              ? err.message
              : undefined,
        },
        { status: 500 }
      );
    }
  }
);

export const POST = withRateLimit(
  RateLimitPresets.STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      // Handle params as either Promise or direct object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      const bookingId = resolvedParams?.id;

      if (
        !bookingId ||
        bookingId === 'undefined' ||
        bookingId === 'null' ||
        typeof bookingId !== 'string'
      ) {
        return NextResponse.json(
          { error: 'Booking ID is required and must be a valid UUID' },
          { status: 400 }
        );
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(bookingId)) {
        return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
      }

      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      const payload = installmentCreateSchema.parse(await request.json());

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('totalAmount, depositAmount, balance_amount')
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingError || !booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      const planned = payload.installments.reduce(
        (sum, installment) => sum + installment.amount,
        0
      );
      const balanceAmount =
        Number((booking as any).balance_amount ?? 0) ||
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
        .eq('booking_id', bookingId)
        .neq('status', 'paid');

      if (deleteError) {
        if ((deleteError as any)?.code === '42P01') {
          logger.warn('installment_schedules table not found when clearing schedule', {
            component: 'admin-installments',
            action: 'table_missing_delete',
            metadata: { bookingId, error: deleteError?.message },
          });
          return NextResponse.json({ installments: [] });
        }
        logger.error(
          'Failed to clear existing installment schedule',
          {
            component: 'admin-installments',
            action: 'clear_failed',
            metadata: { bookingId },
          },
          deleteError
        );
        return NextResponse.json({ error: 'Unable to reset existing schedule' }, { status: 500 });
      }

      const rows = payload.installments.map((installment, index) => ({
        booking_id: bookingId,
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
          logger.warn('installment_schedules table not found when inserting; skipping creation', {
            component: 'admin-installments',
            action: 'table_missing_insert',
            metadata: { bookingId, error: insertError?.message },
          });
          return NextResponse.json({ installments: [] });
        }
        logger.error(
          'Failed to create installment schedule',
          {
            component: 'admin-installments',
            action: 'create_failed',
            metadata: { bookingId },
          },
          insertError
        );
        return NextResponse.json(
          { error: 'Unable to create installment schedule' },
          { status: 500 }
        );
      }

      logger.info('Installment schedule created', {
        component: 'admin-installments',
        action: 'schedule_created',
        metadata: { bookingId, adminId: user?.id || 'unknown' },
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
          metadata: {
            bookingId: bookingId || 'unknown',
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
            process.env.NODE_ENV === 'development' && err instanceof Error
              ? err.message
              : undefined,
        },
        { status: 500 }
      );
    }
  }
);
