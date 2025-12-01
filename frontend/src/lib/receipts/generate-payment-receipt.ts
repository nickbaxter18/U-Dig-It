import { buildInvoicePaymentReceiptEmail, PaymentHistoryEntry } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createServiceClient } from '@/lib/supabase/service';

const DEFAULT_ALLOWED_STRIPE_LOOKUP = true;

type GenerateReceiptOptions = {
  allowStripeLookup?: boolean;
  userId?: string;
};

// Payment method display names for manual payments
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  ach: 'ACH Bank Transfer',
  check: 'Check',
  pos: 'POS Terminal',
  other: 'Other',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  bank_transfer: 'Bank Transfer',
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

// Normalized payment data structure for receipt generation
interface NormalizedPayment {
  id: string;
  amount: number;
  amountRefunded: number;
  paymentNumber: string | null;
  type: string;
  status: string;
  method: string;
  stripePaymentIntentId: string | null;
  stripeCheckoutSessionId: string | null;
  processedAt: string | null;
  createdAt: string;
  isManualPayment: boolean;
  notes: string | null;
}

// Re-export PaymentHistoryEntry for external use
export type { PaymentHistoryEntry } from '@/lib/email-service';

interface NormalizedBooking {
  id: string;
  bookingNumber: string;
  customerId: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  subtotal: number | null;
  taxes: number | null;
  totalAmount: number | null;
  balance_amount: number | null;
  dailyRate: number | null;
  floatFee: number | null;
  deliveryFee: number | null;
  distanceKm: number | null;
  securityDeposit: number | null;
  waiver_selected: boolean | null;
  waiver_rate_cents: number | null;
  couponCode: string | null;
  couponType: string | null;
  couponValue: number | null;
  couponDiscount: number | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryProvince: string | null;
  deliveryPostalCode: string | null;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
    phone: string | null;
  } | null;
  equipment: {
    make: string | null;
    model: string | null;
    type: string | null;
    unitId: string | null;
    serialNumber: string | null;
  } | null;
}

/**
 * Try to fetch a Stripe payment from the payments table
 */
async function fetchStripePayment(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  paymentId: string
): Promise<{ payment: NormalizedPayment; booking: NormalizedBooking } | null> {
  const { data: payment, error } = await supabase
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
        balance_amount,
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

  if (error) {
    logger.error(
      'Failed to load Stripe payment for receipt generation',
      {
        component: 'receipt-generator',
        action: 'load_stripe_payment_error',
        metadata: {
          paymentId,
          errorCode: error.code,
          errorMessage: error.message,
        },
      },
      error
    );
    throw new ReceiptGenerationError('Unable to load payment details', 500);
  }

  if (!payment) {
    return null;
  }

  const booking = normalizeRecord(payment.booking);
  if (!booking) {
    return null;
  }

  const customer = normalizeRecord(booking.customer);
  const equipment = normalizeRecord(booking.equipment);

  return {
    payment: {
      id: payment.id,
      amount: Number(payment.amount) || 0,
      amountRefunded: Number(payment.amountRefunded) || 0,
      paymentNumber: payment.paymentNumber,
      type: payment.type || 'payment',
      status: payment.status || 'completed',
      method: payment.method || 'credit_card',
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
      processedAt: payment.processedAt,
      createdAt: payment.createdAt,
      isManualPayment: false,
      notes: null,
    },
    booking: {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      customerId: booking.customerId,
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
      securityDeposit: booking.securityDeposit,
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
      customer: customer
        ? {
            email: customer.email || '',
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            companyName: customer.companyName,
            phone: customer.phone,
          }
        : null,
      equipment: equipment
        ? {
            make: equipment.make,
            model: equipment.model,
            type: equipment.type,
            unitId: equipment.unitId,
            serialNumber: equipment.serialNumber,
          }
        : null,
    },
  };
}

/**
 * Try to fetch a manual payment from the manual_payments table
 */
