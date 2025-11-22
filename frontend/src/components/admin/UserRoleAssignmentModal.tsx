/**
 * Enterprise Permission System - User Role Assignment Modal
 * Assign roles to users
 */

'use client';

import { Save, Search, X } from 'lucide-react';

import { useEffect, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';

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

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Assign Role to User" maxWidth="2xl">
      <div className="flex flex-col">
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
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </AdminModal>
  );
}
