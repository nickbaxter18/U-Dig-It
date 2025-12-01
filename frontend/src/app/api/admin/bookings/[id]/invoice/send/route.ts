import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { sendAdminEmail } from '@/lib/sendgrid';
import { renderEmailLayout, escapeHtml } from '@/lib/email-template';
import { generateInvoiceEmailHtml } from '@/lib/invoice-email-html';
import { calculateInvoiceTotals } from '@/lib/invoice-calculations';
import type { InvoiceBookingData } from '@/lib/invoice-html-generator';
import { generateInvoicePaymentToken } from '@/app/api/invoices/[bookingId]/pay/route';

/**
 * POST /api/admin/bookings/[id]/invoice/send
 * Send invoice via email to the customer
 */
export const POST = withRateLimit(
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
        logger.warn('Invalid booking ID in invoice send request', {
          component: 'admin-bookings-invoice-send',
          action: 'invalid_booking_id',
          metadata: { bookingId },
        });
        return NextResponse.json({ error: 'A valid booking ID is required.' }, { status: 400 });
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(bookingId)) {
        logger.warn('Invalid booking ID format in invoice send request', {
          component: 'admin-bookings-invoice-send',
          action: 'invalid_booking_id_format',
          metadata: { bookingId },
        });
        return NextResponse.json({ error: 'Invalid booking ID format.' }, { status: 400 });
      }

      // Require admin access
      const adminResult = await requireAdmin(request);
      if (adminResult.error) {
        logger.error('Admin authentication failed in invoice send route', {
          component: 'admin-bookings-invoice-send',
          action: 'require_admin_failed',
          metadata: {
            bookingId,
            errorResponse: adminResult.error instanceof NextResponse ? 'NextResponse with error' : 'Unknown error',
            status: adminResult.error instanceof NextResponse ? adminResult.error.status : 'unknown',
          },
        });
        return adminResult.error;
      }

      const supabase = adminResult.supabase;

      if (!supabase) {
        logger.error('Failed to get Supabase client', {
          component: 'admin-bookings-invoice-send',
          action: 'supabase_client_error',
          metadata: { bookingId },
        });
        return NextResponse.json(
          { error: 'Service unavailable. Please try again.' },
          { status: 503 }
        );
      }

      // Fetch booking with all related data
      let booking;
      try {
        const bookingResult = await supabase
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

        if (bookingResult.error) {
          logger.error('Booking fetch error for invoice send', {
            component: 'admin-bookings-invoice-send',
            action: 'booking_fetch_error',
            metadata: {
              bookingId,
              error: bookingResult.error.message,
              code: bookingResult.error.code,
              details: bookingResult.error.details,
              hint: bookingResult.error.hint,
            },
          });
          return NextResponse.json({
            error: 'Booking not found.',
            details: process.env.NODE_ENV === 'development' ? bookingResult.error.message : undefined
          }, { status: 404 });
        }

        if (!bookingResult.data) {
          logger.error('Booking data is null for invoice send', {
            component: 'admin-bookings-invoice-send',
            action: 'booking_data_null',
            metadata: { bookingId },
          });
          return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
        }

        booking = bookingResult.data;
      } catch (fetchError) {
        logger.error('Exception fetching booking for invoice send', {
          component: 'admin-bookings-invoice-send',
          action: 'booking_fetch_exception',
          metadata: {
            bookingId,
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            stack: fetchError instanceof Error ? fetchError.stack : undefined,
          },
        }, fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
        return NextResponse.json({
          error: 'Failed to fetch booking.',
          details: process.env.NODE_ENV === 'development' ? (fetchError instanceof Error ? fetchError.message : String(fetchError)) : undefined
        }, { status: 500 });
      }

      // Normalize booking data (Supabase relations might be arrays or objects)
      let customer: {
        email: string;
        firstName: string;
        lastName: string;
        companyName?: string | null;
        phone?: string | null;
      } | null = null;

      if (booking.customer) {
        // Handle array or object
        const customerData = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
        if (customerData && typeof customerData === 'object' && 'email' in customerData) {
          customer = customerData as typeof customer;
        }
      }

      if (!customer || !customer.email) {
        logger.error('Customer email not found for invoice send', {
          component: 'admin-bookings-invoice-send',
          action: 'customer_email_not_found',
          metadata: {
            bookingId,
            customerData: booking.customer,
            customerType: typeof booking.customer,
            isArray: Array.isArray(booking.customer),
          },
        });
        return NextResponse.json({
          error: 'Customer email not found.',
          details: process.env.NODE_ENV === 'development' ? 'Customer data is missing or invalid' : undefined
        }, { status: 404 });
      }

      // Normalize booking data for invoice generation
      const normalizedBooking: InvoiceBookingData = {
        bookingNumber: booking.bookingNumber,
        createdAt: booking.createdAt,
        startDate: booking.startDate,
        endDate: booking.endDate,
        subtotal: booking.subtotal,
        taxes: booking.taxes,
        totalAmount: booking.totalAmount,
        balance_amount: booking.balance_amount,
        dailyRate: booking.dailyRate,
        floatFee: booking.floatFee,
        deliveryFee: booking.deliveryFee,
        distanceKm: booking.distanceKm,
        waiver_selected: booking.waiver_selected,
        waiver_rate_cents: booking.waiver_rate_cents,
        couponCode: booking.couponCode,
        couponType: booking.couponType,
        couponValue: booking.couponValue,
        couponDiscount: booking.couponDiscount,
        deliveryAddress: booking.deliveryAddress,
        deliveryCity: booking.deliveryCity,
        deliveryProvince: booking.deliveryProvince,
        deliveryPostalCode: booking.deliveryPostalCode,
        customer: customer,
        equipment: Array.isArray(booking.equipment) ? booking.equipment[0] : booking.equipment,
        // Combine payments and manual_payments into a single payments array
        payments: (() => {
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

          return [...regularPayments, ...convertedManualPayments];
        })(),
      };

      // Get base URL for invoice link
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        request.nextUrl.origin;

      // Create invoice view URL (customer-accessible route)
      // Customers can access their invoices via /api/bookings/[id]/invoice
      const invoiceUrl = `${baseUrl}/api/bookings/${bookingId}/invoice?mode=inline`;
      const safeInvoiceUrl = escapeHtml(invoiceUrl);

      // Generate secure payment token for invoice payment link
      const paymentToken = generateInvoicePaymentToken(
        bookingId,
        customer.email,
        booking.bookingNumber || bookingId
      );
      const paymentUrl = `${baseUrl}/api/invoices/${bookingId}/pay?token=${paymentToken}`;
      const safePaymentUrl = escapeHtml(paymentUrl);

      const customerName = customer.firstName && customer.lastName
        ? `${customer.firstName} ${customer.lastName}`
        : customer.email;
      const safeCustomerName = escapeHtml(customerName);

      // Load email config from Supabase Vault, env vars, or system_config
      const { getEmailFromAddress, getEmailFromName } = await import('@/lib/secrets/email');
      let FROM_EMAIL: string;
      let FROM_NAME: string;
      try {
        FROM_EMAIL = await getEmailFromAddress();
        FROM_NAME = await getEmailFromName();
      } catch (emailConfigError) {
        logger.error('Failed to load email configuration', {
          component: 'admin-bookings-invoice-send',
          action: 'email_config_error',
          metadata: {
            bookingId,
            error: emailConfigError instanceof Error ? emailConfigError.message : String(emailConfigError),
          },
        });
        return NextResponse.json({
          error: 'Email sender not configured. Please set EMAIL_FROM in Supabase Vault or environment variables.',
          details: 'Visit https://app.sendgrid.com/settings/sender_auth to verify a sender.',
        }, { status: 500 });
      }
      const bookingNumber = booking.bookingNumber || booking.id || bookingId || 'UNKNOWN';
      const safeBookingNumber = escapeHtml(bookingNumber);

      // Generate full invoice breakdown HTML with payment URL
      let invoiceBreakdownHtml: string;
      try {
        invoiceBreakdownHtml = generateInvoiceEmailHtml(normalizedBooking, {
          paymentUrl: paymentUrl,
        });
      } catch (breakdownError) {
        logger.error(
          'Failed to generate invoice breakdown HTML',
          {
            component: 'admin-bookings-invoice-send',
            action: 'invoice_breakdown_error',
            metadata: {
              bookingId,
              error: breakdownError instanceof Error ? breakdownError.message : String(breakdownError),
            },
          },
          breakdownError instanceof Error ? breakdownError : new Error(String(breakdownError))
        );
        throw breakdownError;
      }

      // Prepare email with full invoice breakdown
      let emailHtml: string;
      try {
        emailHtml = renderEmailLayout({
          headline: `Invoice - ${safeBookingNumber}`,
          previewText: `Invoice for booking ${safeBookingNumber}`,
          accentColor: '#0f172a',
          bodyHtml: `
            <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#111827;">Hi ${safeCustomerName},</p>
            <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#111827;">
              Your invoice for booking <strong>${safeBookingNumber}</strong> is ready. Please find the complete breakdown below.
            </p>

            ${invoiceBreakdownHtml}

            <div style="text-align:center; margin:32px 0 24px;">
              <a href="${safeInvoiceUrl}" style="display:inline-block; padding:14px 36px; background-color:#0f172a; color:#ffffff; text-decoration:none; border-radius:9999px; font-weight:600; font-size:15px;">
                View Full Invoice Online
              </a>
            </div>

            <p style="margin:24px 0 12px; font-size:14px; line-height:1.6; color:#111827;">
              Questions about this invoice? Reply to this email or call (506) 555-0199.
            </p>
            <p style="margin:0; font-size:14px; line-height:1.6; color:#111827;">
              Thank you for choosing U-Dig It Rentals!<br /><strong>The U-Dig It Rentals Team</strong>
            </p>
          `,
        });
      } catch (htmlError) {
        logger.error(
          'Failed to render email HTML layout',
          {
            component: 'admin-bookings-invoice-send',
            action: 'email_html_render_error',
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

      // Create plain text version for email clients that don't support HTML
      const calculations = calculateInvoiceTotals(normalizedBooking);
      const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-CA', {
          style: 'currency',
          currency: 'CAD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      };

      const formatDate = (dateString: string): string => {
        try {
          return new Date(dateString).toLocaleDateString('en-CA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch {
          return dateString;
        }
      };

      const equipment = normalizedBooking.equipment && typeof normalizedBooking.equipment === 'object' && !Array.isArray(normalizedBooking.equipment)
        ? normalizedBooking.equipment
        : null;
      const equipmentDescription = equipment
        ? `${equipment.make || ''} ${equipment.model || ''}`.trim() || 'Equipment'
        : 'Equipment';
      const equipmentUnit = equipment?.unitId ? ` • Unit: ${equipment.unitId}` : '';

      const textContentLines = [
        `Invoice - ${bookingNumber}`,
        '',
        `Hi ${customerName},`,
        '',
        `Your invoice for booking ${bookingNumber} is ready. Please find the complete breakdown below.`,
        '',
        'RENTAL PERIOD',
        `Start Date: ${formatDate(normalizedBooking.startDate)}`,
        `End Date: ${formatDate(normalizedBooking.endDate)}`,
        `Duration: ${calculations.rentalDays} ${calculations.rentalDays === 1 ? 'day' : 'days'}`,
        '',
        'INVOICE DETAILS',
        '',
        `Equipment Rental (${calculations.rentalDays} ${calculations.rentalDays === 1 ? 'day' : 'days'} @ ${formatCurrency(calculations.equipmentSubtotal / calculations.rentalDays)}/day)`,
        `${equipmentDescription}${equipmentUnit}`,
        `Amount: ${formatCurrency(calculations.equipmentSubtotal)}`,
        '',
      ];

      if (calculations.transportTotal > 0) {
        textContentLines.push(
          'Transportation & Staging',
          '  • Delivery to site:',
          `    - Standard mileage (per direction): ${formatCurrency(calculations.displayBaseFee)}`,
        );
        if (calculations.hasAdditionalMileage) {
          textContentLines.push(
            `    - Additional mileage per direction (${calculations.extraKm.toFixed(1)} km × $3): ${formatCurrency(calculations.additionalMileageFeePerDirection)}`,
          );
        }
        textContentLines.push(
          `    Subtotal: ${formatCurrency(calculations.deliverySubtotal)}`,
          '  • Pickup from site:',
          `    - Standard mileage (per direction): ${formatCurrency(calculations.displayBaseFee)}`,
        );
        if (calculations.hasAdditionalMileage) {
          textContentLines.push(
            `    - Additional mileage per direction (${calculations.extraKm.toFixed(1)} km × $3): ${formatCurrency(calculations.additionalMileageFeePerDirection)}`,
          );
        }
        textContentLines.push(
          `    Subtotal: ${formatCurrency(calculations.pickupSubtotal)}`,
          `Total Transportation: ${formatCurrency(calculations.transportTotal)}`,
          '',
        );
      }

      if (calculations.waiverCharge > 0) {
        textContentLines.push(
          `Damage Waiver (${calculations.rentalDays} ${calculations.rentalDays === 1 ? 'day' : 'days'})`,
          `Amount: ${formatCurrency(calculations.waiverCharge)}`,
          '',
        );
      }

      if (calculations.couponDiscount > 0) {
        textContentLines.push(
          `Discount${normalizedBooking.couponCode ? ` (${normalizedBooking.couponCode})` : ''}: -${formatCurrency(calculations.couponDiscount)}`,
        );
      }

      textContentLines.push(
        `Subtotal: ${formatCurrency(calculations.subtotalAfterDiscount)}`,
        `HST (15%): ${formatCurrency(calculations.taxesAmount)}`,
        `Total Amount: ${formatCurrency(calculations.totalAmount)}`,
        '',
      );

      textContentLines.push(
        `View your full invoice online:`,
        invoiceUrl,
        '',
      );

      // Add payment link if balance > 0
      if (calculations.balanceAmount !== null && calculations.balanceAmount !== undefined) {
        if (calculations.balanceAmount > 0 && paymentUrl) {
          textContentLines.push(
            `Pay your invoice now (${formatCurrency(calculations.balanceAmount)}):`,
            paymentUrl,
            '',
          );
        } else if (calculations.balanceAmount <= 0) {
          textContentLines.push('Invoice Paid in Full: $0.00 ✓', '');
        }
      }

      textContentLines.push(
        'Questions about this invoice? Reply to this email or call (506) 555-0199.',
        '',
        'Thank you for choosing U-Dig It Rentals!',
        'The U-Dig It Rentals Team'
      );

      const textContent = textContentLines.join('\n');

      // Send email using the shared utility (handles API key setup and errors)
      try {
        await sendAdminEmail({
          to: customer.email,
          from: {
            email: FROM_EMAIL,
            name: FROM_NAME,
          },
          subject: `Invoice - ${bookingNumber}`,
          html: emailHtml,
          text: textContent,
        });
      } catch (sendError) {
        logger.error(
          'Failed to send invoice email via SendGrid',
          {
            component: 'admin-bookings-invoice-send',
            action: 'sendgrid_send_error',
            metadata: {
              bookingId,
              recipientEmail: customer.email,
              error: sendError instanceof Error ? sendError.message : String(sendError),
              sendgridErrorCode: (sendError as any)?.code,
              sendgridResponse: (sendError as any)?.response?.body,
            },
          },
          sendError instanceof Error ? sendError : new Error(String(sendError))
        );
        throw sendError;
      }

      logger.info('Invoice email sent successfully', {
        component: 'admin-bookings-invoice-send',
        action: 'invoice_email_sent',
        metadata: {
          bookingId,
          bookingNumber,
          recipientEmail: customer.email,
          fromEmail: FROM_EMAIL,
          fromName: FROM_NAME,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Invoice sent successfully',
        recipientEmail: customer.email,
        bookingNumber,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error(
        'Failed to send invoice email',
        {
          component: 'admin-bookings-invoice-send',
          action: 'invoice_email_error',
          metadata: {
            bookingId,
            error: errorMessage,
            stack: errorStack,
            errorType: error?.constructor?.name,
          },
        },
        error instanceof Error ? error : new Error(String(error))
      );

      // Return more detailed error
      const errorDetails: Record<string, unknown> = {
        error: 'Failed to send invoice email. Please try again.',
      };

      // Handle specific SendGrid error types with helpful messages
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('SendGrid API key')) {
        errorDetails.error = 'SendGrid API key is invalid or expired. Please verify your EMAIL_API_KEY in Supabase Vault or system_config table has a valid SendGrid API key with Mail Send permissions.';
        errorDetails.details = 'The SendGrid API key configured in your system is being rejected by SendGrid. Please check your SendGrid dashboard (https://app.sendgrid.com/settings/api_keys) to verify the key is valid and has the necessary permissions.';
      } else if (errorMessage.includes('Maximum credits exceeded') || errorMessage.includes('quota') || errorMessage.includes('limit')) {
        errorDetails.error = 'SendGrid email quota exceeded. Your SendGrid account has reached its monthly email sending limit.';
        errorDetails.details = 'To resolve this issue, you can: 1) Upgrade your SendGrid plan for a higher quota, 2) Wait for your monthly quota to reset, or 3) Purchase additional email credits. Check your SendGrid dashboard at https://app.sendgrid.com/ for your current usage and quota limits.';
      }

      // Always include details in development, and also in production if it's a safe error message
      if (process.env.NODE_ENV === 'development') {
        errorDetails.details = errorDetails.details || errorMessage;
        if (errorStack) {
          errorDetails.stack = errorStack;
        }
        errorDetails.bookingId = bookingId;
        errorDetails.errorType = error?.constructor?.name;
      } else {
        // In production, only include safe details
        if (errorDetails.details || (errorMessage && !errorMessage.includes('stack') && errorMessage.length < 200)) {
          errorDetails.details = errorDetails.details || errorMessage;
        }
      }

      return NextResponse.json(errorDetails, { status: 500 });
    }
  }
);


