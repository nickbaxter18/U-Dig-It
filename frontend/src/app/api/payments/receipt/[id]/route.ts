import { logger } from '@/lib/logger';
import {
  generatePaymentReceiptHtml,
  ReceiptGenerationError,
} from '@/lib/receipts/generate-payment-receipt';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/payments/receipt/[id]
 * Generate and display a payment receipt for the authenticated customer.
 */
export async function GET(
  request: NextRequest,
  context: { params?: { id?: string } },
) {
  try {
    const idFromContext = context?.params?.id;
    const idFromPath = request.nextUrl.pathname.split('/').filter(Boolean).pop();
    const id = idFromContext ?? idFromPath;

    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'A valid payment ID is required.' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { html, filename } = await generatePaymentReceiptHtml(id, {
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
      });
    } else if (status !== 404) {
      logger.error(
        'Customer receipt generation error',
        {
          component: 'customer-payments-receipt-api',
          action: 'error',
          metadata: { status },
        },
        error instanceof Error ? error : new Error(String(error)),
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status },
    );
  }
}
