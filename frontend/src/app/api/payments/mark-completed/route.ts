/**
 * Manual Payment Completion API (Development/Testing Only)
 *
 * This endpoint allows manual completion of payments for testing
 * when Stripe webhooks aren't available (local development without Stripe CLI).
 *
 * ⚠️ WARNING: This should ONLY be used for development/testing.
 * In production, payment completion should ONLY happen via Stripe webhooks.
 */
import { NextRequest, NextResponse } from 'next/server';

import { checkAndCompleteBookingIfReady } from '@/lib/check-and-complete-booking';
import { sendInvoicePaymentConfirmation } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import {
  broadcastInAppNotificationToAdmins,
  createInAppNotification,
} from '@/lib/notification-service';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';

type EquipmentRecord = {
  make?: string;
  model?: string;
  type?: string;
  unitId?: string;
};

const normalizeEquipmentRecord = (raw: unknown): EquipmentRecord | null => {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return normalizeEquipmentRecord(raw[0]);
  }
  if (typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const readString = (key: string): string | undefined =>
      typeof record[key] === 'string' ? (record[key] as string) : undefined;

    const normalized: EquipmentRecord = {};
    const make = readString('make');
    const model = readString('model');
    const type = readString('type');
    const unitId = readString('unitId');

    if (make) normalized.make = make;
    if (model) normalized.model = model;
    if (type) normalized.type = type;
    if (unitId) normalized.unitId = unitId;

    return Object.keys(normalized).length > 0 ? normalized : null;
  }

  return null;
};

