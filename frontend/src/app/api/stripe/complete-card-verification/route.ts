/**
 * API Route: Complete Card Verification
 *
 * Called after successful Stripe Checkout Session (setup mode)
 * Retrieves payment method and saves to booking
 */
import { NextRequest, NextResponse } from 'next/server';

import { sendAdminBookingNotification, sendBookingConfirmationEmail } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import {
  broadcastInAppNotificationToAdmins,
  createInAppNotification,
} from '@/lib/notification-service';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/request-validator';
import { createStripeClient, getStripeSecretKey } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const stripe = createStripeClient(await getStripeSecretKey());

  try {
    // 1. Request validation (increased size for booking form data)
    const validation = await validateRequest(request, {
      maxSize: 50 * 1024, // 50KB for booking form data
      allowedContentTypes: ['application/json'],
    });
    if (!validation.valid) return validation.error!;

    // 2. Rate limiting (allow admins to bypass for testing)
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.STRICT, // Changed from VERY_STRICT
      skipAdmins: true, // Allow super_admin to bypass rate limiting
    });
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for card verification', {
        component: 'complete-card-verification',
        action: 'rate_limit_exceeded',
        metadata: { remaining: rateLimitResult.remaining },
      });
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // 3. Auth verification
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Parse request
    const body = await request.json();
    const { sessionId, bookingId, bookingFormData } = body;

    if (!sessionId || !bookingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    logger.info('Completing card verification', {
      component: 'complete-card-verification',
      action: 'start',
      metadata: { sessionId: sessionId.substring(0, 20) + '...', bookingId },
    });

    // 5. Retrieve the Checkout Session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.mode !== 'setup') {
      return NextResponse.json({ error: 'Invalid session mode' }, { status: 400 });
    }

    if (session.status !== 'complete') {
      return NextResponse.json({ error: 'Session not completed' }, { status: 400 });
    }

    // 6. Get the SetupIntent
    const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent as string);

    if (!setupIntent.payment_method) {
      return NextResponse.json({ error: 'No payment method found' }, { status: 400 });
    }

    const paymentMethodId = setupIntent.payment_method as string;

    logger.info('Payment method retrieved from SetupIntent', {
      component: 'complete-card-verification',
      action: 'payment_method_retrieved',
      metadata: {
        bookingId,
        setupIntentId: setupIntent.id,
        paymentMethodId: paymentMethodId.substring(0, 10) + '...',
      },
    });

    // 7. For temporary bookings, create the real booking now
    const isTemporaryBooking =
      bookingId === 'pending' || bookingId === 'temporary' || bookingId.startsWith('temp-');

    if (isTemporaryBooking) {
      logger.info('Temporary booking - creating real booking now', {
        component: 'complete-card-verification',
        action: 'create_booking',
        metadata: {
          tempBookingId: bookingId,
          paymentMethodId: paymentMethodId.substring(0, 10) + '...',
        },
      });

      // Validate that we have booking form data
      if (!bookingFormData) {
        return NextResponse.json(
          {
            error: 'Booking form data not provided. Please start over.',
          },
          { status: 400 }
        );
      }

      // Generate unique booking number
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      const bookingNumber = `BK-${timestamp}-${random}`;

      logger.info('Generated booking number', {
        component: 'complete-card-verification',
        action: 'generate_booking_number',
        metadata: { bookingNumber },
      });

      // ✅ CRITICAL FIX: Ensure coupon fields are properly typed and converted to NULL if not present
      // The database constraint requires these fields to be NULL (not undefined) when no coupon is applied
      const couponCode = bookingFormData.appliedDiscount?.code || null;
      const couponType = bookingFormData.appliedDiscount?.type || null;
      const couponValue = bookingFormData.appliedDiscount?.value || null;

      // ✅ VALIDATION: Ensure couponType is valid if provided
      // Valid types: 'percentage', 'fixed', 'fixed_amount' (Spin to Win)
      const validCouponTypes = ['percentage', 'fixed', 'fixed_amount'];
      if (couponType && !validCouponTypes.includes(couponType)) {
        logger.error('Invalid coupon type from localStorage', {
          component: 'complete-card-verification',
          action: 'validation_error',
          metadata: {
            couponType,
            appliedDiscount: bookingFormData.appliedDiscount,
            validTypes: validCouponTypes,
          },
        });
        return NextResponse.json(
          {
            error: `Invalid coupon type: ${couponType}. Please try again.`,
          },
          { status: 400 }
        );
      }

      logger.info('Processing coupon data for booking', {
        component: 'complete-card-verification',
        action: 'coupon_processing',
        metadata: {
          hasCoupon: !!bookingFormData.appliedDiscount,
          couponCode,
          couponType,
          couponValue,
          couponType_type: typeof couponType,
          couponType_isNull: couponType === null,
          couponType_isEmpty: couponType === '',
          couponType_length: couponType ? couponType.length : 0,
          couponType_charCodes: couponType
            ? Array.from(couponType).map((c: unknown) => (c as string).charCodeAt(0))
            : [],
          appliedDiscountRaw: bookingFormData.appliedDiscount,
        },
      });

      // ✅ DEBUG: Log EXACT insert values before database call
      logger.debug('Insert values for booking creation', {
        component: 'complete-card-verification',
        action: 'booking_insert_debug',
        metadata: {
          couponCode,
          couponType,
          couponValue,
          couponType_stringified: JSON.stringify(couponType),
          couponType_matches_percentage: couponType === 'percentage',
          couponType_matches_fixed: couponType === 'fixed',
        },
      });

      // Initialize balance_amount: totalAmount (deposit hasn't been paid yet)
      // The deposit only reduces the balance once it's been paid (depositPaid = true)
      const totalAmount = bookingFormData.totalAmount || 817.5;
      const depositAmount = 500; // securityDeposit
      const initialBalance = totalAmount;

      // Create the booking in database with accurate pricing from localStorage
      const { data: createdBooking, error: createError } = await supabase
        .from('bookings')
        .insert({
          bookingNumber,
          customerId: user.id,
          equipmentId: bookingFormData.equipmentId || '96488a54-2649-4e1f-8a55-9eac48de5a4d', // Default to SVL-75
          startDate: bookingFormData.startDate,
          endDate: bookingFormData.endDate,
          deliveryAddress: bookingFormData.deliveryAddress,
          deliveryCity: bookingFormData.deliveryCity || '',
          deliveryProvince: bookingFormData.deliveryProvince || 'NB',
          deliveryPostalCode: bookingFormData.deliveryPostalCode || '',
          type: bookingFormData.deliveryType || 'delivery',
          dailyRate: bookingFormData.dailyRate || 450,
          weeklyRate: bookingFormData.weeklyRate || 2250,
          monthlyRate: bookingFormData.monthlyRate || 9000,
          // ✅ Use pricing from localStorage (calculated in booking flow)
          subtotal: bookingFormData.subtotal || 450,
          taxes: bookingFormData.taxes || 67.5,
          floatFee: bookingFormData.floatFee || 300, // Flat fee (base delivery)
          deliveryFee: bookingFormData.deliveryFee || 300, // Total delivery cost
          totalAmount,
          securityDeposit: depositAmount,
          depositAmount: depositAmount,
          balance_amount: initialBalance,
          distanceKm: bookingFormData.distanceKm || bookingFormData.locationData?.distanceKm || 0,
          status: 'verify_hold_ok',
          stripe_payment_method_id: paymentMethodId,
          stripe_customer_id: (await stripe.customers.retrieve(setupIntent.customer as string)).id,
          // ✅ FIX: Use validated coupon values (explicitly null if not present)
          couponCode: couponCode,
          couponType: couponType,
          couponValue: couponValue,
          waiver_selected: bookingFormData.waiverSelected || false,
          waiver_rate_cents: bookingFormData.waiverSelected ? 2900 : 0, // $29/day in cents
        })
        .select()
        .single();

      if (createError || !createdBooking) {
        logger.error(
          'Failed to create booking',
          {
            component: 'complete-card-verification',
            action: 'create_booking_error',
            metadata: { error: createError?.message },
          },
          createError || undefined
        );

        return NextResponse.json(
          {
            error: 'Failed to create booking: ' + (createError?.message || 'Unknown error'),
          },
          { status: 500 }
        );
      }

      logger.info('Booking created successfully', {
        component: 'complete-card-verification',
        action: 'booking_created',
        metadata: {
          bookingId: createdBooking.id,
          bookingNumber: createdBooking.bookingNumber,
          paymentMethodId: paymentMethodId.substring(0, 10) + '...',
        },
      });

      // 📧 Send booking confirmation email
      try {
        const { data: customerData } = await supabase
          .from('users')
          .select('email, firstName, lastName, phone')
          .eq('id', user.id)
          .single();

        if (customerData) {
          // Send customer confirmation email
          await sendBookingConfirmationEmail(
            {
              id: createdBooking.id,
              bookingNumber: createdBooking.bookingNumber,
              startDate: createdBooking.startDate,
              endDate: createdBooking.endDate,
              totalAmount: createdBooking.totalAmount,
              deliveryAddress: createdBooking.deliveryAddress || undefined,
            },
            {
              email: customerData.email,
              firstName: customerData.firstName || '',
              lastName: customerData.lastName || '',
            }
          );

          logger.info('✅ Booking confirmation email sent to customer', {
            component: 'complete-card-verification',
            action: 'customer_email_sent',
            metadata: {
              bookingNumber: createdBooking.bookingNumber,
              customerEmail: customerData.email,
            },
          });

          await createInAppNotification({
            supabase,
            userId: user.id,
            category: 'booking',
            priority: 'medium',
            title: 'Booking Confirmed',
            message: `Booking ${createdBooking.bookingNumber} has been confirmed.`,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/booking/${createdBooking.id}/manage`,
            ctaLabel: 'View booking',
            templateId: 'booking_confirmed',
            templateData: {
              bookingId: createdBooking.id,
              bookingNumber: createdBooking.bookingNumber,
              startDate: createdBooking.startDate,
              endDate: createdBooking.endDate,
            },
            metadata: {
              bookingId: createdBooking.id,
              bookingNumber: createdBooking.bookingNumber,
            },
          });

          // Send admin notification email
          await sendAdminBookingNotification(
            {
              id: createdBooking.id,
              bookingNumber: createdBooking.bookingNumber,
              startDate: createdBooking.startDate,
              endDate: createdBooking.endDate,
              totalAmount: createdBooking.totalAmount,
              deliveryAddress: createdBooking.deliveryAddress || undefined,
            },
            {
              email: customerData.email,
              firstName: customerData.firstName || '',
              lastName: customerData.lastName || '',
              phone: customerData.phone || undefined,
            }
          );

          logger.info('✅ Admin notification email sent', {
            component: 'complete-card-verification',
            action: 'admin_email_sent',
            metadata: {
              bookingNumber: createdBooking.bookingNumber,
              adminEmail: 'nickbaxter@udigit.ca',
            },
          });

          await broadcastInAppNotificationToAdmins({
            supabase,
            category: 'booking',
            priority: 'high',
            title: `New booking ${createdBooking.bookingNumber}`,
            message: `${customerData.firstName || 'Customer'} booked equipment for ${new Date(createdBooking.startDate).toLocaleDateString()} - ${new Date(createdBooking.endDate).toLocaleDateString()}.`,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/bookings/${createdBooking.id}`,
            ctaLabel: 'Review booking',
            templateId: 'admin_booking_created',
            templateData: {
              bookingId: createdBooking.id,
              bookingNumber: createdBooking.bookingNumber,
              customerEmail: customerData.email,
            },
            metadata: {
              bookingId: createdBooking.id,
              bookingNumber: createdBooking.bookingNumber,
              audience: 'admin',
            },
          });
        }
      } catch (emailError) {
        // Don't fail booking if email fails
        logger.error(
          'Failed to send booking confirmation email',
          {
            component: 'complete-card-verification',
            action: 'email_error',
            metadata: { bookingNumber: createdBooking.bookingNumber },
          },
          emailError as Error
        );
      }

      // Record card verification in booking_payments
      await supabase.from('booking_payments').insert({
        booking_id: createdBooking.id,
        purpose: 'verify_card',
        amount_cents: 0,
        currency: 'cad',
        stripe_payment_intent_id: setupIntent.id,
        status: 'succeeded',
        metadata: {
          payment_method_id: paymentMethodId,
          saved_at: new Date().toISOString(),
          session_id: sessionId,
        },
      });

      // Schedule T-48 security hold
      const startDate = new Date(createdBooking.startDate);
      const holdPlacementTime = new Date(startDate.getTime() - 48 * 60 * 60 * 1000);
      const now = new Date();

      if (holdPlacementTime > now) {
        const scheduleIdempotencyKey = `${createdBooking.id}:place_security_hold:${startDate.getTime()}`;

        await supabase.from('schedules').insert({
          booking_id: createdBooking.id,
          job_type: 'place_hold',
          run_at_utc: holdPlacementTime.toISOString(),
          status: 'pending',
          idempotency_key: scheduleIdempotencyKey,
          metadata: {
            purpose: 'security_hold',
            amount_cents: 50000,
          },
        });

        logger.info('Scheduled T-48 security hold', {
          component: 'complete-card-verification',
          action: 'hold_scheduled',
          metadata: { bookingId: createdBooking.id, runAt: holdPlacementTime.toISOString() },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Card verified and booking created successfully',
        paymentMethodId,
        bookingId: createdBooking.id,
        bookingNumber: createdBooking.bookingNumber,
      });
    }

    // 8. For real bookings, verify ownership and save
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customerId, startDate')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking || booking.customerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 9. Save payment method to booking
    await supabase
      .from('bookings')
      .update({
        stripe_payment_method_id: paymentMethodId,
        status: 'verify_hold_ok',
      })
      .eq('id', bookingId);

    // 10. Record in booking_payments
    await supabase.from('booking_payments').insert({
      booking_id: bookingId,
      purpose: 'verify_card',
      amount_cents: 0,
      currency: 'cad',
      stripe_payment_intent_id: setupIntent.id,
      status: 'succeeded',
      metadata: {
        payment_method_id: paymentMethodId,
        saved_at: new Date().toISOString(),
        session_id: sessionId,
      },
    });

    // 11. Schedule T-48 security hold
    const startDate = new Date(booking.startDate);
    const holdPlacementTime = new Date(startDate.getTime() - 48 * 60 * 60 * 1000);
    const now = new Date();

    if (holdPlacementTime > now) {
      const scheduleIdempotencyKey = `${bookingId}:place_security_hold:${startDate.getTime()}`;

      await supabase.from('schedules').insert({
        booking_id: bookingId,
        job_type: 'place_hold',
        run_at_utc: holdPlacementTime.toISOString(),
        status: 'pending',
        idempotency_key: scheduleIdempotencyKey,
        metadata: {
          purpose: 'security_hold',
          amount_cents: 50000,
        },
      });

      logger.info('Scheduled T-48 security hold job', {
        component: 'complete-card-verification',
        action: 'job_scheduled',
        metadata: {
          bookingId,
          runAt: holdPlacementTime.toISOString(),
        },
      });
    }

    logger.info('Card verification completed successfully', {
      component: 'complete-card-verification',
      action: 'success',
      metadata: { bookingId, paymentMethodId: paymentMethodId.substring(0, 10) + '...' },
    });

    return NextResponse.json({
      success: true,
      message: 'Card verified and saved successfully',
      paymentMethodId,
      nextStep:
        holdPlacementTime > now
          ? `$500 security hold will be placed on ${holdPlacementTime.toLocaleString()}`
          : 'Security hold placement needed (booking within 48h)',
    });
  } catch (error: unknown) {
    logger.error(
      'Failed to complete card verification',
      {
        component: 'complete-card-verification',
        action: 'error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json(
      { error: 'Failed to complete verification', details: error.message },
      { status: 500 }
    );
  }
}
