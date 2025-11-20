'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
      logger.debug('Password reset email sent', {
        component: 'forgot-password',
        action: 'reset_requested',
        metadata: { email },
      });
    } catch (err) {
      logger.error(
        'Password reset error',
        {
          component: 'forgot-password',
          action: 'reset_error',
        },
        err instanceof Error ? err : undefined
      );

      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-green-900">Check Your Email!</h2>
            <p className="mb-6 text-green-800">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-left">
              <h3 className="mb-2 font-semibold text-green-900">Next Steps:</h3>
              <ol className="list-inside list-decimal space-y-2 text-sm text-gray-700">
                <li>Check your inbox for the password reset email</li>
                <li>Click the reset link in the email</li>
                <li>Enter your new password</li>
                <li>Sign in with your new password</li>
              </ol>
            </div>
            <div className="mt-6">
              <Link
                href="/auth/signin"
                className="inline-block rounded-lg bg-red-600 px-6 py-3 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex justify-center mb-6">
            <div className="group flex items-center space-x-3">
              <div className="relative h-16 w-16 rounded-xl bg-black p-2 shadow-lg transition-transform group-hover:scale-105">
                <Image
                  src="/images/udigit-logo.png"
                  alt="U-Dig It Rentals Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-bold text-gray-900 transition-colors group-hover:text-[#E1BC56]">
                U-Dig It Rentals
              </span>
            </div>
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Reset Your Password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-6 py-8 shadow-xl sm:rounded-2xl border border-gray-100">
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e: unknown) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="text-center">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
