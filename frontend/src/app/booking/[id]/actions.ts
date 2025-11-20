'use server';

import { revalidatePath } from 'next/cache';

import { logger } from '@/lib/logger';
import {
  broadcastInAppNotificationToAdmins,
  createInAppNotification,
} from '@/lib/notification-service';
import { createClient } from '@/lib/supabase/server';

interface CancellationResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Cancel a booking
 * Calculates cancellation fee based on timing:
 * - >48 hours before start: No fee
 * - 24-48 hours before: 25% fee
 * - <24 hours before: 50% fee
 * - After start: Full amount
 */
export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<CancellationResult> {
  try {
    const supabase = await createClient();

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'You must be logged in to cancel a booking',
      };
    }

    // Get booking details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        bookingNumber,
        customerId,
        startDate,
        endDate,
        totalAmount,
        status,
        payments(id, status, type, amount)
      `
      )
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return {
        success: false,
        message: 'Booking not found',
        error: fetchError?.message || 'Could not find the booking',
      };
    }

    // Verify ownership
    const isAdmin =
      user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin';

    if (booking.customerId !== user.id && !isAdmin) {
      return {
        success: false,
        message: 'Unauthorized',
        error: 'You do not have permission to cancel this booking',
      };
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return {
        success: false,
        message: 'Already cancelled',
        error: 'This booking has already been cancelled',
      };
    }

    // Check if already completed
    if (booking.status === 'completed') {
      return {
        success: false,
        message: 'Cannot cancel',
        error: 'Completed bookings cannot be cancelled. Please contact support.',
      };
    }

    // Calculate cancellation fee
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let cancellationFee = 0;
    let cancellationPolicy = '';

    if (hoursUntilStart > 48) {
      // More than 48 hours: No fee
      cancellationFee = 0;
      cancellationPolicy = 'Free cancellation (>48 hours notice)';
    } else if (hoursUntilStart > 24) {
      // 24-48 hours: 25% fee
      cancellationFee = Number(booking.totalAmount) * 0.25;
      cancellationPolicy = '25% cancellation fee (24-48 hours notice)';
    } else if (hoursUntilStart > 0) {
      // Less than 24 hours: 50% fee
      cancellationFee = Number(booking.totalAmount) * 0.5;
      cancellationPolicy = '50% cancellation fee (<24 hours notice)';
    } else {
      // After start date: Full amount
      cancellationFee = Number(booking.totalAmount);
      cancellationPolicy = 'Full amount charged (rental already started)';
    }

    // Calculate refund amount
    const totalPaid =
      booking.payments
        ?.filter((p) => p.status === 'completed')
        .reduce((sum: unknown, p: unknown) => sum + Number(p.amount), 0) || 0;

    const refundAmount = Math.max(0, totalPaid - cancellationFee);

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason || 'Customer requested cancellation',
        cancellationFee: cancellationFee,
        refundAmount: refundAmount,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      logger.error(
        'Error cancelling booking',
        {
          component: 'app-actions',
          action: 'error',
          metadata: { error: updateError.message },
        },
        updateError
      );
      return {
        success: false,
        message: 'Cancellation failed',
        error: updateError.message,
      };
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      table_name: 'bookings',
      record_id: bookingId,
      action: 'cancel',
      user_id: user.id,
      new_values: {
        status: 'cancelled',
        cancellationFee,
        refundAmount,
        cancellationPolicy,
        reason,
      },
      metadata: {
        hoursUntilStart,
        totalPaid,
        bookingNumber: booking.bookingNumber,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const manageUrl = `${appUrl}/booking/${bookingId}/manage`;
    const initiatedByAdmin = isAdmin && booking.customerId !== user.id;
    const cancellationSummary =
      refundAmount > 0
        ? `We'll process a refund of $${refundAmount.toFixed(2)} within 5-10 business days.`
        : cancellationPolicy;

    try {
      await createInAppNotification({
        supabase,
        userId: booking.customerId,
        category: 'booking',
        priority: refundAmount > 0 ? 'medium' : 'high',
        title: initiatedByAdmin
          ? 'Your booking was cancelled by our team'
          : 'Booking cancelled successfully',
        message:
          `${initiatedByAdmin ? 'Our operations team' : 'You'} cancelled booking ${booking.bookingNumber}. ${cancellationSummary}`.trim(),
        actionUrl: manageUrl,
        ctaLabel: refundAmount > 0 ? 'Track refund' : 'View details',
        templateId: 'booking_cancelled',
        templateData: {
          bookingId,
          bookingNumber: booking.bookingNumber,
          cancellationFee,
          refundAmount,
          initiatedByAdmin,
          cancellationPolicy,
        },
        metadata: {
          bookingId,
          bookingNumber: booking.bookingNumber,
          event: 'booking_cancelled',
          initiatedByAdmin,
        },
      });
    } catch (notificationError) {
      logger.error(
        'Failed to enqueue booking cancellation notification',
        {
          component: 'app-actions',
          action: 'notification_error',
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
        priority: 'high',
        title: `Booking ${booking.bookingNumber} cancelled`,
        message:
          `${initiatedByAdmin ? 'Admin action recorded.' : `${user.email ?? 'Customer'} cancelled this booking.`} ${refundAmount > 0 ? `Refund: $${refundAmount.toFixed(2)}.` : 'No refund due.'}`.trim(),
        actionUrl: `${appUrl}/admin/bookings/${bookingId}`,
        ctaLabel: 'Review cancellation',
        templateId: 'admin_booking_cancelled',
        templateData: {
          bookingId,
          bookingNumber: booking.bookingNumber,
          cancellationFee,
          refundAmount,
          initiatedByAdmin,
          cancellationPolicy,
        },
        metadata: {
          bookingId,
          bookingNumber: booking.bookingNumber,
          event: 'admin_booking_cancelled',
        },
      });
    } catch (adminNotificationError) {
      logger.error(
        'Failed to broadcast admin cancellation notification',
        {
          component: 'app-actions',
          action: 'admin_notification_error',
          metadata: { bookingId },
        },
        adminNotificationError instanceof Error
          ? adminNotificationError
          : new Error(String(adminNotificationError))
      );
    }

    // TODO: Process refund through Stripe if refundAmount > 0
    // TODO: Send cancellation confirmation email
    // TODO: Update availability calendar

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath(`/booking/${bookingId}/details`);
    revalidatePath(`/booking/${bookingId}/manage`);

    return {
      success: true,
      message: `Booking cancelled successfully. ${
        refundAmount > 0
          ? `Refund of $${refundAmount.toFixed(2)} will be processed within 5-10 business days.`
          : cancellationPolicy
      }`,
    };
  } catch (error: unknown) {
    logger.error(
      'Unexpected error during cancellation',
      {
        component: 'app-actions',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      message: 'Unexpected error',
      error: error.message || 'An unexpected error occurred',
    };
  }
}

