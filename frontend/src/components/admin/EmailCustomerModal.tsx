'use client';

import {
  CheckCircle,
  Clock,
  CreditCard,
  Edit3,
  FileText,
  Heart,
  Mail,
  Send,
  X,
} from 'lucide-react';

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template_type: string;
  html_content: string;
  text_content: string;
  variables: string[];
}

interface EmailCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerEmail: string;
  customerName: string;
  bookingNumber: string;
  bookingId: string;
}

export function EmailCustomerModal({
  isOpen,
  onClose,
  customerEmail,
  customerName,
  bookingNumber,
  bookingId,
}: EmailCustomerModalProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Map template types to icons
  const getTemplateIcon = (templateType: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      booking_confirmation: CheckCircle,
      delivery_reminder: Clock,
      payment_reminder: CreditCard,
      thank_you: Heart,
      custom: Edit3,
    };

    const IconComponent = iconMap[templateType] || Mail;
    return IconComponent;
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/communications/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      logger.error(
        'Failed to fetch email templates',
        { component: 'EmailCustomerModal' },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);

    // Replace template variables
    const subjectWithVars = (template.subject || '')
      .replace(/\{\{bookingNumber\}\}/g, bookingNumber)
      .replace(/\{\{customerName\}\}/g, customerName);

    const messageWithVars = (template.text_content || template.html_content || '')
      .replace(/\{\{bookingNumber\}\}/g, bookingNumber)
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{customerEmail\}\}/g, customerEmail);

    setSubject(subjectWithVars);
    setMessage(messageWithVars);
  };

  const getPreviewHTML = () => {
    if (!selectedTemplate) return message;

    return (selectedTemplate.html_content || '')
      .replace(/\{\{bookingNumber\}\}/g, bookingNumber)
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{customerEmail\}\}/g, customerEmail);
  };

  const handleSendEmail = async () => {
    if (!subject || !message) {
      alert('Please fill in both subject and message.');
      return;
    }

    try {
      setSending(true);

      const response = await fetchWithAuth('/api/admin/bookings/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          recipientEmail: customerEmail,
          recipientName: customerName || '',
          subject,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      logger.info('Email sent successfully', {
        component: 'EmailCustomerModal',
        action: 'email_sent',
        metadata: { bookingId, customerEmail, templateType: selectedTemplate?.template_type },
      });

      alert(`✅ Email sent successfully to ${customerEmail}!`);
      onClose();
    } catch (error) {
      logger.error(
        'Failed to send email',
        { component: 'EmailCustomerModal', action: 'send_email_error', metadata: { bookingId } },
        error instanceof Error ? error : new Error(String(error))
      );
      alert('❌ Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-2xl my-8 flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Send Email to Customer</h3>
            <p className="text-sm text-gray-500">
              Recipient: {customerName} ({customerEmail})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Column - Template Selection */}
            <div>
              <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                <FileText className="mr-2 h-4 w-4 text-kubota-orange" />
                Select Email Template
              </h4>
              <div className="space-y-2">
                {templates.map((template: unknown) => {
                  const TemplateIcon = getTemplateIcon(template.template_type);
                  const isSelected = selectedTemplate?.id === template.id;

                  return (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                        isSelected
                          ? 'border-kubota-orange bg-orange-50 shadow-md ring-2 ring-kubota-orange ring-opacity-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`rounded-lg p-2 ${
                              isSelected
                                ? 'bg-kubota-orange text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <TemplateIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p
                              className={`font-medium ${
                                isSelected ? 'text-kubota-orange' : 'text-gray-900'
                              }`}
                            >
                              {template.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{template.subject}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-kubota-orange">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Custom Email Option */}
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setSubject(`Regarding Booking ${bookingNumber}`);
                    setMessage(`Dear ${customerName},\n\n`);
                  }}
                  className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                    selectedTemplate === null && (subject || message)
                      ? 'border-kubota-orange bg-orange-50 shadow-md ring-2 ring-kubota-orange ring-opacity-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`rounded-lg p-2 ${
                          selectedTemplate === null && (subject || message)
                            ? 'bg-kubota-orange text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Edit3 className="h-5 w-5" />
                      </div>
                      <div>
                        <p
                          className={`font-medium ${
                            selectedTemplate === null && (subject || message)
                              ? 'text-kubota-orange'
                              : 'text-gray-900'
                          }`}
                        >
                          Custom Email
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Write your own message</p>
                      </div>
                    </div>
                    {selectedTemplate === null && (subject || message) && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-kubota-orange">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Right Column - Email Composition */}
            <div>
              <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                <Mail className="mr-2 h-4 w-4 text-kubota-orange" />
                Email Content
              </h4>

              {/* Toggle Preview/Edit */}
              <div className="mb-4 flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setPreviewMode(false)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${
                    !previewMode
                      ? 'bg-white text-kubota-orange shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${
                    previewMode
                      ? 'bg-white text-kubota-orange shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Preview
                </button>
              </div>

              {!previewMode ? (
                <>
                  {/* Subject */}
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e: unknown) => setSubject(e.target.value)}
                      placeholder="Email subject line"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange focus:ring-opacity-50"
                    />
                  </div>

                  {/* Message */}
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      value={message}
                      onChange={(e: unknown) => setMessage(e.target.value)}
                      placeholder="Email message (you can edit the template or write your own)"
                      rows={12}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange focus:ring-opacity-50"
                    />
                  </div>

                  {/* Available Variables */}
                  <div className="rounded-md bg-blue-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-blue-900">Available Variables:</p>
                    <p className="text-xs text-blue-700">
                      <span className="font-mono">{'{{bookingNumber}}'}</span>,{' '}
                      <span className="font-mono">{'{{customerName}}'}</span>,{' '}
                      <span className="font-mono">{'{{customerEmail}}'}</span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-gray-200 bg-white p-4">
                  <h5 className="mb-2 text-sm font-semibold text-gray-900">Subject:</h5>
                  <p className="mb-4 text-sm text-gray-700">{subject}</p>

                  <h5 className="mb-2 text-sm font-semibold text-gray-900">Message:</h5>
                  {selectedTemplate ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm text-gray-700">{message}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0 bg-white rounded-b-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Sender Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Email will be sent from: no-reply@udigitrentals.ca</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-shrink-0 justify-end sm:justify-start">
              <button
                onClick={onClose}
                className="rounded-lg border-2 border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sending || !subject || !message}
                className="flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all whitespace-nowrap min-w-[140px]"
                style={{
                  backgroundColor: sending || !subject || !message ? '#9CA3AF' : '#A90F0F',
                }}
              >
                {sending ? (
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
        </div>
      </div>
    </div>
  );
}
