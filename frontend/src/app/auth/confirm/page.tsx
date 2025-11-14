'use client';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams?.get('token_hash');
        const type = searchParams?.get('type');

        logger.debug('Email confirmation started', {
          component: 'confirm-email',
          action: 'confirm_start',
          metadata: {
            type,
            hasToken: !!token_hash,
          },
        });

        // If this is a signup confirmation
        if (type === 'signup' && token_hash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'signup',
          });

          if (error) {
            logger.error('Email confirmation error', {
              component: 'confirm-email',
              action: 'confirm_error',
            }, error);
            setStatus('error');
            setMessage(error.message || 'Failed to confirm email. The link may have expired.');
            return;
          }

          if (data.session) {
            logger.debug('✅ Email confirmed successfully', {
              component: 'confirm-email',
              action: 'confirm_success',
              metadata: {
                email: data.session.user.email,
              },
            });
            setStatus('success');
            setMessage('Your email has been confirmed! Logging you in...');

            // User is already logged in with the session from verifyOtp
            // Redirect directly to dashboard
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          } else {
            setStatus('error');
            setMessage('Email confirmed but unable to create session. Please sign in manually.');
          }
        } else {
          setStatus('error');
          setMessage('Invalid confirmation link.');
        }
      } catch (err) {
        logger.error('Email confirmation exception', {
          component: 'confirm-email',
          action: 'confirm_exception',
        }, err instanceof Error ? err : undefined);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    confirmEmail();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {status === 'loading' && (
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-red-600"></div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Confirming Your Email...</h2>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-green-900">✅ Email Confirmed!</h2>
            <p className="mb-4 text-green-800">{message}</p>
            <div className="mt-4 flex items-center justify-center space-x-2 text-gray-600">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-red-600"></div>
              <span className="text-sm font-medium">Redirecting to your dashboard...</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-red-900">Confirmation Failed</h2>
            <p className="mb-6 text-red-800">{message}</p>
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block rounded-lg bg-red-600 px-6 py-3 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Go to Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="block text-sm text-gray-600 hover:text-gray-800"
              >
                Create New Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-red-600"></div>
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}

