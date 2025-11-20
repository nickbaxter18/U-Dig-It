import { supabase } from './client';

type FetchInput = Parameters<typeof fetch>[0];

type FetchOptions = RequestInit & {
  headers?: HeadersInit;
};

export async function fetchWithAuth(input: FetchInput, init: FetchOptions = {}) {
  try {
    console.log('[fetchWithAuth] Getting session...');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[fetchWithAuth] Error getting session:', sessionError);
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    console.log('[fetchWithAuth] Session retrieved:', session ? 'has session' : 'no session');

    const headers = new Headers(init.headers ?? {});
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
      console.log('[fetchWithAuth] Added Authorization header');
    } else {
      console.warn('[fetchWithAuth] No access token in session');
    }

    const url =
      typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
    console.log('[fetchWithAuth] Making request to:', url);

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

    console.error('[fetchWithAuth] Error in fetchWithAuth:', errorDetails);
    console.error('[fetchWithAuth] Raw error:', error);
    throw error;
  }
}
