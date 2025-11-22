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

    logger.debug('Session retrieved', {
      component: 'fetchWithAuth',
      action: 'session_retrieved',
      metadata: { hasSession: !!session },
    });

    // For FormData, don't set Content-Type - browser will set it with boundary
    const isFormData = init.body instanceof FormData;
    // Create headers - for FormData, start with empty headers to let browser set Content-Type
    const headers = isFormData ? new Headers() : new Headers(init.headers ?? {});

    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
      logger.debug('Added Authorization header', {
        component: 'fetchWithAuth',
        action: 'auth_header_added',
      });
    } else {
      logger.warn('No access token in session', {
        component: 'fetchWithAuth',
        action: 'no_access_token',
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
