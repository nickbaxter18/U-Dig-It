'use client';

import Link from 'next/link';

export default function GettingInsurancePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-[#A90F0F] px-4 py-2 text-sm font-semibold text-white">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
              Insurance Help
            </div>
            <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Get Your <span className="text-[#A90F0F]">Certificate of Insurance</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
              We'll help you get the right insurance coverage for your equipment rental. Our
              partners understand construction and equipment rental needs.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Insurance Requirements */}
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-semibold text-gray-900">Required Coverage</h2>

              <div className="space-y-6">
                <div className="border-l-4 border-[#A90F0F] pl-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Commercial General Liability
                  </h3>
                  <p className="mb-2 text-gray-600">Minimum: $2,000,000</p>
                  <p className="text-sm text-gray-500">
                    Covers bodily injury and property damage that may occur during your project.
                  </p>
                </div>

                <div className="border-l-4 border-[#A90F0F] pl-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Rented Equipment Coverage
                  </h3>
                  <p className="mb-2 text-gray-600">Minimum: $120,000</p>
                  <p className="text-sm text-gray-500">
                    Specifically covers the rented equipment against damage or theft.
                  </p>
                </div>

                <div className="border-l-4 border-[#A90F0F] pl-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Additional Insured</h3>
                  <p className="mb-2 text-gray-600">U-Dig It Rentals Inc.</p>
                  <p className="text-sm text-gray-500">
                    Must be listed as additional insured on your certificate.
                  </p>
                </div>

                <div className="border-l-4 border-[#A90F0F] pl-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Loss Payee</h3>
                  <p className="mb-2 text-gray-600">U-Dig It Rentals Inc.</p>
                  <p className="text-sm text-gray-500">
                    Required for equipment damage claims and protection.
                  </p>
                </div>
              </div>
            </div>

            {/* Help Options */}
            <div className="space-y-6">
              {/* Quick Contact */}
              <div className="rounded-2xl bg-white p-8 shadow-lg">
                <h2 className="mb-6 text-2xl font-semibold text-gray-900">Get Help Now</h2>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4 rounded-lg bg-green-50 p-4">
                    <div className="text-2xl">📞</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Call Our Insurance Team</h3>
                      <p className="text-sm text-gray-600">
                        Speak directly with our insurance specialists
                      </p>
                      <a
                        href="tel:+15066431575"
                        className="font-semibold text-[#A90F0F] hover:underline"
                      >
                        (506) 643-1575
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 rounded-lg bg-blue-50 p-4">
                    <div className="text-2xl">📧</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email for Help</h3>
                      <p className="text-sm text-gray-600">
                        Send us your questions and we'll respond quickly
                      </p>
                      <a
                        href="mailto:nickbaxter@udigit.ca"
                        className="font-semibold text-[#A90F0F] hover:underline"
                      >
                        nickbaxter@udigit.ca
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insurance Partners */}
              <div className="rounded-2xl bg-white p-8 shadow-lg">
                <h2 className="mb-6 text-2xl font-semibold text-gray-900">
                  Our Insurance Partners
                </h2>

                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-2 font-semibold text-gray-900">
                      Construction Insurance Specialists
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      We work with insurance providers who understand construction and equipment
                      rental needs.
                    </p>
                    <ul className="space-y-1 text-sm text-gray-500">
                      <li>• Fast approval process</li>
                      <li>• Competitive rates for contractors</li>
                      <li>• Same-day certificate generation</li>
                      <li>• 24/7 claims support</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-2 font-semibold text-gray-900">Equipment Rental Coverage</h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Specialized coverage designed for equipment rental scenarios.
                    </p>
                    <ul className="space-y-1 text-sm text-gray-500">
                      <li>• Equipment damage protection</li>
                      <li>• Theft and vandalism coverage</li>
                      <li>• Environmental liability</li>
                      <li>• Workers compensation</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="rounded-2xl bg-white p-8 shadow-lg">
                <h2 className="mb-6 text-2xl font-semibold text-gray-900">
                  Frequently Asked Questions
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-900">
                      How long does it take to get insurance?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Most applications are approved within 24-48 hours. We can expedite for urgent
                      projects.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-1 font-semibold text-gray-900">
                      What if I already have insurance?
                    </h3>
                    <p className="text-sm text-gray-600">
                      We'll review your existing policy to ensure it meets our requirements. Often,
                      we can work with your current provider.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-1 font-semibold text-gray-900">
                      Can I get coverage for just this rental?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Yes! We offer short-term coverage options for single-project rentals.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-1 font-semibold text-gray-900">
                      What if I'm a first-time contractor?
                    </h3>
                    <p className="text-sm text-gray-600">
                      No problem! Our partners specialize in helping new contractors get the
                      coverage they need.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-12 space-y-4 text-center">
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="tel:+15066431575"
                className="inline-flex items-center rounded-lg bg-[#A90F0F] px-8 py-4 font-semibold text-white transition-colors hover:bg-red-700"
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Call Now: (506) 643-1575
              </a>

              <Link
                href="/insurance-upload"
                className="inline-flex items-center rounded-lg border-2 border-[#A90F0F] bg-white px-8 py-4 font-semibold text-[#A90F0F] transition-colors hover:bg-[#A90F0F] hover:text-white"
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload Insurance Certificate
              </Link>
            </div>

            <p className="text-sm text-gray-600">
              Need help immediately? Call us now for same-day insurance assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