async function fetchManualPayment(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  paymentId: string
): Promise<{ payment: NormalizedPayment; booking: NormalizedBooking } | null> {
  const { data: manualPayment, error } = await supabase
    .from('manual_payments')
    .select(
      `
      id,
      amount,
      currency,
      method,
      status,
      received_at,
      notes,
      created_at,
      booking:booking_id (
        id,
        bookingNumber,
        customerId,
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
    .is('deleted_at', null) // Exclude soft-deleted payments
    .maybeSingle();

  if (error) {
    // If table doesn't exist, return null (not an error, just means no manual payments)
    if (error.code === '42P01') {
      return null;
    }
    logger.error(
      'Failed to load manual payment for receipt generation',
      {
        component: 'receipt-generator',
        action: 'load_manual_payment_error',
        metadata: {
          paymentId,
          errorCode: error.code,
          errorMessage: error.message,
        },
      },
      error
    );
    throw new ReceiptGenerationError('Unable to load payment details', 500);
  }

  if (!manualPayment) {
    return null;
  }

  const booking = normalizeRecord(manualPayment.booking);
  if (!booking) {
    return null;
  }

  const customer = normalizeRecord(booking.customer);
  const equipment = normalizeRecord(booking.equipment);

  // Generate a payment number for manual payments
  const paymentNumber = `MP-${manualPayment.id.slice(0, 8).toUpperCase()}`;

  return {
    payment: {
      id: manualPayment.id,
      amount: Number(manualPayment.amount) || 0,
      amountRefunded: 0, // Manual payments don't track refunds the same way
      paymentNumber,
      type: 'manual_payment',
      status: manualPayment.status || 'completed',
      method: manualPayment.method || 'cash',
      stripePaymentIntentId: null, // Manual payments don't have Stripe IDs
      stripeCheckoutSessionId: null,
      processedAt: manualPayment.received_at,
      createdAt: manualPayment.created_at,
      isManualPayment: true,
      notes: manualPayment.notes,
    },
    booking: {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      customerId: booking.customerId,
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
      securityDeposit: booking.securityDeposit,
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
      customer: customer
        ? {
            email: customer.email || '',
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            companyName: customer.companyName,
            phone: customer.phone,
          }
        : null,
      equipment: equipment
        ? {
            make: equipment.make,
            model: equipment.model,
            type: equipment.type,
            unitId: equipment.unitId,
            serialNumber: equipment.serialNumber,
          }
        : null,
    },
  };
}

/**
 * Fetch all payments (both Stripe and manual) for a booking
 * Returns complete payment history sorted chronologically
 */
async function fetchPaymentHistory(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  bookingId: string,
  currentPaymentId: string
): Promise<PaymentHistoryEntry[]> {
  const payments: PaymentHistoryEntry[] = [];

  try {
    // Fetch Stripe payments - include all relevant statuses
    const { data: stripePayments, error: stripeError } = await supabase
      .from('payments')
      .select('id, amount, method, status, "processedAt", "createdAt"')
      .eq('bookingId', bookingId)
      .order('createdAt', { ascending: true });

    if (stripeError) {
      logger.warn('Failed to fetch Stripe payment history', {
        component: 'receipt-generator',
        action: 'fetch_stripe_history_error',
        metadata: { bookingId, error: stripeError.message },
      });
    } else if (stripePayments) {
      for (const p of stripePayments) {
        // Include completed, processing, and pending payments
        // Exclude failed, cancelled, refunded (those are handled separately)
        // NOTE: 'succeeded' does not exist in payments_status_enum - use 'completed' instead
        if (['completed', 'processing', 'pending'].includes(p.status)) {
          // Ensure we have valid data before adding to payment history
          const paidAt = p.processedAt || p.createdAt;
          if (!paidAt) {
            logger.warn('Stripe payment missing date', {
              component: 'receipt-generator',
              action: 'missing_payment_date',
              metadata: { paymentId: p.id, bookingId },
            });
            continue; // Skip payments without dates
          }
          payments.push({
            id: p.id,
            amount: Number(p.amount) || 0,
            method: PAYMENT_METHOD_LABELS[p.method] || p.method || 'Credit Card',
            status: p.status,
            paidAt,
            isCurrentPayment: p.id === currentPaymentId,
            notes: null, // Stripe payments don't have notes field
          });
        }
      }
    }
  } catch (error) {
    // Log but don't fail - payment history is optional
    logger.warn('Failed to fetch Stripe payment history', {
      component: 'receipt-generator',
      action: 'fetch_stripe_history_error',
      metadata: { bookingId, error: error instanceof Error ? error.message : String(error) },
    });
  }

  try {
    // Fetch manual payments - include all non-voided payments with notes
    const { data: manualPayments, error: manualError } = await supabase
      .from('manual_payments')
      .select('id, amount, method, status, received_at, created_at, notes')
      .eq('booking_id', bookingId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (manualError) {
      // If table doesn't exist, that's okay - just log and continue
      if (manualError.code !== '42P01') {
        logger.warn('Failed to fetch manual payment history', {
          component: 'receipt-generator',
          action: 'fetch_manual_history_error',
          metadata: { bookingId, error: manualError.message },
        });
      }
    } else if (manualPayments) {
      for (const mp of manualPayments) {
        // Include completed and pending payments (exclude voided)
        if (['completed', 'pending'].includes(mp.status)) {
          // Ensure we have valid data before adding to payment history
          const paidAt = mp.received_at || mp.created_at;
          if (!paidAt) {
            logger.warn('Manual payment missing date', {
              component: 'receipt-generator',
              action: 'missing_payment_date',
              metadata: { paymentId: mp.id, bookingId },
            });
            continue; // Skip payments without dates
          }
          payments.push({
            id: mp.id,
            amount: Number(mp.amount) || 0,
            method: PAYMENT_METHOD_LABELS[mp.method] || mp.method || 'Cash',
            status: mp.status,
            paidAt,
            isCurrentPayment: mp.id === currentPaymentId,
            notes: mp.notes || null, // Include notes for manual payments
          });
        }
      }
    }
  } catch (error) {
    // Log but don't fail - payment history is optional
    logger.warn('Failed to fetch manual payment history', {
      component: 'receipt-generator',
      action: 'fetch_manual_history_error',
      metadata: { bookingId, error: error instanceof Error ? error.message : String(error) },
    });
  }

  // Sort by date (chronologically)
  // Handle invalid dates gracefully
  payments.sort((a, b) => {
    const dateA = new Date(a.paidAt).getTime();
    const dateB = new Date(b.paidAt).getTime();
    // If either date is invalid, put it at the end
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateA - dateB;
  });

  // Log payment history for debugging
  if (payments.length > 0) {
    logger.debug('Payment history fetched', {
      component: 'receipt-generator',
      action: 'payment_history_fetched',
      metadata: {
        bookingId,
        currentPaymentId,
        totalPayments: payments.length,
        paymentIds: payments.map((p) => p.id),
        currentPaymentFound: payments.some((p) => p.isCurrentPayment),
      },
    });
  }

  return payments;
}

export async function generatePaymentReceiptHtml(
  paymentId: string,
  options: GenerateReceiptOptions = {}
): Promise<{ html: string; filename: string }> {
  const allowStripeLookup = options.allowStripeLookup ?? DEFAULT_ALLOWED_STRIPE_LOOKUP;
  const serviceSupabase = await createServiceClient();
  if (!serviceSupabase) {
    logger.error('Failed to create service client for receipt generation', {
      component: 'receipt-generator',
      action: 'service_client_failed',
      metadata: { paymentId },
    });
    throw new ReceiptGenerationError('Unable to generate receipt: service unavailable', 500);
  }

  // Try to fetch from payments table first (Stripe payments)
  let paymentData = await fetchStripePayment(serviceSupabase, paymentId);

  // If not found in payments, try manual_payments table
  if (!paymentData) {
    paymentData = await fetchManualPayment(serviceSupabase, paymentId);
  }

  // If still not found, throw 404
  if (!paymentData) {
    throw new ReceiptGenerationError('Payment not found', 404);
  }

  const { payment, booking } = paymentData;

  // Check user permission (for customer-facing endpoint)
  if (options.userId && booking.customerId !== options.userId) {
    throw new ReceiptGenerationError('You do not have permission to view this receipt', 403);
  }

  // Fetch payment history for the booking
  const paymentHistory = await fetchPaymentHistory(serviceSupabase, booking.id, paymentId);

  // Get method display label
  const methodLabel = PAYMENT_METHOD_LABELS[payment.method] || payment.method || 'Payment';

  const emailContent = buildInvoicePaymentReceiptEmail(
    {
      bookingNumber: booking.bookingNumber ?? payment.paymentNumber ?? 'N/A',
      createdAt: booking.createdAt ?? payment.processedAt ?? payment.createdAt,
      startDate: booking.startDate ?? payment.processedAt ?? payment.createdAt,
      endDate: booking.endDate ?? payment.processedAt ?? payment.createdAt,
      subtotal: booking.subtotal ?? null,
      taxes: booking.taxes ?? null,
      totalAmount: booking.totalAmount ?? null, // Use actual booking total for invoice display
      balanceAmount: booking.balance_amount ?? null, // Current outstanding balance
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
      equipment: booking.equipment
        ? {
            make: booking.equipment.make ?? null,
            model: booking.equipment.model ?? null,
            type: booking.equipment.type ?? null,
            unitId: booking.equipment.unitId ?? null,
          }
        : null,
    },
    {
      amount: payment.amount,
      method: methodLabel, // Use friendly label instead of raw method
      paidAt: payment.processedAt ?? payment.createdAt ?? new Date().toISOString(),
      transactionId:
        payment.stripePaymentIntentId ??
        payment.stripeCheckoutSessionId ??
        payment.paymentNumber ??
        null,
      status: payment.status, // Pass payment status for balance calculation
    },
    {
      email: booking.customer?.email ?? 'customer@udigit.ca',
      firstName: booking.customer?.firstName ?? '',
      lastName: booking.customer?.lastName ?? '',
      company: booking.customer?.companyName ?? '',
      phone: booking.customer?.phone ?? '',
    },
    paymentHistory // Pass payment history for complete display
  );

  let html = emailContent.html;

  // Only attempt Stripe lookup for non-manual payments
  if (allowStripeLookup && !payment.isManualPayment) {
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

  logger.info('Receipt generated successfully', {
    component: 'receipt-generator',
    action: 'receipt_generated',
    metadata: {
      paymentId,
      isManualPayment: payment.isManualPayment,
      method: payment.method,
      amount: payment.amount,
      bookingNumber: booking.bookingNumber,
    },
  });

  return { html, filename };
}

export { ReceiptGenerationError };
