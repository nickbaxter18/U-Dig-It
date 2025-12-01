import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { exportCreateSchema, exportQuerySchema } from '@/lib/validators/admin/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET_ID = 'financial-exports';

async function ensureBucket(serviceClient: NonNullable<ReturnType<typeof createServiceClient>>) {
  try {
    const { data } = await serviceClient.storage.getBucket(BUCKET_ID);
    if (data) return;
  } catch (error: unknown) {
    if ((error as any)?.statusCode !== '404' && (error as any)?.status !== 404) {
      throw error;
    }
  }

  await serviceClient.storage.createBucket(BUCKET_ID, {
    public: false,
    allowedMimeTypes: ['text/csv'],
  });
}

function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const escapedRows = rows.map((row) =>
    row
      .map((value: unknown) => {
        if (value === null || value === undefined) return '';
        const cell = String(value);
        return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
      })
      .join(',')
  );

  return [headers.join(','), ...escapedRows].join('\n');
}

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = exportQuerySchema.safeParse({
      limit: searchParams.limit ? Number(searchParams.limit) : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Convert limit to pagination format
    const pageSize = Math.min(Math.max(parsed.data.limit || 100, 1), 500);
    const page = 1; // Legacy API uses limit, so default to page 1
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    const {
      data,
      error: fetchError,
      count,
    } = await supabase
      .from('financial_exports')
      .select(
        'id, admin_id, export_type, parameters, file_path, status, created_at, completed_at, error_message',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (fetchError) {
      logger.error('Failed to fetch financial exports', {
        component: 'admin-finance-exports',
        action: 'fetch_failed',
      });
      return NextResponse.json({ error: 'Unable to load financial exports' }, { status: 500 });
    }

    return NextResponse.json({
      exports: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching financial exports',
      { component: 'admin-finance-exports', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      // ignore missing body
    }

    const parsed = exportCreateSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { exportType, filters } = parsed.data;

    try {
      let csvContent = '';
      const nowIso = new Date().toISOString();

      if (exportType === 'payments_summary') {
        // Fetch both Stripe payments and manual payments
        const [stripePaymentsResult, manualPaymentsResult] = await Promise.all([
          supabase.from('payments').select(
            `
            id,
            amount,
            amountRefunded,
            status,
            method,
            createdAt,
            processedAt,
            refundedAt,
            booking:bookingId (
              bookingNumber,
              customer:customerId (
                firstName,
                lastName,
                email
              )
            )
          `
          ),
          supabase
            .from('manual_payments')
            .select(
              `
            id,
            booking_id,
            amount,
            currency,
            status,
            method,
            received_at,
            created_at,
            booking:booking_id (
              bookingNumber,
              customer:customer_id (
                firstName,
                lastName,
                email
              )
            )
          `
            )
            .is('deleted_at', null),
        ]);

        if (stripePaymentsResult.error) throw stripePaymentsResult.error;
        if (manualPaymentsResult.error) throw manualPaymentsResult.error;

        // Process Stripe payments
        const stripeRows = (stripePaymentsResult.data ?? []).map((payment: unknown) => {
          const booking =
            (Array.isArray(payment.booking) ? payment.booking[0] : payment.booking) ?? {};
          const customer =
            (Array.isArray(booking.customer) ? booking.customer[0] : booking.customer) ?? {};

          return [
            payment.id,
            booking.bookingNumber ?? 'N/A',
            `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim(),
            Number(payment.amount ?? 0),
            payment.status,
            payment.method || 'credit_card',
            payment.createdAt,
            payment.processedAt ?? '',
            payment.refundedAt ?? '',
            Number(payment.amountRefunded ?? 0),
            'Stripe', // Payment Source
          ];
        });

        // Process manual payments
        const manualRows = (manualPaymentsResult.data ?? []).map((payment: unknown) => {
          const booking =
            (Array.isArray(payment.booking) ? payment.booking[0] : payment.booking) ?? {};
          const customer =
            (Array.isArray(booking.customer) ? booking.customer[0] : booking.customer) ?? {};

          return [
            payment.id,
            booking.bookingNumber ?? payment.booking_id ?? 'N/A',
            `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim(),
            Number(payment.amount ?? 0),
            payment.status,
            payment.method || 'other',
            payment.created_at,
            payment.received_at ?? payment.created_at ?? '',
            '', // No refundedAt for manual payments
            0, // No amountRefunded for manual payments
            'Manual', // Payment Source
          ];
        });

        // Combine both payment types
        const allRows = [...stripeRows, ...manualRows];

        csvContent = buildCsv(
          [
            'Payment ID',
            'Booking Number',
            'Customer',
            'Amount',
            'Status',
            'Method',
            'Created At',
            'Processed At',
            'Refunded At',
            'Amount Refunded',
            'Payment Source',
          ],
          allRows
        );
      } else if (exportType === 'manual_payments') {
        const { data, error: manualError } = await supabase
          .from('manual_payments')
          .select(
            `
            id,
            booking_id,
            amount,
            currency,
            status,
            method,
            received_at,
            created_at,
            recorded_by,
            booking:booking_id (
              bookingNumber
            )
          `
          )
          .is('deleted_at', null);

        if (manualError) throw manualError;

        const rows = (data ?? []).map((payment: unknown) => {
          const booking =
            (Array.isArray(payment.booking) ? payment.booking[0] : payment.booking) ?? {};

          return [
            payment.id,
            booking.bookingNumber ?? payment.booking_id,
            Number(payment.amount ?? 0),
            payment.currency ?? 'CAD',
            payment.status,
            payment.method,
            payment.received_at ?? '',
            payment.created_at,
            payment.recorded_by ?? '',
          ];
        });

        csvContent = buildCsv(
          [
            'Manual Payment ID',
            'Booking',
            'Amount',
            'Currency',
            'Status',
            'Method',
            'Received At',
            'Recorded At',
            'Recorded By',
          ],
          rows
        );
      } else if (exportType === 'accounts_receivable') {
        const { data, error: arError } = await supabase
          .from('bookings')
          .select(
            'id, bookingNumber, customerId, balanceAmount:balance_amount, billingStatus:billing_status, balanceDueAt:balance_due_at'
          )
          .neq('billingStatus', 'balance_paid');

        if (arError) throw arError;

        const customerIds = Array.from(
          new Set((data ?? []).map((booking) => booking.customerId).filter(Boolean))
        );
        let customerMap = new Map<string, { firstName?: string; lastName?: string }>();

        if (customerIds.length > 0) {
          const { data: customers } = await supabase
            .from('users')
            .select('id, firstName, lastName')
            .in('id', customerIds);

          if (customers) {
            customerMap = new Map(
              customers.map((customer) => [
                customer.id as string,
                customer as Record<string, string>,
              ])
            );
          }
        }

        const rows = (data ?? []).map((booking: unknown) => {
          const customer = booking.customerId
            ? customerMap.get(booking.customerId as string)
            : undefined;
          return [
            booking.bookingNumber,
            `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim(),
            Number(booking.balanceAmount ?? 0),
            booking.billingStatus ?? '',
            booking.balanceDueAt ?? '',
          ];
        });

        csvContent = buildCsv(
          ['Booking Number', 'Customer', 'Outstanding Balance', 'Billing Status', 'Balance Due At'],
          rows
        );
      } else if (exportType === 'payout_summary') {
        const { data, error: payoutError } = await supabase
          .from('payout_reconciliations')
          .select(
            'id, stripe_payout_id, arrival_date, amount, currency, status, details, reconciled_by, reconciled_at, created_at'
          )
          .order('arrival_date', { ascending: false });

        if (payoutError) throw payoutError;

        const rows = (data ?? []).map((payout) => [
          payout.stripe_payout_id,
          Number(payout.amount ?? 0),
          payout.currency ?? 'CAD',
          payout.arrival_date ?? '',
          payout.status,
          payout.reconciled_at ?? '',
          payout.reconciled_by ?? '',
        ]);

        csvContent = buildCsv(
          [
            'Stripe Payout ID',
            'Amount',
            'Currency',
            'Arrival Date',
            'Status',
            'Reconciled At',
            'Reconciled By',
          ],
          rows
        );
      } else {
        return NextResponse.json(
          { error: `Unsupported export type: ${exportType}` },
          { status: 400 }
        );
      }

      const serviceClient = await createServiceClient();
      if (!serviceClient) {
        return NextResponse.json(
          { error: 'Service client unavailable for exports' },
          { status: 500 }
        );
      }

      await ensureBucket(serviceClient);

      const fileName = `${exportType}-${Date.now()}.csv`;
      const filePath = `${user?.id || 'unknown'}/${fileName}`;
      const csvBuffer = Buffer.from(csvContent, 'utf-8');

      const uploadResult = await serviceClient.storage.from(BUCKET_ID).upload(filePath, csvBuffer, {
        cacheControl: '3600',
        contentType: 'text/csv',
        upsert: true,
      });

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      const { data: signedUrl, error: signedError } = await serviceClient.storage
        .from(BUCKET_ID)
        .createSignedUrl(filePath, 3600);

      if (signedError) throw signedError;

      const { data: exportRecord, error: insertError } = await supabase
        .from('financial_exports')
        .insert({
          admin_id: user?.id || 'unknown',
          export_type: exportType,
          parameters: filters ?? {},
          file_path: filePath,
          status: 'completed',
          created_at: nowIso,
          completed_at: nowIso,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      logger.info('Financial export generated', {
        component: 'admin-finance-exports',
        action: 'export_success',
        metadata: { exportType, adminId: user?.id || 'unknown', exportId: exportRecord.id },
      });

      return NextResponse.json({
        export: exportRecord,
        downloadUrl: signedUrl?.signedUrl ?? null,
      });
    } catch (err) {
      logger.error(
        'Failed to generate financial export',
        { component: 'admin-finance-exports', action: 'export_failed', metadata: { exportType } },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Unable to generate financial export' }, { status: 500 });
    }
  } catch (err) {
    logger.error(
      'Unexpected error in financial export',
      { component: 'admin-finance-exports', action: 'unexpected_error' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
