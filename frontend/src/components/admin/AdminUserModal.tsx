'use client';

import { X } from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';
import { useAdminToast } from '@/components/admin/AdminToastProvider';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

type AdminRole = 'admin' | 'super_admin';
type AdminStatus = 'active' | 'inactive' | 'suspended';

export interface AdminUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  status: AdminStatus;
}

interface AdminUserModalProps {
  isOpen: boolean;
  user?: AdminUserSummary | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminUserModal({ isOpen, user, onClose, onSuccess }: AdminUserModalProps) {
  const isEditMode = Boolean(user);
  const toast = useAdminToast();

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'admin' as AdminRole,
    status: 'active' as AdminStatus,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        role: user.role,
        status: user.status,
      });
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'admin',
        status: 'active',
      });
    }
  }, [user, isOpen]);

  const modalTitle = useMemo(
    () => (isEditMode ? `Edit Admin User` : 'Invite Admin User'),
    [isEditMode]
  );

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      setSubmitting(true);

      const payload = isEditMode
        ? {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            role: formData.role,
            status: formData.status,
          }
        : {
            email: formData.email.trim().toLowerCase(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            role: formData.role,
            status: formData.status,
          };

      const endpoint = isEditMode ? `/api/admin/users/${user?.id}` : '/api/admin/users';
      const response = await fetchWithAuth(endpoint, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const errorMessage = errorBody?.error || 'Failed to save admin user';
        const errorDetails = errorBody?.details;

        // Show error toast with details if available
        if (errorDetails) {
          toast.error(errorMessage, errorDetails);
        } else {
          toast.error(errorMessage);
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json().catch(() => null);
      const wasUpgraded = responseData?.upgraded === true;

      logger.info('Admin user saved successfully', {
        component: 'AdminUserModal',
        action: isEditMode
          ? 'admin_user_updated'
          : wasUpgraded
            ? 'admin_user_upgraded'
            : 'admin_user_created',
        metadata: {
          userId: user?.id || responseData?.data?.id,
          email: formData.email,
          upgraded: wasUpgraded,
        },
      });

      // Show success toast
      if (wasUpgraded) {
        toast.success(
          'User Upgraded to Admin',
          `${formData.email} has been successfully upgraded to ${formData.role === 'super_admin' ? 'Super Admin' : 'Admin'}.`
        );
      } else if (isEditMode) {
        toast.success('Admin User Updated', 'The admin user has been updated successfully.');
      } else {
        toast.success('Admin User Invited', `An invitation has been sent to ${formData.email}.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      logger.error(
        'Failed to save admin user',
        { component: 'AdminUserModal', action: 'error' },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const titleId = `admin-user-modal-title`;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="xl"
      ariaLabelledBy={titleId}
    >
      <div className="p-6">
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {isEditMode
              ? 'Update role, status, or details for this admin user.'
              : 'Send an invitation email to a new admin user. If the email already exists, the user will be upgraded to admin.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isEditMode}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 disabled:bg-gray-100"
                placeholder="admin@kubota-rental.ca"
              />
              {isEditMode && (
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed after invitation.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="admin-first-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                First Name *
              </label>
              <input
                id="admin-first-name"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="admin-last-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Last Name *
              </label>
              <input
                id="admin-last-name"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="admin-role" className="mb-1 block text-sm font-medium text-gray-700">
                Role *
              </label>
              <select
                id="admin-role"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-status"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Status *
              </label>
              <select
                id="admin-status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="focus:ring-premium-gold w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </AdminModal>
  );
}
