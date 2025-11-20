/**
 * Hold System v4 - Edge Case Handlers
 *
 * Handles special scenarios:
 *   1. Booking within 48h (place both holds immediately)
 *   2. Verification hold failures (prompt card update)
 *   3. T-48 security hold failures (urgent notification + auto-cancel)
 *   4. Booking reschedules (cancel old hold, schedule new one)
 *   5. SCA requirements (deep-link for 3D Secure)
 */
import _Stripe from 'stripe';

// Reserved for future Stripe type usage

import { logger } from './logger';
import {
  broadcastInAppNotificationToAdmins,
  createInAppNotification,
} from './notification-service';
import { createStripeClient, getStripeSecretKey } from './stripe/config';

async function getStripeInstance() {
  return createStripeClient(await getStripeSecretKey());
}

/**
 * Handle booking within 48 hours of pickup
 * Place both $50 verification and $500 security hold immediately
 */
export async function handleBookingWithin48h(
  bookingId: string,
  paymentMethodId: string,
  _supabase: unknown // Reserved for future Supabase usage
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.warn('Booking within 48h - placing both holds immediately', {
      component: 'edge-cases',
      action: 'within_48h',
      metadata: { bookingId },
    });

    // Step 1: Place $50 verification hold
    const verifyResponse = await fetch('/api/stripe/place-verify-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        paymentMethodId,
      }),
    });

    if (!verifyResponse.ok) {
      throw new Error('Failed to place verification hold');
    }

    // Step 2: Immediately place $500 security hold (no wait)
    const securityResponse = await fetch('/api/stripe/place-security-hold', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-service-key': process.env.INTERNAL_SERVICE_KEY!,
      },
      body: JSON.stringify({ bookingId }),
    });

    if (!securityResponse.ok) {
      const errorData = await securityResponse.json();

      // Check if SCA required
      if (errorData.requiresAction) {
        return {
          success: false,
          error: 'SCA_REQUIRED',
          clientSecret: errorData.clientSecret,
        } as any;
      }

      throw new Error(errorData.error || 'Failed to place security hold');
    }

    logger.info('Both holds placed successfully for <48h booking', {
      component: 'edge-cases',
      action: 'within_48h_success',
      metadata: { bookingId },
    });

    return { success: true };
  } catch (error: unknown) {
    logger.error(
      'Failed to handle <48h booking',
      {
        component: 'edge-cases',
        action: 'within_48h_error',
        metadata: { bookingId, error: error.message },
      },
      error
    );

    return { success: false, error: error.message };
  }
}

/**
 * Handle verification hold failure
 * Send notification to customer to update card
 */
export async function handleVerificationHoldFailure(
  bookingId: string,
  customerId: string,
  failureReason: string,
  supabase: any
): Promise<void> {
  logger.error('Verification hold failed', {
    component: 'edge-cases',
    action: 'verify_hold_failed',
    metadata: { bookingId, failureReason },
  });

  await createInAppNotification({
    supabase,
    userId: customerId,
    category: 'payment',
    priority: 'high',
    title: 'Action Required: Update Payment Method',
    message: `Your card verification failed for booking ${bookingId}. Please update your payment method to continue.`,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/booking/${bookingId}/manage`,
    ctaLabel: 'Update payment method',
    templateId: 'verify_hold_failed',
    templateData: {
      bookingId,
      failureReason,
      updateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${bookingId}/update-card`,
    },
    metadata: {
      bookingId,
      failureReason,
      context: 'verification_hold',
    },
  });

  // Keep booking in 'pending' status - customer can retry
  await supabase
    .from('bookings')
    .update({
      status: 'pending',
      internalNotes: `Verification hold failed: ${failureReason}. Awaiting card update.`,
    })
    .eq('id', bookingId);
}

/**
 * Handle T-48 security hold failure
 * Urgent notification + auto-cancel if not resolved within 24h
 */
