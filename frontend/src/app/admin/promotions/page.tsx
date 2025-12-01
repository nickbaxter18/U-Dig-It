'use client';

import {
    CheckCircle,
    Copy,
    DollarSign,
    Download,
    Edit,
    Eye,
    EyeOff,
    Megaphone,
    Percent,
    Plus,
    Tag,
    Trash2,
    XCircle,
} from 'lucide-react';

import { useEffect, useState } from 'react';

import type { Database } from '@/../../supabase/types';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { typedInsert, typedUpdate } from '@/lib/supabase/typed-helpers';

// Type definitions for Supabase query results
type DiscountCodeRow = Database['public']['Tables']['discount_codes']['Row'];

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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Banner visibility toggle state
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [bannerToggling, setBannerToggling] = useState(false);

  // Spin Wheel banner visibility toggle state
  const [spinWheelBannerEnabled, setSpinWheelBannerEnabled] = useState(true);
  const [spinWheelBannerToggling, setSpinWheelBannerToggling] = useState(false);

  useEffect(() => {
    fetchDiscounts();
    fetchBannerConfig();
  }, []);

  const fetchBannerConfig = async () => {
    try {
      setBannerLoading(true);
      const response = await fetchWithAuth('/api/config/banner');
      const data = await response.json();
      setBannerEnabled(data.specialOffersBanner === true || data.enabled === true);
      setSpinWheelBannerEnabled(data.spinWheelBanner === true);
    } catch {
      // Default to enabled if fetch fails
      setBannerEnabled(true);
      setSpinWheelBannerEnabled(true);
    } finally {
      setBannerLoading(false);
    }
  };

  const handleToggleBanner = async () => {
    try {
      setBannerToggling(true);
      const newValue = !bannerEnabled;

      const response = await fetchWithAuth('/api/config/banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue, bannerType: 'special_offers' }),
      });

      if (!response.ok) {
        throw new Error('Failed to update banner setting');
      }

      setBannerEnabled(newValue);
      alert(`✅ Special Offers Banner ${newValue ? 'enabled' : 'disabled'}!`);
    } catch (err) {
      logger.error(
        'Failed to toggle banner',
        { component: 'PromotionsPage', action: 'toggle_banner' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to update banner setting');
    } finally {
      setBannerToggling(false);
    }
  };

  const handleToggleSpinWheelBanner = async () => {
    try {
      setSpinWheelBannerToggling(true);
      const newValue = !spinWheelBannerEnabled;

      const response = await fetchWithAuth('/api/config/banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue, bannerType: 'spin_wheel' }),
      });

      if (!response.ok) {
        throw new Error('Failed to update spin wheel banner setting');
      }

      setSpinWheelBannerEnabled(newValue);
      alert(`✅ Spin Wheel Banner ${newValue ? 'enabled' : 'disabled'}!`);
    } catch (err) {
      logger.error(
        'Failed to toggle spin wheel banner',
        { component: 'PromotionsPage', action: 'toggle_spin_wheel_banner' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to update spin wheel banner setting');
    } finally {
      setSpinWheelBannerToggling(false);
    }
  };

  // Helper function to convert date input string to ISO timestamp or null
  const formatDateForInsert = (dateString: string, isEndOfDay = false): string | null => {
    if (!dateString || dateString.trim() === '') {
      return null;
    }
    // Date input provides YYYY-MM-DD format
    // Convert to ISO timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
    if (isEndOfDay) {
      // For valid_until, set to end of day (23:59:59.999) in UTC
      // This ensures the discount is valid for the entire day
      const date = new Date(dateString + 'T23:59:59.999Z');
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } else {
      // For valid_from, set to start of day (00:00:00) in UTC
      const date = new Date(dateString + 'T00:00:00.000Z');
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    }
  };

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('discount_codes')
        .select('id, code, name, type, value, is_active, max_uses, max_uses_per_user, used_count, min_booking_amount, valid_from, valid_until, applicable_equipment_types, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      const discountsData: DiscountCode[] = (data || []).map((disc: DiscountCodeRow) => ({
        id: disc.id,
        code: disc.code,
        name: disc.name,
        type: disc.type as 'percentage' | 'fixed' | 'fixed_amount',
        value: parseFloat(String(disc.value || '0')),
        maxUses: disc.max_uses ?? undefined,
        usedCount: disc.used_count || 0,
        maxUsesPerUser: disc.max_uses_per_user || 1,
        minBookingAmount: disc.min_booking_amount ? parseFloat(String(disc.min_booking_amount)) : undefined,
        validFrom: disc.valid_from ? new Date(String(disc.valid_from)) : undefined,
        validUntil: disc.valid_until ? new Date(String(disc.valid_until)) : undefined,
        applicableEquipmentTypes: (disc.applicable_equipment_types as string[]) || undefined,
        isActive: disc.is_active ?? false,
        createdAt: disc.created_at ? new Date(disc.created_at) : new Date(),
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

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Format dates: convert empty strings to null, date strings to ISO timestamps
      // valid_from = start of day, valid_until = end of day (to cover the entire day)
      const validFromFormatted = formatDateForInsert(formData.validFrom, false);
      const validUntilFormatted = formatDateForInsert(formData.validUntil, true);

      if (editingDiscount) {
        // Update using typed helper
        const { error: updateError } = await typedUpdate(
          supabase,
          'discount_codes',
          {
            name: formData.name,
            type: formData.type,
            value: formData.value,
            max_uses: formData.maxUses || null,
            max_uses_per_user: formData.maxUsesPerUser,
            min_booking_amount: formData.minBookingAmount || null,
            valid_from: validFromFormatted,
            valid_until: validUntilFormatted,
            is_active: formData.isActive,
            updated_at: new Date().toISOString(),
          }
        ).eq('id', editingDiscount.id);

        if (updateError) {
          // Extract detailed error message
          const errorMessage = updateError.message || 'Failed to update discount code';
          const errorDetails = updateError.details ? ` ${updateError.details}` : '';
          const errorHint = updateError.hint ? ` ${updateError.hint}` : '';
          throw new Error(`${errorMessage}${errorDetails}${errorHint}`);
        }
        alert('✅ Discount code updated!');
      } else {
        // Create using typed helper
        const { error: insertError } = await typedInsert(supabase, 'discount_codes', {
          code: formData.code.toUpperCase(),
          name: formData.name,
          type: formData.type,
          value: formData.value,
          max_uses: formData.maxUses || null,
          max_uses_per_user: formData.maxUsesPerUser,
          min_booking_amount: formData.minBookingAmount || null,
          valid_from: validFromFormatted,
          valid_until: validUntilFormatted,
          is_active: formData.isActive,
        });

        if (insertError) {
          // Extract detailed error message
          const errorMessage = insertError.message || 'Failed to create discount code';
          const errorDetails = insertError.details ? ` ${insertError.details}` : '';
          const errorHint = insertError.hint ? ` ${insertError.hint}` : '';
          throw new Error(`${errorMessage}${errorDetails}${errorHint}`);
        }
        alert('✅ Discount code created!');
      }

      setShowAddModal(false);
      setEditingDiscount(null);
      resetForm();
      await fetchDiscounts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save discount code';
      setSubmitError(errorMessage);
      logger.error(
        'Failed to save discount code',
        {
          component: 'PromotionsPage',
          action: editingDiscount ? 'update' : 'create',
          error: errorMessage,
        },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(`Failed to save discount code: ${errorMessage}`);
    } finally {
      setSubmitting(false);
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
    setSubmitError(null);
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
      const { error } = await typedUpdate(supabase, 'discount_codes', {
        is_active: !currentStatus,
      }).eq('id', id);

      if (error) throw error;

      await fetchDiscounts();
      alert(`✅ Discount code ${!currentStatus ? 'activated' : 'deactivated'}!`);
    } catch {
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
    } catch {
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
  const totalUses = discounts.reduce((sum: number, d: DiscountCode) => sum + d.usedCount, 0);
  const totalSavings = discounts.reduce((sum: number, d: DiscountCode) => {
    if (d.type === 'percentage') {
      // Can't calculate without booking data
      return sum;
    }
    return sum + d.value * d.usedCount;
  }, 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-premium-gold h-8 w-8 animate-spin rounded-full border-b-2"></div>
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
              setSubmitError(null);
              setShowAddModal(true);
            }}
            className="bg-blue-600 flex items-center space-x-2 rounded-md px-4 py-2 text-white hover:bg-blue-700"
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

      {/* Banner Toggle Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${bannerEnabled ? 'bg-red-100' : 'bg-gray-100'}`}>
              <Megaphone className={`h-6 w-6 ${bannerEnabled ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Special Offers Banner</h3>
              <p className="text-sm text-gray-500">
                {bannerEnabled ? 'The promotional banner is visible to all visitors' : 'The promotional banner is hidden from visitors'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
              bannerEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {bannerEnabled ? (
                <>
                  <Eye className="h-4 w-4" />
                  Visible
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hidden
                </>
              )}
            </span>
            <button
              onClick={handleToggleBanner}
              disabled={bannerLoading || bannerToggling}
              className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                bannerEnabled ? 'bg-red-600 focus:ring-red-500' : 'bg-gray-200 focus:ring-gray-500'
              }`}
              role="switch"
              aria-checked={bannerEnabled}
              aria-label="Toggle banner visibility"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  bannerEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Spin Wheel Banner Toggle */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${spinWheelBannerEnabled ? 'bg-yellow-100' : 'bg-gray-600'}`}>
              <svg
                className={`h-6 w-6 ${spinWheelBannerEnabled ? 'text-yellow-600' : 'text-gray-400'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Spin Wheel Banner</h3>
              <p className="text-sm text-gray-300">
                {spinWheelBannerEnabled ? '"Win Up To $100 Off" banner is visible in navigation' : '"Win Up To $100 Off" banner is hidden from navigation'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
              spinWheelBannerEnabled ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-600 text-gray-300'
            }`}>
              {spinWheelBannerEnabled ? (
                <>
                  <Eye className="h-4 w-4" />
                  Visible
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hidden
                </>
              )}
            </span>
            <button
              onClick={handleToggleSpinWheelBanner}
              disabled={bannerLoading || spinWheelBannerToggling}
              className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                spinWheelBannerEnabled ? 'bg-yellow-500 focus:ring-yellow-500' : 'bg-gray-500 focus:ring-gray-500'
              }`}
              role="switch"
              aria-checked={spinWheelBannerEnabled}
              aria-label="Toggle spin wheel banner visibility"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  spinWheelBannerEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

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

              {/* Error Display */}
              {submitError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Code *</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingDiscount || submitting}
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="SUMMER2025"
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 font-mono focus:border-transparent focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      disabled={submitting}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Summer 2025 Promotion"
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Type *</label>
                    <select
                      value={formData.type}
                      disabled={submitting}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as 'percentage' | 'fixed' | 'fixed_amount',
                        })
                      }
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      disabled={submitting}
                      min="0"
                      max={formData.type === 'percentage' ? '100' : undefined}
                      step={formData.type === 'percentage' ? '1' : '0.01'}
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: parseFloat(e.target.value) })
                      }
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Max Total Uses
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={submitting}
                      value={formData.maxUses || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxUses: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Unlimited"
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Max Uses Per User *
                    </label>
                    <input
                      type="number"
                      required
                      disabled={submitting}
                      min="1"
                      value={formData.maxUsesPerUser}
                      onChange={(e) =>
                        setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) })
                      }
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Min Booking Amount (CAD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={submitting}
                      step="0.01"
                      value={formData.minBookingAmount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minBookingAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="No minimum"
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Valid From
                    </label>
                    <input
                      type="date"
                      disabled={submitting}
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      disabled={submitting}
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        disabled={submitting}
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="text-kubota-orange focus:ring-kubota-orange rounded disabled:cursor-not-allowed"
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
                    disabled={submitting}
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingDiscount(null);
                      setSubmitError(null);
                      resetForm();
                    }}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <span className="border-premium-gold mr-2 h-4 w-4 animate-spin rounded-full border-b-2"></span>
                        {editingDiscount ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : (
                      editingDiscount ? 'Update Discount' : 'Create Discount'
                    )}
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
