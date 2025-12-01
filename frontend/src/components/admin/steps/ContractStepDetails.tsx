'use client';

import { CheckCircle, Download, Eye, FileText, Calendar, User, XCircle, History, FolderOpen, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/utils';
import { StepHistoryTimeline } from './StepHistoryTimeline';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { AdminModal } from '@/components/admin/AdminModal';

interface ContractStepDetailsProps {
  bookingId: string;
  isExpanded: boolean;
  onDownload?: (url: string) => void;
}

interface ContractData {
  id: string;
  contractNumber: string;
  status: string;
  signedAt: string | null;
  completedAt: string | null;
  signedDocumentUrl: string | null;
  signedDocumentPath: string | null;
  documentUrl: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
  signatures: unknown;
}

export function ContractStepDetails({ bookingId, isExpanded, onDownload }: ContractStepDetailsProps) {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'files' | 'actions'>('details');
  const [regenerating, setRegenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showUpdateDateModal, setShowUpdateDateModal] = useState(false);
  const [newSigningDate, setNewSigningDate] = useState('');
  const [updatingDate, setUpdatingDate] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isExpanded || !bookingId) return;

    const fetchContract = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all contracts for this booking, then prioritize signed/completed over draft
        const { data: contracts, error: fetchError } = await supabase
          .from('contracts')
          .select('id, contractNumber, status, signedAt, completedAt, signedDocumentUrl, signedDocumentPath, documentUrl, type, createdAt, updatedAt, signatures')
          .eq('bookingId', bookingId)
          .order('createdAt', { ascending: false });

        if (fetchError) throw fetchError;

        // Prioritize contracts with files or signed status
        let selectedContract = null;
        if (contracts && contracts.length > 0) {
          // First, try to find a signed/completed contract with files
          selectedContract = contracts.find(
            c => (c.status === 'signed' || c.status === 'completed') &&
                 (c.signedDocumentUrl || c.signedDocumentPath || c.documentUrl)
          );
          // If no signed contract with files, try any contract with files
          if (!selectedContract) {
            selectedContract = contracts.find(
              c => c.signedDocumentUrl || c.signedDocumentPath || c.documentUrl
            );
          }
          // If no contract with files, just use the most recent one
          if (!selectedContract) {
            selectedContract = contracts[0];
          }
        }

        setContract(selectedContract);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load contract';
        setError(message);
        logger.error(
          'Failed to fetch contract details',
          {
            component: 'ContractStepDetails',
            action: 'fetch_error',
            metadata: { bookingId },
          },
          err instanceof Error ? err : new Error(String(err))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [bookingId, isExpanded]);

  const handleDownload = async () => {
    if (!contract?.id) return;

    try {
      const response = await fetch(`/api/admin/contracts/${contract.id}/download`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate download URL');
      }

      const data = await response.json();
      if (data.downloadUrl) {
        // Create download link
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = `contract-${contract.contractNumber || contract.id}.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        onDownload?.(data.downloadUrl);
      } else {
        throw new Error('No download URL returned');
      }
    } catch (err) {
      logger.error(
        'Failed to download contract',
        {
          component: 'ContractStepDetails',
          action: 'download_error',
          metadata: { bookingId, contractId: contract?.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to download contract. Please try again.');
    }
  };

  const handleRegenerateContract = async () => {
    if (!confirm('Regenerate contract? This will create a new contract document.')) {
      return;
    }

    setRegenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetchWithAuth('/api/admin/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to regenerate contract');
      }

      // Refresh contract data
      const { data, error: fetchError } = await supabase
        .from('contracts')
        .select('id, contractNumber, status, signedAt, completedAt, signedDocumentUrl, signedDocumentPath, documentUrl, type, createdAt, updatedAt, signatures')
        .eq('bookingId', bookingId)
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setContract(data);
      setSuccessMessage('Contract regenerated successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate contract';
      setError(message);
      logger.error(
        'Failed to regenerate contract',
        {
          component: 'ContractStepDetails',
          action: 'regenerate_error',
          metadata: { bookingId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setRegenerating(false);
    }
  };

  const handleCancelContract = async () => {
    if (!contract?.id) return;

    const reason = prompt('Enter cancellation reason (optional):');
    if (reason === null) return; // User cancelled

    if (!confirm('Are you sure you want to cancel this contract? This action cannot be undone.')) {
      return;
    }

    setCancelling(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetchWithAuth(`/api/admin/contracts/${contract.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'voided',
          cancellationReason: reason || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to cancel contract');
      }

      // Refresh contract data
      const { data, error: fetchError } = await supabase
        .from('contracts')
        .select('id, contractNumber, status, signedAt, completedAt, signedDocumentUrl, signedDocumentPath, documentUrl, type, createdAt, updatedAt, signatures')
        .eq('bookingId', bookingId)
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setContract(data);
      setSuccessMessage('Contract cancelled successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel contract';
      setError(message);
      logger.error(
        'Failed to cancel contract',
        {
          component: 'ContractStepDetails',
          action: 'cancel_error',
          metadata: { bookingId, contractId: contract.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleUpdateSigningDate = async () => {
    if (!newSigningDate || !contract?.id) return;

    setUpdatingDate(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetchWithAuth(`/api/admin/bookings/${bookingId}/completion-steps/contract_signed/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signingDate: newSigningDate }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update signing date');
      }

      // Refresh contract data
      const { data, error: fetchError } = await supabase
        .from('contracts')
        .select('id, contractNumber, status, signedAt, completedAt, signedDocumentUrl, signedDocumentPath, documentUrl, type, createdAt, updatedAt, signatures')
        .eq('bookingId', bookingId)
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setContract(data);
      setShowUpdateDateModal(false);
      setNewSigningDate('');
      setSuccessMessage('Signing date updated successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update signing date';
      setError(message);
      logger.error(
        'Failed to update contract signing date',
        {
          component: 'ContractStepDetails',
          action: 'update_date_error',
          metadata: { bookingId, contractId: contract.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setUpdatingDate(false);
    }
  };

  const handleView = async () => {
    if (!contract?.id) return;

    try {
      const response = await fetch(`/api/admin/contracts/${contract.id}/download`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate view URL');
      }

      const data = await response.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No view URL returned');
      }
    } catch (err) {
      logger.error(
        'Failed to view contract',
        {
          component: 'ContractStepDetails',
          action: 'view_error',
          metadata: { bookingId, contractId: contract?.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to view contract. Please try again.');
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

  if (!contract) {
    return (
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">No contract found for this booking.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    signed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    draft: 'bg-gray-100 text-gray-800',
    sent_for_signature: 'bg-yellow-100 text-yellow-800',
    voided: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab === 'details'
                ? 'border-premium-gold text-premium-gold'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4" /> Details
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab === 'history'
                ? 'border-premium-gold text-premium-gold'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <History className="h-4 w-4" /> History
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab === 'files'
                ? 'border-premium-gold text-premium-gold'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <FolderOpen className="h-4 w-4" /> Files
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab === 'actions'
                ? 'border-premium-gold text-premium-gold'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4" /> Actions
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Contract Number */}
            <div>
              <label className="text-xs font-medium text-gray-500">Contract Number</label>
              <p className="mt-1 text-sm font-semibold text-gray-900">{contract.contractNumber || 'N/A'}</p>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[contract.status] || statusColors.draft}`}>
                  {contract.status === 'signed' || contract.status === 'completed' ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  {contract.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Signed Date */}
            {contract.signedAt && (
              <div>
                <label className="text-xs font-medium text-gray-500">Signed Date</label>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                  <Calendar className="h-4 w-4" />
                  {formatDate(contract.signedAt)}
                </p>
              </div>
            )}

            {/* Completed Date */}
            {contract.completedAt && (
              <div>
                <label className="text-xs font-medium text-gray-500">Completed Date</label>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-900">
                  <CheckCircle className="h-4 w-4" />
                  {formatDate(contract.completedAt)}
                </p>
              </div>
            )}

            {/* Contract Type */}
            <div>
              <label className="text-xs font-medium text-gray-500">Type</label>
              <p className="mt-1 text-sm text-gray-900">{contract.type?.replace('_', ' ') || 'N/A'}</p>
            </div>

            {/* Created Date */}
            <div>
              <label className="text-xs font-medium text-gray-500">Created</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(contract.createdAt)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
            {(contract.signedDocumentUrl || contract.signedDocumentPath || contract.documentUrl) && (
              <>
                <button
                  onClick={handleView}
                  className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4" />
                  View Document
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </>
            )}
            {contract.signatures && typeof contract.signatures === 'object' && 'customer' in contract.signatures && (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                <FileText className="h-4 w-4" />
                Electronically Signed
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <StepHistoryTimeline bookingId={bookingId} stepType="contract_signed" />
      )}

      {activeTab === 'files' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">Contract Files</h4>
          <div className="space-y-2">
            {/* Show signed contract if we have signedDocumentUrl OR signedDocumentPath */}
            {(contract.signedDocumentUrl || contract.signedDocumentPath) && (
              <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Signed Contract</span>
                  {contract.signedDocumentPath && !contract.signedDocumentUrl && (
                    <span className="text-xs text-gray-500">(via storage path)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleView}
                    className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-3 w-3" /> View
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
              </div>
            )}
            {/* Show unsigned contract document if available and no signed version */}
            {contract.documentUrl && !contract.signedDocumentUrl && !contract.signedDocumentPath && (
              <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Contract Document (Unsigned)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleView}
                    className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-3 w-3" /> View
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
              </div>
            )}
            {!contract.signedDocumentUrl && !contract.signedDocumentPath && !contract.documentUrl && (
              <p className="text-sm text-gray-600">No files available for this contract.</p>
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
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-4 text-sm font-semibold text-gray-900">Contract Actions</h4>
            <div className="space-y-2">
              <button
                onClick={handleRegenerateContract}
                disabled={regenerating}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="h-4 w-4" />
                {regenerating ? 'Regenerating...' : 'Regenerate Contract'}
              </button>
              <button
                onClick={() => {
                  setNewSigningDate(contract.signedAt ? contract.signedAt.slice(0, 10) : '');
                  setShowUpdateDateModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4" /> Update Signing Date
              </button>
              <button
                onClick={handleCancelContract}
                disabled={cancelling || contract.status === 'voided'}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="h-4 w-4" />
                {cancelling ? 'Cancelling...' : 'Cancel Contract'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Signing Date Modal */}
      {showUpdateDateModal && (
        <AdminModal
          isOpen={true}
          onClose={() => {
            setShowUpdateDateModal(false);
            setNewSigningDate('');
            setError(null);
          }}
          title="Update Signing Date"
          maxWidth="sm"
          ariaLabelledBy="update-date-title"
        >
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="signingDate" className="block text-sm font-medium text-gray-700">
                  New Signing Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="signingDate"
                  type="date"
                  value={newSigningDate}
                  onChange={(e) => setNewSigningDate(e.target.value)}
                  disabled={updatingDate}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                onClick={handleUpdateSigningDate}
                disabled={updatingDate || !newSigningDate}
                className="flex-1 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {updatingDate ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Updating...
                  </>
                ) : (
                  'Update Date'
                )}
              </button>
              <button
                onClick={() => {
                  setShowUpdateDateModal(false);
                  setNewSigningDate('');
                  setError(null);
                }}
                disabled={updatingDate}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

