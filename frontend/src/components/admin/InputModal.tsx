'use client';

import { useEffect, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  submitText?: string;
  cancelText?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'number' | 'password' | 'textarea';
  rows?: number;
  isLoading?: boolean;
}

export function InputModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  label,
  placeholder = '',
  defaultValue = '',
  submitText = 'Submit',
  cancelText = 'Cancel',
  required = false,
  type = 'text',
  rows = 4,
  isLoading = false,
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);

  // Reset value when modal opens/closes or defaultValue changes
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!required || value.trim()) {
      onSubmit(value);
      setValue('');
    }
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  const inputId = `input-modal-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth="md"
      showCloseButton={true}
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input Field */}
          <div>
            <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
              {label}
              {required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {type === 'textarea' ? (
              <textarea
                id={inputId}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                required={required}
                disabled={isLoading}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
              />
            ) : (
              <input
                id={inputId}
                type={type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={isLoading}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={isLoading || (required && !value.trim())}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{submitText}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminModal>
  );
}
