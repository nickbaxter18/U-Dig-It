import { logger } from '@/lib/logger';
import { createInAppNotification } from '@/lib/notification-service';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { createClient } from '@/lib/supabase/server';
import { validateRequest } from '@/lib/request-validator';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bookingExitSchema = z.object({
  step: z.number().int().min(1).max(6).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  deliveryCity: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const limiter = await rateLimit(request, RateLimitPresets.LIGHT);
  if (!limiter.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: limiter.headers });
  }

  const validation = await validateRequest(request, {
    maxSize: 2048,
    allowedContentTypes: ['application/json', 'text/plain', 'application/octet-stream'],
  });
  if (!validation.valid) {
    return validation.error!;
  }

  let payload: unknown = null;

  try {
    payload = await request.json();
  } catch (error) {
    logger.debug('[booking-exit] Unable to parse request body as JSON', {
      component: 'notifications-api',
      action: 'booking_exit_parse',
    });
  }

  const parsed = bookingExitSchema.safeParse(payload ?? {});

  if (!parsed.success) {
    return NextResponse.json({ skipped: true, reason: 'invalid_payload' }, { status: 200 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ skipped: true, reason: 'unauthenticated' }, { status: 200 });
  }

  const reminderWindow = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data: existing, error: existingError } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', user.id)
    .eq('category', 'reminder')
    .eq('title', 'Finish setting up your booking')
    .gte('created_at', reminderWindow)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    logger.error('Failed to check existing booking exit notifications', {
      component: 'notifications-api',
      action: 'booking_exit_lookup_error',
      metadata: { userId: user.id },
    }, existingError instanceof Error ? existingError : new Error(String(existingError)));
  }

  if (existing) {
    return NextResponse.json({ skipped: true, reason: 'already_notified' }, { status: 200 });
  }

  const { step, startDate, endDate, deliveryCity } = parsed.data;

  try {
    await createInAppNotification({
      supabase,
      userId: user.id,
      category: 'reminder',
      priority: 'low',
      title: 'Finish setting up your booking',
      message: `We saved your progress${step ? ` on step ${step}` : ''}. Come back to secure your equipment rental.`.trim(),
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/book?resume=1`,
      ctaLabel: 'Resume booking',
      templateId: 'booking_flow_exit',
      templateData: {
        step,
        startDate,
        endDate,
        deliveryCity,
      },
      metadata: {
        event: 'booking_flow_exit',
        step,
        deliveryCity,
      },
    });
  } catch (error) {
    logger.error('Failed to create booking exit notification', {
      component: 'notifications-api',
      action: 'booking_exit_notification_error',
      metadata: { userId: user.id },
    }, error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}



