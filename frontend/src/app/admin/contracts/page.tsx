'use client';

import { formatDate } from '@/lib/utils';
import {
  CheckCircle,
  Download,
  Eye,
  FileText,
  Package,
  Search,
  Send,
  User,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { useSearchParams } from 'next/navigation';

interface Contract {
  id: string;
  contractNumber: string;
  bookingId: string;
  type: 'rental_agreement' | 'rider';
  status: 'draft' | 'sent' | 'signed' | 'voided';
  booking: {
    id: string;
    bookingNumber: string;
    customer: {
      name: string;
      email: string;
    };
    equipment: {
      name: string;
      model: string;
    };
    startDate: string;
    endDate: string;
    total: number;
  };
  documentMetadata?: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    pageCount: number;
  };
  sentAt?: string;
  signedAt?: string;
  expiresAt?: string;
  docusignEnvelopeId?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  signed: 'bg-green-100 text-green-800',
  voided: 'bg-red-100 text-red-800',
};

const statusIcons = {
  draft: FileText,
  sent: Send,
  signed: CheckCircle,
  voided: XCircle,
};

const typeColors = {
  rental_agreement: 'bg-blue-100 text-blue-800',
  rider: 'bg-purple-100 text-purple-800',
};

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const searchParams = useSearchParams();
  const bookingIdParam = useMemo(() => searchParams?.get('booking') ?? null, [searchParams]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchContracts(bookingIdParam ?? undefined);
  }, [bookingIdParam]);

  const fetchContracts = async (bookingId?: string) => {
    try {
      setLoading(true);
      const url = bookingId ? `/api/admin/contracts?booking=${bookingId}` : '/api/admin/contracts';
      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        const items: Contract[] = data.contracts || [];
        setContracts(items);

        if (bookingId && items.length > 0) {
          setSelectedContract(items[0]);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to fetch contracts:', {
          component: 'app-page',
          action: 'error',
        }, error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch =
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.booking.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.booking.customer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = typeFilter === 'all' || contract.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusUpdate = async (contractId: string, newStatus: string) => {
    try {
      const response = await fetchWithAuth(`/api/admin/contracts/${contractId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchContracts(); // Refresh the list
        setSelectedContract(null);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to update contract status:', {
          component: 'app-page',
          action: 'error',
        }, error instanceof Error ? error : new Error(String(error)));
      }
    }
  };

  const handleSendContract = async (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/admin/contracts/${contractId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: contract.booking.customer.email,
          message: `Hi ${contract.booking.customer.name}, your rental contract ${contract.contractNumber} is ready for review and signature.`,
        }),
      });

      if (response.ok) {
        await fetchContracts(); // Refresh the list
        setSelectedContract(null);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to send contract:',
          { component: 'app-page', action: 'error' },
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  };

  const handleDownloadContract = async (contractId: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Contracts] Download request', { contractId });
      }
      const response = await fetchWithAuth(`/api/admin/contracts/${contractId}/download`);
      const contentType = response.headers.get('content-type') ?? '';

      if (!response.ok) {
        const errorBody = contentType.includes('application/json') ? await response.json() : null;
        throw new Error(errorBody?.error || 'Failed to download contract');
      }

      const contract = contracts.find(c => c.id === contractId);
      const suggestedFilename = contract
        ? `${contract.contractNumber || contractId}.pdf`
        : `contract-${contractId}.pdf`;

      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.download = suggestedFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
        throw new Error('Download URL not available for this contract.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestedFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to download contract:', {
          component: 'app-page',
          action: 'error',
        }, error instanceof Error ? error : new Error(String(error)));
      }
      alert('Unable to download the contract PDF right now. Please try again later.');
    }
  };

  const handleExportContracts = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        params.set('type', typeFilter);
      }
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }
      if (bookingIdParam) {
        params.set('bookingId', bookingIdParam);
      }

      const queryString = params.toString();
      const response = await fetchWithAuth(`/api/admin/contracts/export${queryString ? `?${queryString}` : ''}`);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to export contracts');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `contracts-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (err) {
      logger.error(
        'Contracts export failed',
        { component: 'ContractsPage', action: 'export_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(err instanceof Error ? err.message : 'Failed to export contracts');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-kubota-orange h-12 w-12 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Contract Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage rental agreements and contract documents
          </p>
        </div>
        <button
          onClick={handleExportContracts}
          disabled={exporting}
          className="mt-4 inline-flex items-center space-x-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 md:mt-0"
        >
          <Download className="h-4 w-4" />
          <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                className="focus:ring-kubota-orange focus:border-kubota-orange block w-full rounded-md border-gray-300 pl-10 sm:text-sm"
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              className="focus:ring-kubota-orange focus:border-kubota-orange mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none sm:text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="signed">Signed</option>
              <option value="voided">Voided</option>
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="type"
              className="focus:ring-kubota-orange focus:border-kubota-orange mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none sm:text-sm"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="rental_agreement">Rental Agreement</option>
              <option value="rider">Rider</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredContracts.map(contract => {
            const StatusIcon = statusIcons[contract.status];
            return (
              <li key={contract.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <StatusIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-kubota-orange truncate text-sm font-medium">
                            {contract.contractNumber}
                          </p>
                          <span
                            className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[contract.status]}`}
                          >
                            {contract.status}
                          </span>
                          <span
                            className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[contract.type]}`}
                          >
                            {contract.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <User className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                          <p>{contract.booking.customer.name}</p>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Package className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                          <p>
                            {contract.booking.equipment.name} ({contract.booking.equipment.model})
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {contract.booking.bookingNumber}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(contract.createdAt)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="text-kubota-orange hover:text-kubota-orange-dark"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadContract(contract.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Contract Details Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setSelectedContract(null)}
            />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">
                      Contract Details - {selectedContract.contractNumber}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Contract Information</h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Type:</span>{' '}
                            {selectedContract.type.replace('_', ' ')}
                          </p>
                          <p>
                            <span className="font-medium">Status:</span>
                            <span
                              className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[selectedContract.status]}`}
                            >
                              {selectedContract.status}
                            </span>
                          </p>
                          <p>
                            <span className="font-medium">Created:</span>{' '}
                            {formatDate(selectedContract.createdAt)}
                          </p>
                          {selectedContract.sentAt && (
                            <p>
                              <span className="font-medium">Sent:</span>{' '}
                              {formatDate(selectedContract.sentAt)}
                            </p>
                          )}
                          {selectedContract.signedAt && (
                            <p>
                              <span className="font-medium">Signed:</span>{' '}
                              {formatDate(selectedContract.signedAt)}
                            </p>
                          )}
                          {selectedContract.expiresAt && (
                            <p>
                              <span className="font-medium">Expires:</span>{' '}
                              {formatDate(selectedContract.expiresAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900">Booking Information</h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Booking Number:</span>{' '}
                            {selectedContract.booking.bookingNumber}
                          </p>
                          <p>
                            <span className="font-medium">Customer:</span>{' '}
                            {selectedContract.booking.customer.name}
                          </p>
                          <p>
                            <span className="font-medium">Email:</span>{' '}
                            {selectedContract.booking.customer.email}
                          </p>
                          <p>
                            <span className="font-medium">Equipment:</span>{' '}
                            {selectedContract.booking.equipment.name} (
                            {selectedContract.booking.equipment.model})
                          </p>
                          <p>
                            <span className="font-medium">Rental Period:</span>{' '}
                            {formatDate(selectedContract.booking.startDate)} -{' '}
                            {formatDate(selectedContract.booking.endDate)}
                          </p>
                          <p>
                            <span className="font-medium">Total Amount:</span> $
                            {selectedContract.booking.total}
                          </p>
                        </div>
                      </div>

                      {selectedContract.documentMetadata && (
                        <div>
                          <h4 className="font-medium text-gray-900">Document Information</h4>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">File Name:</span>{' '}
                              {selectedContract.documentMetadata.fileName}
                            </p>
                            <p>
                              <span className="font-medium">File Size:</span>{' '}
                              {(selectedContract.documentMetadata.fileSize / 1024).toFixed(1)} KB
                            </p>
                            <p>
                              <span className="font-medium">Pages:</span>{' '}
                              {selectedContract.documentMetadata.pageCount}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedContract.docusignEnvelopeId && (
                        <div>
                          <h4 className="font-medium text-gray-900">DocuSign Information</h4>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">Envelope ID:</span>{' '}
                              {selectedContract.docusignEnvelopeId}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <div className="flex space-x-2">
                  {selectedContract.status === 'draft' && (
                    <button
                      onClick={() => handleSendContract(selectedContract.id)}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Send Contract
                    </button>
                  )}

                  <button
                    onClick={() => handleDownloadContract(selectedContract.id)}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Download PDF
                  </button>

                  <button
                    onClick={() => setSelectedContract(null)}
                    className="focus:ring-kubota-orange mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