/**
 * Get cancellation policy preview
 */
export async function getCancellationPreview(bookingId: string): Promise<{
  fee: number;
  refund: number;
  policy: string;
  hoursUntilStart: number;
} | null> {
  try {
    const supabase = await createClient();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('startDate, totalAmount, payments(status, amount)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) return null;

    const now = new Date();
    const startDate = new Date(booking.startDate);
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let cancellationFee = 0;
    let cancellationPolicy = '';

    if (hoursUntilStart > 48) {
      cancellationFee = 0;
      cancellationPolicy = 'Free cancellation - No fee';
    } else if (hoursUntilStart > 24) {
      cancellationFee = Number(booking.totalAmount) * 0.25;
      cancellationPolicy = '25% cancellation fee (24-48 hours notice)';
    } else if (hoursUntilStart > 0) {
      cancellationFee = Number(booking.totalAmount) * 0.5;
      cancellationPolicy = '50% cancellation fee (<24 hours notice)';
    } else {
      cancellationFee = Number(booking.totalAmount);
      cancellationPolicy = 'Full amount (rental started)';
    }

    const totalPaid =
      booking.payments
        ?.filter((p) => p.status === 'completed')
        .reduce((sum: unknown, p: unknown) => sum + Number(p.amount), 0) || 0;

    const refundAmount = Math.max(0, totalPaid - cancellationFee);

    return {
      fee: cancellationFee,
      refund: refundAmount,
      policy: cancellationPolicy,
      hoursUntilStart,
    };
  } catch (error) {
    logger.error(
      'Error getting cancellation preview',
      {
        component: 'app-actions',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : undefined
    );
    return null;
  }
}
