import { User } from '@supabase/supabase-js';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';

import { createClient } from './server';
import { createServiceClient } from './service';

const ADMIN_ROLES = ['admin', 'super_admin'];

interface RequireAdminSuccess {
  supabase:
    | Awaited<ReturnType<typeof createServiceClient>>
    | Awaited<ReturnType<typeof createClient>>;
  user: User;
  role: string;
}

type RequireAdminResult =
  | (RequireAdminSuccess & { error?: undefined })
  | { supabase: Awaited<ReturnType<typeof createClient>>; error: NextResponse };

export async function requireAdmin(request: NextRequest): Promise<RequireAdminResult> {
  const anonSupabase = await createClient();

  const authHeader = request.headers.get('authorization');
  let user: User | null = null;
  let authError = null;

  // Log detailed auth header info for debugging
  logger.debug('Checking auth header', {
    component: 'requireAdmin',
    action: 'auth_header_check',
    metadata: {
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length ?? 0,
      startsWithBearer: authHeader?.startsWith('Bearer ') ?? false,
      authHeaderType: authHeader ? (authHeader.startsWith('Bearer ') ? 'Bearer' : authHeader.startsWith('Basic ') ? 'Basic' : 'Unknown') : 'None',
      headerPreview: authHeader ? authHeader.substring(0, 30) + '...' : 'null',
    },
  });

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    logger.debug('Validating Bearer token', {
      component: 'requireAdmin',
      action: 'validate_bearer_token',
      metadata: {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...',
      },
    });
    const { data, error } = await anonSupabase.auth.getUser(token);
    user = data?.user ?? null;
    authError = error;

    if (authError) {
      logger.warn('Bearer token validation failed', {
        component: 'requireAdmin',
        action: 'bearer_token_validation_failed',
        metadata: {
          error: authError.message,
          errorCode: authError.status,
        },
      });
    }
  } else {
    logger.debug('No Bearer token in auth header, falling back to cookies', {
      component: 'requireAdmin',
      action: 'check_cookies',
      metadata: {
        hasAuthHeader: !!authHeader,
        authHeaderValue: authHeader ? `"${authHeader.substring(0, 20)}..."` : 'null',
      },
    });
    const { data, error } = await anonSupabase.auth.getUser();
    user = data?.user ?? null;
    authError = error;

    if (authError) {
      logger.warn('Cookie-based auth failed', {
        component: 'requireAdmin',
        action: 'cookie_auth_failed',
        metadata: {
          error: authError.message,
          errorCode: authError.status,
        },
      });
    }
  }

  if (authError || !user) {
    logger.error('Authentication failed in requireAdmin', {
      component: 'requireAdmin',
      action: 'auth_failed',
      metadata: {
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader?.substring(0, 20),
        authError: authError?.message,
        authErrorCode: authError?.status,
        hasUser: !!user,
      },
    });
    return {
      supabase: anonSupabase,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: userData, error: userError } = await anonSupabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData || !ADMIN_ROLES.includes(userData.role)) {
    return {
      supabase: anonSupabase,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  const serviceSupabase = await createServiceClient();

  // If service client creation failed, fall back to anon client
  // Note: anon client may have RLS restrictions, but it's better than nothing
  if (!serviceSupabase) {
    logger.warn('Service client creation failed, using anon client (may have RLS restrictions)', {
      component: 'requireAdmin',
      action: 'service_client_fallback',
      metadata: { userId: user.id },
    });
  }

  const supabaseClient = serviceSupabase ?? anonSupabase;

  return {
    supabase: supabaseClient,
    user,
    role: userData.role,
  };
}
