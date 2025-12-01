'use client';


import { useEffect, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

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

      // Update customer via API route
      const response = await fetchWithAuth(`/api/admin/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          companyName: formData.company,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage =
          errorData.error || errorData.details || 'Failed to update customer';
        throw new Error(errorMessage);
      }

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

  const titleId = `customer-edit-${customer.id}-title`;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Customer - ${customer.firstName} ${customer.lastName}`}
      maxWidth="2xl"
      ariaLabelledBy={titleId}
    >
      <div className="p-6">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <div>
              <label
                htmlFor="customer-first-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                First Name *
              </label>
              <input
                id="customer-first-name"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="customer-last-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Last Name *
              </label>
              <input
                id="customer-last-name"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="customer-email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email (Read-only)
              </label>
              <input
                id="customer-email"
                type="email"
                value={customer.email}
                disabled
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed (authentication)</p>
            </div>

            <div>
              <label
                htmlFor="customer-phone"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Phone *
              </label>
              <input
                id="customer-phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(506) 555-1234"
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="customer-company"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Company Name
              </label>
              <input
                id="customer-company"
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              />
            </div>

            {/* Address Information */}
            <div className="md:col-span-2">
              <label
                htmlFor="customer-address"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Street Address *
              </label>
              <input
                id="customer-address"
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="customer-city"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                City *
              </label>
              <input
                id="customer-city"
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="customer-province"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Province *
              </label>
              <select
                id="customer-province"
                required
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
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
              <label
                htmlFor="customer-postal-code"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Postal Code *
              </label>
              <input
                id="customer-postal-code"
                type="text"
                required
                value={formData.postalCode}
                onChange={(e) =>
                  setFormData({ ...formData, postalCode: e.target.value.toUpperCase() })
                }
                placeholder="E2K 1A1"
                pattern="[A-Z][0-9][A-Z] [0-9][A-Z][0-9]"
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminModal>
  );
}