export async function handleSecurityHoldFailure(
  bookingId: string,
  customerId: string,
  failureReason: string,
  supabase: any
): Promise<void> {
  logger.error('Security hold failed at T-48', {
    component: 'edge-cases',
    action: 'security_hold_failed',
    metadata: { bookingId, failureReason },
  });

  await createInAppNotification({
    supabase,
    userId: customerId,
    category: 'payment',
    priority: 'critical',
    title: 'URGENT: Update Payment Method - Booking May Be Cancelled',
    message:
      "We couldn't place the $500 security hold for your booking. Update your card within 12 hours to avoid auto-cancellation.",
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/booking/${bookingId}/manage`,
    ctaLabel: 'Fix payment method',
    templateId: 'security_hold_failed_urgent',
    templateData: {
      bookingId,
      failureReason,
      updateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${bookingId}/update-card`,
      deadlineHours: 12,
    },
    metadata: {
      bookingId,
      failureReason,
      context: 'security_hold',
    },
  });

  // Alert admin immediately
  await broadcastInAppNotificationToAdmins({
    supabase,
    category: 'system',
    priority: 'critical',
    title: `Security hold failed: ${bookingId}`,
    message: `Customer pickup in <48h but hold failed: ${failureReason}. Manual intervention needed.`,
    templateId: 'security_hold_failed_admin',
    templateData: {
      bookingId,
      failureReason,
    },
    metadata: {
      bookingId,
      customerId,
      failureReason,
      audience: 'admin',
    },
  });

  // Schedule auto-cancel job for 12h from now (if not resolved)
  await supabase.from('schedules').insert({
    booking_id: bookingId,
    job_type: 'auto_cancel_on_hold_failure',
    run_at_utc: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    metadata: {
      reason: 'security_hold_failed',
      grace_period_hours: 12,
    },
  });
}

/**
 * Handle booking reschedule
 * Cancel existing security hold (if placed) and reschedule T-48 job
 */
export async function handleBookingReschedule(
  bookingId: string,
  oldStartDate: string,
  newStartDate: string,
  supabase: any
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('Handling booking reschedule', {
      component: 'edge-cases',
      action: 'reschedule',
      metadata: {
        bookingId,
        oldStartDate,
        newStartDate,
      },
    });

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('security_hold_intent_id, customerId, bookingNumber, startDate, endDate')
      .eq('id', bookingId)
      .single();

    // If security hold already placed, cancel it
    if (booking?.security_hold_intent_id) {
      logger.info('Canceling existing security hold due to reschedule', {
        component: 'edge-cases',
        action: 'cancel_old_hold',
        metadata: {
          bookingId,
          intentId: booking.security_hold_intent_id,
        },
      });

      const stripe = await getStripeInstance();
      await stripe.paymentIntents.cancel(booking.security_hold_intent_id);

      // Clear hold intent ID
      await supabase
        .from('bookings')
        .update({
          security_hold_intent_id: null,
          status: 'verify_hold_ok', // Reset to after verification
        })
        .eq('id', bookingId);

      // Record release in booking_payments
      await supabase.from('booking_payments').insert({
        booking_id: bookingId,
        purpose: 'release',
        amount_cents: 0,
        currency: 'cad',
        stripe_payment_intent_id: booking.security_hold_intent_id,
        status: 'succeeded',
        metadata: {
          reason: 'booking_rescheduled',
          old_start_date: oldStartDate,
          new_start_date: newStartDate,
          released_at: new Date().toISOString(),
        },
      });
    }

    // Cancel old T-48 job
    await supabase
      .from('schedules')
      .update({ status: 'canceled' })
      .eq('booking_id', bookingId)
      .eq('job_type', 'place_hold')
      .eq('status', 'pending');

    // Schedule new T-48 job for new pickup date
    const newPickupDate = new Date(newStartDate);
    const newT48Date = new Date(newPickupDate.getTime() - 48 * 60 * 60 * 1000);
    const now = new Date();

    if (newT48Date > now) {
      const idempotencyKey = `${bookingId}:place_security_hold:${newPickupDate.getTime()}`;

      await supabase.from('schedules').insert({
        booking_id: bookingId,
        job_type: 'place_hold',
        run_at_utc: newT48Date.toISOString(),
        status: 'pending',
        idempotency_key: idempotencyKey,
        metadata: {
          purpose: 'security_hold',
          amount_cents: 50000,
          rescheduled_from: oldStartDate,
        },
      });

      logger.info('Rescheduled T-48 job for new pickup date', {
        component: 'edge-cases',
        action: 'reschedule_job',
        metadata: {
          bookingId,
          newT48Date: newT48Date.toISOString(),
        },
      });
    } else {
      logger.warn('New booking is within 48h - needs immediate hold placement', {
        component: 'edge-cases',
        action: 'reschedule_within_48h',
        metadata: { bookingId, newStartDate },
      });
    }

    if (booking?.customerId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      const manageUrl = `${appUrl}/booking/${bookingId}/manage`;

      const oldDate = new Date(oldStartDate);
      const newDate = new Date(newStartDate);

      try {
        await createInAppNotification({
          supabase,
          userId: booking.customerId,
          category: 'booking',
          priority: 'medium',
          title: 'Booking dates updated',
          message: `Your rental for booking ${booking.bookingNumber} now starts on ${newDate.toLocaleDateString()}.`,
          actionUrl: manageUrl,
          ctaLabel: 'Review updated schedule',
          templateId: 'booking_rescheduled_customer',
          templateData: {
            bookingId,
            bookingNumber: booking.bookingNumber,
            oldStartDate,
            newStartDate,
            oldEndDate: booking.endDate,
          },
          metadata: {
            bookingId,
            bookingNumber: booking.bookingNumber,
            event: 'booking_rescheduled',
          },
        });
      } catch (notificationError) {
        logger.error(
          'Failed to send reschedule notification to customer',
          {
            component: 'edge-cases',
            action: 'reschedule_notification_error',
            metadata: { bookingId },
          },
          notificationError instanceof Error
            ? notificationError
            : new Error(String(notificationError))
        );
      }

      try {
        await broadcastInAppNotificationToAdmins({
          supabase,
          category: 'booking',
          priority: 'medium',
          title: `Booking ${booking.bookingNumber} rescheduled`,
          message: `Dates updated from ${oldDate.toLocaleDateString()} to ${newDate.toLocaleDateString()}. Security hold workflow reset.`,
          actionUrl: `${appUrl}/admin/bookings/${bookingId}`,
          ctaLabel: 'Review booking',
          templateId: 'booking_rescheduled_admin',
          templateData: {
            bookingId,
            bookingNumber: booking.bookingNumber,
            oldStartDate,
            newStartDate,
          },
          metadata: {
            bookingId,
            bookingNumber: booking.bookingNumber,
            event: 'admin_booking_rescheduled',
          },
        });
      } catch (adminNotificationError) {
        logger.error(
          'Failed to broadcast admin reschedule notification',
          {
            component: 'edge-cases',
            action: 'reschedule_admin_notification_error',
            metadata: { bookingId },
          },
          adminNotificationError instanceof Error
            ? adminNotificationError
            : new Error(String(adminNotificationError))
        );
      }
    }

    return { success: true };
  } catch (error: unknown) {
    logger.error(
      'Failed to handle booking reschedule',
      {
        component: 'edge-cases',
        action: 'reschedule_error',
        metadata: { bookingId, error: error.message },
      },
      error
    );

    return { success: false, error: error.message };
  }
}

