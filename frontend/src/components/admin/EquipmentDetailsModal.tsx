'use client';

import { Clock, MapPin, X } from 'lucide-react';

interface Equipment {
  id: string;
  unitId: string;
  serialNumber: string;
  model: string;
  year: number;
  make: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  location: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  totalEngineHours?: number;
  specifications?: unknown;
  createdAt: string;
  updatedAt: string;
}

interface EquipmentDetailsModalProps {
  equipment: Equipment | null;
  onClose: () => void;
}

export function EquipmentDetailsModal({ equipment, onClose }: EquipmentDetailsModalProps) {
  if (!equipment) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'RENTED':
        return 'bg-blue-100 text-blue-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'OUT_OF_SERVICE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isMaintenanceDue = (nextMaintenance?: string) => {
    if (!nextMaintenance) return false;
    const dueDate = new Date(nextMaintenance);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7;
  };

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="relative top-20 mx-auto w-11/12 max-w-4xl rounded-md border bg-white p-5 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{equipment.unitId}</h3>
            <p className="text-gray-600">
              {equipment.make} {equipment.model} ({equipment.year})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <h4 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h4>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Unit ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{equipment.unitId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{equipment.serialNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Make & Model</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {equipment.make} {equipment.model}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Year</dt>
                  <dd className="mt-1 text-sm text-gray-900">{equipment.year}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(equipment.status)}`}
                    >
                      {equipment.status.replace('_', ' ')}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                    {equipment.location}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Pricing Information */}
            <div>
              <h4 className="mb-4 text-lg font-semibold text-gray-900">Pricing</h4>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Daily Rate</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(equipment.dailyRate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Weekly Rate</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(equipment.weeklyRate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Monthly Rate</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(equipment.monthlyRate)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Maintenance & Specifications */}
          <div className="space-y-6">
            {/* Maintenance Information */}
            <div>
              <h4 className="mb-4 text-lg font-semibold text-gray-900">Maintenance</h4>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Engine Hours</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    <Clock className="mr-1 h-4 w-4 text-gray-400" />
                    {equipment.totalEngineHours
                      ? `${equipment.totalEngineHours.toLocaleString()} hours`
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Maintenance</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {equipment.lastMaintenance ? formatDate(equipment.lastMaintenance) : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Next Maintenance Due</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    {equipment.nextMaintenance ? (
                      <>
                        {formatDate(equipment.nextMaintenance)}
                        {isMaintenanceDue(equipment.nextMaintenance) && (
                          <span className="ml-2 font-medium text-red-600">⚠️ Due Soon</span>
                        )}
                      </>
                    ) : (
                      'Not scheduled'
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Specifications */}
            {equipment.specifications && (
              <div>
                <h4 className="mb-4 text-lg font-semibold text-gray-900">Specifications</h4>
                <dl className="grid grid-cols-1 gap-4">
                  {(equipment.specifications as { engine?: string }).engine && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Engine</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {(equipment.specifications as { engine?: string }).engine}
                      </dd>
                    </div>
                  )}
                  {(equipment.specifications as { horsepower?: string | number }).horsepower && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Horsepower</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {(equipment.specifications as { horsepower?: string | number }).horsepower}
                      </dd>
                    </div>
                  )}
                  {(equipment.specifications as { operatingWeight?: string | number })
                    .operatingWeight && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Operating Weight</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {
                          (equipment.specifications as { operatingWeight?: string | number })
                            .operatingWeight
                        }
                      </dd>
                    </div>
                  )}
                  {(equipment.specifications as { bucketCapacity?: string | number })
                    .bucketCapacity && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Bucket Capacity</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {
                          (equipment.specifications as { bucketCapacity?: string | number })
                            .bucketCapacity
                        }
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* System Information */}
            <div>
              <h4 className="mb-4 text-lg font-semibold text-gray-900">System Information</h4>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(equipment.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(equipment.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-6">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
