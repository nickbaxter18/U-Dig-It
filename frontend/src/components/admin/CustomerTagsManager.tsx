'use client';

import { Edit2, Loader2, Plus, Tag, Trash2, X } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import { useAdminToast } from './AdminToastProvider';

interface CustomerTag {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerTagsManagerProps {
  customerId?: string; // If provided, shows tags for this customer; otherwise shows all tags
  onTagChange?: () => void;
  showCreateButton?: boolean;
}

export function CustomerTagsManager({
  customerId,
  onTagChange,
  showCreateButton = true,
}: CustomerTagsManagerProps) {
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<CustomerTag | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useAdminToast();

  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6', // Default blue
    description: '',
  });

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = customerId
        ? `/api/admin/customers/${customerId}/tags`
        : '/api/admin/customer-tags';

      const response = await fetchWithAuth(endpoint);
      if (!response.ok) {
        throw new Error('Failed to load tags');
      }

      const data = await response.json();
      // Handle different response formats
      if (customerId) {
        // Customer tags endpoint returns { tags: [{ tag: {...} }] }
        setTags(data.tags?.map((item: unknown) => item.tag || item) || []);
      } else {
        // All tags endpoint returns { tags: [...] }
        setTags(data.tags || []);
      }
    } catch (error) {
      toast.error(
        'Failed to load tags',
        error instanceof Error ? error.message : 'Unable to fetch customer tags'
      );
    } finally {
      setLoading(false);
    }
  }, [customerId, toast]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Tag name required', 'Please enter a tag name');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetchWithAuth('/api/admin/customer-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tag');
      }

      toast.success('Tag created', 'Customer tag created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', color: '#3B82F6', description: '' });
      await fetchTags();
      onTagChange?.();
    } catch (error) {
      toast.error(
        'Failed to create tag',
        error instanceof Error ? error.message : 'Unable to create tag'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !formData.name.trim()) {
      toast.error('Tag name required', 'Please enter a tag name');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetchWithAuth(`/api/admin/customer-tags/${editingTag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update tag');
      }

      toast.success('Tag updated', 'Customer tag updated successfully');
      setEditingTag(null);
      setFormData({ name: '', color: '#3B82F6', description: '' });
      await fetchTags();
      onTagChange?.();
    } catch (error) {
      toast.error(
        'Failed to update tag',
        error instanceof Error ? error.message : 'Unable to update tag'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (
      !confirm('Are you sure you want to delete this tag? This will remove it from all customers.')
    ) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/admin/customer-tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tag');
      }

      toast.success('Tag deleted', 'Customer tag deleted successfully');
      await fetchTags();
      onTagChange?.();
    } catch (error) {
      toast.error(
        'Failed to delete tag',
        error instanceof Error ? error.message : 'Unable to delete tag'
      );
    }
  };

  const handleAssignTag = async (tagId: string) => {
    if (!customerId) return;

    try {
      const response = await fetchWithAuth(`/api/admin/customers/${customerId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign tag');
      }

      toast.success('Tag assigned', 'Tag assigned to customer successfully');
      await fetchTags();
      onTagChange?.();
    } catch (error) {
      toast.error(
        'Failed to assign tag',
        error instanceof Error ? error.message : 'Unable to assign tag'
      );
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!customerId) return;

    try {
      const response = await fetchWithAuth(`/api/admin/customers/${customerId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove tag');
      }

      toast.success('Tag removed', 'Tag removed from customer successfully');
      await fetchTags();
      onTagChange?.();
    } catch (error) {
      toast.error(
        'Failed to remove tag',
        error instanceof Error ? error.message : 'Unable to remove tag'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {customerId ? 'Customer Tags' : 'All Tags'}
        </h3>
        {showCreateButton && !customerId && (
          <button
            onClick={() => {
              setEditingTag(null);
              setFormData({ name: '', color: '#3B82F6', description: '' });
              setShowCreateModal(true);
            }}
            className="inline-flex items-center rounded-md bg-kubota-orange px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Tag
          </button>
        )}
      </div>

      {tags.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Tag className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">No tags found</p>
          {showCreateButton && !customerId && (
            <button
              onClick={() => {
                setEditingTag(null);
                setFormData({ name: '', color: '#3B82F6', description: '' });
                setShowCreateModal(true);
              }}
              className="mt-4 text-sm text-kubota-orange hover:text-orange-600"
            >
              Create your first tag
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group relative inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
              style={{
                backgroundColor: tag.color ? `${tag.color}20` : '#EFF6FF',
                color: tag.color || '#3B82F6',
                border: `1px solid ${tag.color || '#3B82F6'}40`,
              }}
            >
              <Tag className="mr-1 h-3 w-3" />
              {tag.name}
              {customerId && (
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-2 rounded-full p-0.5 hover:bg-red-100"
                  title="Remove tag"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {!customerId && (
                <div className="ml-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingTag(tag);
                      setFormData({
                        name: tag.name,
                        color: tag.color || '#3B82F6',
                        description: tag.description || '',
                      });
                      setShowCreateModal(true);
                    }}
                    className="rounded-full p-0.5 hover:bg-blue-100"
                    title="Edit tag"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="rounded-full p-0.5 hover:bg-red-100"
                    title="Delete tag"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Tag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTag ? 'Edit Tag' : 'Create Tag'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTag(null);
                  setFormData({ name: '', color: '#3B82F6', description: '' });
                }}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={editingTag ? handleUpdateTag : handleCreateTag}
              className="p-6 space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tag Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g., VIP, High Value, New Customer"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    className="h-10 w-20 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Describe what this tag represents..."
                />
              </div>

              <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTag(null);
                    setFormData({ name: '', color: '#3B82F6', description: '' });
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center rounded-md bg-kubota-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : editingTag ? (
                    'Update Tag'
                  ) : (
                    'Create Tag'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
