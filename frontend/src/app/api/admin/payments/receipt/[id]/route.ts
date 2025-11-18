import { logger } from '@/lib/logger';
import {
  generatePaymentReceiptHtml,
  ReceiptGenerationError,
} from '@/lib/receipts/generate-payment-receipt';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/payments/receipt/[id]
 * Generate and download payment receipt as HTML (admin only)
 */
export async function GET(
  request: NextRequest,
  context: { params?: { id?: string } },
) {
  try {
    logger.debug?.('payments-receipt-api: incoming params', {
      component: 'admin-payments-receipt',
      action: 'request_received',
      metadata: { id: context?.params?.id },
    });

    const idFromContext = context?.params?.id;
    const idFromPath = request.nextUrl.pathname.split('/').filter(Boolean).pop();
    const id = idFromContext ?? idFromPath;

    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'A valid payment ID is required.' },
        { status: 400 },
      );
    }

    const { error } = await requireAdmin(request);
    if (error) return error;

    const { html, filename } = await generatePaymentReceiptHtml(id, {
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
    logger.error(
      'Receipt generation error (admin)',
      {
        component: 'payments-receipt-api',
        action: 'error',
        metadata: { status },
      },
      error instanceof Error ? error : new Error(String(error)),
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status },
    );
  }
}

