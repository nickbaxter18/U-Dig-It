'use client';

import { CheckCircle, Download, Eye, FileText, Calendar, User, XCircle, Clock, AlertTriangle, ExternalLink, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/utils';
import { StepHistoryTimeline } from './StepHistoryTimeline';
import { AdminModal } from '@/components/admin/AdminModal';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface LicenseStepDetailsProps {
  bookingId: string;
  isExpanded: boolean;
  activeTab?: 'details' | 'history' | 'files' | 'actions';
  onTabChange?: (tab: 'details' | 'history' | 'files' | 'actions') => void;
}

interface LicenseVerification {
  id: string;
  booking_id: string;
  user_id: string;
  status: 'submitted' | 'processing' | 'approved' | 'manual_review' | 'rejected' | 'failed';
  attempt_number: number;
  idkit_session_id: string | null;
  created_at: string;
  updated_at: string;
}

interface LicenseResult {
  id: string;
  request_id: string;
  document_status: 'passed' | 'failed' | 'suspected' | 'not_applicable' | null;
  document_liveness_score: number | null;
  face_liveness_score: number | null;
  face_match_score: number | null;
  extracted_fields: Record<string, unknown> | null;
  failure_reasons: string[] | null;
  processed_at: string | null;
}

interface ArtefactUrls {
  front?: string;
  back?: string;
  selfie?: string;
}

interface UserVerificationInfo {
  drivers_license_verified_at: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export function LicenseStepDetails({ bookingId, isExpanded, activeTab = 'details', onTabChange }: LicenseStepDetailsProps) {
  const [verification, setVerification] = useState<LicenseVerification | null>(null);
  const [result, setResult] = useState<LicenseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequestNewUploadModal, setShowRequestNewUploadModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestingNewUpload, setRequestingNewUpload] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [approvingVerification, setApprovingVerification] = useState(false);
  const [rejectingVerificationId, setRejectingVerificationId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [artefactUrls, setArtefactUrls] = useState<ArtefactUrls>({});
  const [artefactError, setArtefactError] = useState<string | null>(null);
  const [loadingArtefacts, setLoadingArtefacts] = useState(false);
  const [verificationMetadata, setVerificationMetadata] = useState<Record<string, unknown> | null>(null);
  const [userVerificationInfo, setUserVerificationInfo] = useState<UserVerificationInfo | null>(null);

  useEffect(() => {
    if (!isExpanded || !bookingId) return;

    const fetchVerification = async () => {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Get the booking's customer ID and user verification status
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('customerId, customer:customerId(id, email, firstName, lastName, drivers_license_verified_at)')
          .eq('id', bookingId)
          .single();

        if (bookingError) throw bookingError;

        const customerId = bookingData?.customerId;
        const customer = bookingData?.customer as unknown as UserVerificationInfo | null;

        if (customer) {
          setUserVerificationInfo(customer);
        }

        if (!customerId) {
          throw new Error('Booking has no associated customer');
        }

        // Step 2: Fetch verification by USER ID (account-based), not booking_id
        // This ensures we show verification files regardless of which booking they were uploaded for
        // Prioritize approved verifications with metadata (files)
        const { data: verificationData, error: verificationError } = await supabase
          .from('id_verification_requests')
          .select('id, booking_id, user_id, status, attempt_number, idkit_session_id, metadata, created_at, updated_at')
          .eq('user_id', customerId)
          .order('status', { ascending: false }) // 'approved' comes before others alphabetically with desc
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (verificationError) throw verificationError;
        setVerification(verificationData);
        setVerificationMetadata(verificationData?.metadata as Record<string, unknown> | null);

        // Fetch verification result if exists (using snake_case column names)
        if (verificationData?.id) {
          const { data: resultData, error: resultError } = await supabase
            .from('id_verification_results')
            .select('id, request_id, document_status, document_liveness_score, face_liveness_score, face_match_score, extracted_fields, failure_reasons, processed_at')
            .eq('request_id', verificationData.id)
            .maybeSingle();

          if (resultError && resultError.code !== 'PGRST116') throw resultError; // PGRST116 = no rows returned
          setResult(resultData || null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load license verification';
        setError(message);
        logger.error(
          'Failed to fetch license verification',
          {
            component: 'LicenseStepDetails',
            action: 'fetch_error',
            metadata: { bookingId },
          },
          err instanceof Error ? err : new Error(String(err))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [bookingId, isExpanded]);

  // Load artefact URLs when verification is loaded OR when user is verified at account level
  useEffect(() => {
    let isActive = true;

    const loadArtefacts = async () => {
      setLoadingArtefacts(true);
      setArtefactError(null);

      const createUrl = async (path?: string | null) => {
        if (!path) return undefined;
        const { data, error: signedUrlError } = await supabase.storage
          .from('idkit-intake')
          .createSignedUrl(path, 60 * 10); // 10 minutes
        if (signedUrlError || !data?.signedUrl) {
          throw new Error(signedUrlError?.message ?? 'Unable to generate signed URL');
        }
        return data.signedUrl;
      };

      // Case 1: Have verification record with metadata - use stored paths
      if (verification && verificationMetadata) {
        const metadata = verificationMetadata;
        const documentPath =
          typeof (metadata as { documentPath?: string })?.documentPath === 'string'
            ? (metadata as { documentPath: string }).documentPath
            : Array.isArray((metadata as { documentPaths?: string[] })?.documentPaths)
              ? ((metadata as { documentPaths: string[] }).documentPaths[0] ?? null)
              : null;
        const selfiePath =
          typeof (metadata as { selfiePath?: string })?.selfiePath === 'string'
            ? (metadata as { selfiePath: string }).selfiePath
            : null;

        if (!documentPath && !selfiePath) {
          setArtefactUrls({});
          setArtefactError(null);
          setLoadingArtefacts(false);
          return;
        }

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
        return;
      }

      // Case 2: No verification record but user is verified - search storage directly
      if (!verification && userVerificationInfo?.drivers_license_verified_at) {
        try {
          // Get the customer ID from the booking
          const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .select('customerId')
            .eq('id', bookingId)
            .single();

          if (bookingError || !bookingData?.customerId) {
            throw new Error('Could not find customer ID');
          }

          const customerId = bookingData.customerId;

          // List files in the idkit-intake bucket for this user
          // Files are stored at: {user_id}/{session_id}/{file_type}_{timestamp}.jpg
          const { data: files, error: listError } = await supabase.storage
            .from('idkit-intake')
            .list(customerId, {
              limit: 100,
              sortBy: { column: 'created_at', order: 'desc' },
            });

          if (listError) {
            throw new Error(listError.message);
          }

          if (!files || files.length === 0) {
            if (!isActive) return;
            setArtefactUrls({});
            setArtefactError(null);
            setLoadingArtefacts(false);
            return;
          }

          // Files are in subdirectories (session folders), so we need to search them
          // Get the most recent session folder
          const sessionFolders = files.filter((f) => f.id === null); // Folders have null id

          let documentFrontPath: string | null = null;
          let selfiePath: string | null = null;

          // Search through session folders (most recent first)
          for (const folder of sessionFolders) {
            const { data: sessionFiles, error: sessionError } = await supabase.storage
              .from('idkit-intake')
              .list(`${customerId}/${folder.name}`, {
                limit: 50,
                sortBy: { column: 'created_at', order: 'desc' },
              });

            if (sessionError || !sessionFiles) continue;

            // Look for documentFront and selfie files
            for (const file of sessionFiles) {
              if (!documentFrontPath && file.name.startsWith('documentFront_')) {
                documentFrontPath = `${customerId}/${folder.name}/${file.name}`;
              }
              if (!selfiePath && file.name.startsWith('selfie_')) {
                selfiePath = `${customerId}/${folder.name}/${file.name}`;
              }
              // Found both, stop searching
              if (documentFrontPath && selfiePath) break;
            }

            // Found both files, stop searching folders
            if (documentFrontPath && selfiePath) break;
          }

          if (!documentFrontPath && !selfiePath) {
            if (!isActive) return;
            setArtefactUrls({});
            setArtefactError(null);
            setLoadingArtefacts(false);
            return;
          }

          const [frontUrl, selfieUrl] = await Promise.all([
            createUrl(documentFrontPath),
            createUrl(selfiePath),
          ]);

          if (!isActive) return;
          setArtefactUrls({
            front: frontUrl,
            selfie: selfieUrl,
          });
        } catch (loadError) {
          if (!isActive) return;
          logger.error(
            'Failed to load artefacts from storage',
            {
              component: 'LicenseStepDetails',
              action: 'load_artefacts_error',
              metadata: { bookingId },
            },
            loadError instanceof Error ? loadError : new Error(String(loadError))
          );
          setArtefactError(loadError instanceof Error ? loadError.message : String(loadError));
          setArtefactUrls({});
        } finally {
          if (isActive) {
            setLoadingArtefacts(false);
          }
        }
        return;
      }

      // Case 3: No verification and no account-level verification - nothing to show
      setArtefactUrls({});
      setArtefactError(null);
      setLoadingArtefacts(false);
    };

    loadArtefacts();

    return () => {
      isActive = false;
    };
  }, [verification, verificationMetadata, userVerificationInfo?.drivers_license_verified_at, bookingId]);

  if (!isExpanded) return null;

  if (loading) {
    return (
      <div className="mt-4 flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-premium-gold border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    submitted: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    manual_review: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
  };

  const tabs = [
    { id: 'details' as const, label: 'Details', icon: FileText },
    { id: 'history' as const, label: 'History', icon: Clock },
    { id: 'files' as const, label: 'Files', icon: Download },
    { id: 'actions' as const, label: 'Actions', icon: CheckCircle },
  ];

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-premium-gold text-premium-gold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          {!verification ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {userVerificationInfo?.drivers_license_verified_at ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">User Account Verified</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {userVerificationInfo.firstName} {userVerificationInfo.lastName} ({userVerificationInfo.email}) was verified on{' '}
                    <span className="font-medium">{formatDate(userVerificationInfo.drivers_license_verified_at)}</span>.
                  </p>
                  <p className="text-xs text-gray-500">
                    This user&apos;s license was verified at the account level. No booking-specific verification files are available.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No license verification found for this booking.</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">License Verification</h4>
                  <p className="text-sm text-gray-600">Attempt #{verification.attempt_number}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[verification.status] || statusColors.submitted}`}>
                  {verification.status === 'approved' ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : verification.status === 'rejected' || verification.status === 'failed' ? (
                    <XCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <Clock className="mr-1 h-3 w-3" />
                  )}
                  {verification.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{verification.status.replace('_', ' ').toUpperCase()}</p>
                </div>

                {verification.idkit_session_id && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Session ID</label>
                    <p className="mt-1 text-sm font-mono text-gray-900">{verification.idkit_session_id}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500">Submitted</label>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                    <Calendar className="h-4 w-4" />
                    {formatDate(verification.created_at)}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                    <Calendar className="h-4 w-4" />
                    {formatDate(verification.updated_at)}
                  </p>
                </div>
              </div>

              {result && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h5 className="mb-2 text-sm font-semibold text-gray-900">Verification Results</h5>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {result.document_status && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Document Status</label>
                        <p className="mt-1 text-sm text-gray-900">{result.document_status.toUpperCase()}</p>
                      </div>
                    )}

                    {result.document_liveness_score !== null && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Document Liveness Score</label>
                        <p className="mt-1 text-sm text-gray-900">{(result.document_liveness_score * 100).toFixed(1)}%</p>
                      </div>
                    )}

                    {result.face_liveness_score !== null && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Face Liveness Score</label>
                        <p className="mt-1 text-sm text-gray-900">{(result.face_liveness_score * 100).toFixed(1)}%</p>
                      </div>
                    )}

                    {result.face_match_score !== null && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Face Match Score</label>
                        <p className="mt-1 text-sm text-gray-900">{(result.face_match_score * 100).toFixed(1)}%</p>
                      </div>
                    )}

                    {result.processed_at && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Processed</label>
                        <p className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                          <Calendar className="h-4 w-4" />
                          {formatDate(result.processed_at)}
                        </p>
                      </div>
                    )}
                  </div>

                  {result.failure_reasons && result.failure_reasons.length > 0 && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-xs font-semibold text-red-800">Failure Reasons</p>
                          <ul className="mt-1 list-disc list-inside text-xs text-red-700">
                            {result.failure_reasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.extracted_fields && Object.keys(result.extracted_fields).length > 0 && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h5 className="mb-2 text-sm font-semibold text-gray-900">Extracted Information</h5>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <pre className="text-xs text-gray-700 overflow-auto">
                          {JSON.stringify(result.extracted_fields, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <StepHistoryTimeline bookingId={bookingId} stepType="license_uploaded" />
      )}

      {activeTab === 'files' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">License Verification Files</h4>
          {!verification && !userVerificationInfo?.drivers_license_verified_at ? (
            <p className="text-sm text-gray-600">No verification request found.</p>
          ) : !verification && userVerificationInfo?.drivers_license_verified_at ? (
            // Account-level verification - show files loaded from storage
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Account Verified on {formatDate(userVerificationInfo.drivers_license_verified_at)}
                </span>
              </div>
              
              {/* Artefact Previews - loaded from storage */}
              {loadingArtefacts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-premium-gold border-t-transparent"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading verification files...</span>
                </div>
              ) : artefactError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs text-red-600">{artefactError}</p>
                </div>
              ) : (artefactUrls.front || artefactUrls.selfie) ? (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">ID Verification Images</h5>
                  <div className="grid gap-3 md:grid-cols-2">
                    {/* Licence Front */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Driver&apos;s License (Front)</p>
                      <div className="h-40 w-full overflow-hidden rounded-md bg-white border border-gray-100">
                        {artefactUrls.front ? (
                          <img src={artefactUrls.front} alt="License front preview" className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            No preview available
                          </div>
                        )}
                      </div>
                      {artefactUrls.front && (
                        <a
                          href={artefactUrls.front}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <Eye className="h-3 w-3" /> Open full image
                        </a>
                      )}
                    </div>

                    {/* Selfie */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Selfie Verification</p>
                      <div className="h-40 w-full overflow-hidden rounded-md bg-white border border-gray-100">
                        {artefactUrls.selfie ? (
                          <img src={artefactUrls.selfie} alt="Selfie preview" className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            No preview available
                          </div>
                        )}
                      </div>
                      {artefactUrls.selfie && (
                        <a
                          href={artefactUrls.selfie}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <Eye className="h-3 w-3" /> Open full image
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  No verification files found in storage for this user.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Artefact Previews */}
              {(artefactUrls.front || artefactUrls.selfie || loadingArtefacts) && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">ID Verification Images</h5>
                  {artefactError && (
                    <p className="text-xs text-red-600">{artefactError}</p>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    {/* Licence Front */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Driver&apos;s License (Front)</p>
                      <div className="h-40 w-full overflow-hidden rounded-md bg-white border border-gray-100">
                        {loadingArtefacts ? (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            <Clock className="h-5 w-5 animate-spin" />
                          </div>
                        ) : artefactUrls.front ? (
                          <img src={artefactUrls.front} alt="License front preview" className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            No preview available
                          </div>
                        )}
                      </div>
                      {artefactUrls.front && (
                        <a
                          href={artefactUrls.front}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <Eye className="h-3 w-3" /> Open full image
                        </a>
                      )}
                    </div>

                    {/* Selfie */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Selfie Verification</p>
                      <div className="h-40 w-full overflow-hidden rounded-md bg-white border border-gray-100">
                        {loadingArtefacts ? (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            <Clock className="h-5 w-5 animate-spin" />
                          </div>
                        ) : artefactUrls.selfie ? (
                          <img src={artefactUrls.selfie} alt="Selfie preview" className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            No preview available
                          </div>
                        )}
                      </div>
                      {artefactUrls.selfie && (
                        <a
                          href={artefactUrls.selfie}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <Eye className="h-3 w-3" /> Open full image
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* IDKit Session Info */}
              {verification.idkit_session_id && (
                <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-900">IDKit Session: {verification.idkit_session_id}</span>
                  </div>
                  <button
                    onClick={() => window.open(`https://id.worldcoin.org/sessions/${verification.idkit_session_id}`, '_blank', 'noopener,noreferrer')}
                    className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <ExternalLink className="h-3 w-3" /> View Session
                  </button>
                </div>
              )}

              {/* Extracted License Data */}
              {result?.extracted_fields && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Extracted License Data</p>
                  <pre className="text-xs text-gray-700 overflow-auto max-h-64">
                    {JSON.stringify(result.extracted_fields, null, 2)}
                  </pre>
                </div>
              )}

              {/* No Files Message */}
              {!verification.idkit_session_id && !result?.extracted_fields && !artefactUrls.front && !artefactUrls.selfie && !loadingArtefacts && (
                <p className="text-sm text-gray-600">No files or data available for this verification.</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">Available Actions</h4>
          {!verification ? (
            <p className="text-sm text-gray-600">No verification request found.</p>
          ) : (
            <div className="space-y-2">
              {(verification.status === 'pending' || verification.status === 'manual_review' || verification.status === 'processing') && (
                <>
                  <button
                    onClick={async () => {
                      if (!verification) return;
                      setApprovingVerification(true);
                      setError(null);
                      try {
                        const response = await fetchWithAuth(`/api/admin/bookings/${bookingId}/completion-steps/license_uploaded/approve`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ notes: 'Manually approved by admin' }),
                        });
                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          throw new Error(errorData.error || 'Failed to approve verification');
                        }

                        // Refresh verification data
                        const { data: verificationData } = await supabase
                          .from('id_verification_requests')
                          .select('id, booking_id, user_id, status, attempt_number, idkit_session_id, created_at, updated_at')
                          .eq('booking_id', bookingId)
                          .order('created_at', { ascending: false })
                          .limit(1)
                          .maybeSingle();

                        if (verificationData) {
                          setVerification(verificationData);
                        }

                        setSuccessMessage('License verification approved successfully');
                        setTimeout(() => setSuccessMessage(null), 5000);
                      } catch (err) {
                        const message = err instanceof Error ? err.message : 'Failed to approve verification';
                        setError(message);
                        logger.error('Failed to approve license verification', {
                          component: 'LicenseStepDetails',
                          action: 'approve_error',
                          metadata: { bookingId, verificationId: verification.id },
                        }, err instanceof Error ? err : new Error(String(err)));
                      } finally {
                        setApprovingVerification(false);
                      }
                    }}
                    disabled={approvingVerification}
                    className="w-full flex items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {approvingVerification ? 'Approving...' : 'Approve Manually'}
                  </button>
                  <button
                    onClick={() => {
                      if (!verification) return;
                      setRejectingVerificationId(verification.id);
                      setRejectionReason('');
                      setShowRejectModal(true);
                    }}
                    disabled={rejectingVerificationId === verification.id}
                    className="w-full flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-4 w-4" /> Reject Manually
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setRequestMessage('');
                  setShowRequestNewUploadModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" /> Request New Upload
              </button>
            </div>
          )}
        </div>
      )}

      {/* Request New Upload Modal */}
      {showRequestNewUploadModal && (
        <AdminModal
          isOpen={true}
          onClose={() => {
            setShowRequestNewUploadModal(false);
            setRequestMessage('');
            setError(null);
          }}
          title="Request New License Upload"
          maxWidth="md"
          ariaLabelledBy="request-upload-title"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!requestMessage.trim()) return;

              setRequestingNewUpload(true);
              setError(null);
              setSuccessMessage(null);

              try {
                // Get booking info
                const { data: bookingData } = await supabase
                  .from('bookings')
                  .select('customerId, bookingNumber')
                  .eq('id', bookingId)
                  .single();

                if (bookingData?.customerId) {
                  // Create notification for new ID verification upload
                  await supabase.from('notifications').insert({
                    userId: bookingData.customerId,
                    category: 'booking',
                    priority: 'high',
                    title: 'License Verification Required',
                    message: requestMessage.trim() || 'Please complete a new license verification upload for your booking.',
                    actionUrl: `/dashboard/bookings/${bookingId}`,
                    metadata: {
                      bookingId,
                      bookingNumber: bookingData.bookingNumber,
                      type: 'license_verification_required',
                    },
                    status: 'pending',
                  });

                  setShowRequestNewUploadModal(false);
                  setRequestMessage('');
                  setSuccessMessage('Customer notification sent successfully');
                  setTimeout(() => setSuccessMessage(null), 5000);
                } else {
                  throw new Error('Booking not found');
                }
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to request new upload';
                setError(message);
                logger.error(
                  'Failed to request new license upload',
                  {
                    component: 'LicenseStepDetails',
                    action: 'request_new_upload_error',
                    metadata: { bookingId },
                  },
                  err instanceof Error ? err : new Error(String(err))
                );
              } finally {
                setRequestingNewUpload(false);
              }
            }}
            className="p-6"
          >
            <div className="mb-4">
              <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="requestMessage" className="block text-sm font-medium text-gray-700">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="requestMessage"
                  rows={4}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  disabled={requestingNewUpload}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter message requesting new license verification upload..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  This message will be sent to the customer to request a new license verification upload.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={requestingNewUpload || !requestMessage.trim()}
                className="flex-1 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {requestingNewUpload ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Upload className="inline-block h-4 w-4 mr-2" />
                    Request New Upload
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRequestNewUploadModal(false);
                  setRequestMessage('');
                  setError(null);
                }}
                disabled={requestingNewUpload}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {successMessage && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && rejectingVerificationId && (
        <AdminModal
          isOpen={true}
          onClose={() => {
            setShowRejectModal(false);
            setRejectingVerificationId(null);
            setRejectionReason('');
            setError(null);
          }}
          title="Reject License Verification"
          maxWidth="sm"
          ariaLabelledBy="reject-verification-title"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!rejectionReason.trim()) {
                setError('Please provide a rejection reason.');
                return;
              }

              setError(null);
              try {
                const response = await fetchWithAuth(`/api/admin/bookings/${bookingId}/completion-steps/license_uploaded/reject`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reason: rejectionReason.trim(), notes: '' }),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || 'Failed to reject verification');
                }

                // Refresh verification data
                const { data: verificationData } = await supabase
                  .from('id_verification_requests')
                  .select('id, booking_id, user_id, status, attempt_number, idkit_session_id, created_at, updated_at')
                  .eq('booking_id', bookingId)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();

                if (verificationData) {
                  setVerification(verificationData);
                }

                setShowRejectModal(false);
                setRejectingVerificationId(null);
                setRejectionReason('');
                setSuccessMessage('License verification rejected successfully');
                setTimeout(() => setSuccessMessage(null), 5000);
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to reject verification';
                setError(message);
                logger.error('Failed to reject license verification', {
                  component: 'LicenseStepDetails',
                  action: 'reject_error',
                  metadata: { bookingId, verificationId: rejectingVerificationId },
                }, err instanceof Error ? err : new Error(String(err)));
              }
            }}
            className="p-6"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="rejectionReason"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="Enter reason for rejection..."
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={!rejectionReason.trim()}
                className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Reject Verification
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingVerificationId(null);
                  setRejectionReason('');
                  setError(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}

