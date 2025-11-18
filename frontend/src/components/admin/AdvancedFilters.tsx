'use client';

import { Calendar, Filter, X } from 'lucide-react';
import { useState } from 'react';
import { FilterPresets, FilterPreset } from './FilterPresets';
import { useFilterPresets } from '@/hooks/useFilterPresets';

export interface FilterOperator {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: string | string[] | number | [number, number] | [string, string];
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface AdvancedFiltersProps {
  filters: {
    dateRange?: DateRange;
    operators?: FilterOperator[];
    multiSelects?: Record<string, string[]>;
  };
  onFiltersChange: (filters: {
    dateRange?: DateRange;
    operators?: FilterOperator[];
    multiSelects?: Record<string, string[]>;
  }) => void;
  availableFields?: Array<{
    label: string;
    value: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: Array<{ label: string; value: string }>;
  }>;
  multiSelectFields?: Array<{
    label: string;
    value: string;
    options: Array<{ label: string; value: string }>;
  }>;
  className?: string;
}

const OPERATORS = {
  text: [
    { label: 'Contains', value: 'contains' },
    { label: 'Does not contain', value: 'not_contains' },
    { label: 'Equals', value: 'equals' },
    { label: 'Does not equal', value: 'not_equals' },
    { label: 'Starts with', value: 'starts_with' },
    { label: 'Ends with', value: 'ends_with' },
  ],
  number: [
    { label: 'Equals', value: 'equals' },
    { label: 'Greater than', value: 'greater_than' },
    { label: 'Less than', value: 'less_than' },
    { label: 'Between', value: 'between' },
  ],
  date: [
    { label: 'Equals', value: 'equals' },
    { label: 'After', value: 'greater_than' },
    { label: 'Before', value: 'less_than' },
    { label: 'Between', value: 'between' },
  ],
  select: [
    { label: 'Equals', value: 'equals' },
    { label: 'Does not equal', value: 'not_equals' },
    { label: 'In', value: 'in' },
    { label: 'Not in', value: 'not_in' },
  ],
};

export function AdvancedFilters({
  filters,
  onFiltersChange,
  availableFields = [],
  multiSelectFields = [],
  className = '',
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const { presets, savePreset, deletePreset, loadPreset } = useFilterPresets();

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = {
      ...localFilters.dateRange,
      [field]: value ? new Date(value) : null,
    } as DateRange;
    const updated = { ...localFilters, dateRange: newDateRange };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const handleAddOperator = () => {
    const newOperator: FilterOperator = {
      field: availableFields[0]?.value || '',
      operator: 'equals',
      value: '',
    };
    const updated = {
      ...localFilters,
      operators: [...(localFilters.operators || []), newOperator],
    };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const handleOperatorChange = (index: number, updates: Partial<FilterOperator>) => {
    const operators = [...(localFilters.operators || [])];
    operators[index] = { ...operators[index], ...updates };
    const updated = { ...localFilters, operators };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const handleRemoveOperator = (index: number) => {
    const operators = localFilters.operators?.filter((_, i) => i !== index) || [];
    const updated = { ...localFilters, operators };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const handleMultiSelectChange = (field: string, values: string[]) => {
    const multiSelects = {
      ...(localFilters.multiSelects || {}),
      [field]: values,
    };
    const updated = { ...localFilters, multiSelects };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const handleClearAll = () => {
    const cleared = {
      dateRange: { start: null, end: null },
      operators: [],
      multiSelects: {},
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const getFieldType = (fieldValue: string) => {
    return availableFields.find(f => f.value === fieldValue)?.type || 'text';
  };

  const getFieldOptions = (fieldValue: string) => {
    return availableFields.find(f => f.value === fieldValue)?.options || [];
  };

  const hasActiveFilters =
    (localFilters.dateRange?.start || localFilters.dateRange?.end) ||
    (localFilters.operators && localFilters.operators.length > 0) ||
    (localFilters.multiSelects && Object.values(localFilters.multiSelects).some(v => v.length > 0));

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 rounded-md border px-4 py-2 text-sm font-medium transition ${
          hasActiveFilters
            ? 'border-kubota-orange bg-orange-50 text-orange-900'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="h-4 w-4" />
        <span>Advanced Filters</span>
        {hasActiveFilters && (
          <span className="ml-1 rounded-full bg-kubota-orange px-2 py-0.5 text-xs text-white">
            {[
              localFilters.dateRange?.start || localFilters.dateRange?.end ? 1 : 0,
              localFilters.operators?.length || 0,
              Object.values(localFilters.multiSelects || {}).filter(v => v.length > 0).length,
            ].reduce((a, b) => a + b, 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
            <div className="flex items-center space-x-2">
              <FilterPresets
                presets={presets}
                currentFilters={{
                  ...localFilters,
                  dateRange: localFilters.dateRange ? {
                    start: localFilters.dateRange.start ? localFilters.dateRange.start.toISOString() : null,
                    end: localFilters.dateRange.end ? localFilters.dateRange.end.toISOString() : null,
                  } : undefined,
                }}
                onLoadPreset={(preset) => {
                  const loaded = loadPreset(preset);
                  const converted = {
                    ...loaded,
                    dateRange: loaded.dateRange ? {
                      start: loaded.dateRange.start ? new Date(loaded.dateRange.start) : null,
                      end: loaded.dateRange.end ? new Date(loaded.dateRange.end) : null,
                    } : undefined,
                  } as typeof localFilters;
                  setLocalFilters(converted);
                  onFiltersChange(converted);
                }}
                onSavePreset={(name, filters) => {
                  savePreset(name, filters);
                }}
                onDeletePreset={deletePreset}
              />
              {hasActiveFilters && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Date Range Picker */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <Calendar className="mr-1 inline h-4 w-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Start Date</label>
                  <input
                    type="date"
                    value={
                      localFilters.dateRange?.start
                        ? localFilters.dateRange.start.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={e => handleDateRangeChange('start', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">End Date</label>
                  <input
                    type="date"
                    value={
                      localFilters.dateRange?.end
                        ? localFilters.dateRange.end.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={e => handleDateRangeChange('end', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
                  />
                </div>
              </div>
            </div>

            {/* Multi-Select Filters */}
            {multiSelectFields.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Quick Filters
                </label>
                <div className="space-y-2">
                  {multiSelectFields.map(field => (
                    <div key={field.value}>
                      <label className="mb-1 block text-xs text-gray-600">{field.label}</label>
                      <select
                        multiple
                        value={localFilters.multiSelects?.[field.value] || []}
                        onChange={e => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          handleMultiSelectChange(field.value, selected);
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
                        size={Math.min(field.options.length, 4)}
                      >
                        {field.options.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Hold Ctrl/Cmd to select multiple
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Operators */}
            {availableFields.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Filters
                  </label>
                  <button
                    onClick={handleAddOperator}
                    className="text-xs text-kubota-orange hover:text-orange-600"
                  >
                    + Add Filter
                  </button>
                </div>
                <div className="space-y-2">
                  {localFilters.operators?.map((operator, index) => {
                    const fieldType = getFieldType(operator.field);
                    const fieldOptions = getFieldOptions(operator.field);
                    const operatorOptions = OPERATORS[fieldType] || OPERATORS.text;

                    return (
                      <div key={index} className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-2">
                        <select
                          value={operator.field}
                          onChange={e => handleOperatorChange(index, { field: e.target.value, value: '' })}
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
                        >
                          {availableFields.map(field => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={operator.operator}
                          onChange={e =>
                            handleOperatorChange(index, {
                              operator: e.target.value as FilterOperator['operator'],
                              value: '',
                            })
                          }
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
                        >
                          {operatorOptions.map(op => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>

                        {operator.operator === 'between' ? (
                          <div className="flex flex-1 items-center gap-2">
                            <input
                              type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
                              value={
                                Array.isArray(operator.value) ? operator.value[0] || '' : ''
                              }
                              onChange={e => {
                                const currentValue = Array.isArray(operator.value)
                                  ? operator.value
                                  : ['', ''];
                                handleOperatorChange(index, {
                                  value: [e.target.value, String(currentValue[1] || '')] as [string, string],
                                });
                              }}
                              className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
                              placeholder="From"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
                              value={
                                Array.isArray(operator.value) ? operator.value[1] || '' : ''
                              }
                              onChange={e => {
                                const currentValue = Array.isArray(operator.value)
                                  ? operator.value
                                  : ['', ''];
                                handleOperatorChange(index, {
                                  value: [String(currentValue[0] || ''), e.target.value] as [string, string],
                                });
                              }}
                              className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
                              placeholder="To"
                            />
                          </div>
                        ) : operator.operator === 'in' || operator.operator === 'not_in' ? (
                          <select
                            multiple
                            value={(Array.isArray(operator.value) && typeof operator.value[0] === 'string' ? operator.value : []) as string[]}
                            onChange={e => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              handleOperatorChange(index, { value: selected });
                            }}
                            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
                            size={Math.min(fieldOptions.length, 3)}
                          >
                            {fieldOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : fieldOptions.length > 0 ? (
                          <select
                            value={typeof operator.value === 'string' ? operator.value : ''}
                            onChange={e => handleOperatorChange(index, { value: e.target.value })}
                            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
                          >
                            <option value="">Select...</option>
                            {fieldOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
                            value={typeof operator.value === 'string' || typeof operator.value === 'number' ? String(operator.value) : ''}
                            onChange={e =>
                              handleOperatorChange(index, {
                                value: fieldType === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                              })
                            }
                            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
                            placeholder="Value"
                          />
                        )}

                        <button
                          onClick={() => handleRemoveOperator(index)}
                          className="text-gray-400 hover:text-red-600"
                          aria-label="Remove filter"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


