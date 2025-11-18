import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimit, RateLimitPresets } from '@/lib/rate-limiter';
import { createClient } from '@/lib/supabase/server';
import { validateRequest } from '@/lib/request-validator';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const markSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1).optional(),
  markAll: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const rate = await rateLimit(request, RateLimitPresets.MODERATE);
  if (!rate.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rate.headers });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('notifications')
    .select('id, category, title, message, created_at, read_at, priority, action_url, cta_label', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('type', 'in_app')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    logger.error('Failed to fetch notifications via API', {
      component: 'notifications-api',
      action: 'fetch_error',
      metadata: { userId: user.id },
    }, error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: count ? Math.ceil(count / limit) : null,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const limiter = await rateLimit(request, RateLimitPresets.STRICT);
  if (!limiter.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: limiter.headers });
  }

  const validation = await validateRequest(request, {
    maxSize: 2048,
    allowedContentTypes: ['application/json'],
  });
  if (!validation.valid) {
    return validation.error!;
  }

  const payload = markSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { notificationIds, markAll } = payload.data;

  if (markAll) {
    const { error } = await supabase.rpc('mark_all_notifications_read');
    if (error) {
      logger.error('Failed to mark all notifications as read (API)', {
        component: 'notifications-api',
        action: 'mark_all_error',
        metadata: { userId: user.id },
      }, error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: 'all' });
  }

  if (!notificationIds || notificationIds.length === 0) {
    return NextResponse.json({ error: 'notificationIds is required unless markAll is true' }, { status: 400 });
  }

  const results = await Promise.allSettled(
    notificationIds.map(id =>
      supabase.rpc('mark_notification_read', {
        notification_id: id,
      })
    )
  );

  const failures = results.filter(result => result.status === 'rejected');
  if (failures.length > 0) {
    logger.error('Failed to mark one or more notifications as read', {
      component: 'notifications-api',
      action: 'partial_update_error',
      metadata: { userId: user.id, failures: failures.length },
    });
  }

  return NextResponse.json({ success: true, updated: notificationIds.length, failures: failures.length });
}
