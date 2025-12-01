/**
 * One-time script to recalculate balances for affected bookings
 * Run with: npx tsx scripts/recalculate-affected-balances.ts
 */

import { recalculateBookingBalance } from '../src/lib/booking/balance';
import { logger } from '../src/lib/logger';

const affectedBookings = [
  'c2c00a7b-476b-41dc-9d1c-89ba4d0d5cad', // BK-MIA9ASYQ-PTCRMQ
  '652b4410-c038-44f2-ab3f-ee7ac75cf4bd', // BK-MIA8Z6DL-ERY155
  '0ad1e551-4bd6-4ff9-8a3f-b1f950feddb8', // BK-MIA9JW2K-WM6VWT
  '643b54c0-86d4-44e2-97d3-7c4fae02575a', // BK-MI9HJYRH-MFG5CX
];

async function main() {
  logger.info('Starting balance recalculation for affected bookings', {
    component: 'balance-recalculation-script',
    action: 'script_start',
    metadata: { bookingCount: affectedBookings.length },
  });

  const results = [];

  for (const bookingId of affectedBookings) {
    try {
      logger.info(`Recalculating balance for booking ${bookingId}`, {
        component: 'balance-recalculation-script',
        action: 'recalculating',
        metadata: { bookingId },
      });

      const newBalance = await recalculateBookingBalance(bookingId);

      if (newBalance === null) {
        logger.error(`Failed to recalculate balance for booking ${bookingId}`, {
          component: 'balance-recalculation-script',
          action: 'recalculation_failed',
          metadata: { bookingId },
        });
        results.push({ bookingId, success: false, error: 'Recalculation returned null' });
      } else {
        logger.info(`Successfully recalculated balance for booking ${bookingId}`, {
          component: 'balance-recalculation-script',
          action: 'recalculation_success',
          metadata: { bookingId, newBalance },
        });
        results.push({ bookingId, success: true, newBalance });
      }
    } catch (error) {
      logger.error(
        `Error recalculating balance for booking ${bookingId}`,
        {
          component: 'balance-recalculation-script',
          action: 'recalculation_error',
          metadata: { bookingId },
        },
        error instanceof Error ? error : new Error(String(error))
      );
      results.push({
        bookingId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info('Balance recalculation script completed', {
    component: 'balance-recalculation-script',
    action: 'script_complete',
    metadata: {
      total: affectedBookings.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    },
  });

  console.log('\n=== Balance Recalculation Results ===');
  results.forEach((result) => {
    if (result.success) {
      console.log(`✅ ${result.bookingId}: New balance = $${result.newBalance?.toFixed(2)}`);
    } else {
      console.log(`❌ ${result.bookingId}: ${result.error}`);
    }
  });
}

main()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });


