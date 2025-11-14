'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { useState } from 'react';
import { logger } from '@/lib/logger';

interface OAuthButtonsProps {
  redirectTo?: string;
}

export default function OAuthButtons({ redirectTo = '/dashboard' }: OAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { signInWithGoogle } = useAuth();

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(provider);
    try {
      // Check if Supabase OAuth is configured (Google OAuth is enabled in Supabase dashboard)
      if (provider === 'google') {
        await signInWithGoogle(redirectTo);
      } else if (provider === 'apple') {
        // Apple OAuth would need to be configured in Supabase dashboard as well
        alert(
          'Apple sign-in is not configured yet. Please use email/password registration or Google sign-in.'
        );
        return;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(`${provider} sign-in error:`, {
          component: 'OAuthButtons',
          action: 'error',
        }, error instanceof Error ? error : new Error(String(error)));
      }
      // Show user-friendly error message
      alert(`${provider} sign-in failed. Please try again or use email/password registration.`);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {/* Google Sign-In */}
        <button
          type="button"
          onClick={() => handleOAuthSignIn('google')}
          disabled={isLoading === 'google'}
          className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading === 'google' ? (
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-500"></div>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span className="ml-2">
            {isLoading === 'google' ? 'Signing in...' : 'Continue with Google'}
          </span>
        </button>

        {/* Apple Sign-In */}
        <button
          type="button"
          onClick={() => handleOAuthSignIn('apple')}
          disabled={isLoading === 'apple'}
          className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading === 'apple' ? (
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-500"></div>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          )}
          <span className="ml-2">
            {isLoading === 'apple' ? 'Signing in...' : 'Continue with Apple'}
          </span>
        </button>
      </div>

      {/* OAuth Configuration Note */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          OAuth sign-in requires configuration.
          <br />
          <a href="/QUICK_OAUTH_SETUP.md" className="text-blue-600 underline hover:text-blue-500">
            View setup guide
          </a>
        </p>
      </div>
    </div>
  );
}
