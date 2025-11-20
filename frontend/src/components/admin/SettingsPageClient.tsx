'use client';

import {
  AlertTriangle,
  Bell,
  CheckCircle,
  DollarSign,
  FileText,
  Globe,
  Key,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';

import { useEffect, useState } from 'react';

import { AdminUserModal, type AdminUserSummary } from '@/components/admin/AdminUserModal';
import { JobsMonitor } from '@/components/admin/JobsMonitor';
import { NotificationRulesManager } from '@/components/admin/NotificationRulesManager';
import { PermissionAuditLog } from '@/components/admin/PermissionAuditLog';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { PermissionManager } from '@/components/admin/PermissionManager';
import { ScheduledReportsManager } from '@/components/admin/ScheduledReportsManager';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    maxBookingsPerDay: number;
    defaultCurrency: string;
    timezone: string;
  };
  pricing: {
    baseDailyRate: number;
    weekendMultiplier: number;
    holidayMultiplier: number;
    longTermDiscount: number;
    depositPercentage: number;
    lateFeePerDay: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    adminNotifications: boolean;
    customerNotifications: boolean;
    reminderDays: number;
  };
  integrations: {
    stripeEnabled: boolean;
    stripePublicKey: string;
    stripeSecretKey: string;
    docusignEnabled: boolean;
    docusignClientId: string;
    googleMapsApiKey: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    allowedIpRanges: string[];
  };
}

type AdminRoleValue = 'admin' | 'super_admin';
type AdminUserStatus = 'active' | 'inactive' | 'suspended';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleValue: AdminRoleValue;
  status: AdminUserStatus;
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
}

