/**
 * Typed Helpers Usage Examples
 *
 * This file demonstrates how to use the type-safe Supabase query helpers.
 * These examples show real-world patterns for common database operations.
 *
 * NOTE: This is an example file - do not import or use directly.
 * Import the helpers from './typed-helpers' instead.
 */

import { supabase } from './client';
import type { BookingBalanceFields } from './extended-types';
import { createClient } from './server';
import { createServiceClient } from './service';
import type { TableInsert, TableRow, TableUpdate } from './typed-helpers';
import { typedDelete, typedInsert, typedSelect, typedUpdate } from './typed-helpers';

/**
 * Example 1: Type-Safe Select Query (Client-Side)
 *
 * Use typedSelect() to ensure table name exists and get proper types.
 */
export async function exampleSelectBookings(userId: string) {
  // ✅ Type-safe select - table name is validated at compile time
  const { data, error } = await typedSelect(supabase, 'bookings', 'id, bookingNumber, status, totalAmount, balance_amount')
    .eq('customerId', userId)
    .order('createdAt', { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  // data is properly typed based on selected columns
  // TypeScript knows the structure: { id: string, bookingNumber: string, status: string, ... }
  return data;
}

/**
 * Example 2: Type-Safe Select Query (Server-Side)
 *
 * Same pattern works with server-side clients.
 */
export async function exampleSelectBookingsServer(userId: string) {
  const supabase = await createClient();

  const { data, error } = await typedSelect(supabase, 'bookings', 'id, status, totalAmount')
    .eq('customerId', userId)
    .single();

  if (error) {
    throw error;
  }

  // Check if data is null or undefined
  if (!data) {
    throw new Error('Booking not found');
  }

  // Use TableRow helper type for result typing
  // Type assertion through unknown to handle GenericStringError case
  type BookingSummary = Pick<TableRow<'bookings'>, 'id' | 'status' | 'totalAmount'>;
  const booking: BookingSummary = data as unknown as BookingSummary;

  return booking;
}

/**
 * Example 3: Type-Safe Insert
 *
 * typedInsert() ensures insert data matches the schema.
 */
export async function exampleCreateBooking(bookingData: {
  customerId: string;
  equipmentId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
}) {
  const supabase = await createClient();

  // ✅ Type-safe insert - TypeScript will error if:
  // - Required fields are missing
  // - Field types don't match
  // - Invalid enum values are used
  const { data, error } = await typedInsert(supabase, 'bookings', {
    customerId: bookingData.customerId,
    equipmentId: bookingData.equipmentId,
    startDate: bookingData.startDate,
    endDate: bookingData.endDate,
    totalAmount: bookingData.totalAmount,
    status: 'pending', // TypeScript validates this is a valid status
    bookingNumber: 'BKG-' + Date.now().toString().slice(-6), // Required field
    dailyRate: 0, // Required field
    weeklyRate: 0, // Required field
    monthlyRate: 0, // Required field
    floatFee: 0, // Required field
    subtotal: bookingData.totalAmount, // Required field
    taxes: 0, // Required field
    securityDeposit: 0, // Required field
    // TypeScript will error if you try to add invalid fields
  })
    .select('id, bookingNumber')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Example 4: Type-Safe Update
 *
 * typedUpdate() ensures update data matches the schema.
 */
export async function exampleUpdateBookingStatus(bookingId: string, newStatus: 'confirmed' | 'cancelled') {
  const supabase = await createServiceClient();
  if (!supabase) {
    throw new Error('Service client unavailable');
  }

  // ✅ Type-safe update - TypeScript validates:
  // - Field exists in table
  // - Field type matches schema
  // - Enum values are valid
  const { data, error } = await typedUpdate(supabase, 'bookings', {
    status: newStatus, // TypeScript knows valid status values
    updatedAt: new Date().toISOString(),
  })
    .eq('id', bookingId)
    .select('id, status')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Example 5: Using Helper Types
 *
 * Use TableRow, TableInsert, TableUpdate for explicit typing.
 */
export async function exampleWithHelperTypes() {
  // Define types using helpers
  type Booking = TableRow<'bookings'>;
  type NewBooking = TableInsert<'bookings'>;
  type BookingUpdate = TableUpdate<'bookings'>;

  // Use in function signatures
  function _processBooking(booking: Booking) {
    // booking is fully typed with all fields
    console.log(booking.id, booking.status, booking.totalAmount);
  }

  function _createBooking(data: NewBooking) {
    // data must match Insert type (required fields, correct types)
    return typedInsert(supabase, 'bookings', data);
  }

  function _updateBooking(id: string, updates: BookingUpdate) {
    // updates must match Update type (optional fields, correct types)
    return typedUpdate(supabase, 'bookings', updates).eq('id', id);
  }
}

/**
 * Example 6: Type-Safe Delete
 *
 * typedDelete() ensures table name exists.
 */
export async function exampleDeleteBooking(bookingId: string) {
  const supabase = await createServiceClient();
  if (!supabase) {
    throw new Error('Service client unavailable');
  }

  // ✅ Type-safe delete - table name validated at compile time
  const { error } = await typedDelete(supabase, 'bookings')
    .eq('id', bookingId);

  if (error) {
    throw error;
  }
}

/**
 * Example 7: Complex Query with Joins
 *
 * Typed helpers work with Supabase's query builder methods.
 */
export async function exampleComplexQuery(userId: string) {
  const supabase = await createClient();

  // ✅ Start with typedSelect, then chain query methods
  const { data, error } = await typedSelect(
    supabase,
    'bookings',
    'id, bookingNumber, status, totalAmount, balance_amount, customer:customerId(id, firstName, lastName), equipment:equipmentId(id, make, model)'
  )
    .eq('customerId', userId)
    .in('status', ['confirmed', 'active'])
    .gte('startDate', new Date().toISOString())
    .order('startDate', { ascending: true })
    .limit(20);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Example 8: Migrating from `as any`
 *
 * Before: Using `as any` (unsafe)
 * After: Using typed helpers (safe)
 */
export async function exampleMigrationFromAny() {
  const supabase = await createClient();

  // ❌ BEFORE: Unsafe
  // const { data } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  // const balance = (data as any).balance_amount; // No type safety

  // ✅ AFTER: Type-safe
  // Note: balance_amount is a computed field, so we use regular select and type the result
  const { data } = await supabase
    .from('bookings')
    .select('id, balance_amount')
    .eq('id', 'booking-id')
    .single();

  // TypeScript knows balance_amount exists and its type via extended type
  const booking = data as BookingBalanceFields | null;
  const balance = booking?.balance_amount; // Fully typed!

  return balance;
}

/**
 * Example 9: Error Handling with Typed Queries
 *
 * Typed helpers return the same Supabase response format.
 */
export async function exampleErrorHandling() {
  const supabase = await createClient();

  const { data, error } = await typedSelect(supabase, 'bookings', 'id, status')
    .eq('customerId', 'user-id')
    .limit(10);

  if (error) {
    // Handle error (same as regular Supabase queries)
    console.error('Query failed:', error.message);
    return null;
  }

  if (!data || data.length === 0) {
    // Handle empty result
    return [];
  }

  // data is properly typed
  return data;
}

/**
 * Example 10: Using with Service Client
 *
 * Typed helpers work with service role clients too.
 */
export async function exampleServiceClient() {
  const serviceClient = await createServiceClient();
  if (!serviceClient) {
    throw new Error('Service client unavailable');
  }

  // ✅ Same typed helpers work with service client
  const { data, error } = await typedSelect(
    serviceClient,
    'bookings',
    'id, customerId, status, totalAmount'
  )
    .eq('status', 'pending')
    .limit(100);

  if (error) {
    throw error;
  }

  return data;
}


