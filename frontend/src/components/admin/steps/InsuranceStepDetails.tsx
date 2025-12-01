'use client';

import { CheckCircle, Download, Eye, FileText, Calendar, User, XCircle, Shield, AlertTriangle, Clock, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/utils';
import { StepHistoryTimeline } from './StepHistoryTimeline';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { RequestNewInsuranceDocumentModal } from './RequestNewInsuranceDocumentModal';
import { useAdminToast } from '@/components/admin/AdminToastProvider';

interface InsuranceStepDetailsProps {
  bookingId: string;
  isExpanded: boolean;
  activeTab?: 'details' | 'history' | 'files' | 'actions';
  onTabChange?: (tab: 'details' | 'history' | 'files' | 'actions') => void;
}

interface InsuranceDocument {
  id: string;
  documentNumber: string;
  type: 'coi' | 'binder' | 'policy' | 'endorsement';
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
  insuranceCompany: string | null;
  policyNumber: string | null;
  effectiveDate: string | null;
  expiresAt: string | null;
  generalLiabilityLimit: number | null;
  equipmentLimit: number | null;
  fileUrl: string;
  fileName: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function InsuranceStepDetails({ bookingId, isExpanded, activeTab = 'details', onTabChange }: InsuranceStepDetailsProps) {
  const [documents, setDocuments] = useState<InsuranceDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [approvingDocId, setApprovingDocId] = useState<string | null>(null);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRequestNewDocModal, setShowRequestNewDocModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestingNewDoc, setRequestingNewDoc] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const { success, error: showErrorToast, warning } = useAdminToast();

  useEffect(() => {
    if (!isExpanded || !bookingId) return;

    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('insurance_documents')
          .select('id, documentNumber, type, status, insuranceCompany, policyNumber, effectiveDate, expiresAt, generalLiabilityLimit, equipmentLimit, fileUrl, fileName, reviewedAt, reviewedBy, reviewNotes, createdAt, updatedAt')
          .eq('bookingId', bookingId)
          .order('createdAt', { ascending: false });

        if (fetchError) throw fetchError;
        setDocuments(data || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load insurance documents';
        setError(message);
        logger.error(
          'Failed to fetch insurance documents',
          {
            component: 'InsuranceStepDetails',
            action: 'fetch_error',
            metadata: { bookingId },
          },
          err instanceof Error ? err : new Error(String(err))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [bookingId, isExpanded]);

  const handleView = async (fileUrl: string, documentId?: string) => {
    // CRITICAL DEBUG: Log at the very start
    console.log('[handleView] CALLED with:', { fileUrl, documentId });
    logger.info('handleView CALLED', {
      component: 'InsuranceStepDetails',
      action: 'handle_view_called',
      metadata: { fileUrl: fileUrl?.substring(0, 100), documentId },
    });

    if (!fileUrl || fileUrl.trim() === '') {
      console.log('[handleView] No fileUrl, returning early');
      setError('No file available to view');
      return;
    }

    if (!documentId) {
      console.log('[handleView] No documentId, returning early');
      logger.warn('No documentId provided for view', {
        component: 'InsuranceStepDetails',
        action: 'view_no_document_id',
        metadata: { fileUrl: fileUrl.substring(0, 100) },
      });
      setError('Document ID is required to view file');
      return;
    }

    // Set loading state
    console.log('[handleView] Setting loading state');
    setViewingDocId(documentId);
    setError(null);

    try {
      let signedUrl: string | null = null;

      // Log request details
      console.log('[handleView] About to check URL format:', { startsWithHttp: fileUrl.startsWith('http') });
      logger.info('Viewing insurance document', {
        component: 'InsuranceStepDetails',
        action: 'view_request',
        metadata: {
          documentId,
          fileUrl: fileUrl.substring(0, 100),
          fileUrlLength: fileUrl.length,
          fileUrlFormat: fileUrl.startsWith('http') ? 'url' : 'path',
        },
      });

      // If it's already a full external URL (not Supabase storage), open directly
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        if (!fileUrl.includes('/storage/v1/object/') && !fileUrl.includes('supabase.co')) {
          logger.info('Opening external URL directly', {
            component: 'InsuranceStepDetails',
            action: 'external_url',
            metadata: { documentId, url: fileUrl.substring(0, 100) },
          });
          window.open(fileUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      // Use API endpoint to generate signed URL server-side (more reliable)
      const apiUrl = `/api/admin/insurance/${documentId}/view`;
      console.log('[handleView] About to call API:', apiUrl);
      logger.info('Fetching signed URL from API endpoint', {
        component: 'InsuranceStepDetails',
        action: 'fetch_signed_url_api',
        metadata: { documentId, fileUrl: fileUrl.substring(0, 100), apiUrl },
      });

      console.log('[handleView] Calling fetchWithAuth...');
      const response = await fetchWithAuth(apiUrl);
      console.log('[handleView] fetchWithAuth returned:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: { error?: string; details?: unknown } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }

        logger.error('API request failed', {
          component: 'InsuranceStepDetails',
          action: 'api_request_failed',
          metadata: {
            documentId,
            apiUrl,
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            fileUrl: fileUrl.substring(0, 100),
          },
        });

        // Provide detailed error message to user
        const errorMessage = errorData.error || `Failed to generate signed URL (${response.status})`;
        const detailsMessage = errorData.details
          ? ` Details: ${JSON.stringify(errorData.details)}`
          : '';
        throw new Error(`${errorMessage}${detailsMessage}`);
      }

      const data = await response.json();
      if (!data.url) {
        logger.error('No URL in API response', {
          component: 'InsuranceStepDetails',
          action: 'no_url_in_response',
          metadata: { documentId, responseData: data },
        });
        throw new Error('No URL returned from API');
      }

      signedUrl = data.url;
      logger.info('Successfully fetched signed URL from API', {
        component: 'InsuranceStepDetails',
        action: 'signed_url_api_success',
        metadata: { documentId, urlLength: signedUrl.length },
      });

      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('Failed to generate file URL');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to view document. Please try again.';
      logger.error(
        'Failed to view insurance document',
        {
          component: 'InsuranceStepDetails',
          action: 'view_error',
          metadata: {
            documentId,
            fileUrl: fileUrl.substring(0, 100),
            error: errorMessage,
          },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(errorMessage);
      showErrorToast('View Failed', errorMessage);
    } finally {
      // Clear loading state
      setViewingDocId(null);
    }
  };

  const handleDownload = async (documentId: string, fileName: string, fileUrl: string) => {
    try {
      setError(null);

      if (!fileUrl || fileUrl.trim() === '') {
        setError('No file available to download');
        return;
      }

      if (!documentId) {
        logger.warn('No documentId provided for download', {
          component: 'InsuranceStepDetails',
          action: 'download_no_document_id',
          metadata: { fileName, fileUrl: fileUrl.substring(0, 100) },
        });
        setError('Document ID is required to download file');
        return;
      }

      let signedUrl: string | null = null;

      // If it's already a full external URL (not Supabase storage), use it directly
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        if (!fileUrl.includes('/storage/v1/object/') && !fileUrl.includes('supabase.co')) {
          signedUrl = fileUrl;
        }
      }

      // If not an external URL, use API endpoint to generate signed URL server-side
      if (!signedUrl) {
        logger.info('Fetching signed URL from API for download', {
          component: 'InsuranceStepDetails',
          action: 'fetch_signed_url_api_download',
          metadata: { documentId, fileName, fileUrl: fileUrl.substring(0, 100) },
        });

        const response = await fetchWithAuth(`/api/admin/insurance/${documentId}/view`);

        if (!response.ok) {
          const errorText = await response.text();
          let errorData: { error?: string; details?: unknown } = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || `HTTP ${response.status}` };
          }

          logger.error('API request failed for download', {
            component: 'InsuranceStepDetails',
            action: 'api_request_failed_download',
            metadata: {
              documentId,
              status: response.status,
              statusText: response.statusText,
              error: errorData,
            },
          });

          const errorMessage = errorData.error || `Failed to generate signed URL (${response.status})`;
          const detailsMessage = errorData.details
            ? ` Details: ${JSON.stringify(errorData.details)}`
            : '';
          throw new Error(`${errorMessage}${detailsMessage}`);
        }

        const data = await response.json();
        if (!data.url) {
          logger.error('No URL in API response for download', {
            component: 'InsuranceStepDetails',
            action: 'no_url_in_response_download',
            metadata: { documentId, responseData: data },
          });
          throw new Error('No URL returned from API');
        }

        signedUrl = data.url;
      }

      if (signedUrl) {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = fileName || 'insurance-document.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        logger.info('Download initiated', {
          component: 'InsuranceStepDetails',
          action: 'download_success',
          metadata: { documentId, fileName },
        });
        success('Download Started', 'File download has been initiated');
      } else {
        throw new Error('Failed to generate file URL');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download document. Please try again.';
      logger.error(
        'Failed to download insurance document',
        {
          component: 'InsuranceStepDetails',
          action: 'download_error',
          metadata: {
            documentId,
            fileName,
            fileUrl: fileUrl.substring(0, 100),
            error: errorMessage,
          },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(errorMessage);
      showErrorToast('Download Failed', errorMessage);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setDeletingDocId(documentId);
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/admin/insurance/${documentId}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete document');
      }

      // Refresh documents
      const { data, error: fetchError } = await supabase
        .from('insurance_documents')
        .select('id, documentNumber, type, status, insuranceCompany, policyNumber, effectiveDate, expiresAt, generalLiabilityLimit, equipmentLimit, fileUrl, fileName, reviewedAt, reviewedBy, reviewNotes, createdAt, updatedAt')
        .eq('bookingId', bookingId)
        .order('createdAt', { ascending: false });

      if (!fetchError && data) {
        setDocuments(data);
      }

      setSuccessMessage('Document deleted successfully');
      success('Document Deleted', 'Insurance document has been deleted successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      setError(message);
      showErrorToast('Delete Failed', message);
      logger.error(
        'Failed to delete insurance document',
        {
          component: 'InsuranceStepDetails',
          action: 'delete_error',
          metadata: { documentId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleApprove = async (docId: string) => {
    try {
      setApprovingDocId(docId);
      const response = await fetch(`/api/admin/bookings/${bookingId}/completion-steps/insurance_uploaded/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: approvalNotes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve document');
      }

      // Refresh documents
      const { data, error: fetchError } = await supabase
        .from('insurance_documents')
        .select('id, documentNumber, type, status, insuranceCompany, policyNumber, effectiveDate, expiresAt, generalLiabilityLimit, equipmentLimit, fileUrl, fileName, reviewedAt, reviewedBy, reviewNotes, createdAt, updatedAt')
        .eq('bookingId', bookingId)
        .order('createdAt', { ascending: false });

      if (!fetchError && data) {
        setDocuments(data);
      }

      setApprovingDocId(null);
      setApprovalNotes('');
      success('Document Approved', 'Insurance document has been approved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve document. Please try again.';
      logger.error(
        'Failed to approve insurance document',
        {
          component: 'InsuranceStepDetails',
          action: 'approve_error',
          metadata: { documentId: docId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(errorMessage);
      showErrorToast('Approval Failed', errorMessage);
      setApprovingDocId(null);
    }
  };

  const handleReject = async (docId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }

    try {
      setRejectingDocId(docId);
      const response = await fetch(`/api/admin/bookings/${bookingId}/completion-steps/insurance_uploaded/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason, notes: rejectionNotes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject document');
      }

      // Refresh documents
      const { data, error: fetchError } = await supabase
        .from('insurance_documents')
        .select('id, documentNumber, type, status, insuranceCompany, policyNumber, effectiveDate, expiresAt, generalLiabilityLimit, equipmentLimit, fileUrl, fileName, reviewedAt, reviewedBy, reviewNotes, createdAt, updatedAt')
        .eq('bookingId', bookingId)
        .order('createdAt', { ascending: false });

      if (!fetchError && data) {
        setDocuments(data);
      }

      setRejectingDocId(null);
      setRejectionReason('');
      setRejectionNotes('');
      success('Document Rejected', 'Insurance document has been rejected');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject document. Please try again.';
      logger.error(
        'Failed to reject insurance document',
        {
          component: 'InsuranceStepDetails',
          action: 'reject_error',
          metadata: { documentId: docId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(errorMessage);
      showErrorToast('Rejection Failed', errorMessage);
      setRejectingDocId(null);
    }
  };

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
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-800',
  };

  const tabs = [
    { id: 'details' as const, label: 'Details', icon: FileText },
    { id: 'history' as const, label: 'History', icon: Clock },
    { id: 'files' as const, label: 'Files', icon: Download },
    { id: 'actions' as const, label: 'Actions', icon: Shield },
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
          {documents.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600">No insurance documents found for this booking.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">Document #{doc.documentNumber}</h4>
                    <p className="text-sm text-gray-600">{doc.type.toUpperCase()}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[doc.status] || statusColors.pending}`}>
                    {doc.status === 'approved' ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : doc.status === 'rejected' ? (
                      <XCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <Clock className="mr-1 h-3 w-3" />
                    )}
                    {doc.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {doc.insuranceCompany && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Insurance Company</label>
                      <p className="mt-1 text-sm text-gray-900">{doc.insuranceCompany}</p>
                    </div>
                  )}

                  {doc.policyNumber && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Policy Number</label>
                      <p className="mt-1 text-sm text-gray-900">{doc.policyNumber}</p>
                    </div>
                  )}

                  {doc.effectiveDate && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Effective Date</label>
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                        <Calendar className="h-4 w-4" />
                        {formatDate(doc.effectiveDate)}
                      </p>
                    </div>
                  )}

                  {doc.expiresAt && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Expires</label>
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                        <Calendar className="h-4 w-4" />
                        {formatDate(doc.expiresAt)}
                      </p>
                    </div>
                  )}

                  {doc.generalLiabilityLimit && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">General Liability Limit</label>
                      <p className="mt-1 text-sm text-gray-900">${doc.generalLiabilityLimit.toLocaleString()}</p>
                    </div>
                  )}

                  {doc.equipmentLimit && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Equipment Limit</label>
                      <p className="mt-1 text-sm text-gray-900">${doc.equipmentLimit.toLocaleString()}</p>
                    </div>
                  )}

                  {doc.reviewedAt && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Reviewed</label>
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                        <User className="h-4 w-4" />
                        {formatDate(doc.reviewedAt)}
                      </p>
                    </div>
                  )}

                  {doc.reviewedBy && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Reviewed By</label>
                      <p className="mt-1 text-sm text-gray-900">{doc.reviewedBy}</p>
                    </div>
                  )}
                </div>

                {doc.reviewNotes && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <label className="text-xs font-medium text-gray-500">Review Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{doc.reviewNotes}</p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
                  {doc.fileUrl && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          console.log('[Details View Button] CLICKED - doc:', { id: doc.id, fileUrl: doc.fileUrl });
                          e.preventDefault();
                          e.stopPropagation();
                          if (!doc.id) {
                            console.log('[Details View Button] No doc.id');
                            setError('Error: Document ID is missing. Please refresh the page.');
                            return;
                          }
                          if (!doc.fileUrl) {
                            console.log('[Details View Button] No doc.fileUrl');
                            setError('Error: File URL is missing.');
                            return;
                          }
                          console.log('[Details View Button] Calling handleView...');
                          handleView(doc.fileUrl, doc.id).catch((err) => {
                            console.log('[Details View Button] handleView threw error:', err);
                            logger.error('handleView error in details view button', {
                              component: 'InsuranceStepDetails',
                              action: 'view_details_button_error',
                              metadata: {
                                documentId: doc.id,
                                error: err instanceof Error ? err.message : String(err),
                              },
                            }, err instanceof Error ? err : undefined);
                          });
                        }}
                        disabled={viewingDocId === doc.id}
                        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {viewingDocId === doc.id ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            View Document
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDownload(doc.id, doc.fileName, doc.fileUrl);
                        }}
                        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </>
                  )}
                  {doc.status === 'pending' || doc.status === 'under_review' ? (
                    <>
                      <button
                        onClick={() => {
                          setApprovingDocId(doc.id);
                          setApprovalNotes('');
                        }}
                        disabled={approvingDocId === doc.id}
                        className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {approvingDocId === doc.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => {
                          setRejectingDocId(doc.id);
                          setRejectionReason('');
                          setRejectionNotes('');
                        }}
                        disabled={rejectingDocId === doc.id}
                        className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        {rejectingDocId === doc.id ? 'Rejecting...' : 'Reject'}
                      </button>
                    </>
                  ) : null}
                </div>

                {/* Approval Modal */}
                {approvingDocId === doc.id && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                    <h5 className="mb-2 text-sm font-semibold text-green-900">Approve Document</h5>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Optional approval notes..."
                      className="mb-2 w-full rounded-md border border-green-200 bg-white p-2 text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(doc.id)}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Confirm Approval
                      </button>
                      <button
                        onClick={() => {
                          setApprovingDocId(null);
                          setApprovalNotes('');
                        }}
                        className="rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Rejection Modal */}
                {rejectingDocId === doc.id && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <h5 className="mb-2 text-sm font-semibold text-red-900">Reject Document</h5>
                    <label className="mb-1 block text-xs font-medium text-red-800">
                      Rejection Reason <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Required: Explain why this document is being rejected..."
                      className="mb-2 w-full rounded-md border border-red-200 bg-white p-2 text-sm"
                      rows={3}
                      required
                    />
                    <label className="mb-1 block text-xs font-medium text-red-800">Additional Notes (Optional)</label>
                    <textarea
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="Additional notes for the customer..."
                      className="mb-2 w-full rounded-md border border-red-200 bg-white p-2 text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(doc.id)}
                        disabled={!rejectionReason.trim()}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => {
                          setRejectingDocId(null);
                          setRejectionReason('');
                          setRejectionNotes('');
                        }}
                        className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <StepHistoryTimeline bookingId={bookingId} stepType="insurance_uploaded" />
      )}

      {activeTab === 'files' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">Insurance Documents</h4>
          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-gray-600">No files uploaded.</p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.fileName || doc.originalFileName || 'Insurance Document'}</p>
                      <p className="text-xs text-gray-500">{formatDate(doc.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {doc.fileUrl && doc.fileUrl.trim() !== '' ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            console.log('[Files View Button] CLICKED - doc:', { id: doc.id, fileUrl: doc.fileUrl });
                            e.preventDefault();
                            e.stopPropagation();
                            if (!doc.id) {
                              console.log('[Files View Button] No doc.id');
                              logger.error('No document ID in view button', {
                                component: 'InsuranceStepDetails',
                                action: 'view_no_id',
                                metadata: { doc },
                              });
                              setError('Error: Document ID is missing. Please refresh the page.');
                              return;
                            }
                            if (!doc.fileUrl) {
                              console.log('[Files View Button] No doc.fileUrl');
                              logger.error('No file URL in view button', {
                                component: 'InsuranceStepDetails',
                                action: 'view_no_fileurl',
                                metadata: { docId: doc.id },
                              });
                              setError('Error: File URL is missing.');
                              return;
                            }
                            console.log('[Files View Button] Calling handleView...');
                            handleView(doc.fileUrl, doc.id).catch((err) => {
                              console.log('[Files View Button] handleView threw error:', err);
                              logger.error('handleView error in button click', {
                                component: 'InsuranceStepDetails',
                                action: 'view_button_error',
                                metadata: {
                                  documentId: doc.id,
                                  error: err instanceof Error ? err.message : String(err),
                                },
                              }, err instanceof Error ? err : undefined);
                            });
                          }}
                          disabled={viewingDocId === doc.id}
                          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={viewingDocId === doc.id ? 'Loading...' : 'View file'}
                        >
                          {viewingDocId === doc.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"></div>
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDownload(doc.id, doc.fileName, doc.fileUrl);
                          }}
                          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 px-2">No file uploaded</span>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingDocId === doc.id}
                      className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-4">
          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-4 text-sm font-semibold text-gray-900">Insurance Actions</h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setRequestMessage('');
                  setShowRequestNewDocModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Shield className="h-4 w-4" /> Request New Document
              </button>
              {documents.some(doc => doc.status === 'pending' || doc.status === 'under_review') && (
                <p className="text-xs text-gray-500 mt-2">
                  Use the Details tab to approve or reject pending documents.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request New Document Modal */}
      {showRequestNewDocModal && (
        <RequestNewInsuranceDocumentModal
          bookingId={bookingId}
          existingDocuments={documents}
          onClose={() => {
            setShowRequestNewDocModal(false);
            setRequestMessage('');
          }}
          onSubmit={async (documentId: string | null, message: string) => {
            setRequestingNewDoc(true);
            setError(null);
            setSuccessMessage(null);

            try {
              if (documentId) {
                // Request additional info on existing document
                const response = await fetchWithAuth(`/api/admin/insurance/${documentId}/request-info`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message,
                    requestedFields: [],
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || 'Failed to request document information');
                }
              } else {
                // Create notification for new document upload
                const { data: bookingData } = await supabase
                  .from('bookings')
                  .select('customerId, bookingNumber')
                  .eq('id', bookingId)
                  .single();

                if (bookingData?.customerId) {
                  await supabase.from('notifications').insert({
                    userId: bookingData.customerId,
                    category: 'booking',
                    priority: 'high',
                    title: 'Insurance Document Required',
                    message: message || 'Please upload a new insurance document for your booking.',
                    actionUrl: `/dashboard/bookings/${bookingId}`,
                    metadata: {
                      bookingId,
                      bookingNumber: bookingData.bookingNumber,
                      type: 'insurance_upload_required',
                    },
                    status: 'pending',
                  });
                }
              }

              // Refresh documents
              const { data, error: fetchError } = await supabase
                .from('insurance_documents')
                .select('id, documentNumber, type, status, insuranceCompany, policyNumber, effectiveDate, expiresAt, generalLiabilityLimit, equipmentLimit, fileUrl, fileName, reviewedAt, reviewedBy, reviewNotes, createdAt, updatedAt')
                .eq('bookingId', bookingId)
                .order('createdAt', { ascending: false });

              if (fetchError) throw fetchError;
              setDocuments(data || []);

              setShowRequestNewDocModal(false);
              setRequestMessage('');
              const successMsg = documentId ? 'Document information requested successfully' : 'Customer notification sent successfully';
              setSuccessMessage(successMsg);
              success('Request Sent', successMsg);
              setTimeout(() => setSuccessMessage(null), 5000);
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to request new document';
              setError(message);
              showErrorToast('Request Failed', message);
              logger.error(
                'Failed to request new insurance document',
                {
                  component: 'InsuranceStepDetails',
                  action: 'request_new_doc_error',
                  metadata: { bookingId, documentId },
                },
                err instanceof Error ? err : new Error(String(err))
              );
            } finally {
              setRequestingNewDoc(false);
            }
          }}
          processing={requestingNewDoc}
        />
      )}
    </div>
  );
}