export async function POST(req: NextRequest) {
  logger.debug('Mark payment completed API route called', {
    component: 'mark-payment-completed',
    action: 'route_called',
  });

  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    logger.debug('Creating Supabase client', {
      component: 'mark-payment-completed',
      action: 'creating_client',
    });
    const supabase = await createClient();

    // Verify user is authenticated
    logger.debug('Checking authentication', {
      component: 'mark-payment-completed',
      action: 'checking_auth',
    });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Authentication failed', {
        component: 'mark-payment-completed',
        action: 'auth_failed',
        metadata: { authError: authError?.message },
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.debug('User authenticated', {
      component: 'mark-payment-completed',
      action: 'auth_success',
      metadata: { email: user.email },
    });

    const { bookingId, paymentType = 'payment' } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    logger.warn('Manually completing payment (development mode)', {
      component: 'mark-payment-completed',
      action: 'manual_completion',
      metadata: { bookingId, paymentType, userId: user.id },
    });

    // Get booking to verify ownership and get amounts
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customerId, totalAmount, securityDeposit')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user owns this booking
    if (booking.customerId !== user.id) {
      logger.warn('Unauthorized payment completion attempt', {
        component: 'mark-payment-completed',
        action: 'unauthorized',
        metadata: { bookingId, userId: user.id, ownerId: booking.customerId },
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Normalize payment type ('invoice' and 'payment' both mean invoice payment)
    const normalizedType =
      paymentType === 'invoice' || paymentType === 'payment' ? 'payment' : 'deposit';

    // Get payment amount from booking
    const amount =
      normalizedType === 'payment'
        ? Number(booking.totalAmount)
        : Number(booking.securityDeposit || 500);

    // First, check if payment record exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('bookingId', bookingId)
      .eq('type', normalizedType)
      .single();

    if (!existingPayment) {
      // Payment record doesn't exist - create it first
      logger.info('Payment record not found, creating it', {
        component: 'mark-payment-completed',
        action: 'creating_payment_record',
        metadata: { bookingId, paymentType: normalizedType, amount },
      });

      // Generate payment number
      const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { error: insertError } = await supabase.from('payments').insert({
        bookingId,
        paymentNumber,
        amount,
        type: normalizedType,
        status: 'completed',
        method: 'credit_card', // Required field - must match enum (credit_card, debit_card, bank_transfer, cash, check)
        processedAt: new Date().toISOString(),
        stripeMetadata: {
          manually_completed: true,
          completed_by: user.id,
          completed_at: new Date().toISOString(),
          note: 'Manually completed for development testing - record created',
        },
      });

      if (insertError) {
        logger.error(
          'Failed to create payment record',
          {
            component: 'mark-payment-completed',
            action: 'insert_failed',
            metadata: {
              bookingId,
              paymentType: normalizedType,
              error: insertError.message,
              code: insertError.code,
            },
          },
          insertError
        );
        return NextResponse.json(
          {
            error: 'Failed to create payment record',
            details: insertError.message,
            code: insertError.code,
            hint: insertError.hint,
          },
          { status: 500 }
        );
      }
    } else {
      // Payment record exists - update it
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          processedAt: new Date().toISOString(),
          // Add a note that this was manually completed for testing
          stripeMetadata: {
            manually_completed: true,
            completed_by: user.id,
            completed_at: new Date().toISOString(),
            note: 'Manually completed for development testing',
          },
        })
        .eq('bookingId', bookingId)
        .eq('type', normalizedType);

      if (paymentUpdateError) {
        logger.error(
          'Failed to update payment status',
          {
            component: 'mark-payment-completed',
            action: 'update_failed',
            metadata: { bookingId, paymentType, error: paymentUpdateError.message },
          },
          paymentUpdateError
        );
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
      }
    }

    // If this is an invoice payment, also update booking status
    if (paymentType === 'payment' || paymentType === 'invoice') {
      await supabase
        .from('bookings')
        .update({
          status: 'paid',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', bookingId);
    }

    // If this is a deposit payment, mark deposit as paid
    if (paymentType === 'deposit') {
      await supabase
        .from('bookings')
        .update({
          depositPaid: true,
          depositPaidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', bookingId);
    }

    logger.info('Payment manually marked as completed', {
      component: 'mark-payment-completed',
      action: 'success',
      metadata: { bookingId, paymentType },
    });

    // Send invoice receipt email if this was an invoice payment
    logger.debug('Checking if email should be sent', {
      component: 'mark-payment-completed',
      action: 'check_email',
      metadata: {
        paymentType,
        shouldSend: paymentType === 'payment' || paymentType === 'invoice',
      },
    });

    if (paymentType === 'payment' || paymentType === 'invoice') {
      try {
        logger.debug('Fetching booking data for email', {
          component: 'mark-payment-completed',
          action: 'fetch_booking_data',
        });
        const { data: fullBooking } = await supabase
          .from('bookings')
          .select(
            `
            bookingNumber, createdAt, startDate, endDate, totalAmount, subtotal, taxes, floatFee,
            deliveryFee, distanceKm, dailyRate, customerId, securityDeposit,
            deliveryAddress, deliveryCity, deliveryProvince, deliveryPostalCode,
            waiver_selected, waiver_rate_cents,
            couponCode, couponType, couponValue, couponDiscount,
            equipment:equipmentId(make, model, type, unitId)
          `
          )
          .eq('id', bookingId)
          .single();

        const { data: customerData } = await supabase
          .from('users')
          .select('email, firstName, lastName, companyName, phone')
          .eq('id', fullBooking?.customerId)
          .single();

        if (!fullBooking) {
          logger.error('Booking not found for invoice email', {
            component: 'mark-payment-completed',
            action: 'booking_not_found',
            metadata: { bookingId },
          });
        } else if (!customerData) {
          logger.error('Customer not found for invoice email', {
            component: 'mark-payment-completed',
            action: 'customer_not_found',
            metadata: { bookingId, customerId: fullBooking.customerId },
          });
        }

        if (fullBooking && customerData) {
          logger.debug('Got booking and customer data', {
            component: 'mark-payment-completed',
            action: 'got_data',
            metadata: {
              bookingNumber: fullBooking.bookingNumber,
              customerEmail: customerData.email,
              amount: amount,
            },
          });

          logger.info('Sending invoice payment confirmation', {
            component: 'mark-payment-completed',
            action: 'sending_invoice_email',
            metadata: {
              bookingNumber: fullBooking.bookingNumber,
              customerEmail: customerData.email,
              amount: amount,
            },
          });
          await sendInvoicePaymentConfirmation(
            {
              bookingNumber: fullBooking.bookingNumber,
              createdAt: fullBooking.createdAt,
              startDate: fullBooking.startDate,
              endDate: fullBooking.endDate,
              dailyRate: fullBooking.dailyRate,
              subtotal: fullBooking.subtotal,
              floatFee: fullBooking.floatFee,
              deliveryFee: fullBooking.deliveryFee,
              distanceKm: fullBooking.distanceKm,
              securityDeposit: fullBooking.securityDeposit,
              waiverSelected: fullBooking.waiver_selected,
              waiverRateCents: fullBooking.waiver_rate_cents,
              couponCode: fullBooking.couponCode,
              couponType: fullBooking.couponType,
              couponValue: fullBooking.couponValue,
              couponDiscount: fullBooking.couponDiscount,
              taxes: fullBooking.taxes,
              totalAmount: fullBooking.totalAmount,
              deliveryAddress: fullBooking.deliveryAddress,
              deliveryCity: fullBooking.deliveryCity,
              deliveryProvince: fullBooking.deliveryProvince,
              deliveryPostalCode: fullBooking.deliveryPostalCode,
              equipment: normalizeEquipmentRecord(fullBooking.equipment),
            },
            {
              amount: amount,
              method: 'Credit Card',
              paidAt: new Date().toISOString(),
              transactionId: 'DEV-MANUAL-' + Date.now(),
            },
            {
              email: customerData.email,
              firstName: customerData.firstName || '',
              lastName: customerData.lastName || '',
              company: customerData.companyName || '',
              phone: customerData.phone || '',
            }
          );

          logger.info('Invoice payment confirmation email sent', {
            component: 'mark-payment-completed',
            action: 'invoice_email_sent',
            metadata: { bookingNumber: fullBooking.bookingNumber },
          });

          const bookingManagePath = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/booking/${bookingId}/manage`;
          await createInAppNotification({
            supabase,
            userId: fullBooking.customerId,
            category: 'payment',
            priority: normalizedType === 'payment' ? 'medium' : 'high',
            title: normalizedType === 'payment' ? 'Payment received' : 'Security deposit collected',
            message:
              normalizedType === 'payment'
                ? `Thank you! Your payment for booking ${fullBooking.bookingNumber} was received.`
                : `We placed the ${formatCurrency(amount / 100)} security deposit for booking ${fullBooking.bookingNumber}.`,
            actionUrl: bookingManagePath,
            ctaLabel: 'View booking',
            templateId: normalizedType === 'payment' ? 'payment_received' : 'deposit_collected',
            templateData: {
              bookingId,
              bookingNumber: fullBooking.bookingNumber,
              amount: normalizedType === 'payment' ? fullBooking.totalAmount : amount / 100,
              amountFormatted:
                normalizedType === 'payment'
                  ? formatCurrency(fullBooking.totalAmount)
                  : formatCurrency(amount / 100),
              paymentType: normalizedType,
            },
            metadata: {
              bookingId,
              bookingNumber: fullBooking.bookingNumber,
              paymentType: normalizedType,
              amount: normalizedType === 'payment' ? fullBooking.totalAmount : amount / 100,
              amountFormatted:
                normalizedType === 'payment'
                  ? formatCurrency(fullBooking.totalAmount)
                  : formatCurrency(amount / 100),
            },
          });

          await broadcastInAppNotificationToAdmins({
            supabase,
            category: 'payment',
            priority: 'medium',
            title: `Payment recorded for ${fullBooking.bookingNumber}`,
            message: `${customerData.firstName || 'Customer'} paid ${formatCurrency(amount / 100)} (${normalizedType}).`,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/bookings/${bookingId}`,
            ctaLabel: 'Review booking',
            templateId: 'admin_payment_recorded',
            templateData: {
              bookingId,
              bookingNumber: fullBooking.bookingNumber,
              amount: amount / 100,
              amountFormatted: formatCurrency(amount / 100),
              paymentType: normalizedType,
            },
            metadata: {
              bookingId,
              bookingNumber: fullBooking.bookingNumber,
              amount: amount / 100,
              amountFormatted: formatCurrency(amount / 100),
              paymentType: normalizedType,
              audience: 'admin',
            },
          });
        }
      } catch (emailError) {
        logger.error(
          'Failed to send invoice payment email',
          {
            component: 'mark-payment-completed',
            action: 'email_error',
            metadata: {
              error: (emailError as Error).message,
              bookingId,
            },
          },
          emailError as Error
        );
        // Don't fail the payment if email fails - but log it clearly
      }
    }

    // Check if all booking requirements are now complete
    logger.debug('Checking if booking is complete', {
      component: 'mark-payment-completed',
      action: 'check_completion',
    });
    try {
      const result = await checkAndCompleteBookingIfReady(
        bookingId,
        paymentType === 'deposit' ? 'Security Deposit Paid' : 'Invoice Paid'
      );

      if (result.wasCompleted) {
        logger.info('Booking confirmed - completion emails sent', {
          component: 'mark-payment-completed',
          action: 'booking_completed',
          metadata: { bookingId },
        });
      } else {
        logger.debug('Not all requirements met yet', {
          component: 'mark-payment-completed',
          action: 'requirements_pending',
          metadata: { bookingId },
        });
      }
    } catch (completionError) {
      logger.error(
        'Error checking completion',
        {
          component: 'mark-payment-completed',
          action: 'completion_check_error',
          metadata: { bookingId },
        },
        completionError as Error
      );
      // Don't fail the payment if completion check fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment marked as completed (development mode)',
      bookingId,
      paymentType,
    });
  } catch (error: unknown) {
    logger.error(
      'Error marking payment as completed',
      {
        component: 'mark-payment-completed',
        action: 'error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json(
      {
        error: error.message || 'Failed to mark payment as completed',
      },
      { status: 500 }
    );
  }
}
