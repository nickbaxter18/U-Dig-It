/**
 * Create Stripe Checkout Session API
 * Creates a Stripe Checkout session for booking payments (invoice or deposit)
 */
import { NextRequest, NextResponse } from 'next/server';

import { recalculateBookingBalance } from '@/lib/booking/balance';
import { PAYMENT_STATUS } from '@/lib/constants/payment-status';
import { getErrorMessage } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

// import Stripe from 'stripe'; // Unused - type only

export async function POST(req: NextRequest) {
  const stripe = createStripeClient(await getStripeSecretKey());

  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error(
        'Authentication failed',
        {
          component: 'create-checkout-session',
          action: 'auth_failed',
          metadata: { error: authError?.message },
        },
        authError || undefined
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, paymentType = 'invoice' } = await req.json();

    // Get base URL with proper fallback
    const getBaseUrl = () => {
      // Priority 1: Use NEXT_PUBLIC_SITE_URL if set and valid
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
      if (siteUrl) {
        try {
          const url = new URL(siteUrl);
          return url.origin;
        } catch {
          // Invalid URL, continue to next option
        }
      }

      // Priority 2: Use request origin (from headers)
      const origin = req.headers.get('origin') || req.headers.get('host');
      if (origin) {
        // Check if origin already has scheme
        if (origin.startsWith('http://') || origin.startsWith('https://')) {
          try {
            const url = new URL(origin);
            return url.origin;
          } catch {
            // Invalid, continue
          }
        } else {
          // Add scheme based on environment
          const scheme = process.env.NODE_ENV === 'production' ? 'https' : 'http';
          return `${scheme}://${origin}`;
        }
      }

      // Priority 3: Default fallback for development
      return 'http://localhost:3000';
    };

    const baseUrl = getBaseUrl();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    logger.info('Creating checkout session', {
      component: 'create-checkout-session',
      action: 'start',
      metadata: { bookingId, paymentType, userId: user.id },
    });

    // Get booking details with equipment and customer info
    // Include balance_amount to support partial payments
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        balance_amount,
        equipment:equipmentId(make, model, unitId),
        customer:customerId(email, firstName, lastName)
      `
      )
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      logger.error(
        'Booking not found',
        {
          component: 'create-checkout-session',
          action: 'booking_error',
          metadata: { bookingId, error: bookingError?.message },
        },
        bookingError || undefined
      );
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Fetch user role to check admin status
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role && ['admin', 'super_admin'].includes(userData.role);

    // Verify user owns this booking OR is an admin
    if (booking.customerId !== user.id && !isAdmin) {
      logger.warn('Unauthorized booking access attempt', {
        component: 'create-checkout-session',
        action: 'unauthorized_access',
        metadata: { bookingId, userId: user.id, ownerId: booking.customerId, isAdmin },
      });
      return NextResponse.json({ error: 'Unauthorized access to booking' }, { status: 403 });
    }

    // Log admin action if applicable
    if (isAdmin) {
      logger.info('Admin creating checkout session for customer booking', {
        component: 'create-checkout-session',
        action: 'admin_checkout_creation',
        metadata: { bookingId, customerId: booking.customerId, adminId: user.id, paymentType },
      });
    }

    // Recalculate balance before determining amount to ensure accuracy
    // This ensures the balance reflects all completed payments (manual + Stripe)
    const balanceBeforeRecalc = Number(booking.balance_amount ?? booking.totalAmount);
    let recalculatedBalance: number | null = null;

    if (paymentType === 'invoice') {
      logger.info('Recalculating booking balance before checkout creation', {
        component: 'create-checkout-session',
        action: 'balance_recalculation_start',
        metadata: {
          bookingId,
          balanceBeforeRecalc,
          totalAmount: Number(booking.totalAmount),
        },
      });

      recalculatedBalance = await recalculateBookingBalance(bookingId);

      if (recalculatedBalance === null) {
        logger.warn('Balance recalculation failed, using existing balance_amount', {
          component: 'create-checkout-session',
          action: 'balance_recalculation_failed',
          metadata: {
            bookingId,
            balanceBeforeRecalc,
            totalAmount: Number(booking.totalAmount),
          },
        });
        // Graceful degradation: continue with existing balance_amount
        recalculatedBalance = balanceBeforeRecalc;
      } else {
        logger.info('Balance recalculated successfully', {
          component: 'create-checkout-session',
          action: 'balance_recalculated',
          metadata: {
            bookingId,
            balanceBeforeRecalc,
            recalculatedBalance,
            totalAmount: Number(booking.totalAmount),
            balanceChange: recalculatedBalance - balanceBeforeRecalc,
          },
        });
      }

      // Fetch updated booking to get fresh balance_amount after recalculation
      const { data: updatedBooking } = await supabase
        .from('bookings')
        .select('balance_amount, totalAmount')
        .eq('id', bookingId)
        .single();

      if (updatedBooking) {
        booking.balance_amount = updatedBooking.balance_amount;
        logger.debug('Fetched updated booking balance', {
          component: 'create-checkout-session',
          action: 'updated_booking_fetched',
          metadata: {
            bookingId,
            updatedBalanceAmount: updatedBooking.balance_amount,
            recalculatedBalance,
          },
        });
      }
    }

    // Determine amount based on payment type
    // For invoice payments, use remaining balance_amount if available (supports partial payments)
    // For deposit payments, use securityDeposit
    let amount: number;
    let isPartialPayment = false;

    if (paymentType === 'deposit') {
      amount = Number(booking.securityDeposit);
    } else {
      // For invoice payments, use recalculated balance or balance_amount if it exists and is less than totalAmount
      const totalAmount = Number(booking.totalAmount);
      // Use recalculated balance if available, otherwise fall back to balance_amount or totalAmount
      const balanceAmount =
        recalculatedBalance !== null
          ? recalculatedBalance
          : Number(booking.balance_amount ?? totalAmount);

      // Use balance_amount if it's less than totalAmount (partial payment scenario)
      if (balanceAmount < totalAmount && balanceAmount > 0) {
        amount = balanceAmount;
        isPartialPayment = true;
      } else if (balanceAmount === 0) {
        // Balance is already 0, don't create checkout
        logger.warn('Cannot create checkout session - balance is already 0', {
          component: 'create-checkout-session',
          action: 'balance_already_zero',
          metadata: { bookingId, paymentType },
        });
        return NextResponse.json(
          { error: 'Booking balance is already paid in full' },
          { status: 400 }
        );
      } else {
        // Use totalAmount as fallback
        amount = totalAmount;
      }
    }

    const description =
      paymentType === 'deposit'
        ? `Security Deposit: ${booking.equipment.make} ${booking.equipment.model} (${booking.bookingNumber})`
        : isPartialPayment
          ? `Remaining Balance: ${booking.equipment.make} ${booking.equipment.model} (${booking.bookingNumber})`
          : `Rental Invoice: ${booking.equipment.make} ${booking.equipment.model} (${booking.bookingNumber})`;

    // Validate amount is greater than 0
    if (amount <= 0) {
      logger.error('Invalid payment amount', {
        component: 'create-checkout-session',
        action: 'invalid_amount',
        metadata: { bookingId, paymentType, amount },
      });
      return NextResponse.json({ error: 'Payment amount must be greater than 0' }, { status: 400 });
    }

    // Fetch all payments for debugging
    const { data: allManualPayments } = await supabase
      .from('manual_payments')
      .select('id, amount, status')
      .eq('booking_id', bookingId)
      .is('deleted_at', null);

    const { data: allStripePayments } = await supabase
      .from('payments')
      .select('id, amount, status, type')
      .eq('bookingId', bookingId);

    const manualPaymentsCompleted = (allManualPayments ?? [])
      .filter((p) => p.status === PAYMENT_STATUS.COMPLETED)
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const stripePaymentsCompleted = (allStripePayments ?? [])
      .filter((p) => p.status === PAYMENT_STATUS.COMPLETED)
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const totalCollected = manualPaymentsCompleted + stripePaymentsCompleted;

    logger.info('Creating Stripe checkout session', {
      component: 'create-checkout-session',
      action: 'stripe_create',
      metadata: {
        bookingId,
        paymentType,
        amount,
        isPartialPayment,
        totalAmount: Number(booking.totalAmount),
        balanceAmount: Number(booking.balance_amount ?? booking.totalAmount),
        recalculatedBalance: recalculatedBalance !== null ? recalculatedBalance : undefined,
        balanceBeforeRecalc: paymentType === 'invoice' ? balanceBeforeRecalc : undefined,
        // Payment breakdown for debugging
        manualPaymentsCount: allManualPayments?.length ?? 0,
        manualPaymentsCompleted,
        manualPaymentsPending: (allManualPayments ?? []).filter((p) => p.status === 'pending').length,
        stripePaymentsCount: allStripePayments?.length ?? 0,
        stripePaymentsCompleted,
        stripePaymentsPending: (allStripePayments ?? []).filter((p) => p.status === 'pending').length,
        totalCollected,
        calculatedOutstanding: Number(booking.totalAmount) - totalCollected,
        customerEmail: booking.customer.email,
      },
    });

    const sessionMetadata: Record<string, string> = {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      customerId: booking.customerId,
      equipmentId: booking.equipmentId,
      paymentType,
    };

    // Determine redirect URLs based on user role
    const successUrl = isAdmin
      ? `${baseUrl}/admin/bookings?booking=${bookingId}&payment=success&type=${paymentType}&session_id={CHECKOUT_SESSION_ID}`
      : `${baseUrl}/booking/${bookingId}/manage?payment=success&type=${paymentType}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = isAdmin
      ? `${baseUrl}/admin/bookings?booking=${bookingId}&payment=cancelled&type=${paymentType}`
      : `${baseUrl}/booking/${bookingId}/manage?payment=cancelled&type=${paymentType}`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: description,
              description: `Booking: ${booking.bookingNumber}`,
              metadata: {
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
                equipmentId: booking.equipmentId,
                paymentType,
              },
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: booking.customer.email,
      metadata: sessionMetadata,
    });

    logger.info('Checkout session created successfully', {
      component: 'create-checkout-session',
      action: 'success',
      metadata: {
        bookingId,
        paymentType,
        sessionId: session.id,
        sessionUrl: session.url,
      },
    });

    // Normalize payment type for database ('invoice' -> 'payment')
    const dbPaymentType = paymentType === 'invoice' ? 'payment' : paymentType;

    // Generate payment number
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create payment record in database
    const { data: paymentRecord, error: paymentInsertError } = await supabase
      .from('payments')
      .insert({
        bookingId: booking.id,
        paymentNumber,
        amount,
        type: dbPaymentType,
        status: 'pending',
        method: 'credit_card', // Required field - must match enum
        stripePaymentIntentId: (session.payment_intent as string) || null,
        stripeCheckoutSessionId: session.id,
      })
      .select('id')
      .single();

    if (paymentInsertError) {
      logger.error(
        'Failed to create payment record',
        {
          component: 'create-checkout-session',
          action: 'payment_insert_failed',
          metadata: { bookingId, paymentType: dbPaymentType, error: paymentInsertError.message },
        },
        paymentInsertError
      );
      // Don't fail the request - payment record can be created later via webhook
    } else if (paymentRecord?.id) {
      try {
        await stripe.checkout.sessions.update(session.id, {
          metadata: {
            ...sessionMetadata,
            paymentId: paymentRecord.id,
          },
        });
      } catch (metadataError) {
        const errorMessage =
          metadataError instanceof Error ? metadataError.message : 'Unknown error';
        logger.error(
          'Failed to attach paymentId to checkout session metadata',
          {
            component: 'create-checkout-session',
            action: 'metadata_update_failed',
            metadata: {
              sessionId: session.id,
              paymentId: paymentRecord.id,
              error: errorMessage,
            },
          },
          metadataError instanceof Error ? metadataError : undefined
        );
      }
    }

    return NextResponse.json({
      sessionUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    const errorObj = error instanceof Error ? error : undefined;
    logger.error(
      'Checkout session creation error',
      {
        component: 'create-checkout-session',
        action: 'error',
        metadata: {
          message: errorMessage,
          stack: errorObj?.stack,
        },
      },
      errorObj
    );

    return NextResponse.json(
      {
        error: errorMessage || 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
