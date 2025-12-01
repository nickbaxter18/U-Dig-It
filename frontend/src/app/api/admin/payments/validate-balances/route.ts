import { NextRequest, NextResponse } from 'next/server';

import { rateLimit } from '@/lib/rate-limiter';
import { RateLimitPresets } from '@/lib/rate-limiter';
import { requireAdminServer } from '@/lib/supabase/requireAdminServer';
import { validateMultipleBalances, getBalanceValidationLogs } from '@/lib/booking/balance-validator';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/payments/validate-balances
 *
 * Validates balances for all bookings or a subset
 *
 * Request body (optional):
 * {
 *   bookingIds?: string[], // If provided, only validate these bookings
 *   limit?: number,         // Max bookings to validate (default: 100)
 *   minDiscrepancy?: number // Minimum discrepancy to report (default: 0.01)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Admin authentication
    const { supabase, user, error: authError } = await requireAdminServer();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { bookingIds, limit = 100, minDiscrepancy = 0.01 } = body;

    let results;

    if (bookingIds && Array.isArray(bookingIds)) {
      // Validate specific bookings
      results = await validateMultipleBalances(bookingIds);
    } else {
      // Validate all bookings (up to limit)
      const serviceClient = createServiceClient();
      const { data: bookings, error } = await serviceClient
        .from('bookings')
        .select('id')
        .limit(limit);

      if (error) {
        logger.error(
          'Failed to fetch bookings for validation',
          {
            component: 'api-validate-balances',
            action: 'fetch_bookings',
            metadata: { error: error.message },
          },
          error
        );
        return NextResponse.json(
          { error: 'Failed to fetch bookings' },
          { status: 500 }
        );
      }

      const ids = (bookings || []).map((b) => b.id);
      results = await validateMultipleBalances(ids);
    }

    // Filter by minimum discrepancy
    const discrepancies = results.filter(
      (r) => Math.abs(r.discrepancy) >= minDiscrepancy
    );

    const summary = {
      totalValidated: results.length,
      valid: results.filter((r) => r.isValid).length,
      invalid: results.filter((r) => !r.isValid).length,
      discrepancies: discrepancies.length,
      totalDiscrepancy: discrepancies.reduce(
        (sum, r) => sum + Math.abs(r.discrepancy),
        0
      ),
      results: discrepancies, // Only return bookings with discrepancies
    };

    logger.info('Bulk balance validation completed', {
      component: 'api-validate-balances',
      action: 'bulk_validation_complete',
      metadata: {
        totalValidated: summary.totalValidated,
        invalid: summary.invalid,
        discrepancies: summary.discrepancies,
      },
    });

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    logger.error(
      'Error validating balances',
      {
        component: 'api-validate-balances',
        action: 'bulk_validation_error',
      },
      error instanceof Error ? error : undefined
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/payments/validate-balances
 *
 * Get recent balance validation logs
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Admin authentication
    const { supabase, user, error: authError } = await requireAdminServer();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const minDiscrepancy = parseFloat(searchParams.get('minDiscrepancy') || '0.01');

    const logs = await getBalanceValidationLogs(limit, minDiscrepancy);

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    logger.error(
      'Error fetching validation logs',
      {
        component: 'api-validate-balances',
        action: 'get_logs_error',
      },
      error instanceof Error ? error : undefined
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


