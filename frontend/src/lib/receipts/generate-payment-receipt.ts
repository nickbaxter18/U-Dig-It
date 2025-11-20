import { buildInvoicePaymentReceiptEmail } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createServiceClient } from '@/lib/supabase/service';

const DEFAULT_ALLOWED_STRIPE_LOOKUP = true;

type GenerateReceiptOptions = {
  allowStripeLookup?: boolean;
  userId?: string;
};

class ReceiptGenerationError extends Error {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ReceiptGenerationError';
    this.status = status;
  }
}

const normalizeRecord = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value.length > 0 ? (value[0] as T) : null;
  }
  return value;
};

export async function generatePaymentReceiptHtml(
  paymentId: string,
  options: GenerateReceiptOptions = {}
): Promise<{ html: string; filename: string }> {
  const allowStripeLookup = options.allowStripeLookup ?? DEFAULT_ALLOWED_STRIPE_LOOKUP;
  const serviceSupabase = createServiceClient();
  if (!serviceSupabase) {
    throw new Error('Failed to create service client');
  }

  const { data: payment, error: paymentError } = await serviceSupabase
    .from('payments')
    .select(
      `
      id,
      amount,
      "amountRefunded",
      "paymentNumber",
      type,
      status,
      method,
      "stripePaymentIntentId",
      "stripeCheckoutSessionId",
      "processedAt",
      "createdAt",
      booking:bookingId (
        id,
        bookingNumber,
        customerId,
        createdAt,
        startDate,
        endDate,
        subtotal,
        taxes,
        totalAmount,
        dailyRate,
        floatFee,
        deliveryFee,
        distanceKm,
        securityDeposit,
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
        )
      )
    `
    )
    .eq('id', paymentId)
    .maybeSingle();

  if (paymentError) {
    logger.error(
      'Failed to load payment for receipt generation',
      { component: 'receipt-generator', action: 'load_payment_error', metadata: { paymentId } },
      paymentError
    );
    throw new ReceiptGenerationError('Unable to load payment details', 500);
  }

  if (!payment) {
    throw new ReceiptGenerationError('Payment not found', 404);
  }

  const booking = normalizeRecord(payment.booking);
  if (!booking) {
    throw new ReceiptGenerationError('Booking not found for payment', 404);
  }

  if (options.userId && booking.customerId !== options.userId) {
    throw new ReceiptGenerationError('You do not have permission to view this receipt', 403);
  }

  const customer = normalizeRecord(booking.customer) ?? {};
  const equipment = normalizeRecord(booking.equipment);

  const emailContent = buildInvoicePaymentReceiptEmail(
    {
      bookingNumber: booking.bookingNumber ?? payment.paymentNumber ?? 'N/A',
      createdAt: booking.createdAt ?? payment.processedAt ?? payment.createdAt,
      startDate: booking.startDate ?? payment.processedAt ?? payment.createdAt,
      endDate: booking.endDate ?? payment.processedAt ?? payment.createdAt,
      subtotal: booking.subtotal ?? null,
      taxes: booking.taxes ?? null,
      totalAmount: booking.totalAmount ?? payment.amount,
      dailyRate: booking.dailyRate ?? null,
      floatFee: booking.floatFee ?? null,
      deliveryFee: booking.deliveryFee ?? null,
      distanceKm: booking.distanceKm ?? null,
      securityDeposit: booking.securityDeposit ?? null,
      waiverSelected: booking.waiver_selected ?? null,
      waiverRateCents: booking.waiver_rate_cents ?? null,
      couponCode: booking.couponCode ?? null,
      couponType: booking.couponType ?? null,
      couponValue: booking.couponValue ?? null,
      couponDiscount: booking.couponDiscount ?? null,
      deliveryAddress: booking.deliveryAddress ?? null,
      deliveryCity: booking.deliveryCity ?? null,
      deliveryProvince: booking.deliveryProvince ?? null,
      deliveryPostalCode: booking.deliveryPostalCode ?? null,
      equipment: equipment
        ? {
            make: equipment.make ?? null,
            model: equipment.model ?? null,
            type: equipment.type ?? null,
            unitId: equipment.unitId ?? null,
          }
        : null,
    },
    {
      amount: payment.amount,
      method: payment.method,
      paidAt: payment.processedAt ?? payment.createdAt ?? new Date().toISOString(),
      transactionId:
        payment.stripePaymentIntentId ??
        payment.stripeCheckoutSessionId ??
        payment.paymentNumber ??
        null,
    },
    {
      email: (customer as { email?: string } | null)?.email ?? 'customer@udigit.ca',
      firstName: (customer as { firstName?: string } | null)?.firstName ?? '',
      lastName: (customer as { lastName?: string } | null)?.lastName ?? '',
      company: (customer as { companyName?: string } | null)?.companyName ?? '',
      phone: (customer as { phone?: string } | null)?.phone ?? '',
    }
  );

  let html = emailContent.html;

  if (allowStripeLookup) {
    try {
      const secretKey = await getStripeSecretKey();
      const stripe = createStripeClient(secretKey);

      let stripePaymentIntentId: string | null = payment.stripePaymentIntentId ?? null;

      if (!stripePaymentIntentId && payment.stripeCheckoutSessionId) {
        const session = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId);
        if (session && typeof session.payment_intent === 'string') {
          stripePaymentIntentId = session.payment_intent;
        }
      }

      if (stripePaymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId, {
          expand: ['charges.data'],
        });

        const charge = (
          paymentIntent as { charges?: { data?: Array<{ receipt_url?: string }> } } | null
        )?.charges?.data?.[0];
        if (charge?.receipt_url) {
          const receiptResponse = await fetch(charge.receipt_url, {
            method: 'GET',
            headers: {
              'User-Agent': 'KubotaRentalPlatform/1.0 (Receipt Downloader)',
            },
          });

          if (receiptResponse.ok) {
            html = await receiptResponse.text();
          } else {
            logger.warn('Stripe receipt fetch returned non-OK status', {
              component: 'receipt-generator',
              action: 'stripe_receipt_fetch_non_ok',
              metadata: { paymentId, url: charge.receipt_url, status: receiptResponse.status },
            });
          }
        }
      }
    } catch (stripeError) {
      logger.warn('Stripe receipt lookup failed, using generated HTML instead', {
        component: 'receipt-generator',
        action: 'stripe_receipt_fetch_failed',
        metadata: {
          paymentId,
          error: stripeError instanceof Error ? stripeError.message : String(stripeError),
        },
      });
    }
  }

  const filename = `receipt-${payment.paymentNumber ?? paymentId}.html`;

  return { html, filename };
}

export { ReceiptGenerationError };
