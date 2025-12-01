/**
 * Public Invoice Payment Link Endpoint
 * Allows customers to pay invoices via secure token without authentication
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { recalculateBookingBalance } from '@/lib/booking/balance';
import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Generate secure payment token for invoice
 */
export function generateInvoicePaymentToken(
  bookingId: string,
  customerEmail: string,
  bookingNumber: string
): string {
  // Use INVOICE_PAYMENT_SECRET if set, otherwise fall back to SUPABASE_SERVICE_ROLE_KEY
  // This ensures tokens work even if INVOICE_PAYMENT_SECRET is not explicitly set
  const secret = process.env.INVOICE_PAYMENT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('INVOICE_PAYMENT_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  const data = `${bookingId}:${customerEmail}:${bookingNumber}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Validate payment token
 */
export function validateInvoicePaymentToken(
  token: string,
  bookingId: string,
  customerEmail: string,
  bookingNumber: string
): boolean {
  const expectedToken = generateInvoicePaymentToken(bookingId, customerEmail, bookingNumber);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

/**
 * GET /api/invoices/[bookingId]/pay
 * Public endpoint to initiate invoice payment via Stripe checkout
 */
export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> | { bookingId: string } }
  ) => {
    try {
      const resolvedParams = params instanceof Promise ? await params : params;
      const bookingId = resolvedParams?.bookingId;

      if (!bookingId) {
        return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
      }

      // Get token from query string
      const searchParams = request.nextUrl.searchParams;
      const token = searchParams.get('token');

      if (!token) {
        logger.warn('Invoice payment link accessed without token', {
          component: 'invoice-payment-link',
          action: 'missing_token',
          metadata: { bookingId },
        });
        return NextResponse.json({ error: 'Payment token is required' }, { status: 400 });
      }

      // Use service client to fetch booking (bypasses RLS for public access)
      const supabase = await createServiceClient();
      if (!supabase) {
        logger.error('Service client unavailable for invoice payment', {
          component: 'invoice-payment-link',
          action: 'service_client_unavailable',
        });
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }

      // Fetch booking with customer relation
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(
          `
          id,
          bookingNumber,
          totalAmount,
          balance_amount,
          customerId,
          customer:customerId (
            email,
            firstName,
            lastName
          ),
          equipment:equipmentId (
            make,
            model
          )
        `
        )
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        logger.error('Booking not found for invoice payment', {
          component: 'invoice-payment-link',
          action: 'booking_not_found',
          metadata: { bookingId, error: bookingError?.message },
        });
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Normalize customer data
      const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
      if (!customer || !customer.email) {
        logger.error('Customer email not found for invoice payment', {
          component: 'invoice-payment-link',
          action: 'customer_email_missing',
          metadata: { bookingId },
        });
        return NextResponse.json({ error: 'Invalid invoice' }, { status: 400 });
      }

      // Validate token
      const isValidToken = validateInvoicePaymentToken(
        token,
        bookingId,
        customer.email,
        booking.bookingNumber || bookingId
      );

      if (!isValidToken) {
        logger.warn('Invalid payment token for invoice', {
          component: 'invoice-payment-link',
          action: 'invalid_token',
          metadata: { bookingId, customerEmail: customer.email },
        });
        return NextResponse.json({ error: 'Invalid payment link' }, { status: 403 });
      }

      // Check if balance is already paid
      const balanceAmount = Number(booking.balance_amount ?? booking.totalAmount);
      if (balanceAmount <= 0) {
        logger.info('Invoice payment attempted but balance is already zero', {
          component: 'invoice-payment-link',
          action: 'balance_already_zero',
          metadata: { bookingId, balanceAmount },
        });
        // Redirect to success page with message
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL ||
          process.env.NEXT_PUBLIC_APP_URL ||
          request.nextUrl.origin;
        return NextResponse.redirect(
          `${baseUrl}/invoice/payment/success?booking=${bookingId}&message=already_paid`
        );
      }

      // Recalculate balance to ensure accuracy
      const recalculatedBalance = await recalculateBookingBalance(bookingId);
      const finalBalance =
        recalculatedBalance !== null ? recalculatedBalance : balanceAmount;

      if (finalBalance <= 0) {
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL ||
          process.env.NEXT_PUBLIC_APP_URL ||
          request.nextUrl.origin;
        return NextResponse.redirect(
          `${baseUrl}/invoice/payment/success?booking=${bookingId}&message=already_paid`
        );
      }

      // Initialize Stripe
      const stripe = createStripeClient(await getStripeSecretKey());

      // Get base URL for success/cancel URLs
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        request.nextUrl.origin;

      const successUrl = `${baseUrl}/invoice/payment/success?booking=${bookingId}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/invoice/payment/cancel?booking=${bookingId}`;

      // Normalize equipment data
      const equipment = Array.isArray(booking.equipment) ? booking.equipment[0] : booking.equipment;
      const equipmentDescription = equipment
        ? `${equipment.make || ''} ${equipment.model || ''}`.trim() || 'Equipment'
        : 'Equipment';

      // Ensure amount is a valid number
      const paymentAmount = Number(finalBalance);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        logger.error('Invalid payment amount', {
          component: 'invoice-payment-link',
          action: 'invalid_amount',
          metadata: { bookingId, finalBalance, paymentAmount },
        });
        return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
      }

      // Idempotency check: Look for existing pending payment with same bookingId, amount, and type
      // This prevents duplicate payment records due to unique constraint idx_payments_duplicate_prevention
      const { data: existingPayment, error: checkError } = await supabase
        .from('payments')
        .select('id, stripeCheckoutSessionId, status')
        .eq('bookingId', booking.id)
        .eq('amount', paymentAmount)
        .eq('type', 'payment')
        .in('status', ['pending', 'processing'])
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkError) {
        logger.warn('Error checking for existing payment (continuing anyway)', {
          component: 'invoice-payment-link',
          action: 'idempotency_check_error',
          metadata: { bookingId, error: checkError.message },
        });
      }

      let paymentRecord;

      // If we found an existing pending payment, reuse it
      if (existingPayment) {
        logger.info('Reusing existing pending payment record', {
          component: 'invoice-payment-link',
          action: 'idempotency_reuse',
          metadata: {
            bookingId,
            existingPaymentId: existingPayment.id,
            existingSessionId: existingPayment.stripeCheckoutSessionId,
          },
        });
        paymentRecord = { id: existingPayment.id };
      } else {
        // Create new payment record
        const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const { data: newPaymentRecord, error: paymentError } = await supabase
          .from('payments')
          .insert({
            bookingId: booking.id,
            paymentNumber,
            amount: paymentAmount,
            type: 'payment',
            status: 'pending',
            method: 'credit_card',
            description: `Invoice Payment: ${equipmentDescription} (${booking.bookingNumber || bookingId})`,
          })
          .select('id')
          .single();

        if (paymentError) {
          logger.error('Failed to create payment record for invoice', {
            component: 'invoice-payment-link',
            action: 'payment_record_error',
            metadata: {
              bookingId,
              error: paymentError.message,
              errorCode: paymentError.code,
              errorDetails: paymentError.details,
              errorHint: paymentError.hint,
              paymentData: {
                bookingId: booking.id,
                paymentNumber,
                amount: paymentAmount,
                type: 'payment',
                status: 'pending',
                method: 'credit_card',
              },
            },
          }, paymentError);
          return NextResponse.json(
            { error: 'Failed to create payment record', details: paymentError.message },
            { status: 500 }
          );
        }

        if (!newPaymentRecord?.id) {
          logger.error('Payment record created but missing ID', {
            component: 'invoice-payment-link',
            action: 'payment_id_missing',
            metadata: { bookingId },
          });
          return NextResponse.json(
            { error: 'Failed to create payment record' },
            { status: 500 }
          );
        }

        paymentRecord = newPaymentRecord;
      }

      // Ensure we have a valid payment record ID
      if (!paymentRecord?.id) {
        logger.error('Payment record missing ID', {
          component: 'invoice-payment-link',
          action: 'payment_id_missing',
          metadata: { bookingId, wasReused: !!existingPayment },
        });
        return NextResponse.json(
          { error: 'Failed to create payment record' },
          { status: 500 }
        );
      }

      // Create Stripe checkout session with paymentId in metadata
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'cad',
              product_data: {
                name: `Invoice Payment - ${booking.bookingNumber || bookingId}`,
                description: `Equipment Rental: ${equipmentDescription}`,
                metadata: {
                  bookingId: booking.id,
                  bookingNumber: booking.bookingNumber || bookingId,
                  paymentType: 'invoice',
                },
              },
              unit_amount: Math.round(finalBalance * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customer.email,
        metadata: {
          bookingId: booking.id,
          paymentId: paymentRecord.id, // CRITICAL: Include paymentId for webhook
          bookingNumber: booking.bookingNumber || bookingId,
          paymentType: 'invoice',
          customerEmail: customer.email,
          source: 'email_invoice',
        },
      });

      logger.info('Stripe checkout session created for invoice payment', {
        component: 'invoice-payment-link',
        action: 'checkout_session_created',
        metadata: {
          bookingId,
          paymentId: paymentRecord.id,
          sessionId: session.id,
          amount: finalBalance,
          customerEmail: customer.email,
        },
      });

      // Update payment record with session ID (for both new and existing payments)
      const { error: sessionUpdateError } = await supabase
        .from('payments')
        .update({
          stripeCheckoutSessionId: session.id,
        })
        .eq('id', paymentRecord.id);

      if (sessionUpdateError) {
        logger.warn('Failed to update payment with session ID', {
          component: 'invoice-payment-link',
          action: 'session_id_update_failed',
          metadata: {
            paymentId: paymentRecord.id,
            sessionId: session.id,
            error: sessionUpdateError.message,
            wasReused: !!existingPayment,
          },
        });
        // Don't fail - session ID is not critical for webhook to work
      } else {
        logger.info('Payment record updated with session ID', {
          component: 'invoice-payment-link',
          action: 'session_id_updated',
          metadata: {
            paymentId: paymentRecord.id,
            sessionId: session.id,
            wasReused: !!existingPayment,
          },
        });
      }

      // Redirect to Stripe checkout
      if (session.url) {
        return NextResponse.redirect(session.url);
      }

      return NextResponse.json(
        { error: 'Failed to create payment session' },
        { status: 500 }
      );
    } catch (error) {
      logger.error(
        'Failed to process invoice payment link',
        {
          component: 'invoice-payment-link',
          action: 'payment_link_error',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        },
        error instanceof Error ? error : new Error(String(error))
      );

      return NextResponse.json(
        {
          error: 'Failed to process payment request',
          details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
        },
        { status: 500 }
      );
    }
  }
);

