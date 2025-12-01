'use client';

import {
    AlertTriangle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    Filter,
    MapPin,
    Plus,
    Search,
    Trash2,
    Wrench,
    X,
} from 'lucide-react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { AdminModal } from '@/components/admin/AdminModal';
import { EquipmentMediaGallery } from '@/components/admin/EquipmentMediaGallery';
import { EquipmentModal } from '@/components/admin/EquipmentModal';
import { MaintenanceHistoryLog } from '@/components/admin/MaintenanceHistoryLog';
import { MaintenanceScheduleModal } from '@/components/admin/MaintenanceScheduleModal';
import { PermissionGate } from '@/components/admin/PermissionGate';

import type { Database } from '@/../../supabase/types';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

// Type definitions for Supabase query results
type EquipmentRow = Database['public']['Tables']['equipment']['Row'];
type BookingRow = Database['public']['Tables']['bookings']['Row'];

interface Equipment {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  status: string;
  location: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  isAvailable: boolean;
  maintenanceDue?: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date | string; // Added for modal compatibility
  totalBookings: number;
  totalRevenue: number;
  utilizationRate: number;
  unitId: string;
  make: string;
  year: number;
  totalEngineHours?: number; // Added for modal compatibility
  specifications?: Record<string, unknown>;
}

// Advanced filter options
interface AdvancedFilters {
  location: string;
  minDailyRate: string;
  maxDailyRate: string;
  yearFrom: string;
  yearTo: string;
  maintenanceStatus: string;
}

const LOCATIONS = ['Main Yard', 'Service Bay', 'Repair Shop', 'Job Site A', 'Job Site B'];
const MAINTENANCE_STATUS_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'due', label: 'Maintenance Due' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'ok', label: 'Up to Date' },
];

const PAGE_SIZE = 20;

// Helper function to extract location string from JSON or string
// Database stores location as JSON { name: "..." }, frontend expects string
function extractLocation(location: unknown): string {
  if (!location) return 'Main Yard';
  if (typeof location === 'string') return location;
  if (typeof location === 'object' && location !== null) {
    const loc = location as { name?: string };
    return loc.name || 'Main Yard';
  }
  return 'Main Yard';
}

