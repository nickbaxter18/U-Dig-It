import { logger } from '@/lib/logger';

import { supabase } from './client';

type FetchInput = Parameters<typeof fetch>[0];

type FetchOptions = RequestInit & {
  headers?: HeadersInit;
};

export async function fetchWithAuth(input: FetchInput, init: FetchOptions = {}) {
  try {
    logger.debug('Getting session', {
      component: 'fetchWithAuth',
      action: 'get_session',
    });

    // First, try to get the current user (this validates the session with the server)
    // This is more reliable than getSession() which only returns cached session
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      logger.warn('getUser failed, trying to get session anyway', {
        component: 'fetchWithAuth',
        action: 'get_user_failed',
        metadata: { error: userError.message },
      });
    }

    // Get the current session (after getUser potentially refreshed it)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      logger.error(
        'Error getting session',
        {
          component: 'fetchWithAuth',
          action: 'session_error',
        },
        sessionError
      );
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    // Check if session is expired or about to expire (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session?.expires_at ?? 0;
    const isExpiringSoon = expiresAt > 0 && expiresAt - now < 300; // 5 minutes

    if (session && isExpiringSoon) {
      logger.debug('Session expiring soon, refreshing', {
        component: 'fetchWithAuth',
        action: 'session_refresh',
        metadata: { expiresAt, now, timeLeft: expiresAt - now },
      });

      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        logger.warn('Failed to refresh session', {
          component: 'fetchWithAuth',
          action: 'refresh_failed',
          metadata: { error: refreshError.message },
        });
      } else if (refreshData.session) {
        logger.debug('Session refreshed successfully', {
          component: 'fetchWithAuth',
          action: 'session_refreshed',
        });
      }
    }

    // Get the final session after any refreshes
    const {
      data: { session: finalSession },
    } = await supabase.auth.getSession();

    logger.debug('Session retrieved', {
      component: 'fetchWithAuth',
      action: 'session_retrieved',
      metadata: {
        hasSession: !!finalSession,
        hasAccessToken: !!finalSession?.access_token,
        accessTokenLength: finalSession?.access_token?.length ?? 0,
        accessTokenPreview: finalSession?.access_token ? finalSession.access_token.substring(0, 20) + '...' : 'null',
        userId: finalSession?.user?.id ?? 'none',
        expiresAt: finalSession?.expires_at ?? 'none',
      },
    });

    // For FormData, don't set Content-Type - browser will set it with boundary
    const isFormData = init.body instanceof FormData;
    // Create headers - for FormData, start with empty headers to let browser set Content-Type
    const headers = isFormData ? new Headers() : new Headers(init.headers ?? {});

    if (finalSession?.access_token) {
      headers.set('Authorization', `Bearer ${finalSession.access_token}`);
      logger.debug('Added Authorization header', {
        component: 'fetchWithAuth',
        action: 'auth_header_added',
        metadata: {
          tokenLength: finalSession.access_token.length,
          headerSet: headers.has('Authorization'),
        },
      });
    } else {
      logger.warn('No access token in session', {
        component: 'fetchWithAuth',
        action: 'no_access_token',
        metadata: {
          hasSession: !!finalSession,
          sessionKeys: finalSession ? Object.keys(finalSession) : [],
        },
      });
    }

    const url =
      typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
    logger.debug('Making request', {
      component: 'fetchWithAuth',
      action: 'making_request',
      metadata: {
        url,
        isFormData,
        hasBody: !!init.body,
        bodyType: init.body instanceof FormData ? 'FormData' : typeof init.body,
        headerCount: Array.from(headers.entries()).length,
      },
    });

    return fetch(input, {
      ...init,
      headers,
      credentials: init.credentials ?? 'include',
    });
  } catch (error) {
    // Capture comprehensive error details
    const errorDetails: any = {};

    if (error instanceof Error) {
      errorDetails.errorMessage = error.message;
      errorDetails.errorStack = error.stack;
      errorDetails.errorName = error.name;
    } else if (error && typeof error === 'object') {
      try {
        errorDetails.errorString = JSON.stringify(error);
        errorDetails.errorKeys = Object.keys(error);
        if ('message' in error) errorDetails.errorMessage = (error as any).message;
        if ('stack' in error) errorDetails.errorStack = (error as any).stack;
        if ('name' in error) errorDetails.errorName = (error as any).name;
        if ('code' in error) errorDetails.errorCode = (error as any).code;
      } catch (stringifyError) {
        errorDetails.stringifyError = String(stringifyError);
      }
    } else {
      errorDetails.errorString = String(error);
      errorDetails.errorType = typeof error;
    }

    logger.error(
      'Error in fetchWithAuth',
      {
        component: 'fetchWithAuth',
        action: 'fetch_error',
        metadata: errorDetails,
      },
      error
    );
    // Raw error already logged above
    throw error;
  }
}
