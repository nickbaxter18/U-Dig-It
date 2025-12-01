'use client';

import { Shield, XCircle } from 'lucide-react';
import { useState } from 'react';
import { AdminModal } from '@/components/admin/AdminModal';

interface InsuranceDocument {
  id: string;
  documentNumber: string;
  status: string;
}

interface RequestNewInsuranceDocumentModalProps {
  bookingId: string;
  existingDocuments: InsuranceDocument[];
  onClose: () => void;
  onSubmit: (documentId: string | null, message: string) => void;
  processing: boolean;
}

export function RequestNewInsuranceDocumentModal({
  bookingId,
  existingDocuments,
  onClose,
  onSubmit,
  processing,
}: RequestNewInsuranceDocumentModalProps) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    onSubmit(selectedDocumentId || null, message.trim());
  };

  return (
    <AdminModal
      isOpen={true}
      onClose={onClose}
      title="Request Insurance Document"
      maxWidth="md"
      ariaLabelledBy="request-insurance-title"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
        </div>

        <div className="space-y-4">
          {/* Document Selection (if existing documents) */}
          {existingDocuments.length > 0 && (
            <div>
              <label htmlFor="documentId" className="block text-sm font-medium text-gray-700">
                Request Additional Info On Existing Document (Optional)
              </label>
              <select
                id="documentId"
                value={selectedDocumentId}
                onChange={(e) => setSelectedDocumentId(e.target.value)}
                disabled={processing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Request new document upload</option>
                {existingDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.documentNumber} ({doc.status})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select an existing document to request additional information, or leave blank to request a new document upload.
              </p>
            </div>
          )}

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={processing}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder={
                selectedDocumentId
                  ? 'Enter message requesting additional information...'
                  : 'Enter message requesting new insurance document upload...'
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              {selectedDocumentId
                ? 'This message will be sent to request additional information on the selected document.'
                : 'This message will be sent to the customer to request a new insurance document upload.'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={processing || !message.trim()}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {processing ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Sending...
              </>
            ) : (
              <>
                <Shield className="inline-block h-4 w-4 mr-2" />
                {selectedDocumentId ? 'Request Information' : 'Request New Document'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

