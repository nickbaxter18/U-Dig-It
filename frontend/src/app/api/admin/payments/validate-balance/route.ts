import { NextRequest, NextResponse } from 'next/server';

import { rateLimit } from '@/lib/rate-limiter';
import { RateLimitPresets } from '@/lib/rate-limiter';
import { requireAdminServer } from '@/lib/supabase/requireAdminServer';
import { validateBookingBalance } from '@/lib/booking/balance-validator';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/payments/validate-balance?bookingId=xxx
 *
 * Validates balance for a single booking
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

    // Get booking ID from query params
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId query parameter is required' },
        { status: 400 }
      );
    }

    // Validate balance
    const result = await validateBookingBalance(bookingId);

    if (!result) {
      return NextResponse.json(
        { error: 'Booking not found or validation failed' },
        { status: 404 }
      );
    }

    logger.info('Balance validation completed', {
      component: 'api-validate-balance',
      action: 'validation_complete',
      metadata: {
        bookingId,
        isValid: result.isValid,
        discrepancy: result.discrepancy,
      },
    });

    return NextResponse.json({
      success: true,
      validation: result,
    });
  } catch (error) {
    logger.error(
      'Error validating balance',
      {
        component: 'api-validate-balance',
        action: 'validation_error',
      },
      error instanceof Error ? error : undefined
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


