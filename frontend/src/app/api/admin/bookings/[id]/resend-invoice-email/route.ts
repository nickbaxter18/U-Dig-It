import { NextRequest, NextResponse } from 'next/server';

import { sendInvoicePaymentConfirmation } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/admin/bookings/[id]/resend-invoice-email
 * Manually resend invoice payment confirmation email for a booking
 * Admin-only endpoint
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    const { id: bookingId } = await params;
    const adminSupabase = createServiceClient();

    // Fetch full booking details
    const { data: fullBooking, error: bookingError } = await adminSupabase
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

    if (bookingError || !fullBooking) {
      logger.error('Booking not found for invoice email', {
        component: 'admin-resend-invoice-email',
        action: 'booking_not_found',
        metadata: { bookingId },
      });
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Fetch customer details
    const { data: customerData, error: customerError } = await adminSupabase
      .from('users')
      .select('email, firstName, lastName, companyName, phone')
      .eq('id', fullBooking.customerId)
      .single();

    if (customerError || !customerData) {
      logger.error('Customer not found for invoice email', {
        component: 'admin-resend-invoice-email',
        action: 'customer_not_found',
        metadata: { bookingId, customerId: fullBooking.customerId },
      });
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (!customerData.email) {
      logger.error('Customer email is missing', {
        component: 'admin-resend-invoice-email',
        action: 'customer_email_missing',
        metadata: { bookingId, customerId: fullBooking.customerId },
      });
      return NextResponse.json({ error: 'Customer email is missing' }, { status: 400 });
    }

    // Fetch the most recent completed payment
    const { data: paymentData, error: paymentError } = await adminSupabase
      .from('payments')
      .select('id, amount, processedAt, stripePaymentIntentId')
      .eq('bookingId', bookingId)
      .eq('type', 'payment')
      .eq('status', 'completed')
      .order('processedAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentError) {
      logger.error('Failed to fetch payment for invoice email', {
        component: 'admin-resend-invoice-email',
        action: 'payment_fetch_error',
        metadata: { bookingId, error: paymentError.message },
      });
      return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
    }

    if (!paymentData) {
      logger.error('No completed payment found for invoice email', {
        component: 'admin-resend-invoice-email',
        action: 'no_payment_found',
        metadata: { bookingId },
      });
      return NextResponse.json(
        { error: 'No completed payment found for this booking' },
        { status: 404 }
      );
    }

    // Helper function to normalize equipment record
    const normalizeEquipmentRecord = (equipment: unknown) => {
      if (!equipment) return null;
      if (Array.isArray(equipment)) return equipment[0] || null;
      return equipment;
    };

    // Send the invoice payment confirmation email
    try {
      const emailResult = await sendInvoicePaymentConfirmation(
        {
          bookingNumber: fullBooking.bookingNumber,
          createdAt: fullBooking.createdAt,
          startDate: fullBooking.startDate,
          endDate: fullBooking.endDate,
          subtotal: fullBooking.subtotal,
          taxes: fullBooking.taxes,
          totalAmount: fullBooking.totalAmount,
          dailyRate: fullBooking.dailyRate,
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
          deliveryAddress: fullBooking.deliveryAddress,
          deliveryCity: fullBooking.deliveryCity,
          deliveryProvince: fullBooking.deliveryProvince,
          deliveryPostalCode: fullBooking.deliveryPostalCode,
          equipment: normalizeEquipmentRecord(fullBooking.equipment),
        },
        {
          amount: Number(paymentData.amount),
          method: 'Credit Card',
          paidAt: paymentData.processedAt || new Date().toISOString(),
          transactionId: paymentData.stripePaymentIntentId || undefined,
        },
        {
          email: customerData.email,
          firstName: customerData.firstName || '',
          lastName: customerData.lastName || '',
          company: customerData.companyName || '',
          phone: customerData.phone || '',
        }
      );

      logger.info('✅ Invoice payment confirmation email sent manually', {
        component: 'admin-resend-invoice-email',
        action: 'invoice_email_sent',
        metadata: {
          bookingId,
          bookingNumber: fullBooking.bookingNumber,
          customerEmail: customerData.email,
          amount: paymentData.amount,
          emailResult,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Invoice payment confirmation email sent successfully',
        bookingNumber: fullBooking.bookingNumber,
        customerEmail: customerData.email,
      });
    } catch (emailError) {
      logger.error(
        '❌ Failed to send invoice payment confirmation email',
        {
          component: 'admin-resend-invoice-email',
          action: 'invoice_email_error',
          metadata: {
            bookingId,
            bookingNumber: fullBooking.bookingNumber,
            customerEmail: customerData.email,
            error: emailError instanceof Error ? emailError.message : String(emailError),
          },
        },
        emailError instanceof Error ? emailError : new Error(String(emailError))
      );

      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: emailError instanceof Error ? emailError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (err) {
    logger.error(
      'Unexpected error resending invoice email',
      {
        component: 'admin-resend-invoice-email',
        action: 'unexpected_error',
      },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
