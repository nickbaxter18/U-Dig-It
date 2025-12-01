'use client';

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

type VerificationStatus =
  | 'all'
  | 'processing'
  | 'manual_review'
  | 'approved'
  | 'rejected'
  | 'failed';

interface VerificationResult {
  documentStatus?: string | null;
  documentLivenessScore?: number | null;
  faceMatchScore?: number | null;
  faceLivenessScore?: number | null;
  failureReasons: string[];
  processedAt?: Date | null;
  extractedFields?: Record<string, unknown>;
}

interface VerificationRequest {
  id: string;
  bookingId: string;
  bookingNumber: string;
  bookingStatus: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  status: string;
  attemptNumber: number;
  createdAt: Date;
  consentMethod?: string | null;
  consentRecordedAt?: Date | null;
  metadata: Record<string, unknown>;
  result?: VerificationResult;
}

const STATUS_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: 'all', label: 'All requests' },
  { value: 'processing', label: 'Processing' },
  { value: 'manual_review', label: 'Manual review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'failed', label: 'Failed' },
];

export default function IdVerificationAdminPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VerificationStatus>('manual_review');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<VerificationRequest | null>(null);
  const [overrideNotes, setOverrideNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [artefactUrls, setArtefactUrls] = useState<{
    front?: string;
    back?: string;
    selfie?: string;
  }>({});
  const [artefactError, setArtefactError] = useState<string | null>(null);
  const [loadingArtefacts, setLoadingArtefacts] = useState(false);
  const selectedMetadata = selected?.metadata ?? null;
  const localAutomationInfo = useMemo(() => {
    if (!selectedMetadata || typeof selectedMetadata !== 'object') {
      return null;
    }
    const raw = (selectedMetadata as { localAutomation?: unknown } | null)?.localAutomation;
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    return raw as {
      status?: string;
      processedAt?: string;
      failureReasons?: string[];
      scores?: {
        faceMatchScore?: number | null;
        documentSharpnessScore?: number | null;
        selfieSharpnessScore?: number | null;
      };
    };
  }, [selectedMetadata]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = supabase
        .from('id_verification_requests')
        .select(
          `
          id,
          booking_id,
          user_id,
          status,
          attempt_number,
          created_at,
          consent_method,
          consent_recorded_at,
          metadata,
          result:id_verification_results(
            document_status,
            document_liveness_score,
            face_match_score,
            face_liveness_score,
            failure_reasons,
            processed_at,
            extracted_fields
          ),
          booking:booking_id(
            bookingNumber,
            status,
            startDate,
            endDate
          ),
          customer:user_id(
            firstName,
            lastName,
            email,
            phone,
            drivers_license_number,
            drivers_license_expiry,
            drivers_license_province
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(100);

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;

      const mapped: VerificationRequest[] = (data || []).map((item: unknown) => {
        const booking = item.booking ?? {};
        const customer = item.customer ?? {};
        const result = item.result ?? null;
        const customerName =
          `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Unknown';

        return {
          id: item.id,
          bookingId: item.booking_id,
          bookingNumber: booking.bookingNumber ?? 'N/A',
          bookingStatus: booking.status ?? 'unknown',
          userId: item.user_id,
          customerName,
          customerEmail: customer.email ?? 'N/A',
          customerPhone: customer.phone ?? null,
          status: item.status ?? 'processing',
          attemptNumber: item.attempt_number ?? 1,
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          consentMethod: item.consent_method ?? null,
          consentRecordedAt: item.consent_recorded_at ? new Date(item.consent_recorded_at) : null,
          metadata: item.metadata ?? {},
          result: result
            ? {
                documentStatus: result.document_status ?? null,
                documentLivenessScore:
                  typeof result.document_liveness_score === 'number'
                    ? result.document_liveness_score
                    : Number(result.document_liveness_score) || null,
                faceMatchScore:
                  typeof result.face_match_score === 'number'
                    ? result.face_match_score
                    : Number(result.face_match_score) || null,
                faceLivenessScore:
                  typeof result.face_liveness_score === 'number'
                    ? result.face_liveness_score
                    : Number(result.face_liveness_score) || null,
                failureReasons: Array.isArray(result.failure_reasons) ? result.failure_reasons : [],
                processedAt: result.processed_at ? new Date(result.processed_at) : null,
                extractedFields: result.extracted_fields ?? undefined,
              }
            : undefined,
        };
      });

      setRequests(mapped);
    } catch (fetchError) {
      logger.error(
        'Failed to load ID verification requests',
        { component: 'IdVerificationAdminPage' },
        fetchError instanceof Error ? fetchError : new Error(String(fetchError))
      );
      setError(
        fetchError instanceof Error ? fetchError.message : 'Failed to load verification requests'
      );
    } finally {
      setLoading(false);
    }
  }, []); // supabase is a stable client, doesn't need to be in deps

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, fetchRequests]);

  useEffect(() => {
    let isActive = true;

    const loadArtefacts = async () => {
      if (!selected) {
        setArtefactUrls({});
        setArtefactError(null);
        return;
      }

      const metadata = selected.metadata ?? {};
      const documentPath =
        typeof (metadata as { documentPath?: string } | null)?.documentPath === 'string'
          ? (metadata as { documentPath: string }).documentPath
          : Array.isArray((metadata as { documentPaths?: string[] } | null)?.documentPaths)
            ? ((metadata as { documentPaths: string[] }).documentPaths[0] ?? null)
            : null;
      const selfiePath =
        typeof (metadata as { selfiePath?: string } | null)?.selfiePath === 'string'
          ? (metadata as { selfiePath: string }).selfiePath
          : null;

      if (!documentPath && !selfiePath) {
        setArtefactUrls({});
        setArtefactError(null);
        return;
      }

      setLoadingArtefacts(true);
      setArtefactError(null);

      const createUrl = async (path?: string | null) => {
        if (!path) return undefined;
        const { data, error: signedUrlError } = await supabase.storage
          .from('idkit-intake')
          .createSignedUrl(path, 60 * 10);
        if (signedUrlError || !data?.signedUrl) {
          throw new Error(signedUrlError?.message ?? 'Unable to generate signed URL');
        }
        return data.signedUrl;
      };

      try {
        const [frontUrl, selfieUrl] = await Promise.all([
          createUrl(documentPath),
          createUrl(selfiePath),
        ]);

        if (!isActive) return;
        setArtefactUrls({
          front: frontUrl,
          selfie: selfieUrl,
        });
      } catch (loadError) {
        if (!isActive) return;
        setArtefactError(loadError instanceof Error ? loadError.message : String(loadError));
        setArtefactUrls({});
      } finally {
        if (isActive) {
          setLoadingArtefacts(false);
        }
      }
    };

    loadArtefacts();

    return () => {
      isActive = false;
    };
  }, [selected]);

  const renderPreview = (label: string, url?: string) => (
    <div className="rounded-md border border-gray-200 bg-white p-2">
      <p className="text-xs font-medium text-gray-700">{label}</p>
      <div className="mt-1.5 h-32 w-full overflow-hidden rounded-md bg-gray-50">
        {loadingArtefacts ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Clock className="h-5 w-5 animate-spin" />
          </div>
        ) : url ? (
          <img src={url} alt={`${label} preview`} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            No preview
          </div>
        )}
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-xs font-semibold text-blue-600 hover:underline"
        >
          Open original
        </a>
      )}
    </div>
  );
  const automationScores = localAutomationInfo?.scores;

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const haystack = [
        request.bookingNumber,
        request.customerName,
        request.customerEmail,
        request.status,
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = term.length === 0 || haystack.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, searchTerm]);

  const handleApprove = async () => {
    if (!selected) return;

    try {
      setSubmittingAction(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Unable to determine admin user');

      const metadata = {
        ...(selected.metadata ?? {}),
        adminOverride: {
          action: 'approved',
          adminId: user.id,
          notes: overrideNotes || null,
          timestamp: new Date().toISOString(),
        },
      };

      // Type assertion needed due to Supabase type inference
      await supabase
        .from('id_verification_requests')
        .update({
          status: 'approved',
          metadata,
        })
        .eq('id', selected.id);

      // Type assertion needed due to Supabase type inference
      await supabase.from('id_verification_audits').insert({
        request_id: selected.id,
        action: 'override_approved',
        performed_by: user.id,
        notes: overrideNotes || null,
        metadata: {
          previous_status: selected.status,
        },
      });

      if (selected.result?.extractedFields) {
        const fields = selected.result.extractedFields;
        const updates: Record<string, string | null> = {};

        if (typeof fields.license_number === 'string') {
          updates.drivers_license_number = fields.license_number;
        } else if (typeof fields.number === 'string') {
          updates.drivers_license_number = fields.number;
        }

        const expiry =
          typeof fields.expiry_date === 'string'
            ? fields.expiry_date
            : typeof fields.expiry === 'string'
              ? fields.expiry
              : null;
        if (expiry) {
          updates.drivers_license_expiry = new Date(expiry).toISOString().split('T')[0];
        }

        if (typeof fields.province === 'string') {
          updates.drivers_license_province = fields.province;
        } else if (typeof fields.state === 'string') {
          updates.drivers_license_province = fields.state;
        }

        updates.drivers_license_verified_at = new Date().toISOString();

        if (Object.keys(updates).length > 0) {
          // Type assertion needed due to Supabase type inference
          await supabase.from('users').update(updates).eq('id', selected.userId);
        }
      }

      setOverrideNotes('');
      setSelected(null);
      await fetchRequests();
    } catch (approveError) {
      logger.error(
        'Failed to approve ID verification',
        { component: 'IdVerificationAdminPage', requestId: selected?.id },
        approveError instanceof Error ? approveError : new Error(String(approveError))
      );
      alert(approveError instanceof Error ? approveError.message : 'Failed to approve request');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!overrideNotes.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      setSubmittingAction(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Unable to determine admin user');

      const metadata = {
        ...(selected.metadata ?? {}),
        adminOverride: {
          action: 'rejected',
          adminId: user.id,
          notes: overrideNotes,
          timestamp: new Date().toISOString(),
        },
      };

      // Type assertion needed due to Supabase type inference
      await supabase
        .from('id_verification_requests')
        .update({
          status: 'rejected',
          metadata,
        })
        .eq('id', selected.id);

      // Type assertion needed due to Supabase type inference
      await supabase.from('id_verification_audits').insert({
        request_id: selected.id,
        action: 'override_rejected',
        performed_by: user.id,
        notes: overrideNotes,
        metadata: {
          previous_status: selected.status,
        },
      });

      setOverrideNotes('');
      setSelected(null);
      await fetchRequests();
    } catch (rejectError) {
      logger.error(
        'Failed to reject ID verification',
        { component: 'IdVerificationAdminPage', requestId: selected?.id },
        rejectError instanceof Error ? rejectError : new Error(String(rejectError))
      );
      alert(rejectError instanceof Error ? rejectError.message : 'Failed to reject request');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">ID Verification Queue</h1>
        <p className="mt-2 text-gray-600">
          Review automated IDKit results, manage manual reviews, and override verification outcomes.
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span>
              Automated verifications reduce fraud. Manual overrides are logged for compliance.
            </span>
          </div>
          <button
            type="button"
            onClick={fetchRequests}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search booking, email, or status"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-72"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as VerificationStatus)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Failed to load verification requests</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <Clock className="h-5 w-5 animate-spin text-blue-600" />
            <span>Loading verification requests…</span>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-600">No verification requests match the current filters.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <article
              key={request.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-500">
                      Booking #{request.bookingNumber}
                    </span>
                    <StatusBadge status={request.status} />
                    <span className="text-xs text-gray-400">
                      Attempt #{request.attemptNumber} · {request.createdAt.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{request.customerName}</span>
                      <span className="text-gray-400">•</span>
                      <span>{request.customerEmail}</span>
                      {request.customerPhone && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span>{request.customerPhone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(request);
                      setOverrideNotes('');
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    View details
                  </button>
                </div>
              </div>

              {request.result && (
                <div className="mt-4 grid gap-4 rounded-md border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600 md:grid-cols-3">
                  <div>
                    <p className="font-semibold text-gray-800">Document status</p>
                    <p className="mt-1 capitalize">{request.result.documentStatus ?? 'unknown'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Face match</p>
                    <p className="mt-1">
                      {typeof request.result.faceMatchScore === 'number'
                        ? `${(request.result.faceMatchScore * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Document sharpness</p>
                    <p className="mt-1">
                      {request.result?.documentLivenessScore != null &&
                      typeof request.result?.documentLivenessScore === 'number'
                        ? `${((request.result?.documentLivenessScore ?? 0) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Liveness score</p>
                    <p className="mt-1">
                      {typeof request.result.faceLivenessScore === 'number'
                        ? `${(request.result.faceLivenessScore * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                  {request.result.failureReasons.length > 0 && (
                    <div className="md:col-span-3">
                      <p className="font-semibold text-gray-800">Failure reasons</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {request.result.failureReasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {selected && (
        <AdminModal
          isOpen={!!selected}
          onClose={() => {
            setSelected(null);
            setOverrideNotes('');
          }}
          title={`Review Request #${selected.id.slice(0, 8)}`}
          maxWidth="6xl"
        >
          <div className="p-5">
            <p className="mb-4 text-sm text-gray-500">
              Booking #{selected.bookingNumber} · Attempt {selected.attemptNumber} ·{' '}
              {selected.createdAt.toLocaleString()}
            </p>
            <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
              <div>
                <p className="font-semibold text-gray-900">Customer</p>
                <p>{selected.customerName}</p>
                <p className="text-gray-500">{selected.customerEmail}</p>
                {selected.customerPhone && (
                  <p className="text-gray-500">{selected.customerPhone}</p>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Consent</p>
                <p>{selected.consentMethod ?? 'N/A'}</p>
                <p className="text-gray-500">
                  {selected.consentRecordedAt
                    ? `Recorded ${selected.consentRecordedAt.toLocaleString()}`
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Current status</p>
                <StatusBadge status={selected.status} />
              </div>
              {selected.result && (
                <div className="md:col-span-2 space-y-1.5">
                  <p className="font-semibold text-gray-900">Automation summary</p>
                  <div className="grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-2.5 text-sm text-gray-700 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">
                          Document status
                        </dt>
                        <dd className="font-semibold capitalize">
                          {selected.result.documentStatus ?? 'unknown'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">
                          Face match score
                        </dt>
                        <dd className="font-semibold">
                          {typeof selected.result.faceMatchScore === 'number'
                            ? `${(selected.result.faceMatchScore * 100).toFixed(1)}%`
                            : 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">
                          Document sharpness
                        </dt>
                        <dd className="font-semibold">
                          {typeof selected.result.documentLivenessScore === 'number'
                            ? `${(selected.result.documentLivenessScore * 100).toFixed(1)}%`
                            : 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">
                          Selfie sharpness
                        </dt>
                        <dd className="font-semibold">
                          {typeof selected.result.faceLivenessScore === 'number'
                            ? `${(selected.result.faceLivenessScore * 100).toFixed(1)}%`
                            : 'N/A'}
                        </dd>
                      </div>
                    </div>
                  </div>
                )}

              {automationScores && (
                <div className="md:col-span-2 mt-2 rounded-md border border-blue-100 bg-blue-50 p-2.5 text-sm text-blue-900">
                  <p className="font-semibold text-blue-900">Local automation details</p>
                  <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-blue-700">
                          Face match
                        </dt>
                        <dd className="font-semibold">
                          {typeof automationScores.faceMatchScore === 'number'
                            ? `${(automationScores.faceMatchScore * 100).toFixed(1)}%`
                            : 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-blue-700">
                          Document sharpness
                        </dt>
                        <dd className="font-semibold">
                          {typeof automationScores.documentSharpnessScore === 'number'
                            ? `${(automationScores.documentSharpnessScore * 100).toFixed(1)}%`
                            : 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-blue-700">
                          Selfie sharpness
                        </dt>
                        <dd className="font-semibold">
                          {typeof automationScores.selfieSharpnessScore === 'number'
                            ? `${(automationScores.selfieSharpnessScore * 100).toFixed(1)}%`
                            : 'N/A'}
                        </dd>
                      </div>
                    </div>
                    {localAutomationInfo.processedAt && (
                      <p className="mt-2 text-xs text-blue-700">
                        Processed {new Date(localAutomationInfo.processedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

            {selected.result?.failureReasons.length ? (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
                <p className="font-semibold">Why automated checks flagged this ID:</p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                    {selected.result.failureReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

            {selected.result?.extractedFields && (
              <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-2.5 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Extracted fields</p>
                <dl className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                    {Object.entries(selected.result.extractedFields).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">{key}</dt>
                        <dd className="text-sm text-gray-800">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-900">Artefact previews</h3>
              {artefactError && <p className="mt-1 text-xs text-red-600">{artefactError}</p>}
              <div className="mt-2 grid gap-3 md:grid-cols-3">
                  {renderPreview('Licence front', artefactUrls.front)}
                  {renderPreview('Licence back', artefactUrls.back)}
                  {renderPreview('Selfie', artefactUrls.selfie)}
                </div>
              </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Reviewer notes</label>
              <textarea
                value={overrideNotes}
                onChange={(event) => setOverrideNotes(event.target.value)}
                rows={3}
                placeholder="Add context for this decision. These notes are stored in the audit log."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject();
                }}
                disabled={submittingAction}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Reject Request
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove();
                }}
                disabled={submittingAction}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Request
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();
  const baseClasses =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';

  switch (normalized) {
    case 'approved':
      return (
        <span className={`${baseClasses} bg-green-100 text-green-700`}>
          <CheckCircle className="h-3 w-3" />
          Approved
        </span>
      );
    case 'manual_review':
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-700`}>
          <AlertTriangle className="h-3 w-3" />
          Manual Review
        </span>
      );
    case 'rejected':
    case 'failed':
      return (
        <span className={`${baseClasses} bg-red-100 text-red-700`}>
          <XCircle className="h-3 w-3" />
          {normalized === 'failed' ? 'Failed' : 'Rejected'}
        </span>
      );
    case 'processing':
    default:
      return (
        <span className={`${baseClasses} bg-blue-100 text-blue-700`}>
          <Clock className="h-3 w-3" />
          Processing
        </span>
      );
  }
}
