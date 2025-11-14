import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const healthCheck: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      supabase: { status: 'unknown' as string },
      database: { status: 'unknown' as string },
      auth: { status: 'unknown' as string },
    },
  };

  try {
    // MIGRATED: Check Supabase connectivity
    const supabase = await createClient();

    // Check database connection
    const { data, error } = await supabase.from('equipment').select('count').limit(1);

    const responseTime = Date.now() - startTime;

    if (!error) {
      healthCheck.services.supabase = {
        status: 'up',
        response_time_ms: responseTime,
      };
      healthCheck.services.database = {
        status: 'up',
        response_time_ms: responseTime,
      };
    } else {
      healthCheck.services.supabase = {
        status: 'down',
        error: error.message,
      };
      healthCheck.services.database = {
        status: 'down',
        error: error.message,
      };
    }

    // Check auth
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();
    healthCheck.services.auth = {
      status: authError ? 'down' : 'up',
      has_session: !!session,
    };
  } catch (error) {
    healthCheck.services.supabase = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    healthCheck.services.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    healthCheck.services.auth = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Update overall status based on service health
  const criticalServices = ['supabase', 'database'];
  const hasCriticalFailures = criticalServices.some(
    service => healthCheck.services[service].status === 'down'
  );

  if (hasCriticalFailures) {
    healthCheck.status = 'error';
  }

  const statusCode = healthCheck.status === 'ok' ? 200 : 503;

  return NextResponse.json(healthCheck, { status: statusCode });
}
