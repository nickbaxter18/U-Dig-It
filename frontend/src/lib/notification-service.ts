import type { Database } from '@/../../supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { logger } from '@/lib/logger';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

export type NotificationCategory = Database['public']['Enums']['notification_category'];
export type NotificationPriority = Database['public']['Enums']['priority_level'];
export type NotificationStatus = Database['public']['Enums']['notification_status'];

type Json = Database['public']['Tables']['notifications']['Row']['template_data'];

type TypedSupabaseClient = SupabaseClient<Database>;

let serviceSupabaseClient: TypedSupabaseClient | null = null;

function ensureSupabaseClient(client?: TypedSupabaseClient): TypedSupabaseClient {
  if (client) return client;

  if (!serviceSupabaseClient) {
    const url = SUPABASE_URL;
    const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error('Supabase client is required to create notifications');
    }

    serviceSupabaseClient = createSupabaseClient<Database>(url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return serviceSupabaseClient;
}

const DEFAULT_APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.APP_BASE_URL ||
  'http://localhost:3000';

function normalizeActionUrl(actionUrl?: string | null): string | null {
  if (!actionUrl) return null;

  try {
    if (actionUrl.startsWith('/')) {
      return actionUrl;
    }

    const base = new URL(DEFAULT_APP_BASE_URL);
    const parsed = new URL(actionUrl, base);

    if (parsed.origin === base.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
    }

    return parsed.toString();
  } catch (error) {
    logger.warn('Failed to normalize action URL for notification', {
      component: 'notification-service',
      action: 'normalize_action_url_warning',
      metadata: {
        actionUrl,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return actionUrl;
  }
}

export interface CreateInAppNotificationInput {
  supabase?: TypedSupabaseClient;
  userId?: string | null;
  title: string;
  message: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  actionUrl?: string | null;
  ctaLabel?: string | null;
  templateId?: string | null;
  templateData?: Json;
  metadata?: Json;
  status?: NotificationStatus;
}

/**
 * Persist an in-app notification with safe defaults applied.
 * Callers may pass an existing Supabase client (server-side) to avoid re-instantiation.
 */
export async function createInAppNotification({
  supabase,
  userId = null,
  title,
  message,
  category = 'system',
  priority = 'medium',
  actionUrl,
  ctaLabel,
  templateId,
  templateData,
  metadata,
  status = 'sent',
}: CreateInAppNotificationInput) {
  const supabaseClient = ensureSupabaseClient(supabase);

  const payload: Database['public']['Tables']['notifications']['Insert'] = {
    user_id: userId,
    type: 'in_app',
    status,
    priority,
    title,
    message,
    category,
    action_url: normalizeActionUrl(actionUrl),
    cta_label: ctaLabel ?? null,
    template_id: templateId ?? null,
    template_data: templateData ?? null,
    metadata: metadata ?? null,
  };

  const { data, error } = await supabaseClient
    .from('notifications')
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    logger.error(
      'Failed to create in-app notification',
      {
        component: 'notification-service',
        action: 'create_in_app_notification',
        metadata: {
          userId,
          title,
          category,
        },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    throw error;
  }

  logger.info('In-app notification created', {
    component: 'notification-service',
    action: 'create_in_app_notification',
    metadata: {
      userId,
      notificationId: data?.id,
      category,
      priority,
    },
  });

  return data;
}

export interface BroadcastAdminsInput extends Omit<CreateInAppNotificationInput, 'userId'> {
  supabase?: TypedSupabaseClient;
}

/**
 * Broadcast an in-app notification to every admin/super_admin user.
 */
export async function broadcastInAppNotificationToAdmins({
  supabase,
  ...rest
}: BroadcastAdminsInput) {
  const client = ensureSupabaseClient(supabase);

  const { data: admins, error } = await client
    .from('users')
    .select('id')
    .in('role', ['admin', 'super_admin']);

  if (error) {
    logger.error(
      'Failed to resolve admin recipients',
      {
        component: 'notification-service',
        action: 'broadcast_admin_lookup_failed',
      },
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }

  if (!admins || admins.length === 0) {
    logger.warn('No admin recipients found for broadcast notification', {
      component: 'notification-service',
      action: 'broadcast_admin_no_recipients',
    });
    return [];
  }

  const results = await Promise.allSettled(
    admins.map((admin) =>
      createInAppNotification({
        supabase: client,
        userId: admin.id,
        ...rest,
      })
    )
  );

  const fulfilled = results
    .map((result) => (result.status === 'fulfilled' ? result.value : null))
    .filter(Boolean);

  const rejected = results.filter((result) => result.status === 'rejected');
  if (rejected.length > 0) {
    logger.error('One or more admin notifications failed to broadcast', {
      component: 'notification-service',
      action: 'broadcast_admin_partial_failure',
      metadata: { failures: rejected.length },
    });
  }

  return fulfilled;
}
