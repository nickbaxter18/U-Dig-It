import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { generateInvoiceHtml } from '@/lib/invoice-html-generator';

/**
 * GET /api/admin/bookings/[id]/invoice
 * Generate and display a booking invoice (not a receipt - no payment details)
 */
export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    let bookingId: string | undefined;
    try {
      // Handle params as either Promise or direct object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      bookingId = resolvedParams?.id;

      if (
        !bookingId ||
        bookingId === 'undefined' ||
        bookingId === 'null' ||
        typeof bookingId !== 'string'
      ) {
        logger.warn('Invalid booking ID in invoice request', {
          component: 'admin-bookings-invoice',
          action: 'invalid_booking_id',
          metadata: { bookingId },
        });
        return NextResponse.json({ error: 'A valid booking ID is required.' }, { status: 400 });
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(bookingId)) {
        logger.warn('Invalid booking ID format in invoice request', {
          component: 'admin-bookings-invoice',
          action: 'invalid_booking_id_format',
          metadata: { bookingId },
        });
        return NextResponse.json({ error: 'Invalid booking ID format.' }, { status: 400 });
      }

      const { error } = await requireAdmin(request);
      if (error) return error;

      const supabase = await createServiceClient();

      if (!supabase) {
        logger.error('Failed to create Supabase service client', {
          component: 'admin-bookings-invoice',
          action: 'service_client_error',
          metadata: { bookingId },
        });
        return NextResponse.json(
          { error: 'Service unavailable. Please try again.' },
          { status: 503 }
        );
      }

      // Fetch booking with all related data including payments
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(
          `
          id,
          bookingNumber,
          createdAt,
          startDate,
          endDate,
          subtotal,
          taxes,
          totalAmount,
          balance_amount,
          dailyRate,
          floatFee,
          deliveryFee,
          distanceKm,
          waiver_selected,
          waiver_rate_cents,
          couponCode,
          couponType,
          couponValue,
          couponDiscount,
          deliveryAddress,
          deliveryCity,
          deliveryProvince,
          deliveryPostalCode,
          customer:customerId (
            email,
            firstName,
            lastName,
            companyName,
            phone
          ),
          equipment:equipmentId (
            make,
            model,
            type,
            unitId,
            serialNumber
          ),
          payments (
            id,
            paymentNumber,
            amount,
            status,
            type,
            method,
            processedAt,
            createdAt
          ),
          manual_payments (
            id,
            amount,
            status,
            method,
            received_at,
            created_at
          )
        `
        )
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        logger.error('Booking not found for invoice', {
          component: 'admin-bookings-invoice',
          action: 'booking_not_found',
          metadata: { bookingId, error: bookingError?.message },
        });
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
      }

      // Normalize booking data (Supabase relations might be arrays)
      // Combine payments and manual_payments into a single payments array
      const regularPayments = Array.isArray(booking.payments) ? booking.payments : (booking.payments ? [booking.payments] : []);
      const manualPayments = Array.isArray(booking.manual_payments) ? booking.manual_payments : (booking.manual_payments ? [booking.manual_payments] : []);

      // Convert manual payments to payment format for consistency
      const convertedManualPayments = manualPayments.map((mp: any) => ({
        id: mp.id,
        paymentNumber: null,
        amount: mp.amount,
        status: mp.status,
        type: 'payment',
        method: mp.method,
        processedAt: mp.received_at || mp.created_at,
        createdAt: mp.created_at,
      }));

      const normalizedBooking = {
        ...booking,
        customer: Array.isArray(booking.customer) ? booking.customer[0] : booking.customer,
        equipment: Array.isArray(booking.equipment) ? booking.equipment[0] : booking.equipment,
        payments: [...regularPayments, ...convertedManualPayments],
      };

      // Generate invoice HTML (with payment details)
      let html: string;
      try {
        html = generateInvoiceHtml(normalizedBooking);
      } catch (htmlError) {
        logger.error(
          'Failed to generate invoice HTML',
          {
            component: 'admin-bookings-invoice',
            action: 'html_generation_error',
            metadata: {
              bookingId,
              error: htmlError instanceof Error ? htmlError.message : String(htmlError),
              stack: htmlError instanceof Error ? htmlError.stack : undefined,
            },
          },
          htmlError instanceof Error ? htmlError : new Error(String(htmlError))
        );
        throw htmlError; // Re-throw to be caught by outer catch
      }

      const mode = request.nextUrl.searchParams.get('mode');
      const dispositionType = mode === 'inline' ? 'inline' : 'attachment';
      const filename = `invoice-${booking.bookingNumber || bookingId}.html`;

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `${dispositionType}; filename="${filename}"`,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error(
        'Failed to generate invoice',
        {
          component: 'admin-bookings-invoice',
          action: 'invoice_generation_error',
          metadata: {
            bookingId,
            error: errorMessage,
            stack: errorStack,
            errorType: error?.constructor?.name,
          },
        },
        error instanceof Error ? error : new Error(String(error))
      );

      return NextResponse.json(
        {
          error: 'Failed to generate invoice. Please try again.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }
  }
);


