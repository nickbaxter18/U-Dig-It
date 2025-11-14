'use client';

import { logger } from '@/lib/logger';
import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface Dispute {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  created: number;
  evidence_details: {
    due_by: number;
    has_evidence: boolean;
    submission_count: number;
  };
  charge: string;
  payment_intent: string;
}

export function DisputesSection() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stripeDashboardBase =
    process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.includes('test') === true
      ? 'https://dashboard.stripe.com/test'
      : 'https://dashboard.stripe.com';

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithAuth('/api/admin/payments/disputes');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch disputes');
      }

      const data = await response.json();
      setDisputes(data.disputes || []);
    } catch (err: any) {
      logger.error('Failed to fetch disputes', {
        component: 'DisputesSection',
        action: 'fetch_error',
      }, err instanceof Error ? err : new Error(String(err)));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg bg-white p-6 shadow">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">No Active Disputes</h3>
            <p className="mt-1 text-sm text-gray-600">
              You have no payment disputes at this time. All transactions are in good standing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Active Disputes ({disputes.length})</h3>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {disputes.map((dispute: any) => (
          <div
            key={dispute.id}
            className="rounded-md border border-red-200 bg-red-50 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="text-sm font-medium text-gray-900">
                    Dispute #{dispute.id.slice(-8)}
                  </h4>
                  <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                    {dispute.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    <strong>Amount:</strong> ${(dispute.amount / 100).toFixed(2)} {dispute.currency.toUpperCase()}
                  </div>
                  <div>
                    <strong>Reason:</strong> {dispute.reason.replace('_', ' ')}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(dispute.created * 1000).toLocaleString()}
                  </div>
                  {dispute.evidence_details && (
                    <div>
                      <strong>Evidence Due:</strong>{' '}
                      {new Date(dispute.evidence_details.due_by * 1000).toLocaleDateString()}
                      {dispute.evidence_details.has_evidence && (
                        <CheckCircle className="inline ml-2 h-4 w-4 text-green-600" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="ml-4 flex flex-col space-y-2">
                <button
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
                  onClick={() =>
                    window.open(`${stripeDashboardBase}/disputes/${dispute.id}`, '_blank')
                  }
                >
                  Submit Evidence
                </button>
                <button
                  className="rounded-md bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300"
                  onClick={() =>
                    window.open(`${stripeDashboardBase}/disputes/${dispute.id}`, '_blank')
                  }
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}









