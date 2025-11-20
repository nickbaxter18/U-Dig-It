import { createServerClient } from '@supabase/ssr';

import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

export async function proxy(req: NextRequest) {
  // Create a response object that we'll manipulate
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: unknown) {
        // Set cookie on the request for subsequent calls
        req.cookies.set({
          name,
          value,
          ...options,
        });
        // Set cookie on the response to send back to client
        res = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });
        res.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: unknown) {
        // Remove cookie from the request
        req.cookies.set({
          name,
          value: '',
          ...options,
        });
        // Remove cookie from the response
        res = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });
        res.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Verify the authenticated user with Supabase Auth server
  // Supabase docs recommend using getUser for trusted identity information:
  // https://supabase.com/docs/guides/auth/sessions
  const {
    data: { user: verifiedUser },
    error: userLookupError,
  } = await supabase.auth.getUser();

  let user = verifiedUser;

  if (userLookupError) {
    const isRetryableError =
      userLookupError.name === 'AuthRetryableFetchError' ||
      'status' in userLookupError ||
      'code' in userLookupError;

    logger.error('Failed to verify user during proxy auth check', {
      component: 'proxy',
      action: 'auth_check_failed',
      metadata: {
        path: req.nextUrl.pathname,
        error: userLookupError,
        isRetryableError,
      },
    });

    // Gracefully degrade: fall back to session data when Supabase Auth is unreachable
    if (!user && session?.user) {
      logger.warn('Falling back to session user due to Supabase auth fetch error', {
        component: 'proxy',
        action: 'auth_check_fallback',
        metadata: {
          path: req.nextUrl.pathname,
          reason: userLookupError.name,
        },
      });
      user = session.user;
    }
  }

  // Debug logging
  const authCookie = req.cookies.get('sb-bnimazxnqligusckahab-auth-token');
  logger.debug('Proxy authentication check', {
    component: 'proxy',
    action: 'auth_check',
    metadata: {
      path: req.nextUrl.pathname,
      hasUser: !!user,
      hasCookie: !!authCookie,
      cookiePreview: authCookie?.value?.substring(0, 20) + '...',
    },
  });

  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
  const isTestPage = req.nextUrl.pathname.startsWith('/test-admin');

  // Add security headers to all responses (CRITICAL SECURITY)
  const addSecurityHeaders = (response: NextResponse) => {
    // Content Security Policy - Prevents XSS attacks
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' https://fonts.gstatic.com data:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://maps.googleapis.com",
        "frame-src 'self' https://js.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
      ].join('; ')
    );

    // Prevent clickjacking attacks
    response.headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Enable browser XSS protection
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Control referrer information
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy - restrict access to browser features
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(self), payment=(self)'
    );

    // Strict Transport Security (force HTTPS in production)
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    return response;
  };

  // Handle auth pages - redirect to dashboard if already logged in
  if (isAuthPage) {
    if (user) {
      const redirect = NextResponse.redirect(new URL('/dashboard', req.url));
      return addSecurityHeaders(redirect);
    }
    return addSecurityHeaders(res);
  }

  // Check if route requires authentication
  const requiresAuth = isAdminPage || isTestPage;

  if (requiresAuth && !user) {
    // No session - redirect to sign-in
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    const redirect = NextResponse.redirect(
      new URL(`/auth/signin?redirect=${encodeURIComponent(from)}`, req.url)
    );
    return addSecurityHeaders(redirect);
  }

  // For admin pages, verify user has admin role
  if (isAdminPage && user) {
    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      logger.error('Failed to fetch user role for admin access', {
        component: 'proxy',
        action: 'admin_role_check',
        userId: user.id,
        metadata: { error: userError },
      });
      const redirect = NextResponse.redirect(new URL('/auth/signin', req.url));
      return addSecurityHeaders(redirect);
    }

    const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';

    if (!isAdmin) {
      logger.warn('Admin access denied - insufficient privileges', {
        component: 'proxy',
        action: 'admin_access_denied',
        userId: user.id,
        metadata: {
          role: userData.role,
          attemptedPath: req.nextUrl.pathname,
        },
      });
      // Redirect non-admin users to dashboard with error message
      const redirect = NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url));
      return addSecurityHeaders(redirect);
    }

    logger.info('Admin access granted', {
      component: 'proxy',
      action: 'admin_access_granted',
      userId: user.id,
      metadata: {
        role: userData.role,
        path: req.nextUrl.pathname,
      },
    });
  }

  return addSecurityHeaders(res);
}

// Protect these routes with authentication
// NOTE: Dashboard, profile, and book pages use client-side protection in the page components
// because Supabase session is stored in localStorage, not accessible to proxy
export const config = {
  matcher: [
    '/auth/signout',
    '/admin/:path*', // Admin routes - requires admin role verification
    '/test-admin/:path*', // Test admin routes - requires admin role verification
    // Client-side protected routes (session in localStorage):
    // - /dashboard (protected in page component)
    // - /profile (protected in page component)
    // - /book (protected in page component)
  ],
};
