import { NextRequest, NextResponse } from 'next/server';

import { checkAndCompleteBookingIfReady } from '@/lib/check-and-complete-booking';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, context: RouteContext) {
  const paramId = context?.params?.id;
  const urlId = request.nextUrl?.pathname?.split('/')?.[3] ?? null;
  const bookingId = paramId ?? urlId ?? '';

  if (!bookingId) {
    logger.error('Booking completion check missing booking ID', {
      component: 'check-completion-api',
      action: 'missing_booking_id',
      metadata: {
        paramId,
        urlId,
        pathname: request.nextUrl?.pathname,
      },
    });

    return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized completion check attempt', {
        component: 'check-completion-api',
        action: 'unauthorized',
        metadata: { bookingId },
      });

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stepCompleted = 'Unknown Step' } = await request
      .json()
      .catch(() => ({ stepCompleted: 'Unknown Step' }));

    logger.info('Manually triggering booking completion check', {
      component: 'check-completion-api',
      action: 'triggered',
      metadata: { bookingId, stepCompleted, userId: user.id, userEmail: user.email },
    });

    const result = await checkAndCompleteBookingIfReady(bookingId, stepCompleted);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error(
      'Error running booking completion check',
      {
        component: 'check-completion-api',
        action: 'error',
        metadata: { bookingId },
      },
      error as Error
    );

    return NextResponse.json({ error: 'Failed to run completion check' }, { status: 500 });
  }
}
