/**
 * Contest Email Verification API Route
 *
 * Proxies to contest-verify-email Edge Function
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Verification token required' }, { status: 400 });
    }

    // Call Supabase Edge Function
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/contest-verify-email`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.warn('Contest verification failed', {
        component: 'contest-verify-api',
        action: 'verification_failed',
        metadata: { error: data.error },
      });

      return NextResponse.json(
        { error: data.error || 'Verification failed' },
        { status: response.status }
      );
    }

    logger.info('Contest email verified', {
      component: 'contest-verify-api',
      action: 'verification_success',
      metadata: { entrantId: data.entrantId },
    });

    return NextResponse.json({
      success: true,
      verified: true,
      referralCode: data.referralCode,
      referralLink: data.referralLink,
    });
  } catch (error: unknown) {
    logger.error(
      'Contest verification API error',
      {
        component: 'contest-verify-api',
        action: 'error',
      },
      error
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
