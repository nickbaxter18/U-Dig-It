import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

/**
 * GET /api/admin/contracts
 * Fetch all rental contracts with booking and customer information
 *
 * Admin-only endpoint
 */
export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const bookingIdParam = searchParams.get('booking');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    // 3. Fetch contracts with related booking data
    let query = supabase
      .from('contracts')
      .select(
        `
        id,
        "contractNumber",
        "bookingId",
        type,
        status,
        "docusignEnvelopeId",
        "documentUrl",
        "signedDocumentUrl",
        "sentAt",
        "signedAt",
        "completedAt",
        "createdAt",
        "updatedAt",
        booking:bookingId (
          id,
          bookingNumber,
          startDate,
          endDate,
          totalAmount,
          customer:customerId (
            id,
            firstName,
            lastName,
            email
          ),
          equipment:equipmentId (
            make,
            model
          )
        )
      `,
        { count: 'exact' }
      )
      .order('createdAt', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (bookingIdParam) {
      query = query.eq('bookingId', bookingIdParam);
    }

    const { data: contractsData, error: contractsError, count } = await query;

    if (contractsError) throw contractsError;

    // 4. Transform to match frontend interface
    const contracts = (contractsData || []).map((contract: unknown) => {
      const booking = contract.booking || {};
      const customer = booking.customer || {};
      const equipment = booking.equipment || {};

      return {
        id: contract.id,
        contractNumber: contract.contractNumber,
        bookingId: contract.bookingId,
        type: contract.type,
        status: contract.status,
        documentUrl: contract.documentUrl,
        signedDocumentUrl: contract.signedDocumentUrl,
        booking: {
          id: booking.id || '',
          bookingNumber: booking.bookingNumber || 'N/A',
          customer: {
            name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown',
            email: customer.email || 'N/A',
          },
          equipment: {
            name: `${equipment.make || ''} ${equipment.model || ''}`.trim() || 'Unknown Equipment',
            model: equipment.model || 'N/A',
          },
          startDate: booking.startDate,
          endDate: booking.endDate,
          total: parseFloat(booking.totalAmount || '0'),
        },
        sentAt: contract.sentAt,
        signedAt: contract.signedAt,
        completedAt: contract.completedAt,
        docusignEnvelopeId: contract.docusignEnvelopeId,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
      };
    });

    logger.info('Contracts fetched', {
      component: 'admin-contracts-api',
      action: 'fetch_success',
      metadata: {
        count: contracts.length,
        total: count ?? 0,
      },
    });

    return NextResponse.json({
      contracts,
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (error: unknown) {
    logger.error(
      'Contracts API error',
      {
        component: 'admin-contracts-api',
        action: 'error',
      },
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
});
