import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import {
  ReceiptGenerationError,
  generatePaymentReceiptHtml,
} from '@/lib/receipts/generate-payment-receipt';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/payments/receipt/[id]
 * Generate and display a payment receipt for the authenticated customer.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Declare paymentId outside try block for error handler access
  let paymentId: string | undefined;
  try {
    // Handle params as either Promise or direct object (Next.js 16 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    paymentId = resolvedParams?.id;

    if (
      !paymentId ||
      paymentId === 'undefined' ||
      paymentId === 'null' ||
      typeof paymentId !== 'string'
    ) {
      logger.warn('Invalid payment ID in customer receipt request', {
        component: 'customer-payments-receipt-api',
        action: 'invalid_payment_id',
        metadata: { paymentId },
      });
      return NextResponse.json({ error: 'A valid payment ID is required.' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paymentId)) {
      logger.warn('Invalid payment ID format in customer receipt request', {
        component: 'customer-payments-receipt-api',
        action: 'invalid_payment_id_format',
        metadata: { paymentId },
      });
      return NextResponse.json({ error: 'Invalid payment ID format.' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { html, filename } = await generatePaymentReceiptHtml(paymentId, {
      allowStripeLookup: true,
      userId: user.id,
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    const status = error instanceof ReceiptGenerationError ? error.status : 500;

    if (status === 403) {
      logger.warn('Customer attempted to access receipt without permission', {
        component: 'customer-payments-receipt-api',
        action: 'forbidden',
        metadata: { paymentId },
      });
    } else if (status !== 404) {
      logger.error(
        'Customer receipt generation error',
        {
          component: 'customer-payments-receipt-api',
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
    } else {
      logger.warn('Payment receipt not found', {
        component: 'customer-payments-receipt-api',
        action: 'not_found',
        metadata: { paymentId },
      });
    }

    // Return user-friendly error messages
    let errorMessage = 'Internal server error';
    if (error instanceof ReceiptGenerationError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      // For non-ReceiptGenerationError, provide generic message in production
      errorMessage =
        process.env.NODE_ENV === 'development' ? error.message : 'Unable to generate receipt';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? {
                message: error.message,
                name: error.name,
                stack: error.stack,
              }
            : undefined,
      },
      { status }
    );
  }
}
