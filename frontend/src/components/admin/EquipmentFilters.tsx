'use client';

import { Filter, X } from 'lucide-react';

import { useState } from 'react';

interface EquipmentFiltersProps {
  onFiltersChange: (filters: {
    search: string;
    status: string;
    location: string;
    make: string;
    model: string;
  }) => void;
}

export function EquipmentFilters({ onFiltersChange }: EquipmentFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    location: '',
    make: '',
    model: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      location: '',
      make: '',
      model: '',
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Equipment Filters</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="mr-1 h-4 w-4" />
              Clear all
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <Filter className="mr-1 h-4 w-4" />
            {showFilters ? 'Hide' : 'Show'} filters
          </button>
        </div>
      </div>

      {/* Search bar - always visible */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by unit ID, serial number, or model..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
        />
      </div>

      {/* Advanced filters - collapsible */}
      {showFilters && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RENTED">Rented</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            >
              <option value="">All Locations</option>
              <option value="Main Yard">Main Yard</option>
              <option value="Service Bay">Service Bay</option>
              <option value="Repair Shop">Repair Shop</option>
              <option value="Job Site A">Job Site A</option>
              <option value="Job Site B">Job Site B</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Make</label>
            <select
              value={filters.make}
              onChange={(e) => handleFilterChange('make', e.target.value)}
              className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            >
              <option value="">All Makes</option>
              <option value="Kubota">Kubota</option>
              <option value="Caterpillar">Caterpillar</option>
              <option value="John Deere">John Deere</option>
              <option value="Bobcat">Bobcat</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Model</label>
            <input
              type="text"
              placeholder="e.g., SVL-75"
              value={filters.model}
              onChange={(e) => handleFilterChange('model', e.target.value)}
              className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
            />
          </div>
        </div>
      )}

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {filters.search && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Search: {filters.search}
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Status: {filters.status}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
              Location: {filters.location}
              <button
                onClick={() => handleFilterChange('location', '')}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.make && (
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
              Make: {filters.make}
              <button
                onClick={() => handleFilterChange('make', '')}
                className="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.model && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
              Model: {filters.model}
              <button
                onClick={() => handleFilterChange('model', '')}
                className="ml-1 text-red-600 hover:text-red-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
