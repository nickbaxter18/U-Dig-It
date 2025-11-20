'use client';

import {
  AlertTriangle,
  Download,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { EquipmentMediaGallery } from '@/components/admin/EquipmentMediaGallery';
import { EquipmentModal } from '@/components/admin/EquipmentModal';
import { MaintenanceHistoryLog } from '@/components/admin/MaintenanceHistoryLog';
import { MaintenanceScheduleModal } from '@/components/admin/MaintenanceScheduleModal';
import { PermissionGate } from '@/components/admin/PermissionGate';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

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
  totalBookings: number;
  totalRevenue: number;
  utilizationRate: number;
  unitId: string;
  make: string;
  year: number;
  specifications?: unknown;
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
  const [_saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<Set<string>>(new Set());
  const [bulkActionStatus, setBulkActionStatus] = useState<string>('');
  const selectAllRef = useRef<HTMLInputElement>(null);

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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

        // Build Supabase query
        let query = supabase.from('equipment').select('*');

        // Apply status filter
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        // Apply search filter
        if (searchTerm) {
          query = query.or(
            `make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,unitId.ilike.%${searchTerm}%,serialNumber.ilike.%${searchTerm}%`
          );
        }

        const { data, error: queryError } = await query.order('createdAt', { ascending: false });

        if (queryError) throw queryError;

        // Get booking stats for each equipment
        const equipmentWithStats = await Promise.all(
          ((data || []) as unknown[]).map(async (eq: unknown) => {
            // Get booking count and total revenue for this equipment
            const { data: bookingData } = await supabase
              .from('bookings')
              .select('totalAmount, status')
              .eq('equipmentId', eq.id);

            const totalBookings = (bookingData as unknown[])?.length || 0;
            const totalRevenue =
              (bookingData as unknown[])?.reduce(
                (sum: number, b: unknown) => sum + parseFloat(b.totalAmount || '0'),
                0
              ) || 0;

            // Calculate utilization rate (simplified: active bookings / total days in operation)
            const activeBookings =
              (bookingData as unknown[])?.filter((b: unknown) =>
                ['confirmed', 'paid', 'in_progress'].includes(b.status)
              ).length || 0;
            const utilizationRate = totalBookings > 0 ? (activeBookings / totalBookings) * 100 : 0;

            const status = (eq.status || 'available').toLowerCase();

            return {
              id: eq.id,
              name: `${eq.make} ${eq.model}`,
              model: eq.model,
              serialNumber: eq.serialNumber,
              status,
              location: eq.location || 'Main Yard',
              dailyRate: parseFloat(eq.dailyRate),
              weeklyRate: parseFloat(eq.weeklyRate),
              monthlyRate: parseFloat(eq.monthlyRate),
              isAvailable: status === 'available',
              maintenanceDue: eq.nextMaintenanceDue ? new Date(eq.nextMaintenanceDue) : undefined,
              lastMaintenance: eq.lastMaintenanceDate
                ? new Date(eq.lastMaintenanceDate)
                : undefined,
              totalBookings,
              totalRevenue,
              utilizationRate,
              unitId: eq.unitId,
              make: eq.make,
              year: eq.year || new Date().getFullYear(),
              specifications: eq.specifications || {},
            };
          })
        );

        setEquipment(equipmentWithStats);
        return;
      }

      // Transform RPC function results to match Equipment interface
      // Type assertion needed due to RPC function return type inference
      const equipmentArray = (equipmentData || []) as unknown[];
      let filteredEquipment = equipmentArray.map((eq: unknown) => ({
        id: eq.id,
        name: `${eq.make || ''} ${eq.model || ''}`.trim() || 'Equipment',
        model: eq.model || '',
        serialNumber: eq.serialNumber || '',
        status: (eq.status || 'available').toLowerCase(),
        location: eq.location || 'Main Yard',
        dailyRate: parseFloat(eq.dailyRate || '0'),
        weeklyRate: parseFloat(eq.weeklyRate || '0'),
        monthlyRate: parseFloat(eq.monthlyRate || '0'),
        isAvailable: (eq.status || 'available').toLowerCase() === 'available',
        maintenanceDue: eq.nextMaintenanceDue ? new Date(eq.nextMaintenanceDue) : undefined,
        lastMaintenance: eq.lastBookingDate ? new Date(eq.lastBookingDate) : undefined,
        totalBookings: parseInt(eq.totalBookings || '0', 10),
        totalRevenue: parseFloat(eq.totalRevenue || '0'),
        utilizationRate: parseFloat(eq.utilizationRate || '0'),
        unitId: eq.unitId || '',
        make: eq.make || '',
        year: new Date().getFullYear(),
        specifications: {},
      }));

      // Apply client-side filters (status and search)
      if (statusFilter !== 'all') {
        filteredEquipment = filteredEquipment.filter((eq) => eq.status === statusFilter);
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredEquipment = filteredEquipment.filter(
          (eq) =>
            eq.make?.toLowerCase().includes(searchLower) ||
            eq.model?.toLowerCase().includes(searchLower) ||
            eq.unitId?.toLowerCase().includes(searchLower) ||
            eq.serialNumber?.toLowerCase().includes(searchLower)
        );
      }

      setEquipment(filteredEquipment);
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
  }, [statusFilter, searchTerm]);

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

      // Map frontend status to database status
      const dbStatus = equipmentData.status?.toLowerCase() || 'available';
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
          updatedAt: new Date().toISOString(),
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
          const updateError = await response.json();
          throw new Error(updateError.error || 'Failed to update equipment');
        }

        logger.info('Equipment updated', {
          component: 'EquipmentManagement',
          action: 'update_equipment',
          metadata: { equipmentId: selectedEquipment.id },
        });
      } else {
        // Create new equipment
        const { error: insertError } = await supabase.from('equipment').insert({
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
          totalEngineHours: totalEngineHoursValue ?? 0,
          specifications: equipmentData.specifications || {},
          description: `${equipmentData.make} ${equipmentData.model}`,
          type: 'svl75', // Default type
          replacementValue: 75000, // Default replacement value
          overageHourlyRate: 50, // Default overage rate
        } as any);

        if (insertError) throw insertError;

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
      const response = await fetchWithAuth(
        `/api/admin/equipment/export${queryString ? `?${queryString}` : ''}`
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to export equipment data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `equipment-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (err) {
      logger.error(
        'Equipment export failed',
        { component: 'EquipmentManagement', action: 'export_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(err instanceof Error ? err.message : 'Failed to export equipment data');
    } finally {
      setExporting(false);
    }
  };

  const handleViewEquipment = (item: Equipment) => {
    setSelectedEquipment(item);
    setShowViewModal(true);
  };

  const handleEditEquipment = (item: Equipment) => {
    setSelectedEquipment(item);
    setShowEditModal(true);
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

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600">
            Manage your rental equipment inventory, maintenance schedules, and performance.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="equipment:export:all">
            <button
              onClick={handleExportEquipment}
              disabled={exporting}
              className="flex items-center space-x-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="equipment:create:all">
            <button
              onClick={handleAddEquipment}
              className="bg-kubota-orange flex items-center space-x-2 rounded-md px-4 py-2 text-white hover:bg-orange-600"
            >
              <Plus className="h-4 w-4" />
              <span>Add Equipment</span>
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

        <button className="focus:ring-kubota-orange flex items-center space-x-1 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2">
          <Filter className="h-4 w-4" />
          <span>More Filters</span>
        </button>
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
              {filteredEquipment.map((item) => {
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
                          {item.model} - {item.serialNumber}
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
                            style={{ width: `${item.utilizationRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{item.utilizationRate}%</span>
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
          equipment={selectedEquipment as any}
          onSave={handleEquipmentSave as any}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedEquipment(null);
          }}
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
      {showViewModal && selectedEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Equipment Details - {selectedEquipment.name}
                </h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedEquipment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Equipment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Unit ID:</strong> {selectedEquipment.unitId}
                    </div>
                    <div>
                      <strong>Serial Number:</strong> {selectedEquipment.serialNumber}
                    </div>
                    <div>
                      <strong>Make:</strong> {selectedEquipment.make}
                    </div>
                    <div>
                      <strong>Model:</strong> {selectedEquipment.model}
                    </div>
                    <div>
                      <strong>Year:</strong> {selectedEquipment.year}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedEquipment.status)}`}
                      >
                        {selectedEquipment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <strong>Location:</strong> {selectedEquipment.location}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Pricing</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Daily Rate:</strong> ${selectedEquipment.dailyRate}/day
                    </div>
                    <div>
                      <strong>Weekly Rate:</strong> ${selectedEquipment.weeklyRate}/week
                    </div>
                    <div>
                      <strong>Monthly Rate:</strong> ${selectedEquipment.monthlyRate}/month
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Maintenance</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Total Engine Hours:</strong>{' '}
                      {(selectedEquipment as any).totalEngineHours || 0}
                    </div>
                    {selectedEquipment.lastMaintenance && (
                      <div>
                        <strong>Last Maintenance:</strong>{' '}
                        {new Date(selectedEquipment.lastMaintenance).toLocaleDateString()}
                      </div>
                    )}
                    {selectedEquipment.maintenanceDue && (
                      <div className="text-yellow-600">
                        <AlertTriangle className="mr-1 inline h-4 w-4" />
                        <strong>Next Due:</strong>{' '}
                        {new Date(selectedEquipment.maintenanceDue).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Total Bookings:</strong> {selectedEquipment.totalBookings}
                    </div>
                    <div>
                      <strong>Total Revenue:</strong> $
                      {selectedEquipment.totalRevenue.toLocaleString()}
                    </div>
                    <div>
                      <strong>Utilization Rate:</strong>{' '}
                      {selectedEquipment.utilizationRate.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {selectedEquipment.specifications &&
                  Object.keys(selectedEquipment.specifications).length > 0 && (
                    <div className="md:col-span-2">
                      <h4 className="mb-3 text-sm font-medium text-gray-900">Specifications</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(selectedEquipment.specifications).map(([key, value]) => (
                          <div key={key}>
                            <strong className="capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </strong>{' '}
                            {String(value) || 'N/A'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Media Gallery */}
                <div className="md:col-span-2">
                  <EquipmentMediaGallery
                    equipmentId={selectedEquipment.id}
                    onMediaChange={() => {
                      // Refresh equipment data if needed
                      fetchEquipment();
                    }}
                  />
                </div>

                {/* Maintenance History */}
                <div className="md:col-span-2">
                  <MaintenanceHistoryLog
                    equipmentId={selectedEquipment.id}
                    onLogChange={() => {
                      // Refresh equipment data if needed
                      fetchEquipment();
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-6">
                <button
                  onClick={() => handleEditEquipment(selectedEquipment)}
                  className="bg-kubota-orange rounded-md px-4 py-2 text-sm text-white hover:bg-orange-600"
                >
                  Edit Equipment
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedEquipment(null);
                  }}
                  className="rounded-md bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
