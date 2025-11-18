'use client';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Search,
  Shield,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface InsuranceDocument {
  id: string;
  documentNumber: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  type: 'coi' | 'binder' | 'policy' | 'endorsement';
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
  insuranceCompany?: string;
  policyNumber?: string;
  effectiveDate?: Date;
  expiresAt?: Date;
  generalLiabilityLimit?: number;
  equipmentLimit?: number;
  fileUrl: string;
  fileName: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: Date;
}

export default function InsurancePage() {
  const [documents, setDocuments] = useState<InsuranceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<InsuranceDocument | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter, typeFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('insurance_documents').select(`
          id,
          documentNumber,
          bookingId,
          type,
          status,
          insuranceCompany,
          policyNumber,
          effectiveDate,
          expiresAt,
          generalLiabilityLimit,
          equipmentLimit,
          fileUrl,
          fileName,
          reviewedAt,
          reviewedBy,
          reviewNotes,
          createdAt,
          booking:bookingId (
            bookingNumber,
            customer:customerId (
              firstName,
              lastName
            )
          )
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error: queryError } = await query.order('createdAt', { ascending: false });

      if (queryError) throw queryError;

      const docsData: InsuranceDocument[] = (data || []).map((doc: any) => {
        const booking = doc.booking || {};
        const customer = booking.customer || {};
        const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';

        return {
          id: doc.id,
          documentNumber: doc.documentNumber,
          bookingId: doc.bookingId,
          bookingNumber: booking.bookingNumber || 'N/A',
          customerName,
          type: doc.type,
          status: doc.status,
          insuranceCompany: doc.insuranceCompany,
          policyNumber: doc.policyNumber,
          effectiveDate: doc.effectiveDate ? new Date(doc.effectiveDate) : undefined,
          expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : undefined,
          generalLiabilityLimit: doc.generalLiabilityLimit ? parseFloat(doc.generalLiabilityLimit) : undefined,
          equipmentLimit: doc.equipmentLimit ? parseFloat(doc.equipmentLimit) : undefined,
          fileUrl: doc.fileUrl,
          fileName: doc.fileName,
          reviewedAt: doc.reviewedAt ? new Date(doc.reviewedAt) : undefined,
          reviewedBy: doc.reviewedBy,
          reviewNotes: doc.reviewNotes,
          createdAt: new Date(doc.createdAt),
        };
      });

      setDocuments(docsData);
    } catch (err) {
      logger.error('Failed to fetch insurance documents', { component: 'InsurancePage' }, err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to fetch insurance documents');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDoc) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const supabaseClient: any = supabase;
      const { error: updateError } = await supabaseClient
        .from('insurance_documents')
        .update({
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          reviewedBy: user.id,
          reviewNotes: reviewNotes || 'Approved - All requirements met',
        })
        .eq('id', selectedDoc.id);

      if (updateError) throw updateError;

      // Update associated booking status
      const bookingClient: any = supabase;
      await bookingClient
        .from('bookings')
        .update({ status: 'insurance_verified' })
        .eq('id', selectedDoc.bookingId);

      logger.info('Insurance document approved', {
        component: 'InsurancePage',
        metadata: { documentId: selectedDoc.id, bookingId: selectedDoc.bookingId },
      });

      setShowDetails(false);
      setSelectedDoc(null);
      setReviewNotes('');
      await fetchDocuments();
      alert('✅ Insurance document approved!');
    } catch (err) {
      logger.error('Failed to approve document', {}, err instanceof Error ? err : new Error(String(err)));
      alert('Failed to approve document');
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !reviewNotes) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const supabaseClient2: any = supabase;
      const { error: updateError } = await supabaseClient2
        .from('insurance_documents')
        .update({
          status: 'rejected',
          reviewedAt: new Date().toISOString(),
          reviewedBy: user.id,
          reviewNotes: reviewNotes,
        })
        .eq('id', selectedDoc.id);

      if (updateError) throw updateError;

      logger.info('Insurance document rejected', {
        component: 'InsurancePage',
        metadata: { documentId: selectedDoc.id, reason: reviewNotes },
      });

      setShowDetails(false);
      setSelectedDoc(null);
      setReviewNotes('');
      await fetchDocuments();
      alert('❌ Insurance document rejected. Customer will be notified.');
    } catch (err) {
      logger.error('Failed to reject document', {}, err instanceof Error ? err : new Error(String(err)));
      alert('Failed to reject document');
    }
  };

  const handleExportDocuments = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        params.set('type', typeFilter);
      }

      const response = await fetchWithAuth(
        `/api/admin/insurance/export${params.toString() ? `?${params.toString()}` : ''}`
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to export documents');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `insurance-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (err) {
      logger.error(
        'Insurance export failed',
        { component: 'InsurancePage', action: 'export_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(err instanceof Error ? err.message : 'Failed to export documents');
    } finally {
      setExporting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'coi':
        return 'Certificate of Insurance';
      case 'binder':
        return 'Insurance Binder';
      case 'policy':
        return 'Insurance Policy';
      case 'endorsement':
        return 'Endorsement';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const underReviewCount = documents.filter(d => d.status === 'under_review').length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurance Verification</h1>
          <p className="text-gray-600">
            Review and approve customer insurance documents for rental compliance.
          </p>
        </div>
        <button
          onClick={handleExportDocuments}
          disabled={exporting}
          className="flex items-center space-x-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Under Review</p>
              <p className="text-2xl font-semibold text-gray-900">{underReviewCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="all">All Types</option>
          <option value="coi">Certificate of Insurance</option>
          <option value="binder">Binder</option>
          <option value="policy">Policy</option>
          <option value="endorsement">Endorsement</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer & Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Insurance Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Coverage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Expires
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <Shield className="mr-2 h-5 w-5 text-kubota-orange" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{doc.documentNumber}</div>
                        <div className="text-sm text-gray-500">{getTypeLabel(doc.type)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{doc.customerName}</div>
                    <div className="text-sm text-gray-500">Booking: {doc.bookingNumber}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {doc.insuranceCompany && (
                      <div className="text-sm text-gray-900">{doc.insuranceCompany}</div>
                    )}
                    {doc.policyNumber && (
                      <div className="text-sm text-gray-500">Policy: {doc.policyNumber}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {doc.generalLiabilityLimit && (
                      <div>GL: ${doc.generalLiabilityLimit.toLocaleString()}</div>
                    )}
                    {doc.equipmentLimit && <div>Eq: ${doc.equipmentLimit.toLocaleString()}</div>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(doc.status)}
                      <span
                        className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(doc.status)}`}
                      >
                        {doc.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {doc.expiresAt ? (
                      <div>
                        <div className="text-sm text-gray-900">
                          {doc.expiresAt.toLocaleDateString()}
                        </div>
                        {doc.expiresAt < new Date() && (
                          <div className="text-xs text-red-600">Expired!</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">N/A</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setReviewNotes(doc.reviewNotes || '');
                          setShowDetails(true);
                        }}
                        className="text-kubota-orange hover:text-orange-600"
                        title="Review Document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                        title="Download Document"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {showDetails && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Insurance Document Review - {selectedDoc.documentNumber}
                </h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedDoc(null);
                    setReviewNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Document Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Type:</strong> {getTypeLabel(selectedDoc.type)}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedDoc.status)}`}
                      >
                        {selectedDoc.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <strong>Customer:</strong> {selectedDoc.customerName}
                    </div>
                    <div>
                      <strong>Booking:</strong> {selectedDoc.bookingNumber}
                    </div>
                    <div>
                      <strong>Uploaded:</strong> {selectedDoc.createdAt.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Insurance Details</h4>
                  <div className="space-y-2 text-sm">
                    {selectedDoc.insuranceCompany && (
                      <div>
                        <strong>Company:</strong> {selectedDoc.insuranceCompany}
                      </div>
                    )}
                    {selectedDoc.policyNumber && (
                      <div>
                        <strong>Policy #:</strong> {selectedDoc.policyNumber}
                      </div>
                    )}
                    {selectedDoc.effectiveDate && (
                      <div>
                        <strong>Effective:</strong> {selectedDoc.effectiveDate.toLocaleDateString()}
                      </div>
                    )}
                    {selectedDoc.expiresAt && (
                      <div>
                        <strong>Expires:</strong> {selectedDoc.expiresAt.toLocaleDateString()}
                        {selectedDoc.expiresAt < new Date() && (
                          <span className="ml-2 text-red-600">(Expired!)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Coverage Limits</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedDoc.generalLiabilityLimit && (
                      <div className="rounded-md bg-blue-50 p-3">
                        <p className="text-xs text-gray-600">General Liability</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${selectedDoc.generalLiabilityLimit.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedDoc.equipmentLimit && (
                      <div className="rounded-md bg-green-50 p-3">
                        <p className="text-xs text-gray-600">Equipment Coverage</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${selectedDoc.equipmentLimit.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Preview */}
                <div className="md:col-span-2">
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Document</h4>
                  <div className="rounded-md border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-6 w-6 text-kubota-orange" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedDoc.fileName}</p>
                          <p className="text-xs text-gray-500">Click to view full document</p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(selectedDoc.fileUrl, '_blank')}
                        className="bg-kubota-orange rounded-md px-4 py-2 text-sm text-white hover:bg-orange-600"
                      >
                        <Download className="mr-2 inline h-4 w-4" />
                        View/Download
                      </button>
                    </div>
                  </div>
                </div>

                {/* Review Notes */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Review Notes {selectedDoc.status === 'pending' && '(Required for rejection)'}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    rows={4}
                    placeholder="Add notes about this insurance document..."
                    className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                  />
                </div>

                {selectedDoc.reviewedAt && (
                  <div className="md:col-span-2">
                    <h4 className="mb-2 text-sm font-medium text-gray-900">Review History</h4>
                    <div className="rounded-md bg-gray-50 p-3 text-sm">
                      <div>
                        <strong>Reviewed:</strong> {selectedDoc.reviewedAt.toLocaleString()}
                      </div>
                      {selectedDoc.reviewNotes && (
                        <div className="mt-2">
                          <strong>Notes:</strong> {selectedDoc.reviewNotes}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedDoc.status !== 'approved' && selectedDoc.status !== 'rejected' && (
                <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-6">
                  <button
                    onClick={handleReject}
                    className="rounded-md bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    <XCircle className="mr-2 inline h-4 w-4" />
                    Reject Document
                  </button>
                  <button
                    onClick={handleApprove}
                    className="bg-kubota-orange rounded-md px-6 py-2 text-sm font-medium text-white hover:bg-orange-600"
                  >
                    <CheckCircle className="mr-2 inline h-4 w-4" />
                    Approve Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
