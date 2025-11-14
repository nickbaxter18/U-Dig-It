/**
 * API Route: Job Processor
 *
 * Endpoint that triggers job processing.
 * Can be called by:
 *   - External cron service (e.g., cron-job.org)
 *   - Vercel cron (if on Vercel)
 *   - Manual admin trigger
 */

import { processScheduledJobs } from '@/lib/job-scheduler';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

// Verify cron secret to prevent unauthorized runs
const CRON_SECRET = process.env.CRON_SECRET || 'development-cron-secret';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');

    const isAuthorized =
      authHeader === `Bearer ${CRON_SECRET}` ||
      cronSecret === CRON_SECRET;

    if (!isAuthorized) {
      logger.warn('Unauthorized job processor access', {
        component: 'job-processor-api',
        action: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Process jobs
    logger.info('Job processor triggered', {
      component: 'job-processor-api',
      action: 'triggered',
      metadata: { timestamp: new Date().toISOString() },
    });

    const result = await processScheduledJobs();

    return NextResponse.json({
      success: result.success,
      processed: result.processed || 0,
      successes: result.successes || 0,
      failures: result.failures || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    logger.error('Job processor failed', {
      component: 'job-processor-api',
      action: 'error',
      metadata: { error: error.message },
    }, error);

    return NextResponse.json(
      { error: 'Job processing failed', details: error.message },
      { status: 500 }
    );
  }
}

// Allow GET for health checks
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'job-processor',
    timestamp: new Date().toISOString(),
  });
}

























