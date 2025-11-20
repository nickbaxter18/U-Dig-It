'use client';

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import { useAdminToast } from './AdminToastProvider';

interface JobStatusSummary {
  job_name: string;
  last_run_at: string | null;
  last_status: string | null;
  success_rate: number | null;
  avg_duration_ms: number | null;
  total_runs: number;
  running_count: number;
  failed_count: number;
}

interface JobRun {
  id: string;
  job_name: string;
  job_type: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  processed_count: number;
  success_count: number;
  failure_count: number;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
}

interface JobsMonitorProps {
  onJobChange?: () => void;
}

export function JobsMonitor({ onJobChange }: JobsMonitorProps) {
  const [summary, setSummary] = useState<JobStatusSummary[]>([]);
  const [recentRuns, setRecentRuns] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [triggeringJobs, setTriggeringJobs] = useState<Set<string>>(new Set());
  const toast = useAdminToast();

  const fetchJobStatus = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/admin/jobs/status');
      if (!response.ok) {
        throw new Error('Failed to load job status');
      }

      const data = await response.json();
      setSummary(data.summary || []);
    } catch (error) {
      toast.error(
        'Failed to load job status',
        error instanceof Error ? error.message : 'Unable to fetch job status'
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchRecentRuns = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedJob) {
        params.append('jobName', selectedJob);
      }
      params.append('limit', '20');

      const response = await fetchWithAuth(`/api/admin/jobs/runs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load job runs');
      }

      const data = await response.json();
      setRecentRuns(data.runs || []);
    } catch (error) {
      toast.error(
        'Failed to load job runs',
        error instanceof Error ? error.message : 'Unable to fetch job runs'
      );
    }
  }, [selectedJob, toast]);

  useEffect(() => {
    fetchJobStatus();
    fetchRecentRuns();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchJobStatus();
      fetchRecentRuns();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchJobStatus, fetchRecentRuns]);

  const handleTriggerJob = async (jobName: string) => {
    if (triggeringJobs.has(jobName)) return;

    setTriggeringJobs((prev) => new Set(prev).add(jobName));
    try {
      const response = await fetchWithAuth(`/api/admin/jobs/${jobName}/trigger`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to trigger job');
      }

      toast.success('Job triggered', `Job "${jobName}" has been triggered successfully`);
      await fetchJobStatus();
      await fetchRecentRuns();
      onJobChange?.();
    } catch (error) {
      toast.error(
        'Failed to trigger job',
        error instanceof Error ? error.message : 'Unable to trigger job'
      );
    } finally {
      setTriggeringJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobName);
        return next;
      });
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
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
          <h3 className="text-lg font-semibold text-gray-900">Background Jobs Monitor</h3>
          <p className="mt-1 text-sm text-gray-600">Monitor and manage background job executions</p>
        </div>
        <button
          onClick={() => {
            fetchJobStatus();
            fetchRecentRuns();
          }}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Job Status Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summary.map((job) => (
          <div
            key={job.job_name}
            className={`rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md ${
              job.last_status === 'failed'
                ? 'border-red-200 bg-red-50'
                : job.last_status === 'running'
                  ? 'border-blue-200 bg-blue-50'
                  : job.last_status === 'success'
                    ? 'border-green-200 bg-green-50'
                    : 'bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(job.last_status)}
                  <h4 className="font-semibold text-gray-900">{job.job_name}</h4>
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Last Run:</span>
                    <span className="font-medium">
                      {job.last_run_at ? new Date(job.last_run_at).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  {job.success_rate !== null && (
                    <div className="flex items-center justify-between">
                      <span>Success Rate:</span>
                      <span
                        className={`font-medium ${job.success_rate >= 95 ? 'text-green-600' : job.success_rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}
                      >
                        {job.success_rate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {job.avg_duration_ms !== null && (
                    <div className="flex items-center justify-between">
                      <span>Avg Duration:</span>
                      <span className="font-medium">{formatDuration(job.avg_duration_ms)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Total Runs:</span>
                    <span className="font-medium">{job.total_runs}</span>
                  </div>
                  {job.running_count > 0 && (
                    <div className="flex items-center justify-between text-blue-600">
                      <span>Running:</span>
                      <span className="font-medium">{job.running_count}</span>
                    </div>
                  )}
                  {job.failed_count > 0 && (
                    <div className="flex items-center justify-between text-red-600">
                      <span>Failed:</span>
                      <span className="font-medium">{job.failed_count}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleTriggerJob(job.job_name)}
                disabled={triggeringJobs.has(job.job_name)}
                className="ml-2 rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                title="Trigger job manually"
              >
                {triggeringJobs.has(job.job_name) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Job Runs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-900">Recent Job Runs</h4>
          <select
            value={selectedJob || ''}
            onChange={(e) => {
              setSelectedJob(e.target.value || null);
              fetchRecentRuns();
            }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All Jobs</option>
            {summary.map((job) => (
              <option key={job.job_name} value={job.job_name}>
                {job.job_name}
              </option>
            ))}
          </select>
        </div>

        {recentRuns.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">No job runs found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Job Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Processed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Results
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {run.job_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          run.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : run.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : run.status === 'running'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(run.started_at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {run.status === 'running' ? (
                        <span className="text-blue-600">Running...</span>
                      ) : (
                        formatDuration(run.duration_ms)
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {run.processed_count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {run.success_count > 0 && (
                        <span className="text-green-600">✓ {run.success_count}</span>
                      )}
                      {run.failure_count > 0 && (
                        <span className="ml-2 text-red-600">✗ {run.failure_count}</span>
                      )}
                      {run.error_message && (
                        <div className="mt-1 text-xs text-red-600" title={run.error_message}>
                          {run.error_message.substring(0, 50)}...
                        </div>
                      )}
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
