'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function ImprintPage() {
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
                  alt="U-Dig It Rentals - Legal Notice Saint John NB"
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
                  alt="Company Imprint Legal Information - U-Dig It"
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
                  alt="Corporate Registration New Brunswick - Legal Notice"
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
                  alt="Business Information Disclosure - U-Dig It Logo"
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
                  alt="Legal Company Details - U-Dig It Rentals"
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
                  alt="Imprint Legal Disclosure - U-Dig It"
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
                  alt="Corporate Information NB Canada - U-Dig It"
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
                  alt="Legal Entity Information - U-Dig It Logo"
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
                  alt="Company Registration Details - U-Dig It Rentals"
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
                  LEGAL DISCLOSURE
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Imprint
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Legal Notice
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Corporate information, legal disclosures, and company contact details.
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
                  U-DIG IT RENTALS INC. — IMPRINT (LEGAL NOTICE)
                </h2>
                <p className="mb-8 text-sm text-gray-600">Last updated: August 17, 2025</p>

                {/* Company */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">COMPANY</h2>
                <div className="mb-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
                  <p className="mb-2 text-gray-700">
                    <strong>U-Dig It Rentals Inc.</strong> ("U-Dig It Rentals")
                  </p>
                  <p className="mb-2 text-gray-700">
                    <strong>Website:</strong>{' '}
                    <a href="https://udigit.ca" className="text-blue-600 hover:underline">
                      udigit.ca
                    </a>
                  </p>
                  <p className="text-gray-700">
                    <strong>Jurisdiction of incorporation:</strong> Province of New Brunswick, Canada
                  </p>
                </div>

                {/* Registered Office */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">REGISTERED OFFICE</h2>
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <p className="text-gray-700">
                    <strong>Registered Office & Principal Place of Business:</strong>
                    <br />
                    945 Golden Grove Road
                    <br />
                    Saint John, New Brunswick, E2H 2X1
                    <br />
                    Canada
                  </p>
                </div>

                {/* Contact */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">CONTACT</h2>
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <p className="mb-2 text-gray-700">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                      nickbaxter@udigit.ca
                    </a>
                  </p>
                  <p className="mb-2 text-gray-700">
                    <strong>Phone:</strong>{' '}
                    <a href="tel:+15066431575" className="text-blue-600 hover:underline">
                      1 (506) 643-1575
                    </a>
                  </p>
                  <p className="text-gray-700">
                    <strong>Customer service hours:</strong> Monday–Sunday 7:00am–7:00pm AST
                  </p>
                </div>

                {/* Responsible Person */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  RESPONSIBLE FOR WEBSITE CONTENT
                </h2>
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <p className="mb-2 text-gray-700">
                    <strong>Company:</strong> U-Dig It Rentals Inc.
                  </p>
                  <p className="text-gray-700">
                    <strong>Responsible person:</strong> Nicholas Baxter, Director
                  </p>
                </div>

                {/* Corporate & Tax Identifiers */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  CORPORATE & TAX IDENTIFIERS
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-6">
                  <ul className="space-y-2 text-gray-700">
                    <li>
                      <strong>New Brunswick corporate registry no.:</strong> 768767
                    </li>
                    <li>
                      <strong>Canada Revenue Agency Business Number (BN):</strong> 744292160
                    </li>
                    <li>
                      <strong>GST/HST account no.:</strong> 744292160RC0001
                    </li>
                  </ul>
                </div>

                {/* Equipment Rentals & Services */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  EQUIPMENT RENTALS & SERVICES
                </h2>
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <p className="mb-2 text-gray-700">
                    <strong>Primary service area:</strong> Greater Saint John, New Brunswick
                  </p>
                  <p className="mb-2 text-gray-700">
                    <strong>Delivery/float service:</strong> Yes — standard fee: $150 each way
                  </p>
                  <p className="text-gray-700">
                    <strong>Emergency/after-hours contact (rental issues only):</strong>{' '}
                    <a href="tel:+15066431575" className="text-blue-600 hover:underline">
                      1 (506) 643-1575
                    </a>
                  </p>
                </div>

                {/* Liability for Content & Links */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  LIABILITY FOR CONTENT & LINKS
                </h2>
                <p className="mb-6 text-gray-700">
                  We take care to keep information accurate and current; however, errors and omissions
                  may occur. We reserve the right to update content without notice. External links are
                  provided for convenience only; U-Dig It Rentals has no control over and assumes no
                  responsibility for third-party content, availability, or practices.
                </p>

                {/* Copyright & Trademarks */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  COPYRIGHT & TRADEMARKS
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-6">
                  <p className="mb-3 text-gray-700">
                    <strong>© U-Dig It Rentals Inc., 2025. All rights reserved.</strong>
                  </p>
                  <p className="text-sm text-gray-700">
                    Logos, product names, and manufacturer marks referenced on this site are the
                    property of their respective owners. Content on this site (text, images,
                    documents) may not be reproduced without prior written permission, except where
                    permitted by law.
                  </p>
                </div>

                {/* Photos, Videos & Specifications */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  PHOTOS, VIDEOS & SPECIFICATIONS
                </h2>
                <p className="mb-6 text-sm text-gray-700">
                  Images and videos are illustrative and may show optional accessories or
                  configurations. Dimensions, capacities, and performance data are
                  manufacturer-supplied and may vary by model and condition.
                </p>

                {/* Data Protection & Cookies */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  DATA PROTECTION & COOKIES
                </h2>
                <p className="mb-6 text-gray-700">
                  For information about how we collect, use, and protect personal data (including
                  cookies), please see our{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  &{' '}
                  <Link href="/cookies" className="text-blue-600 hover:underline">
                    Cookie Policy
                  </Link>
                  .
                </p>

                {/* Terms, Safety & Operator Responsibility */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  TERMS, SAFETY & OPERATOR RESPONSIBILITY
                </h2>
                <p className="mb-4 text-gray-700">
                  All rentals are governed by our Rental Terms & Conditions and any signed rental
                  agreement(s). Operators must read and follow manufacturer manuals, decals, and safety
                  instructions, and comply with all applicable laws and utility-locate requirements.
                </p>
                <div className="mb-6 flex flex-wrap gap-3">
                  <Link
                    href="/terms"
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    <span>📄</span>
                    <span>Terms & Conditions</span>
                  </Link>
                  <Link
                    href="/safety"
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    <span>🦺</span>
                    <span>Safety Guidance</span>
                  </Link>
                  <Link
                    href="/terms#equipment-rider"
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    <span>📋</span>
                    <span>Equipment Rider</span>
                  </Link>
                </div>

                {/* Complaints & Dispute Resolution */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  COMPLAINTS & DISPUTE RESOLUTION
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
                  <p className="mb-3 text-gray-700">
                    <strong>To submit a complaint or request support, contact:</strong>
                  </p>
                  <p className="mb-3 text-gray-700">
                    <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                      nickbaxter@udigit.ca
                    </a>
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Governing law and venue:</strong> Province of New Brunswick, Canada.
                  </p>
                </div>

                {/* Changes to This Notice */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  CHANGES TO THIS NOTICE
                </h2>
                <p className="mb-6 text-gray-700">
                  We may update this Imprint from time to time. The "Last updated" date above reflects
                  the current version.
                </p>

                {/* Contact for Legal Notices */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  CONTACT FOR LEGAL NOTICES & COPYRIGHT CLAIMS
                </h2>
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <p className="mb-2 text-gray-700">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                      nickbaxter@udigit.ca
                    </a>
                  </p>
                  <p className="text-gray-700">
                    <strong>Mail:</strong> U-Dig It Rentals Inc., Attn: Legal
                    <br />
                    945 Golden Grove Road
                    <br />
                    Saint John, New Brunswick, E2H 2X1
                    <br />
                    Canada
                  </p>
                </div>

                {/* Help Section */}
                <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <p className="font-semibold text-blue-900">⚖️ Legal Questions?</p>
                  <p className="mt-2 text-blue-800">
                    For legal inquiries, copyright questions, or official correspondence, please use
                    the contact information above. We'll respond to all legal matters promptly.
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
                      <span>Email Legal Team</span>
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


