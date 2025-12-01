'use client';

import { Download, Mail, X } from 'lucide-react';
import { useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingNumber: string;
  customerEmail: string;
  customerName: string;
}

export function GenerateInvoiceModal({
  isOpen,
  onClose,
  bookingId,
  bookingNumber,
  customerEmail,
  customerName,
}: GenerateInvoiceModalProps) {
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      if (sendEmail) {
        // Send invoice via email
        const response = await fetchWithAuth(`/api/admin/bookings/${bookingId}/invoice/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sendEmail: true,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          // Get detailed error message from response
          let errorMessage = data.error || data.details || `Failed to send invoice (${response.status})`;

          // Handle specific error types with user-friendly messages
          if (errorMessage.includes('Maximum credits exceeded') || errorMessage.includes('quota') || errorMessage.includes('limit')) {
            errorMessage = 'SendGrid email quota exceeded. Your SendGrid account has reached its monthly email sending limit. Please upgrade your SendGrid plan or wait for the quota to reset.';
          } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            errorMessage = 'SendGrid API key is invalid or expired. Please check your EMAIL_API_KEY configuration.';
          }

          // In development, include additional error details
          if (process.env.NODE_ENV === 'development' && data.details && !errorMessage.includes(data.details)) {
            errorMessage += `: ${data.details}`;
          }
          if (data.stack && process.env.NODE_ENV === 'development') {
            console.error('Invoice send error stack:', data.stack);
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Show success message and close modal
        alert(`Invoice sent successfully to ${customerEmail}`);
        onClose();
      } else {
        // Just open invoice in new window
        window.open(
          `/api/admin/bookings/${bookingId}/invoice?mode=inline`,
          '_blank',
          'noopener,noreferrer'
        );
        onClose();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate invoice';
      setError(message);
      alert(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      showCloseButton={true}
      className="flex flex-col"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Generate Invoice</h3>
            <p className="text-sm text-gray-500">Booking #{bookingNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose how you want to generate the invoice for this booking.
            </p>

            {/* Email Option */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Send Invoice via Email</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Send the invoice directly to{' '}
                    <span className="font-medium text-gray-900">{customerName}</span> at{' '}
                    <span className="font-medium text-gray-900">{customerEmail}</span>
                  </p>
                </div>
              </label>
            </div>

            {/* Download Option */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!sendEmail}
                  onChange={(e) => setSendEmail(!e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">View/Download Invoice</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Open the invoice in a new window to view or download
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0 bg-white">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  {sendEmail ? 'Sending...' : 'Opening...'}
                </>
              ) : (
                <>
                  {sendEmail ? (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Invoice
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      View Invoice
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
