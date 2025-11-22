'use client';

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Plus,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';

import {
  createMaintenanceLog,
  deleteMaintenanceLog,
  fetchMaintenanceLogs,
  updateMaintenanceLog,
} from '@/lib/api/admin/equipment';

import { useAdminToast } from './AdminToastProvider';

interface MaintenancePart {
  id?: string;
  partName: string;
  quantity: number;
  costPerUnit: number;
  supplier?: string;
}

interface MaintenanceLog {
  id: string;
  equipment_id: string;
  maintenance_type: string;
  performed_at: string;
  technician?: string;
  notes?: string;
  cost?: number;
  duration_hours?: number;
  status: string;
  next_due_at?: string;
  documents?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  parts?: MaintenancePart[];
}

interface MaintenanceHistoryLogProps {
  equipmentId: string;
  onLogChange?: () => void;
}

export function MaintenanceHistoryLog({ equipmentId, onLogChange }: MaintenanceHistoryLogProps) {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const toast = useAdminToast();

  const [formData, setFormData] = useState({
    maintenanceType: 'routine',
    performedAt: new Date().toISOString().slice(0, 16),
    technician: '',
    notes: '',
    cost: '',
    durationHours: '',
    status: 'completed',
    nextDueAt: '',
    parts: [] as MaintenancePart[],
  });

  const fetchLogs = useCallback(async () => {
    if (!equipmentId) {
      setLoading(false);
      setLogs([]);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchMaintenanceLogs(equipmentId);

      if (!Array.isArray(data)) {
        console.warn('Maintenance logs API returned non-array data:', data);
        setLogs([]);
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch maintenance logs:', error);
      // Only show toast for real errors, not 404s (no logs yet)
      const errorMessage =
        error instanceof Error ? error.message : 'Unable to fetch maintenance history';
      if (!errorMessage.includes('404') && !errorMessage.includes('Not Found')) {
        toast.error('Failed to load maintenance logs', errorMessage);
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [equipmentId, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleAddPart = () => {
    setFormData((prev) => ({
      ...prev,
      parts: [...prev.parts, { partName: '', quantity: 1, costPerUnit: 0, supplier: '' }],
    }));
  };

  const handleRemovePart = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }));
  };

  const handlePartChange = (
    index: number,
    field: keyof MaintenancePart,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      parts: prev.parts.map((part, i) => (i === index ? { ...part, [field]: value } : part)),
    }));
  };

  const calculateTotalCost = () => {
    const partsCost = formData.parts.reduce(
      (sum, part) => sum + part.quantity * part.costPerUnit,
      0
    );
    const laborCost = parseFloat(formData.cost) || 0;
    return partsCost + laborCost;
  };

  const resetForm = () => {
    setFormData({
      maintenanceType: 'routine',
      performedAt: new Date().toISOString().slice(0, 16),
      technician: '',
      notes: '',
      cost: '',
      durationHours: '',
      status: 'completed',
      nextDueAt: '',
      parts: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const totalCost = calculateTotalCost();

      if (editingLog) {
        // Update existing log
        await updateMaintenanceLog(equipmentId, editingLog.id, {
          maintenanceType: formData.maintenanceType as 'repair' | 'inspection' | 'routine',
          performedAt: formData.performedAt,
          technician: formData.technician || undefined,
          notes: formData.notes || undefined,
          cost: totalCost > 0 ? totalCost : undefined,
          durationHours: formData.durationHours ? parseFloat(formData.durationHours) : undefined,
          status: formData.status as 'completed' | 'pending' | 'cancelled',
          nextDueAt: formData.nextDueAt || undefined,
        });

        toast.success('Maintenance log updated', 'Maintenance record updated successfully');
        setShowEditModal(false);
        setEditingLog(null);
      } else {
        // Create new log
        await createMaintenanceLog(equipmentId, {
          maintenanceType: formData.maintenanceType as 'repair' | 'inspection' | 'routine',
          performedAt: formData.performedAt,
          technician: formData.technician || undefined,
          notes: formData.notes || undefined,
          cost: totalCost > 0 ? totalCost : undefined,
          durationHours: formData.durationHours ? parseFloat(formData.durationHours) : undefined,
          status: formData.status as 'completed' | 'pending' | 'cancelled',
          nextDueAt: formData.nextDueAt || undefined,
          parts: formData.parts.length > 0 ? formData.parts : undefined,
        });

        toast.success('Maintenance log created', 'Maintenance record added successfully');
        setShowAddModal(false);
      }

      resetForm();
      await fetchLogs();
      onLogChange?.();
    } catch (error) {
      toast.error(
        editingLog ? 'Failed to update log' : 'Failed to create log',
        error instanceof Error ? error.message : 'Unable to save maintenance record'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (log: MaintenanceLog) => {
    setEditingLog(log);
    setFormData({
      maintenanceType: log.maintenance_type as 'routine' | 'repair' | 'inspection',
      performedAt: new Date(log.performed_at).toISOString().slice(0, 16),
      technician: log.technician || '',
      notes: log.notes || '',
      cost: log.cost?.toString() || '',
      durationHours: log.duration_hours?.toString() || '',
      status: log.status as 'completed' | 'pending' | 'cancelled',
      nextDueAt: log.next_due_at ? new Date(log.next_due_at).toISOString().slice(0, 16) : '',
      parts: (log.parts || []) as MaintenancePart[],
    });
    setShowEditModal(true);
  };

  const handleDelete = async (logId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this maintenance log? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeleting(logId);
    try {
      await deleteMaintenanceLog(equipmentId, logId);
      toast.success('Maintenance log deleted', 'Maintenance record removed successfully');
      await fetchLogs();
      onLogChange?.();
    } catch (error) {
      toast.error(
        'Failed to delete log',
        error instanceof Error ? error.message : 'Unable to delete maintenance record'
      );
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'preventive':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Wrench className="h-4 w-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-premium-gold border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Maintenance History</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Log Entry
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Wrench className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">No maintenance records yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-sm text-premium-gold hover:text-premium-gold-dark"
          >
            Add your first maintenance log
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const partsCost = (log.parts || []).reduce((sum: number, part: unknown) => {
              const costPerUnit = part.cost_per_unit || part.costPerUnit || 0;
              const quantity = part.quantity || 0;
              return sum + quantity * costPerUnit;
            }, 0);
            const laborCost = (log.cost || 0) - partsCost;

            return (
              <div
                key={log.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getTypeIcon(log.maintenance_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {log.maintenance_type} Maintenance
                        </h4>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(log.status)}`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(log.performed_at).toLocaleDateString()}</span>
                        </div>
                        {log.technician && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{log.technician}</span>
                          </div>
                        )}
                        {log.duration_hours && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{log.duration_hours} hours</span>
                          </div>
                        )}
                        {log.cost && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>${log.cost.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {log.parts && log.parts.length > 0 && (
                        <div className="mt-3 rounded-md bg-gray-50 p-3">
                          <p className="mb-2 text-xs font-semibold text-gray-700 uppercase">
                            Parts Used
                          </p>
                          <div className="space-y-1">
                            {log.parts.map((part: unknown, idx) => {
                              const partName = part.part_name || part.partName || '';
                              const costPerUnit = part.cost_per_unit || part.costPerUnit || 0;
                              const quantity = part.quantity || 0;
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-gray-700">
                                    {partName} × {quantity}
                                    {part.supplier && (
                                      <span className="text-gray-500"> ({part.supplier})</span>
                                    )}
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    ${(quantity * costPerUnit).toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                            {laborCost > 0 && (
                              <div className="flex items-center justify-between border-t border-gray-200 pt-1 text-xs">
                                <span className="text-gray-700">Labor</span>
                                <span className="font-medium text-gray-900">
                                  ${laborCost.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {log.notes && <p className="mt-2 text-sm text-gray-600">{log.notes}</p>}

                      {log.next_due_at && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                          <Calendar className="h-3 w-3" />
                          <span>Next due: {new Date(log.next_due_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(log)}
                      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
                      title="Edit maintenance log"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={deleting === log.id}
                      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                      title="Delete maintenance log"
                    >
                      {deleting === log.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Log Modal */}
      <AdminModal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setEditingLog(null);
          resetForm();
        }}
        title={editingLog ? 'Edit Maintenance Log' : 'Add Maintenance Log'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Maintenance Type
              </label>
              <select
                value={formData.maintenanceType}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, maintenanceType: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="routine">Routine</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Performed At</label>
              <input
                type="datetime-local"
                value={formData.performedAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, performedAt: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Technician</label>
              <input
                type="text"
                value={formData.technician}
                onChange={(e) => setFormData((prev) => ({ ...prev, technician: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Labor Cost (CAD)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Duration (hours)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.durationHours}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, durationHours: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Next Due Date</label>
            <input
              type="date"
              value={formData.nextDueAt}
              onChange={(e) => setFormData((prev) => ({ ...prev, nextDueAt: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Parts</label>
              <button
                type="button"
                onClick={handleAddPart}
                className="text-sm text-premium-gold hover:text-premium-gold-dark"
              >
                + Add Part
              </button>
            </div>
            {formData.parts.length > 0 && (
              <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
                {formData.parts.map((part, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Part name"
                      value={part.partName}
                      onChange={(e) => handlePartChange(index, 'partName', e.target.value)}
                      className="col-span-4 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={part.quantity}
                      onChange={(e) =>
                        handlePartChange(index, 'quantity', parseInt(e.target.value) || 0)
                      }
                      className="col-span-2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cost"
                      value={part.costPerUnit}
                      onChange={(e) =>
                        handlePartChange(index, 'costPerUnit', parseFloat(e.target.value) || 0)
                      }
                      className="col-span-2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Supplier"
                      value={part.supplier || ''}
                      onChange={(e) => handlePartChange(index, 'supplier', e.target.value)}
                      className="col-span-3 rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePart(index)}
                      className="col-span-1 text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="mt-2 border-t border-gray-200 pt-2 text-right text-sm font-semibold">
                  Total Cost: ${calculateTotalCost().toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              rows={3}
              placeholder="Additional notes about this maintenance..."
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setEditingLog(null);
                resetForm();
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:shadow-none"
            >
              {submitting
                ? editingLog
                  ? 'Updating...'
                  : 'Saving...'
                : editingLog
                  ? 'Update Log Entry'
                  : 'Save Log Entry'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