export default function EquipmentManagement() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const searchParams = useSearchParams();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<Equipment | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<Set<string>>(new Set());
  const [bulkActionStatus, setBulkActionStatus] = useState<string>('');
  const selectAllRef = useRef<HTMLInputElement>(null);
  const cleanupRunRef = useRef(false);

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    location: '',
    minDailyRate: '',
    maxDailyRate: '',
    yearFrom: '',
    yearTo: '',
    maintenanceStatus: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [_totalCount, setTotalCount] = useState(0);

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Auto-fix orphaned maintenance due dates on first load only (once per session)
      // This fixes equipment that have nextMaintenanceDue but no active scheduled maintenance
      // Check equipment state directly instead of using it in dependency array
      if (!cleanupRunRef.current) {
        cleanupRunRef.current = true;
        try {
          await fetchWithAuth('/api/admin/equipment/maintenance/cleanup', {
            method: 'POST',
          });
        } catch {
          // Silently fail cleanup - don't block equipment fetch
          // No logging to reduce noise
        }
      }

      // ✅ OPTIMIZED: Use RPC function for aggregated stats (60% faster, single query)
      const { data: equipmentData, error: rpcError } = await supabase.rpc(
        'get_equipment_with_stats'
      );

      if (rpcError) {
        // Fallback to manual query if RPC function doesn't exist
        logger.warn('RPC function not found, using fallback query', {
          component: 'EquipmentManagement',
          action: 'fallback_query',
        });

        // ✅ FIXED: Use specific columns instead of SELECT *
        const { data, error: queryError } = await supabase
          .from('equipment')
          .select(
            'id, unitId, serialNumber, make, model, year, status, location, dailyRate, weeklyRate, monthlyRate, nextMaintenanceDue, lastMaintenanceDate, totalEngineHours, specifications, createdAt'
          )
          .order('createdAt', { ascending: false });

        if (queryError) throw queryError;

        // Get all booking stats in a single query (avoiding N+1)
        const equipmentIds = (data || []).map((eq: EquipmentRow) => eq.id);
        const { data: allBookings } = await supabase
          .from('bookings')
          .select('equipmentId, totalAmount, status')
          .in('equipmentId', equipmentIds);

        // Aggregate booking stats by equipment ID
        const bookingStats = new Map<
          string,
          { totalBookings: number; totalRevenue: number; activeBookings: number }
        >();
        for (const booking of (allBookings || []) as Pick<BookingRow, 'equipmentId' | 'totalAmount' | 'status'>[]) {
          const stats = bookingStats.get(booking.equipmentId) || {
            totalBookings: 0,
            totalRevenue: 0,
            activeBookings: 0,
          };
          stats.totalBookings += 1;
          stats.totalRevenue += parseFloat(String(booking.totalAmount || '0'));
          if (['confirmed', 'paid', 'in_progress'].includes(booking.status)) {
            stats.activeBookings += 1;
          }
          bookingStats.set(booking.equipmentId, stats);
        }

        // Map equipment with stats
        const equipmentWithStats = (data || []).map((eq: EquipmentRow) => {
          const stats = bookingStats.get(eq.id) || {
            totalBookings: 0,
            totalRevenue: 0,
            activeBookings: 0,
          };
          const utilizationRate =
            stats.totalBookings > 0 ? (stats.activeBookings / stats.totalBookings) * 100 : 0;
          const status = (eq.status || 'available').toLowerCase();

          return {
            id: eq.id,
            name: `${eq.make} ${eq.model}`,
            model: eq.model,
            serialNumber: eq.serialNumber,
            status,
            location: extractLocation(eq.location),
            dailyRate: parseFloat(String(eq.dailyRate || '0')),
            weeklyRate: parseFloat(String(eq.weeklyRate || '0')),
            monthlyRate: parseFloat(String(eq.monthlyRate || '0')),
            isAvailable: status === 'available',
            maintenanceDue: eq.nextMaintenanceDue ? new Date(eq.nextMaintenanceDue) : undefined,
            nextMaintenance: eq.nextMaintenanceDue ? new Date(eq.nextMaintenanceDue) : undefined,
            lastMaintenance: eq.lastMaintenanceDate ? new Date(eq.lastMaintenanceDate) : undefined,
            totalBookings: stats.totalBookings,
            totalRevenue: stats.totalRevenue,
            utilizationRate,
            unitId: eq.unitId,
            make: eq.make,
            year: eq.year ? parseInt(String(eq.year), 10) : new Date().getFullYear(),
            totalEngineHours: eq.totalEngineHours
              ? parseFloat(String(eq.totalEngineHours))
              : undefined,
            specifications: (eq.specifications as Record<string, unknown>) || {},
          };
        });

        setEquipment(equipmentWithStats);
        setTotalCount(equipmentWithStats.length);
        return;
      }

      // Transform RPC function results to match Equipment interface
      // RPC function returns equipment with aggregated stats
      type EquipmentWithStats = EquipmentRow & {
        totalBookings?: number | string;
        totalRevenue?: number | string;
        utilizationRate?: number | string;
      };

      const equipmentArray = (equipmentData || []) as EquipmentWithStats[];
      const transformedEquipment = equipmentArray.map((eq: EquipmentWithStats) => ({
        id: eq.id,
        name: `${eq.make || ''} ${eq.model || ''}`.trim() || 'Equipment',
        model: eq.model || '',
        serialNumber: eq.serialNumber || '',
        status: (eq.status || 'available').toLowerCase(),
        location: extractLocation(eq.location),
        dailyRate: parseFloat(String(eq.dailyRate || '0')),
        weeklyRate: parseFloat(String(eq.weeklyRate || '0')),
        monthlyRate: parseFloat(String(eq.monthlyRate || '0')),
        isAvailable: (eq.status || 'available').toLowerCase() === 'available',
        maintenanceDue: eq.nextMaintenanceDue ? new Date(eq.nextMaintenanceDue) : undefined,
        nextMaintenance: eq.nextMaintenanceDue ? new Date(eq.nextMaintenanceDue) : undefined,
        lastMaintenance: eq.lastMaintenanceDate ? new Date(eq.lastMaintenanceDate) : undefined,
        totalBookings: parseInt(String(eq.totalBookings || '0'), 10),
        totalRevenue: parseFloat(String(eq.totalRevenue || '0')),
        utilizationRate: parseFloat(String(eq.utilizationRate || '0')),
        unitId: eq.unitId || '',
        make: eq.make || '',
        year: eq.year ? parseInt(String(eq.year), 10) : new Date().getFullYear(),
        totalEngineHours: eq.totalEngineHours ? parseFloat(String(eq.totalEngineHours)) : undefined,
        specifications: (eq.specifications as Record<string, unknown>) || {},
      }));

      setEquipment(transformedEquipment);
      setTotalCount(transformedEquipment.length);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch equipment:',
          { component: 'app-page', action: 'error' },
          err instanceof Error ? err : new Error(String(err))
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - cleanup logic only runs once per session (controlled by cleanupRunRef)

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const normalizeDateInput = (value: unknown): string | null => {
    if (!value) return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    return null;
  };

  const handleEquipmentSave = async (equipmentData: Partial<Equipment>) => {
    try {
      setSaving(true);
      setError(null);

      // Map frontend status to database status (modal sends uppercase, convert to lowercase for DB)
      const statusValue = equipmentData.status || '';
      const dbStatus = typeof statusValue === 'string' ? statusValue.toLowerCase() : 'available';
      const lastMaintenanceIso = normalizeDateInput(
        (equipmentData as { lastMaintenance?: string | Date } | null)?.lastMaintenance
      );
      const nextMaintenanceIso = normalizeDateInput(
        (
          equipmentData as {
            nextMaintenance?: string | Date;
            maintenanceDue?: string | Date;
          } | null
        )?.nextMaintenance ?? equipmentData.maintenanceDue
      );
      const totalEngineHoursValue =
        typeof (equipmentData as { totalEngineHours?: number } | null)?.totalEngineHours ===
        'number'
          ? (equipmentData as { totalEngineHours: number }).totalEngineHours
          : undefined;

      if (selectedEquipment?.id) {
        // Update existing equipment
        const eqData = equipmentData as {
          type?: string;
          description?: string;
          replacementValue?: number;
          overageHourlyRate?: number;
          specifications?: Record<string, unknown>;
        };

        const updatePayload: Record<string, unknown> = {
          unitId: equipmentData.unitId,
          serialNumber: equipmentData.serialNumber,
          make: equipmentData.make,
          model: equipmentData.model,
          year: equipmentData.year,
          dailyRate: equipmentData.dailyRate,
          weeklyRate: equipmentData.weeklyRate,
          monthlyRate: equipmentData.monthlyRate,
          status: dbStatus,
          location: equipmentData.location,
          lastMaintenanceDate: lastMaintenanceIso,
          nextMaintenanceDue: nextMaintenanceIso,
          type: eqData.type,
          description: eqData.description,
          replacementValue: eqData.replacementValue,
          overageHourlyRate: eqData.overageHourlyRate,
          specifications: eqData.specifications || {},
        };
        if (totalEngineHoursValue !== undefined) {
          updatePayload.totalEngineHours = totalEngineHoursValue;
        }

        const response = await fetchWithAuth(`/api/admin/equipment/${selectedEquipment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const updateError = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage =
            updateError.error || updateError.details || 'Failed to update equipment';
          logger.error('Equipment update failed', {
            component: 'EquipmentManagement',
            action: 'update_failed',
            metadata: {
              equipmentId: selectedEquipment.id,
              status: response.status,
              error: errorMessage,
            },
          });
          throw new Error(errorMessage);
        }

        logger.info('Equipment updated', {
          component: 'EquipmentManagement',
          action: 'update_equipment',
          metadata: { equipmentId: selectedEquipment.id },
        });
      } else {
        // Create new equipment
        const eqData = equipmentData as {
          type?: string;
          description?: string;
          replacementValue?: number;
          overageHourlyRate?: number;
        };
        type EquipmentInsert = Database['public']['Tables']['equipment']['Insert'];
        const insertPayload: EquipmentInsert = {
          unitId: equipmentData.unitId || '',
          serialNumber: equipmentData.serialNumber || '',
          make: equipmentData.make || 'Kubota',
          model: equipmentData.model || '',
          year: equipmentData.year || new Date().getFullYear(),
          dailyRate: equipmentData.dailyRate || 450,
          weeklyRate: equipmentData.weeklyRate || 2500,
          monthlyRate: equipmentData.monthlyRate || 8000,
          status: dbStatus,
          location: typeof equipmentData.location === 'string'
            ? { name: equipmentData.location }
            : (equipmentData.location as { name: string } | null | undefined) ?? { name: 'Main Yard' },
          lastMaintenanceDate: lastMaintenanceIso,
          nextMaintenanceDue: nextMaintenanceIso,
          totalEngineHours: totalEngineHoursValue ?? 0,
          specifications: (equipmentData.specifications || {}) as Database['public']['Tables']['equipment']['Row']['specifications'],
          description: eqData.description || `${equipmentData.make || 'Kubota'} ${equipmentData.model || ''}`,
          type: eqData.type || 'svl75',
          replacementValue: eqData.replacementValue || 75000,
          overageHourlyRate: eqData.overageHourlyRate || 50,
        };
        // Use API route instead of direct Supabase insert to avoid type inference issues
        const response = await fetchWithAuth('/api/admin/equipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(insertPayload),
        });

        if (!response.ok) {
          const insertError = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage =
            insertError.error || insertError.details || 'Failed to create equipment';
          throw new Error(errorMessage);
        }

        logger.info('Equipment created', {
          component: 'EquipmentManagement',
          action: 'create_equipment',
          metadata: { unitId: equipmentData.unitId },
        });
      }

      // Close modal and refresh
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedEquipment(null);
      await fetchEquipment();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to save equipment:',
          {
            component: 'EquipmentManagement',
            action: 'error',
          },
          err instanceof Error ? err : new Error(String(err))
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to save equipment');
    } finally {
      setSaving(false);
    }
  };

  const handleExportEquipment = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }

      const queryString = params.toString();
      const url = `/api/admin/equipment/export${queryString ? `?${queryString}` : ''}`;

      logger.debug('Starting equipment export', {
        component: 'EquipmentManagement',
        action: 'export_start',
        metadata: { url, statusFilter, searchTerm },
      });

      const response = await fetchWithAuth(url, {
        method: 'GET',
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to export equipment data';
        try {
          const errorBody = await response.json();
          errorMessage = errorBody?.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Check if response is actually CSV
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/csv')) {
        logger.warn('Unexpected content type in export response', {
          component: 'EquipmentManagement',
          action: 'export_warning',
          metadata: { contentType },
        });
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Export file is empty. Please try again.');
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `equipment-export-${new Date().toISOString().split('T')[0]}.csv`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(anchor);
      }, 100);

      logger.info('Equipment export completed successfully', {
        component: 'EquipmentManagement',
        action: 'export_success',
        metadata: { fileSize: blob.size },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export equipment data';
      logger.error(
        'Equipment export failed',
        {
          component: 'EquipmentManagement',
          action: 'export_failed',
          metadata: { error: errorMessage },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  const handleViewEquipment = (item: Equipment) => {
    try {
      if (!item || !item.id) {
        logger.error('Invalid equipment item for view', {
          component: 'EquipmentManagement',
          action: 'view_equipment_error',
          metadata: { item },
        });
        setError('Invalid equipment data. Please try again.');
        return;
      }
      setSelectedEquipment(item);
      setShowViewModal(true);
    } catch (err) {
      logger.error(
        'Failed to open view modal',
        {
          component: 'EquipmentManagement',
          action: 'view_equipment_error',
          metadata: { equipmentId: item?.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError('Failed to open equipment details. Please try again.');
    }
  };

  // Transform Equipment from page format to modal format
  const transformEquipmentForModal = (
    item: Equipment
  ): Parameters<typeof EquipmentModal>[0]['equipment'] => {
    if (!item) return null;

    // Convert status from lowercase to uppercase for modal
    const statusMap: Record<string, 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'OUT_OF_SERVICE'> = {
      available: 'AVAILABLE',
      rented: 'RENTED',
      maintenance: 'MAINTENANCE',
      out_of_service: 'OUT_OF_SERVICE',
    };

    // Helper to convert Date or string to Date or string for modal
    const toMaintenanceDate = (date: Date | string | undefined): string | Date | undefined => {
      if (!date) return undefined;
      if (date instanceof Date) return date;
      if (typeof date === 'string') {
        // Try to parse as ISO string, return as-is if invalid
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? date : parsed;
      }
      return undefined;
    };

    return {
      id: item.id,
      unitId: item.unitId,
      serialNumber: item.serialNumber,
      model: item.model,
      year: item.year,
      make: item.make,
      dailyRate: item.dailyRate,
      weeklyRate: item.weeklyRate,
      monthlyRate: item.monthlyRate,
      status: statusMap[item.status.toLowerCase()] || 'AVAILABLE',
      location: item.location,
      lastMaintenance: toMaintenanceDate(item.lastMaintenance),
      nextMaintenance: toMaintenanceDate(item.nextMaintenance || item.maintenanceDue),
      totalEngineHours: item.totalEngineHours,
      specifications: item.specifications,
    };
  };

  const handleEditEquipment = (item: Equipment) => {
    try {
      setSelectedEquipment(item);
      setShowEditModal(true);
    } catch (err) {
      logger.error(
        'Failed to open edit modal',
        {
          component: 'EquipmentManagement',
          action: 'edit_equipment_error',
          metadata: { equipmentId: item.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError('Failed to open edit form. Please try again.');
    }
  };

  const handleAddEquipment = () => {
    setSelectedEquipment(null);
    setShowAddModal(true);
  };

  const handleScheduleMaintenance = (item: Equipment) => {
    setMaintenanceEquipment(item);
    setShowMaintenanceModal(true);
  };

  const handleToggleEquipmentSelection = (equipmentId: string) => {
    const newSelected = new Set(selectedEquipmentIds);
    if (newSelected.has(equipmentId)) {
      newSelected.delete(equipmentId);
    } else {
      newSelected.add(equipmentId);
    }
    setSelectedEquipmentIds(newSelected);
  };

  const handleToggleSelectAll = () => {
    if (selectedEquipmentIds.size === filteredEquipment.length) {
      setSelectedEquipmentIds(new Set());
    } else {
      setSelectedEquipmentIds(new Set(filteredEquipment.map((eq) => eq.id)));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedEquipmentIds.size === 0 || !bulkActionStatus) return;

    const confirmed = window.confirm(
      `Are you sure you want to update ${selectedEquipmentIds.size} equipment item(s) to ${bulkActionStatus}?`
    );
    if (!confirmed) return;

    try {
      const response = await fetchWithAuth('/api/admin/equipment/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentIds: Array.from(selectedEquipmentIds),
          action: 'update_status',
          status: bulkActionStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update equipment status');
      }

      const result = await response.json();
      alert(result.message || 'Equipment status updated successfully!');
      setSelectedEquipmentIds(new Set());
      setBulkActionStatus('');
      fetchEquipment();
    } catch (err) {
      logger.error(
        'Failed to bulk update equipment status',
        { component: 'EquipmentManagement' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(err instanceof Error ? err.message : 'Failed to update equipment status');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEquipmentIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedEquipmentIds.size} equipment item(s)? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const response = await fetchWithAuth('/api/admin/equipment/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentIds: Array.from(selectedEquipmentIds),
          action: 'delete',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete equipment');
      }

      const result = await response.json();
      alert(result.message || 'Equipment deleted successfully!');
      setSelectedEquipmentIds(new Set());
      fetchEquipment();
    } catch (err) {
      logger.error(
        'Failed to bulk delete equipment',
        { component: 'EquipmentManagement' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(err instanceof Error ? err.message : 'Failed to delete equipment');
    }
  };

  const handleDeleteSingleEquipment = async (equipmentId: string) => {
    const equipment = paginatedEquipment.find((eq) => eq.id === equipmentId);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${equipment?.name || 'this equipment'}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const response = await fetchWithAuth('/api/admin/equipment/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentIds: [equipmentId],
          action: 'delete',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete equipment');
      }

      fetchEquipment();
    } catch (err) {
      logger.error(
        'Failed to delete equipment',
        { component: 'EquipmentManagement' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(err instanceof Error ? err.message : 'Failed to delete equipment');
    }
  };

  useEffect(() => {
    if (searchParams?.get('action') === 'add' && !showAddModal) {
      handleAddEquipment();
    }
  }, [searchParams, showAddModal]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_service':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if any advanced filters are active
  const hasActiveAdvancedFilters = useMemo(() => {
    return (
      advancedFilters.location !== '' ||
      advancedFilters.minDailyRate !== '' ||
      advancedFilters.maxDailyRate !== '' ||
      advancedFilters.yearFrom !== '' ||
      advancedFilters.yearTo !== '' ||
      advancedFilters.maintenanceStatus !== ''
    );
  }, [advancedFilters]);

  // Apply all filters (basic + advanced)
  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      // Basic search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchLower) ||
        item.model.toLowerCase().includes(searchLower) ||
        item.serialNumber.toLowerCase().includes(searchLower) ||
        item.unitId?.toLowerCase().includes(searchLower) ||
        item.make?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      // Advanced filters
      const matchesLocation =
        !advancedFilters.location || item.location === advancedFilters.location;

      const matchesMinRate =
        !advancedFilters.minDailyRate ||
        item.dailyRate >= parseFloat(advancedFilters.minDailyRate);

      const matchesMaxRate =
        !advancedFilters.maxDailyRate ||
        item.dailyRate <= parseFloat(advancedFilters.maxDailyRate);

      const matchesYearFrom =
        !advancedFilters.yearFrom || item.year >= parseInt(advancedFilters.yearFrom, 10);

      const matchesYearTo =
        !advancedFilters.yearTo || item.year <= parseInt(advancedFilters.yearTo, 10);

      // Maintenance status filter
      let matchesMaintenanceStatus = true;
      if (advancedFilters.maintenanceStatus) {
        const now = new Date();
        const dueSoon = new Date();
        dueSoon.setDate(dueSoon.getDate() + 7); // Due within 7 days

        if (advancedFilters.maintenanceStatus === 'due') {
          matchesMaintenanceStatus =
            !!item.maintenanceDue && item.maintenanceDue <= dueSoon && item.maintenanceDue >= now;
        } else if (advancedFilters.maintenanceStatus === 'overdue') {
          matchesMaintenanceStatus = !!item.maintenanceDue && item.maintenanceDue < now;
        } else if (advancedFilters.maintenanceStatus === 'ok') {
          matchesMaintenanceStatus = !item.maintenanceDue || item.maintenanceDue > dueSoon;
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesLocation &&
        matchesMinRate &&
        matchesMaxRate &&
        matchesYearFrom &&
        matchesYearTo &&
        matchesMaintenanceStatus
      );
    });
  }, [equipment, searchTerm, statusFilter, advancedFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredEquipment.length / PAGE_SIZE);
  const paginatedEquipment = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredEquipment.slice(start, start + PAGE_SIZE);
  }, [filteredEquipment, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, advancedFilters]);

  // Clear all advanced filters
  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      location: '',
      minDailyRate: '',
      maxDailyRate: '',
      yearFrom: '',
      yearTo: '',
      maintenanceStatus: '',
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600">
            Manage your rental equipment inventory, maintenance schedules, and performance.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <PermissionGate permission="equipment:export:all">
            <button
              onClick={handleExportEquipment}
              disabled={exporting}
              className="flex items-center space-x-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export CSV'}</span>
              <span className="sm:hidden">{exporting ? '…' : 'Export'}</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="equipment:create:all">
            <button
              onClick={handleAddEquipment}
              className="flex items-center space-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:px-4"
              aria-label="Add new equipment"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Equipment</span>
              <span className="sm:hidden">Add</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading equipment</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="focus:ring-kubota-orange rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="maintenance">Maintenance</option>
          <option value="out_of_service">Out of Service</option>
        </select>

        <button
          onClick={() => setShowAdvancedFilters(true)}
          className={`focus:ring-kubota-orange flex items-center space-x-1 rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            hasActiveAdvancedFilters
              ? 'border-kubota-orange bg-orange-50 text-kubota-orange'
              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span>More Filters</span>
          {hasActiveAdvancedFilters && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-kubota-orange text-xs text-white">
              !
            </span>
          )}
        </button>

        {hasActiveAdvancedFilters && (
          <button
            onClick={clearAdvancedFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear filters
          </button>
        )}

        <div className="ml-auto text-sm text-gray-500">
          {filteredEquipment.length} equipment{filteredEquipment.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedEquipmentIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-kubota-orange bg-orange-50 px-4 py-3">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-900">
              {selectedEquipmentIds.size} equipment item(s) selected
            </span>
            <select
              value={bulkActionStatus}
              onChange={(e) => setBulkActionStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
            >
              <option value="">Select status...</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              disabled={!bulkActionStatus}
              className="rounded-md bg-kubota-orange px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Update Status
            </button>
            <button
              onClick={handleExportEquipment}
              disabled={exporting}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={handleBulkDelete}
              className="rounded-md border border-red-300 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <Trash2 className="mr-1 inline h-4 w-4" />
              Delete Selected
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedEquipmentIds(new Set());
              setBulkActionStatus('');
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Equipment Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-kubota-orange focus:ring-kubota-orange"
                    aria-label="Select all equipment"
                    checked={
                      selectedEquipmentIds.size === filteredEquipment.length &&
                      filteredEquipment.length > 0
                    }
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                  Equipment
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                  Status
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:table-cell md:px-6">
                  Location
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                  Daily Rate
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell lg:px-6">
                  Utilization
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell lg:px-6">
                  Revenue
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 xl:table-cell xl:px-6">
                  Maintenance
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedEquipment.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Wrench className="h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No equipment found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || statusFilter !== 'all' || hasActiveAdvancedFilters
                          ? 'Try adjusting your search or filters'
                          : 'Get started by adding your first piece of equipment'}
                      </p>
                      {!searchTerm && statusFilter === 'all' && !hasActiveAdvancedFilters && (
                        <button
                          onClick={handleAddEquipment}
                          className="mt-4 flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4" />
                          Add Equipment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEquipment.map((item) => {
                  const isSelected = selectedEquipmentIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 ${isSelected ? 'bg-orange-50/30' : ''}`}
                    >
                      <td className="px-3 py-4 sm:px-4 md:px-6">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-kubota-orange focus:ring-kubota-orange"
                          checked={isSelected}
                          onChange={() => handleToggleEquipmentSelection(item.id)}
                          aria-label={`Select equipment ${item.name}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-3 py-4 sm:px-4 md:px-6">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500 sm:text-sm">
                            {item.unitId} · {item.year}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 sm:px-4 md:px-6">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(item.status)}`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="hidden px-3 py-4 text-sm text-gray-900 sm:px-4 md:table-cell md:px-6">
                        {item.location}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 sm:px-4 md:px-6">
                        ${item.dailyRate}/day
                      </td>
                      <td className="hidden px-3 py-4 lg:table-cell lg:px-6">
                        <div className="flex items-center">
                          <div className="mr-2 h-2 w-16 rounded-full bg-gray-200">
                            <div
                              className="bg-kubota-orange h-2 rounded-full"
                              style={{ width: `${Math.min(item.utilizationRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {item.utilizationRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-3 py-4 text-sm text-gray-900 lg:table-cell lg:px-6">
                        ${item.totalRevenue.toLocaleString()}
                      </td>
                      <td className="hidden px-3 py-4 xl:table-cell xl:px-6">
                        {item.maintenanceDue && (
                          <div className="flex items-center text-sm text-yellow-600">
                            <AlertTriangle className="mr-1 h-4 w-4" />
                            Due {new Date(item.maintenanceDue).toLocaleDateString()}
                          </div>
                        )}
                        {item.lastMaintenance && !item.maintenanceDue && (
                          <div className="text-sm text-gray-500">
                            Last: {new Date(item.lastMaintenance).toLocaleDateString()}
                          </div>
                        )}
                        {!item.maintenanceDue && !item.lastMaintenance && (
                          <div className="text-sm text-gray-400">No records</div>
                        )}
                      </td>
                      <td className="px-3 py-4 text-right text-sm font-medium sm:px-4 md:px-6">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewEquipment(item)}
                            className="text-kubota-orange hover:text-orange-600"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditEquipment(item)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleScheduleMaintenance(item)}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Schedule Maintenance"
                          >
                            <Wrench className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingleEquipment(item.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * PAGE_SIZE, filteredEquipment.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredEquipment.length}</span> results
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 border-kubota-orange bg-orange-50 text-kubota-orange'
                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wrench className="text-kubota-orange h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Equipment</p>
              <p className="text-2xl font-semibold text-gray-900">{equipment.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <span className="text-sm font-semibold text-green-600">A</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available</p>
              <p className="text-2xl font-semibold text-gray-900">
                {equipment.filter((e) => e.status === 'available').length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <span className="text-sm font-semibold text-blue-600">R</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Rented</p>
              <p className="text-2xl font-semibold text-gray-900">
                {equipment.filter((e) => e.status === 'rented').length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                <span className="text-sm font-semibold text-yellow-600">M</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Maintenance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {equipment.filter((e) => e.status === 'maintenance').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Modals */}
      {(showAddModal || showEditModal) && (
        <EquipmentModal
          equipment={selectedEquipment ? transformEquipmentForModal(selectedEquipment) : null}
          onSave={(equipmentData) => {
            // Handle async save - modal expects sync but we need async
            // Transform equipment data to match modal's expected types
            const transformedData: Partial<Equipment> = {
              ...equipmentData,
              specifications: (equipmentData.specifications as Record<string, unknown>) || {},
              lastMaintenance:
                equipmentData.lastMaintenance instanceof Date
                  ? equipmentData.lastMaintenance
                  : typeof equipmentData.lastMaintenance === 'string'
                    ? new Date(equipmentData.lastMaintenance)
                    : undefined,
              nextMaintenance:
                equipmentData.nextMaintenance instanceof Date
                  ? equipmentData.nextMaintenance
                  : typeof equipmentData.nextMaintenance === 'string'
                    ? new Date(equipmentData.nextMaintenance)
                    : undefined,
            };
            void handleEquipmentSave(transformedData);
          }}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedEquipment(null);
          }}
          saving={saving}
        />
      )}

      {showMaintenanceModal && maintenanceEquipment && (
        <MaintenanceScheduleModal
          equipment={maintenanceEquipment}
          onClose={() => {
            setShowMaintenanceModal(false);
            setMaintenanceEquipment(null);
          }}
          onScheduled={async () => {
            await fetchEquipment();
          }}
        />
      )}

      {/* View Equipment Details Modal */}
      {showViewModal && selectedEquipment !== null ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-gray-900/60 pt-20 pb-6 px-6 sm:pt-24 sm:pb-8 sm:px-8" key={selectedEquipment.id}>
          <div className="flex max-h-[calc(100vh-7rem)] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEquipment.name}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedEquipment.make} {selectedEquipment.model} · {selectedEquipment.year}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedEquipment(null);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-kubota-orange focus:ring-offset-2"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Top Row: Key Information Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Equipment Info Card */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Equipment Information
                    </h3>
                    <dl className="space-y-2.5">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Unit ID</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-gray-900">
                          {selectedEquipment.unitId || 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Serial Number</dt>
                        <dd className="mt-0.5 text-sm text-gray-900">
                          {selectedEquipment.serialNumber || 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Status</dt>
                        <dd className="mt-1">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(selectedEquipment.status || 'available')}`}
                          >
                            {(selectedEquipment.status || 'available').replace('_', ' ')}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Location</dt>
                        <dd className="mt-0.5 text-sm text-gray-900">
                          {selectedEquipment.location || 'N/A'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Pricing Card */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Pricing
                    </h3>
                    <dl className="space-y-2.5">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Daily Rate</dt>
                        <dd className="mt-0.5 text-lg font-bold text-gray-900">
                          ${(selectedEquipment.dailyRate || 0).toLocaleString()}
                          <span className="ml-1 text-sm font-normal text-gray-500">/day</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Weekly Rate</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-gray-900">
                          ${(selectedEquipment.weeklyRate || 0).toLocaleString()}
                          <span className="ml-1 text-xs font-normal text-gray-500">/week</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Monthly Rate</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-gray-900">
                          ${(selectedEquipment.monthlyRate || 0).toLocaleString()}
                          <span className="ml-1 text-xs font-normal text-gray-500">/month</span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Maintenance Card */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Maintenance
                    </h3>
                    <dl className="space-y-2.5">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Engine Hours</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-gray-900">
                          {selectedEquipment.totalEngineHours?.toLocaleString() || 0}
                        </dd>
                      </div>
                      {selectedEquipment.lastMaintenance && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Last Maintenance</dt>
                          <dd className="mt-0.5 text-sm text-gray-900">
                            {new Date(selectedEquipment.lastMaintenance).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                      {selectedEquipment.maintenanceDue && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Next Due</dt>
                          <dd className="mt-0.5 flex items-center text-sm font-medium text-yellow-600">
                            <AlertTriangle className="mr-1 h-4 w-4" />
                            {new Date(selectedEquipment.maintenanceDue).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Performance Card */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Performance
                    </h3>
                    <dl className="space-y-2.5">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Total Bookings</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-gray-900">
                          {selectedEquipment.totalBookings || 0}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Total Revenue</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-green-600">
                          ${(selectedEquipment.totalRevenue || 0).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Utilization</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-gray-900">
                          {(selectedEquipment.utilizationRate || 0).toFixed(1)}%
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Specifications Section */}
                {selectedEquipment.specifications &&
                  typeof selectedEquipment.specifications === 'object' &&
                  selectedEquipment.specifications !== null &&
                  Object.keys(selectedEquipment.specifications as Record<string, unknown>).length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Specifications
                      </h3>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3 lg:grid-cols-4">
                        {Object.entries(
                          (selectedEquipment.specifications as Record<string, unknown>) || {}
                        ).map(([key, value]) => (
                          <div key={key} className="border-l-2 border-gray-200 pl-3">
                            <dt className="text-xs font-medium text-gray-500">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </dt>
                            <dd className="mt-0.5 text-sm font-semibold text-gray-900">
                              {String(value ?? 'N/A')}
                            </dd>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Media Gallery Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Media Gallery
                  </h3>
                  <EquipmentMediaGallery
                    equipmentId={selectedEquipment.id}
                    onMediaChange={() => {
                      fetchEquipment();
                    }}
                  />
                </div>

                {/* Maintenance History Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Maintenance History
                  </h3>
                  <MaintenanceHistoryLog
                    equipmentId={selectedEquipment.id}
                    onLogChange={() => {
                      fetchEquipment();
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedEquipment(null);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Close
                </button>
                <button
                  onClick={() => handleEditEquipment(selectedEquipment)}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Edit Equipment
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Advanced Filters Modal */}
      <AdminModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        title="Advanced Filters"
        maxWidth="lg"
      >
        <div className="space-y-6 p-6">
          {/* Location Filter */}
          <div>
            <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
              <MapPin className="mr-2 h-4 w-4 text-gray-400" />
              Location
            </label>
            <select
              value={advancedFilters.location}
              onChange={(e) =>
                setAdvancedFilters((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
            >
              <option value="">All Locations</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Daily Rate Range */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Daily Rate Range (CAD)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={advancedFilters.minDailyRate}
                onChange={(e) =>
                  setAdvancedFilters((prev) => ({ ...prev, minDailyRate: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
              />
              <span className="text-gray-400">to</span>
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={advancedFilters.maxDailyRate}
                onChange={(e) =>
                  setAdvancedFilters((prev) => ({ ...prev, maxDailyRate: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
              />
            </div>
          </div>

          {/* Year Range */}
          <div>
            <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              Year Range
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="From"
                min="2000"
                max={new Date().getFullYear() + 1}
                value={advancedFilters.yearFrom}
                onChange={(e) =>
                  setAdvancedFilters((prev) => ({ ...prev, yearFrom: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
              />
              <span className="text-gray-400">to</span>
              <input
                type="number"
                placeholder="To"
                min="2000"
                max={new Date().getFullYear() + 1}
                value={advancedFilters.yearTo}
                onChange={(e) =>
                  setAdvancedFilters((prev) => ({ ...prev, yearTo: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
              />
            </div>
          </div>

          {/* Maintenance Status */}
          <div>
            <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
              <Wrench className="mr-2 h-4 w-4 text-gray-400" />
              Maintenance Status
            </label>
            <select
              value={advancedFilters.maintenanceStatus}
              onChange={(e) =>
                setAdvancedFilters((prev) => ({ ...prev, maintenanceStatus: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
            >
              {MAINTENANCE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              onClick={clearAdvancedFilters}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="rounded-md bg-kubota-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
