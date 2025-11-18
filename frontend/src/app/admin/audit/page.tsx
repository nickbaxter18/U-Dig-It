'use client';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { Activity, AlertTriangle, Clock, Download, Eye, Filter, Link2, Printer, Search, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  changesBefore?: Record<string, any>;
  changesAfter?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export default function AuditLogViewer() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [relatedLogs, setRelatedLogs] = useState<AuditLog[]>([]);
  const [showRelatedLogs, setShowRelatedLogs] = useState(false);
  const [relatedLogsFilter, setRelatedLogsFilter] = useState<'resource' | 'admin' | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIXED: Fetch audit logs from API route (avoids client-side join issues)
      const response = await fetchWithAuth('/api/admin/audit');
      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.status}`);
      }

      const { logs } = await response.json();

      // Transform to component format with Date objects
      const transformed: AuditLog[] = (logs || []).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));

      setAuditLogs(transformed);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch audit logs',
          {
            component: 'app-page',
            action: 'audit_logs_fetch_error',
            metadata: { error: err instanceof Error ? err.message : 'Unknown error' },
          },
          err instanceof Error ? err : undefined
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = new Date();
      const logDate = new Date(log.timestamp);

      switch (dateFilter) {
        case 'today':
          matchesDate = logDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = logDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = logDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesAction && matchesSeverity && matchesDate;
  });

  const handleViewRelatedLogs = (log: AuditLog, filterType: 'resource' | 'admin') => {
    let related: AuditLog[] = [];

    if (filterType === 'resource') {
      // Find logs for the same resource (same resourceType and resourceId)
      related = auditLogs.filter(
        l => l.resourceType === log.resourceType && l.resourceId === log.resourceId && l.id !== log.id
      );
    } else if (filterType === 'admin') {
      // Find logs by the same admin
      related = auditLogs.filter(
        l => l.adminId === log.adminId && l.id !== log.id
      );
    }

    setRelatedLogs(related);
    setRelatedLogsFilter(filterType);
    setShowRelatedLogs(true);
    setSelectedLog(log);
  };

  const handleCloseRelatedLogs = () => {
    setShowRelatedLogs(false);
    setRelatedLogs([]);
    setRelatedLogsFilter(null);
  };

  const handlePrintLog = (log: AuditLog) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Audit Log - ${log.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              color: #333;
              border-bottom: 2px solid #f97316;
              padding-bottom: 10px;
            }
            h2 {
              color: #666;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            .section {
              margin-bottom: 30px;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .field {
              margin-bottom: 10px;
            }
            .field-label {
              font-weight: bold;
              color: #555;
            }
            .field-value {
              margin-left: 10px;
              color: #333;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              margin-left: 5px;
            }
            .badge-action-CREATE { background: #d1fae5; color: #065f46; }
            .badge-action-UPDATE { background: #dbeafe; color: #1e40af; }
            .badge-action-DELETE { background: #fee2e2; color: #991b1b; }
            .badge-action-LOGIN { background: #e9d5ff; color: #6b21a8; }
            .badge-severity-low { background: #d1fae5; color: #065f46; }
            .badge-severity-medium { background: #fef3c7; color: #92400e; }
            .badge-severity-high { background: #fed7aa; color: #9a3412; }
            .badge-severity-critical { background: #fee2e2; color: #991b1b; }
            .changes {
              background: #f9fafb;
              padding: 10px;
              border-radius: 4px;
              margin-top: 5px;
            }
            .changes-before {
              background: #fef2f2;
              border-left: 3px solid #ef4444;
            }
            .changes-after {
              background: #f0fdf4;
              border-left: 3px solid #22c55e;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Audit Log Report</h1>

          <div class="section">
            <h2>Log Information</h2>
            <div class="field">
              <span class="field-label">Log ID:</span>
              <span class="field-value">${log.id}</span>
            </div>
            <div class="field">
              <span class="field-label">Timestamp:</span>
              <span class="field-value">${log.timestamp.toLocaleString()}</span>
            </div>
            <div class="field">
              <span class="field-label">Action:</span>
              <span class="field-value">
                <span class="badge badge-action-${log.action}">${log.action}</span>
              </span>
            </div>
            <div class="field">
              <span class="field-label">Severity:</span>
              <span class="field-value">
                <span class="badge badge-severity-${log.severity}">${log.severity.toUpperCase()}</span>
              </span>
            </div>
            <div class="field">
              <span class="field-label">Description:</span>
              <span class="field-value">${log.description}</span>
            </div>
          </div>

          <div class="section">
            <h2>Resource Information</h2>
            <div class="field">
              <span class="field-label">Resource Type:</span>
              <span class="field-value">${log.resourceType}</span>
            </div>
            <div class="field">
              <span class="field-label">Resource Name:</span>
              <span class="field-value">${log.resourceName}</span>
            </div>
            <div class="field">
              <span class="field-label">Resource ID:</span>
              <span class="field-value">${log.resourceId}</span>
            </div>
          </div>

          <div class="section">
            <h2>Admin Information</h2>
            <div class="field">
              <span class="field-label">Admin Name:</span>
              <span class="field-value">${log.adminName}</span>
            </div>
            <div class="field">
              <span class="field-label">Admin ID:</span>
              <span class="field-value">${log.adminId}</span>
            </div>
            <div class="field">
              <span class="field-label">IP Address:</span>
              <span class="field-value">${log.ipAddress}</span>
            </div>
            <div class="field">
              <span class="field-label">User Agent:</span>
              <span class="field-value" style="word-break: break-all;">${log.userAgent}</span>
            </div>
          </div>

          ${log.changesBefore ? `
          <div class="section">
            <h2>Changes Before</h2>
            <div class="changes changes-before">
              ${Object.entries(log.changesBefore).map(([key, value]) => `
                <div class="field">
                  <span class="field-label">${key}:</span>
                  <span class="field-value">${typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${log.changesAfter ? `
          <div class="section">
            <h2>Changes After</h2>
            <div class="changes changes-after">
              ${Object.entries(log.changesAfter).map(([key, value]) => `
                <div class="field">
                  <span class="field-label">${key}:</span>
                  <span class="field-value">${typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <div class="section no-print">
            <p style="color: #666; font-size: 12px;">
              Generated on ${new Date().toLocaleString()}
            </p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const renderChanges = (changes: Record<string, any>) => {
    return Object.entries(changes).map(([key, value]) => (
      <div key={key} className="text-sm">
        <span className="font-medium text-gray-700">{key}:</span>
        <span className="ml-2 text-gray-900">
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </span>
      </div>
    ));
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log Viewer</h1>
          <p className="text-gray-600">
            Track all administrative actions and system changes for security and compliance.
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              const response = await fetchWithAuth('/api/admin/audit/export');
              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } else {
                throw new Error('Export failed');
              }
            } catch (err) {
              alert('Failed to export audit logs');
              logger.error('Audit export failed', {}, err instanceof Error ? err : new Error(String(err)));
            }
          }}
          className="bg-kubota-orange flex items-center space-x-2 rounded-md px-4 py-2 text-white hover:bg-orange-600"
        >
          <Download className="h-4 w-4" />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading audit logs</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="text-kubota-orange h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Actions</p>
              <p className="text-2xl font-semibold text-gray-900">{auditLogs.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critical Actions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {auditLogs.filter(l => l.severity === 'critical').length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Admins</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(auditLogs.map(l => l.adminId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Actions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {
                  auditLogs.filter(l => {
                    const today = new Date().toDateString();
                    return new Date(l.timestamp).toDateString() === today;
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="focus:ring-kubota-orange rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="all">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
        </select>

        <select
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="all">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>

        <button className="focus:ring-kubota-orange flex items-center space-x-1 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2">
          <Filter className="h-4 w-4" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Severity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {log.timestamp.toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{log.adminName}</div>
                    <div className="text-sm text-gray-500">{log.ipAddress}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{log.resourceName}</div>
                    <div className="text-sm capitalize text-gray-500">{log.resourceType}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-sm text-gray-900">{log.description}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getSeverityColor(log.severity)}`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewRelatedLogs(log, 'resource')}
                        className="text-blue-600 hover:text-blue-800"
                        title="View related logs for this resource"
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleViewRelatedLogs(log, 'admin')}
                        className="text-purple-600 hover:text-purple-800"
                        title="View all logs by this admin"
                      >
                        <User className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-kubota-orange hover:text-orange-600"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Related Logs Section */}
      {showRelatedLogs && selectedLog && relatedLogs.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Related Logs
                {relatedLogsFilter === 'resource' && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    (Same Resource: {selectedLog.resourceType} - {selectedLog.resourceName})
                  </span>
                )}
                {relatedLogsFilter === 'admin' && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    (Same Admin: {selectedLog.adminName})
                  </span>
                )}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Found {relatedLogs.length} related log{relatedLogs.length === 1 ? '' : 's'}
              </p>
            </div>
            <button
              onClick={handleCloseRelatedLogs}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Timestamp
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Resource
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Severity
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {relatedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {log.timestamp.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {log.resourceName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{log.description}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getSeverityColor(log.severity)}`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          handleCloseRelatedLogs();
                        }}
                        className="text-kubota-orange hover:text-orange-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRelatedLogs && selectedLog && relatedLogs.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              No related logs found
              {relatedLogsFilter === 'resource' && ' for this resource'}
              {relatedLogsFilter === 'admin' && ' for this admin'}
            </p>
            <button
              onClick={handleCloseRelatedLogs}
              className="mt-4 text-sm text-kubota-orange hover:text-orange-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Audit Log Details - {selectedLog.id}
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Action Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Action:</strong>
                      <span
                        className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionColor(selectedLog.action)}`}
                      >
                        {selectedLog.action}
                      </span>
                    </div>
                    <div>
                      <strong>Resource:</strong> {selectedLog.resourceName} (
                      {selectedLog.resourceType})
                    </div>
                    <div>
                      <strong>Resource ID:</strong> {selectedLog.resourceId}
                    </div>
                    <div>
                      <strong>Description:</strong> {selectedLog.description}
                    </div>
                    <div>
                      <strong>Severity:</strong>
                      <span
                        className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getSeverityColor(selectedLog.severity)}`}
                      >
                        {selectedLog.severity}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Admin Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Admin:</strong> {selectedLog.adminName}
                    </div>
                    <div>
                      <strong>Admin ID:</strong> {selectedLog.adminId}
                    </div>
                    <div>
                      <strong>IP Address:</strong> {selectedLog.ipAddress}
                    </div>
                    <div>
                      <strong>User Agent:</strong>
                      <div className="mt-1 break-all text-xs text-gray-500">
                        {selectedLog.userAgent}
                      </div>
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {selectedLog.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>

                {selectedLog.changesBefore && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-900">Changes Before</h4>
                    <div className="space-y-1 rounded-md border border-red-200 bg-red-50 p-3">
                      {renderChanges(selectedLog.changesBefore)}
                    </div>
                  </div>
                )}

                {selectedLog.changesAfter && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-900">Changes After</h4>
                    <div className="space-y-1 rounded-md border border-green-200 bg-green-50 p-3">
                      {renderChanges(selectedLog.changesAfter)}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    const csv = [
                      ['Field', 'Value'],
                      ['Log ID', selectedLog.id],
                      ['Timestamp', selectedLog.timestamp.toISOString()],
                      ['Action', selectedLog.action],
                      ['Severity', selectedLog.severity],
                      ['Description', selectedLog.description],
                      ['Resource Type', selectedLog.resourceType],
                      ['Resource Name', selectedLog.resourceName],
                      ['Resource ID', selectedLog.resourceId],
                      ['Admin Name', selectedLog.adminName],
                      ['Admin ID', selectedLog.adminId],
                      ['IP Address', selectedLog.ipAddress],
                      ['User Agent', selectedLog.userAgent],
                      ...(selectedLog.changesBefore ? Object.entries(selectedLog.changesBefore).map(([k, v]) => [`Before: ${k}`, typeof v === 'object' ? JSON.stringify(v) : String(v)]) : []),
                      ...(selectedLog.changesAfter ? Object.entries(selectedLog.changesAfter).map(([k, v]) => [`After: ${k}`, typeof v === 'object' ? JSON.stringify(v) : String(v)]) : []),
                    ];
                    const csvContent = csv.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `audit-log-${selectedLog.id}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  }}
                  className="bg-kubota-orange flex items-center space-x-2 rounded-md px-4 py-2 text-sm text-white hover:bg-orange-600"
                >
                  <Download className="h-4 w-4" />
                  <span>Export This Log</span>
                </button>
                <button
                  onClick={() => {
                    const currentLog = selectedLog;
                    setSelectedLog(null);
                    if (currentLog) {
                      handleViewRelatedLogs(currentLog, 'resource');
                    }
                  }}
                  className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  <Link2 className="h-4 w-4" />
                  <span>View Related Logs</span>
                </button>
                <button
                  onClick={() => handlePrintLog(selectedLog)}
                  className="flex items-center space-x-2 rounded-md bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
