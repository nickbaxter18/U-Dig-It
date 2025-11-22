'use client';

import { AlertTriangle } from 'lucide-react';

import { AdminModal } from '@/components/admin/AdminModal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const isDanger = variant === 'danger';

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      showCloseButton={true}
    >
      <div className="p-6">
        {/* Message */}
        <div className="mb-6">
          {isDanger && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-800">{message}</p>
            </div>
          )}
          {!isDanger && <p className="text-sm text-gray-700">{message}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${
              isDanger
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500'
            }`}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
