'use client';

import { useAdminToast } from './AdminToastProvider';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { Plus, Users, X, Edit2, Trash2, Loader2, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CustomerSegment {
  id: string;
  name: string;
  description: string | null;
  criteria: Record<string, any>;
  customer_count: number | null;
  avg_booking_value: number | null;
  avg_booking_frequency: number | null;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'enterprise' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomerSegmentsManagerProps {
  onSegmentChange?: () => void;
}

export function CustomerSegmentsManager({ onSegmentChange }: CustomerSegmentsManagerProps) {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useAdminToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: {
      minTotalSpent: '',
      minBookings: '',
      tags: [] as string[],
      status: [] as string[],
    },
    tier: '' as '' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'enterprise',
  });

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/admin/customers/segments');
      if (!response.ok) {
        throw new Error('Failed to load segments');
      }

      const data = await response.json();
      setSegments(data.segments || []);
    } catch (error) {
      toast.error('Failed to load segments', error instanceof Error ? error.message : 'Unable to fetch customer segments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Segment name required', 'Please enter a segment name');
      return;
    }

    setSubmitting(true);
    try {
      const criteria: Record<string, any> = {};
      if (formData.criteria.minTotalSpent) {
        criteria.minTotalSpent = parseFloat(formData.criteria.minTotalSpent);
      }
      if (formData.criteria.minBookings) {
        criteria.minBookings = parseInt(formData.criteria.minBookings);
      }
      if (formData.criteria.tags.length > 0) {
        criteria.tags = formData.criteria.tags;
      }
      if (formData.criteria.status.length > 0) {
        criteria.status = formData.criteria.status;
      }

      const response = await fetchWithAuth('/api/admin/customers/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          criteria,
          tier: formData.tier || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create segment');
      }

      toast.success('Segment created', 'Customer segment created successfully');
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        criteria: { minTotalSpent: '', minBookings: '', tags: [], status: [] },
        tier: '',
      });
      await fetchSegments();
      onSegmentChange?.();
    } catch (error) {
      toast.error('Failed to create segment', error instanceof Error ? error.message : 'Unable to create segment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/admin/customers/segments/${segmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete segment');
      }

      toast.success('Segment deleted', 'Customer segment deleted successfully');
      await fetchSegments();
      onSegmentChange?.();
    } catch (error) {
      toast.error('Failed to delete segment', error instanceof Error ? error.message : 'Unable to delete segment');
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
        <h3 className="text-lg font-semibold text-gray-900">Customer Segments</h3>
        <button
          onClick={() => {
            setEditingSegment(null);
            setFormData({
              name: '',
              description: '',
              criteria: { minTotalSpent: '', minBookings: '', tags: [], status: [] },
              tier: '',
            });
            setShowCreateModal(true);
          }}
          className="inline-flex items-center rounded-md bg-kubota-orange px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Segment
        </button>
      </div>

      {segments.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">No segments defined</p>
          <button
            onClick={() => {
              setEditingSegment(null);
              setFormData({
                name: '',
                description: '',
                criteria: { minTotalSpent: '', minBookings: '', tags: [], status: [] },
                tier: '',
              });
              setShowCreateModal(true);
            }}
            className="mt-4 text-sm text-kubota-orange hover:text-orange-600"
          >
            Create your first segment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{segment.name}</h4>
                  {segment.description && (
                    <p className="mt-1 text-sm text-gray-600">{segment.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {segment.customer_count !== null && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                        {segment.customer_count} customers
                      </span>
                    )}
                    {segment.tier && (
                      <span className="rounded-full bg-purple-50 px-2 py-1 text-purple-700 capitalize">
                        {segment.tier}
                      </span>
                    )}
                    {segment.avg_booking_value && (
                      <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">
                        ${segment.avg_booking_value.toFixed(0)} avg
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteSegment(segment.id)}
                    className="rounded-full p-1 hover:bg-red-100"
                    title="Delete segment"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Segment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900">Create Segment</h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSegment(null);
                  setFormData({
                    name: '',
                    description: '',
                    criteria: { minTotalSpent: '', minBookings: '', tags: [], status: [] },
                    tier: '',
                  });
                }}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSegment} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Segment Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g., High Value Customers, Frequent Renters"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Describe this segment..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Min Total Spent (CAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.criteria.minTotalSpent}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, minTotalSpent: e.target.value },
                    }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Min Bookings</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.criteria.minBookings}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, minBookings: e.target.value },
                    }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tier (Optional)</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value as any }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingSegment(null);
                    setFormData({
                      name: '',
                      description: '',
                      criteria: { minTotalSpent: '', minBookings: '', tags: [], status: [] },
                      tier: '',
                    });
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    'Create Segment'
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

