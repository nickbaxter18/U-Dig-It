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
    const searchTerm = (searchParams.get('search') || '').trim().toLowerCase();
    const statusFilter = searchParams.get('status') || 'all';
    const typeFilter = searchParams.get('type') || 'all';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    // When searching, fetch more results to allow proper server-side filtering
    const defaultPageSize = searchTerm ? 1000 : 20;
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || String(defaultPageSize), 10), 1), 1000);
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

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }

    const { data: contractsData, error: contractsError, count } = await query;

    if (contractsError) throw contractsError;

    // 4. Transform to match frontend interface
    let contracts = (contractsData || []).map((contract: unknown) => {
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
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
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

    // 5. Apply server-side search filtering if search term provided
    if (searchTerm) {
      contracts = contracts.filter((contract) => {
        const contractNumber = contract.contractNumber?.toString() || '';
        const bookingNumber = contract.booking?.bookingNumber?.toString() || '';
        const customerFirstName = contract.booking?.customer?.firstName?.toString().toLowerCase() || '';
        const customerLastName = contract.booking?.customer?.lastName?.toString().toLowerCase() || '';
        const customerFullName = `${customerFirstName} ${customerLastName}`.trim();
        const customerEmail = contract.booking?.customer?.email?.toString().toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase().trim();

        // Helper function to check if search term matches at word boundaries
        const matchesWordBoundary = (text: string, search: string): boolean => {
          if (!text || !search) return false;
          // Split into words and check if any word starts with the search term
          const words = text.split(/\s+/);
          return words.some(word => word.startsWith(search));
        };

        // Check contract number and booking number (exact substring match is fine)
        if (contractNumber.toLowerCase().includes(searchLower) ||
            bookingNumber.toLowerCase().includes(searchLower)) {
          return true;
        }

        // Check email (exact substring match is fine)
        if (customerEmail.includes(searchLower)) {
          return true;
        }

        // For customer name, use word-boundary matching to avoid false positives
        // Check if search term matches at the start of firstName or lastName
        if (customerFirstName.startsWith(searchLower) ||
            customerLastName.startsWith(searchLower) ||
            matchesWordBoundary(customerFullName, searchLower)) {
          return true;
        }

        return false;
      });
    }

    // 6. Apply pagination to filtered results if search was performed
    const totalFilteredCount = contracts.length;
    let paginatedContracts = contracts;
    if (searchTerm && pageSize < totalFilteredCount) {
      paginatedContracts = contracts.slice(rangeStart, rangeEnd + 1);
    }

    logger.info('Contracts fetched', {
      component: 'admin-contracts-api',
      action: 'fetch_success',
      metadata: {
        count: paginatedContracts.length,
        total: searchTerm ? totalFilteredCount : count ?? 0,
        searchTerm: searchTerm || undefined,
      },
    });

    return NextResponse.json({
      contracts: paginatedContracts,
      pagination: {
        page,
        pageSize,
        total: searchTerm ? totalFilteredCount : count ?? 0,
        totalPages: Math.ceil((searchTerm ? totalFilteredCount : count ?? 0) / pageSize),
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
