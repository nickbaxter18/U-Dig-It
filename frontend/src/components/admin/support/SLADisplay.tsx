'use client';

import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { fetchSupportSla } from '@/lib/api/admin/support';
import { logger } from '@/lib/logger';

interface SupportSLA {
  id: string;
  ticket_id: string;
  priority: string;
  target_response_minutes: number;
  target_resolution_minutes: number;
  first_response_at: string | null;
  resolved_at: string | null;
  breached_response: boolean;
  breached_resolution: boolean;
  created_at: string;
  updated_at: string;
}

interface SLADisplayProps {
  ticketId: string;
  priority: string;
  createdAt: string;
}

export default function SLADisplay({ ticketId, priority, createdAt }: SLADisplayProps) {
  const [slaData, setSlaData] = useState<SupportSLA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSLA = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSupportSla(ticketId);
      setSlaData((data.sla as SupportSLA) || null);
    } catch (err) {
      logger.warn(
        'Failed to fetch SLA data',
        { component: 'SLADisplay', action: 'fetch_failed', metadata: { ticketId } },
        err instanceof Error ? err : undefined
      );
      setError(err instanceof Error ? err.message : 'Failed to load SLA');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchSLA();
  }, [fetchSLA]);

  const calculateTimeRemaining = (
    targetMinutes: number,
    startTime: string,
    currentTime: Date = new Date()
  ): { minutes: number; status: 'on_track' | 'at_risk' | 'breached' } => {
    const start = new Date(startTime);
    const elapsed = (currentTime.getTime() - start.getTime()) / (1000 * 60); // minutes
    const remaining = targetMinutes - elapsed;
    const percentUsed = (elapsed / targetMinutes) * 100;

    if (remaining <= 0) {
      return { minutes: 0, status: 'breached' };
    }
    if (percentUsed >= 80) {
      return { minutes: Math.round(remaining), status: 'at_risk' };
    }
    return { minutes: Math.round(remaining), status: 'on_track' };
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="border-premium-gold h-6 w-6 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (error || !slaData) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs text-gray-500">SLA data not available</p>
      </div>
    );
  }

  const responseTime = slaData.first_response_at
    ? calculateTimeRemaining(
        slaData.target_response_minutes,
        createdAt,
        new Date(slaData.first_response_at)
      )
    : calculateTimeRemaining(slaData.target_response_minutes, createdAt);

  const resolutionTime = slaData.resolved_at
    ? { minutes: 0, status: 'on_track' as const }
    : calculateTimeRemaining(slaData.target_resolution_minutes, createdAt);

  const getStatusColor = (status: string, breached: boolean) => {
    if (breached) return 'text-red-600 bg-red-50 border-red-200';
    if (status === 'at_risk') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusIcon = (status: string, breached: boolean) => {
    if (breached) return <XCircle className="h-4 w-4" />;
    if (status === 'at_risk') return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusLabel = (status: string, breached: boolean) => {
    if (breached) return 'Breached';
    if (status === 'at_risk') return 'At Risk';
    return 'On Track';
  };

  return (
    <div className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h4 className="text-sm font-medium text-gray-900">SLA Status</h4>
        <span className="text-xs text-gray-500">Priority: {priority}</span>
      </div>

      <div className="space-y-3">
        {/* Response Time SLA */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">First Response</span>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(
                responseTime.status,
                slaData.breached_response
              )}`}
            >
              <span className="mr-1 inline-flex items-center">
                {getStatusIcon(responseTime.status, slaData.breached_response)}
              </span>
              {getStatusLabel(responseTime.status, slaData.breached_response)}
            </span>
          </div>
          <div className="ml-6 text-xs text-gray-600">
            {slaData.first_response_at ? (
              <span>Responded in {formatTime(responseTime.minutes)}</span>
            ) : (
              <span>
                Target: {formatTime(slaData.target_response_minutes)} | Remaining:{' '}
                {formatTime(responseTime.minutes)}
              </span>
            )}
          </div>
        </div>

        {/* Resolution Time SLA */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">Resolution</span>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(
                resolutionTime.status,
                slaData.breached_resolution
              )}`}
            >
              <span className="mr-1 inline-flex items-center">
                {getStatusIcon(resolutionTime.status, slaData.breached_resolution)}
              </span>
              {getStatusLabel(resolutionTime.status, slaData.breached_resolution)}
            </span>
          </div>
          <div className="ml-6 text-xs text-gray-600">
            {slaData.resolved_at ? (
              <span>Resolved in {formatTime(resolutionTime.minutes)}</span>
            ) : (
              <span>
                Target: {formatTime(slaData.target_resolution_minutes)} | Remaining:{' '}
                {formatTime(resolutionTime.minutes)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
