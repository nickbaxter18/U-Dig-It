'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function DisclaimerPage() {
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
                  alt="U-Dig It Rentals - Legal Disclaimer Saint John NB"
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
                  alt="Liability Disclaimer Equipment Rental - U-Dig It"
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
                  alt="Rental Agreement Disclaimer - Legal Notice"
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
                  alt="Equipment Use Disclaimer - U-Dig It Logo"
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
                  alt="Service Disclaimer Terms - U-Dig It Rentals"
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
                  alt="Legal Limitations Liability - U-Dig It"
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
                  alt="Warranty Disclaimer Information - U-Dig It"
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
                  alt="Indemnity Agreement Terms - U-Dig It Logo"
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
                  alt="Legal Notice Disclaimer - U-Dig It Rentals"
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
                  LEGAL NOTICE
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Website &
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Disclaimer
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Important legal information about our services, equipment use, and limitations of liability.
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
                  U-DIG IT RENTALS INC. — WEBSITE & SERVICES DISCLAIMER
                </h2>
                <p className="mb-8 text-sm text-gray-600">Last updated: August 17, 2025</p>

                {/* Introduction */}
                <p className="mb-6 leading-relaxed text-gray-700">
                  This Disclaimer applies to U-Dig It Rentals Inc. ("U-Dig It Rentals," "we," "us,"
                  or "our") and to your use of our website, digital properties, and services
                  (collectively, the "Services"). By accessing or using the Services, you agree to
                  this Disclaimer in addition to our{' '}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                  . If you do not agree, do not use the Services.
                </p>

                {/* Informational Content Only */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  INFORMATIONAL CONTENT ONLY — NOT PROFESSIONAL ADVICE
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-6">
                  <p className="text-gray-700">
                    Content on our website, social media, guides, checklists, FAQs, and any
                    downloadable materials is provided for general information and convenience. It does
                    not constitute legal, financial, engineering, environmental, or safety advice and
                    should not be relied upon as such. Always review official operator manuals and seek
                    qualified professional advice where appropriate.
                  </p>
                </div>

                {/* Equipment Use, Competency, and Safety */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  EQUIPMENT USE, COMPETENCY, AND SAFETY
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
                  <p className="mb-4 text-gray-700">
                    Operating heavy equipment involves inherent risks, including personal injury,
                    death, and property damage. By renting or operating equipment from U-Dig It
                    Rentals, you acknowledge and accept these risks and represent that you are
                    competent and legally permitted to operate the equipment (including holding any
                    licences, permits, or certifications required by law). You agree to:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600">•</span>
                      <span>
                        Read and follow all manufacturer operator manuals, decals, and safety
                        instructions.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600">•</span>
                      <span>
                        Use required personal protective equipment (e.g., CSA-approved boots, eye/ear
                        protection, high-visibility vest, gloves, hard hat as needed).
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600">•</span>
                      <span>
                        Inspect the equipment before use and stop operation immediately if any unsafe
                        condition is observed.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600">•</span>
                      <span>
                        Operate only within manufacturer ratings and site conditions (including
                        grade/slope limits) and comply with all laws, bylaws, and utility-locate
                        requirements.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600">•</span>
                      <span>
                        Maintain adequate liability insurance appropriate to the equipment and
                        jobsite, and provide proof of coverage on request; where required, list U-Dig
                        It Rentals Inc. as an additional insured for the rental period.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* No Guarantee of Results */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  NO GUARANTEE OF RESULTS
                </h2>
                <p className="mb-6 text-gray-700">
                  Any examples, case studies, productivity estimates, or before/after imagery are
                  illustrative only. Actual results depend on site conditions, materials, operator
                  skill, weather, and other factors beyond our control. We do not guarantee any
                  particular outcome, completion time, or cost savings.
                </p>

                {/* Availability, Pricing, and Errors */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  AVAILABILITY, PRICING, AND ERRORS
                </h2>
                <p className="mb-6 text-gray-700">
                  Product and service availability, specifications, and pricing are subject to change
                  without notice. While we aim for accuracy, typographical, photographic, and
                  technical errors may occur. We may correct any errors and cancel any booking
                  affected by an error, with a refund of amounts you have paid for the affected
                  booking.
                </p>

                {/* Third-Party Links */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  THIRD-PARTY LINKS, TOOLS, AND INTEGRATIONS
                </h2>
                <p className="mb-6 text-gray-700">
                  Our Services may reference or integrate third-party websites, mapping, payment
                  processors, booking calendars, or other tools. These are provided for convenience
                  only and do not constitute endorsement. We are not responsible for the content,
                  accuracy, availability, security, privacy practices, or performance of third
                  parties.
                </p>

                {/* Insurance, Damage, and Responsibility */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  INSURANCE, DAMAGE, AND RESPONSIBILITY
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-orange-500 bg-orange-50 p-6">
                  <p className="text-gray-700">
                    Renters are responsible for the care, custody, and control of equipment during the
                    rental period, including loss, theft, misuse, damage, and contamination. You agree
                    to maintain adequate insurance (where applicable) and to pay for damage, repairs,
                    missing parts, cleaning, downtime, and recovery/transport costs per our rental
                    agreement. Photographs are illustrative and may not depict the exact unit rented.
                  </p>
                </div>

                {/* Site Conditions and Utilities */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  SITE CONDITIONS AND UTILITIES
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
                  <p className="text-gray-700">
                    You are solely responsible for verifying ground conditions, underground and
                    overhead utilities, access routes, and site safety. Always complete the required
                    utility locates before digging. We are not responsible for damages arising from
                    unmarked or improperly marked utilities or unsuitable site conditions.
                  </p>
                </div>

                {/* Environmental and Regulatory Compliance */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  ENVIRONMENTAL AND REGULATORY COMPLIANCE
                </h2>
                <p className="mb-6 text-gray-700">
                  You are responsible for obtaining all required permits and approvals and for
                  compliance with environmental, municipal, provincial, and federal laws. You must not
                  use equipment for unlawful purposes or in a manner that may cause environmental
                  harm.
                </p>

                {/* Indemnity */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">INDEMNITY</h2>
                <div className="mb-6 rounded-lg border-l-4 border-gray-500 bg-gray-50 p-6">
                  <p className="text-sm text-gray-700">
                    To the fullest extent permitted by law, you agree to indemnify, defend, and hold
                    harmless U-Dig It Rentals, its directors, officers, employees, and agents from and
                    against any and all claims, demands, losses, liabilities, damages, costs, and
                    expenses (including reasonable legal fees) arising out of or related to your use or
                    misuse of the Services or equipment, breach of our Terms & Conditions or this
                    Disclaimer, or violation of applicable law.
                  </p>
                </div>

                {/* Limitation of Liability */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  LIMITATION OF LIABILITY
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-6">
                  <p className="text-sm text-gray-700">
                    To the fullest extent permitted by law, U-Dig It Rentals will not be liable for
                    any indirect, incidental, special, consequential, exemplary, punitive, or economic
                    losses, including lost profits or business interruption, arising from or related to
                    the Services, any rental, or the use of equipment, even if advised of the
                    possibility of such damages. Our total liability for any claim shall not exceed the
                    amounts paid by you to us for the specific rental or service giving rise to the
                    claim.
                  </p>
                </div>

                {/* Warranties Disclaimed */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  WARRANTIES DISCLAIMED
                </h2>
                <p className="mb-6 text-gray-700">
                  Except as expressly stated in a written agreement signed by us, the Services and
                  equipment are provided "as is" and "as available," without warranties or conditions
                  of any kind, whether express, implied, or statutory, including but not limited to
                  implied warranties/conditions of merchantability, fitness for a particular purpose,
                  durability, and non-infringement.
                </p>

                {/* Precedence of Rental Agreement */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  PRECEDENCE OF RENTAL AGREEMENT
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
                  <p className="text-gray-700">
                    If you rent equipment, the signed rental agreement (including any schedules,
                    delivery forms, inspection reports, or waivers) governs your rental. If there is
                    any conflict between this Disclaimer and your rental agreement, the rental
                    agreement will prevail.
                  </p>
                </div>

                {/* Images, Specifications, and Descriptions */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  IMAGES, SPECIFICATIONS, AND DESCRIPTIONS
                </h2>
                <p className="mb-6 text-sm text-gray-700">
                  Images, videos, and descriptions of equipment on our website are for general
                  reference and may show optional features or accessories not included in a standard
                  rental. Dimensions, capacities, and performance data are manufacturer-supplied and
                  may vary by model, configuration, and condition.
                </p>

                {/* Force Majeure */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">FORCE MAJEURE</h2>
                <p className="mb-6 text-gray-700">
                  We are not responsible for delays, failures, or inability to perform due to events
                  beyond our reasonable control (including but not limited to weather, labour
                  disputes, supply chain issues, equipment failure, utility outages, natural
                  disasters, and governmental actions).
                </p>

                {/* Governing Law */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">GOVERNING LAW</h2>
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <p className="text-gray-700">
                    This Disclaimer and any dispute or claim arising out of or relating to the
                    Services are governed by the laws of the Province of New Brunswick and the federal
                    laws of Canada applicable therein, without regard to conflict-of-law principles.
                    Venue and jurisdiction shall lie with the courts of New Brunswick.
                  </p>
                </div>

                {/* Changes to This Disclaimer */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  CHANGES TO THIS DISCLAIMER
                </h2>
                <p className="mb-6 text-gray-700">
                  We may update this Disclaimer from time to time. Changes are effective when posted
                  on our website with the "Last updated" date above. Your continued use of the
                  Services after changes are posted constitutes your acceptance of the revised
                  Disclaimer.
                </p>

                {/* Contact Us */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">CONTACT US</h2>
                <p className="mb-6 text-gray-700">
                  If you have questions about this Disclaimer or our Services, please contact us via
                  the{' '}
                  <Link href="/contact" className="text-blue-600 hover:underline">
                    Contact page
                  </Link>{' '}
                  on our website or by your preferred method of communication on file with us.
                </p>

                {/* Note */}
                <div className="mb-6 rounded-lg border-l-4 border-gray-500 bg-gray-50 p-6">
                  <p className="mb-3 font-semibold text-gray-900">NOTE</p>
                  <p className="text-sm text-gray-700">
                    Where any translation is provided, the English version will prevail in the event
                    of a conflict. For full rental terms, safety requirements, and fees, please refer
                    to your rental agreement and our{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Terms & Conditions
                    </Link>
                    .
                  </p>
                </div>

                {/* Related Documents */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  RELATED LEGAL DOCUMENTS
                </h2>
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Link
                    href="/terms"
                    className="group rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-[#E1BC56] hover:bg-yellow-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">
                          Terms & Conditions
                        </h3>
                        <p className="text-xs text-gray-600">Rental agreement terms</p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/safety"
                    className="group rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-[#E1BC56] hover:bg-yellow-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🦺</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">
                          Safety Guidance
                        </h3>
                        <p className="text-xs text-gray-600">Operator safety rules</p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/insurance"
                    className="group rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-[#E1BC56] hover:bg-yellow-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🛡️</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">
                          Insurance Guide
                        </h3>
                        <p className="text-xs text-gray-600">Coverage requirements</p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/imprint"
                    className="group rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-[#E1BC56] hover:bg-yellow-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚖️</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">
                          Imprint / Legal Notice
                        </h3>
                        <p className="text-xs text-gray-600">Company information</p>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Help Section */}
                <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <p className="font-semibold text-blue-900">⚠️ Questions About This Disclaimer?</p>
                  <p className="mt-2 text-blue-800">
                    If you have questions about our legal disclaimers, limitations of liability, or
                    need clarification on any terms, please contact us. We're here to help ensure you
                    understand your rights and responsibilities.
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


