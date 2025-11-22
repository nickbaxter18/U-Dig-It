import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

function formatCsvValue(value: unknown) {
  const asString = value === null || value === undefined ? '' : String(value);
  return `"${asString.replace(/"/g, '""')}"`;
}

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const typeFilter = searchParams.get('type');

    let query = supabase
      .from('insurance_documents')
      .select(
        `
        documentNumber,
        bookingId,
        type,
        status,
        insuranceCompany,
        policyNumber,
        generalLiabilityLimit,
        equipmentLimit,
        effectiveDate,
        expiresAt,
        reviewedAt,
        reviewedBy,
        reviewNotes,
        createdAt,
        booking:bookingId (
          bookingNumber,
          customer:customerId (
            firstName,
            lastName,
            email
          )
        )
      `
      )
      .order('createdAt', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }

    const { data, error: queryError } = await query;
    if (queryError) throw queryError;

    const header = [
      'Document Number',
      'Booking Number',
      'Customer Name',
      'Customer Email',
      'Type',
      'Status',
      'Insurance Company',
      'Policy Number',
      'General Liability Limit',
      'Equipment Limit',
      'Effective Date',
      'Expires At',
      'Reviewed By',
      'Reviewed At',
      'Notes',
      'Created At',
    ];

    const rows = (data ?? []).map((record: unknown) => {
      const booking = record.booking ?? {};
      const customer =
        (Array.isArray(booking.customer) ? booking.customer[0] : booking.customer) ?? {};
      const customerName =
        `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Unknown';

      return [
        record.documentNumber ?? 'N/A',
        booking.bookingNumber ?? record.bookingId ?? 'N/A',
        customerName,
        customer.email ?? '',
        record.type ?? 'unknown',
        record.status ?? 'unknown',
        record.insuranceCompany ?? '',
        record.policyNumber ?? '',
        record.generalLiabilityLimit !== null && record.generalLiabilityLimit !== undefined
          ? Number(record.generalLiabilityLimit).toFixed(2)
          : '',
        record.equipmentLimit !== null && record.equipmentLimit !== undefined
          ? Number(record.equipmentLimit).toFixed(2)
          : '',
        record.effectiveDate ? new Date(record.effectiveDate).toLocaleDateString() : '',
        record.expiresAt ? new Date(record.expiresAt).toLocaleDateString() : '',
        record.reviewedBy ?? '',
        record.reviewedAt ? new Date(record.reviewedAt).toLocaleDateString() : '',
        record.reviewNotes ?? '',
        record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '',
      ];
    });

    const csvContent = [header, ...rows].map((row) => row.map(formatCsvValue).join(',')).join('\n');
    const filename = `insurance-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error(
      'Insurance export failed',
      {
        component: 'admin-insurance-api',
        action: 'export_failed',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Failed to export insurance documents' }, { status: 500 });
  }
});
