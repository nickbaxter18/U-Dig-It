'use client';

import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

type EquipmentStatusKey =
  | 'AVAILABLE'
  | 'RENTED'
  | 'MAINTENANCE'
  | 'UNAVAILABLE'
  | 'RESERVED'
  | 'OUT_OF_SERVICE';

interface EquipmentItem {
  id: string;
  unitId: string;
  model: string;
  status: EquipmentStatusKey;
  location: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
}

const statusConfig: Record<
  EquipmentStatusKey,
  { icon: typeof CheckCircle; color: string; bgColor: string; label: string }
> = {
  AVAILABLE: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    label: 'Available',
  },
  RENTED: {
    icon: AlertTriangle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    label: 'Rented',
  },
  MAINTENANCE: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    label: 'Maintenance',
  },
  RESERVED: {
    icon: AlertTriangle,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    label: 'Reserved',
  },
  UNAVAILABLE: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    label: 'Unavailable',
  },
  OUT_OF_SERVICE: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    label: 'Out of Service',
  },
};

export function EquipmentStatus() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipment();

    // MIGRATED: Subscribe to real-time equipment updates
    const channel = supabase
      .channel('equipment-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment',
        },
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            logger.debug('[EquipmentStatus] Equipment change detected:', {
              component: 'EquipmentStatus',
              action: 'debug',
              metadata: { payload },
            });
          }
          fetchEquipment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);

      // MIGRATED: Fetch equipment from Supabase
      const { data, error } = await supabase
        .from('equipment')
        .select('id, unitId, model, status, location, lastMaintenanceDate, nextMaintenanceDue')
        .order('unitId', { ascending: true });

      if (error) throw error;

      // Transform Supabase data to component format
      const equipmentData: unknown[] = data || [];
      const transformed: EquipmentItem[] = equipmentData.map((eq: unknown) => {
        const rawStatus = (eq.status || 'unavailable').toString().toUpperCase();
        const normalizedStatus: EquipmentStatusKey = (
          statusConfig[rawStatus as EquipmentStatusKey] ? rawStatus : 'UNAVAILABLE'
        ) as EquipmentStatusKey;

        return {
          id: eq.id,
          unitId: eq.unitId,
          model: eq.model,
          status: normalizedStatus,
          location: (eq.location as any)?.name || eq.location || 'Main Yard',
          lastMaintenance: eq.lastMaintenanceDate || undefined,
          nextMaintenance: eq.nextMaintenanceDue || undefined,
        };
      });

      setEquipment(transformed);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch equipment status:',
          {
            component: 'EquipmentStatus',
            action: 'error',
          },
          error instanceof Error ? error : new Error(String(error))
        );
      }
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="border-kubota-orange h-6 w-6 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  // Calculate status counts
  const statusCounts = equipment.reduce(
    (acc: unknown, item: unknown) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      {/* Status summary */}
      <div className="grid grid-cols-2 gap-4">
        {(Object.keys(statusConfig) as EquipmentStatusKey[]).map((status) => {
          const config = statusConfig[status];
          const count = statusCounts[status] || 0;
          const Icon = config.icon;

          return (
            <div key={status} className="flex items-center rounded-lg bg-gray-50 p-3">
              <div className={`rounded-full p-2 ${config.bgColor}`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{config.label}</p>
                <p className="text-lg font-semibold text-gray-900">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Equipment list */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900">Equipment Details</h4>
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {equipment.map((item) => {
            const config = statusConfig[item.status] ?? statusConfig.UNAVAILABLE;
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="flex items-center">
                  <div className={`rounded-full p-1 ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{item.unitId}</p>
                    <p className="text-xs text-gray-500">{item.model}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{item.location}</p>
                  {item.nextMaintenance && (
                    <p className="text-xs text-gray-400">
                      Next: {new Date(item.nextMaintenance).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
