'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface SearchFilters {
  query?: string;
  status?: string;
  location?: string;
  make?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  startDate?: string;
  endDate?: string;
  availableOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface FilterOptions {
  statuses: string[];
  locations: string[];
  makes: string[];
  models: string[];
  priceRange: { min: number; max: number };
  yearRange: { min: number; max: number };
}

interface AdvancedFiltersProps {
  filters: SearchFilters;
  filterOptions: FilterOptions;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
}

export function AdvancedFilters({ filters, filterOptions, onFiltersChange }: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<Partial<SearchFilters>>({
    status: filters.status,
    location: filters.location,
    make: filters.make,
    model: filters.model,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minYear: filters.minYear,
    maxYear: filters.maxYear,
    startDate: filters.startDate,
    endDate: filters.endDate,
    availableOnly: filters.availableOnly,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: Partial<SearchFilters> = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(
    value => value !== undefined && value !== '' && value !== null
  );

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="mr-1 h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
          <div className="relative">
            <select
              value={localFilters.status || ''}
              onChange={e => handleFilterChange('status', e.target.value || undefined)}
              className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            >
              <option value="">All Statuses</option>
              {filterOptions.statuses.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
            {localFilters.status && (
              <button
                onClick={() => clearFilter('status')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Location Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Location</label>
          <div className="relative">
            <select
              value={localFilters.location || ''}
              onChange={e => handleFilterChange('location', e.target.value || undefined)}
              className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            >
              <option value="">All Locations</option>
              {filterOptions.locations.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            {localFilters.location && (
              <button
                onClick={() => clearFilter('location')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Make Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Make</label>
          <div className="relative">
            <select
              value={localFilters.make || ''}
              onChange={e => handleFilterChange('make', e.target.value || undefined)}
              className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            >
              <option value="">All Makes</option>
              {filterOptions.makes.map(make => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
            {localFilters.make && (
              <button
                onClick={() => clearFilter('make')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Model Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Model</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g., SVL-75"
              value={localFilters.model || ''}
              onChange={e => handleFilterChange('model', e.target.value || undefined)}
              className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            />
            {localFilters.model && (
              <button
                onClick={() => clearFilter('model')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Daily Rate Range</label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={localFilters.minPrice || ''}
              onChange={e =>
                handleFilterChange(
                  'minPrice',
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              className="focus:ring-kubota-orange flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            />
            <span className="flex items-center text-gray-500">to</span>
            <input
              type="number"
              placeholder="Max"
              value={localFilters.maxPrice || ''}
              onChange={e =>
                handleFilterChange(
                  'maxPrice',
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              className="focus:ring-kubota-orange flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            />
          </div>
        </div>

        {/* Year Range */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Year Range</label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min Year"
              value={localFilters.minYear || ''}
              onChange={e =>
                handleFilterChange('minYear', e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="focus:ring-kubota-orange flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            />
            <span className="flex items-center text-gray-500">to</span>
            <input
              type="number"
              placeholder="Max Year"
              value={localFilters.maxYear || ''}
              onChange={e =>
                handleFilterChange('maxYear', e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="focus:ring-kubota-orange flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            />
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Availability Date Range
          </label>
          <div className="space-y-2">
            <input
              type="date"
              placeholder="Start Date"
              value={localFilters.startDate || ''}
              onChange={e => handleFilterChange('startDate', e.target.value || undefined)}
              className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            />
            <input
              type="date"
              placeholder="End Date"
              value={localFilters.endDate || ''}
              onChange={e => handleFilterChange('endDate', e.target.value || undefined)}
              className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            />
          </div>
        </div>

        {/* Available Only Checkbox */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Availability</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.availableOnly || false}
              onChange={e => handleFilterChange('availableOnly', e.target.checked || undefined)}
              className="text-kubota-orange focus:ring-kubota-orange h-4 w-4 rounded border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Available only</span>
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Sort By</label>
          <div className="flex space-x-2">
            <select
              value={localFilters.sortBy || 'unitId'}
              onChange={e => handleFilterChange('sortBy', e.target.value)}
              className="focus:ring-kubota-orange flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            >
              <option value="unitId">Unit ID</option>
              <option value="model">Model</option>
              <option value="make">Make</option>
              <option value="year">Year</option>
              <option value="dailyRate">Daily Rate</option>
              <option value="status">Status</option>
              <option value="location">Location</option>
            </select>
            <select
              value={localFilters.sortOrder || 'ASC'}
              onChange={e => handleFilterChange('sortOrder', e.target.value as 'ASC' | 'DESC')}
              className="focus:ring-kubota-orange rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            >
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="mb-3 text-sm font-medium text-gray-700">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {localFilters.status && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Status: {localFilters.status.replace('_', ' ')}
                <button
                  onClick={() => clearFilter('status')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {localFilters.location && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Location: {localFilters.location}
                <button
                  onClick={() => clearFilter('location')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {localFilters.make && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                Make: {localFilters.make}
                <button
                  onClick={() => clearFilter('make')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {localFilters.model && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                Model: {localFilters.model}
                <button
                  onClick={() => clearFilter('model')}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(localFilters.minPrice || localFilters.maxPrice) && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                Price: ${localFilters.minPrice || 0} - ${localFilters.maxPrice || '∞'}
                <button
                  onClick={() => {
                    clearFilter('minPrice');
                    clearFilter('maxPrice');
                  }}
                  className="ml-1 text-red-600 hover:text-red-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {localFilters.availableOnly && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                Available Only
                <button
                  onClick={() => clearFilter('availableOnly')}
                  className="ml-1 text-indigo-600 hover:text-indigo-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
