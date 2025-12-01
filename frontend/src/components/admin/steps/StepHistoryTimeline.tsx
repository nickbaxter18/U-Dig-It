'use client';

import { CheckCircle, XCircle, Clock, Upload, FileText, User, Calendar, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/utils';

interface StepHistoryTimelineProps {
  bookingId: string;
  stepType: 'contract_signed' | 'insurance_uploaded' | 'license_uploaded' | 'payment_completed' | 'deposit_paid';
}

interface HistoryEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string | null;
  actorName: string | null;
  details: string;
  beforeValue: unknown;
  afterValue: unknown;
  metadata: Record<string, unknown> | null;
}

export function StepHistoryTimeline({ bookingId, stepType }: StepHistoryTimelineProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !stepType) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        // First, fetch related record IDs based on step type
        let relatedRecordIds: string[] = [bookingId];

        if (stepType === 'contract_signed') {
          const { data: contracts } = await supabase
            .from('contracts')
            .select('id')
            .eq('bookingId', bookingId);
          if (contracts) {
            relatedRecordIds = [...relatedRecordIds, ...contracts.map((c) => c.id)];
          }
        } else if (stepType === 'insurance_uploaded') {
          const { data: insuranceDocs } = await supabase
            .from('insurance_documents')
            .select('id')
            .eq('bookingId', bookingId);
          if (insuranceDocs) {
            relatedRecordIds = [...relatedRecordIds, ...insuranceDocs.map((d) => d.id)];
          }
        } else if (stepType === 'license_uploaded') {
          const { data: verifications } = await supabase
            .from('id_verification_requests')
            .select('id')
            .eq('bookingId', bookingId);
          if (verifications) {
            relatedRecordIds = [...relatedRecordIds, ...verifications.map((v) => v.id)];
          }
        } else if (stepType === 'payment_completed' || stepType === 'deposit_paid') {
          const paymentType = stepType === 'deposit_paid' ? 'deposit' : 'payment';
          const { data: payments } = await supabase
            .from('payments')
            .select('id')
            .eq('bookingId', bookingId)
            .eq('type', paymentType);
          if (payments) {
            relatedRecordIds = [...relatedRecordIds, ...payments.map((p) => p.id)];
          }
        }

        // Fetch audit logs for related records
        let auditLogs: any[] = [];
        if (relatedRecordIds.length > 0) {
          const tableNames = ['contracts', 'insurance_documents', 'id_verification_requests', 'payments', 'bookings'];
          const { data, error: auditError } = await supabase
            .from('audit_logs')
            .select('id, action, user_id, old_values, new_values, metadata, created_at, table_name, record_id')
            .in('record_id', relatedRecordIds)
            .in('table_name', tableNames)
            .order('created_at', { ascending: false })
            .limit(50);

          if (auditError) {
            logger.warn('Failed to fetch audit logs', {
              component: 'StepHistoryTimeline',
              action: 'audit_logs_fetch_warning',
              metadata: { bookingId, stepType, error: auditError.message },
            });
            // Continue without audit logs rather than failing completely
          } else {
            auditLogs = data || [];
          }
        }

        // Fetch related table timestamps
        const allEvents: HistoryEvent[] = [];

        // Process audit logs - batch fetch user names for performance
        const userIds = new Set<string>();
        if (auditLogs.length > 0) {
          auditLogs.forEach((log) => {
            if (log.user_id) {
              userIds.add(log.user_id);
            }
          });

          // Batch fetch all user names at once
          const userNamesMap = new Map<string, string>();
          if (userIds.size > 0) {
            const { data: usersData } = await supabase
              .from('users')
              .select('id, firstName, lastName')
              .in('id', Array.from(userIds));

            if (usersData) {
              usersData.forEach((user) => {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                if (fullName) {
                  userNamesMap.set(user.id, fullName);
                }
              });
            }
          }

          // Process audit logs with pre-fetched user names
          for (const log of auditLogs) {
            const actorName = log.user_id ? (userNamesMap.get(log.user_id) || 'Admin') : null;

            // Enhance description based on action and table
            let details = `${log.action} action performed on ${log.table_name}`;
            if (log.table_name === 'contracts' && log.action === 'update' && log.new_values?.status === 'signed') {
              details = 'Contract signed';
            } else if (log.table_name === 'insurance_documents' && log.action === 'create') {
              details = 'Insurance document uploaded';
            } else if (log.table_name === 'insurance_documents' && log.action === 'update' && log.new_values?.status === 'approved') {
              details = 'Insurance document approved';
            } else if (log.table_name === 'insurance_documents' && log.action === 'update' && log.new_values?.status === 'rejected') {
              details = 'Insurance document rejected';
            } else if (log.table_name === 'id_verification_requests' && log.action === 'create') {
              details = 'License verification submitted';
            } else if (log.table_name === 'id_verification_requests' && log.action === 'update' && log.new_values?.status === 'approved') {
              details = 'License verification approved';
            } else if (log.table_name === 'id_verification_requests' && log.action === 'update' && log.new_values?.status === 'rejected') {
              details = 'License verification rejected';
            } else if (log.table_name === 'payments' && log.action === 'update' && log.new_values?.status === 'completed') {
              details = 'Payment completed';
            } else if (log.table_name === 'payments' && log.action === 'update' && log.new_values?.status === 'refunded') {
              details = 'Payment refunded';
            }

            allEvents.push({
              id: log.id,
              timestamp: log.created_at || new Date().toISOString(),
              action: log.action,
              actor: log.user_id || null,
              actorName,
              details,
              beforeValue: log.old_values,
              afterValue: log.new_values,
              metadata: log.metadata as Record<string, unknown> | null,
            });
          }
        }

        // Fetch step-specific timestamps based on step type
        if (stepType === 'contract_signed') {
          const { data: contracts } = await supabase
            .from('contracts')
            .select('id, createdAt, updatedAt, signedAt, completedAt, status')
            .eq('bookingId', bookingId)
            .order('createdAt', { ascending: false });

          if (contracts) {
            for (const contract of contracts) {
              if (contract.createdAt) {
                allEvents.push({
                  id: `contract-created-${contract.id}`,
                  timestamp: contract.createdAt,
                  action: 'created',
                  actor: null,
                  actorName: 'System',
                  details: 'Contract created',
                  beforeValue: null,
                  afterValue: { status: contract.status },
                  metadata: { contractId: contract.id },
                });
              }
              if (contract.signedAt) {
                allEvents.push({
                  id: `contract-signed-${contract.id}`,
                  timestamp: contract.signedAt,
                  action: 'signed',
                  actor: null,
                  actorName: 'Customer',
                  details: 'Contract signed',
                  beforeValue: { status: 'sent_for_signature' },
                  afterValue: { status: 'signed' },
                  metadata: { contractId: contract.id },
                });
              }
              if (contract.completedAt) {
                allEvents.push({
                  id: `contract-completed-${contract.id}`,
                  timestamp: contract.completedAt,
                  action: 'completed',
                  actor: null,
                  actorName: 'System',
                  details: 'Contract completed',
                  beforeValue: { status: 'signed' },
                  afterValue: { status: 'completed' },
                  metadata: { contractId: contract.id },
                });
              }
            }
          }
        } else if (stepType === 'insurance_uploaded') {
          const { data: insuranceDocs } = await supabase
            .from('insurance_documents')
            .select('id, createdAt, updatedAt, reviewedAt, reviewedBy, status')
            .eq('bookingId', bookingId)
            .order('createdAt', { ascending: false });

          if (insuranceDocs) {
            for (const doc of insuranceDocs) {
              if (doc.createdAt) {
                allEvents.push({
                  id: `insurance-created-${doc.id}`,
                  timestamp: doc.createdAt,
                  action: 'uploaded',
                  actor: null,
                  actorName: 'Customer',
                  details: 'Insurance document uploaded',
                  beforeValue: null,
                  afterValue: { status: doc.status },
                  metadata: { documentId: doc.id },
                });
              }
              if (doc.reviewedAt && doc.reviewedBy) {
                const { data: reviewerData } = await supabase
                  .from('users')
                  .select('firstName, lastName')
                  .eq('id', doc.reviewedBy)
                  .maybeSingle();
                const reviewerName = reviewerData
                  ? `${reviewerData.firstName || ''} ${reviewerData.lastName || ''}`.trim()
                  : 'Admin';

                allEvents.push({
                  id: `insurance-reviewed-${doc.id}`,
                  timestamp: doc.reviewedAt,
                  action: doc.status === 'approved' ? 'approved' : 'rejected',
                  actor: doc.reviewedBy,
                  actorName: reviewerName,
                  details: `Insurance document ${doc.status}`,
                  beforeValue: { status: 'pending' },
                  afterValue: { status: doc.status },
                  metadata: { documentId: doc.id },
                });
              }
            }
          }
        } else if (stepType === 'license_uploaded') {
          const { data: verifications } = await supabase
            .from('id_verification_requests')
            .select('id, createdAt, updatedAt, status')
            .eq('bookingId', bookingId)
            .order('createdAt', { ascending: false });

          if (verifications) {
            for (const verification of verifications) {
              if (verification.createdAt) {
                allEvents.push({
                  id: `license-submitted-${verification.id}`,
                  timestamp: verification.createdAt,
                  action: 'submitted',
                  actor: null,
                  actorName: 'Customer',
                  details: 'License verification submitted',
                  beforeValue: null,
                  afterValue: { status: verification.status },
                  metadata: { requestId: verification.id },
                });
              }
              if (verification.updatedAt && verification.updatedAt !== verification.createdAt) {
                allEvents.push({
                  id: `license-updated-${verification.id}`,
                  timestamp: verification.updatedAt,
                  action: 'updated',
                  actor: null,
                  actorName: 'System',
                  details: `License verification ${verification.status}`,
                  beforeValue: null,
                  afterValue: { status: verification.status },
                  metadata: { requestId: verification.id },
                });
              }
            }
          }
        } else if (stepType === 'payment_completed' || stepType === 'deposit_paid') {
          const paymentType = stepType === 'deposit_paid' ? 'deposit' : 'payment';
          const { data: payments } = await supabase
            .from('payments')
            .select('id, createdAt, updatedAt, processedAt, status, type')
            .eq('bookingId', bookingId)
            .eq('type', paymentType)
            .order('createdAt', { ascending: false });

          if (payments) {
            for (const payment of payments) {
              if (payment.createdAt) {
                allEvents.push({
                  id: `payment-created-${payment.id}`,
                  timestamp: payment.createdAt,
                  action: 'created',
                  actor: null,
                  actorName: 'System',
                  details: `${paymentType} payment created`,
                  beforeValue: null,
                  afterValue: { status: payment.status },
                  metadata: { paymentId: payment.id },
                });
              }
              if (payment.processedAt) {
                allEvents.push({
                  id: `payment-processed-${payment.id}`,
                  timestamp: payment.processedAt,
                  action: 'processed',
                  actor: null,
                  actorName: 'System',
                  details: `${paymentType} payment ${payment.status}`,
                  beforeValue: { status: 'pending' },
                  afterValue: { status: payment.status },
                  metadata: { paymentId: payment.id },
                });
              }
            }
          }
        }

        // Sort all events by timestamp (newest first)
        allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setEvents(allEvents);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load history';
        setError(message);
        logger.error(
          'Failed to fetch step history',
          {
            component: 'StepHistoryTimeline',
            action: 'fetch_error',
            metadata: { bookingId, stepType },
          },
          err instanceof Error ? err : new Error(String(err))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [bookingId, stepType]);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'uploaded':
      case 'submitted':
        return <Upload className="h-4 w-4 text-blue-600" />;
      case 'created':
      case 'updated':
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'signed':
        return 'border-green-200 bg-green-50';
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return 'border-red-200 bg-red-50';
      case 'uploaded':
      case 'submitted':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-premium-gold border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600">No history available for this step.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Timeline events */}
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${getActionColor(event.action)}`}>
                {getActionIcon(event.action)}
              </div>

              {/* Event content */}
              <div className={`flex-1 rounded-lg border p-4 ${getActionColor(event.action)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">{event.details}</h4>
                      <span className="text-xs font-medium text-gray-500">{event.action.toUpperCase()}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(event.timestamp)}
                      </div>
                      {event.actorName && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {event.actorName}
                        </div>
                      )}
                    </div>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2">
                        <p className="text-xs font-medium text-gray-500">Metadata:</p>
                        <pre className="mt-1 text-xs text-gray-700 overflow-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

