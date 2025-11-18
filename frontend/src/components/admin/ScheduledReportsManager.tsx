'use client';

import { useAdminToast } from './AdminToastProvider';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { Plus, Calendar, Mail, FileText, Play, Edit2, Trash2, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ScheduledReport {
  id: string;
  name: string;
  report_type: 'dashboard' | 'analytics' | 'bookings' | 'customers' | 'equipment' | 'payments';
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequency_config: Record<string, any> | null;
  date_range: '7d' | '30d' | '90d' | 'ytd' | 'all';
  format: 'csv' | 'pdf' | 'json';
  recipients: string[];
  filters: Record<string, any> | null;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string;
  last_run_status: 'success' | 'failed' | 'skipped' | null;
  last_run_error: string | null;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  created_at: string;
  updated_at: string;
}

interface ScheduledReportsManagerProps {
  onReportChange?: () => void;
}

export function ScheduledReportsManager({ onReportChange }: ScheduledReportsManagerProps) {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [runningReport, setRunningReport] = useState<Set<string>>(new Set());
  const toast = useAdminToast();

  const [formData, setFormData] = useState({
    name: '',
    reportType: 'dashboard' as ScheduledReport['report_type'],
    frequency: 'weekly' as ScheduledReport['frequency'],
    dateRange: '30d' as ScheduledReport['date_range'],
    format: 'csv' as ScheduledReport['format'],
    recipients: [] as string[],
    recipientInput: '',
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/admin/reports/scheduled');
      if (!response.ok) {
        throw new Error('Failed to load scheduled reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      toast.error('Failed to load scheduled reports', error instanceof Error ? error.message : 'Unable to fetch scheduled reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.recipients.length === 0) {
      toast.error('Validation error', 'Please provide a name and at least one recipient email');
      return;
    }

    try {
      const response = await fetchWithAuth('/api/admin/reports/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          reportType: formData.reportType,
          frequency: formData.frequency,
          dateRange: formData.dateRange,
          format: formData.format,
          recipients: formData.recipients,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create scheduled report');
      }

      toast.success('Report scheduled', 'Scheduled report created successfully');
      setShowCreateModal(false);
      setFormData({
        name: '',
        reportType: 'dashboard',
        frequency: 'weekly',
        dateRange: '30d',
        format: 'csv',
        recipients: [],
        recipientInput: '',
      });
      await fetchReports();
      onReportChange?.();
    } catch (error) {
      toast.error('Failed to create scheduled report', error instanceof Error ? error.message : 'Unable to create scheduled report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/admin/reports/scheduled/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete scheduled report');
      }

      toast.success('Report deleted', 'Scheduled report deleted successfully');
      await fetchReports();
      onReportChange?.();
    } catch (error) {
      toast.error('Failed to delete scheduled report', error instanceof Error ? error.message : 'Unable to delete scheduled report');
    }
  };

  const handleToggleActive = async (report: ScheduledReport) => {
    try {
      const response = await fetchWithAuth(`/api/admin/reports/scheduled/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !report.is_active,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update report');
      }

      toast.success('Report updated', `Report ${!report.is_active ? 'activated' : 'deactivated'} successfully`);
      await fetchReports();
      onReportChange?.();
    } catch (error) {
      toast.error('Failed to update report', error instanceof Error ? error.message : 'Unable to update scheduled report');
    }
  };

  const handleRunNow = async (reportId: string) => {
    if (runningReport.has(reportId)) return;

    setRunningReport(prev => new Set(prev).add(reportId));
    try {
      const response = await fetchWithAuth(`/api/admin/reports/scheduled/${reportId}/run`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run report');
      }

      toast.success('Report queued', 'Report generation has been queued');
      await fetchReports();
      onReportChange?.();
    } catch (error) {
      toast.error('Failed to run report', error instanceof Error ? error.message : 'Unable to run scheduled report');
    } finally {
      setRunningReport(prev => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };

  const addRecipient = () => {
    const email = formData.recipientInput.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!formData.recipients.includes(email)) {
        setFormData(prev => ({
          ...prev,
          recipients: [...prev.recipients, email],
          recipientInput: '',
        }));
      } else {
        toast.error('Duplicate email', 'This email is already in the recipients list');
      }
    } else {
      toast.error('Invalid email', 'Please enter a valid email address');
    }
  };

  const removeRecipient = (email: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(e => e !== email),
    }));
  };

  const getFrequencyLabel = (frequency: ScheduledReport['frequency']) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom':
        return 'Custom';
      default:
        return frequency;
    }
  };

  const getReportTypeLabel = (type: ScheduledReport['report_type']) => {
    switch (type) {
      case 'dashboard':
        return 'Dashboard';
      case 'analytics':
        return 'Analytics';
      case 'bookings':
        return 'Bookings';
      case 'customers':
        return 'Customers';
      case 'equipment':
        return 'Equipment';
      case 'payments':
        return 'Payments';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
        <button
          onClick={() => {
            setEditingReport(null);
            setFormData({
              name: '',
              reportType: 'dashboard',
              frequency: 'weekly',
              dateRange: '30d',
              format: 'csv',
              recipients: [],
              recipientInput: '',
            });
            setShowCreateModal(true);
          }}
          className="inline-flex items-center rounded-md bg-kubota-orange px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
        >
          <Plus className="mr-2 h-4 w-4" /> Schedule Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">No scheduled reports</p>
          <button
            onClick={() => {
              setEditingReport(null);
              setFormData({
                name: '',
                reportType: 'dashboard',
                frequency: 'weekly',
                dateRange: '30d',
                format: 'csv',
                recipients: [],
                recipientInput: '',
              });
              setShowCreateModal(true);
            }}
            className="mt-4 text-sm text-kubota-orange hover:text-orange-600"
          >
            Schedule your first report
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md ${
                report.is_active ? 'bg-white' : 'bg-gray-50 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">{report.name}</h4>
                    {report.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <FileText className="mr-1 h-4 w-4" />
                      {getReportTypeLabel(report.report_type)}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      {getFrequencyLabel(report.frequency)}
                    </span>
                    <span className="flex items-center">
                      <Mail className="mr-1 h-4 w-4" />
                      {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                    </span>
                    {report.last_run_at && (
                      <span className="flex items-center">
                        {report.last_run_status === 'success' ? (
                          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                        ) : report.last_run_status === 'failed' ? (
                          <AlertCircle className="mr-1 h-4 w-4 text-red-500" />
                        ) : (
                          <Calendar className="mr-1 h-4 w-4" />
                        )}
                        Last run: {new Date(report.last_run_at).toLocaleString()}
                      </span>
                    )}
                    <span className="flex items-center">
                      Next run: {new Date(report.next_run_at).toLocaleString()}
                    </span>
                  </div>
                  {report.recipients.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {report.recipients.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                        >
                          {email}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <button
                    onClick={() => handleRunNow(report.id)}
                    disabled={runningReport.has(report.id)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    title="Run now"
                  >
                    {runningReport.has(report.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleActive(report)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      report.is_active
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                    title={report.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {report.is_active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900">Schedule Report</h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingReport(null);
                  setFormData({
                    name: '',
                    reportType: 'dashboard',
                    frequency: 'weekly',
                    dateRange: '30d',
                    format: 'csv',
                    recipients: [],
                    recipientInput: '',
                  });
                }}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Report Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g., Weekly Dashboard Summary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Report Type</label>
                  <select
                    value={formData.reportType}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportType: e.target.value as ScheduledReport['report_type'] }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="dashboard">Dashboard</option>
                    <option value="analytics">Analytics</option>
                    <option value="bookings">Bookings</option>
                    <option value="customers">Customers</option>
                    <option value="equipment">Equipment</option>
                    <option value="payments">Payments</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as ScheduledReport['frequency'] }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Date Range</label>
                  <select
                    value={formData.dateRange}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateRange: e.target.value as ScheduledReport['date_range'] }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="ytd">Year to date</option>
                    <option value="all">All time</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as ScheduledReport['format'] }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Recipients</label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={formData.recipientInput}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientInput: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRecipient();
                      }
                    }}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Enter email address"
                  />
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
                {formData.recipients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.recipients.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeRecipient(email)}
                          className="ml-1 rounded-full hover:bg-blue-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingReport(null);
                    setFormData({
                      name: '',
                      reportType: 'dashboard',
                      frequency: 'weekly',
                      dateRange: '30d',
                      format: 'csv',
                      recipients: [],
                      recipientInput: '',
                    });
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formData.recipients.length === 0}
                  className="inline-flex items-center rounded-md bg-kubota-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  Schedule Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


