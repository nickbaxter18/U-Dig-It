'use server';

/**
 * Server Action: Check and Complete Booking
 *
 * This should be called after ANY booking step completes:
 * - Contract signed
 * - Insurance uploaded
 * - ID verification approved
 * - Invoice paid
 * - Security deposit paid
 *
 * If all 5 requirements are met, automatically confirms booking
 * and sends completion emails
 */
import { checkAndCompleteBookingIfReady } from '@/lib/check-and-complete-booking';

export async function checkAndCompleteBooking(
  bookingId: string,
  stepCompleted: string
): Promise<{ success: boolean; wasCompleted: boolean; bookingNumber?: string }> {
  const result = await checkAndCompleteBookingIfReady(bookingId, stepCompleted);

  return {
    success: true,
    ...result,
  };
}
