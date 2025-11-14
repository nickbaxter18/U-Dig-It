'use client';

import { Calendar, DollarSign, Filter, Mail, Search, User } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { CustomerEditModal } from '@/components/admin/CustomerEditModal';
import { EmailCustomerModal } from '@/components/admin/EmailCustomerModal';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

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
}

export default function CustomerManagement() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [emailCustomer, setEmailCustomer] = useState<{
    email: string;
    name: string;
    bookingNumber: string;
    bookingId: string;
  } | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ BULLETPROOF: Fetch customers from Supabase with efficient aggregated stats
      // Use raw SQL for better performance with aggregated booking data
      const { data: customersData, error: customersError } = await supabase.rpc(
        'get_customers_with_stats'
      );

      if (customersError) {
        // Fallback to manual aggregation if function doesn't exist
        logger.warn('RPC function not found, using fallback query', {
          component: 'CustomerManagement',
          action: 'fallback_query',
        });

        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('createdAt', { ascending: false });

        if (usersError) throw usersError;

        // Get all bookings once for better performance
        const { data: allBookings } = await supabase
          .from('bookings')
          .select('customerId, totalAmount, createdAt, status');

        // Group bookings by customer
        const bookingsByCustomer = ((allBookings || []) as any[]).reduce(
          (acc: Record<string, any[]>, booking: any) => {
            if (!acc[booking.customerId]) {
              acc[booking.customerId] = [];
            }
            acc[booking.customerId].push(booking);
            return acc;
          },
          {} as Record<string, any[]>
        );

        // Map users to customer format with stats
        const customersWithStats = ((usersData || []) as any[]).map((user: any) => {
          const customerBookings = bookingsByCustomer[user.id] || [];

          const totalBookings = customerBookings.length;
          const totalSpent = customerBookings.reduce(
            (sum: any, b: any) => sum + parseFloat(b.totalAmount || '0'),
            0
          );

          // Get last booking date
          const lastBooking =
            customerBookings.length > 0
              ? new Date(Math.max(...customerBookings.map((b) => new Date(b.createdAt).getTime())))
              : undefined;

          // Map status to expected values
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
          };
        });

        setCustomers(customersWithStats);
      } else {
        // ✅ Transform RPC function results to match Customer interface
        const transformedCustomers = ((customersData || []) as any[]).map((customer: any) => ({
          ...customer,
          totalSpent: parseFloat(customer.totalSpent || '0'),
          lastBooking: customer.lastBooking ? new Date(customer.lastBooking) : undefined,
          registrationDate: new Date(customer.registrationDate),
        }));

        setCustomers(transformedCustomers);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch customers:',
          { component: 'app-page', action: 'error' },
          err instanceof Error ? err : new Error(String(err))
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    // ✅ BULLETPROOF: Handle null values in search filter
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (customer.firstName || '').toLowerCase().includes(search) ||
      (customer.lastName || '').toLowerCase().includes(search) ||
      (customer.email || '').toLowerCase().includes(search) ||
      (customer.phone || '').includes(searchTerm) ||
      (customer.company || '').toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">
            Manage customer accounts, view booking history, and handle customer communications.
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading customers</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="focus:ring-kubota-orange rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending_verification">Pending Verification</option>
        </select>

        <button className="focus:ring-kubota-orange flex items-center space-x-1 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2">
          <Filter className="h-4 w-4" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Customer Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Last Booking
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="bg-kubota-orange flex h-10 w-10 items-center justify-between rounded-full">
                          <span className="text-sm font-medium text-white">
                            {customer.firstName?.[0] || '?'}
                            {customer.lastName?.[0] || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{customer.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(customer.status)}`}
                    >
                      {customer.status.replace('_', ' ')}
                    </span>
                    {!customer.isVerified && (
                      <div className="mt-1 text-xs text-yellow-600">Unverified</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {customer.totalBookings}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ${customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {customer.lastBooking
                      ? new Date(customer.lastBooking).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-kubota-orange hover:text-orange-600"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit Customer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setEmailCustomer({
                            email: customer.email,
                            name: `${customer.firstName} ${customer.lastName}`,
                            bookingNumber: 'General',
                            bookingId: '', // General email, no specific booking
                          });
                          setShowEmailModal(true);
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Email Customer"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="text-kubota-orange h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <span className="text-sm font-semibold text-green-600">A</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.filter((c) => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.reduce((sum: any, c: any) => sum + c.totalBookings, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${customers.reduce((sum: any, c: any) => sum + c.totalSpent, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Customer Details - {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Name:</strong> {selectedCustomer.firstName}{' '}
                      {selectedCustomer.lastName}
                    </div>
                    <div>
                      <strong>Company:</strong> {selectedCustomer.company || 'N/A'}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedCustomer.email}
                    </div>
                    <div>
                      <strong>Phone:</strong> {selectedCustomer.phone}
                    </div>
                    <div>
                      <strong>Address:</strong> {selectedCustomer.address}, {selectedCustomer.city},{' '}
                      {selectedCustomer.province} {selectedCustomer.postalCode}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Account Status</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedCustomer.status)}`}
                      >
                        {selectedCustomer.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <strong>Verified:</strong> {selectedCustomer.isVerified ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Active:</strong> {selectedCustomer.isActive ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Member Since:</strong>{' '}
                      {new Date(selectedCustomer.registrationDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Booking Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Total Bookings:</strong> {selectedCustomer.totalBookings}
                    </div>
                    <div>
                      <strong>Total Spent:</strong> ${selectedCustomer.totalSpent.toLocaleString()}
                    </div>
                    <div>
                      <strong>Last Booking:</strong>{' '}
                      {selectedCustomer.lastBooking
                        ? new Date(selectedCustomer.lastBooking).toLocaleDateString()
                        : 'Never'}
                    </div>
                    <div>
                      <strong>Average per Booking:</strong> $
                      {selectedCustomer.totalBookings > 0
                        ? (selectedCustomer.totalSpent / selectedCustomer.totalBookings).toFixed(2)
                        : '0'}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Quick Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setEmailCustomer({
                          email: selectedCustomer.email,
                          name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
                          bookingNumber: 'General',
                          bookingId: '',
                        });
                        setShowEmailModal(true);
                      }}
                      className="bg-kubota-orange w-full rounded-md px-3 py-2 text-sm text-white hover:bg-orange-600"
                    >
                      Send Email
                    </button>
                    <button
                      onClick={() => {
                        router.push(`/admin/bookings?customerId=${selectedCustomer.id}`);
                        setSelectedCustomer(null);
                      }}
                      className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      View Booking History
                    </button>
                    <button
                      onClick={() => {
                        router.push(`/book?customerId=${selectedCustomer.id}`);
                        setSelectedCustomer(null);
                      }}
                      className="w-full rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                    >
                      Create New Booking
                    </button>
                    {selectedCustomer.status === 'active' ? (
                      <button
                        onClick={async () => {
                          if (
                            confirm(
                              `Suspend account for ${selectedCustomer.firstName} ${selectedCustomer.lastName}?`
                            )
                          ) {
                            try {
                              const response = await fetchWithAuth(
                                `/api/admin/users/${selectedCustomer.id}`,
                                {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'suspended' }),
                                }
                              );

                              if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.error || 'Failed to suspend account');
                              }

                              // Refresh customer list
                              await fetchCustomers();
                              setSelectedCustomer(null);
                            } catch (err) {
                              alert(
                                err instanceof Error ? err.message : 'Failed to suspend account'
                              );
                              logger.error(
                                'Failed to suspend account',
                                {
                                  component: 'customers-page',
                                  action: 'suspend_error',
                                  metadata: { customerId: selectedCustomer.id },
                                },
                                err instanceof Error ? err : new Error(String(err))
                              );
                            }
                          }
                        }}
                        className="w-full rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                      >
                        Suspend Account
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (
                            confirm(
                              `Activate account for ${selectedCustomer.firstName} ${selectedCustomer.lastName}?`
                            )
                          ) {
                            try {
                              const response = await fetchWithAuth(
                                `/api/admin/users/${selectedCustomer.id}`,
                                {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'active' }),
                                }
                              );

                              if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.error || 'Failed to activate account');
                              }

                              // Refresh customer list
                              await fetchCustomers();
                              setSelectedCustomer(null);
                            } catch (err) {
                              alert(
                                err instanceof Error ? err.message : 'Failed to activate account'
                              );
                              logger.error(
                                'Failed to activate account',
                                {
                                  component: 'customers-page',
                                  action: 'activate_error',
                                  metadata: { customerId: selectedCustomer.id },
                                },
                                err instanceof Error ? err : new Error(String(err))
                              );
                            }
                          }
                        }}
                        className="w-full rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                      >
                        Activate Account
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Customer Modal */}
      {showEmailModal && emailCustomer && (
        <EmailCustomerModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setEmailCustomer(null);
          }}
          customerEmail={emailCustomer.email}
          customerName={emailCustomer.name}
          bookingNumber={emailCustomer.bookingNumber}
          bookingId={emailCustomer.bookingId}
        />
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <CustomerEditModal
          customer={{
            id: selectedCustomer.id,
            firstName: selectedCustomer.firstName,
            lastName: selectedCustomer.lastName,
            email: selectedCustomer.email,
            phone: selectedCustomer.phone,
            company: selectedCustomer.company,
            address: selectedCustomer.address,
            city: selectedCustomer.city,
            province: selectedCustomer.province,
            postalCode: selectedCustomer.postalCode,
          }}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
          }}
          onSave={() => {
            fetchCustomers(); // Refresh customer list
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