/**
 * Generate SCA deep link for mobile authentication
 * Used when customer needs to complete 3D Secure on their phone
 */
export function generateSCADeepLink(
  clientSecret: string,
  bookingId: string,
  returnUrl?: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const callback = returnUrl || `${baseUrl}/booking/${bookingId}/manage`;

  // Stripe hosted page for 3D Secure
  const scaUrl =
    `${baseUrl}/auth/sca?` +
    new URLSearchParams({
      payment_intent_client_secret: clientSecret,
      return_url: callback,
    }).toString();

  return scaUrl;
}

/**
 * Check if booking is within 48 hours
 */
export function isWithin48Hours(startDate: string | Date): boolean {
  const pickup = new Date(startDate);
  const t48 = new Date(pickup.getTime() - 48 * 60 * 60 * 1000);
  return t48 <= new Date();
}

/**
 * Calculate T-48 timestamp
 */
export function calculateT48Timestamp(startDate: string | Date): Date {
  const pickup = new Date(startDate);
  return new Date(pickup.getTime() - 48 * 60 * 60 * 1000);
}

/**
 * Validate hold amounts
 */
export function validateHoldAmounts(
  verifyAmountCents: number,
  securityAmountCents: number
): { valid: boolean; error?: string } {
  if (verifyAmountCents < 1000 || verifyAmountCents > 10000) {
    return {
      valid: false,
      error: 'Verification hold must be between $10 and $100',
    };
  }

  if (securityAmountCents < 10000 || securityAmountCents > 100000) {
    return {
      valid: false,
      error: 'Security hold must be between $100 and $1000',
    };
  }

  return { valid: true };
}
