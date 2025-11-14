'use client';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CustomerEditModalProps {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function CustomerEditModal({ customer, isOpen, onClose, onSave }: CustomerEditModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    province: 'NB',
    postalCode: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        phone: customer.phone || '',
        company: customer.company || '',
        address: customer.address || '',
        city: customer.city || '',
        province: customer.province || 'NB',
        postalCode: customer.postalCode || '',
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);

      // Update customer in Supabase
      const supabaseAny: any = supabase;

      const { error: updateError } = await supabaseAny
        .from('users')
        .update({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          companyName: formData.company,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', customer.id);

      if (updateError) throw updateError;

      logger.info('Customer updated', {
        component: 'CustomerEditModal',
        action: 'update_customer',
        metadata: { customerId: customer.id },
      });

      onSave(); // Trigger refresh
      onClose(); // Close modal
    } catch (err) {
      logger.error(
        'Failed to update customer',
        {
          component: 'CustomerEditModal',
          action: 'error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const titleId = `customer-edit-${customer.id}-title`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="p-6">
          <div className="mb-6 flex items-start justify-between">
            <h3 id={titleId} className="text-lg font-medium text-gray-900">
              Edit Customer - {customer.firstName} {customer.lastName}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Personal Information */}
              <div>
                <label htmlFor="customer-first-name" className="mb-1 block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  id="customer-first-name"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label htmlFor="customer-last-name" className="mb-1 block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  id="customer-last-name"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label htmlFor="customer-email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email (Read-only)
                </label>
                <input
                  id="customer-email"
                  type="email"
                  value={customer.email}
                  disabled
                  className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed (authentication)
                </p>
              </div>

              <div>
                <label htmlFor="customer-phone" className="mb-1 block text-sm font-medium text-gray-700">
                  Phone *
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(506) 555-1234"
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="customer-company" className="mb-1 block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  id="customer-company"
                  type="text"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              {/* Address Information */}
              <div className="md:col-span-2">
                <label htmlFor="customer-address" className="mb-1 block text-sm font-medium text-gray-700">
                  Street Address *
                </label>
                <input
                  id="customer-address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label htmlFor="customer-city" className="mb-1 block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  id="customer-city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label htmlFor="customer-province" className="mb-1 block text-sm font-medium text-gray-700">
                  Province *
                </label>
                <select
                  id="customer-province"
                  required
                  value={formData.province}
                  onChange={e => setFormData({ ...formData, province: e.target.value })}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                >
                  <option value="NB">New Brunswick</option>
                  <option value="NS">Nova Scotia</option>
                  <option value="PE">Prince Edward Island</option>
                  <option value="NL">Newfoundland and Labrador</option>
                  <option value="QC">Quebec</option>
                  <option value="ON">Ontario</option>
                  <option value="MB">Manitoba</option>
                  <option value="SK">Saskatchewan</option>
                  <option value="AB">Alberta</option>
                  <option value="BC">British Columbia</option>
                  <option value="YT">Yukon</option>
                  <option value="NT">Northwest Territories</option>
                  <option value="NU">Nunavut</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="customer-postal-code" className="mb-1 block text-sm font-medium text-gray-700">
                  Postal Code *
                </label>
                <input
                  id="customer-postal-code"
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={e =>
                    setFormData({ ...formData, postalCode: e.target.value.toUpperCase() })
                  }
                  placeholder="E2K 1A1"
                  pattern="[A-Z][0-9][A-Z] [0-9][A-Z][0-9]"
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-kubota-orange rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

