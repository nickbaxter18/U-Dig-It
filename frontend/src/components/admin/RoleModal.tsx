/**
 * Enterprise Permission System - Role Management Modal
 * Create/edit roles and assign permissions
 */

'use client';

import { Save, X } from 'lucide-react';

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import { useAdminToast } from './AdminToastProvider';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  scope: string;
  description: string;
  category: string;
}

interface Role {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: string[] | Permission[]; // Permission IDs or Permission objects
}

interface RoleModalProps {
  isOpen: boolean;
  role?: Role | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RoleModal({ isOpen, role, onClose, onSuccess }: RoleModalProps) {
  const toast = useAdminToast();
  const isEditMode = Boolean(role);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState<Role>({
    name: '',
    displayName: '',
    description: '',
    isSystem: false,
    isActive: true,
    permissions: [],
  });

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
      if (role) {
        // Extract permission IDs if permissions are objects
        const permissionIds = (role.permissions || []).map((p: any) =>
          typeof p === 'string' ? p : p.id
        );

        setFormData({
          name: role.name,
          displayName: role.displayName,
          description: role.description || '',
          isSystem: role.isSystem,
          isActive: role.isActive,
          permissions: permissionIds,
        });
      } else {
        setFormData({
          name: '',
          displayName: '',
          description: '',
          isSystem: false,
          isActive: true,
          permissions: [],
        });
      }
    }
  }, [isOpen, role]);

  const loadPermissions = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/permissions');
      if (!response.ok) throw new Error('Failed to load permissions');
      const data = await response.json();
      setPermissions(data.permissions || []);
    } catch (err) {
      logger.error('Failed to load permissions', {
        component: 'RoleModal',
        action: 'load_permissions',
      });
      toast.error('Failed to load permissions');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url =
        isEditMode && role?.id
          ? `/api/admin/permissions/roles/${role.id}`
          : '/api/admin/permissions/roles';
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to save role');
      }

      toast.success(isEditMode ? 'Role updated successfully' : 'Role created successfully');
      onSuccess();
      onClose();
    } catch (err) {
      logger.error('Failed to save role', {
        component: 'RoleModal',
        action: isEditMode ? 'update_role' : 'create_role',
      });
      toast.error(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const permissionsByCategory = permissions.reduce(
    (acc, perm) => {
      const category = perm.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Role' : 'Create Role'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role Name (ID)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isEditMode && formData.isSystem}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="equipment_manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Equipment Manager"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Role description..."
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permissions ({formData.permissions.length} selected)
              </label>
              <div className="max-h-96 overflow-y-auto rounded-md border border-gray-200 p-4">
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                  <div key={category} className="mb-6">
                    <h4 className="mb-2 text-sm font-semibold text-gray-900">{category}</h4>
                    <div className="space-y-2">
                      {perms.map((perm) => (
                        <label key={perm.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="mr-2 rounded border-gray-300"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-mono text-gray-900">{perm.name}</span>
                            {perm.description && (
                              <p className="text-xs text-gray-500">{perm.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-kubota-orange flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : isEditMode ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
