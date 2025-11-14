'use client';

import SignUpForm from '@/components/auth/SignUpForm';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SignUpPageContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/dashboard';

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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Get started with professional equipment rentals
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="border border-gray-100 bg-white px-4 py-8 shadow-xl sm:rounded-2xl sm:px-10">
            <SignUpForm redirectTo={redirect} />

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Sign in to your account
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

export default function SignUpPage() {
  return <SignUpPageContent />;
}
