/**
 * Type-Safe Supabase Query Helpers
 *
 * These helpers enforce type safety at compile time, ensuring:
 * - Table names exist in Database type
 * - Insert/Update data matches schema
 * - Query results are properly typed
 *
 * Usage:
 *   import { typedSelect, typedInsert, typedUpdate } from '@/lib/supabase/typed-helpers';
 *   import { supabase } from '@/lib/supabase/client';
 *
 *   // Type-safe select
 *   const { data } = await typedSelect(supabase, 'bookings', 'id, status, totalAmount');
 *
 *   // Type-safe insert
 *   const { data } = await typedInsert(supabase, 'bookings', {
 *     customerId: userId,
 *     equipmentId: equipment.id,
 *     // ... other required fields
 *   });
 */

import type { Database } from '@/../../supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Type-safe table name
 */
export type TableName = keyof Database['public']['Tables'];

/**
 * Flexible Supabase client type that works with:
 * - createBrowserClient from @supabase/ssr
 * - createServerClient from @supabase/ssr
 * - createClient from @supabase/supabase-js
 */
export type TypedSupabaseClient = SupabaseClient<
  Database,
  'public',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>;

/**
 * Type-safe select query helper
 * Enforces that table name exists in Database type
 *
 * @param client - Supabase client (browser or server)
 * @param table - Table name (must exist in Database['public']['Tables'])
 * @param columns - Column selection string (e.g., 'id, name, status')
 * @returns Typed Supabase query builder
 *
 * @example
 * ```typescript
 * const { data, error } = await typedSelect(supabase, 'bookings', 'id, status, totalAmount')
 *   .eq('status', 'confirmed')
 *   .limit(10);
 * // data is typed as Array<{ id: string, status: string, totalAmount: number }>
 * ```
 */
export function typedSelect<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  columns: string
) {
  return client.from(table).select(columns);
}

/**
 * Type-safe insert helper
 * Enforces that insert data matches TableInsert type
 *
 * @param client - Supabase client (browser or server)
 * @param table - Table name (must exist in Database['public']['Tables'])
 * @param data - Insert data matching TablesInsert<T> type
 * @returns Typed Supabase query builder
 *
 * @example
 * ```typescript
 * const { data, error } = await typedInsert(supabase, 'bookings', {
 *   customerId: userId,
 *   equipmentId: equipment.id,
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-05',
 *   // TypeScript will error if required fields are missing or types don't match
 * });
 * ```
 */
export function typedInsert<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  data: Database['public']['Tables'][T]['Insert']
) {
  return client.from(table).insert(data);
}

/**
 * Type-safe update helper
 * Enforces that update data matches TableUpdate type
 *
 * @param client - Supabase client (browser or server)
 * @param table - Table name (must exist in Database['public']['Tables'])
 * @param data - Update data matching TablesUpdate<T> type
 * @returns Typed Supabase query builder
 *
 * @example
 * ```typescript
 * const { data, error } = await typedUpdate(supabase, 'bookings', {
 *   status: 'confirmed',
 *   // TypeScript will error if field doesn't exist or type doesn't match
 * })
 *   .eq('id', bookingId);
 * ```
 */
export function typedUpdate<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  data: Database['public']['Tables'][T]['Update']
) {
  return client.from(table).update(data);
}

/**
 * Type-safe delete helper
 * Enforces that table name exists in Database type
 *
 * @param client - Supabase client (browser or server)
 * @param table - Table name (must exist in Database['public']['Tables'])
 * @returns Typed Supabase query builder
 *
 * @example
 * ```typescript
 * const { error } = await typedDelete(supabase, 'bookings')
 *   .eq('id', bookingId);
 * ```
 */
export function typedDelete<T extends TableName>(
  client: TypedSupabaseClient,
  table: T
) {
  return client.from(table).delete();
}

/**
 * Helper type to extract Row type from table name
 * Use this for typing query results
 *
 * @example
 * ```typescript
 * import type { TableRow } from '@/lib/supabase/typed-helpers';
 *
 * type Booking = TableRow<'bookings'>;
 * const booking: Booking = { id: '...', status: 'confirmed', ... };
 * ```
 */
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

/**
 * Helper type to extract Insert type from table name
 * Use this for typing insert data
 *
 * @example
 * ```typescript
 * import type { TableInsert } from '@/lib/supabase/typed-helpers';
 *
 * const newBooking: TableInsert<'bookings'> = {
 *   customerId: userId,
 *   equipmentId: equipment.id,
 *   // ...
 * };
 * ```
 */
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];

/**
 * Helper type to extract Update type from table name
 * Use this for typing update data
 *
 * @example
 * ```typescript
 * import type { TableUpdate } from '@/lib/supabase/typed-helpers';
 *
 * const updateData: TableUpdate<'bookings'> = {
 *   status: 'confirmed',
 * };
 * ```
 */
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];


