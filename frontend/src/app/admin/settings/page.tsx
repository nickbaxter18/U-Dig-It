'use client';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import {
    AlertTriangle,
    Bell,
    CheckCircle,
    DollarSign,
    Globe,
    Save,
    Settings,
    Shield,
    Users,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchAdminUsers();
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
      (settingsData || [] as any[]).forEach((item: any) => {
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
        logger.error('Failed to fetch settings:', { component: 'app-page', action: 'error' }, err as Error);
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
      const transformed: AdminUser[] = (data || [] as any[]).map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName || 'N/A',
        lastName: user.lastName || 'N/A',
        role: user.role.toUpperCase().replace('_', ' '),
        isActive: user.status === 'active',
        lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt) : new Date(),
        createdAt: new Date(user.createdAt),
      }));

      setAdminUsers(transformed);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to fetch admin users:', {
          component: 'app-page',
          action: 'error',
        }, err as Error);
      }
      setAdminUsers([]);
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
      const { data: { user } } = await supabase.auth.getUser();

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
          categories: settingsToSave.map(s => s.category),
          updatedBy: user.id,
        },
      });

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);

      // Refresh settings to ensure UI matches database
      await fetchSettings();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to save settings:', { component: 'app-page', action: 'error' }, err as Error);
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

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'pricing', name: 'Pricing', icon: DollarSign },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'integrations', name: 'Integrations', icon: Globe },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'admins', name: 'Admin Users', icon: Users },
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
    <div className="space-y-6">
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
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 border-b-2 px-1 py-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-kubota-orange text-kubota-orange'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-lg bg-white p-6 shadow">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">General Settings</h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Site Name</label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={e => handleSettingChange('general', 'siteName', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Default Currency
                </label>
                <select
                  value={settings.general.defaultCurrency}
                  onChange={e => handleSettingChange('general', 'defaultCurrency', e.target.value)}
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
                  onChange={e => handleSettingChange('general', 'timezone', e.target.value)}
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
                  onChange={e =>
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
                onChange={e => handleSettingChange('general', 'siteDescription', e.target.value)}
                rows={3}
                className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.general.maintenanceMode}
                onChange={e => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
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
                  onChange={e =>
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
                  onChange={e =>
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
                  onChange={e =>
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
                  onChange={e =>
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
                  onChange={e =>
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
                  onChange={e =>
                    handleSettingChange('pricing', 'lateFeePerDay', parseFloat(e.target.value))
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailEnabled"
                  checked={settings.notifications.emailEnabled}
                  onChange={e =>
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
                  onChange={e =>
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
                  onChange={e =>
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
                  onChange={e =>
                    handleSettingChange('notifications', 'customerNotifications', e.target.checked)
                  }
                  className="text-kubota-orange focus:ring-kubota-orange h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="customerNotifications" className="ml-2 block text-sm text-gray-900">
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
                  onChange={e =>
                    handleSettingChange('notifications', 'reminderDays', parseInt(e.target.value))
                  }
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>
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
                      onChange={e =>
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
                      onChange={e =>
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
                      onChange={e =>
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
                      onChange={e =>
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
                      onChange={e =>
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
                    onChange={e =>
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
                  onChange={e =>
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
                  onChange={e =>
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
                  onChange={e =>
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
                  onChange={e =>
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
                onChange={e =>
                  handleSettingChange(
                    'security',
                    'allowedIpRanges',
                    e.target.value.split('\n').filter(ip => ip.trim())
                  )
                }
                rows={4}
                className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2"
                placeholder="192.168.1.0/24&#10;10.0.0.0/8"
              />
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Admin Users</h3>
              <button className="bg-kubota-orange rounded-md px-4 py-2 text-white hover:bg-orange-600">
                Add Admin User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {adminUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
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
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {user.lastLogin.toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button className="text-kubota-orange mr-3 hover:text-orange-600">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">Deactivate</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
