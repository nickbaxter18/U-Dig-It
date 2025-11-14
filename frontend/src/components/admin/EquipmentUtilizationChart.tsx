'use client';

import type { UtilizationEquipmentRecord, UtilizationSummary } from '@/types/dashboard';

interface EquipmentUtilizationChartProps {
  summary: UtilizationSummary;
  records: UtilizationEquipmentRecord[];
  limit?: number;
  className?: string;
}

const statusLabels: Record<string, string> = {
  available: 'Available',
  rented: 'Rented',
  maintenance: 'Maintenance',
  reserved: 'Reserved',
  out_of_service: 'Out of Service',
  unavailable: 'Unavailable',
};

export default function EquipmentUtilizationChart({
  summary,
  records,
  limit = 6,
  className = '',
}: EquipmentUtilizationChartProps) {
  const displayRecords = records.slice(0, limit);

  if (displayRecords.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 text-sm md:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-gray-500">Average Utilization</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {summary.averageUtilization.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Units Active / Maintenance</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {summary.activeOrMaintenanceCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Lifetime Revenue</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            ${summary.lifetimeRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <ul className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        {displayRecords.map((record) => (
          <li key={record.equipmentId}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{record.label}</p>
                <p className="text-xs text-gray-500">
                  {statusLabels[record.status.toLowerCase()] ?? record.status.replace('_', ' ')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {record.utilizationPct.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">{record.rentedDays} rented days</p>
              </div>
            </div>
            <div
              className="mt-3 h-2 rounded-full bg-gray-100"
              role="presentation"
              aria-hidden="true"
            >
              <div
                className="h-2 rounded-full bg-kubota-orange transition-all duration-300"
                style={{ width: `${Math.min(record.utilizationPct, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>Total Revenue</span>
              <span>${record.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
