'use client';

import { AlertCircle, FileText, Send } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { fetchSupportTemplates, postSupportMessage } from '@/lib/api/admin/support';
import { logger } from '@/lib/logger';

interface SupportTemplate {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'note';
  subject?: string;
  body: string;
  created_at: string;
}

interface MessageComposerProps {
  ticketId: string;
  onMessageSent: () => void;
  customerName?: string;
  ticketNumber?: string;
}

export default function MessageComposer({
  ticketId,
  onMessageSent,
  customerName,
  ticketNumber,
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [templates, setTemplates] = useState<SupportTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await fetchSupportTemplates();
        setTemplates((data as SupportTemplate[]) || []);
      } catch (err) {
        logger.warn(
          'Failed to load templates',
          { component: 'MessageComposer', action: 'load_templates_failed' },
          err instanceof Error ? err : undefined
        );
        // Don't show error to user, templates are optional
      }
    };
    loadTemplates();
  }, []);

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        let body = template.body;
        // Replace template variables
        if (customerName) {
          body = body.replace(/{customerName}/g, customerName);
        }
        if (ticketNumber) {
          body = body.replace(/{ticketNumber}/g, ticketNumber);
        }
        setMessage(body);
        setSelectedTemplateId(templateId);
        setShowTemplates(false);
      }
    },
    [templates, customerName, ticketNumber]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!message.trim()) {
        setError('Message cannot be empty');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        await postSupportMessage(ticketId, {
          message: message.trim(),
          internal: isInternal,
        });

        // Clear form
        setMessage('');
        setSelectedTemplateId('');
        setIsInternal(false);

        // Notify parent
        onMessageSent();
      } catch (err) {
        logger.error(
          'Failed to send support message',
          { component: 'MessageComposer', action: 'send_failed', metadata: { ticketId } },
          err instanceof Error ? err : new Error(String(err))
        );
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setLoading(false);
      }
    },
    [message, isInternal, ticketId, onMessageSent]
  );

  const noteTemplates = templates.filter((t) => t.channel === 'note');
  const emailTemplates = templates.filter((t) => t.channel === 'email');

  return (
    <div className="space-y-4 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          {isInternal ? 'Internal Note' : 'Reply to Customer'}
        </h4>
        <div className="flex items-center gap-2">
          {templates.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                aria-label="Select template"
              >
                <FileText className="h-3 w-3" />
                Templates
              </button>
              {showTemplates && (
                <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-lg">
                  <div className="max-h-64 overflow-y-auto p-2">
                    {noteTemplates.length > 0 && (
                      <div className="mb-2">
                        <p className="px-2 py-1 text-xs font-medium text-gray-500">
                          Note Templates
                        </p>
                        {noteTemplates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => handleTemplateSelect(template.id)}
                            className={`w-full rounded px-2 py-1.5 text-left text-xs hover:bg-gray-100 ${
                              selectedTemplateId === template.id ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {emailTemplates.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-xs font-medium text-gray-500">
                          Email Templates
                        </p>
                        {emailTemplates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => handleTemplateSelect(template.id)}
                            className={`w-full rounded px-2 py-1.5 text-left text-xs hover:bg-gray-100 ${
                              selectedTemplateId === template.id ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {templates.length === 0 && (
                      <p className="px-2 py-2 text-xs text-gray-500">No templates available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Internal Note
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setError(null);
          }}
          placeholder={
            isInternal
              ? 'Add an internal note (only visible to admins)...'
              : 'Type your message to the customer...'
          }
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          aria-label={isInternal ? 'Internal note' : 'Message to customer'}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {message.length} character{message.length !== 1 ? 's' : ''}
          </p>
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {isInternal ? 'Add Note' : 'Send Message'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
