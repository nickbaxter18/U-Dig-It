'use client';

import { CheckCircle, Edit, MapPin, Plus, Trash2, XCircle } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { AdminModal } from '@/components/admin/AdminModal';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  vehicleType?: string;
  vehicleRegistration?: string;
  notes?: string;
  isAvailable: boolean;
  currentLocation?: string;
  activeDeliveries: number;
  totalDeliveriesCompleted: number;
}

// Utility function to convert date string to YYYY-MM-DD format for date input
const toDateInputValue = (date: string | null | undefined): string => {
  if (!date) return '';
  try {
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

export default function DriversManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleType: '',
    vehicleRegistration: '',
    notes: '',
    isAvailable: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      fetchDrivers();
    }
  }, [user, authLoading, router]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/admin/drivers');
      if (!res.ok) throw new Error('Failed to fetch drivers');
      const data = await res.json();

      setDrivers(
        data.drivers
          .filter((d: unknown) => d && typeof d === 'object' && 'id' in d && d.id)
          .map((d: any) => ({
            id: d.id as string,
            name: d.name as string,
            phone: d.phone as string,
            licenseNumber: d.license_number as string | undefined,
            licenseExpiry: d.license_expiry as string | undefined,
            vehicleType: d.vehicle_type as string | undefined,
            vehicleRegistration: d.vehicle_registration as string | undefined,
            notes: d.notes as string | undefined,
            isAvailable: d.is_available as boolean,
            currentLocation: d.current_location as string | undefined,
            activeDeliveries: (d.active_deliveries as number) || 0,
            totalDeliveriesCompleted: (d.total_deliveries_completed as number) || 0,
          }))
      );
    } catch (error) {
      logger.error(
        'Failed to fetch drivers',
        {
          component: 'DriversManagementPage',
          action: 'fetch_drivers_error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (driver?: Driver) => {
    if (driver) {
      // Validate driver has an id before setting as editing
      if (!driver.id) {
        logger.error(
          'Cannot edit driver without ID',
          {
            component: 'DriversManagementPage',
            action: 'edit_driver_no_id',
            metadata: { driver },
          },
          new Error('Driver object missing id property')
        );
        alert('Error: Driver ID is missing. Please refresh the page and try again.');
        return;
      }
      setEditingDriver(driver);
      setFormData({
        name: driver.name,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber || '',
        licenseExpiry: toDateInputValue(driver.licenseExpiry),
        vehicleType: driver.vehicleType || '',
        vehicleRegistration: driver.vehicleRegistration || '',
        notes: driver.notes || '',
        isAvailable: driver.isAvailable,
      });
    } else {
      setEditingDriver(null);
      setFormData({
        name: '',
        phone: '',
        licenseNumber: '',
        licenseExpiry: '',
        vehicleType: '',
        vehicleRegistration: '',
        notes: '',
        isAvailable: true,
      });
    }
    setShowModal(true);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);

      // Validate editingDriver has an id if we're updating
      if (editingDriver && !editingDriver.id) {
        throw new Error('Driver ID is missing. Please try refreshing the page.');
      }

      const url = editingDriver ? `/api/admin/drivers/${editingDriver.id}` : '/api/admin/drivers';
      const method = editingDriver ? 'PATCH' : 'POST';

      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          licenseNumber: formData.licenseNumber.trim() || null,
          licenseExpiry: formData.licenseExpiry.trim() || null,
          vehicleType: formData.vehicleType.trim() || null,
          vehicleRegistration: formData.vehicleRegistration.trim() || null,
          notes: formData.notes.trim() || null,
          isAvailable: formData.isAvailable,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || errorData.details || 'Failed to save driver';

        // Extract field-specific errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const fieldErrors: Record<string, string> = {};
          errorData.details.forEach((detail: { path?: string[]; message?: string }) => {
            if (detail.path && detail.path.length > 0) {
              const field = detail.path[detail.path.length - 1];
              // Map API field names to form field names
              const formFieldName =
                field === 'license_expiry'
                  ? 'licenseExpiry'
                  : field === 'license_number'
                    ? 'licenseNumber'
                    : field === 'vehicle_type'
                      ? 'vehicleType'
                      : field === 'vehicle_registration'
                        ? 'vehicleRegistration'
                        : field;
              fieldErrors[formFieldName] = detail.message || `${formFieldName} is invalid`;
            }
          });
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
          }
        }

        // Include more details in development
        if (process.env.NODE_ENV === 'development' && errorData.details) {
          errorMessage = `${errorMessage}: ${JSON.stringify(errorData.details)}`;
        }

        throw new Error(errorMessage);
      }

      logger.info('Driver saved successfully', {
        component: 'DriversManagementPage',
        action: editingDriver ? 'update_driver' : 'create_driver',
        metadata: { driverId: editingDriver?.id },
      });

      setShowModal(false);
      await fetchDrivers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors({ general: errorMessage });
      logger.error(
        'Failed to save driver',
        {
          component: 'DriversManagementPage',
          action: 'save_driver_error',
          metadata: { error: errorMessage },
        },
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
      const response = await fetchWithAuth(`/api/admin/drivers/${driverId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete driver');
      }

      logger.info('Driver deleted successfully', {
        component: 'DriversManagementPage',
        action: 'delete_driver',
        metadata: { driverId },
      });

      await fetchDrivers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to delete driver: ${errorMessage}`);
      logger.error(
        'Failed to delete driver',
        {
          component: 'DriversManagementPage',
          action: 'delete_driver_error',
          metadata: { error: errorMessage },
        },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-kubota-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
            <p className="mt-2 text-gray-600">Manage your delivery drivers</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-kubota-orange hover:bg-kubota-orange-dark text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Driver
          </button>
        </div>

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className={`rounded-lg border p-6 shadow-sm ${
                driver.isAvailable ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
                  <p className="text-sm text-gray-600">{driver.phone}</p>
                </div>
                {driver.isAvailable ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>

              <div className="space-y-2 text-sm">
                {driver.licenseNumber && (
                  <div>
                    <span className="font-medium text-gray-700">License:</span>{' '}
                    <span className="text-gray-600">{driver.licenseNumber}</span>
                  </div>
                )}
                {driver.vehicleType && (
                  <div>
                    <span className="font-medium text-gray-700">Vehicle:</span>{' '}
                    <span className="text-gray-600">{driver.vehicleType}</span>
                  </div>
                )}
                {driver.currentLocation && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-gray-600">{driver.currentLocation}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Active Deliveries:</span>{' '}
                  <span className="text-gray-600">{driver.activeDeliveries}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total Completed:</span>{' '}
                  <span className="text-gray-600">{driver.totalDeliveriesCompleted}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleOpenModal(driver)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(driver.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {drivers.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">
                No drivers found. Add your first driver to get started.
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        <AdminModal
          isOpen={showModal}
          onClose={() => {
            if (!submitting) {
              setShowModal(false);
              setErrors({});
            }
          }}
          title={editingDriver ? 'Edit Driver' : 'Add New Driver'}
          maxWidth="2xl"
          showCloseButton={true}
        >
          <div className="p-6">
            {errors.general && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={submitting}
                        className={`w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-kubota-orange focus:border-transparent focus:outline-none ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        required
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={submitting}
                        className={`w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-kubota-orange focus:border-transparent focus:outline-none ${
                          errors.phone ? 'border-red-300' : 'border-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        required
                      />
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, licenseNumber: e.target.value })
                        }
                        disabled={submitting}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-kubota-orange focus:border-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {errors.licenseNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Expiry
                      </label>
                      <input
                        type="date"
                        value={formData.licenseExpiry}
                        onChange={(e) =>
                          setFormData({ ...formData, licenseExpiry: e.target.value })
                        }
                        disabled={submitting}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-kubota-orange focus:border-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {errors.licenseExpiry && (
                        <p className="mt-1 text-sm text-red-600">{errors.licenseExpiry}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Type
                      </label>
                      <input
                        type="text"
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        disabled={submitting}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-kubota-orange focus:border-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="e.g., Pickup Truck, Van"
                      />
                      {errors.vehicleType && (
                        <p className="mt-1 text-sm text-red-600">{errors.vehicleType}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Registration
                      </label>
                      <input
                        type="text"
                        value={formData.vehicleRegistration}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicleRegistration: e.target.value })
                        }
                        disabled={submitting}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-kubota-orange focus:border-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {errors.vehicleRegistration && (
                        <p className="mt-1 text-sm text-red-600">{errors.vehicleRegistration}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      disabled={submitting}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-kubota-orange focus:border-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Additional notes about this driver"
                    />
                    {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      disabled={submitting}
                      className="h-4 w-4 rounded border-gray-300 text-kubota-orange focus:ring-kubota-orange disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="isAvailable" className="ml-2 text-sm font-medium text-gray-700">
                      Available for assignments
                    </label>
                  </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    if (!submitting) {
                      setShowModal(false);
                      setErrors({});
                    }
                  }}
                  disabled={submitting}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-kubota-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-kubota-orange hover:bg-kubota-orange-dark text-white px-6 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-kubota-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {editingDriver ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editingDriver ? 'Update Driver' : 'Create Driver'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </AdminModal>
      </div>
    </div>
  );
}
