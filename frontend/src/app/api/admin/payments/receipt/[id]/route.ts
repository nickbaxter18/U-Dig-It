import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import {
  ReceiptGenerationError,
  generatePaymentReceiptHtml,
} from '@/lib/receipts/generate-payment-receipt';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

/**
 * GET /api/admin/payments/receipt/[id]
 * Generate and download payment receipt as HTML (admin only)
 */
export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    // Declare paymentId outside try block for error handler access
    let paymentId: string | undefined;
    try {
      // Handle params as either Promise or direct object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      paymentId = resolvedParams?.id;

      logger.debug?.('payments-receipt-api: incoming params', {
        component: 'admin-payments-receipt',
        action: 'request_received',
        metadata: { paymentId },
      });

      if (
        !paymentId ||
        paymentId === 'undefined' ||
        paymentId === 'null' ||
        typeof paymentId !== 'string'
      ) {
        logger.warn('Invalid payment ID in admin receipt request', {
          component: 'admin-payments-receipt',
          action: 'invalid_payment_id',
          metadata: { paymentId },
        });
        return NextResponse.json({ error: 'A valid payment ID is required.' }, { status: 400 });
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(paymentId)) {
        logger.warn('Invalid payment ID format in admin receipt request', {
          component: 'admin-payments-receipt',
          action: 'invalid_payment_id_format',
          metadata: { paymentId },
        });
        return NextResponse.json({ error: 'Invalid payment ID format.' }, { status: 400 });
      }

      const { error } = await requireAdmin(request);
      if (error) return error;

      const { html, filename } = await generatePaymentReceiptHtml(paymentId, {
        allowStripeLookup: true,
      });

      const mode = request.nextUrl.searchParams.get('mode');
      const dispositionType = mode === 'inline' ? 'inline' : 'attachment';

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `${dispositionType}; filename="${filename}"`,
        },
      });
    } catch (error) {
      const status = error instanceof ReceiptGenerationError ? error.status : 500;

      if (status === 404) {
        logger.warn('Payment receipt not found (admin)', {
          component: 'admin-payments-receipt',
          action: 'not_found',
          metadata: { paymentId },
        });
      } else {
        logger.error(
          'Receipt generation error (admin)',
          {
            component: 'admin-payments-receipt',
            action: 'error',
            metadata: {
              status,
              paymentId,
              errorName: error instanceof Error ? error.name : typeof error,
              errorMessage: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined,
            },
          },
          error instanceof Error ? error : new Error(String(error))
        );
      }

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Internal server error',
          details:
            process.env.NODE_ENV === 'development' && error instanceof Error
              ? error.message
              : undefined,
        },
        { status }
      );
    }
  }
);
