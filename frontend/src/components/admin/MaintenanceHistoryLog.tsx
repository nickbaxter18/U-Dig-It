'use client';

import { useAdminToast } from './AdminToastProvider';
import { fetchMaintenanceLogs, createMaintenanceLog } from '@/lib/api/admin/equipment';
import { Calendar, Clock, DollarSign, Plus, Wrench, User, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    fetchLogs();
  }, [equipmentId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchMaintenanceLogs(equipmentId);
      setLogs(data || []);
    } catch (error) {
      toast.error('Failed to load maintenance logs', error instanceof Error ? error.message : 'Unable to fetch maintenance history');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPart = () => {
    setFormData(prev => ({
      ...prev,
      parts: [...prev.parts, { partName: '', quantity: 1, costPerUnit: 0, supplier: '' }],
    }));
  };

  const handleRemovePart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }));
  };

  const handlePartChange = (index: number, field: keyof MaintenancePart, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => (i === index ? { ...part, [field]: value } : part)),
    }));
  };

  const calculateTotalCost = () => {
    const partsCost = formData.parts.reduce((sum, part) => sum + (part.quantity * part.costPerUnit), 0);
    const laborCost = parseFloat(formData.cost) || 0;
    return partsCost + laborCost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const totalCost = calculateTotalCost();

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
      await fetchLogs();
      onLogChange?.();
    } catch (error) {
      toast.error('Failed to create log', error instanceof Error ? error.message : 'Unable to save maintenance record');
    } finally {
      setSubmitting(false);
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-kubota-orange border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Maintenance History</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-md bg-kubota-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
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
            className="mt-4 text-sm text-kubota-orange hover:text-orange-600"
          >
            Add your first maintenance log
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const partsCost = (log.parts || []).reduce((sum: number, part: any) => {
              const costPerUnit = part.cost_per_unit || part.costPerUnit || 0;
              const quantity = part.quantity || 0;
              return sum + (quantity * costPerUnit);
            }, 0);
            const laborCost = (log.cost || 0) - partsCost;

            return (
              <div key={log.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getTypeIcon(log.maintenance_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 capitalize">{log.maintenance_type} Maintenance</h4>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(log.status)}`}>
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
                          <p className="mb-2 text-xs font-semibold text-gray-700 uppercase">Parts Used</p>
                          <div className="space-y-1">
                            {log.parts.map((part: any, idx) => {
                              const partName = part.part_name || part.partName || '';
                              const costPerUnit = part.cost_per_unit || part.costPerUnit || 0;
                              const quantity = part.quantity || 0;
                              return (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-700">
                                    {partName} × {quantity}
                                    {part.supplier && <span className="text-gray-500"> ({part.supplier})</span>}
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
                                <span className="font-medium text-gray-900">${laborCost.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {log.notes && (
                        <p className="mt-2 text-sm text-gray-600">{log.notes}</p>
                      )}

                      {log.next_due_at && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                          <Calendar className="h-3 w-3" />
                          <span>Next due: {new Date(log.next_due_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Maintenance Log</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Maintenance Type</label>
                  <select
                    value={formData.maintenanceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, maintenanceType: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, performedAt: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Technician</label>
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => setFormData(prev => ({ ...prev, technician: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Labor Cost (CAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Duration (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.durationHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, durationHours: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, nextDueAt: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Parts</label>
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="text-sm text-kubota-orange hover:text-orange-600"
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
                          onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="col-span-2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                          min="1"
                          required
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Cost"
                          value={part.costPerUnit}
                          onChange={(e) => handlePartChange(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Additional notes about this maintenance..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-kubota-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Log Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

