import { supabase } from './client';

type FetchInput = Parameters<typeof fetch>[0];

type FetchOptions = RequestInit & {
  headers?: HeadersInit;
};

export async function fetchWithAuth(input: FetchInput, init: FetchOptions = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers ?? {});
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  });
}
