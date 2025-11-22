'use client';

import { Filter, Search, X } from 'lucide-react';

import { useState } from 'react';

interface BookingFiltersProps {
  filters: {
    status?: string;
    customerId?: string;
    equipmentId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  onFilterChange: (filters: Partial<BookingFiltersProps['filters']>) => void;
}

export function BookingFilters({ filters, onFilterChange }: BookingFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field: string, value: unknown) => {
    onFilterChange({ [field]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      status: undefined,
      customerId: undefined,
      equipmentId: undefined,
      startDate: undefined,
      endDate: undefined,
      search: undefined,
      type: undefined,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      !['page', 'limit'].includes(key) &&
      value !== undefined &&
      value !== '' &&
      value !== 'createdAt' &&
      value !== 'DESC'
  );

  return (
    <div className="space-y-4">
      {/* Search and basic filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings, customers, or equipment..."
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="focus:ring-premium-gold w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2"
            />
          </div>
        </div>

        {/* Status filter */}
        <div className="sm:w-48">
          <select
            value={filters.status ? filters.status.toUpperCase() : ''}
            onChange={(e) =>
              handleInputChange('status', e.target.value ? e.target.value.toLowerCase() : undefined)
            }
            className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PAID">Paid</option>
            <option value="INSURANCE_VERIFIED">Insurance Verified</option>
            <option value="READY_FOR_PICKUP">Ready for Pickup</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Sort */}
        <div className="sm:w-48">
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              onFilterChange({ sortBy, sortOrder });
            }}
            className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
          >
            <option value="createdAt-DESC">Newest First</option>
            <option value="createdAt-ASC">Oldest First</option>
            <option value="startDate-ASC">Start Date (Earliest)</option>
            <option value="startDate-DESC">Start Date (Latest)</option>
            <option value="total-DESC">Highest Value</option>
            <option value="total-ASC">Lowest Value</option>
            <option value="status-ASC">Status (A-Z)</option>
            <option value="status-DESC">Status (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Advanced filters toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 gap-4 rounded-md bg-gray-50 p-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Date range */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value || undefined)}
              className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value || undefined)}
              className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
            />
          </div>

          {/* Booking type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Booking Type</label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleInputChange('type', e.target.value || undefined)}
              className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
            >
              <option value="">All Types</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="LONG_TERM">Long Term</option>
            </select>
          </div>

          {/* Customer ID */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Customer ID</label>
            <input
              type="text"
              placeholder="Customer ID"
              value={filters.customerId || ''}
              onChange={(e) => handleInputChange('customerId', e.target.value || undefined)}
              className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
            />
          </div>
        </div>
      )}

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (
              key === 'page' ||
              key === 'limit' ||
              value === undefined ||
              value === '' ||
              (key === 'sortBy' && value === 'createdAt') ||
              (key === 'sortOrder' && value === 'DESC')
            ) {
              return null;
            }

            const displayValue =
              key === 'status' && typeof value === 'string' ? value.toUpperCase() : value;

            return (
              <span
                key={key}
                className="bg-blue-600 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
              >
                {key}: {displayValue}
                <button
                  onClick={() => handleInputChange(key, undefined)}
                  className="ml-2 hover:text-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
