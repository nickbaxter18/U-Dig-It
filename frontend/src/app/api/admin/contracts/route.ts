import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/contracts
 * Fetch all rental contracts with booking and customer information
 *
 * Admin-only endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const bookingIdParam = searchParams.get('booking');

    // 3. Fetch contracts with related booking data
    let query = supabase
      .from('contracts')
      .select(`
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
      `)
      .order('createdAt', { ascending: false });

    if (bookingIdParam) {
      query = query.eq('bookingId', bookingIdParam);
    }

    const { data: contractsData, error: contractsError } = await query;

    if (contractsError) throw contractsError;

    // 4. Transform to match frontend interface
    const contracts = (contractsData || []).map((contract: any) => {
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
      },
    });

    return NextResponse.json({
      contracts,
      total: contracts.length,
    });
  } catch (error: any) {
    logger.error('Contracts API error', {
      component: 'admin-contracts-api',
      action: 'error',
    }, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}







