/**
 * Enterprise Permission System - Audit Log Viewer
 * Component to view permission change audit logs
 */

'use client';

import { Calendar, FileText, Filter, Search, Shield, User } from 'lucide-react';

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { getAuditLog } from '@/lib/permissions/audit';
import type { PermissionAuditLog } from '@/lib/permissions/types';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface AuditLogViewerProps {
  userId?: string;
  limit?: number;
}

export function PermissionAuditLog({ userId, limit = 50 }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<PermissionAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    action?: string;
    performedBy?: string;
  }>({});

  useEffect(() => {
    loadAuditLogs();
  }, [userId, filter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll fetch from API (we'll need to create this endpoint)
      // In the future, this could use the getAuditLog function directly
      const response = await fetchWithAuth(
        `/api/admin/permissions/audit?${new URLSearchParams({
          ...(userId && { userId }),
          ...(filter.action && { action: filter.action }),
          ...(filter.performedBy && { performedBy: filter.performedBy }),
          limit: limit.toString(),
        })}`
      );

      if (!response.ok) {
        throw new Error('Failed to load audit log');
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      logger.error('Failed to load audit log', {
        component: 'PermissionAuditLog',
        action: 'load_audit_log',
      });
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'granted':
      case 'role_assigned':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'revoked':
      case 'role_removed':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'role_created':
      case 'permission_created':
        return <FileText className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading audit log...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 rounded-lg border bg-white p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        <select
          value={filter.action || ''}
          onChange={(e) => setFilter({ ...filter, action: e.target.value || undefined })}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm"
        >
          <option value="">All Actions</option>
          <option value="granted">Granted</option>
          <option value="revoked">Revoked</option>
          <option value="role_assigned">Role Assigned</option>
          <option value="role_removed">Role Removed</option>
          <option value="role_created">Role Created</option>
          <option value="role_updated">Role Updated</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Target
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Performed By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Changes
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No audit log entries found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="text-sm font-medium text-gray-900">
                        {formatAction(log.action)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {log.targetType}: {log.targetId.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {log.performedBy ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {log.performedBy.substring(0, 8)}...
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">System</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {log.oldValue || log.newValue ? (
                      <div className="text-xs text-gray-600">
                        {log.oldValue && (
                          <div className="text-red-600">Old: {JSON.stringify(log.oldValue)}</div>
                        )}
                        {log.newValue && (
                          <div className="text-green-600">New: {JSON.stringify(log.newValue)}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
