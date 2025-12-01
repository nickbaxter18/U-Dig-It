import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { createClient } from '@/lib/supabase/server';
import { generateInvoiceHtml } from '@/lib/invoice-html-generator';

/**
 * GET /api/bookings/[id]/invoice
 * Generate and display a booking invoice for the authenticated customer
 * Customers can only view invoices for their own bookings
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
        logger.warn('Invalid booking ID in customer invoice request', {
          component: 'customer-bookings-invoice',
          action: 'invalid_booking_id',
          metadata: { bookingId },
        });
        return NextResponse.json({ error: 'A valid booking ID is required.' }, { status: 400 });
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(bookingId)) {
        logger.warn('Invalid booking ID format in customer invoice request', {
          component: 'customer-bookings-invoice',
          action: 'invalid_booking_id_format',
          metadata: { bookingId },
        });
        return NextResponse.json({ error: 'Invalid booking ID format.' }, { status: 400 });
      }

      const supabase = await createClient();

      if (!supabase) {
        logger.error('Failed to create Supabase client', {
          component: 'customer-bookings-invoice',
          action: 'supabase_client_error',
          metadata: { bookingId },
        });
        return NextResponse.json(
          { error: 'Service unavailable. Please try again.' },
          { status: 503 }
        );
      }

      // Verify authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.warn('Unauthenticated invoice request', {
          component: 'customer-bookings-invoice',
          action: 'unauthorized',
          metadata: { bookingId },
        });
        return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
      }

      // Fetch booking with all related data (RLS will ensure user can only see their own bookings)
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
          customerId,
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
          )
        `
        )
        .eq('id', bookingId)
        .eq('customerId', user.id) // Additional security check
        .single();

      if (bookingError || !booking) {
        logger.error('Booking not found or access denied for invoice', {
          component: 'customer-bookings-invoice',
          action: 'booking_not_found_or_denied',
          metadata: { bookingId, userId: user.id, error: bookingError?.message },
        });
        return NextResponse.json(
          { error: 'Invoice not found or access denied.' },
          { status: 404 }
        );
      }

      // Normalize booking data (Supabase relations might be arrays)
      const normalizedBooking = {
        ...booking,
        customer: Array.isArray(booking.customer) ? booking.customer[0] : booking.customer,
        equipment: Array.isArray(booking.equipment) ? booking.equipment[0] : booking.equipment,
      };

      // Generate invoice HTML
      let html: string;
      try {
        html = generateInvoiceHtml(normalizedBooking);
      } catch (htmlError) {
        logger.error(
          'Failed to generate invoice HTML',
          {
            component: 'customer-bookings-invoice',
            action: 'html_generation_error',
            metadata: {
              bookingId,
              error: htmlError instanceof Error ? htmlError.message : String(htmlError),
              stack: htmlError instanceof Error ? htmlError.stack : undefined,
            },
          },
          htmlError instanceof Error ? htmlError : new Error(String(htmlError))
        );
        throw htmlError;
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
          component: 'customer-bookings-invoice',
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




