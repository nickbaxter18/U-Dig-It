/**
 * Extended types for Supabase tables that include computed/virtual fields
 * These fields may not exist in the generated Database types but are used in queries
 */

import type { Database } from '@/../../supabase/types';
import type { TableRow } from './typed-helpers';

/**
 * Booking with balance_amount computed field
 * balance_amount is calculated as: totalAmount - sum(all_completed_payments)
 */
export type BookingWithBalance = TableRow<'bookings'> & {
  balance_amount?: number | null;
};

/**
 * Helper type to pick specific fields from BookingWithBalance
 */
export type BookingBalanceFields = Pick<BookingWithBalance, 'id' | 'totalAmount' | 'balance_amount'>;

