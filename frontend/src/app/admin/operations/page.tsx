'use client';

import { AlertTriangle, Calendar, CheckCircle, MapPin, Truck, User } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { PermissionGate } from '@/components/admin/PermissionGate';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
// Added Supabase import
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface Delivery {
  id: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  equipmentName: string;
  deliveryAddress: string;
  scheduledDate: Date;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  driverId?: string;
  driverName?: string;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  specialInstructions?: string;
  deliveryNotes?: string;
  pickupDate?: Date;
  pickupAddress?: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  isAvailable: boolean;
  currentLocation?: string;
  activeDeliveries: number;
}

export default function OperationsManagement() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningDelivery, setAssigningDelivery] = useState<Delivery | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const router = useRouter();

  useEffect(() => {
    fetchOperationsData();
  }, [selectedDate]);

  const fetchOperationsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // MIGRATED: Fetch delivery data from Supabase bookings
      // Deliveries are bookings with type='delivery' and upcoming start dates
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(
          `
          id,
          bookingNumber,
          startDate,
          endDate,
          deliveryAddress,
          deliveryCity,
          deliveryProvince,
          deliveryPostalCode,
          specialInstructions,
          internalNotes,
          status,
          type,
          equipment:equipmentId (
            id,
            make,
            model
          ),
          customer:customerId (
            id,
            firstName,
            lastName,
            email,
            phone
          )
        `
        )
        .eq('type', 'delivery')
        .order('startDate', { ascending: true });

      if (bookingsError) throw bookingsError;

      // Transform bookings to Delivery format
      const deliveriesData: Delivery[] = ((bookingsData || []) as unknown[]).map(
        (booking: unknown) => {
          const firstName = booking.customer?.firstName || '';
          const lastName = booking.customer?.lastName || '';
          const customerName =
            `${firstName} ${lastName}`.trim() || booking.customer?.email || 'Unknown Customer';

          // Map booking status to delivery status
          let deliveryStatus: Delivery['status'] = 'scheduled';
          switch (booking.status) {
            case 'confirmed':
            case 'paid':
            case 'insurance_verified':
            case 'ready_for_pickup':
              deliveryStatus = 'scheduled';
              break;
            case 'delivered':
              deliveryStatus = 'delivered';
              break;
            case 'in_progress':
              deliveryStatus = 'in_transit';
              break;
            case 'completed':
              deliveryStatus = 'completed';
              break;
            case 'cancelled':
              deliveryStatus = 'cancelled';
              break;
          }

          const fullAddress =
            `${booking.deliveryAddress || ''}, ${booking.deliveryCity || ''}, ${booking.deliveryProvince || 'NB'} ${booking.deliveryPostalCode || ''}`.trim();

          return {
            id: booking.id,
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            customerName,
            customerPhone: booking.customer?.phone || 'N/A',
            equipmentName: `${booking.equipment?.make || 'Kubota'} ${booking.equipment?.model || 'SVL-75'}`,
            deliveryAddress: fullAddress,
            scheduledDate: new Date(booking.startDate),
            status: deliveryStatus,
            estimatedDuration: 45, // Default estimation
            specialInstructions: booking.specialInstructions || undefined,
            deliveryNotes: booking.internalNotes || undefined,
            pickupDate: new Date(booking.endDate),
            pickupAddress: fullAddress, // Same address for pickup
          };
        }
      );

      setDeliveries(deliveriesData);

      // ✅ FIXED: Fetch drivers from Supabase
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .order('name', { ascending: true });

      if (driversError) {
        logger.warn('Failed to fetch drivers', {
          component: 'OperationsManagement',
          action: 'fetch_drivers_error',
          metadata: { error: driversError.message },
        });
        setDrivers([]);
      } else {
        // Transform to Driver format
        const transformedDrivers: Driver[] = ((driversData || []) as unknown[]).map(
          (driver: unknown) => ({
            id: driver.id,
            name: driver.name,
            phone: driver.phone || 'N/A',
            licenseNumber: driver.license_number || 'N/A',
            isAvailable: driver.is_available,
            currentLocation: driver.current_location || undefined,
            activeDeliveries: driver.active_deliveries || 0,
          })
        );
        setDrivers(transformedDrivers);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch operations data:',
          {
            component: 'app-page',
            action: 'error',
          },
          err instanceof Error ? err : new Error(String(err))
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch operations data');
      setDeliveries([]);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!assigningDelivery || !selectedDriverId) {
      alert('Please select a driver');
      return;
    }

    try {
      // Get current user for audit trail
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create delivery assignment
      const { error: assignError } = await supabase.from('delivery_assignments').insert({
        booking_id: assigningDelivery.bookingId,
        driver_id: selectedDriverId,
        assigned_by: user.id,
        status: 'assigned',
      });

      if (assignError) throw assignError;

      // Update driver's active deliveries count
      const currentDriver = drivers.find((d) => d.id === selectedDriverId);
      if (currentDriver) {
        await fetchWithAuth(`/api/admin/drivers/${selectedDriverId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            active_deliveries: currentDriver.activeDeliveries + 1,
            is_available: false, // Mark as unavailable when assigned
          }),
        });
      }

      logger.info('Driver assigned to delivery', {
        component: 'OperationsManagement',
        action: 'assign_driver',
        metadata: {
          deliveryId: assigningDelivery.id,
          driverId: selectedDriverId,
          assignedBy: user.id,
        },
      });

      // Close modal and refresh
      setShowAssignModal(false);
      setAssigningDelivery(null);
      setSelectedDriverId('');
      await fetchOperationsData();
      alert(`✅ Driver assigned successfully!`);
    } catch (err) {
      logger.error(
        'Failed to assign driver',
        {
          component: 'OperationsManagement',
          action: 'assign_driver_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to assign driver. Please try again.');
    }
  };

  const handleUpdateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      // Map delivery status to booking status
      let bookingStatus = 'confirmed';
      switch (newStatus) {
        case 'in_transit':
          bookingStatus = 'in_progress';
          break;
        case 'delivered':
          bookingStatus = 'delivered';
          break;
        case 'completed':
          bookingStatus = 'completed';
          break;
        case 'cancelled':
          bookingStatus = 'cancelled';
          break;
      }

      // Update booking status
      const bookingResponse = await fetchWithAuth(`/api/admin/bookings/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: bookingStatus,
          actualStartDate: newStatus === 'in_transit' ? new Date().toISOString() : undefined,
          actualEndDate: newStatus === 'completed' ? new Date().toISOString() : undefined,
        }),
      });

      if (!bookingResponse.ok) {
        const updateError = await bookingResponse.json();
        throw new Error(updateError.error || 'Failed to update booking');
      }

      // Update delivery assignment status if exists
      await fetchWithAuth(`/api/admin/delivery-assignments/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          started_at: newStatus === 'in_transit' ? new Date().toISOString() : undefined,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
        }),
      });

      logger.info('Delivery status updated', {
        component: 'OperationsManagement',
        action: 'update_delivery_status',
        metadata: { deliveryId, newStatus },
      });

      // Send notification to customer
      try {
        await fetchWithAuth(`/api/admin/deliveries/${deliveryId}/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            message: `Your delivery status has been updated to ${newStatus.replace('_', ' ')}`,
          }),
        });
      } catch {
        logger.warn('Failed to send delivery notification', {
          component: 'OperationsManagement',
          action: 'notification_error',
          metadata: { deliveryId, newStatus },
        });
        // Don't fail the status update if notification fails
      }

      // Refresh data
      await fetchOperationsData();
      setSelectedDelivery(null);
      alert(`✅ Delivery status updated to ${newStatus}! Customer has been notified.`);
    } catch (err) {
      logger.error(
        'Failed to update delivery status',
        {
          component: 'OperationsManagement',
          action: 'update_status_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to update delivery status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'in_transit':
        return <Truck className="h-4 w-4 text-yellow-600" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const deliveryDate = new Date(delivery.scheduledDate).toISOString().split('T')[0];
    return deliveryDate === selectedDate;
  });

  const todaysDeliveries = deliveries.filter((delivery) => {
    const today = new Date().toISOString().split('T')[0];
    const deliveryDate = new Date(delivery.scheduledDate).toISOString().split('T')[0];
    return deliveryDate === today;
  });

  const overdueDeliveries = todaysDeliveries.filter((delivery) => {
    const now = new Date();
    const scheduledTime = new Date(delivery.scheduledDate);
    return now > scheduledTime && delivery.status === 'scheduled';
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
          <h1 className="text-2xl font-bold text-gray-900">Operations Management</h1>
          <p className="text-gray-600">
            Manage deliveries, driver assignments, and operational logistics.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push('/admin/operations/drivers')}
            className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Manage Drivers
          </button>
          <button
            onClick={() => setView('list')}
            className={`rounded-md px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              view === 'list'
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`rounded-md px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              view === 'calendar'
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading operations data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Truck className="text-kubota-orange h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Deliveries</p>
              <p className="text-2xl font-semibold text-gray-900">{todaysDeliveries.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{overdueDeliveries.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available Drivers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {drivers.filter((d) => d.isAvailable).length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {
                  todaysDeliveries.filter(
                    (d) => d.status === 'completed' || d.status === 'delivered'
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="focus:ring-kubota-orange rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
          />
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="rounded-md px-3 py-2 text-sm font-medium text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          >
            Today
          </button>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Deliveries for {new Date(selectedDate).toLocaleDateString()}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                  Booking
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                  Customer
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:table-cell md:px-6">
                  Equipment
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell lg:px-6">
                  Address
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                  Time
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:table-cell md:px-6">
                  Driver
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                  Status
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 sm:px-4 md:px-6">
                    <div className="text-sm font-medium text-gray-900">
                      {delivery.bookingNumber}
                    </div>
                    <div className="text-xs text-gray-500 sm:text-sm">
                      ID: {delivery.id.slice(0, 6)}
                    </div>
                  </td>
                  <td className="px-3 py-4 sm:px-4 md:px-6">
                    <div className="text-sm text-gray-900">{delivery.customerName}</div>
                    <div className="text-xs text-gray-500 sm:text-sm">{delivery.customerPhone}</div>
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-gray-900 sm:px-4 md:table-cell md:px-6">
                    {delivery.equipmentName}
                  </td>
                  <td className="hidden px-3 py-4 lg:table-cell lg:px-6">
                    <div className="max-w-xs truncate text-sm text-gray-900">
                      {delivery.deliveryAddress}
                    </div>
                  </td>
                  <td className="px-3 py-4 sm:px-4 md:px-6">
                    <div className="text-sm text-gray-900">
                      {new Date(delivery.scheduledDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-xs text-gray-500 sm:text-sm">
                      {delivery.estimatedDuration} min
                    </div>
                  </td>
                  <td className="hidden px-3 py-4 sm:px-4 md:table-cell md:px-6">
                    {delivery.driverName ? (
                      <div>
                        <div className="text-sm text-gray-900">{delivery.driverName}</div>
                        <div className="text-xs text-gray-500 sm:text-sm">Assigned</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Unassigned</div>
                    )}
                  </td>
                  <td className="px-3 py-4 sm:px-4 md:px-6">
                    <div className="flex items-center">
                      {getStatusIcon(delivery.status)}
                      <span
                        className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(delivery.status)}`}
                      >
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-right text-sm font-medium sm:px-4 md:px-6">
                    <div className="flex justify-end space-x-2">
                      <PermissionGate permission="operations:read:all">
                        <button
                          onClick={() => setSelectedDelivery(delivery)}
                          className="text-kubota-orange hover:text-orange-600"
                          title="View Details"
                        >
                          View
                        </button>
                      </PermissionGate>
                      {!delivery.driverId && (
                        <PermissionGate permission="operations:manage:all">
                          <button
                            onClick={() => {
                              setAssigningDelivery(delivery);
                              setShowAssignModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Assign Driver"
                          >
                            Assign
                          </button>
                        </PermissionGate>
                      )}
                      {delivery.status === 'scheduled' && (
                        <PermissionGate permission="operations:update:all">
                          <button
                            onClick={() => handleUpdateDeliveryStatus(delivery.id, 'in_transit')}
                            className="text-green-600 hover:text-green-800"
                            title="Start Delivery"
                          >
                            Start
                          </button>
                        </PermissionGate>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drivers Status */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">Driver Status</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className={`rounded-lg border p-4 ${
                  driver.isAvailable ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{driver.name}</h4>
                    <p className="text-sm text-gray-500">{driver.phone}</p>
                    <p className="text-xs text-gray-500">License: {driver.licenseNumber}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        driver.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {driver.isAvailable ? 'Available' : 'Busy'}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {driver.activeDeliveries} active
                    </div>
                  </div>
                </div>
                {driver.currentLocation && (
                  <div className="mt-2 text-xs text-gray-500">
                    <MapPin className="mr-1 inline h-3 w-3" />
                    {driver.currentLocation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery Details Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Delivery Details - {selectedDelivery.bookingNumber}
                </h3>
                <button
                  onClick={() => setSelectedDelivery(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Delivery Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Booking:</strong> {selectedDelivery.bookingNumber}
                    </div>
                    <div>
                      <strong>Equipment:</strong> {selectedDelivery.equipmentName}
                    </div>
                    <div>
                      <strong>Scheduled Time:</strong>{' '}
                      {selectedDelivery.scheduledDate.toLocaleString()}
                    </div>
                    <div>
                      <strong>Estimated Duration:</strong> {selectedDelivery.estimatedDuration}{' '}
                      minutes
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedDelivery.status)}`}
                      >
                        {selectedDelivery.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Name:</strong> {selectedDelivery.customerName}
                    </div>
                    <div>
                      <strong>Phone:</strong> {selectedDelivery.customerPhone}
                    </div>
                    <div>
                      <strong>Address:</strong> {selectedDelivery.deliveryAddress}
                    </div>
                  </div>
                </div>

                {selectedDelivery.driverName && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-900">Driver Assignment</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Driver:</strong> {selectedDelivery.driverName}
                      </div>
                      <div>
                        <strong>Status:</strong> Assigned
                      </div>
                      {selectedDelivery.actualDuration && (
                        <div>
                          <strong>Actual Duration:</strong> {selectedDelivery.actualDuration}{' '}
                          minutes
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedDelivery.specialInstructions && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-900">Special Instructions</h4>
                    <div className="rounded-md bg-yellow-50 p-3 text-sm text-gray-700">
                      {selectedDelivery.specialInstructions}
                    </div>
                  </div>
                )}

                {selectedDelivery.deliveryNotes && (
                  <div className="md:col-span-2">
                    <h4 className="mb-3 text-sm font-medium text-gray-900">Delivery Notes</h4>
                    <div className="rounded-md bg-green-50 p-3 text-sm text-gray-700">
                      {selectedDelivery.deliveryNotes}
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {!selectedDelivery.driverId && (
                      <button
                        onClick={() => {
                          setAssigningDelivery(selectedDelivery);
                          setShowAssignModal(true);
                        }}
                        className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Assign Driver
                      </button>
                    )}
                    {selectedDelivery.status === 'scheduled' && (
                      <button
                        onClick={() =>
                          handleUpdateDeliveryStatus(selectedDelivery.id, 'in_transit')
                        }
                        className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Start Delivery
                      </button>
                    )}
                    {selectedDelivery.status === 'in_transit' && (
                      <button
                        onClick={() => handleUpdateDeliveryStatus(selectedDelivery.id, 'delivered')}
                        className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {selectedDelivery.status === 'delivered' && (
                      <button
                        onClick={() => handleUpdateDeliveryStatus(selectedDelivery.id, 'completed')}
                        className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Complete Delivery
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Open Google Maps with route from rental yard to delivery address
                        const rentalYardAddress = 'Saint John, NB, Canada'; // Default rental yard location
                        const deliveryAddress = encodeURIComponent(
                          selectedDelivery.deliveryAddress
                        );
                        const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(rentalYardAddress)}/${deliveryAddress}`;
                        window.open(mapsUrl, '_blank');
                      }}
                      className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
                    >
                      View Route
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignModal && assigningDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Assign Driver to Delivery</h3>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Booking:</strong> {assigningDelivery.bookingNumber}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Customer:</strong> {assigningDelivery.customerName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Equipment:</strong> {assigningDelivery.equipmentName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Scheduled:</strong>{' '}
                  {new Date(assigningDelivery.scheduledDate).toLocaleString()}
                </p>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select Driver *
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                >
                  <option value="">-- Select a driver --</option>
                  {drivers
                    .filter((d) => d.isAvailable)
                    .map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - {driver.phone} ({driver.activeDeliveries} active)
                      </option>
                    ))}
                </select>
                {drivers.filter((d) => d.isAvailable).length === 0 && (
                  <p className="mt-2 text-sm text-yellow-600">
                    ⚠️ No available drivers. All drivers are currently busy.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssigningDelivery(null);
                    setSelectedDriverId('');
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDriver}
                  disabled={!selectedDriverId}
                  className="bg-kubota-orange rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Assign Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
