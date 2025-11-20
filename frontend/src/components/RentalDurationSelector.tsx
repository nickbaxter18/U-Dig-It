'use client';

import type { Database } from '@/supabase/types';

import { useEffect, useState } from 'react';

type Equipment = Database['public']['Tables']['equipment']['Row'];

interface RentalDurationSelectorProps {
  equipment: Equipment;
  startDate: Date;
  endDate: Date;
  onDurationSelected: (option: PricingOption) => void;
  className?: string;
}

export interface PricingOption {
  type: 'hourly' | 'half-day' | 'daily' | 'weekly' | 'monthly';
  label: string;
  description: string;
  hours?: number;
  days?: number;
  rate: number;
  total: number;
  savings?: number;
  avgDailyRate?: number;
  recommended?: boolean;
}

export default function RentalDurationSelector({
  equipment,
  startDate,
  endDate,
  onDurationSelected,
  className = '',
}: RentalDurationSelectorProps) {
  const [options, setOptions] = useState<PricingOption[]>([]);
  const [selected, setSelected] = useState<PricingOption | null>(null);

  useEffect(() => {
    const calculated = calculatePricingOptions(equipment, startDate, endDate);
    setOptions(calculated);

    // Auto-select recommended option
    const recommended = calculated.find((opt) => opt.recommended);
    if (recommended && !selected) {
      setSelected(recommended);
      onDurationSelected(recommended);
    }
  }, [equipment, startDate, endDate, selected, onDurationSelected]);

  const handleSelect = (option: PricingOption) => {
    setSelected(option);
    onDurationSelected(option);
  };

  if (options.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Rental Duration</h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose the best pricing option for your rental period
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {options.map((option) => (
          <div
            key={option.type}
            onClick={() => handleSelect(option)}
            className={`
              relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
              ${
                selected?.type === option.type
                  ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200'
                  : 'border-gray-200 hover:border-orange-300 hover:shadow-sm'
              }
            `}
          >
            {/* Badges */}
            {option.recommended && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md z-10">
                RECOMMENDED
              </div>
            )}
            {option.savings && option.savings > 0 && (
              <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md">
                SAVE ${option.savings.toFixed(0)}
              </div>
            )}

            <div className="text-center">
              {/* Label */}
              <div className="font-bold text-lg text-gray-900 mb-1">{option.label}</div>

              {/* Description */}
              <div className="text-xs text-gray-600 mb-3">{option.description}</div>

              {/* Price */}
              <div className="mt-3">
                <div className="text-3xl font-bold text-gray-900">${option.total.toFixed(2)}</div>

                {/* Rate breakdown */}
                {option.hours && (
                  <div className="text-xs text-gray-500 mt-1">${option.rate.toFixed(2)}/hour</div>
                )}
                {option.days && option.avgDailyRate && (
                  <div className="text-xs text-gray-500 mt-1">
                    ${option.avgDailyRate.toFixed(2)}/day avg
                  </div>
                )}
              </div>

              {/* Savings highlight */}
              {option.savings && option.savings > 0 && (
                <div className="mt-2 text-xs font-semibold text-green-600 bg-green-100 rounded px-2 py-1">
                  Save ${option.savings.toFixed(2)}!
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pricing comparison tip */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          💡 Pricing Tip
        </h4>
        <div className="text-sm text-blue-800 space-y-1">
          {equipment.hourly_rate && (
            <div>
              • <strong>4-hour job?</strong> Hourly rate = ${(equipment.hourly_rate * 4).toFixed(2)}
            </div>
          )}
          {equipment.half_day_rate && equipment.hourly_rate && (
            <div>
              • <strong>6-hour job?</strong> Half-day saves $
              {(equipment.hourly_rate * 6 - equipment.half_day_rate).toFixed(2)} vs hourly!
            </div>
          )}
          {equipment.weeklyRate && equipment.dailyRate && (
            <div>
              • <strong>7+ days?</strong> Weekly saves $
              {(equipment.dailyRate * 7 - equipment.weeklyRate).toFixed(2)} vs daily!
            </div>
          )}
          {equipment.monthlyRate && equipment.dailyRate && (
            <div>
              • <strong>30+ days?</strong> Monthly saves $
              {(equipment.dailyRate * 30 - equipment.monthlyRate).toFixed(2)} vs daily!
            </div>
          )}
        </div>
      </div>

      {/* Selected duration summary */}
      {selected && (
        <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-900">Selected Duration:</div>
              <div className="text-lg font-bold text-gray-900">
                {selected.label} - ${selected.total.toFixed(2)}
              </div>
            </div>
            {selected.recommended && (
              <div className="text-sm text-green-700 font-medium">
                ✓ Best value for your rental period
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate all pricing options
function calculatePricingOptions(
  equipment: Equipment,
  startDate: Date,
  endDate: Date
): PricingOption[] {
  const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const daysDiff = Math.ceil(hoursDiff / 24);
  const options: PricingOption[] = [];

  // Hourly option (if rental < 8 hours and hourly rate exists)
  if (hoursDiff <= 8 && equipment.hourly_rate) {
    const minimumHours = equipment.minimum_rental_hours || 4;
    const hours = Math.max(Math.ceil(hoursDiff), minimumHours);

    options.push({
      type: 'hourly',
      label: 'Hourly',
      description: `${minimumHours}-hour minimum`,
      hours: hours,
      rate: equipment.hourly_rate,
      total: equipment.hourly_rate * hours,
      recommended: hoursDiff <= 4,
    });
  }

  // Half-day option (if rental is 4-8 hours and half-day rate exists)
  if (hoursDiff >= 4 && hoursDiff <= 8 && equipment.half_day_rate) {
    const hourlyEquivalent = equipment.hourly_rate ? equipment.hourly_rate * hoursDiff : 999999;

    options.push({
      type: 'half-day',
      label: 'Half-Day',
      description: '4-8 hours',
      hours: Math.ceil(hoursDiff),
      rate: equipment.half_day_rate,
      total: equipment.half_day_rate,
      savings:
        hourlyEquivalent > equipment.half_day_rate ? hourlyEquivalent - equipment.half_day_rate : 0,
      recommended: hoursDiff >= 5 && hoursDiff <= 8,
    });
  }

  // Daily option
  if (daysDiff < 7) {
    options.push({
      type: 'daily',
      label: 'Daily',
      description: `${daysDiff} ${daysDiff === 1 ? 'day' : 'days'}`,
      days: daysDiff,
      rate: equipment.dailyRate,
      total: equipment.dailyRate * daysDiff,
      avgDailyRate: equipment.dailyRate,
      recommended: daysDiff >= 1 && daysDiff < 7 && hoursDiff > 8,
    });
  }

  // Weekly option (if >= 7 days)
  if (daysDiff >= 7 && daysDiff < 30) {
    const weeks = Math.ceil(daysDiff / 7);
    const dailyEquivalent = equipment.dailyRate * daysDiff;
    const weeklyTotal = equipment.weeklyRate * weeks;

    options.push({
      type: 'weekly',
      label: 'Weekly',
      description: `${daysDiff} days`,
      days: daysDiff,
      rate: equipment.weeklyRate,
      total: weeklyTotal,
      savings: dailyEquivalent - weeklyTotal,
      avgDailyRate: weeklyTotal / daysDiff,
      recommended: daysDiff >= 7 && daysDiff < 30,
    });
  }

  // Monthly option (if >= 30 days)
  if (daysDiff >= 30) {
    const months = Math.ceil(daysDiff / 30);
    const dailyEquivalent = equipment.dailyRate * daysDiff;
    const monthlyTotal = equipment.monthlyRate * months;

    options.push({
      type: 'monthly',
      label: 'Monthly',
      description: `${daysDiff} days`,
      days: daysDiff,
      rate: equipment.monthlyRate,
      total: monthlyTotal,
      savings: dailyEquivalent - monthlyTotal,
      avgDailyRate: monthlyTotal / daysDiff,
      recommended: daysDiff >= 30,
    });
  }

  return options;
}
