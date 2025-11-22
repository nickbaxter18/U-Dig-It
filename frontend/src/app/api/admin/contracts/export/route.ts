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
    const statusFilter = searchParams.get('status') ?? 'all';
    const typeFilter = searchParams.get('type') ?? 'all';
    const bookingId = searchParams.get('bookingId');
    const searchTerm = (searchParams.get('search') ?? '').trim().toLowerCase();

    let query = supabase
      .from('contracts')
      .select(
        `
        id,
        contractNumber,
        bookingId,
        type,
        status,
        sentAt,
        signedAt,
        expiresAt,
        createdAt,
        updatedAt,
        booking:bookingId (
          bookingNumber,
          startDate,
          endDate,
          totalAmount,
          customer:customerId (
            firstName,
            lastName,
            email
          ),
          equipment:equipmentId (
            make,
            model
          )
        )
      `
      )
      .order('createdAt', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }

    if (bookingId) {
      query = query.eq('bookingId', bookingId);
    }

    const { data, error: queryError } = await query;
    if (queryError) throw queryError;

    const contracts = (data ?? []).map((contract: unknown) => {
      const booking = contract.booking ?? {};
      const customer =
        (Array.isArray(booking.customer) ? booking.customer[0] : booking.customer) ?? {};
      const equipment =
        (Array.isArray(booking.equipment) ? booking.equipment[0] : booking.equipment) ?? {};
      const equipmentName =
        equipment.make && equipment.model
          ? `${equipment.make} ${equipment.model}`
          : equipment.make || equipment.model || 'N/A';

      return {
        contractNumber: contract.contractNumber ?? contract.id,
        bookingNumber: booking.bookingNumber ?? '',
        customerName: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Unknown',
        customerEmail: customer.email ?? '',
        equipmentName,
        status: contract.status ?? 'unknown',
        type: contract.type ?? 'unknown',
        totalAmount:
          booking.totalAmount !== undefined && booking.totalAmount !== null
            ? Number(booking.totalAmount)
            : null,
        sentAt: contract.sentAt ? new Date(contract.sentAt) : null,
        signedAt: contract.signedAt ? new Date(contract.signedAt) : null,
        expiresAt: contract.expiresAt ? new Date(contract.expiresAt) : null,
        createdAt: contract.createdAt ? new Date(contract.createdAt) : null,
        bookingStart: booking.startDate ? new Date(booking.startDate) : null,
        bookingEnd: booking.endDate ? new Date(booking.endDate) : null,
      };
    });

    const filteredContracts = contracts.filter((contract) => {
      if (searchTerm) {
        const matchesSearch =
          contract.contractNumber.toLowerCase().includes(searchTerm) ||
          contract.bookingNumber.toLowerCase().includes(searchTerm) ||
          contract.customerName.toLowerCase().includes(searchTerm) ||
          contract.customerEmail.toLowerCase().includes(searchTerm);
        if (!matchesSearch) {
          return false;
        }
      }
      return true;
    });

    const header = [
      'Contract Number',
      'Booking Number',
      'Customer Name',
      'Customer Email',
      'Equipment',
      'Status',
      'Type',
      'Booking Start',
      'Booking End',
      'Total Amount (CAD)',
      'Sent At',
      'Signed At',
      'Expires At',
      'Created At',
    ];

    const rows = filteredContracts.map((contract) => [
      contract.contractNumber,
      contract.bookingNumber,
      contract.customerName,
      contract.customerEmail,
      contract.equipmentName,
      contract.status,
      contract.type,
      contract.bookingStart ? contract.bookingStart.toLocaleDateString() : '',
      contract.bookingEnd ? contract.bookingEnd.toLocaleDateString() : '',
      contract.totalAmount !== null && contract.totalAmount !== undefined
        ? contract.totalAmount.toFixed(2)
        : '0.00',
      contract.sentAt ? contract.sentAt.toLocaleString() : '',
      contract.signedAt ? contract.signedAt.toLocaleString() : '',
      contract.expiresAt ? contract.expiresAt.toLocaleDateString() : '',
      contract.createdAt ? contract.createdAt.toLocaleString() : '',
    ]);

    const csvContent = [header, ...rows].map((row) => row.map(formatCsvValue).join(',')).join('\n');
    const filename = `contracts-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error(
      'Contracts export failed',
      {
        component: 'admin-contracts-api',
        action: 'export_failed',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Failed to export contracts' }, { status: 500 });
  }
});
