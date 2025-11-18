'use client';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const redirect = searchParams?.get('redirect') || '/dashboard';

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if there's an error from Supabase OAuth
        const errorParam = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');

        if (errorParam) {
          logger.error('OAuth error', {
            component: 'app-page',
            action: 'error',
            metadata: { errorParam, errorDescription },
          });
          setError(errorDescription || errorParam);
          setTimeout(() => {
            router.push(`/auth/signin?error=${encodeURIComponent(errorDescription || errorParam)}`);
          }, 2000);
          return;
        }

        // Supabase automatically handles the OAuth callback with detectSessionInUrl: true
        // We just need to wait a moment for it to process the URL and create the session

        // Give Supabase a moment to process the URL hash/code
        await new Promise(resolve => setTimeout(resolve, 500));

        // Now check if the session was created
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error('Session error', {
            component: 'app-page',
            action: 'error',
            metadata: { error: sessionError.message },
          });
          setError(sessionError.message);
          setTimeout(() => {
            router.push('/auth/signin?error=session_failed');
          }, 2000);
          return;
        }

        if (session) {
          logger.debug('✅ Authentication successful', {
            component: 'app-page',
            action: 'debug',
            metadata: { email: session.user.email },
          });
          // Session is ready, redirect to destination
          router.push(redirect);
          router.refresh(); // Force a refresh to update auth state everywhere
        } else {
          // No session found after OAuth callback
          logger.error('No session found after OAuth callback', {
            component: 'app-page',
            action: 'error',
          });
          setError('Authentication failed. Please try again.');
          setTimeout(() => {
            router.push('/auth/signin?error=no_session');
          }, 2000);
        }
      } catch (err) {
        logger.error('Callback error', {
          component: 'app-page',
          action: 'error',
          metadata: { error: err instanceof Error ? err.message : String(err) },
        });
        setError(err instanceof Error ? err.message : 'Unknown error');
        setTimeout(() => {
          router.push('/auth/signin?error=callback_failed');
        }, 2000);
      }
    };

    handleCallback();
  }, [router, redirect, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="mb-4 text-6xl text-red-600">⚠️</div>
            <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Error</h1>
            <p className="mb-4 text-gray-600">{error}</p>
            <p className="text-sm text-gray-500">Redirecting back to sign in...</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-red-600"></div>
            <p className="text-gray-600">Completing authentication...</p>
          </>
        )}
      </div>
    </div>
  );
}


