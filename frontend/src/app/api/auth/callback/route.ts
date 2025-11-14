import { logger } from '@/lib/logger';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard';

  logger.debug('API Callback received', {
    component: 'api-callback',
    action: 'callback_received',
    metadata: {
      codePreview: code?.substring(0, 10) + '...',
      redirect,
    },
  });

  if (code) {
    const cookieStore = await cookies();

    // Create response object
    const response = NextResponse.redirect(new URL(redirect, requestUrl.origin));

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Set on the response that will be sent to browser
            // CRITICAL: Do NOT set httpOnly for the main auth cookie so client can read it
            const isAuthCookie = name.includes('auth-token');
            response.cookies.set({
              name,
              value,
              ...options,
              httpOnly: !isAuthCookie, // Allow client to read auth token
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
            });
            logger.debug('Cookie set', {
              component: 'api-callback',
              action: 'set_cookie',
              metadata: {
                cookieName: name,
                httpOnly: !isAuthCookie,
              },
            });
          } catch (e) {
            logger.error(
              'Cookie set error',
              {
                component: 'api-callback',
                action: 'cookie_error',
                metadata: { cookieName: name },
              },
              e instanceof Error ? e : undefined
            );
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            });
          } catch (e) {
            logger.error('Cookie remove error', {
              component: 'api-callback',
              action: 'error',
            }, e instanceof Error ? e : undefined);
          }
        },
      },
    });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        logger.error('❌ Code exchange error', {
          component: 'api-callback',
          action: 'error',
        }, error);
        return NextResponse.redirect(
          new URL('/auth/signin?error=code_exchange_failed', requestUrl.origin)
        );
      }

      if (data.session) {
        logger.debug('✅ Session created for user', {
          component: 'api-callback',
          action: 'debug',
          metadata: { email: data.session.user.email },
        });
        logger.debug('✅ Access token exists', {
          component: 'api-callback',
          action: 'debug',
          metadata: { hasAccessToken: !!data.session.access_token },
        });
        logger.debug('✅ Refresh token exists', {
          component: 'api-callback',
          action: 'debug',
          metadata: { hasRefreshToken: !!data.session.refresh_token },
        });
        logger.debug('✅ User role', {
          component: 'api-callback',
          action: 'debug',
          metadata: { role: data.session.user.user_metadata?.role },
        });

        // ALSO store session in localStorage-compatible cookie for client-side access
        // This ensures the browser client can immediately pick up the session
        const sessionData = JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
          token_type: data.session.token_type,
          user: data.session.user,
        });

        response.cookies.set({
          name: 'supabase.auth.token',
          value: sessionData,
          httpOnly: false, // Allow client to read this
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        logger.debug('✅ Session also stored in client-accessible cookie', {
          component: 'api-callback',
          action: 'debug',
        });
      }

      // Return the response with cookies set
      return response;
    } catch (error) {
      logger.error('❌ Code exchange exception', {
        component: 'api-callback',
        action: 'error',
      }, error instanceof Error ? error : undefined);
      return NextResponse.redirect(
        new URL('/auth/signin?error=callback_failed', requestUrl.origin)
      );
    }
  }

  logger.debug('⚠️ No code provided, redirecting', {
    component: 'api-callback',
    action: 'debug',
    metadata: { redirect },
  });
  return NextResponse.redirect(new URL(redirect, requestUrl.origin));
}
