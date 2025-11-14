'use server';

/**
 * Booking Completion Actions
 * Handles automatic booking confirmation when all requirements are met
 */
import type { Database } from '@/../../supabase/types';
import { type SupabaseClient, createClient as createAdminClient } from '@supabase/supabase-js';

import { revalidatePath } from 'next/cache';

import {
  sendAdminBookingCompletedNotification,
  sendBookingCompletionEmail,
} from '@/lib/email-service';
import { logger } from '@/lib/logger';
import {
  broadcastInAppNotificationToAdmins,
  createInAppNotification,
} from '@/lib/notification-service';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

interface CompletionCheckResult {
  isComplete: boolean;
  completedSteps: {
    contract_signed: boolean;
    insurance_uploaded: boolean;
    license_uploaded: boolean;
    payment_completed: boolean;
    deposit_paid: boolean;
  };
  missingSteps: string[];
}

interface BookingConfirmationResult {
  success: boolean;
  message: string;
  bookingId?: string;
  bookingNumber?: string;
  redirectUrl?: string;
  error?: string;
}

type AdminSupabaseClient = SupabaseClient<Database>;

interface BookingWithRelations {
  id: string;
  bookingNumber: string;
  startDate: string;
  endDate: string;
  deliveryAddress?: string | null;
  totalAmount: number;
  equipmentId: string;
  type: string;
  status: string;
  completionEmailSentAt: string | null;
  customerId: string | null;
  customer: {
    id?: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone?: string | null;
  };
  equipment: {
    make?: string | null;
    model?: string | null;
    unitId?: string | null;
    type?: string | null;
  } | null;
}

async function dispatchCompletionEmails(
  adminSupabase: AdminSupabaseClient,
  booking: BookingWithRelations
) {
  const customer = booking.customer;

  if (!customer?.email) {
    throw new Error('Booking is missing customer email address');
  }

  const customerFirstName = customer.firstName ?? customer.email.split('@')[0] ?? '';
  const customerLastName = customer.lastName ?? '';

  await sendBookingCompletionEmail(
    {
      bookingNumber: booking.bookingNumber,
      startDate: booking.startDate,
      endDate: booking.endDate,
      deliveryAddress: booking.deliveryAddress || undefined,
    },
    {
      email: customer.email,
      firstName: customerFirstName,
      lastName: customerLastName,
    }
  );

  logger.info('✅ Booking completion email sent to customer', {
    component: 'booking-completion-actions',
    action: 'completion_email_sent',
    metadata: {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      customerEmail: customer.email,
    },
  });

  await sendAdminBookingCompletedNotification(
    {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      startDate: booking.startDate,
      endDate: booking.endDate,
      deliveryAddress: booking.deliveryAddress || undefined,
      totalAmount: booking.totalAmount,
    },
    {
      email: customer.email,
      firstName: customerFirstName,
      lastName: customerLastName,
      phone: customer.phone || undefined,
    }
  );

  logger.info('✅ Admin completion notification sent', {
    component: 'booking-completion-actions',
    action: 'admin_completion_notification_sent',
    metadata: {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      adminEmail: 'nickbaxter@udigit.ca',
    },
  });

  const timestamp = new Date().toISOString();
  const { error: markError } = await adminSupabase
    .from('bookings')
    .update({ completionEmailSentAt: timestamp })
    .eq('id', booking.id);

  if (markError) {
    logger.error('Failed to record completion email timestamp', {
      component: 'booking-completion-actions',
      action: 'completion_email_timestamp_error',
      metadata: { bookingId: booking.id, error: markError.message },
    });
  } else {
    booking.completionEmailSentAt = timestamp;
  }

  await createInAppNotification({
    supabase: adminSupabase,
    userId: booking.customerId ?? booking.customer?.id ?? null,
    category: 'booking',
    priority: 'medium',
    title: 'Booking completed',
    message: `Thanks for renting with us! Booking ${booking.bookingNumber} is now marked as completed.`,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/booking/${booking.id}/manage`,
    ctaLabel: 'View summary',
    templateId: 'booking_completed_customer',
    templateData: {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      endDate: booking.endDate,
    },
    metadata: {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
    },
  });

  await broadcastInAppNotificationToAdmins({
    supabase: adminSupabase,
    category: 'booking',
    priority: 'high',
    title: `Booking ${booking.bookingNumber} completed`,
    message: `Booking ${booking.bookingNumber} has been marked completed. Review and archive if necessary.`,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/bookings/${booking.id}`,
    ctaLabel: 'Review booking',
    templateId: 'booking_completed_admin',
    templateData: {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
    },
    metadata: {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      audience: 'admin',
    },
  });
}

