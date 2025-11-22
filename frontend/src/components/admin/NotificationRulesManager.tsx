'use client';

import {
  Bell,
  Edit2,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';

import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import { useAdminToast } from './AdminToastProvider';

interface NotificationRule {
  id: string;
  name: string;
  rule_type: string;
  trigger_conditions: Record<string, unknown>;
  channels: string[];
  template_id: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface NotificationRulesManagerProps {
  onRuleChange?: () => void;
}

const RULE_TYPES = [
  { value: 'booking_pickup_reminder', label: 'Booking Pickup Reminder' },
  { value: 'booking_return_reminder', label: 'Booking Return Reminder' },
  { value: 'booking_deposit_due', label: 'Booking Deposit Due' },
  { value: 'booking_confirmation', label: 'Booking Confirmation' },
  { value: 'maintenance_due', label: 'Maintenance Due' },
  { value: 'maintenance_overdue', label: 'Maintenance Overdue' },
  { value: 'payment_due', label: 'Payment Due' },
  { value: 'payment_overdue', label: 'Payment Overdue' },
  { value: 'insurance_expiring', label: 'Insurance Expiring' },
  { value: 'contract_pending_signature', label: 'Contract Pending Signature' },
];

const CHANNELS = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'inapp', label: 'In-App', icon: Bell },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'push', label: 'Push', icon: Smartphone },
];

export function NotificationRulesManager({ onRuleChange }: NotificationRulesManagerProps) {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const toast = useAdminToast();

  const [formData, setFormData] = useState({
    name: '',
    ruleType: 'booking_pickup_reminder',
    daysBefore: 1,
    channels: ['email'] as string[],
    isActive: true,
    priority: 0,
  });

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/admin/notifications/rules');
      if (!response.ok) {
        throw new Error('Failed to load notification rules');
      }

      const data = await response.json();
      setRules(data.rules || []);
    } catch (error) {
      toast.error(
        'Failed to load notification rules',
        error instanceof Error ? error.message : 'Unable to fetch notification rules'
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Validation error', 'Please provide a rule name');
      return;
    }

    try {
      const response = await fetchWithAuth('/api/admin/notifications/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          ruleType: formData.ruleType,
          triggerConditions: {
            days_before: formData.daysBefore,
          },
          channels: formData.channels,
          isActive: formData.isActive,
          priority: formData.priority,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create notification rule');
      }

      toast.success('Rule created', 'Notification rule created successfully');
      setShowCreateModal(false);
      setFormData({
        name: '',
        ruleType: 'booking_pickup_reminder',
        daysBefore: 1,
        channels: ['email'],
        isActive: true,
        priority: 0,
      });
      await fetchRules();
      onRuleChange?.();
    } catch (error) {
      toast.error(
        'Failed to create notification rule',
        error instanceof Error ? error.message : 'Unable to create notification rule'
      );
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this notification rule?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/admin/notifications/rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete notification rule');
      }

      toast.success('Rule deleted', 'Notification rule deleted successfully');
      await fetchRules();
      onRuleChange?.();
    } catch (error) {
      toast.error(
        'Failed to delete notification rule',
        error instanceof Error ? error.message : 'Unable to delete notification rule'
      );
    }
  };

  const handleToggleActive = async (rule: NotificationRule) => {
    try {
      const response = await fetchWithAuth(`/api/admin/notifications/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !rule.is_active,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update rule');
      }

      toast.success(
        'Rule updated',
        `Rule ${!rule.is_active ? 'activated' : 'deactivated'} successfully`
      );
      await fetchRules();
      onRuleChange?.();
    } catch (error) {
      toast.error(
        'Failed to update rule',
        error instanceof Error ? error.message : 'Unable to update notification rule'
      );
    }
  };

  const toggleChannel = (channel: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const getRuleTypeLabel = (ruleType: string) => {
    return RULE_TYPES.find((r) => r.value === ruleType)?.label || ruleType;
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Automated Notification Rules</h3>
        <button
          onClick={() => {
            setEditingRule(null);
            setFormData({
              name: '',
              ruleType: 'booking_pickup_reminder',
              daysBefore: 1,
              channels: ['email'],
              isActive: true,
              priority: 0,
            });
            setShowCreateModal(true);
          }}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">No notification rules configured</p>
          <button
            onClick={() => {
              setEditingRule(null);
              setFormData({
                name: '',
                ruleType: 'booking_pickup_reminder',
                daysBefore: 1,
                channels: ['email'],
                isActive: true,
                priority: 0,
              });
              setShowCreateModal(true);
            }}
            className="mt-4 text-sm text-premium-gold hover:text-premium-gold-dark"
          >
            Create your first rule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md ${
                rule.is_active ? 'bg-white' : 'bg-gray-50 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                    {rule.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                        Inactive
                      </span>
                    )}
                    {rule.priority > 0 && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        Priority {rule.priority}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="font-medium">{getRuleTypeLabel(rule.rule_type)}</span>
                    {rule.trigger_conditions?.days_before && (
                      <span>{rule.trigger_conditions.days_before} day(s) before</span>
                    )}
                    <span className="flex items-center">
                      Channels:{' '}
                      {rule.channels.map((ch, idx) => {
                        const channelInfo = CHANNELS.find((c) => c.value === ch);
                        const Icon = channelInfo?.icon || Bell;
                        return (
                          <span key={ch} className="ml-1 flex items-center">
                            <Icon className="mr-1 h-3 w-3" />
                            {channelInfo?.label || ch}
                            {idx < rule.channels.length - 1 && ','}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      rule.is_active
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                    title={rule.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {rule.is_active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Rule Modal */}
      <AdminModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingRule(null);
          setFormData({
            name: '',
            ruleType: 'booking_pickup_reminder',
            daysBefore: 1,
            channels: ['email'],
            isActive: true,
            priority: 0,
          });
        }}
        title="Create Notification Rule"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateRule} className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Rule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g., Pickup Reminder 24h Before"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Rule Type</label>
            <select
              value={formData.ruleType}
              onChange={(e) => setFormData((prev) => ({ ...prev, ruleType: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {RULE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Days Before Event
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={formData.daysBefore}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, daysBefore: parseInt(e.target.value) || 0 }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              How many days before the event should the notification be sent?
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notification Channels
            </label>
            <div className="mt-2 flex flex-wrap gap-3">
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                const isSelected = formData.channels.includes(channel.value);
                return (
                  <button
                    key={channel.value}
                    type="button"
                    onClick={() => toggleChannel(channel.value)}
                    className={`flex items-center rounded-md border px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? 'border-premium-gold bg-premium-gold-50 text-premium-gold'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {channel.label}
                  </button>
                );
              })}
            </div>
            {formData.channels.length === 0 && (
              <p className="mt-1 text-xs text-red-500">At least one channel must be selected</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Higher priority rules are processed first
              </p>
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-premium-gold focus:ring-premium-gold"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setEditingRule(null);
                setFormData({
                  name: '',
                  ruleType: 'booking_pickup_reminder',
                  daysBefore: 1,
                  channels: ['email'],
                  isActive: true,
                  priority: 0,
                });
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formData.channels.length === 0}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:shadow-none"
            >
              Create Rule
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
