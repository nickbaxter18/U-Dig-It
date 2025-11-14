'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Dynamically import components with no SSR to avoid hydration issues
const EnhancedBookingFlow = dynamic(() => import('@/components/EnhancedBookingFlow'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-lg">
      <div className="animate-pulse">
        <div className="mb-6 h-8 rounded bg-gray-200"></div>
        <div className="space-y-4">
          <div className="h-4 rounded bg-gray-200"></div>
          <div className="h-4 w-3/4 rounded bg-gray-200"></div>
        </div>
        <div className="mt-8 space-y-3">
          <div className="h-10 rounded bg-gray-200"></div>
          <div className="h-10 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  ),
});

// TODO: Re-enable these booking enhancement components when they're created
// const SocialProof = dynamic(() => import("@/components/booking/SocialProof"), { ssr: false });
// const UrgencyIndicator = dynamic(() => import("@/components/booking/UrgencyIndicator"), { ssr: false });
// const ExitIntentPopup = dynamic(() => import("@/components/booking/ExitIntentPopup"), { ssr: false });

export default function BookPage() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  // Require authentication - redirect to sign-in if not logged in
  useEffect(() => {
    if (initialized && !loading && !user) {
      logger.debug('[BookPage] No user found, redirecting to sign-in...', {
        component: 'app-page',
        action: 'debug',
      });
      router.push('/auth/signin?callbackUrl=/book');
    }
  }, [user, loading, initialized, router]);

  // Show loading state while checking auth
  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#A90F0F]"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render booking flow if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="py-12">
        <div className="container mx-auto px-4">
          {/* Enhanced Header with Better UX */}
          <div className="mb-12 animate-fade-in text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-[#A90F0F] px-4 py-2 text-sm font-semibold text-white">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
              Instant Booking Available
            </div>
            <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Book the <span className="text-[#A90F0F]">Kubota SVL-75</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
              Complete your booking in minutes with our streamlined process. Get instant
              availability, transparent pricing, and confirmation.
            </p>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap justify-center gap-6">
              <div className="flex items-center space-x-2 rounded-full bg-green-50 px-4 py-2 text-green-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">Secure Booking</span>
              </div>
              <div className="flex items-center space-x-2 rounded-full bg-blue-50 px-4 py-2 text-blue-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">Instant Confirmation</span>
              </div>
              <div className="flex items-center space-x-2 rounded-full bg-purple-50 px-4 py-2 text-purple-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">SSL Encrypted</span>
              </div>
            </div>
          </div>

          {/* Social Proof Component - TODO: Re-enable when component is created */}
          {/* <div className="mb-8">
            <SocialProof />
          </div> */}

          {/* Urgency Indicator - TODO: Re-enable when component is created */}
          {/* <div className="mb-8">
            <UrgencyIndicator availableUnits={1} viewingCount={5} />
          </div> */}

          <EnhancedBookingFlow />

          {/* Exit Intent Popup - TODO: Re-enable when component is created */}
          {/* <ExitIntentPopup /> */}

          <div className="mx-auto mt-12 max-w-4xl">
            <div className="rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-bold">What happens next?</h2>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-brand-secondary">After Booking</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-green-500">✓</span>
                      <span>Receive booking confirmation email</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-green-500">✓</span>
                      <span>Upload your Certificate of Insurance</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-green-500">✓</span>
                      <span>Complete $500 security deposit payment</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-green-500">✓</span>
                      <span>Sign rental agreement electronically</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-semibold text-brand-secondary">On Rental Day</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-blue-500">🚚</span>
                      <span>Equipment delivered to your site</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-blue-500">🔍</span>
                      <span>Equipment inspection and handover</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-blue-500">📞</span>
                      <span>24/7 support during rental period</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 text-blue-500">🔧</span>
                      <span>Maintenance and fuel included</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                <h3 className="mb-2 font-semibold text-yellow-800">Insurance Requirement</h3>
                <p className="text-sm text-yellow-700">
                  <strong>Important:</strong> You must upload a valid Certificate of Insurance
                  before equipment release. Requirements: $2M Commercial General Liability, $120k
                  Equipment Coverage, U-Dig It Rentals Inc. as Additional Insured and Loss Payee.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
