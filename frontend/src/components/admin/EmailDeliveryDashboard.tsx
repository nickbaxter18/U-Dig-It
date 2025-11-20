'use client';

import {
  AlertCircle,
  CheckCircle,
  Eye,
  Loader2,
  Mail,
  MousePointerClick,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import { useAdminToast } from './AdminToastProvider';

interface EmailDeliveryStats {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_spam_reported: number;
  total_unsubscribed: number;
  delivery_rate: number | null;
  open_rate: number | null;
  click_rate: number | null;
  bounce_rate: number | null;
}

interface EmailDeliveryLog {
  id: string;
  email_id: string | null;
  to_email: string;
  from_email: string;
  subject: string | null;
  template_id: string | null;
  campaign_id: string | null;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  bounce_reason: string | null;
  bounce_type: string | null;
  spam_reported_at: string | null;
  unsubscribed_at: string | null;
}

interface EmailDeliveryDashboardProps {
  onStatsChange?: () => void;
}

export function EmailDeliveryDashboard({ onStatsChange }: EmailDeliveryDashboardProps) {
  const [stats, setStats] = useState<EmailDeliveryStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<EmailDeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const toast = useAdminToast();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = getStartDate(dateRange);
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }

      const response = await fetchWithAuth(`/api/admin/email/delivery-stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load email delivery stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      toast.error(
        'Failed to load email delivery stats',
        error instanceof Error ? error.message : 'Unable to fetch email delivery statistics'
      );
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]);

  const fetchRecentLogs = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/admin/email/delivery-logs?limit=20');
      if (!response.ok) {
        throw new Error('Failed to load email delivery logs');
      }

      const data = await response.json();
      setRecentLogs(data.logs || []);
    } catch (error) {
      toast.error(
        'Failed to load email delivery logs',
        error instanceof Error ? error.message : 'Unable to fetch email delivery logs'
      );
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
    fetchRecentLogs();
  }, [fetchStats, fetchRecentLogs]);

  const getStartDate = (range: string): Date | null => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'all':
        return null;
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'opened':
      case 'clicked':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'bounced':
      case 'dropped':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'spam_report':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'unsubscribed':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Mail className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'opened':
      case 'clicked':
        return 'bg-green-100 text-green-800';
      case 'bounced':
      case 'dropped':
        return 'bg-red-100 text-red-800';
      case 'spam_report':
        return 'bg-orange-100 text-orange-800';
      case 'unsubscribed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Email Delivery Dashboard</h3>
          <p className="mt-1 text-sm text-gray-600">
            Track email delivery, opens, clicks, and bounces
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={() => {
              fetchStats();
              fetchRecentLogs();
            }}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.total_sent.toLocaleString()}
                </p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.delivery_rate !== null ? `${stats.delivery_rate.toFixed(1)}%` : 'N/A'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.total_delivered.toLocaleString()} delivered
                </p>
              </div>
              {stats.delivery_rate !== null && stats.delivery_rate >= 95 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Rate</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.open_rate !== null ? `${stats.open_rate.toFixed(1)}%` : 'N/A'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.total_opened.toLocaleString()} opened
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Click Rate</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.click_rate !== null ? `${stats.click_rate.toFixed(1)}%` : 'N/A'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.total_clicked.toLocaleString()} clicked
                </p>
              </div>
              <MousePointerClick className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Bounce Rate</p>
                <p className="mt-1 text-xl font-semibold text-red-900">
                  {stats.bounce_rate !== null ? `${stats.bounce_rate.toFixed(1)}%` : 'N/A'}
                </p>
                <p className="mt-1 text-xs text-red-700">
                  {stats.total_bounced.toLocaleString()} bounced
                </p>
              </div>
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Spam Reports</p>
                <p className="mt-1 text-xl font-semibold text-orange-900">
                  {stats.total_spam_reported.toLocaleString()}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 text-orange-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Unsubscribed</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.total_unsubscribed.toLocaleString()}
                </p>
              </div>
              <XCircle className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Email Logs */}
      <div>
        <h4 className="mb-4 text-md font-semibold text-gray-900">Recent Email Activity</h4>
        {recentLogs.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">No email activity found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Delivered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Opened
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {log.to_email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{log.subject || 'N/A'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadge(log.status)}`}
                      >
                        {getStatusIcon(log.status)}
                        <span className="ml-1">{log.status}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {log.delivered_at ? new Date(log.delivered_at).toLocaleString() : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {log.opened_at ? new Date(log.opened_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
