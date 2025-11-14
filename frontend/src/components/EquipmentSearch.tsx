'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { AdvancedFilters } from './AdvancedFilters';
import { SearchResults } from './SearchResults';
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
}

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

interface SearchResult {
  equipment: Equipment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FilterOptions {
  statuses: string[];
  locations: string[];
  makes: string[];
  models: string[];
  priceRange: { min: number; max: number };
  yearRange: { min: number; max: number };
}

export function EquipmentSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    limit: 20,
    sortBy: 'unitId',
    sortOrder: 'ASC',
  });
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load filter options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch('/api/equipment/search/filters');
        if (response.ok) {
          const options = await response.json();
          setFilterOptions(options);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Failed to load filter options:', {
            component: 'EquipmentSearch',
            action: 'error',
          }, error instanceof Error ? error : new Error(String(error)));
        }
      }
    };

    loadFilterOptions();
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/equipment/search/suggestions?query=${encodeURIComponent(searchTerm)}&limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          const allSuggestions = [
            ...data.units,
            ...data.models,
            ...data.makes,
            ...data.locations,
          ].slice(0, 5);
          setSuggestions(allSuggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Failed to load suggestions:', {
            component: 'EquipmentSearch',
            action: 'error',
          }, error instanceof Error ? error : new Error(String(error)));
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Perform search
  const performSearch = useCallback(async (searchFilters: SearchFilters) => {
    setLoading(true);
    try {
      const response = await fetch('/api/equipment/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchFilters),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Search failed:', {
            component: 'EquipmentSearch',
            action: 'error',
            metadata: { statusText: response.statusText },
          });
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Search error:', { component: 'EquipmentSearch', action: 'error' }, error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search term change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, query: value, page: 1 }));
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    performSearch(updatedFilters);
  };

  // Handle search submission
  const handleSearch = () => {
    const searchFilters = { ...filters, query: searchTerm };
    setFilters(searchFilters);
    performSearch(searchFilters);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setSearchTerm(suggestion);
    setFilters(prev => ({ ...prev, query: suggestion, page: 1 }));
    setShowSuggestions(false);
    performSearch({ ...filters, query: suggestion, page: 1 });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    performSearch(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      page: 1,
      limit: 20,
      sortBy: 'unitId',
      sortOrder: 'ASC',
    };
    setFilters(clearedFilters);
    setSearchTerm('');
    performSearch(clearedFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'page' || key === 'limit' || key === 'sortBy' || key === 'sortOrder') {
      return false;
    }
    return value !== undefined && value !== '' && value !== null;
  });

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Find Equipment</h2>
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
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium leading-4 shadow-sm ${
                showAdvancedFilters
                  ? 'bg-kubota-orange border-kubota-orange text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by unit ID, model, make, or location..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            onFocus={() => setShowSuggestions(true)}
            className="focus:ring-kubota-orange block w-full rounded-md border border-gray-300 bg-white py-3 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-2"
          />
          <button
            onClick={handleSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <span className="bg-kubota-orange focus:ring-kubota-orange inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2">
              Search
            </span>
          </button>

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {suggestions.map((suggestion: any, index: any) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && filterOptions && (
        <AdvancedFilters
          filters={filters}
          filterOptions={filterOptions}
          onFiltersChange={handleFiltersChange}
        />
      )}

      {/* Search Results */}
      {results && (
        <SearchResults results={results} loading={loading} onPageChange={handlePageChange} />
      )}

      {/* No Results Message */}
      {results && results.equipment.length === 0 && !loading && (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <div className="text-gray-500">
            <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No equipment found</h3>
            <p className="text-gray-500">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <button
              onClick={clearFilters}
              className="text-kubota-orange mt-4 inline-flex items-center rounded-md border border-transparent bg-orange-50 px-4 py-2 text-sm font-medium hover:bg-orange-100"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