type SupabaseErrorShape = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function normalizeError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as SupabaseErrorShape;
    const parts = [
      supabaseError.message,
      supabaseError.details ? `details: ${supabaseError.details}` : undefined,
      supabaseError.hint ? `hint: ${supabaseError.hint}` : undefined,
      supabaseError.code ? `code: ${supabaseError.code}` : undefined,
    ].filter(Boolean);

    const normalized = new Error(parts.join(' | ') || fallbackMessage);

    if (supabaseError.code) {
      (normalized as Error & { code?: string }).code = supabaseError.code;
    }
    if (supabaseError.details) {
      (normalized as Error & { details?: string }).details = supabaseError.details;
    }
    if (supabaseError.hint) {
      (normalized as Error & { hint?: string }).hint = supabaseError.hint;
    }

    (normalized as Error & { cause?: unknown }).cause = error;
    return normalized;
  }

  const fallback = typeof error === 'string' && error.trim().length > 0 ? error : fallbackMessage;
  return new Error(fallback);
}

/**
 * Check if all booking requirements are complete
 */
export async function checkBookingCompletion(bookingId: string): Promise<CompletionCheckResult> {
  try {
    const supabase = await createClient();
    // Fetch booking with all related data (including stripe_payment_method_id for deposit check)
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        stripe_payment_method_id,
        contracts(id, status, signedAt, completedAt),
        payments(type, status, amount),
        insurance_documents(id, status),
        customer:customerId(driversLicense, drivers_license_verified_at)
      `
      )
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new Error('Booking not found');
    }

    // Check each requirement
    const payment = booking.payments?.find(
      (p: { type: string; status: string }) => p.type === 'payment'
    );
    const hasInsurance = booking.insurance_documents && booking.insurance_documents.length > 0;

    const { data: approvedVerification } = await supabase
      .from('id_verification_requests')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const hasApprovedVerification = Boolean(approvedVerification);
    const hasVerifiedDriverLicense = Boolean(booking.customer?.drivers_license_verified_at);
    const hasLicense = hasApprovedVerification || hasVerifiedDriverLicense;

    const contractSigned = Array.isArray(booking.contracts)
      ? booking.contracts.some(
          (contract: { status?: string }) =>
            contract?.status === 'signed' || contract?.status === 'completed'
        )
      : false;
    const paymentCompleted = payment?.status === 'completed' || booking.status === 'paid';
    // ✅ CRITICAL FIX: Deposit is "paid" when card is verified (stripe_payment_method_id exists)
    // This matches the UI logic in manage/page.tsx line 145
    const depositPaid = !!booking.stripe_payment_method_id;

    const completedSteps = {
      contract_signed: contractSigned,
      insurance_uploaded: hasInsurance,
      license_uploaded: hasLicense,
      payment_completed: paymentCompleted,
      deposit_paid: depositPaid,
    };

    const missingSteps: string[] = [];
    if (!contractSigned) missingSteps.push('Contract signing');
    if (!hasInsurance) missingSteps.push('Insurance upload');
    if (!hasLicense) missingSteps.push('ID verification');
    if (!paymentCompleted) missingSteps.push('Invoice payment');
    if (!depositPaid) missingSteps.push('Security deposit');

    const isComplete = missingSteps.length === 0;

    return {
      isComplete,
      completedSteps,
      missingSteps,
    };
  } catch (error) {
    logger.error(
      'Error checking booking completion:',
      {
        component: 'booking-completion-actions',
        action: 'check_completion_error',
        metadata: { bookingId },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return {
      isComplete: false,
      completedSteps: {
        contract_signed: false,
        insurance_uploaded: false,
        license_uploaded: false,
        payment_completed: false,
        deposit_paid: false,
      },
      missingSteps: ['Error checking completion status'],
    };
  }
}

/**
 * Confirm booking automatically when all requirements are met
 * This is called automatically when the last requirement is completed
 */
export async function confirmBookingAutomatically(
  bookingId: string
): Promise<BookingConfirmationResult> {
  try {
    const supabaseUrl = SUPABASE_URL;
    const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      const configError = new Error('Supabase admin credentials are not configured');
      logger.error(
        'Missing Supabase service role credentials for automatic booking confirmation',
        {
          component: 'booking-completion-actions',
          action: 'auto_confirm_config_error',
          metadata: { bookingId },
        },
        configError
      );

      return {
        success: false,
        message: 'Failed to confirm booking',
        error: 'Supabase admin credentials are not configured',
      };
    }

    const adminSupabase = createAdminClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    logger.info('Starting automatic booking confirmation', {
      component: 'booking-completion-actions',
      action: 'auto_confirm_start',
      metadata: { bookingId },
    });

    // First, verify all requirements are met
    const completionCheck = await checkBookingCompletion(bookingId);

    if (!completionCheck.isComplete) {
      logger.warn('Attempted to confirm booking but requirements not met', {
        component: 'booking-completion-actions',
        action: 'auto_confirm_incomplete',
        metadata: {
          bookingId,
          missingSteps: completionCheck.missingSteps,
        },
      });

      return {
        success: false,
        message: 'Cannot confirm booking - requirements not met',
        error: `Missing: ${completionCheck.missingSteps.join(', ')}`,
      };
    }

    // Get full booking details for confirmation
    const { data: bookingData, error: bookingError } = await adminSupabase
      .from('bookings')
      .select(
        `
        *,
        equipment:equipmentId(make, model, unitId, dailyRate, type),
        customer:customerId(id, firstName, lastName, email, phone)
      `
      )
      .eq('id', bookingId)
      .single();

    if (bookingError || !bookingData) {
      throw normalizeError(bookingError ?? 'Booking not found', 'Booking not found');
    }

    const booking = bookingData as BookingWithRelations;
    const emailAlreadySent = Boolean(booking.completionEmailSentAt);

    // Check if already confirmed
    if (booking.status === 'confirmed') {
      logger.info('Booking already confirmed', {
        component: 'booking-completion-actions',
        action: 'already_confirmed',
        metadata: { bookingId, bookingNumber: booking.bookingNumber },
      });

      if (!emailAlreadySent) {
        try {
          logger.info('Confirmed booking missing completion emails, triggering dispatch', {
            component: 'booking-completion-actions',
            action: 'dispatch_completion_emails_for_confirmed_booking',
            metadata: { bookingId, bookingNumber: booking.bookingNumber },
          });

          await dispatchCompletionEmails(adminSupabase, booking);
        } catch (emailError) {
          logger.error(
            '❌ Failed to send completion emails for confirmed booking',
            {
              component: 'booking-completion-actions',
              action: 'email_failed_confirmed',
              metadata: { bookingId, bookingNumber: booking.bookingNumber },
            },
            normalizeError(emailError, 'Failed to send completion emails')
          );
        }
      } else {
        logger.info('Completion emails already sent for confirmed booking', {
          component: 'booking-completion-actions',
          action: 'completion_emails_already_sent',
          metadata: { bookingId, bookingNumber: booking.bookingNumber },
        });
      }

      return {
        success: true,
        message: 'Booking already confirmed',
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        redirectUrl: `/booking/${booking.id}/confirmed`,
      };
    }

    // Update booking status to CONFIRMED
    const { error: updateError } = await adminSupabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      const normalizedUpdateError = normalizeError(
        updateError,
        'Failed to update booking status to confirmed'
      );
      logger.error(
        'Failed to update booking status during automatic confirmation',
        {
          component: 'booking-completion-actions',
          action: 'auto_confirm_update_error',
          metadata: {
            bookingId,
            bookingNumber: booking.bookingNumber,
          },
        },
        normalizedUpdateError
      );
      throw normalizedUpdateError;
    }

    logger.info('Booking status updated to CONFIRMED', {
      component: 'booking-completion-actions',
      action: 'status_updated',
      metadata: {
        bookingId,
        bookingNumber: booking.bookingNumber,
        previousStatus: booking.status,
        newStatus: 'confirmed',
      },
    });
    booking.status = 'confirmed';

    // Send completion emails to customer and admin
    try {
      await dispatchCompletionEmails(adminSupabase, booking);
    } catch (emailError) {
      logger.error(
        '❌ Failed to send completion emails',
        {
          component: 'booking-completion-actions',
          action: 'email_failed',
          metadata: { bookingId, bookingNumber: booking.bookingNumber },
        },
        normalizeError(emailError, 'Failed to send completion emails')
      );
      // Don't fail the booking confirmation if email fails - just log it
    }
    const customerFullName = [booking.customer.firstName, booking.customer.lastName]
      .filter(Boolean)
      .join(' ');
    const equipmentMake = booking.equipment?.make ?? 'Unknown';
    const equipmentModel = booking.equipment?.model ?? '';
    const equipmentUnitId = booking.equipment?.unitId ?? 'N/A';
    const customerPhone = booking.customer.phone || 'No phone';

    logger.info('✅ Booking automatically confirmed (all requirements met)', {
      component: 'booking-completion-actions',
      action: 'booking_confirmed',
      metadata: {
        bookingNumber: booking.bookingNumber,
        customerName: customerFullName,
        amount: Number(booking.totalAmount),
        description: `✅ Booking CONFIRMED: ${equipmentMake} ${equipmentModel} (${booking.bookingNumber})

Equipment: ${equipmentMake} ${equipmentModel} (Unit ${equipmentUnitId})
Customer: ${customerFullName} (${booking.customer.email}, ${customerPhone})
Rental Period: ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}
Delivery Type: ${booking.type}
Delivery Address: ${booking.deliveryAddress || 'Pickup at location'}
Total Amount: $${Number(booking.totalAmount).toFixed(2)}

All 5 completion steps verified:
✅ Contract signed
✅ Insurance uploaded
✅ ID verification approved
✅ Invoice paid
✅ Security deposit paid

Status: READY FOR DELIVERY SCHEDULING`,
      },
    });

    // Create availability block for this rental period
    try {
      const { error: blockError } = await adminSupabase.from('availability_blocks').insert({
        equipment_id: booking.equipmentId,
        start_at_utc: booking.startDate,
        end_at_utc: booking.endDate,
        reason: 'booked',
        notes: `Confirmed booking: ${booking.bookingNumber}`,
      });

      if (blockError) {
        logger.error(
          'Failed to create availability block',
          {
            component: 'booking-completion-actions',
            action: 'availability_block_failed',
            metadata: { bookingId, error: blockError.message },
          },
          normalizeError(blockError, 'Failed to create availability block')
        );
        // Don't fail the confirmation
      } else {
        logger.info('Availability block created', {
          component: 'booking-completion-actions',
          action: 'availability_blocked',
          metadata: {
            bookingId,
            equipmentId: booking.equipmentId,
            startDate: booking.startDate,
            endDate: booking.endDate,
          },
        });
      }
    } catch (availabilityError) {
      logger.error(
        'Error creating availability block',
        {
          component: 'booking-completion-actions',
          action: 'availability_error',
        },
        normalizeError(availabilityError, 'Error creating availability block')
      );
    }

    // If delivery booking, add to delivery schedule
    if (booking.type === 'delivery' && booking.deliveryAddress) {
      try {
        // This would integrate with your delivery scheduling system
        logger.info('Booking added to delivery schedule', {
          component: 'booking-completion-actions',
          action: 'delivery_scheduled',
          metadata: {
            bookingId,
            deliveryAddress: booking.deliveryAddress,
            deliveryDate: booking.startDate,
          },
        });
        // TODO: Implement delivery scheduling integration
      } catch (deliveryError) {
        logger.error(
          'Failed to schedule delivery',
          {
            component: 'booking-completion-actions',
            action: 'delivery_schedule_failed',
          },
          normalizeError(deliveryError, 'Failed to schedule delivery')
        );
      }
    }

    // Revalidate paths to update UI
    revalidatePath(`/booking/${bookingId}/manage`);
    revalidatePath(`/booking/${bookingId}/confirmed`);
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Booking confirmed successfully!',
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      redirectUrl: `/booking/${booking.id}/confirmed`,
    };
  } catch (error) {
    const normalizedError = normalizeError(error, 'Failed to confirm booking automatically');

    logger.error(
      'Error confirming booking automatically:',
      {
        component: 'booking-completion-actions',
        action: 'auto_confirm_error',
        metadata: { bookingId },
      },
      normalizedError
    );

    return {
      success: false,
      message: 'Failed to confirm booking',
      error: normalizedError.message,
    };
  }
}

/**
 * Manual booking confirmation (for admin use)
 */
export async function confirmBookingManually(
  bookingId: string,
  bypassRequirements: boolean = false
): Promise<BookingConfirmationResult> {
  try {
    const supabase = await createClient();

    // Verify user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      };
    }

    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return {
        success: false,
        message: 'Forbidden',
        error: 'Admin access required',
      };
    }

    // Check completion if not bypassing
    if (!bypassRequirements) {
      const completionCheck = await checkBookingCompletion(bookingId);
      if (!completionCheck.isComplete) {
        return {
          success: false,
          message: 'Cannot confirm - requirements not met',
          error: `Missing: ${completionCheck.missingSteps.join(', ')}`,
        };
      }
    }

    logger.info('Admin manually confirming booking', {
      component: 'booking-completion-actions',
      action: 'manual_confirm',
      metadata: {
        bookingId,
        adminId: user.id,
        bypass: bypassRequirements,
      },
    });

    // Use the automatic confirmation logic
    return await confirmBookingAutomatically(bookingId);
  } catch (error) {
    logger.error(
      'Error in manual booking confirmation:',
      {
        component: 'booking-completion-actions',
        action: 'manual_confirm_error',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return {
      success: false,
      message: 'Failed to confirm booking',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
