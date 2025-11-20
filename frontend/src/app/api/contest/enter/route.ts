/**
 * Contest Entry API Route
 *
 * Proxies to contest-entry Edge Function with rate limiting and validation
 */
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { broadcastInAppNotificationToAdmins } from '@/lib/notification-service';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

// Validation schema
const entrySchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  postalCode: z.string().min(3, 'Postal code is required').max(10),
  city: z.string().optional(),
  referralCode: z.string().optional(),
  marketingConsent: z.boolean(),
  rulesAccepted: z.boolean().refine((val: unknown) => val === true, {
    message: 'You must accept the contest rules',
  }),
  deviceFingerprint: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting (10 requests per minute)
    const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many contest entries. Please try again later.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = entrySchema.parse(body);

    // Get UTM parameters from headers/referer
    const referer = request.headers.get('referer') || '';
    const url = new URL(referer || 'http://localhost');
    const utmSource = url.searchParams.get('utm_source') || undefined;
    const utmCampaign = url.searchParams.get('utm_campaign') || undefined;
    const utmMedium = url.searchParams.get('utm_medium') || undefined;

    // Call Supabase Edge Function
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/contest-entry`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-forwarded-for':
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        'user-agent': request.headers.get('user-agent') || 'unknown',
      },
      body: JSON.stringify({
        ...validated,
        utmSource,
        utmCampaign,
        utmMedium,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.warn('Contest entry rejected', {
        component: 'contest-api',
        action: 'entry_rejected',
        metadata: { error: data.error, email: validated.email },
      });

      return NextResponse.json(
        { error: data.error || 'Failed to submit entry' },
        { status: response.status }
      );
    }

    logger.info('Contest entry successful', {
      component: 'contest-api',
      action: 'entry_success',
      metadata: {
        entrantId: data.entrantId,
        hasReferral: !!validated.referralCode,
      },
    });

    const responseBody = {
      success: true,
      entrantId: data.entrantId,
      referralCode: data.referralCode,
      referralLink: data.referralLink,
      message: 'Entry submitted! Check your email to verify.',
    };

    await broadcastInAppNotificationToAdmins({
      supabase: undefined,
      category: 'marketing',
      priority: 'low',
      title: 'New contest entry received',
      message: `${validated.firstName} ${validated.lastName} just entered the contest.`,
      templateId: 'contest_entry_received',
      templateData: {
        entrantId: data.entrantId,
        email: validated.email,
        referralCode: validated.referralCode,
      },
      metadata: {
        entrantId: data.entrantId,
        email: validated.email,
        audience: 'admin',
      },
    });

    return NextResponse.json(responseBody);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Contest entry API error',
      {
        component: 'contest-api',
        action: 'error',
      },
      error
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
