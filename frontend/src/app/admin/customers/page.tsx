import { logger } from '@/lib/logger';
import { requireAdminServer } from '@/lib/supabase/requireAdminServer';
import { createClient } from '@/lib/supabase/server';
import CustomerManagementClient from './CustomerManagementClient';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  isVerified: boolean;
  isActive: boolean;
  totalBookings: number;
  totalSpent: number;
  lastBooking?: Date;
  registrationDate: Date;
  status: 'active' | 'suspended' | 'pending_verification';
  avatarUrl?: string | null;
}

/**
 * Transform user data to Customer format
 */
function transformUserToCustomer(user: any, bookingsByCustomer: Record<string, any[]>): Customer {
          const customerBookings = bookingsByCustomer[user.id] || [];
          const totalBookings = customerBookings.length;
          const totalSpent = customerBookings.reduce(
    (sum, b) => sum + parseFloat(b.totalAmount || '0'),
            0
          );
          const lastBooking =
            customerBookings.length > 0
              ? new Date(Math.max(...customerBookings.map((b) => new Date(b.createdAt).getTime())))
              : undefined;
          const status =
            user.status === 'suspended'
              ? ('suspended' as const)
              : user.emailVerified
                ? ('active' as const)
                : ('pending_verification' as const);

          return {
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
            phone: user.phone || '',
            company: user.companyName || '',
            address: user.address || '',
            city: user.city || '',
            province: user.province || 'NB',
            postalCode: user.postalCode || '',
            isVerified: user.emailVerified || false,
            isActive: user.status === 'active',
            totalBookings,
            totalSpent,
            lastBooking,
            registrationDate: new Date(user.createdAt),
            status,
            avatarUrl: user.avatar_url || null,
          };
}


export default async function CustomerManagementPage() {
  // Verify admin access - this uses cookies() but is outside any cache
  await requireAdminServer();

  // Create supabase client outside of any cached function
  // This must be done here to avoid cookies() inside unstable_cache()
  const supabaseClient = await createClient();

  // Fetch initial customer data server-side
  // Note: Not using cachedQuery here because it requires user authentication (cookies)
  // Admin data is user-specific and shouldn't be cached across users
  let initialCustomers: Customer[];

  try {
    // Try RPC function first
    const { data: customersData, error: customersError } = await supabaseClient.rpc(
      'get_customers_with_stats'
    );

    if (!customersError && customersData) {
      // Transform RPC function results
      initialCustomers = customersData.map((customer: any) => ({
        ...customer,
        totalSpent: parseFloat(customer.totalSpent || '0'),
        lastBooking: customer.lastBooking ? new Date(customer.lastBooking) : undefined,
        registrationDate: new Date(customer.registrationDate),
        avatarUrl: customer.avatar_url || null,
      })) as Customer[];
    } else {
      // Fallback to manual aggregation
      logger.warn('RPC function not found, using fallback query', {
        component: 'CustomerManagement-Server',
        action: 'fallback_query',
      });

      const { data: usersData, error: usersError } = await supabaseClient
        .from('users')
        .select(
          'id, firstName, lastName, email, phone, companyName, address, city, province, postalCode, emailVerified, status, createdAt, avatar_url'
        )
        .order('createdAt', { ascending: false });

      if (usersError) {
        logger.error('Error fetching users', {
          component: 'CustomerManagement-Server',
          action: 'fetch_users_error',
          metadata: { error: usersError.message },
        });
        throw usersError;
      }

      // Get all bookings for aggregation
      const { data: allBookings } = await supabaseClient
        .from('bookings')
        .select('customerId, totalAmount, createdAt, status');

      // Group bookings by customer
      const bookingsByCustomer = (allBookings || []).reduce(
        (acc: Record<string, any[]>, booking: any) => {
          if (!acc[booking.customerId]) {
            acc[booking.customerId] = [];
          }
          acc[booking.customerId].push(booking);
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Transform users to customers
      initialCustomers = (usersData || []).map((user) => transformUserToCustomer(user, bookingsByCustomer));
    }
  } catch (error) {
    logger.error('Error fetching customers', {
      component: 'CustomerManagement-Server',
      action: 'fetch_customers_error',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
    // Return empty array on error - client will handle retry
    initialCustomers = [];
  }

  // Pass initial data to Client Component
  return <CustomerManagementClient initialCustomers={initialCustomers} />;
}
