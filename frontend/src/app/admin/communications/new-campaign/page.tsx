'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { ArrowLeft, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  templateType: string;
  isActive: boolean;
}

export default function NewCampaignPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    recipientSegment: 'all',
    sendImmediately: false,
    scheduledAt: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      fetchTemplates();
    }
  }, [user, authLoading, router]);

  const fetchTemplates = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/communications/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      logger.error('Failed to fetch templates', {
        component: 'NewCampaignPage',
        action: 'fetch_templates_error'
      }, error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Campaign name is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!selectedTemplate && !formData.htmlContent.trim()) {
      newErrors.content = 'Either select a template or provide HTML content';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithAuth('/api/admin/communications/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          subject: formData.subject,
          templateId: selectedTemplate || null,
          htmlContent: formData.htmlContent || null,
          textContent: formData.textContent || null,
          recipientFilter: {
            segment: formData.recipientSegment
          },
          scheduledAt: formData.scheduledAt || null,
          sendImmediately: formData.sendImmediately
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create campaign');
      }

      const data = await response.json();

      logger.info('Campaign created successfully', {
        component: 'NewCampaignPage',
        action: 'create_campaign',
        metadata: { campaignId: data.campaign.id }
      });

      router.push('/admin/communications');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors({ general: errorMessage });
      logger.error('Failed to create campaign', {
        component: 'NewCampaignPage',
        action: 'create_campaign_error',
        metadata: { error: errorMessage }
      }, error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-kubota-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Communications
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create Email Campaign</h1>
          <p className="mt-2 text-gray-600">Send targeted emails to your customers</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-kubota-orange ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Spring Promotion 2025"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-kubota-orange ${
                errors.subject ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Special Offer: 10% Off Your Next Rental"
            />
            {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Template (Optional)
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-kubota-orange"
            >
              <option value="">-- Create from scratch --</option>
              {templates.filter(t => t.isActive).map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.templateType})
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Select a template to use its content, or create from scratch below
            </p>
          </div>

          {/* HTML Content */}
          {(!selectedTemplate || formData.htmlContent) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML Content {!selectedTemplate && '*'}
              </label>
              <textarea
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                rows={12}
                className={`w-full rounded-lg border px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-kubota-orange ${
                  errors.content ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="<html>...</html>"
              />
              {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
              <p className="mt-1 text-sm text-gray-500">
                You can use variables like {'{{customerName}}'}, {'{{bookingNumber}}'}, etc.
              </p>
            </div>
          )}

          {/* Text Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plain Text Content (Optional)
            </label>
            <textarea
              value={formData.textContent}
              onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-kubota-orange"
              placeholder="Plain text version for email clients that don't support HTML"
            />
          </div>

          {/* Recipient Segment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Segment *
            </label>
            <select
              value={formData.recipientSegment}
              onChange={(e) => setFormData({ ...formData, recipientSegment: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-kubota-orange"
            >
              <option value="all">All Customers</option>
              <option value="active">Active Customers (have bookings)</option>
              <option value="inactive">Inactive Customers (no bookings)</option>
            </select>
          </div>

          {/* Scheduling */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendImmediately"
                checked={formData.sendImmediately}
                onChange={(e) => setFormData({ ...formData, sendImmediately: e.target.checked, scheduledAt: '' })}
                className="h-4 w-4 rounded border-gray-300 text-kubota-orange focus:ring-kubota-orange"
              />
              <label htmlFor="sendImmediately" className="ml-2 text-sm font-medium text-gray-700">
                Send immediately
              </label>
            </div>

            {!formData.sendImmediately && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule for Later
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-kubota-orange"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-kubota-orange hover:bg-kubota-orange-dark text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Create Campaign
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


