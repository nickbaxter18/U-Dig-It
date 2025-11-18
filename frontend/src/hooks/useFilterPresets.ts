'use client';

import { useEffect, useState } from 'react';
import { FilterPreset } from '@/components/admin/FilterPresets';

const PRESETS_STORAGE_KEY = 'admin_filter_presets';

export function useFilterPresets() {
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  useEffect(() => {
    // Load presets from localStorage
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error);
    }
  }, []);

  const savePreset = (name: string, filters: FilterPreset['filters']) => {
    const newPreset: FilterPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      filters: {
        dateRange: filters.dateRange
          ? {
              start: filters.dateRange.start ? new Date(filters.dateRange.start).toISOString() : null,
              end: filters.dateRange.end ? new Date(filters.dateRange.end).toISOString() : null,
            }
          : undefined,
        operators: filters.operators?.map(op => ({
          ...op,
          value: Array.isArray(op.value) ? op.value : String(op.value),
        })),
        multiSelects: filters.multiSelects,
      },
      createdAt: new Date().toISOString(),
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save filter preset:', error);
    }
  };

  const deletePreset = (presetId: string) => {
    const updated = presets.filter(p => p.id !== presetId);
    setPresets(updated);
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete filter preset:', error);
    }
  };

  const loadPreset = (preset: FilterPreset): FilterPreset['filters'] => {
    return {
      dateRange: preset.filters.dateRange || undefined,
      operators: preset.filters.operators,
      multiSelects: preset.filters.multiSelects,
    };
  };

  return {
    presets,
    savePreset,
    deletePreset,
    loadPreset,
  };
}

