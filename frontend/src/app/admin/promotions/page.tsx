'use client';

import {
  CheckCircle,
  Copy,
  DollarSign,
  Download,
  Edit,
  Percent,
  Plus,
  Tag,
  Trash2,
  XCircle,
} from 'lucide-react';

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface DiscountCode {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed' | 'fixed_amount';
  value: number;
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser: number;
  minBookingAmount?: number;
  validFrom?: Date;
  validUntil?: Date;
  applicableEquipmentTypes?: string[];
  isActive: boolean;
  createdAt: Date;
}

export default function PromotionsPage() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'fixed_amount',
    value: 10,
    maxUses: undefined as number | undefined,
    maxUsesPerUser: 1,
    minBookingAmount: undefined as number | undefined,
    validFrom: '',
    validUntil: '',
    isActive: true,
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      const discountsData: DiscountCode[] = (data || []).map((disc: unknown) => ({
        id: disc.id,
        code: disc.code,
        name: disc.name,
        type: disc.type,
        value: parseFloat(disc.value),
        maxUses: disc.max_uses,
        usedCount: disc.used_count || 0,
        maxUsesPerUser: disc.max_uses_per_user || 1,
        minBookingAmount: disc.min_booking_amount ? parseFloat(disc.min_booking_amount) : undefined,
        validFrom: disc.valid_from ? new Date(disc.valid_from) : undefined,
        validUntil: disc.valid_until ? new Date(disc.valid_until) : undefined,
        applicableEquipmentTypes: disc.applicable_equipment_types,
        isActive: disc.is_active,
        createdAt: new Date(disc.created_at),
      }));

      setDiscounts(discountsData);
    } catch (err) {
      logger.error(
        'Failed to fetch discount codes',
        { component: 'PromotionsPage' },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to fetch discount codes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDiscount) {
        // Update
        const supabaseClient: any = supabase;
        const { error: updateError } = await supabaseClient
          .from('discount_codes')
          .update({
            name: formData.name,
            type: formData.type,
            value: formData.value,
            max_uses: formData.maxUses || null,
            max_uses_per_user: formData.maxUsesPerUser,
            min_booking_amount: formData.minBookingAmount || null,
            valid_from: formData.validFrom || null,
            valid_until: formData.validUntil || null,
            is_active: formData.isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDiscount.id);

        if (updateError) throw updateError;
        alert('✅ Discount code updated!');
      } else {
        // Create
        const supabaseClient2: any = supabase;
        const { error: insertError } = await supabaseClient2.from('discount_codes').insert({
          code: formData.code.toUpperCase(),
          name: formData.name,
          type: formData.type,
          value: formData.value,
          max_uses: formData.maxUses || null,
          max_uses_per_user: formData.maxUsesPerUser,
          min_booking_amount: formData.minBookingAmount || null,
          valid_from: formData.validFrom || null,
          valid_until: formData.validUntil || null,
          is_active: formData.isActive,
        });

        if (insertError) throw insertError;
        alert('✅ Discount code created!');
      }

      setShowAddModal(false);
      setEditingDiscount(null);
      resetForm();
      await fetchDiscounts();
    } catch (err) {
      logger.error(
        'Failed to save discount code',
        {},
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to save discount code');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'percentage',
      value: 10,
      maxUses: undefined,
      maxUsesPerUser: 1,
      minBookingAmount: undefined,
      validFrom: '',
      validUntil: '',
      isActive: true,
    });
  };

  const handleEdit = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      name: discount.name,
      type: discount.type,
      value: discount.value,
      maxUses: discount.maxUses,
      maxUsesPerUser: discount.maxUsesPerUser,
      minBookingAmount: discount.minBookingAmount,
      validFrom: discount.validFrom ? discount.validFrom.toISOString().split('T')[0] : '',
      validUntil: discount.validUntil ? discount.validUntil.toISOString().split('T')[0] : '',
      isActive: discount.isActive,
    });
    setShowAddModal(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const supabaseClient3: any = supabase;
      const { error } = await supabaseClient3
        .from('discount_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      await fetchDiscounts();
      alert(`✅ Discount code ${!currentStatus ? 'activated' : 'deactivated'}!`);
    } catch (err) {
      alert('Failed to update discount code');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`✅ Copied code: ${code}`);
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete discount code "${code}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('discount_codes').delete().eq('id', id);

      if (error) throw error;

      await fetchDiscounts();
      alert('✅ Discount code deleted!');
    } catch (err) {
      alert('Failed to delete discount code');
    }
  };

  const handleExportPromotions = async () => {
    try {
      setExporting(true);
      const response = await fetchWithAuth('/api/admin/promotions/export');
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to export promotions');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `promotions-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (err) {
      logger.error(
        'Promotions export failed',
        { component: 'PromotionsPage', action: 'export_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(err instanceof Error ? err.message : 'Failed to export promotions');
    } finally {
      setExporting(false);
    }
  };

  const activeDiscounts = discounts.filter((d) => d.isActive).length;
  const totalUses = discounts.reduce((sum: unknown, d: unknown) => sum + d.usedCount, 0);
  const totalSavings = discounts.reduce((sum: unknown, d: unknown) => {
    if (d.type === 'percentage') {
      // Can't calculate without booking data
      return sum;
    }
    return sum + d.value * d.usedCount;
  }, 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Discounts</h1>
          <p className="text-gray-600">
            Manage discount codes, promotional offers, and marketing campaigns.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportPromotions}
            disabled={exporting}
            className="flex items-center space-x-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingDiscount(null);
              setShowAddModal(true);
            }}
            className="bg-kubota-orange flex items-center space-x-2 rounded-md px-4 py-2 text-white hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            <span>Create Discount</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <Tag className="text-kubota-orange h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Codes</p>
              <p className="text-2xl font-semibold text-gray-900">{activeDiscounts}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Uses</p>
              <p className="text-2xl font-semibold text-gray-900">{totalUses}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Savings</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${totalSavings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Valid Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {discounts.map((discount) => {
                const isExpired = discount.validUntil && discount.validUntil < new Date();
                const isMaxedOut = discount.maxUses && discount.usedCount >= discount.maxUses;

                return (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <Tag className="text-kubota-orange mr-2 h-4 w-4" />
                        <div>
                          <div className="text-sm font-mono font-bold text-gray-900">
                            {discount.code}
                          </div>
                          <button
                            onClick={() => copyCode(discount.code)}
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{discount.name}</div>
                      {discount.minBookingAmount && (
                        <div className="text-xs text-gray-500">
                          Min: ${discount.minBookingAmount}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center text-sm font-semibold text-gray-900">
                        {discount.type === 'percentage' ? (
                          <>
                            <Percent className="mr-1 h-4 w-4 text-green-600" />
                            {discount.value}% OFF
                          </>
                        ) : (
                          <>
                            <DollarSign className="mr-1 h-4 w-4 text-green-600" />${discount.value}{' '}
                            OFF
                          </>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {discount.usedCount}
                        {discount.maxUses && ` / ${discount.maxUses}`}
                      </div>
                      {isMaxedOut && <div className="text-xs text-red-600">Maxed out</div>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {discount.validFrom || discount.validUntil ? (
                        <div className="text-sm text-gray-900">
                          {discount.validFrom && discount.validFrom.toLocaleDateString()}
                          {' - '}
                          {discount.validUntil && discount.validUntil.toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No expiration</div>
                      )}
                      {isExpired && <div className="text-xs text-red-600">Expired</div>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(discount.id, discount.isActive)}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          discount.isActive && !isExpired && !isMaxedOut
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {discount.isActive && !isExpired && !isMaxedOut ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(discount)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id, discount.code)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <h3 className="mb-6 text-lg font-medium text-gray-900">
                {editingDiscount ? 'Edit Discount Code' : 'Create New Discount Code'}
              </h3>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Code *</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingDiscount}
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="SUMMER2025"
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 font-mono focus:border-transparent focus:outline-none focus:ring-2 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Summer 2025 Promotion"
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as 'percentage' | 'fixed' | 'fixed_amount',
                        })
                      }
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                    >
                      <option value="percentage">Percentage Off</option>
                      <option value="fixed">Fixed Amount Off</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Value * {formData.type === 'percentage' ? '(%)' : '(CAD)'}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={formData.type === 'percentage' ? '100' : undefined}
                      step={formData.type === 'percentage' ? '1' : '0.01'}
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: parseFloat(e.target.value) })
                      }
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Max Total Uses
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxUses || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxUses: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Unlimited"
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Max Uses Per User *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.maxUsesPerUser}
                      onChange={(e) =>
                        setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) })
                      }
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Min Booking Amount (CAD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minBookingAmount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minBookingAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="No minimum"
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Valid From
                    </label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="text-kubota-orange focus:ring-kubota-orange rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Active (can be used immediately)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingDiscount(null);
                      resetForm();
                    }}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-kubota-orange rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                  >
                    {editingDiscount ? 'Update Discount' : 'Create Discount'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
