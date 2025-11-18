'use client';

import { Bookmark, BookmarkCheck, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    dateRange?: { start: string | null; end: string | null };
    operators?: Array<{
      field: string;
      operator: string;
      value: string | string[] | number | [number, number] | [string, string];
    }>;
    multiSelects?: Record<string, string[]>;
  };
  createdAt: string;
}

interface FilterPresetsProps {
  presets: FilterPreset[];
  currentFilters: FilterPreset['filters'];
  onLoadPreset: (preset: FilterPreset) => void;
  onSavePreset: (name: string, filters: FilterPreset['filters']) => void;
  onDeletePreset: (presetId: string) => void;
  className?: string;
}

export function FilterPresets({
  presets,
  currentFilters,
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
  className = '',
}: FilterPresetsProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const handleSave = () => {
    if (!presetName.trim()) return;
    onSavePreset(presetName.trim(), currentFilters);
    setPresetName('');
    setShowSaveModal(false);
  };

  const hasActiveFilters =
    (currentFilters.dateRange?.start || currentFilters.dateRange?.end) ||
    (currentFilters.operators && currentFilters.operators.length > 0) ||
    (currentFilters.multiSelects && Object.values(currentFilters.multiSelects).some(v => v.length > 0));

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Bookmark className="h-4 w-4" />
          <span>Presets</span>
          {presets.length > 0 && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs">
              {presets.length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center space-x-2 rounded-md border border-kubota-orange bg-white px-3 py-1.5 text-sm font-medium text-kubota-orange hover:bg-orange-50"
          >
            <Save className="h-4 w-4" />
            <span>Save Preset</span>
          </button>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Save Filter Preset</h3>
            <button
              onClick={() => {
                setShowSaveModal(false);
                setPresetName('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            type="text"
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setShowSaveModal(false);
                setPresetName('');
              }
            }}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowSaveModal(false);
                setPresetName('');
              }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!presetName.trim()}
              className="rounded-md bg-kubota-orange px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Presets Dropdown */}
      {showPresets && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="max-h-96 overflow-y-auto p-2">
            {presets.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">
                No saved presets
              </div>
            ) : (
              <div className="space-y-1">
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className="group flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50"
                  >
                    <button
                      onClick={() => {
                        onLoadPreset(preset);
                        setShowPresets(false);
                      }}
                      className="flex flex-1 items-center space-x-2 text-left"
                    >
                      <BookmarkCheck className="h-4 w-4 text-kubota-orange" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{preset.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(preset.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => onDeletePreset(preset.id)}
                      className="opacity-0 text-red-600 hover:text-red-700 group-hover:opacity-100"
                      aria-label="Delete preset"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdowns */}
      {(showSaveModal || showPresets) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowSaveModal(false);
            setShowPresets(false);
          }}
        />
      )}
    </div>
  );
}

