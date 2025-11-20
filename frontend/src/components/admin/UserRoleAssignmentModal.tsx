/**
 * Enterprise Permission System - User Role Assignment Modal
 * Assign roles to users
 */

'use client';

import { Save, Search, X } from 'lucide-react';

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import { useAdminToast } from './AdminToastProvider';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
}

interface UserRoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserRoleAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
}: UserRoleAssignmentModalProps) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadRoles();
      // Reset form
      setSelectedUserId('');
      setSelectedRoleId('');
      setExpiresAt('');
      setSearchTerm('');
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/users');
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      logger.error('Failed to load users', {
        component: 'UserRoleAssignmentModal',
        action: 'load_users',
      });
      toast.error('Failed to load users');
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/permissions/roles');
      if (!response.ok) throw new Error('Failed to load roles');
      const data = await response.json();
      setRoles((data.roles || []).filter((r: Role) => r.isActive));
    } catch (err) {
      logger.error('Failed to load roles', {
        component: 'UserRoleAssignmentModal',
        action: 'load_roles',
      });
      toast.error('Failed to load roles');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !selectedRoleId) {
      toast.error('Please select both a user and a role');
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithAuth('/api/admin/permissions/user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          roleId: selectedRoleId,
          expiresAt: expiresAt || null,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to assign role');
      }

      toast.success('Role assigned successfully');
      onSuccess();
      onClose();
    } catch (err) {
      logger.error('Failed to assign role', {
        component: 'UserRoleAssignmentModal',
        action: 'assign_role',
      });
      toast.error(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Assign Role to User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm"
                />
              </div>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select a user...</option>
                {filteredUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.displayName} {role.isSystem && '(System)'}
                  </option>
                ))}
              </select>
              {selectedRoleId && (
                <p className="mt-1 text-xs text-gray-500">
                  {roles.find((r) => r.id === selectedRoleId)?.description || '—'}
                </p>
              )}
            </div>

            {/* Expiration (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Leave empty for permanent assignment</p>
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
              {loading ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
