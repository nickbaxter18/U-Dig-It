'use client';

import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  Filter,
  Link2,
  Loader2,
  Printer,
  Search,
  User,
  X,
} from 'lucide-react';

import { useEffect, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';
import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  changesBefore?: Record<string, unknown>;
  changesAfter?: Record<string, unknown>;
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
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [relatedLogs, setRelatedLogs] = useState<AuditLog[]>([]);
  const [showRelatedLogs, setShowRelatedLogs] = useState(false);
  const [relatedLogsFilter, setRelatedLogsFilter] = useState<'resource' | 'admin' | null>(null);
  const [loadingRelatedLogs, setLoadingRelatedLogs] = useState(false);
  const [relatedLogsError, setRelatedLogsError] = useState<string | null>(null);
  const [relatedLogsExpanded, setRelatedLogsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Helper to convert date filter to date range
  const getDateRange = (filter: string): { startDate: string | null; endDate: string | null } => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today

    switch (filter) {
      case 'today': {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return {
          startDate: start.toISOString(),
          endDate: now.toISOString(),
        };
      }
      case 'week': {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return {
          startDate: start.toISOString(),
          endDate: now.toISOString(),
        };
      }
      case 'month': {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        return {
          startDate: start.toISOString(),
          endDate: now.toISOString(),
        };
      }
      default:
        return { startDate: null, endDate: null };
    }
  };

  const fetchAuditLogs = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', pageSize.toString());

      if (actionFilter && actionFilter !== 'all') {
        params.set('action', actionFilter);
      }
      if (severityFilter && severityFilter !== 'all') {
        params.set('severity', severityFilter);
      }
      if (resourceTypeFilter && resourceTypeFilter !== 'all') {
        params.set('resourceType', resourceTypeFilter);
      }
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }

      const { startDate, endDate } = getDateRange(dateFilter);
      if (startDate) {
        params.set('startDate', startDate);
      }
      if (endDate) {
        params.set('endDate', endDate);
      }

      const response = await fetchWithAuth(`/api/admin/audit?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.status}`);
      }

      const { logs, total: totalCount, totalPages: pages } = await response.json();

      // Transform to component format with Date objects
      const transformed: AuditLog[] = (logs || []).map((log: unknown) => ({
        ...log,
        timestamp: new Date((log as any).timestamp),
      }));

      setAuditLogs(transformed);
      setTotal(totalCount || 0);
      setTotalPages(pages || 1);
      setCurrentPage(page);
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
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchAuditLogs(1); // Reset to page 1 when filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, severityFilter, dateFilter, resourceTypeFilter]);

  // Debounce search term to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuditLogs(1);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

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

  // All filtering is now done server-side
  const filteredLogs = auditLogs;

  // Filter change handlers - reset to page 1
  const handleActionFilterChange = (value: string) => {
    setActionFilter(value);
    setCurrentPage(1);
  };

  const handleSeverityFilterChange = (value: string) => {
    setSeverityFilter(value);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const handleResourceTypeFilterChange = (value: string) => {
    setResourceTypeFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    fetchAuditLogs(page);
  };

  const fetchRelatedLogs = async (log: AuditLog, filterType: 'resource' | 'admin') => {
    try {
      setLoadingRelatedLogs(true);
      setRelatedLogsError(null);

      const params = new URLSearchParams();
      params.append('excludeLogId', log.id);

      if (filterType === 'resource') {
        params.append('relatedResourceId', log.resourceId);
        params.append('relatedResourceType', log.resourceType);
      } else if (filterType === 'admin') {
        params.append('relatedAdminId', log.adminId);
      }

      const response = await fetchWithAuth(`/api/admin/audit?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch related logs');
      }

      const data = await response.json();
      // Transform timestamps from strings to Date objects
      const transformedLogs = (data.relatedLogs || []).map((logItem: any) => ({
        ...logItem,
        timestamp: logItem.timestamp instanceof Date ? logItem.timestamp : new Date(logItem.timestamp),
      }));
      setRelatedLogs(transformedLogs);
      setRelatedLogsFilter(filterType);
      setRelatedLogsExpanded(true);

      // Smooth scroll to related logs section after a brief delay
      setTimeout(() => {
        const relatedLogsSection = document.getElementById('related-logs-section');
        if (relatedLogsSection) {
          relatedLogsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch related logs';
      setRelatedLogsError(errorMessage);
      logger.error('Failed to fetch related logs', {
        component: 'audit-viewer',
        action: 'fetch_related_logs',
        metadata: { logId: log.id, filterType, error: errorMessage },
      }, err instanceof Error ? err : undefined);
    } finally {
      setLoadingRelatedLogs(false);
    }
  };

  const handleViewRelatedLogs = (log: AuditLog, filterType: 'resource' | 'admin') => {
    // Don't close modal - keep it open and fetch related logs
    setSelectedLog(log);
    fetchRelatedLogs(log, filterType);
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

          ${
            log.changesBefore
              ? `
          <div class="section">
            <h2>Changes Before</h2>
            <div class="changes changes-before">
              ${Object.entries(log.changesBefore)
                .map(
                  ([key, value]) => `
                <div class="field">
                  <span class="field-label">${key}:</span>
                  <span class="field-value">${typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
          `
              : ''
          }

          ${
            log.changesAfter
              ? `
          <div class="section">
            <h2>Changes After</h2>
            <div class="changes changes-after">
              ${Object.entries(log.changesAfter)
                .map(
                  ([key, value]) => `
                <div class="field">
                  <span class="field-label">${key}:</span>
                  <span class="field-value">${typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
          `
              : ''
          }

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

  const renderChanges = (changes: Record<string, unknown>) => {
    return Object.entries(changes).map(([key, value]) => (
      <div key={key} className="flex items-start gap-2 text-sm">
        <dt className="font-medium text-gray-700 min-w-[120px]">{key}:</dt>
        <dd className="flex-1 break-words text-gray-900">
          {typeof value === 'object' && value !== null ? (
            <pre className="whitespace-pre-wrap text-xs font-mono bg-white/50 p-2 rounded border border-gray-200">
              {JSON.stringify(value, null, 2)}
            </pre>
          ) : (
            <span>{value === null || value === undefined ? 'null' : String(value)}</span>
          )}
        </dd>
      </div>
    ));
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-4 sm:px-6">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-3 w-16 bg-gray-200 rounded mt-2"></div>
          </td>
          <td className="px-4 py-4 sm:px-6">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-3 w-24 bg-gray-200 rounded mt-2"></div>
          </td>
          <td className="px-4 py-4 sm:px-6">
            <div className="h-6 w-20 bg-gray-200 rounded"></div>
          </td>
          <td className="px-4 py-4 sm:px-6">
            <div className="h-4 w-40 bg-gray-200 rounded"></div>
            <div className="h-3 w-24 bg-gray-200 rounded mt-2"></div>
          </td>
          <td className="px-4 py-4 sm:px-6">
            <div className="h-4 w-64 bg-gray-200 rounded"></div>
          </td>
          <td className="px-4 py-4 sm:px-6">
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </td>
          <td className="px-4 py-4 sm:px-6 text-right">
            <div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div>
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
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
              setExporting(true);

              // Build query parameters with current filter state
              const params = new URLSearchParams();
              params.set('format', 'csv');

              if (actionFilter && actionFilter !== 'all') {
                params.set('action', actionFilter);
              }
              if (severityFilter && severityFilter !== 'all') {
                params.set('severity', severityFilter);
              }
              if (resourceTypeFilter && resourceTypeFilter !== 'all') {
                params.set('resourceType', resourceTypeFilter);
              }
              if (searchTerm.trim()) {
                params.set('search', searchTerm.trim());
              }

              const { startDate, endDate } = getDateRange(dateFilter);
              if (startDate) {
                params.set('startDate', startDate);
              }
              if (endDate) {
                params.set('endDate', endDate);
              }

              const response = await fetchWithAuth(`/api/admin/audit/export?${params.toString()}`);
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
                const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
                throw new Error(errorData.error || 'Export failed');
              }
            } catch (err) {
              alert(`Failed to export audit logs: ${err instanceof Error ? err.message : 'Unknown error'}`);
              logger.error(
                'Audit export failed',
                {
                  component: 'audit-page',
                  action: 'export_error',
                  metadata: { error: err instanceof Error ? err.message : String(err) },
                },
                err instanceof Error ? err : new Error(String(err))
              );
            } finally {
              setExporting(false);
            }
          }}
          disabled={exporting || loading}
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className={`h-4 w-4 ${exporting ? 'animate-bounce' : ''}`} />
          <span>{exporting ? 'Exporting...' : 'Export Logs'}</span>
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
              <p className="text-2xl font-semibold text-gray-900">{total.toLocaleString()}</p>
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
                {auditLogs.filter((l) => l.severity === 'critical').length}
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
                {new Set(auditLogs.map((l) => l.adminId)).size}
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
                  auditLogs.filter((l) => {
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
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
            className="focus:ring-kubota-orange rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => handleActionFilterChange(e.target.value)}
          disabled={loading}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="all">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => handleSeverityFilterChange(e.target.value)}
          disabled={loading}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="all">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => handleDateFilterChange(e.target.value)}
          disabled={loading}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>

        {showMoreFilters && (
          <select
            value={resourceTypeFilter}
            onChange={(e) => handleResourceTypeFilterChange(e.target.value)}
            disabled={loading}
            className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">All Resources</option>
            <option value="bookings">Bookings</option>
            <option value="equipment">Equipment</option>
            <option value="users">Users</option>
            <option value="payments">Payments</option>
          </select>
        )}

        <button
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className="focus:ring-kubota-orange flex items-center space-x-1 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <Filter className="h-4 w-4" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-lg bg-white shadow w-full">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[120px]">
                  Timestamp
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[140px]">
                  Admin
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[100px]">
                  Action
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[200px]">
                  Resource
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[100px]">
                  Severity
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <LoadingSkeleton />
              ) : (
                filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4">
                    <div className="text-xs text-gray-900">
                      {log.timestamp.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-xs text-gray-900 break-words">{log.adminName}</div>
                    <div className="text-xs text-gray-500 break-all truncate">{log.ipAddress}</div>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-xs text-gray-900 break-words truncate" title={log.resourceName}>{log.resourceName}</div>
                    <div className="text-xs capitalize text-gray-500">{log.resourceType}</div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-xs text-gray-900 truncate" title={log.description}>{log.description}</div>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getSeverityColor(log.severity)}`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right text-sm font-medium">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {!loading && filteredLogs.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No audit logs found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {actionFilter !== 'all' || severityFilter !== 'all' || dateFilter !== 'all' || resourceTypeFilter !== 'all' || searchTerm.trim()
              ? 'Try adjusting your filters to see more results.'
              : 'No audit logs have been recorded yet.'}
          </p>
          {(actionFilter !== 'all' || severityFilter !== 'all' || dateFilter !== 'all' || resourceTypeFilter !== 'all' || searchTerm.trim()) && (
            <button
              onClick={() => {
                setActionFilter('all');
                setSeverityFilter('all');
                setDateFilter('all');
                setResourceTypeFilter('all');
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="mt-4 text-sm text-kubota-orange hover:text-orange-600"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredLogs.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> of{' '}
                <span className="font-medium">{total.toLocaleString()}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === pageNum
                          ? 'z-10 bg-kubota-orange text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kubota-orange'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

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
            <button onClick={handleCloseRelatedLogs} className="text-gray-400 hover:text-gray-600">
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
                {relatedLogs.map((log) => (
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
      <AdminModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Log Details - ${selectedLog.id.substring(0, 8)}...` : ''}
        maxWidth="4xl"
      >
        {selectedLog && (
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900">Action Information</h4>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">Action</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionColor(selectedLog.action)}`}
                      >
                        {selectedLog.action}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Resource</dt>
                    <dd className="mt-1 text-gray-900">
                      {selectedLog.resourceName} <span className="text-gray-500">({selectedLog.resourceType})</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Resource ID</dt>
                    <dd className="mt-1 font-mono text-xs text-gray-900">{selectedLog.resourceId}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-gray-900">{selectedLog.description}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Severity</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getSeverityColor(selectedLog.severity)}`}
                      >
                        {selectedLog.severity}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900">Admin Information</h4>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">Admin</dt>
                    <dd className="mt-1 text-gray-900">{selectedLog.adminName}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Admin ID</dt>
                    <dd className="mt-1 font-mono text-xs text-gray-900">{selectedLog.adminId}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">IP Address</dt>
                    <dd className="mt-1 font-mono text-xs text-gray-900">{selectedLog.ipAddress}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">User Agent</dt>
                    <dd className="mt-1 break-all text-xs text-gray-600">{selectedLog.userAgent}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Timestamp</dt>
                    <dd className="mt-1 text-gray-900">{selectedLog.timestamp.toLocaleString()}</dd>
                  </div>
                </dl>
              </div>

              {selectedLog.changesBefore && (
                <div className="md:col-span-2">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">Changes Before</h4>
                  <div className="space-y-2 rounded-lg border border-red-200 bg-red-50/50 p-4">
                    {renderChanges(selectedLog.changesBefore)}
                  </div>
                </div>
              )}

              {selectedLog.changesAfter && (
                <div className="md:col-span-2">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">Changes After</h4>
                  <div className="space-y-2 rounded-lg border border-green-200 bg-green-50/50 p-4">
                    {renderChanges(selectedLog.changesAfter)}
                  </div>
                </div>
              )}
            </div>

            {/* Related Logs Section */}
            {(relatedLogs.length > 0 || loadingRelatedLogs || relatedLogsError) && (
              <div id="related-logs-section" className="mt-6 border-t border-gray-200 pt-6">
                <button
                  onClick={() => {
                    setRelatedLogsExpanded(!relatedLogsExpanded);
                    // Smooth scroll when expanding
                    if (!relatedLogsExpanded) {
                      setTimeout(() => {
                        const relatedLogsSection = document.getElementById('related-logs-section');
                        if (relatedLogsSection) {
                          relatedLogsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }, 100);
                    }
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-all duration-200 hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-2">
                    <Link2 className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      Related Logs
                      {relatedLogs.length > 0 && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          {relatedLogs.length}
                        </span>
                      )}
                    </span>
                    {relatedLogsFilter && (
                      <span className="text-sm text-gray-500">
                        ({relatedLogsFilter === 'resource' ? 'By Resource' : 'By Admin'})
                      </span>
                    )}
                  </div>
                  {relatedLogsExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </button>

                {relatedLogsExpanded && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {loadingRelatedLogs ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-kubota-orange" />
                        <span className="ml-2 text-sm text-gray-600">Loading related logs...</span>
                      </div>
                    ) : relatedLogsError ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <p className="text-sm font-medium text-red-800">Error loading related logs</p>
                        </div>
                        <p className="mt-1 text-sm text-red-600">{relatedLogsError}</p>
                        <button
                          onClick={() => selectedLog && fetchRelatedLogs(selectedLog, relatedLogsFilter || 'resource')}
                          className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                        >
                          Retry
                        </button>
                      </div>
                    ) : relatedLogs.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                        <p className="text-sm text-gray-600">No related logs found.</p>
                        {relatedLogsFilter === 'resource' && (
                          <p className="mt-1 text-xs text-gray-500">Try filtering by admin instead.</p>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Timestamp
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Action
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Resource
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Description
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Severity
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {relatedLogs.map((log) => (
                              <tr
                                key={log.id}
                                onClick={() => {
                                  setSelectedLog(log);
                                  // Keep related logs visible when switching
                                  fetchRelatedLogs(log, relatedLogsFilter || 'resource');
                                }}
                                className="cursor-pointer transition-all duration-150 hover:bg-blue-50 hover:shadow-sm"
                              >
                                <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-900">
                                  {log.timestamp instanceof Date
                                    ? log.timestamp.toLocaleString()
                                    : new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-xs">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionColor(log.action)}`}
                                  >
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-900">
                                  <div className="max-w-[200px] truncate" title={log.resourceName}>
                                    {log.resourceName}
                                  </div>
                                  <div className="text-xs text-gray-500">{log.resourceType}</div>
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600">
                                  <div className="max-w-[250px] truncate" title={log.description}>
                                    {log.description}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-xs">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getSeverityColor(log.severity)}`}
                                  >
                                    {log.severity}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-200 pt-6">
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
                    ...(selectedLog.changesBefore
                      ? Object.entries(selectedLog.changesBefore).map(([k, v]) => [
                          `Before: ${k}`,
                          typeof v === 'object' ? JSON.stringify(v) : String(v),
                        ])
                      : []),
                    ...(selectedLog.changesAfter
                      ? Object.entries(selectedLog.changesAfter).map(([k, v]) => [
                          `After: ${k}`,
                          typeof v === 'object' ? JSON.stringify(v) : String(v),
                        ])
                      : []),
                  ];
                  const csvContent = csv
                    .map((row) =>
                      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
                    )
                    .join('\n');
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
                className="flex items-center space-x-2 rounded-md bg-kubota-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-kubota-orange focus:ring-offset-2"
              >
                <Download className="h-4 w-4" />
                <span>Export This Log</span>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (selectedLog) {
                      handleViewRelatedLogs(selectedLog, 'resource');
                    }
                  }}
                  disabled={loadingRelatedLogs}
                  className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingRelatedLogs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  <span>View Related Logs (Resource)</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedLog) {
                      handleViewRelatedLogs(selectedLog, 'admin');
                    }
                  }}
                  disabled={loadingRelatedLogs}
                  className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingRelatedLogs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span>View Related Logs (Admin)</span>
                </button>
              </div>
              <button
                onClick={() => handlePrintLog(selectedLog)}
                className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Details</span>
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
