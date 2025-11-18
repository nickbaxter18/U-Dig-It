'use client';

import { useAdminToast } from './AdminToastProvider';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { supabase } from '@/lib/supabase/client';
import { AlertTriangle, CheckCircle, X, Loader2, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DashboardAlert {
  id: string;
  alert_name: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved' | 'suppressed';
  metric_name: string;
  current_value: number | null;
  threshold_value: number | null;
  description: string | null;
  triggered_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  metadata: Record<string, any> | null;
}

interface DashboardAlertsProps {
  maxAlerts?: number;
  showOnlyActive?: boolean;
  onAlertChange?: () => void;
}

export function DashboardAlerts({ maxAlerts = 10, showOnlyActive = true, onAlertChange }: DashboardAlertsProps) {
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const toast = useAdminToast();

  useEffect(() => {
    fetchAlerts();
    // Set up real-time subscription for alerts
    const channel = supabase
      .channel('dashboard-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alert_incidents',
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showOnlyActive) {
        params.append('status', 'open');
      }
      params.append('limit', maxAlerts.toString());

      const response = await fetchWithAuth(`/api/admin/dashboard/alerts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load alerts');
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      toast.error('Failed to load alerts', error instanceof Error ? error.message : 'Unable to fetch dashboard alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    if (acknowledging.has(alertId)) return;

    setAcknowledging(prev => new Set(prev).add(alertId));
    try {
      const response = await fetchWithAuth(`/api/admin/dashboard/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to acknowledge alert');
      }

      toast.success('Alert acknowledged', 'Alert has been marked as acknowledged');
      await fetchAlerts();
      onAlertChange?.();
    } catch (error) {
      toast.error('Failed to acknowledge alert', error instanceof Error ? error.message : 'Unable to acknowledge alert');
    } finally {
      setAcknowledging(prev => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  const handleResolve = async (alertId: string) => {
    if (acknowledging.has(alertId)) return;

    setAcknowledging(prev => new Set(prev).add(alertId));
    try {
      const response = await fetchWithAuth(`/api/admin/dashboard/alerts/${alertId}/resolve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resolve alert');
      }

      toast.success('Alert resolved', 'Alert has been marked as resolved');
      await fetchAlerts();
      onAlertChange?.();
    } catch (error) {
      toast.error('Failed to resolve alert', error instanceof Error ? error.message : 'Unable to resolve alert');
    } finally {
      setAcknowledging(prev => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  const getSeverityColor = (severity: DashboardAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'error':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: DashboardAlert['severity']) => {
    switch (severity) {
      case 'critical':
      case 'error':
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Bell className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-900">Error loading alerts: {error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchAlerts();
          }}
          className="mt-2 rounded-md bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-600">Loading alerts...</span>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Dashboard Alerts</h3>
        </div>
        <div className="mt-4 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <p className="mt-2 text-sm text-gray-600">No active alerts</p>
          <p className="mt-1 text-xs text-gray-500">All systems operating normally</p>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'open');
  const otherAlerts = alerts.filter(a => a.severity !== 'critical' || a.status !== 'open');

  return (
    <div className="space-y-4">
      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900">Critical Alerts</h4>
                <p className="mt-1 text-sm text-red-800">
                  {criticalAlerts.length} critical alert{criticalAlerts.length !== 1 ? 's' : ''} require immediate attention
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">{alert.alert_name}</h4>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize">
                      {alert.severity}
                    </span>
                    {alert.status !== 'open' && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {alert.status}
                      </span>
                    )}
                  </div>
                  {alert.description && (
                    <p className="mt-1 text-sm opacity-90">{alert.description}</p>
                  )}
                  {alert.current_value !== null && alert.threshold_value !== null && (
                    <p className="mt-1 text-xs opacity-75">
                      Current: {alert.current_value.toFixed(2)} | Threshold: {alert.threshold_value.toFixed(2)}
                    </p>
                  )}
                  <p className="mt-1 text-xs opacity-60">
                    Triggered: {new Date(alert.triggered_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {alert.status === 'open' && (
                <div className="ml-4 flex items-center space-x-2">
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={acknowledging.has(alert.id)}
                    className="rounded-md border border-current px-3 py-1.5 text-xs font-medium hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Acknowledge alert"
                  >
                    {acknowledging.has(alert.id) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Acknowledge'
                    )}
                  </button>
                  {alert.severity !== 'critical' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={acknowledging.has(alert.id)}
                      className="rounded-md bg-white/50 px-3 py-1.5 text-xs font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Resolve alert"
                    >
                      {acknowledging.has(alert.id) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Resolve'
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

