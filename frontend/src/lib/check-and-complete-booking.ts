/**
 * Generic Booking Completion Checker
 *
 * This should be called after ANY booking step completes:
 * - Contract signed
 * - Insurance uploaded
 * - ID verification approved
 * - Invoice paid
 * - Security deposit paid
 *
 * If all 5 requirements are met, automatically confirms booking
 * and sends completion emails (customer + admin)
 */
import {
  checkBookingCompletion,
  confirmBookingAutomatically,
} from '@/app/booking/[id]/actions-completion';

import { logger } from './logger';

export async function checkAndCompleteBookingIfReady(
  bookingId: string,
  stepCompleted: string
): Promise<{ wasCompleted: boolean; bookingNumber?: string }> {
  try {
    logger.info(`Step completed: ${stepCompleted}. Checking if booking is 100% ready...`, {
      component: 'check-and-complete-booking',
      action: 'check_after_step',
      metadata: { bookingId, stepCompleted },
    });

    // Check if all requirements are now met
    const completionCheck = await checkBookingCompletion(bookingId);

    if (!completionCheck.isComplete) {
      logger.info('Booking not yet complete', {
        component: 'check-and-complete-booking',
        action: 'incomplete',
        metadata: {
          bookingId,
          completedSteps: completionCheck.completedSteps,
          missingSteps: completionCheck.missingSteps,
        },
      });

      return { wasCompleted: false };
    }

    // All requirements met! Auto-confirm booking
    logger.info('🎉 All 5 requirements met! Triggering automatic confirmation...', {
      component: 'check-and-complete-booking',
      action: 'all_requirements_met',
      metadata: {
        bookingId,
        triggeringStep: stepCompleted,
        completedSteps: completionCheck.completedSteps,
      },
    });

    const confirmResult = await confirmBookingAutomatically(bookingId);

    if (confirmResult.success) {
      logger.info('✅ Booking automatically confirmed! Completion emails sent!', {
        component: 'check-and-complete-booking',
        action: 'booking_confirmed',
        metadata: {
          bookingId,
          bookingNumber: confirmResult.bookingNumber,
          triggeringStep: stepCompleted,
        },
      });

      return {
        wasCompleted: true,
        bookingNumber: confirmResult.bookingNumber,
      };
    } else {
      logger.warn('Failed to auto-confirm booking', {
        component: 'check-and-complete-booking',
        action: 'confirm_failed',
        metadata: {
          bookingId,
          error: confirmResult.error,
        },
      });

      return { wasCompleted: false };
    }
  } catch (error) {
    logger.error(
      'Error checking/completing booking',
      {
        component: 'check-and-complete-booking',
        action: 'error',
        metadata: { bookingId, stepCompleted },
      },
      error as Error
    );

    return { wasCompleted: false };
  }
}
