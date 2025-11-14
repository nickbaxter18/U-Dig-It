'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function InsurancePage() {
  const emailTemplate = `Subject: Short-Term Binder & COI for U-Dig It Rentals Inc.

Hi [Broker Name],

I'm renting equipment from U-Dig It Rentals Inc. Please issue a Certificate of Insurance and (if needed) a short-term binder for the rental dates [start–end] with:

• CGL: $2,000,000 per occurrence, U-Dig It Rentals Inc. as Additional Insured (primary & non-contributory) with Waiver of Subrogation in its favour
• Rented/Leased Equipment Coverage with: replacement value of $120,000, with Waiver of Subrogation in its favour Loss Payee: U-Dig It Rentals Inc.
• Auto Liability: $1,000,000 (if I tow/transport)
• Workers' Compensation (if applicable)

Please email the COI/endorsements to nickbaxter@udigit.ca. Thank you!

[Your Name, phone]`;

  const copyEmailTemplate = () => {
    navigator.clipboard.writeText(emailTemplate);
    alert('Email template copied to clipboard!');
  };

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
                  alt="U-Dig It Rentals - Equipment Insurance Saint John NB"
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
                  alt="Rental Insurance Coverage - U-Dig It Insurance Guide"
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
                  alt="Equipment Liability Insurance - Certificate of Insurance"
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
                  alt="Short-Term Insurance Binder - U-Dig It Logo"
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
                  alt="Contractor Insurance Requirements - U-Dig It Rentals"
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
                  alt="Equipment Insurance Guide - U-Dig It"
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
                  alt="Commercial Liability Coverage - U-Dig It Insurance"
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
                  alt="Rental Equipment Coverage - U-Dig It Logo"
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
                  alt="Insurance Binder New Brunswick - U-Dig It Rentals"
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
                  INSURANCE GUIDE
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Getting
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Insurance
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Get a short-term insurance binder for your rental. Fast step-by-step guide for contractors and homeowners.
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
                {/* Introduction */}
                <div className="mb-8 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Insurance requirements are summarized here and detailed in
                    the Equipment-Specific Rider (Schedule A) on our{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Terms & Conditions
                    </Link>
                    .
                  </p>
                </div>

                {/* Why You Might Need This */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  Why you might need this
                </h2>
                <p className="mb-6 text-gray-700">
                  For higher-value or higher-risk rentals (like our skid steer), we require proof of
                  insurance before release. If you don't already have a business policy, you can
                  usually get a same-day short-term binder from a broker.
                </p>

                {/* Coverage You'll Be Asked For */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  Coverage you'll be asked for
                </h2>
                <div className="mb-6 space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">
                      Commercial General Liability (CGL):
                    </h3>
                    <p className="text-sm text-gray-700">
                      $2,000,000 per occurrence, naming U-Dig It Rentals Inc. as{' '}
                      <strong>Additional Insured</strong> on a primary & non-contributory basis with{' '}
                      <strong>Waiver of Subrogation</strong> in its favour.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">
                      Rented/Leased Equipment (Contractor's Equipment/Floater):
                    </h3>
                    <p className="text-sm text-gray-700">
                      Limit at least the machine's replacement value (e.g., $120,000 for our skid
                      steer), naming U-Dig It Rentals Inc. as <strong>Loss Payee</strong>, with{' '}
                      <strong>Waiver of Subrogation</strong> in its favour.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Auto Liability:</h3>
                    <p className="text-sm text-gray-700">
                      If you tow/transport the unit, minimum $1,000,000.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Workers' Compensation:</h3>
                    <p className="text-sm text-gray-700">If you have employees.</p>
                  </div>
                </div>

                <div className="mb-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
                  <p className="text-sm text-green-800">
                    <strong>Tip:</strong> A short-term binder can provide these limits for the rental
                    dates if you don't already carry them.
                  </p>
                </div>

                {/* What to Tell Your Broker */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  What to tell your broker
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>Your rental dates and location/jobsite.</li>
                  <li>
                    Equipment and value (e.g., "Skid steer, replacement value $120,000").
                  </li>
                  <li>The exact wording above for Additional Insured and Loss Payee.</li>
                  <li>Whether you'll be towing/transporting the unit.</li>
                  <li>
                    Where to send the COI:{' '}
                    <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                      nickbaxter@udigit.ca
                    </a>
                  </li>
                </ul>

                {/* Email Template */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  Copy-and-send email to your broker
                </h2>
                <div className="mb-6 rounded-lg border-2 border-[#E1BC56] bg-yellow-50 p-6">
                  <pre className="mb-4 whitespace-pre-wrap text-sm text-gray-700">{emailTemplate}</pre>
                  <button
                    onClick={copyEmailTemplate}
                    className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-6 py-3 font-semibold text-black shadow-lg transition-all hover:scale-105"
                  >
                    📋 Copy Email Template
                  </button>
                </div>

                {/* Typical Cost & Timing */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  Typical cost & timing (ballpark)
                </h2>
                <div className="mb-6 space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Contractors with CGL:</h3>
                    <p className="text-sm text-gray-700">
                      COI is usually $0, same day. Adding "Rented Equipment" for the rental period may
                      be low cost.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Homeowners/DIY:</h3>
                    <p className="text-sm text-gray-700">
                      Short-term binder commonly $150–$500 CAD for a week and can be Pro-Rated (varies
                      by machine/limits). Often same day.
                    </p>
                  </div>
                </div>
                <p className="mb-6 text-sm italic text-gray-600">
                  Not a quote; actual pricing depends on limits, duration, driving/operator history,
                  and insurer.
                </p>

                {/* COI Approval Checklist */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  Avoid delays: COI approval checklist
                </h2>
                <div className="mb-6 rounded-lg border-2 border-green-500 bg-green-50 p-6">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2 text-green-600">✓</span>
                      <span>Dates cover your full rental period.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-green-600">✓</span>
                      <span>
                        U-Dig It Rentals Inc. appears exactly as Additional Insured (primary &
                        non-contributory) on the CGL.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-green-600">✓</span>
                      <span>
                        Rented/Leased Equipment limit meets or exceeds the equipment value and names
                        U-Dig It Rentals Inc. as Loss Payee.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-green-600">✓</span>
                      <span>
                        Broker contact info is on the certificate; Canadian insurer/broker.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-green-600">✓</span>
                      <span>If towing: Auto Liability included.</span>
                    </li>
                  </ul>
                </div>

                {/* How to Submit */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  How to submit your Certificate of Insurance
                </h2>
                <p className="mb-6 text-gray-700">
                  Reply to your booking confirmation and attach the COI (PDF or clear photo), or email
                  it to{' '}
                  <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                    nickbaxter@udigit.ca
                  </a>
                  . We'll confirm approval.{' '}
                  <strong className="text-red-600">
                    No COI, no release for units that require it.
                  </strong>
                </p>

                {/* Local Brokers */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  What if I can't get a binder in time?
                </h2>
                <p className="mb-4 font-semibold text-gray-900">
                  Here is a list of brokers who can help you get insurance today!
                </p>
                <div className="mb-6 space-y-3">
                  <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
                    <h3 className="mb-2 font-bold text-blue-900">John Walker Insurance (Saint John)</h3>
                    <p className="text-sm text-gray-700">
                      📞{' '}
                      <a href="tel:+15066331990" className="text-blue-600 hover:underline">
                        1-506-633-1990
                      </a>
                      <br />
                      ✉️{' '}
                      <a
                        href="mailto:sales@johnwalkerinsurance.com"
                        className="text-blue-600 hover:underline"
                      >
                        sales@johnwalkerinsurance.com
                      </a>
                    </p>
                  </div>

                  <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
                    <h3 className="mb-2 font-bold text-blue-900">
                      Mitchell McConnell Insurance (Saint John)
                    </h3>
                    <p className="text-sm text-gray-700">
                      📞{' '}
                      <a href="tel:+15066347200" className="text-blue-600 hover:underline">
                        1-506-634-7200
                      </a>
                      <br />
                      ✉️{' '}
                      <a
                        href="mailto:info@mitchellmcconnell.com"
                        className="text-blue-600 hover:underline"
                      >
                        info@mitchellmcconnell.com
                      </a>
                      <br />
                      🌐{' '}
                      <a
                        href="https://mitchellmcconnell.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        mitchellmcconnell.com
                      </a>
                    </p>
                  </div>

                  <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
                    <h3 className="mb-2 font-bold text-blue-900">
                      BrokerLink — Saint John (Rothesay Ave)
                    </h3>
                    <p className="text-sm text-gray-700">
                      📞{' '}
                      <a href="tel:+15066350760" className="text-blue-600 hover:underline">
                        1-506-635-0760
                      </a>
                      <br />
                      ✉️{' '}
                      <a href="mailto:nbservice@brokerlink.ca" className="text-blue-600 hover:underline">
                        nbservice@brokerlink.ca
                      </a>
                    </p>
                  </div>

                  <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
                    <h3 className="mb-2 font-bold text-blue-900">Higgins Insurance (Quispamsis)</h3>
                    <p className="text-sm text-gray-700">
                      📞{' '}
                      <a href="tel:+15068497800" className="text-blue-600 hover:underline">
                        1-506-849-7800
                      </a>
                      <br />
                      ✉️{' '}
                      <a
                        href="mailto:info@higginsinsurance.ca"
                        className="text-blue-600 hover:underline"
                      >
                        info@higginsinsurance.ca
                      </a>
                    </p>
                  </div>
                </div>

                {/* FAQs */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">FAQs</h2>
                <div className="mb-6 space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">
                      Does the walkthrough/orientation replace training?
                    </h3>
                    <p className="text-sm text-gray-700">
                      No. We include a quick orientation and have how-to videos, but you must be
                      competent and follow the Operator's Manual and{' '}
                      <Link href="/safety" className="text-blue-600 hover:underline">
                        safety rules
                      </Link>
                      .
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">
                      Will my homeowner's policy cover this?
                    </h3>
                    <p className="text-sm text-gray-700">
                      Usually not for commercial equipment—ask your broker. That's why short-term
                      binders exist.
                    </p>
                  </div>
                </div>

                {/* Legal Disclaimer */}
                <div className="mb-6 rounded-lg border-l-4 border-gray-500 bg-gray-50 p-6">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> This page is provided for convenience and does not
                    constitute insurance, legal, or financial advice. Coverage terms are set by your
                    insurer. Where a translation is provided, the English version prevails.
                    Requirements may vary by equipment—see your Rental Agreement and any
                    Equipment-Specific Rider for the binding terms.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="mt-12 rounded-lg border-2 border-[#E1BC56] bg-gradient-to-br from-yellow-50 to-orange-50 p-8 shadow-lg">
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-3xl font-bold text-gray-900">Need Help?</h2>
                    <p className="text-lg text-gray-600">
                      Questions about insurance requirements? Contact us!
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <button
                      onClick={copyEmailTemplate}
                      className="inline-flex items-center justify-center gap-2 transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-center text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                    >
                      <span>📋</span>
                      <span>Copy Broker Email</span>
                    </button>
                    <a
                      href="tel:+15066431575"
                      className="inline-flex items-center justify-center gap-2 transform rounded-lg bg-[#A90F0F] px-8 py-4 text-center text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-[#8a0c0c]"
                    >
                      <span>📞</span>
                      <span>Call (506) 643-1575</span>
                    </a>
                    <a
                      href="mailto:nickbaxter@udigit.ca"
                      className="inline-flex items-center justify-center gap-2 transform rounded-lg bg-blue-600 px-8 py-4 text-center text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-blue-700"
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

