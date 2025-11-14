import type { Database } from '@/../../supabase/types';
import { createBrowserClient } from '@supabase/ssr';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

const loggingFetch: typeof fetch =
  process.env.NODE_ENV === 'development'
    ? async (input, init) => {
        const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
        const url = input instanceof Request ? input.url : input.toString();

        if (url.includes('/auth/v1/token') && method.toUpperCase() === 'POST') {
          let body: unknown = null;
          if (init?.body) {
            try {
              body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
            } catch {
              body = init.body;
            }
          } else if (input instanceof Request) {
            const clone = input.clone();
            try {
              const text = await clone.text();
              body = JSON.parse(text);
            } catch {
              // ignore parse errors
            }
          }

          console.debug(
            '[Supabase loggingFetch] outgoing auth request',
            JSON.stringify({ url, method, body }, null, 2),
          );
        }

        return fetch(input, init);
      }
    : fetch;

// Use SSR-compatible browser client that stores session in BOTH localStorage AND cookies.
// Attach custom fetch in development so we can inspect auth payloads locally.
export const supabase = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: loggingFetch },
});

// Export createClient for backward compatibility
export const createClient = () => supabase;
