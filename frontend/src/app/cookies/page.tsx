'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <>
      <style jsx>{`
        .headline-3d {
          perspective: 1000px;
          perspective-origin: center;
        }
        .headline-3d h1 {
          transform: translateZ(40px) rotateX(2deg);
          transform-style: preserve-3d;
          filter: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.9))
            drop-shadow(0 16px 48px rgba(0, 0, 0, 0.7)) drop-shadow(0 24px 64px rgba(0, 0, 0, 0.5));
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Hero Section - Premium Gold Theme */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          {/* Premium Gold Accent Strip at Top */}
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>

          {/* Animated Dot Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '48px 48px',
              }}
            ></div>
          </div>

          {/* Multiple Logo Watermarks - Responsive */}
          <div className="pointer-events-none absolute inset-0">
            {/* Desktop Watermarks - Original (hidden on mobile) */}
            <div className="hidden md:block">
            {/* Top Left Corner */}
            <div className="absolute left-12 top-8 rotate-[8deg] opacity-10">
              <div className="relative h-56 w-56">
                <Image
                  src="/images/udigit-logo.png"
                  alt="U-Dig It Rentals - Cookie Policy Saint John NB"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 40px, 56px"
                  unoptimized
                />
              </div>
            </div>

            {/* Top Right Corner */}
            <div className="absolute right-16 top-12 rotate-[-10deg] opacity-10">
              <div className="relative h-60 w-60">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Privacy Settings Cookie Notice - U-Dig It Cookie Policy"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 44px, 60px"
                  unoptimized
                />
              </div>
            </div>

            {/* Upper Left */}
            <div className="absolute left-[15%] top-[22%] rotate-[-6deg] opacity-10">
              <div className="relative h-48 w-48">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Cookie Consent Management - Browser Privacy Settings"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 32px, 48px"
                  unoptimized
                />
              </div>
            </div>

            {/* Upper Right */}
            <div className="absolute right-[18%] top-[24%] rotate-[12deg] opacity-10">
              <div className="relative h-52 w-52">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Website Cookie Notice - U-Dig It Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 36px, 52px"
                  unoptimized
                />
              </div>
            </div>

            {/* Center Right */}
            <div className="absolute right-0 top-[45%] translate-x-[35%] rotate-[15deg] transform opacity-10">
              <div className="relative h-80 w-80">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Cookie Tracking Policy - U-Dig It Rentals"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 60px, 80px"
                  unoptimized
                />
              </div>
            </div>

            {/* Center Left */}
            <div className="absolute left-0 top-[48%] -translate-x-[35%] rotate-[-12deg] transform opacity-10">
              <div className="w-76 h-76 relative">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Browser Cookie Settings - U-Dig It"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 56px, 76px"
                  unoptimized
                />
              </div>
            </div>

            {/* Bottom Left */}
            <div className="absolute bottom-[12%] left-[20%] rotate-[4deg] opacity-10">
              <div className="relative h-44 w-44">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Privacy Cookie Preferences - U-Dig It Cookies"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 32px, 44px"
                  unoptimized
                />
              </div>
            </div>

            {/* Bottom Right */}
            <div className="absolute bottom-[10%] right-[22%] rotate-[-7deg] opacity-10">
              <div className="relative h-48 w-48">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Cookie Consent Notice - U-Dig It Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 36px, 48px"
                  unoptimized
                />
              </div>
            </div>

            {/* Upper center */}
            <div className="absolute left-[30%] top-[11%] rotate-[5deg] opacity-10">
              <div className="relative h-40 w-40">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Website Cookie Management - U-Dig It Rentals"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 28px, 40px"
                  unoptimized
                />
              </div>
            </div>
            </div>

            {/* Mobile Only - More Watermarks for better coverage */}
            <div className="md:hidden">
              <div className="absolute left-[2%] top-[3%] opacity-10"><div className="relative h-20 w-20"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="20px" unoptimized /></div></div>
              <div className="absolute right-[2%] top-[5%] rotate-12 opacity-10"><div className="relative h-18 w-18"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="18px" unoptimized /></div></div>
              <div className="absolute left-[20%] top-[12%] rotate-[-8deg] opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute right-[15%] top-[15%] rotate-[10deg] opacity-10"><div className="relative h-14 w-14"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="14px" unoptimized /></div></div>
              <div className="absolute left-1/2 top-[2%] -translate-x-1/2 rotate-3 opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute left-[5%] top-1/3 -rotate-6 opacity-10"><div className="relative h-24 w-24"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="24px" unoptimized /></div></div>
              <div className="absolute right-[5%] top-[45%] rotate-[8deg] opacity-10"><div className="relative h-24 w-24"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="24px" unoptimized /></div></div>
              <div className="absolute left-[10%] top-[50%] rotate-[5deg] opacity-10"><div className="relative h-18 w-18"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="18px" unoptimized /></div></div>
              <div className="absolute right-[12%] top-[55%] -rotate-[7deg] opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute bottom-[8%] left-[8%] rotate-6 opacity-10"><div className="relative h-20 w-20"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="20px" unoptimized /></div></div>
              <div className="absolute bottom-[3%] right-[3%] -rotate-6 opacity-10"><div className="relative h-22 w-22"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="22px" unoptimized /></div></div>
              <div className="absolute bottom-[15%] left-[25%] rotate-[4deg] opacity-10"><div className="relative h-14 w-14"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="14px" unoptimized /></div></div>
              <div className="absolute bottom-[12%] right-[20%] -rotate-[5deg] opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute bottom-[2%] left-1/3 -rotate-3 opacity-10"><div className="relative h-18 w-18"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="18px" unoptimized /></div></div>
            </div>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="headline-3d text-center">
              <div className="mb-6 inline-block">
                <span className="rounded-full border border-[#E1BC56]/30 bg-[#E1BC56]/20 px-6 py-2 text-sm font-semibold tracking-wide text-[#E1BC56] backdrop-blur-sm">
                  PRIVACY & COOKIES
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Cookie
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Policy
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                How we use cookies and similar technologies to enhance your experience.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  Book Equipment Now
                </Link>
                <a
                  href="tel:+15066431575"
                  className="transform rounded-lg border-2 border-white bg-white/10 px-8 py-4 text-lg font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-gray-900"
                >
                  📞 (506) 643-1575
                </a>
              </div>
            </div>
          </div>

          {/* Premium Gold Bottom Border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        </div>

        {/* Main Content */}
        <div className="py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-white p-8 shadow-lg">
              <div className="prose prose-lg max-w-none">
                {/* Header */}
                <h2 className="mb-4 text-3xl font-bold text-gray-900">
                  U-DIG IT RENTALS INC. — COOKIE NOTICE
                </h2>
                <p className="mb-8 text-sm text-gray-600">Last updated: August 17, 2025</p>

                {/* Introduction */}
                <p className="mb-6 leading-relaxed text-gray-700">
                  This Cookie Notice explains how U-Dig It Rentals Inc. ("U-Dig It Rentals," "we,"
                  "us," or "our") uses cookies and similar technologies on our platform (udigit.ca) and
                  related services. It works together with our{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>

                {/* What Are Cookies */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">WHAT ARE COOKIES</h2>
                <p className="mb-6 text-gray-700">
                  Cookies are small text files stored on your device by your web browser. They help our
                  platform function properly, remember your preferences, secure your sessions, and
                  improve performance. We also use similar technologies like local storage, session
                  storage, and web beacons.
                </p>

                {/* Who Sets Them */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">WHO SETS THEM</h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>First-party cookies and storage</strong> are set by our platform (udigit.ca)
                    to enable core functionality like authentication, booking progress, and preferences.
                  </li>
                  <li>
                    <strong>Third-party cookies</strong> are set by service providers we integrate,
                    including Supabase (authentication), Stripe (payments), Google (OAuth, Maps), and
                    analytics providers.
                  </li>
                </ul>

                {/* Your Choices and Consent */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  YOUR CHOICES AND CONSENT
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600">•</span>
                      <span>
                        On your first visit you'll see a banner where you can accept all, reject
                        non-essential, or choose categories.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600">•</span>
                      <span>
                        Essential cookies are always active (the site can't function without them).
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600">•</span>
                      <span>
                        If you are in the EEA/UK, we only set non-essential cookies with your consent.
                        You can change/withdraw consent anytime via "Cookie settings" in the footer.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Browser Controls */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  HOW TO CONTROL COOKIES IN YOUR BROWSER
                </h2>
                <p className="mb-6 text-gray-700">
                  You can block/delete cookies in your browser (Chrome, Safari, Firefox, Edge, etc.).
                  Blocking essential cookies may break site features.
                </p>

                {/* Categories */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">CATEGORIES WE USE</h2>
                <div className="mb-6 space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Essential (strictly necessary):</h3>
                    <p className="text-sm text-gray-700">
                      Core functionality, security, performance caching, form/booking continuity.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Functional:</h3>
                    <p className="text-sm text-gray-700">
                      Remembers preferences and enhances features (e.g., galleries, sliders).
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">
                      Analytics/Performance (if enabled):
                    </h3>
                    <p className="text-sm text-gray-700">
                      Helps us understand traffic and improve the site.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">
                      Advertising/Measurement (only if/when we run ads):
                    </h3>
                    <p className="text-sm text-gray-700">Delivers and measures ads.</p>
                  </div>
                </div>

                {/* Services & Technologies */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  SERVICES & TECHNOLOGIES ON THIS PLATFORM
                </h2>
                <p className="mb-6 text-sm italic text-gray-600">
                  Our platform is built with Next.js 16 and integrates modern services for
                  authentication, payments, and analytics. Cookie names and durations may change as
                  providers update their services.
                </p>

                <div className="mb-6 space-y-6">
                  {/* Supabase Authentication */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-900">A) SUPABASE (AUTHENTICATION & DATABASE)</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>
                        <strong>supabase.auth.token</strong> (essential, localStorage, 1 hour with auto-refresh) — stores your authentication session (access token, refresh token, user ID). Required for secure login and account access.
                      </li>
                      <li>
                        <strong>sb-*-auth-token</strong> (essential, cookies, 1 hour) — HTTP-only authentication cookie set by Supabase for server-side authentication. Automatically refreshed 90 seconds before expiry.
                      </li>
                      <li>
                        <strong>Session cookies</strong> (essential, duration varies) — maintain your logged-in state and protect against CSRF attacks.
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600">
                      Provider: Supabase Inc. | Data processed in US (SOC 2 Type II compliant)
                    </p>
                  </div>

                  {/* Stripe Payments */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-900">B) STRIPE (PAYMENT PROCESSING)</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>
                        <strong>__stripe_mid</strong> (essential, 1 year) — fraud detection and secure payment processing. Helps identify your device for security purposes.
                      </li>
                      <li>
                        <strong>__stripe_sid</strong> (essential, 30 minutes) — payment session management during checkout process.
                      </li>
                      <li>
                        <strong>stripe.js cookies</strong> (essential, session) — enable secure card verification, Stripe Checkout sessions, and payment method storage.
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600">
                      Provider: Stripe Inc. | Data processed in US/EU (PCI-DSS Level 1 certified)
                    </p>
                  </div>

                  {/* Next.js & Vercel */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-900">C) NEXT.JS & VERCEL (HOSTING/CDN)</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>
                        <strong>__vercel_live_token</strong> (functional, session) — enables Vercel preview/live editing features (admins only).
                      </li>
                      <li>
                        <strong>__prerender_bypass</strong> (functional, session) — bypasses static generation for dynamic content testing (admins only).
                      </li>
                      <li>
                        <strong>_vercel_jwt</strong> (essential, session) — secure edge function authentication.
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600">
                      Provider: Vercel Inc. | Data processed globally via CDN
                    </p>
                  </div>

                  {/* Local Storage */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-900">D) LOCAL STORAGE (BOOKING FLOW)</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>
                        <strong>booking_*</strong> (functional, cleared after booking) — temporarily saves your booking form progress (equipment selection, dates, delivery address, pricing calculations) so you don't lose data if you navigate away.
                      </li>
                      <li>
                        <strong>enhanced_booking_*</strong> (functional, cleared after booking) — stores step-by-step booking flow state and user selections.
                      </li>
                      <li>
                        <strong>pending_booking_data</strong> (essential, cleared after booking) — holds booking details during Stripe Checkout redirect and card verification process.
                      </li>
                      <li>
                        <strong>booking-form-draft</strong> (functional, cleared after booking) — auto-saves booking form to restore your progress if you accidentally close the tab.
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600">
                      Stored locally on your device only. Never transmitted to servers except when you submit the booking.
                    </p>
                  </div>

                  {/* Google OAuth */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-900">E) GOOGLE OAUTH (SIGN IN WITH GOOGLE)</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>
                        <strong>G_AUTHUSER_H</strong> (functional, session) — remembers which Google account you're using if you have multiple accounts signed in.
                      </li>
                      <li>
                        <strong>G_ENABLED_IDPS</strong> (functional, persistent) — stores your identity provider preferences for faster sign-in.
                      </li>
                      <li>
                        <strong>SMSV</strong> (security, session) — Google's security verification cookie.
                      </li>
                      <li>
                        <strong>1P_JAR, NID, DV</strong> (functional/advertising, varies) — Google's standard cookies for account functionality and personalization.
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600">
                      Provider: Google LLC | Only set if you use "Sign in with Google" | See Google's privacy policy
                    </p>
                  </div>

                  {/* Google Services */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-900">F) GOOGLE SERVICES (ANALYTICS, MAPS)</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>
                        <strong>Google Analytics</strong> (if enabled):
                        <ul className="ml-4 mt-1 space-y-1">
                          <li><strong>_ga</strong> (analytics, up to 2 years) — distinguishes unique visitors.</li>
                          <li><strong>_gid</strong> (analytics, 24 hours) — distinguishes users.</li>
                          <li><strong>_gat</strong> (analytics, 1 minute) — throttles request rate.</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Google Maps</strong> (when map is displayed):
                        <ul className="ml-4 mt-1 space-y-1">
                          <li><strong>NID</strong> (functional, 6 months) — remembers your map preferences and recent searches.</li>
                          <li><strong>OGPC</strong> (functional, varies) — Google's advertising opt-out cookie.</li>
                        </ul>
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600">
                      Provider: Google LLC | Data processed in US/EU
                    </p>
                  </div>

                  {/* Vercel Analytics */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-900">G) VERCEL ANALYTICS (IF ENABLED)</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>
                        <strong>__v_id</strong> (analytics, 1 year) — anonymized visitor identifier for page view analytics and performance monitoring.
                      </li>
                      <li>
                        <strong>_vercel_toolbar</strong> (functional, session) — enables development toolbar (admins only).
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600">
                      Provider: Vercel Inc. | Privacy-first analytics with no personal data collection
                    </p>
                  </div>

                  {/* Session Storage */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-900">H) SESSION STORAGE (TEMPORARY DATA)</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>
                        <strong>navigation_state</strong> (functional, session) — tracks your current page and navigation history within the booking flow.
                      </li>
                      <li>
                        <strong>form_validation_errors</strong> (functional, session) — temporarily stores form validation errors to display helpful messages.
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600">
                      Cleared automatically when you close your browser tab.
                    </p>
                  </div>

                  {/* Advertising (Future) */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-900">
                      I) ADVERTISING/MEASUREMENT (ONLY IF WE RUN ADS - NOT CURRENTLY ACTIVE)
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>
                        <strong>Meta Pixel</strong> (if enabled in future): _fbp, _fbc (up to 3 months) — ad delivery and conversion measurement.
                      </li>
                      <li>
                        <strong>Google Ads</strong> (if enabled in future): gcl_au, DSID, IDE (various) — conversion tracking and remarketing.
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600">
                      Currently not implemented. Will require your explicit consent if added.
                    </p>
                  </div>
                </div>

                {/* Examples Table */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">EXAMPLES TABLE</h2>
                <div className="mb-6 overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left font-bold">
                          Cookie Name
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-bold">
                          Category
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-bold">
                          Purpose
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-bold">
                          Duration
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-bold">
                          Provider
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-mono">supabase.auth.token</td>
                        <td className="border border-gray-300 px-4 py-2">Essential</td>
                        <td className="border border-gray-300 px-4 py-2">
                          Authentication session (localStorage)
                        </td>
                        <td className="border border-gray-300 px-4 py-2">1 hour (auto-refresh)</td>
                        <td className="border border-gray-300 px-4 py-2">Supabase</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-mono">sb-*-auth-token</td>
                        <td className="border border-gray-300 px-4 py-2">Essential</td>
                        <td className="border border-gray-300 px-4 py-2">Server-side auth cookie</td>
                        <td className="border border-gray-300 px-4 py-2">1 hour</td>
                        <td className="border border-gray-300 px-4 py-2">Supabase</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-mono">__stripe_mid</td>
                        <td className="border border-gray-300 px-4 py-2">Essential</td>
                        <td className="border border-gray-300 px-4 py-2">
                          Fraud detection & payment security
                        </td>
                        <td className="border border-gray-300 px-4 py-2">1 year</td>
                        <td className="border border-gray-300 px-4 py-2">Stripe</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-mono">__stripe_sid</td>
                        <td className="border border-gray-300 px-4 py-2">Essential</td>
                        <td className="border border-gray-300 px-4 py-2">Payment session management</td>
                        <td className="border border-gray-300 px-4 py-2">30 minutes</td>
                        <td className="border border-gray-300 px-4 py-2">Stripe</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-mono">booking_*</td>
                        <td className="border border-gray-300 px-4 py-2">Functional</td>
                        <td className="border border-gray-300 px-4 py-2">
                          Saves booking form progress (localStorage)
                        </td>
                        <td className="border border-gray-300 px-4 py-2">Until booking complete</td>
                        <td className="border border-gray-300 px-4 py-2">U-Dig It Rentals</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-mono">pending_booking_data</td>
                        <td className="border border-gray-300 px-4 py-2">Essential</td>
                        <td className="border border-gray-300 px-4 py-2">
                          Holds data during Stripe Checkout
                        </td>
                        <td className="border border-gray-300 px-4 py-2">Until booking complete</td>
                        <td className="border border-gray-300 px-4 py-2">U-Dig It Rentals</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-mono">G_AUTHUSER_H</td>
                        <td className="border border-gray-300 px-4 py-2">Functional</td>
                        <td className="border border-gray-300 px-4 py-2">
                          Google account selection
                        </td>
                        <td className="border border-gray-300 px-4 py-2">Session</td>
                        <td className="border border-gray-300 px-4 py-2">Google OAuth</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-mono">_ga / _gid</td>
                        <td className="border border-gray-300 px-4 py-2">Analytics</td>
                        <td className="border border-gray-300 px-4 py-2">
                          Website usage statistics
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          2 years / 24 hours
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          Google Analytics (if enabled)
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-mono">NID</td>
                        <td className="border border-gray-300 px-4 py-2">Functional</td>
                        <td className="border border-gray-300 px-4 py-2">
                          Google Maps preferences
                        </td>
                        <td className="border border-gray-300 px-4 py-2">6 months</td>
                        <td className="border border-gray-300 px-4 py-2">Google Maps</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-mono">__v_id</td>
                        <td className="border border-gray-300 px-4 py-2">Analytics</td>
                        <td className="border border-gray-300 px-4 py-2">
                          Anonymized visitor tracking
                        </td>
                        <td className="border border-gray-300 px-4 py-2">1 year</td>
                        <td className="border border-gray-300 px-4 py-2">Vercel Analytics</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Other Technologies */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">OTHER TECHNOLOGIES</h2>
                <p className="mb-6 text-gray-700">
                  In addition to cookies, our platform uses browser storage technologies and web beacons:
                </p>
                <div className="mb-6 space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Local Storage:</h3>
                    <p className="text-sm text-gray-700">
                      Stores your booking form progress, authentication tokens, and user preferences.
                      Persists until you complete your booking or manually clear your browser data.
                      Used for: authentication sessions (Supabase), booking flow state, form auto-save,
                      Stripe Checkout data during redirect.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Session Storage:</h3>
                    <p className="text-sm text-gray-700">
                      Temporarily stores navigation state and form validation errors. Automatically
                      cleared when you close the browser tab. Used for: current page tracking,
                      temporary error messages, navigation history.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Web Beacons & Pixels:</h3>
                    <p className="text-sm text-gray-700">
                      Small transparent images that may be used by analytics or advertising providers
                      to measure page views and conversions. Currently only used if you've enabled
                      analytics or advertising cookies.
                    </p>
                  </div>
                </div>

                {/* Data Sharing & Transfers */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  DATA SHARING & TRANSFERS
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-6">
                  <p className="mb-3 text-gray-700">
                    Our service providers process data in different locations:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2 text-yellow-600">•</span>
                      <span>
                        <strong>Supabase:</strong> Data stored in US data centers (SOC 2 Type II compliant, GDPR-ready)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-yellow-600">•</span>
                      <span>
                        <strong>Stripe:</strong> Payment data processed in US and EU (PCI-DSS Level 1, GDPR compliant)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-yellow-600">•</span>
                      <span>
                        <strong>Vercel:</strong> Content delivered globally via CDN (ISO 27001 certified)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-yellow-600">•</span>
                      <span>
                        <strong>Google (OAuth, Maps, Analytics):</strong> Data processed in US/EU per Google's policies
                      </span>
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-700">
                    All third-party providers are contractually required to protect your data and use it only for the purposes we specify. We rely on standard contractual clauses and appropriate safeguards consistent with Canadian privacy laws and GDPR. See our{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                    {' '}for complete details.
                  </p>
                </div>

                {/* Do Not Track */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">DO NOT TRACK</h2>
                <p className="mb-6 text-gray-700">
                  We don't respond to "Do Not Track" signals due to the lack of a common industry
                  standard. Manage cookies via the banner and your browser settings.
                </p>

                {/* Updates */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">UPDATES</h2>
                <p className="mb-6 text-gray-700">
                  We may update this Cookie Notice periodically. The "Last updated" date shows the
                  current version. Material changes will appear in the banner and/or on this page.
                </p>

                {/* Contact */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">CONTACT</h2>
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <p className="mb-2 text-gray-700">
                    Questions about this Cookie Notice or your choices:
                  </p>
                  <p className="mb-2 text-gray-700">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                      nickbaxter@udigit.ca
                    </a>
                  </p>
                  <p className="text-gray-700">
                    <strong>Mail:</strong> U-Dig It Rentals Inc., 945 Golden Grove Road, Saint John,
                    New Brunswick, E2H 2X1, Canada
                  </p>
                </div>

                {/* Help Section */}
                <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <p className="font-semibold text-blue-900">🍪 Questions About Cookies?</p>
                  <p className="mt-2 text-blue-800">
                    If you have questions about how we use cookies or want to adjust your preferences,
                    we're here to help. You can also manage your cookie settings through the banner or
                    your browser.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <a
                      href="tel:+15066431575"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      <span>📞</span>
                      <span>Call (506) 643-1575</span>
                    </a>
                    <a
                      href="mailto:nickbaxter@udigit.ca"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      <span>✉️</span>
                      <span>Email Us</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

