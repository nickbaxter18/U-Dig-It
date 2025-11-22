'use client';

import { Mail, Send } from 'lucide-react';

import { useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subject: string, message: string) => void;
  isLoading?: boolean;
}

export function BulkEmailModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: BulkEmailModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      return;
    }
    onSubmit(subject.trim(), message.trim());
    // Reset form
    setSubject('');
    setMessage('');
  };

  const handleClose = () => {
    setSubject('');
    setMessage('');
    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Send Bulk Email"
      maxWidth="2xl"
      showCloseButton={true}
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject */}
          <div>
            <label
              htmlFor="bulk-email-subject"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Subject *
            </label>
            <input
              id="bulk-email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              required
              disabled={isLoading}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="bulk-email-message"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Message *
            </label>
            <textarea
              id="bulk-email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Email message"
              rows={12}
              required
              disabled={isLoading}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>Email will be sent to all selected bookings</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !subject.trim() || !message.trim()}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminModal>
  );
}