export function SettingsPageClient() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUserSummary | null>(null);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchAdminUsers();
  }, []);

  // Debug: Log tabs to console in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[SettingsPage] Tabs count:',
        8,
        'Expected tabs: reports, jobs, general, pricing, notifications, integrations, security, admins'
      );
    }
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ BULLETPROOF: Fetch settings from Supabase system_settings table
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('category, settings');

      if (settingsError) throw settingsError;

      // Transform array of settings into SystemSettings object
      const settingsMap: any = {};
      (settingsData || ([] as unknown[])).forEach((item: unknown) => {
        settingsMap[item.category] = item.settings;
      });

      // Add default values for any missing settings
      const loadedSettings: SystemSettings = {
        general: settingsMap.general || {
          siteName: 'Kubota Rental Platform',
          siteDescription: 'Professional equipment rental services',
          maintenanceMode: false,
          maxBookingsPerDay: 50,
          defaultCurrency: 'CAD',
          timezone: 'America/Moncton',
        },
        pricing: settingsMap.pricing || {
          baseDailyRate: 450,
          weekendMultiplier: 1.0,
          holidayMultiplier: 1.5,
          longTermDiscount: 0.1,
          depositPercentage: 0.3,
          lateFeePerDay: 25,
        },
        notifications: settingsMap.notifications || {
          emailEnabled: true,
          smsEnabled: false,
          adminNotifications: true,
          customerNotifications: true,
          reminderDays: 1,
        },
        integrations: settingsMap.integrations || {
          stripeEnabled: true,
          stripePublicKey: '',
          stripeSecretKey: '',
          docusignEnabled: false,
          docusignClientId: '',
          googleMapsApiKey: '',
        },
        security: settingsMap.security || {
          sessionTimeout: 480,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          requireTwoFactor: false,
          allowedIpRanges: [],
        },
      };

      setSettings(loadedSettings);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch settings:',
          { component: 'app-page', action: 'error' },
          err as Error
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      // MIGRATED: Fetch admin users from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('id, email, firstName, lastName, role, status, lastLoginAt, createdAt')
        .in('role', ['admin', 'super_admin'])
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Transform to AdminUser format
      const transformed: AdminUser[] = (data || ([] as unknown[])).map((user: unknown) => {
        const roleValue = (user.role as AdminRoleValue) || 'admin';
        const statusValue = (user.status as AdminUserStatus) || 'inactive';

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName || 'N/A',
          lastName: user.lastName || 'N/A',
          role: roleValue.toUpperCase().replace('_', ' '),
          roleValue,
          status: statusValue,
          isActive: statusValue === 'active',
          lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt) : new Date(),
          createdAt: new Date(user.createdAt),
        };
      });

      setAdminUsers(transformed);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to fetch admin users:',
          {
            component: 'app-page',
            action: 'error',
          },
          err as Error
        );
      }
      setAdminUsers([]);
    }
  };

  const handleAddAdminUser = () => {
    setAdminActionError(null);
    setSelectedAdmin(null);
    setShowAdminModal(true);
  };

  const handleEditAdminUser = (admin: AdminUser) => {
    setAdminActionError(null);
    setSelectedAdmin({
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName === 'N/A' ? '' : admin.firstName,
      lastName: admin.lastName === 'N/A' ? '' : admin.lastName,
      role: admin.roleValue,
      status: admin.status,
    });
    setShowAdminModal(true);
  };

  const handleAdminModalClose = () => {
    setShowAdminModal(false);
    setSelectedAdmin(null);
  };

  const handleAdminUserSaved = async () => {
    await fetchAdminUsers();
    setAdminActionError(null);
  };

  const handleDeactivateAdminUser = async (admin: AdminUser) => {
    if (!admin.isActive) {
      setAdminActionError('This admin is already inactive.');
      return;
    }

    try {
      setAdminActionError(null);
      setAdminActionLoading(true);

      const response = await fetchWithAuth(`/api/admin/users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to deactivate admin user');
      }

      await fetchAdminUsers();
    } catch (err) {
      logger.error(
        'Failed to deactivate admin user',
        { component: 'SettingsPage', action: 'deactivate_admin_user' },
        err instanceof Error ? err : new Error(String(err))
      );
      setAdminActionError(err instanceof Error ? err.message : 'Failed to deactivate admin user');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // ✅ BULLETPROOF: Save settings to Supabase system_settings table
      // Get current user ID for audit trail
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Prepare upsert data for all categories
      const settingsToSave = [
        {
          category: 'general',
          settings: settings.general,
          updated_by: user.id,
        },
        {
          category: 'pricing',
          settings: settings.pricing,
          updated_by: user.id,
        },
        {
          category: 'notifications',
          settings: settings.notifications,
          updated_by: user.id,
        },
        {
          category: 'integrations',
          settings: settings.integrations,
          updated_by: user.id,
        },
        {
          category: 'security',
          settings: settings.security,
          updated_by: user.id,
        },
      ];

      // ✅ Save all settings in one transaction
      const supabaseClient4: any = supabase;
      const { error: saveError } = await supabaseClient4
        .from('system_settings')
        .upsert(settingsToSave, {
          onConflict: 'category',
        });

      if (saveError) throw saveError;

      logger.info('Settings saved successfully', {
        component: 'SettingsPage',
        action: 'settings_saved',
        metadata: {
          categories: settingsToSave.map((s) => s.category),
          updatedBy: user.id,
        },
      });

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);

      // Refresh settings to ensure UI matches database
      await fetchSettings();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          'Failed to save settings:',
          { component: 'app-page', action: 'error' },
          err as Error
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (section: keyof SystemSettings, field: string, value: unknown) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
  };

  // DEBUG: Force all tabs to be visible - check if this array is being modified
  const tabs = [
    { id: 'reports', name: 'Reports', shortName: 'Reports', icon: FileText },
    { id: 'jobs', name: 'Jobs', shortName: 'Jobs', icon: RefreshCw },
    { id: 'general', name: 'General', shortName: 'General', icon: Settings },
    { id: 'pricing', name: 'Pricing', shortName: 'Pricing', icon: DollarSign },
    { id: 'notifications', name: 'Notifications', shortName: 'Notifications', icon: Bell },
    { id: 'integrations', name: 'Integrations', shortName: 'Integrations', icon: Globe },
    { id: 'security', name: 'Security', shortName: 'Security', icon: Shield },
    { id: 'permissions', name: 'Permissions', shortName: 'Permissions', icon: Key },
    { id: 'admins', name: 'Admins', shortName: 'Admins', icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load settings</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">
            Configure system-wide settings, pricing, integrations, and security options.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-kubota-orange flex items-center space-x-2 rounded-md px-4 py-2 text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 w-full overflow-hidden">
        <nav
          className="-mb-px flex space-x-0.5 overflow-x-auto sm:space-x-1 md:space-x-2 lg:space-x-3 scrollbar-hide w-full min-w-0 max-w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-0.5 border-b-2 px-1.5 py-2 text-xs font-medium whitespace-nowrap sm:space-x-1 sm:px-2 sm:text-sm flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-kubota-orange text-kubota-orange'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[80px] sm:max-w-none">{tab.shortName}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-lg bg-white p-3 shadow sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">General Settings</h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Site Name</label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Default Currency
                </label>
                <select
                  value={settings.general.defaultCurrency}
                  onChange={(e) =>
                    handleSettingChange('general', 'defaultCurrency', e.target.value)
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                >
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Timezone</label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                >
                  <option value="America/Moncton">America/Moncton (Atlantic Time)</option>
                  <option value="America/Toronto">America/Toronto (Eastern Time)</option>
                  <option value="America/Vancouver">America/Vancouver (Pacific Time)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Max Bookings Per Day
                </label>
                <input
                  type="number"
                  value={settings.general.maxBookingsPerDay}
                  onChange={(e) =>
                    handleSettingChange('general', 'maxBookingsPerDay', parseInt(e.target.value))
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Site Description
              </label>
              <textarea
                value={settings.general.siteDescription}
                onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
                rows={3}
                className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.general.maintenanceMode}
                onChange={(e) =>
                  handleSettingChange('general', 'maintenanceMode', e.target.checked)
                }
                className="text-kubota-orange focus:ring-kubota-orange h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                Enable maintenance mode
              </label>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Pricing Settings</h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Base Daily Rate (CAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.pricing.baseDailyRate}
                  onChange={(e) =>
                    handleSettingChange('pricing', 'baseDailyRate', parseFloat(e.target.value))
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Weekend Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.pricing.weekendMultiplier}
                  onChange={(e) =>
                    handleSettingChange('pricing', 'weekendMultiplier', parseFloat(e.target.value))
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Holiday Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.pricing.holidayMultiplier}
                  onChange={(e) =>
                    handleSettingChange('pricing', 'holidayMultiplier', parseFloat(e.target.value))
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Long-term Discount (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.pricing.longTermDiscount * 100}
                  onChange={(e) =>
                    handleSettingChange(
                      'pricing',
                      'longTermDiscount',
                      parseFloat(e.target.value) / 100
                    )
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Deposit Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.pricing.depositPercentage * 100}
                  onChange={(e) =>
                    handleSettingChange(
                      'pricing',
                      'depositPercentage',
                      parseFloat(e.target.value) / 100
                    )
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Late Fee Per Day (CAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.pricing.lateFeePerDay}
                  onChange={(e) =>
                    handleSettingChange('pricing', 'lateFeePerDay', parseFloat(e.target.value))
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8">
            {/* Basic Notification Settings */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Configure basic notification preferences and delivery methods.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={settings.notifications.emailEnabled}
                    onChange={(e) =>
                      handleSettingChange('notifications', 'emailEnabled', e.target.checked)
                    }
                    className="text-kubota-orange focus:ring-kubota-orange h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="emailEnabled" className="ml-2 block text-sm text-gray-900">
                    Enable email notifications
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smsEnabled"
                    checked={settings.notifications.smsEnabled}
                    onChange={(e) =>
                      handleSettingChange('notifications', 'smsEnabled', e.target.checked)
                    }
                    className="text-kubota-orange focus:ring-kubota-orange h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="smsEnabled" className="ml-2 block text-sm text-gray-900">
                    Enable SMS notifications
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="adminNotifications"
                    checked={settings.notifications.adminNotifications}
                    onChange={(e) =>
                      handleSettingChange('notifications', 'adminNotifications', e.target.checked)
                    }
                    className="text-kubota-orange focus:ring-kubota-orange h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="adminNotifications" className="ml-2 block text-sm text-gray-900">
                    Enable admin notifications
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="customerNotifications"
                    checked={settings.notifications.customerNotifications}
                    onChange={(e) =>
                      handleSettingChange(
                        'notifications',
                        'customerNotifications',
                        e.target.checked
                      )
                    }
                    className="text-kubota-orange focus:ring-kubota-orange h-4 w-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor="customerNotifications"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Enable customer notifications
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Reminder Days Before Booking
                  </label>
                  <input
                    type="number"
                    value={settings.notifications.reminderDays}
                    onChange={(e) =>
                      handleSettingChange('notifications', 'reminderDays', parseInt(e.target.value))
                    }
                    className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Automated Notification Rules */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Automated Notification Rules</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Configure automated notification rules for bookings, maintenance, payments, and
                  more.
                </p>
              </div>
              <NotificationRulesManager />
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Integration Settings</h3>

            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="text-md mb-3 font-medium text-gray-900">
                  Stripe Payment Processing
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="stripeEnabled"
                      checked={settings.integrations.stripeEnabled}
                      onChange={(e) =>
                        handleSettingChange('integrations', 'stripeEnabled', e.target.checked)
                      }
                      className="text-kubota-orange focus:ring-kubota-orange h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="stripeEnabled" className="ml-2 block text-sm text-gray-900">
                      Enable Stripe payments
                    </label>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Stripe Public Key
                    </label>
                    <input
                      type="text"
                      value={settings.integrations.stripePublicKey}
                      onChange={(e) =>
                        handleSettingChange('integrations', 'stripePublicKey', e.target.value)
                      }
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Stripe Secret Key
                    </label>
                    <input
                      type="password"
                      value={settings.integrations.stripeSecretKey}
                      onChange={(e) =>
                        handleSettingChange('integrations', 'stripeSecretKey', e.target.value)
                      }
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="text-md mb-3 font-medium text-gray-900">
                  DocuSign Contract Management
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="docusignEnabled"
                      checked={settings.integrations.docusignEnabled}
                      onChange={(e) =>
                        handleSettingChange('integrations', 'docusignEnabled', e.target.checked)
                      }
                      className="text-kubota-orange focus:ring-kubota-orange h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="docusignEnabled" className="ml-2 block text-sm text-gray-900">
                      Enable DocuSign integration
                    </label>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      DocuSign Client ID
                    </label>
                    <input
                      type="text"
                      value={settings.integrations.docusignClientId}
                      onChange={(e) =>
                        handleSettingChange('integrations', 'docusignClientId', e.target.value)
                      }
                      className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="text-md mb-3 font-medium text-gray-900">Google Maps</h4>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Google Maps API Key
                  </label>
                  <input
                    type="text"
                    value={settings.integrations.googleMapsApiKey}
                    onChange={(e) =>
                      handleSettingChange('integrations', 'googleMapsApiKey', e.target.value)
                    }
                    className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) =>
                    handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) =>
                    handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) =>
                    handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireTwoFactor"
                  checked={settings.security.requireTwoFactor}
                  onChange={(e) =>
                    handleSettingChange('security', 'requireTwoFactor', e.target.checked)
                  }
                  className="text-kubota-orange focus:ring-kubota-orange h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="requireTwoFactor" className="ml-2 block text-sm text-gray-900">
                  Require two-factor authentication
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Allowed IP Ranges (one per line)
              </label>
              <textarea
                value={(settings.security.allowedIpRanges || []).join('\n')}
                onChange={(e) =>
                  handleSettingChange(
                    'security',
                    'allowedIpRanges',
                    e.target.value.split('\n').filter((ip) => ip.trim())
                  )
                }
                rows={4}
                className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                placeholder="192.168.1.0/24&#10;10.0.0.0/8"
              />
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Scheduled Reports</h2>
              <p className="mt-1 text-sm text-gray-600">
                Configure automated reports to be generated and emailed on a schedule.
              </p>
            </div>
            <ScheduledReportsManager />
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Background Jobs</h2>
              <p className="mt-1 text-sm text-gray-600">
                Monitor and manage background job executions, view status, and trigger jobs
                manually.
              </p>
            </div>
            <JobsMonitor />
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Permission Management</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage permissions, roles, and user role assignments. View audit logs for all
                permission changes.
              </p>
            </div>
            <PermissionManager />
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Admin Users</h3>
              <PermissionGate permission="admin_users:create:all">
                <button
                  onClick={handleAddAdminUser}
                  className="bg-kubota-orange rounded-md px-4 py-2 text-white hover:bg-orange-600"
                >
                  Add Admin User
                </button>
              </PermissionGate>
            </div>

            {adminActionError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {adminActionError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                      Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                      Email
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                      Role
                    </th>
                    <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:table-cell md:px-6">
                      Status
                    </th>
                    <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 lg:table-cell lg:px-6">
                      Last Login
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 md:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 sm:px-4 md:px-6">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="px-3 py-4 sm:px-4 md:px-6">
                        <div className="text-sm text-gray-900 truncate max-w-[200px] sm:max-w-none">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-3 py-4 sm:px-4 md:px-6">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="hidden px-3 py-4 sm:px-4 md:table-cell md:px-6">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="hidden px-3 py-4 text-sm text-gray-500 sm:px-4 lg:table-cell lg:px-6">
                        {user.lastLogin.toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 text-right text-sm font-medium sm:px-4 md:px-6">
                        <PermissionGate permission="admin_users:update:all">
                          <button
                            type="button"
                            onClick={() => handleEditAdminUser(user)}
                            className="text-kubota-orange mr-3 hover:text-orange-600"
                          >
                            Edit
                          </button>
                        </PermissionGate>
                        <PermissionGate permission="admin_users:update:all">
                          <button
                            type="button"
                            onClick={() => handleDeactivateAdminUser(user)}
                            disabled={adminActionLoading}
                            className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Deactivate
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
      </div>

      <AdminUserModal
        isOpen={showAdminModal}
        user={selectedAdmin}
        onClose={handleAdminModalClose}
        onSuccess={handleAdminUserSaved}
      />
    </div>
  );
}
