'use client';

import type { Database } from '@/../../supabase/types';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

type UiPriority = 'low' | 'medium' | 'high' | 'urgent';

interface NotificationItem {
  id: string;
  category: Database['public']['Enums']['notification_category'];
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  priority: UiPriority;
  actionUrl?: string | null;
  ctaLabel?: string | null;
}

interface NotificationCenterProps {
  userId?: string;
  showBadge?: boolean;
}

const priorityMap: Record<Database['public']['Enums']['priority_level'], UiPriority> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'urgent',
};

const transformNotification = (row: NotificationRow): NotificationItem => ({
  id: row.id,
  category: row.category ?? 'system',
  title: row.title,
  message: row.message,
  createdAt: row.created_at ?? new Date().toISOString(),
  readAt: row.read_at ?? null,
  priority: priorityMap[row.priority ?? 'medium'],
  actionUrl: row.action_url ?? null,
  ctaLabel: row.cta_label ?? null,
});

export default function NotificationCenter({ userId, showBadge = true }: NotificationCenterProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  );

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, category, title, message, created_at, read_at, priority, action_url, cta_label'
        )
        .eq('user_id', userId)
        .eq('type', 'in_app')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications((data ?? []).map(transformNotification));
    } catch (error) {
      logger.error(
        'Failed to fetch notifications',
        {
          component: 'NotificationCenter',
          action: 'fetch_error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new?.type !== 'in_app') return;
          const notification = transformNotification(payload.new as NotificationRow);
          setNotifications((prev) =>
            [notification, ...prev.filter((n) => n.id !== notification.id)].slice(0, 20)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new?.type !== 'in_app') return;
          const notification = transformNotification(payload.new as NotificationRow);
          setNotifications((prev) =>
            prev.map((existing) => (existing.id === notification.id ? notification : existing))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readAt: notification.readAt ?? new Date().toISOString() }
            : notification
        )
      );

      const { error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      if (error) {
        logger.error(
          'Failed to mark notification as read',
          {
            component: 'NotificationCenter',
            action: 'mark_read_error',
            metadata: { notificationId },
          },
          error instanceof Error ? error : new Error(String(error))
        );
        fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    // Optimistically update local state
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        readAt: notification.readAt ?? new Date().toISOString(),
      }))
    );

    const { data, error } = await supabase.rpc('mark_all_notifications_read');

    if (error) {
      logger.error(
        'Failed to mark all notifications as read',
        {
          component: 'NotificationCenter',
          action: 'mark_all_read_error',
          metadata: { userId, error: error.message },
        },
        error instanceof Error ? error : new Error(String(error))
      );
      // Revert optimistic update on error
      fetchNotifications();
    } else {
      // Refetch to ensure consistency (realtime might not catch all updates)
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  const resolveActionUrl = useCallback((url: string) => {
    if (!url) return null;

    try {
      if (url.startsWith('/')) {
        return url;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      if (!origin) return url;

      const base = new URL(origin);
      const target = new URL(url, base);

      if (target.origin === base.origin) {
        return `${target.pathname}${target.search}${target.hash}` || '/';
      }

      return target.toString();
    } catch (error) {
      logger.warn('Failed to resolve notification action URL', {
        component: 'NotificationCenter',
        action: 'resolve_action_url_warning',
        metadata: {
          url,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return url;
    }
  }, []);

  const handleNotificationClick = useCallback(
    async (notification: NotificationItem) => {
      void markAsRead(notification.id);

      if (notification.actionUrl) {
        const target = resolveActionUrl(notification.actionUrl);
        if (!target) {
          logger.warn('Failed to resolve notification action URL', {
            component: 'NotificationCenter',
            action: 'click_no_target',
            metadata: { notificationId: notification.id, actionUrl: notification.actionUrl },
          });
          return;
        }

        logger.debug('Navigating from notification', {
          component: 'NotificationCenter',
          action: 'notification_click',
          metadata: { notificationId: notification.id, target },
        });

        setIsOpen(false);

        if (target.startsWith('http')) {
          window.location.href = target;
        } else {
          router.push(target);
          // Scroll to top when navigating to booking page
          if (target.includes('/book')) {
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
          }
        }
      }
    },
    [markAsRead, resolveActionUrl, router]
  );

  const getNotificationIcon = (category: NotificationItem['category']) => {
    switch (category) {
      case 'booking':
        return '📋';
      case 'payment':
        return '💳';
      case 'equipment':
        return '🚜';
      case 'reminder':
        return '⏰';
      case 'support':
        return '🆘';
      case 'compliance':
        return '⚖️';
      case 'marketing':
        return '📣';
      default:
        return '🔔';
    }
  };

  const getPriorityClasses = (priority: UiPriority) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      case 'low':
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center text-gray-500 transition-colors hover:text-[#E1BC56]"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {showBadge && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 transition-colors hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-3/4 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <svg
                  className="mx-auto mb-3 h-12 w-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full border-l-4 p-4 text-left transition-colors ${getPriorityClasses(notification.priority)} ${
                    !notification.readAt ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg" aria-hidden>
                      {getNotificationIcon(notification.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="truncate text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.readAt && (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="mt-1 line-clamp-3 text-sm text-gray-600">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      {notification.actionUrl && (
                        <span className="mt-2 inline-flex items-center text-xs font-medium text-blue-600">
                          {notification.ctaLabel ?? 'View details'}
                          <svg
                            className="ml-1 h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-4">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block w-full rounded py-2 text-center text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
