'use client';

import { ArrowLeft, FileText, Save } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

export default function EditTemplatePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    templateType: 'marketing',
    htmlContent: '',
    textContent: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user && templateId) {
      fetchTemplate();
    }
  }, [user, authLoading, router, templateId, fetchTemplate]);

  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/admin/communications/templates/${templateId}`);
      if (!res.ok) throw new Error('Failed to fetch template');
      const data = await res.json();

      setFormData({
        name: data.template.name || '',
        description: data.template.description || '',
        subject: data.template.subject || '',
        templateType: data.template.templateType || 'marketing',
        htmlContent: data.template.htmlContent || '',
        textContent: data.template.textContent || '',
        isActive: data.template.isActive ?? true,
      });
    } catch (error) {
      logger.error(
        'Failed to fetch template',
        {
          component: 'EditTemplatePage',
          action: 'fetch_template_error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
      setErrors({ general: 'Failed to load template' });
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Template name is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.htmlContent.trim()) newErrors.htmlContent = 'HTML content is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      const response = await fetchWithAuth(`/api/admin/communications/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          subject: formData.subject,
          templateType: formData.templateType,
          htmlContent: formData.htmlContent,
          textContent: formData.textContent,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update template');
      }

      logger.info('Template updated successfully', {
        component: 'EditTemplatePage',
        action: 'update_template',
        metadata: { templateId },
      });

      router.push('/admin/communications');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors({ general: errorMessage });
      logger.error(
        'Failed to update template',
        {
          component: 'EditTemplatePage',
          action: 'update_template_error',
          metadata: { error: errorMessage },
        },
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setSaving(false);
    }
  };

  // Replace variables with sample data for preview
  const getPreviewContent = () => {
    let content = formData.htmlContent;
    const sampleData: Record<string, string> = {
      customerName: 'John Doe',
      bookingNumber: 'BK-2025-001',
      equipmentName: 'Kubota SVL-75',
      totalAmount: '$2,500.00',
      startDate: 'January 15, 2025',
      endDate: 'January 20, 2025',
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, value);
    });

    return content;
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-kubota-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Communications
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Email Template</h1>
          <p className="mt-2 text-gray-600">Update your email template</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-kubota-orange ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Template Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Type *
              </label>
              <select
                value={formData.templateType}
                onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-kubota-orange"
              >
                <option value="marketing">Marketing</option>
                <option value="transactional">Transactional</option>
                <option value="notification">Notification</option>
                <option value="promotional">Promotional</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-kubota-orange"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-kubota-orange ${
                errors.subject ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
          </div>

          {/* Preview Toggle */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-kubota-orange focus:ring-kubota-orange"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                Active (available for use in campaigns)
              </label>
            </div>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
          </div>

          {/* HTML Content / Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML Content * {previewMode && '(Preview Mode)'}
            </label>
            {previewMode ? (
              <div className="w-full rounded-lg border border-gray-300 bg-white p-6 min-h-[400px]">
                <div dangerouslySetInnerHTML={{ __html: getPreviewContent() }} />
              </div>
            ) : (
              <textarea
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                rows={20}
                className={`w-full rounded-lg border px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-kubota-orange ${
                  errors.htmlContent ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            )}
            {errors.htmlContent && (
              <p className="mt-1 text-sm text-red-600">{errors.htmlContent}</p>
            )}
          </div>

          {/* Text Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plain Text Content (Optional)
            </label>
            <textarea
              value={formData.textContent}
              onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
              rows={8}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-kubota-orange"
            />
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
              disabled={saving}
              className="bg-kubota-orange hover:bg-kubota-orange-dark text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Template
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
