'use client';

import SignInForm from '@/components/auth/SignInForm';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SignInPageContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/dashboard';
  const message = searchParams?.get('message');
  const error = searchParams?.get('error');

  const getMessageDisplay = () => {
    if (message === 'password_reset_success') {
      return (
        <div className="mb-6 rounded-lg border-2 border-green-200 bg-green-50 px-4 py-3">
          <div className="flex items-center text-green-800">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Password updated successfully! Please sign in with your new password.</span>
          </div>
        </div>
      );
    }
    if (message === 'email_confirmed') {
      return (
        <div className="mb-6 rounded-lg border-2 border-green-200 bg-green-50 px-4 py-3">
          <div className="flex items-center text-green-800">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Email confirmed! You can now sign in to your account.</span>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error === 'session_failed' && 'Authentication failed. Please try again.'}
          {error === 'no_session' && 'Unable to create session. Please try again.'}
          {error === 'callback_failed' && 'Authentication callback failed. Please try again.'}
          {error === 'code_exchange_failed' && 'Unable to complete authentication. Please try again.'}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex justify-center">
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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your equipment rentals
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="border border-gray-100 bg-white px-4 py-8 shadow-xl sm:rounded-2xl sm:px-10">
            {getMessageDisplay()}
            <SignInForm redirectTo={redirect} />

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">New to U-Dig It Rentals?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/signup"
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Create your account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SignInPage() {
  return <SignInPageContent />;
}
