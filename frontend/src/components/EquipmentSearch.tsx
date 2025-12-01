'use client';

import { AlertCircle, Search, SlidersHorizontal, X } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

import { AdvancedFilters } from './AdvancedFilters';
import { SearchResults } from './SearchResults';

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
  searchMode?: 'keyword' | 'semantic' | 'hybrid'; // New: semantic search mode
  matchThreshold?: number; // New: similarity threshold
}

interface SearchResult {
  equipment: Equipment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  searchMode?: 'keyword' | 'semantic' | 'hybrid';
  responseTimeMs?: number;
  fallbackReason?: string;
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
  const { warning } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    limit: 20,
    sortBy: 'unitId',
    sortOrder: 'ASC',
    searchMode: 'hybrid', // Always use hybrid/semantic search
    matchThreshold: 0.5, // Fixed threshold for semantic search
  });
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ suggestion: string; similarity: number; sourceType: string }>>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [embeddingAvailable, setEmbeddingAvailable] = useState<boolean | null>(null);
  const [activeSearchMode, setActiveSearchMode] = useState<'keyword' | 'semantic' | 'hybrid'>('hybrid');

  // Load filter options and check embedding availability on component mount
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
          logger.error(
            'Failed to load filter options:',
            {
              component: 'EquipmentSearch',
              action: 'error',
            },
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
    };

    const checkEmbeddingAvailability = async () => {
      try {
        // Check if embeddings exist by querying equipment
        const response = await fetch('/api/equipment?limit=1&hasEmbedding=true');
        if (response.ok) {
          // If we can query, embeddings might exist - we'll know for sure when search runs
          setEmbeddingAvailable(null); // Unknown until first search
        }
      } catch {
        setEmbeddingAvailable(false);
      }
    };

    loadFilterOptions();
    checkEmbeddingAvailability();

    // Perform initial search to show all equipment
    const initialFilters: SearchFilters = {
      page: 1,
      limit: 20,
      sortBy: 'unitId',
      sortOrder: 'ASC',
      searchMode: 'hybrid',
      matchThreshold: 0.5,
    };

    // Trigger initial search after a short delay to ensure component is ready
    setTimeout(() => {
      performSearch(initialFilters);
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

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
          `/api/equipment/search/suggestions?query=${encodeURIComponent(searchTerm)}`
        );
        if (response.ok) {
          const data = await response.json();
          const allSuggestions = data.suggestions || [];

          // Show "Did you mean?" if there's a high-similarity suggestion (>= 0.5)
          const bestSuggestion = allSuggestions.find((s: { similarity: number }) => s.similarity >= 0.5);
          setDidYouMean(bestSuggestion ? bestSuggestion.suggestion : null);

          setSuggestions(allSuggestions.slice(0, 5));
          setShowSuggestions(allSuggestions.length > 0);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error(
            'Failed to load suggestions:',
            {
              component: 'EquipmentSearch',
              action: 'error',
            },
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Perform search
  const performSearch = useCallback(
    async (searchFilters: SearchFilters) => {
      setLoading(true);
      try {
        // Always use hybrid/semantic search - no option to disable
        const searchFiltersWithMode = {
          ...searchFilters,
          searchMode: 'hybrid' as const, // Always use hybrid search
          matchThreshold: 0.5, // Fixed threshold
        };

        const response = await fetch('/api/equipment/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(searchFiltersWithMode),
        });

        if (response.ok) {
          const data = await response.json();
          logger.debug('Search response received', {
            component: 'EquipmentSearch',
            action: 'search_response',
            metadata: {
              hasData: !!data,
              equipmentCount: data?.equipment?.length || 0,
              total: data?.total || 0,
              searchMode: data?.searchMode,
            },
          });
          setResults(data);

          // Update active search mode and embedding availability
          if (data.searchMode) {
            setActiveSearchMode(data.searchMode);
            // If semantic/hybrid search worked, embeddings are available
            if (data.searchMode === 'semantic' || data.searchMode === 'hybrid') {
              setEmbeddingAvailable(true);
            }
          }

          // Update embedding availability if no embeddings found
          if (data.fallbackReason && data.fallbackReason.includes('No embeddings found')) {
            setEmbeddingAvailable(false);
          }
        } else {
          // Get error message from response
          let errorMessage = 'Search failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }

            logger.error('Search failed:', {
              component: 'EquipmentSearch',
              action: 'error',
            metadata: { statusText: response.statusText, errorMessage },
            });

          // Show error to user
          warning('Search Error', errorMessage);

          // Set empty results so UI shows "No results" instead of hanging
          setResults({
            equipment: [],
            total: 0,
            page: 1,
            limit: filters.limit || 20,
            totalPages: 0,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
          logger.error(
            'Search error:',
          { component: 'EquipmentSearch', action: 'error', metadata: { errorMessage } },
            error instanceof Error ? error : new Error(String(error))
          );

        // Show error to user
        warning('Search Error', errorMessage);

        // Set empty results
        setResults({
          equipment: [],
          total: 0,
          page: 1,
          limit: filters.limit || 20,
          totalPages: 0,
        });
      } finally {
        setLoading(false);
      }
    },
    [warning]
  );

  // Handle search term change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, query: value, page: 1 }));
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
  const handleSuggestionSelect = (suggestion: string | { suggestion: string }) => {
    const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.suggestion;
    setSearchTerm(suggestionText);
    setFilters((prev) => ({ ...prev, query: suggestionText, page: 1 }));
    setShowSuggestions(false);
    setDidYouMean(null);
    performSearch({ ...filters, query: suggestionText, page: 1 });
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
      searchMode: 'hybrid', // Always use hybrid/semantic search
      matchThreshold: 0.5, // Fixed threshold
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
        <div className="space-y-2">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by unit ID, model, make, or location..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
          </div>

          {/* Embedding Availability Badge (Optional - only show if unavailable) */}
          {embeddingAvailable === false && (
          <div className="flex items-center space-x-2">
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                <AlertCircle className="mr-1 h-3 w-3" />
                AI Search Unavailable
              </span>
            </div>
            )}

          {/* "Did you mean?" Suggestion */}
          {didYouMean && didYouMean.toLowerCase() !== searchTerm.toLowerCase() && (
            <div className="mt-2 flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <span>Did you mean:</span>
              <button
                onClick={() => {
                  setSearchTerm(didYouMean);
                  setDidYouMean(null);
                  handleSearch();
                }}
                className="font-semibold text-blue-600 underline hover:text-blue-800"
              >
                {didYouMean}
              </button>
          </div>
          )}

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {suggestions.map((suggestion, index: number) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion.suggestion)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
                >
                  <span className="font-medium">{suggestion.suggestion}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({suggestion.sourceType}) - {Math.round(suggestion.similarity * 100)}% match
                  </span>
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
        <SearchResults
          results={results}
          loading={loading}
          onPageChange={handlePageChange}
          searchMode={results.searchMode || activeSearchMode}
        />
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
