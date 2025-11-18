import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

// Verify cron secret to prevent unauthorized runs
const CRON_SECRET = process.env.CRON_SECRET || 'development-cron-secret';

/**
 * GET /api/cron/generate-notifications
 * Generate notifications based on automated rules
 * Should be called by cron service hourly
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');

    const isAuthorized =
      authHeader === `Bearer ${CRON_SECRET}` ||
      cronSecret === CRON_SECRET ||
      request.headers.get('x-vercel-cron') === 'true';

    if (!isAuthorized) {
      logger.warn('Unauthorized notification generator access', {
        component: 'cron-generate-notifications',
        action: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceClient();
    if (!supabaseAdmin) {
      logger.error('Service client unavailable for notification generation', {
        component: 'cron-generate-notifications',
        action: 'missing_client',
      });
      return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
    }

    // Call database functions to generate notifications
    const { data: bookingCount, error: bookingError } = await supabaseAdmin.rpc(
      'queue_booking_reminders'
    );

    if (bookingError) {
      logger.error(
        'Failed to queue booking reminders',
        {
          component: 'cron-generate-notifications',
          action: 'booking_reminders_failed',
        },
        bookingError
      );
    }

    const { data: maintenanceCount, error: maintenanceError } = await supabaseAdmin.rpc(
      'queue_maintenance_reminders'
    );

    if (maintenanceError) {
      logger.error(
        'Failed to queue maintenance reminders',
        {
          component: 'cron-generate-notifications',
          action: 'maintenance_reminders_failed',
        },
        maintenanceError
      );
    }

    logger.info('Notification generation completed', {
      component: 'cron-generate-notifications',
      action: 'completed',
      metadata: {
        bookingReminders: bookingCount || 0,
        maintenanceReminders: maintenanceCount || 0,
      },
    });

    return NextResponse.json({
      success: true,
      bookingReminders: bookingCount || 0,
      maintenanceReminders: maintenanceCount || 0,
    });
  } catch (error) {
    logger.error(
      'Unexpected error generating notifications',
      {
        component: 'cron-generate-notifications',
        action: 'unexpected_error',
      },
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


