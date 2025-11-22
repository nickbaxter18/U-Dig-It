/**
 * Enterprise Permission System - Permission Manager
 * Admin UI for managing permissions, roles, and user assignments
 */

'use client';

import { Edit, Filter, Key, Plus, Search, Shield, Trash2, Users } from 'lucide-react';

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import { useAdminToast } from './AdminToastProvider';
import { PermissionGate } from './PermissionGate';
import { RoleModal } from './RoleModal';
import { UserRoleAssignmentModal } from './UserRoleAssignmentModal';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  scope: string;
  description: string;
  category: string;
  isSystem: boolean;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: Permission[];
}

interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  role?: Role;
  assignedAt: string;
}

export function PermissionManager() {
  const toast = useAdminToast();
  const [activeTab, setActiveTab] = useState<'permissions' | 'roles' | 'users'>('permissions');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'permissions') {
        const response = await fetchWithAuth('/api/admin/permissions');
        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
          // Check for migration required error or RLS blocked error
          if (
            responseData.code === 'MIGRATION_REQUIRED' ||
            responseData.code === 'RLS_BLOCKED' ||
            response.status === 503
          ) {
            throw new Error('MIGRATION_REQUIRED');
          }

          // If we get 401/403, it might be due to missing service role key or RLS blocking
          // Check if the error message suggests this
          const errorMessage = (responseData.error || '').toLowerCase();
          if (
            (response.status === 401 || response.status === 403) &&
            (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden'))
          ) {
            // This could be RLS blocking - show migration message
            logger.warn(
              'Got 401/403 from permissions API - likely RLS blocking or missing service key',
              {
                component: 'PermissionManager',
                action: 'load_permissions',
                status: response.status,
                error: responseData.error,
              }
            );
            throw new Error('MIGRATION_REQUIRED');
          }

          throw new Error(responseData.error || 'Failed to load permissions');
        }

        setPermissions(responseData.permissions || []);
      } else if (activeTab === 'roles') {
        const response = await fetchWithAuth('/api/admin/permissions/roles');
        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
          // Check for migration required error or RLS blocked error
          if (
            responseData.code === 'MIGRATION_REQUIRED' ||
            responseData.code === 'RLS_BLOCKED' ||
            response.status === 503
          ) {
            throw new Error('MIGRATION_REQUIRED');
          }

          // If we get 401/403, it might be due to missing service role key or RLS blocking
          const errorMessage = (responseData.error || '').toLowerCase();
          if (
            (response.status === 401 || response.status === 403) &&
            (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden'))
          ) {
            logger.warn('Got 401/403 from roles API - likely RLS blocking or missing service key', {
              component: 'PermissionManager',
              action: 'load_roles',
              status: response.status,
              error: responseData.error,
            });
            throw new Error('MIGRATION_REQUIRED');
          }

          throw new Error(responseData.error || 'Failed to load roles');
        }

        setRoles(responseData.roles || []);
      } else if (activeTab === 'users') {
        const response = await fetchWithAuth('/api/admin/permissions/user-roles');
        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
          // Check for migration required error or RLS blocked error
          if (
            responseData.code === 'MIGRATION_REQUIRED' ||
            responseData.code === 'RLS_BLOCKED' ||
            response.status === 503
          ) {
            throw new Error('MIGRATION_REQUIRED');
          }

          // If we get 401/403, it might be due to missing service role key or RLS blocking
          const errorMessage = (responseData.error || '').toLowerCase();
          if (
            (response.status === 401 || response.status === 403) &&
            (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden'))
          ) {
            logger.warn(
              'Got 401/403 from user-roles API - likely RLS blocking or missing service key',
              {
                component: 'PermissionManager',
                action: 'load_user_roles',
                status: response.status,
                error: responseData.error,
              }
            );
            throw new Error('MIGRATION_REQUIRED');
          }

          throw new Error(responseData.error || 'Failed to load user roles');
        }

        setUserRoles(responseData.userRoles || []);
      }
    } catch (err) {
      logger.error('Failed to load permission data', {
        component: 'PermissionManager',
        action: 'load_data',
      });

      // Check if this is a migration required error
      if (err instanceof Error && err.message === 'MIGRATION_REQUIRED') {
        setError('MIGRATION_REQUIRED');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPermissions = permissions.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    // Special handling for migration required error
    if (error === 'MIGRATION_REQUIRED') {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-amber-800">
                Permission System Not Initialized
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p className="mb-2">
                  The permission system database tables have not been created yet, or access is
                  being blocked. This may be due to:
                </p>
                <ul className="mb-4 list-disc pl-5 space-y-1">
                  <li>Missing database migrations (tables not created)</li>
                  <li>Missing SUPABASE_SERVICE_ROLE_KEY environment variable</li>
                  <li>Row-Level Security (RLS) policies blocking access</li>
                </ul>
                <p className="mb-2 font-medium">
                  Please apply the following database migrations to initialize the system:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
                      20250123000001_enterprise_permission_system.sql
                    </code>
                  </li>
                  <li>
                    <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
                      20250123000002_seed_permissions_and_roles.sql
                    </code>
                  </li>
                  <li>
                    <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
                      20250123000003_rls_permission_integration.sql
                    </code>
                  </li>
                </ul>
                <p className="mt-3">
                  These migrations are located in the{' '}
                  <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
                    supabase/migrations
                  </code>{' '}
                  directory. Once applied, refresh this page to access the permission management
                  interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Regular error display
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'permissions'
                ? 'border-premium-gold text-premium-gold'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Key className="mr-2 inline h-4 w-4" />
            Permissions
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'roles'
                ? 'border-premium-gold text-premium-gold'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Shield className="mr-2 inline h-4 w-4" />
            Roles
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'users'
                ? 'border-premium-gold text-premium-gold'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Users className="mr-2 inline h-4 w-4" />
            User Assignments
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">All Permissions</h3>
            <div className="text-sm text-gray-500">
              {filteredPermissions.length} permission{filteredPermissions.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Permission
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Scope
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPermissions.map((permission) => (
                  <tr key={permission.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-gray-900">{permission.name}</code>
                        {permission.isSystem && (
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                            System
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{permission.resource}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{permission.action}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{permission.scope}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {permission.category || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {permission.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Roles</h3>
            <PermissionGate permission="admin_users:create:all">
              <button
                onClick={() => {
                  setSelectedRole(null);
                  setShowRoleModal(true);
                }}
                className="bg-blue-600 flex items-center gap-2 rounded-md px-4 py-2 text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Role
              </button>
            </PermissionGate>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRoles.map((role) => (
              <div key={role.id} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-semibold text-gray-900">{role.displayName}</h4>
                      {role.isSystem && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                          System
                        </span>
                      )}
                      {!role.isActive && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{role.description || '—'}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {role.permissions?.length || 0} permission
                      {role.permissions?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <PermissionGate permission="admin_users:update:all">
                    <button
                      onClick={() => {
                        setSelectedRole(role);
                        setShowRoleModal(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </PermissionGate>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">User Role Assignments</h3>
            <PermissionGate permission="admin_users:update:all">
              <button
                onClick={() => setShowUserRoleModal(true)}
                className="bg-blue-600 flex items-center gap-2 rounded-md px-4 py-2 text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Assign Role
              </button>
            </PermissionGate>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Assigned At
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {userRoles.map((userRole) => (
                  <tr key={userRole.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {userRole.user
                          ? `${userRole.user.firstName} ${userRole.user.lastName}`
                          : userRole.userId.substring(0, 8) + '...'}
                      </div>
                      <div className="text-xs text-gray-500">{userRole.user?.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                        {userRole.role?.displayName || userRole.roleId.substring(0, 8) + '...'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(userRole.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <PermissionGate
                        permission="admin_users:update:all"
                        fallback={<span className="text-xs text-gray-400">No actions</span>}
                        loading={<span className="text-xs text-gray-400">Loading...</span>}
                      >
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to remove this role assignment?')) {
                              try {
                                const response = await fetchWithAuth(
                                  `/api/admin/permissions/user-roles/${userRole.id}`,
                                  { method: 'DELETE' }
                                );
                                if (!response.ok) throw new Error('Failed to remove role');
                                toast.success('Role assignment removed');
                                loadData();
                              } catch (err) {
                                toast.error(
                                  err instanceof Error ? err.message : 'Failed to remove role'
                                );
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                          aria-label="Remove role assignment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Modal */}
      <RoleModal
        isOpen={showRoleModal}
        role={selectedRole}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedRole(null);
        }}
        onSuccess={() => {
          loadData();
          setShowRoleModal(false);
          setSelectedRole(null);
        }}
      />

      {/* User Role Assignment Modal */}
      <UserRoleAssignmentModal
        isOpen={showUserRoleModal}
        onClose={() => setShowUserRoleModal(false)}
        onSuccess={() => {
          loadData();
          setShowUserRoleModal(false);
        }}
      />
    </div>
  );
}
