'use client';

import { useState } from 'react';
import { MapPin, Clock, DollarSign, Calendar, Wrench } from 'lucide-react';
import { logger } from '@/lib/logger';

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
  similarity?: number;
  keywordMatch?: boolean;
  rank?: number;
  semanticScore?: number;
}

interface SearchResult {
  equipment: Equipment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SearchResultsProps {
  results: SearchResult;
  loading: boolean;
  onPageChange: (page: number) => void;
  searchMode?: 'keyword' | 'semantic' | 'hybrid';
}

export function SearchResults({ results, loading, onPageChange, searchMode = 'keyword' }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Helper function to extract location string from JSONB or string
  const extractLocation = (location: unknown): string => {
    if (!location) return 'Main Yard';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location !== null) {
      const loc = location as { name?: string; city?: string; address?: string };
      return loc.name || loc.city || loc.address || 'Main Yard';
    }
    return 'Main Yard';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA');
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

  const handleBookNow = (equipment: Equipment) => {
    // TODO: Implement booking flow
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Book now clicked for:', {
        component: 'SearchResults',
        action: 'debug',
        metadata: { unitId: equipment.unitId },
      });
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="mb-4 h-3 w-1/2 rounded bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-3 rounded bg-gray-200"></div>
                  <div className="h-3 rounded bg-gray-200"></div>
                  <div className="h-3 w-2/3 rounded bg-gray-200"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Results Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Search Results ({results.total} equipment found)
            </h3>
            <p className="text-sm text-gray-500">
              Showing {(results.page - 1) * results.limit + 1} to{' '}
              {Math.min(results.page * results.limit, results.total)} of {results.total} results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-2 ${
                viewMode === 'grid'
                  ? 'bg-kubota-orange text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md p-2 ${
                viewMode === 'list'
                  ? 'bg-kubota-orange text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.equipment.map(equipment => (
              <div
                key={equipment.id}
                className="rounded-lg border p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold text-gray-900">{equipment.unitId}</h4>
                      {searchMode !== 'keyword' && equipment.rank === 1 && (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Best Match
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {equipment.make} {equipment.model} ({equipment.year})
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(equipment.status)}`}
                  >
                    {equipment.status.replace('_', ' ')}
                  </span>
                    {searchMode !== 'keyword' && equipment.similarity !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Match:</span>
                        <div className="relative h-2 w-16 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-kubota-orange transition-all"
                            style={{ width: `${equipment.similarity * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {Math.round(equipment.similarity * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="mr-2 h-4 w-4" />
                    {extractLocation(equipment.location)}
                  </div>
                  {equipment.totalEngineHours && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="mr-2 h-4 w-4" />
                      {equipment.totalEngineHours.toLocaleString()} hours
                    </div>
                  )}
                  {equipment.nextMaintenance && (
                    <div
                      className={`flex items-center text-sm ${
                        isMaintenanceDue(equipment.nextMaintenance)
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Maintenance due: {formatDate(equipment.nextMaintenance)}
                      {isMaintenanceDue(equipment.nextMaintenance) && ' ⚠️'}
                    </div>
                  )}
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(equipment.dailyRate)}
                    </div>
                    <div className="text-sm text-gray-500">per day</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {formatCurrency(equipment.weeklyRate)}/week
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(equipment.monthlyRate)}/month
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBookNow(equipment)}
                  disabled={equipment.status !== 'AVAILABLE'}
                  className={`w-full rounded-md px-4 py-2 text-sm font-medium ${
                    equipment.status === 'AVAILABLE'
                      ? 'bg-kubota-orange text-white hover:bg-orange-600'
                      : 'cursor-not-allowed bg-gray-300 text-gray-500'
                  }`}
                >
                  {equipment.status === 'AVAILABLE' ? 'Book Now' : 'Not Available'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Daily Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Maintenance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {results.equipment.map(equipment => (
                  <tr key={equipment.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{equipment.unitId}</div>
                        <div className="text-sm text-gray-500">
                          {equipment.make} {equipment.model} ({equipment.year})
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(equipment.status)}`}
                      >
                        {equipment.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                        {extractLocation(equipment.location)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{formatCurrency(equipment.dailyRate)}</div>
                      <div className="text-gray-500">
                        {formatCurrency(equipment.weeklyRate)}/week
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {equipment.nextMaintenance ? (
                        <div
                          className={`flex items-center ${
                            isMaintenanceDue(equipment.nextMaintenance)
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          <Calendar className="mr-1 h-4 w-4" />
                          {formatDate(equipment.nextMaintenance)}
                          {isMaintenanceDue(equipment.nextMaintenance) && ' ⚠️'}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => handleBookNow(equipment)}
                        disabled={equipment.status !== 'AVAILABLE'}
                        className={`rounded-md px-3 py-1 text-sm ${
                          equipment.status === 'AVAILABLE'
                            ? 'bg-kubota-orange text-white hover:bg-orange-600'
                            : 'cursor-not-allowed bg-gray-300 text-gray-500'
                        }`}
                      >
                        {equipment.status === 'AVAILABLE' ? 'Book' : 'Unavailable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {results.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {results.page} of {results.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(results.page - 1)}
                disabled={results.page <= 1}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(Math.min(5, results.totalPages))].map((_, i) => {
                const pageNum = Math.max(1, results.page - 2) + i;
                if (pageNum > results.totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      pageNum === results.page
                        ? 'bg-kubota-orange text-white'
                        : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange(results.page + 1)}
                disabled={results.page >= results.totalPages}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
