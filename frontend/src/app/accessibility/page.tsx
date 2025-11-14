'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function AccessibilityPage() {
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
                  alt="U-Dig It Rentals - Accessibility Statement Saint John NB"
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
                  alt="WCAG Compliant Equipment Rental - U-Dig It Accessibility"
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
                  alt="Accessible Website Design - Inclusive Rental Services"
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
                  alt="Accessibility Commitment - U-Dig It Logo"
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
                  alt="Inclusive Equipment Rental - Everyone Welcome"
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
                  alt="Accessible Web Experience - U-Dig It Rentals"
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
                  alt="Universal Design Rental Platform - U-Dig It"
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
                  alt="Accessibility for All - U-Dig It Logo"
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
                  alt="Barrier-Free Equipment Rental - U-Dig It Rentals"
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
                  ACCESSIBILITY
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Accessibility
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Statement
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Committed to providing an accessible experience for everyone, regardless of ability.
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
                {/* Last Updated */}
                <p className="mb-8 text-sm text-gray-600">Last updated: August 17, 2025</p>

                {/* Introduction */}
                <p className="mb-6 leading-relaxed text-gray-700">
                  U-Dig It Rentals Inc. is committed to providing a website, booking experience, and
                  customer support that are accessible to the widest possible audience, regardless of
                  technology or ability. If you encounter a barrier, please tell us so we can fix it
                  quickly.
                </p>

                {/* Accessibility Contact */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  ACCESSIBILITY CONTACT
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
                  <ul className="space-y-2 text-gray-700">
                    <li>
                      <strong>Email:</strong>{' '}
                      <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                        nickbaxter@udigit.ca
                      </a>
                    </li>
                    <li>
                      <strong>Mailing address:</strong> 945 Golden Grove Road, Saint John, New
                      Brunswick, E2H 2X1, Canada
                    </li>
                    <li>
                      <strong>Typical response time:</strong> within 5 business days for feedback;
                      urgent issues prioritized same/next business day.
                    </li>
                    <li>
                      <strong>Alternative formats:</strong> large-print or plain-text versions of
                      pages, PDFs, and forms available on request.
                    </li>
                  </ul>
                </div>

                {/* Scope */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">SCOPE</h2>
                <p className="mb-6 text-gray-700">
                  This statement covers our public website (udigit.ca), online forms, downloadable
                  documents we publish, and customer support channels. It also covers third-party tools
                  we integrate where we can configure them (e.g., maps, video, booking widgets). Some
                  third-party components have limits we don't fully control (see "Known limitations").
                </p>

                {/* Standard We Aim to Meet */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  STANDARD WE AIM TO MEET
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-6">
                  <p className="font-semibold text-green-900">✓ WCAG 2.2 Level AA Conformance</p>
                  <p className="mt-2 text-gray-700">
                    We aim for WCAG 2.2 Level AA conformance as our long-term target and follow a
                    "continuous improvement" approach if full conformance is not yet achieved.
                  </p>
                </div>

                {/* What We're Doing */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  WHAT WE'RE DOING TO SUPPORT ACCESSIBILITY
                </h2>
                <ul className="mb-6 list-disc space-y-3 pl-6 text-gray-700">
                  <li>
                    <strong>Clear information architecture:</strong> logical page titles, headings,
                    landmarks, and reading order.
                  </li>
                  <li>
                    <strong>Keyboard access:</strong> all critical functions (navigation, forms, cookie
                    choices, booking steps) should be operable without a mouse, with visible focus
                    indicators.
                  </li>
                  <li>
                    <strong>Color and contrast:</strong> text and key UI components target at least
                    4.5:1 contrast; we avoid color-only cues.
                  </li>
                  <li>
                    <strong>Images:</strong> meaningful images have alternative text; decorative images
                    are marked decorative.
                  </li>
                  <li>
                    <strong>Links and buttons:</strong> descriptive names that make sense out of
                    context; no misleading labels.
                  </li>
                  <li>
                    <strong>Forms:</strong> associated labels, helpful hints, accessible error messages
                    and suggestions, and minimal time pressure.
                  </li>
                  <li>
                    <strong>Motion and media:</strong> no auto-playing audio; sliders can be paused;
                    captions or transcripts provided for our own videos on request.
                  </li>
                  <li>
                    <strong>Language and readability:</strong> plain-language summaries where possible;
                    consistent terminology for controls and errors.
                  </li>
                  <li>
                    <strong>Cookies and privacy:</strong> consent banner is keyboard-operable with
                    "Accept," "Reject," and "Settings," and non-essential scripts remain blocked until
                    consent (where required).
                  </li>
                  <li>
                    <strong>Mobile:</strong> layouts reflow without horizontal scrolling at common zoom
                    levels; targets sized for touch.
                  </li>
                </ul>

                {/* How We Test */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">HOW WE TEST</h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>Automated scans</strong> (e.g., accessibility checkers) during content
                    updates.
                  </li>
                  <li>
                    <strong>Manual checks:</strong> keyboard-only navigation; zoom to 200%+;
                    color-contrast spot checks.
                  </li>
                  <li>
                    <strong>Assistive tech spot-tests:</strong> NVDA or JAWS on Windows and VoiceOver
                    on iOS/macOS for representative tasks (navigation, reading a page, submitting a
                    form, viewing a booking calendar).
                  </li>
                  <li>
                    <strong>Remediation timelines:</strong> critical blockers—target fix within 10
                    business days; moderate issues—within 30 business days; minor issues—next content
                    cycle.
                  </li>
                </ul>

                {/* Known Limitations */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  KNOWN LIMITATIONS (AND OUR WORKAROUNDS)
                </h2>
                <div className="mb-6 space-y-4">
                  <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4">
                    <p className="font-semibold text-yellow-900">⚠️ Embedded Maps (Google Maps)</p>
                    <p className="mt-2 text-sm text-gray-700">
                      <strong>Issue:</strong> Map controls and pins may not be fully accessible.
                      <br />
                      <strong>Workaround:</strong> We publish our full address and provide written
                      directions on request.
                    </p>
                  </div>

                  <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4">
                    <p className="font-semibold text-yellow-900">
                      ⚠️ Third-Party Booking Widgets (Calendar/Appointments)
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      <strong>Issue:</strong> Some calendar grids and pop-ups may have keyboard or
                      screen-reader quirks.
                      <br />
                      <strong>Workaround:</strong> You can book or ask availability by email; we will
                      confirm by email and send accessible summaries.
                    </p>
                  </div>

                  <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4">
                    <p className="font-semibold text-yellow-900">
                      ⚠️ Third-Party Videos (YouTube/Vimeo)
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      <strong>Issue:</strong> Built-in players may set cookies or have control limits.
                      <br />
                      <strong>Workaround:</strong> We can provide a direct download, captions, or a
                      transcript on request.
                    </p>
                  </div>

                  <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4">
                    <p className="font-semibold text-yellow-900">⚠️ Legacy PDFs</p>
                    <p className="mt-2 text-sm text-gray-700">
                      <strong>Issue:</strong> Older documents may not be fully tagged.
                      <br />
                      <strong>Workaround:</strong> We can provide accessible HTML or tagged PDFs upon
                      request.
                    </p>
                  </div>
                </div>

                {/* Requesting Accommodation */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  REQUESTING ACCOMMODATION OR AN ALTERNATIVE FORMAT
                </h2>
                <p className="mb-4 text-gray-700">
                  Email{' '}
                  <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                    nickbaxter@udigit.ca
                  </a>{' '}
                  with a short description of the barrier and the page/feature you're trying to use.
                  Please include any assistive technology and browser you're using. We will:
                </p>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>Acknowledge your message;</li>
                  <li>Propose a quick workaround (e.g., email booking, alternate file); and</li>
                  <li>Schedule a durable fix, keeping you informed of progress.</li>
                </ul>

                {/* Browser Compatibility */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  BROWSER AND ASSISTIVE TECHNOLOGY COMPATIBILITY
                </h2>
                <p className="mb-6 text-gray-700">
                  We aim to support current versions of major browsers (Chrome, Edge, Safari, Firefox)
                  on desktop and mobile. The site relies on standard HTML, CSS, JavaScript, and
                  WAI-ARIA semantics designed to work with common assistive technologies (e.g., NVDA,
                  JAWS, VoiceOver, TalkBack).
                </p>

                {/* Continuous Improvement */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  COMMITMENT TO CONTINUOUS IMPROVEMENT
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>New features are reviewed for accessibility before launch.</li>
                  <li>
                    Significant page templates are re-tested after theme or plugin updates.
                  </li>
                  <li>
                    We track feedback and audit items until resolved, and we update this page when we
                    make material improvements.
                  </li>
                </ul>

                {/* Formal Complaints */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  FORMAL COMPLAINTS AND ESCALATION
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
                  <p className="font-semibold text-red-900">📢 Have a Concern?</p>
                  <p className="mt-2 text-gray-700">
                    If you believe we have not addressed your accessibility concern, please email{' '}
                    <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                      nickbaxter@udigit.ca
                    </a>{' '}
                    with <strong>"Accessibility Complaint"</strong> in the subject. Provide the
                    page/feature, the issue, your browser/assistive tech, and any screenshots. If you
                    remain unsatisfied after our response, you may have options to escalate to
                    provincial or federal accessibility/human-rights bodies. We will cooperate with any
                    review and work to resolve issues promptly.
                  </p>
                </div>

                {/* Company Details */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">COMPANY DETAILS</h2>
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <p className="font-semibold text-gray-900">U-Dig It Rentals Inc.</p>
                  <p className="mt-2 text-gray-700">945 Golden Grove Road</p>
                  <p className="text-gray-700">Saint John, New Brunswick, E2H 2X1, Canada</p>
                  <p className="mt-3 text-gray-700">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                      nickbaxter@udigit.ca
                    </a>
                  </p>
                  <p className="text-gray-700">
                    <strong>Phone:</strong>{' '}
                    <a href="tel:+15066431575" className="text-blue-600 hover:underline">
                      1 (506) 643-1575
                    </a>
                  </p>
                </div>

                {/* Help Section */}
                <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <p className="font-semibold text-blue-900">♿ Need Assistance?</p>
                  <p className="mt-2 text-blue-800">
                    We're here to help! If you experience any accessibility barriers or need content in
                    an alternative format, please contact us. We'll respond promptly with a solution.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <a
                      href="tel:+15066431575"
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      📞 Call (506) 643-1575
                    </a>
                    <a
                      href="mailto:nickbaxter@udigit.ca"
                      className="inline-flex items-center justify-center rounded-lg border-2 border-blue-600 bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      ✉️ Email Us
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


