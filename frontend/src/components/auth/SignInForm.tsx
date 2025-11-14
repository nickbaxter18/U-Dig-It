'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { logger } from '@/lib/logger';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

interface SignInFormProps {
  redirectTo?: string;
}

function SignInFormContent({ redirectTo = '/dashboard' }: SignInFormProps) {
  const router = useRouter();
  const { signIn, signInWithGoogle, loading, initialized } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailData, setEmailData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  // Only show loading state if actually loading AND initialized
  // This prevents the perpetual loading state bug on initial render
  const isActuallyLoading = isLoading || (loading && !initialized);

  const handleProviderSignIn = async (provider: string) => {
    setIsLoading(true);
    setError('');
    try {
      if (provider === 'google') {
        await signInWithGoogle(redirectTo);
        // Redirect will be handled by the auth callback
      } else {
        router.push('/');
      }
    } catch (error) {
      logger.error('Sign in error', { component: 'SignInForm', action: 'error' }, error instanceof Error ? error : undefined);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Read values from form inputs directly as fallback if state is empty
    // This handles cases where DOM values are set but React state isn't updated
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = emailData.email || (formData.get('email') as string) || '';
    const password = emailData.password || (formData.get('password') as string) || '';

    // Also try reading directly from input elements if FormData doesn't work
    const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');
    const passwordInput = form.querySelector<HTMLInputElement>('input[name="password"]');
    const finalEmail = email || emailInput?.value || '';
    const finalPassword = password || passwordInput?.value || '';

    try {
      logger.debug('Submitting email sign in', {
        component: 'SignInForm',
        action: 'debug',
        metadata: { email: finalEmail, hasPassword: Boolean(finalPassword) },
      });
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          '[SignInForm] handleEmailSignIn payload',
          JSON.stringify({ email: finalEmail, passwordLength: finalPassword.length }, null, 2),
        );
      }

      if (!finalEmail || !finalPassword) {
        setError('Please enter both email and password.');
        setIsLoading(false);
        return;
      }

      await signIn(finalEmail, finalPassword);
      router.push(redirectTo);
    } catch (error) {
      logger.error('Email sign in error', { component: 'SignInForm', action: 'error' }, error instanceof Error ? error : undefined);

      // Show specific error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Email not confirmed')) {
        setError('Please confirm your email address before signing in. Check your inbox for the confirmation link.');
      } else if (errorMessage.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('Unable to sign in. Please try again or contact support.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailData({
      ...emailData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      {!showEmailForm ? (
        <>
          {/* Social Sign In Options */}
          <div className="space-y-4">
            <button
              onClick={() => handleProviderSignIn('google')}
              disabled={isActuallyLoading}
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Image
                src="/images/google-logo.svg"
                alt="Google logo"
                width={20}
                height={20}
                className="mr-3"
              />
              {isActuallyLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <button
              onClick={() => handleProviderSignIn('github')}
              disabled={isActuallyLoading}
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Image
                src="/images/github-logo.svg"
                alt="GitHub logo"
                width={20}
                height={20}
                className="mr-3"
              />
              {isActuallyLoading ? 'Signing in...' : 'Continue with GitHub'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or sign in with email</span>
            </div>
          </div>

          {/* Email Sign In Button */}
          <button
            onClick={() => setShowEmailForm(true)}
            disabled={isActuallyLoading}
            className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className="mr-3 h-5 w-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
            {isActuallyLoading ? 'Loading...' : 'Sign in with email'}
          </button>
        </>
      ) : (
        <>
          {/* Back Button */}
          <button
            onClick={() => setShowEmailForm(false)}
            className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to other options
          </button>

          {/* Email Sign In Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={emailData.email}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-red-600 hover:text-red-500"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  value={emailData.password}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="/auth/forgot-password"
                  className="font-medium text-red-600 hover:text-red-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isActuallyLoading}
              className="flex w-full justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isActuallyLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </>
      )}

      {/* Quick Access Info */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium text-gray-900">Quick access to:</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Book equipment instantly
          </li>
          <li className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Track your rentals
          </li>
          <li className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Manage your account
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function SignInForm({ redirectTo }: SignInFormProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInFormContent redirectTo={redirectTo} />
    </Suspense>
  );
}
