'use client';

import { Calendar, CheckCircle, Clock, Edit, Loader2, Trash2, X } from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';

import { cancelScheduledMaintenance, updateScheduledMaintenance } from '@/lib/api/admin/equipment';
import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

const maintenanceTypeOptions = [
  { value: 'preventive', label: 'Preventive' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'repair', label: 'Repair' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'inspection', label: 'Inspection' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';

interface MaintenanceRecord {
  id: string;
  title: string;
  maintenanceType: string;
  priority: string;
  status: MaintenanceStatus;
  scheduledDate: string;
  performedBy?: string | null;
  cost?: number | null;
  nextDueDate?: string | null;
  description?: string | null;
  notes?: string | null;
  nextDueHours?: number | null;
}

interface MaintenanceScheduleModalProps {
  equipment: {
    id: string;
    name: string;
    unitId: string;
    maintenanceDue?: Date;
    lastMaintenance?: Date;
  };
  onClose: () => void;
  onScheduled?: () => Promise<void> | void;
}

const statusStyles: Record<MaintenanceStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-700',
  overdue: 'bg-red-100 text-red-800',
};

function toDateInputValue(date: Date | undefined, includeTime = false) {
  if (!date) return '';
  if (Number.isNaN(date.getTime())) return '';
  if (includeTime) {
    return `${date.toISOString().slice(0, 16)}`;
  }
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string | undefined | null) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function MaintenanceScheduleModal({
  equipment,
  onClose,
  onScheduled,
}: MaintenanceScheduleModalProps) {
  const [scheduledDate, setScheduledDate] = useState(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 1);
    defaultDate.setHours(9, 0, 0, 0);
    return toDateInputValue(defaultDate, true);
  });
  const [maintenanceType, setMaintenanceType] = useState('preventive');
  const [priority, setPriority] = useState('medium');
  const [title, setTitle] = useState(() => `${equipment.name} maintenance`);
  const [description, setDescription] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [cost, setCost] = useState('');
  const [nextDueDate, setNextDueDate] = useState(() => toDateInputValue(equipment.maintenanceDue));
  const [nextDueHours, setNextDueHours] = useState('');
  const [notes, setNotes] = useState('');
  const [existingRecords, setExistingRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    setTitle(`${equipment.name} maintenance`);
    setNextDueDate(toDateInputValue(equipment.maintenanceDue));
  }, [equipment]);

  const fetchMaintenanceRecords = async () => {
    try {
      setLoadingRecords(true);
      setError(null);
      // Request scheduled maintenance records specifically
      const response = await fetchWithAuth(
        `/api/admin/equipment/${equipment.id}/maintenance?type=scheduled&pageSize=20`
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load scheduled maintenance');
      }

      const payload = (await response.json()) as { data: MaintenanceRecord[] };
      const records = payload.data ?? [];
      setExistingRecords(records);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load scheduled maintenance';
      setError(message);
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to load scheduled maintenance',
          { component: 'MaintenanceScheduleModal', action: 'load_records_error' },
          err instanceof Error ? err : new Error(String(err))
        );
      }
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipment.id]);

  const upcomingRecords = useMemo(() => {
    const now = new Date();
    return existingRecords
      .filter((record) => {
        const status = (record.status || '').toLowerCase();
        // Only show records that are not cancelled or completed
        if (status === 'cancelled' || status === 'completed') {
          return false;
        }
        // Optionally filter to only show future scheduled dates
        const scheduledDate = new Date(record.scheduledDate);
        return !isNaN(scheduledDate.getTime());
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [existingRecords]);

  const resetForm = () => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 1);
    defaultDate.setHours(9, 0, 0, 0);
    setScheduledDate(toDateInputValue(defaultDate, true));
    setMaintenanceType('preventive');
    setPriority('medium');
    setTitle(`${equipment.name} maintenance`);
    setDescription('');
    setPerformedBy('');
    setCost('');
    setNextDueDate(toDateInputValue(equipment.maintenanceDue));
    setNextDueHours('');
    setNotes('');
    setEditingRecord(null);
  };

  const handleEdit = (record: MaintenanceRecord) => {
    try {
      setEditingRecord(record);
      setTitle(record.title);
      setMaintenanceType(record.maintenanceType);
      setPriority(record.priority);
      setScheduledDate(toDateInputValue(new Date(record.scheduledDate), true));
      setPerformedBy(record.performedBy || '');
      setCost(record.cost?.toString() || '');
      setNextDueDate(record.nextDueDate ? toDateInputValue(new Date(record.nextDueDate)) : '');
      setNextDueHours(record.nextDueHours?.toString() || '');
      setNotes(record.notes || '');
      setDescription(record.description || '');

      // Scroll to top of form after a brief delay to ensure state updates
      setTimeout(() => {
        const modalElement = document.querySelector('[role="dialog"]');
        if (modalElement) {
          modalElement.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      logger.error(
        'Error editing scheduled maintenance',
        { component: 'MaintenanceScheduleModal', action: 'edit_error' },
        error instanceof Error ? error : new Error(String(error))
      );
      setError('Failed to load maintenance record for editing');
    }
  };

  const handleCancel = async (maintenanceId: string) => {
    if (
      !confirm(
        'Are you sure you want to cancel this scheduled maintenance? This action cannot be undone.'
      )
    ) {
      return;
    }

    setCancelling(maintenanceId);
    try {
      await cancelScheduledMaintenance(equipment.id, maintenanceId);
      await fetchMaintenanceRecords();
      if (onScheduled) {
        await onScheduled();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel scheduled maintenance';
      setError(message);
      logger.error(
        'Failed to cancel scheduled maintenance',
        { component: 'MaintenanceScheduleModal', action: 'cancel_error' },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setCancelling(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const scheduledDateIso = parseDate(scheduledDate)?.toISOString();
      if (!scheduledDateIso) {
        throw new Error('Please provide a valid scheduled date and time');
      }

      if (editingRecord) {
        // Update existing scheduled maintenance
        await updateScheduledMaintenance(equipment.id, editingRecord.id, {
          title: title.trim() || `${equipment.name} maintenance`,
          maintenanceType: maintenanceType as
            | 'scheduled'
            | 'preventive'
            | 'repair'
            | 'emergency'
            | 'inspection',
          priority: priority as 'low' | 'medium' | 'high' | 'critical',
          scheduledDate: scheduledDateIso,
          description: description.trim() || undefined,
          performedBy: performedBy.trim() || undefined,
          cost: cost ? parseFloat(cost) : undefined,
          nextDueDate: parseDate(nextDueDate)?.toISOString() || null,
          nextDueHours: nextDueHours ? parseInt(nextDueHours, 10) : undefined,
          notes: notes.trim() || undefined,
        });

        await fetchMaintenanceRecords();
        resetForm();
        if (onScheduled) {
          await onScheduled();
        }
      } else {
        // Create new scheduled maintenance
        const payload = {
          title: title.trim() || `${equipment.name} maintenance`,
          maintenanceType,
          priority,
          scheduledDate: scheduledDateIso,
          description: description.trim() || undefined,
          performedBy: performedBy.trim() || undefined,
          cost: cost ? parseFloat(cost) : undefined,
          nextDueDate: parseDate(nextDueDate)?.toISOString(),
          nextDueHours: nextDueHours ? parseInt(nextDueHours, 10) : undefined,
          notes: notes.trim() || undefined,
        };

        const scheduleResponse = await fetchWithAuth(
          `/api/admin/equipment/${equipment.id}/maintenance`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        if (!scheduleResponse.ok) {
          const responseBody = await scheduleResponse.json().catch(() => ({}));
          throw new Error(responseBody.error || 'Failed to schedule maintenance');
        }

        if (onScheduled) {
          await onScheduled();
        }

        await fetchMaintenanceRecords();
        resetForm();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to schedule maintenance';
      setError(message);
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to schedule maintenance',
          { component: 'MaintenanceScheduleModal', action: 'schedule_error' },
          err instanceof Error ? err : new Error(String(err))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      isOpen={true}
      onClose={onClose}
      title={editingRecord ? 'Edit Scheduled Maintenance' : 'Schedule Maintenance'}
      maxWidth="3xl"
      ariaLabelledBy="maintenance-modal-title"
    >
      <div className="flex flex-col">
        <div className="px-6 py-2 border-b border-gray-200">
          <p className="text-sm text-gray-500">
            {equipment.unitId} · {equipment.name}
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="maintenance-title"
              >
                Maintenance Title
              </label>
              <input
                id="maintenance-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                placeholder="e.g., 250-hour preventive maintenance"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="maintenance-type"
                >
                  Maintenance Type
                </label>
                <select
                  id="maintenance-type"
                  value={maintenanceType}
                  onChange={(event) => setMaintenanceType(event.target.value)}
                  className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                >
                  {maintenanceTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="maintenance-priority"
                >
                  Priority
                </label>
                <select
                  id="maintenance-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="scheduled-date"
                >
                  Scheduled Date &amp; Time
                </label>
                <input
                  id="scheduled-date"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                  className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="performed-by"
                >
                  Assigned To
                </label>
                <input
                  id="performed-by"
                  type="text"
                  value={performedBy}
                  onChange={(event) => setPerformedBy(event.target.value)}
                  className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                  placeholder="e.g., Kyle Thompson"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="maintenance-cost"
                >
                  Estimated Cost (CAD)
                </label>
                <input
                  id="maintenance-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(event) => setCost(event.target.value)}
                  className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="next-due-hours"
                >
                  Next Due (Engine Hours)
                </label>
                <input
                  id="next-due-hours"
                  type="number"
                  min="0"
                  value={nextDueHours}
                  onChange={(event) => setNextDueHours(event.target.value)}
                  className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="next-due-date"
                >
                  Next Maintenance Due (Date)
                </label>
                <input
                  id="next-due-date"
                  type="date"
                  value={nextDueDate}
                  onChange={(event) => setNextDueDate(event.target.value)}
                  className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="maintenance-notes"
                >
                  Internal Notes
                </label>
                <textarea
                  id="maintenance-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                  placeholder="Optional notes for the maintenance team"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="maintenance-description"
              >
                Description &amp; Tasks
              </label>
              <textarea
                id="maintenance-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="focus:ring-premium-gold h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                placeholder="Add details: oil change, filter replacement, inspection notes..."
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
              {editingRecord && (
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2"
                  onClick={() => {
                    resetForm();
                    setError(null);
                  }}
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingRecord ? 'Updating...' : 'Scheduling...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {editingRecord ? 'Update Maintenance' : 'Schedule Maintenance'}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Upcoming Maintenance</h3>
              {loadingRecords && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>

            {upcomingRecords.length === 0 && !loadingRecords ? (
              <p className="text-sm text-gray-500">
                No maintenance scheduled yet. Schedule the first maintenance task for this unit.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {upcomingRecords.map((record) => (
                  <li
                    key={record.id}
                    className="rounded-md border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{record.title}</p>
                        <p className="mt-1 flex items-center text-xs text-gray-500">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(record.scheduledDate).toLocaleString()}
                        </p>
                      </div>
                      <div className="ml-4 flex shrink-0 items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[record.status] ?? 'bg-gray-100 text-gray-700'}`}
                        >
                          {record.status.replace('_', ' ')}
                        </span>
                        {(() => {
                          const normalizedStatus = (record.status || '').toLowerCase();
                          const isEditable =
                            normalizedStatus !== 'cancelled' && normalizedStatus !== 'completed';
                          return isEditable ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEdit(record);
                                }}
                                className="flex shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Edit scheduled maintenance"
                                type="button"
                                aria-label={`Edit ${record.title}`}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(record.id)}
                                disabled={cancelling === record.id}
                                className="flex shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                                title="Cancel scheduled maintenance"
                                type="button"
                              >
                                {cancelling === record.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                        {record.maintenanceType}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-premium-gold-50 px-2 py-0.5 font-medium text-premium-gold-dark">
                        Priority: {record.priority}
                      </span>
                      {record.performedBy && <span>Assigned to {record.performedBy}</span>}
                      {record.cost != null && <span>Est. Cost ${record.cost.toFixed(2)}</span>}
                      {record.nextDueDate && (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">
                          Next due {new Date(record.nextDueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
              <div className="flex items-start">
                <Clock className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  Maintenance events automatically update equipment status and next due dates. Stay
                  proactive by scheduling preventive maintenance ahead of time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
