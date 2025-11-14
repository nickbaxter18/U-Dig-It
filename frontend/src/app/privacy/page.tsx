'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function PrivacyPage() {
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
                  alt="U-Dig It Rentals - Privacy Policy Saint John NB"
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
                  alt="Data Protection Equipment Rental - U-Dig It Privacy"
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
                  alt="Privacy Protection New Brunswick - Customer Data Security"
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
                  alt="Privacy Policy Equipment Rental - U-Dig It Logo"
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
                  alt="Secure Customer Data - Privacy Protection"
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
                  alt="PIPEDA Compliant Rental Services - U-Dig It Privacy"
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
                  alt="Customer Privacy Rights - U-Dig It Rentals"
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
                  alt="Privacy Policy Documentation - U-Dig It Logo"
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
                  alt="Your Privacy Matters - U-Dig It Rentals"
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
                  YOUR PRIVACY MATTERS
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Privacy
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Policy
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                We respect your privacy and are committed to protecting your personal information.
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
                <p className="mb-6 leading-relaxed text-gray-700">
                  At U-Dig It Rentals Inc. ("U-Dig It Rentals," "we," "us," or "our"), we respect
                  your privacy and are committed to protecting the personal information you entrust to
                  us. This Privacy Policy describes how we collect, use, disclose, and safeguard your
                  information when you visit our website or use our services. By using our site and
                  services, you agree to the terms described in this Policy.
                </p>

                {/* Scope and Application */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  SCOPE AND APPLICATION
                </h2>
                <p className="mb-6 text-gray-700">
                  This Privacy Policy applies to personal information collected through our website
                  (udigit.ca), social media platforms, email communications, and any other online
                  services we operate. It also applies to personal information collected during the
                  provision of our rental services. This Policy does not apply to information collected
                  by third parties that may be linked from our site.
                </p>

                {/* Information We Collect */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  INFORMATION WE COLLECT
                </h2>
                <p className="mb-4 text-gray-700">
                  We may collect various types of personal and non-personal information, including:
                </p>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>Contact Information</strong> – such as your name, mailing address, email
                    address, phone number and preferred method of contact.
                  </li>
                  <li>
                    <strong>Rental Details</strong> – including the rental dates, delivery and pickup
                    locations, payment method, and related notes.
                  </li>
                  <li>
                    <strong>Payment Information</strong> – which may include credit card numbers and
                    billing addresses. Payment data is processed securely by our payment service
                    providers and is not stored in full on our servers.
                  </li>
                  <li>
                    <strong>Usage Data</strong> – information about how you interact with our website,
                    including IP addresses, browser type, pages visited, and referral URLs. We collect
                    this data to improve our site and user experience.
                  </li>
                  <li>
                    <strong>Correspondence</strong> – records of communication between you and us,
                    including emails, phone calls and messages, as well as any feedback or testimonials
                    you choose to provide.
                  </li>
                  <li>
                    <strong>Device and Location Data</strong> – if you enable location services or
                    share your GPS location when booking equipment, we may collect location data to
                    ensure accurate delivery and service.
                  </li>
                </ul>
                <p className="mb-6 text-gray-700">
                  We will only collect the minimum amount of personal information necessary to fulfill
                  the purposes outlined in this Policy.
                </p>

                {/* How We Use Your Information */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  HOW WE USE YOUR INFORMATION
                </h2>
                <p className="mb-4 text-gray-700">
                  We use your personal information for the following purposes:
                </p>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>Providing Services</strong> – to process reservations, deliver and pick up
                    equipment, and communicate with you about your rental.
                  </li>
                  <li>
                    <strong>Customer Service and Support</strong> – to respond to inquiries, provide
                    guidance, and address any issues you encounter.
                  </li>
                  <li>
                    <strong>Processing Payments</strong> – to complete transactions securely and to
                    manage billing, invoicing, and refunds.
                  </li>
                  <li>
                    <strong>Marketing and Promotions</strong> – to send you information about our
                    services, special offers or news that may interest you. You can opt out of marketing
                    communications at any time.
                  </li>
                  <li>
                    <strong>Analytics and Improvements</strong> – to monitor usage patterns and improve
                    our website, services and customer experience.
                  </li>
                  <li>
                    <strong>Legal and Regulatory Compliance</strong> – to comply with applicable laws,
                    regulations and requirements from government authorities.
                  </li>
                  <li>
                    <strong>Security</strong> – to detect and prevent fraud, unauthorized activities or
                    access to our systems.
                  </li>
                </ul>
                <p className="mb-6 text-gray-700">
                  We will always ensure that we have a legitimate reason to collect and use your
                  personal data.
                </p>

                {/* Consent */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">CONSENT</h2>
                <p className="mb-6 text-gray-700">
                  By providing us with your personal information, you consent to our collection, use,
                  and disclosure of it as described in this Privacy Policy. You may withdraw your
                  consent at any time, subject to legal or contractual restrictions and reasonable
                  notice. To withdraw consent or ask questions about your consent, please contact us
                  using the information below.
                </p>

                {/* Disclosure of Information */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  DISCLOSURE OF INFORMATION
                </h2>
                <p className="mb-4 text-gray-700">
                  We will not share your personal information with third parties except in the following
                  circumstances:
                </p>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>Service Providers</strong> – We may share information with trusted
                    third-party vendors (such as payment processors, delivery providers, and IT service
                    providers) who assist us in operating our business. These vendors are contractually
                    obligated to protect your information and use it only for the purposes for which it
                    was disclosed.
                  </li>
                  <li>
                    <strong>Legal Requirements</strong> – We may disclose information if required to
                    comply with a court order, law or legal process, including responding to government
                    or regulatory requests.
                  </li>
                  <li>
                    <strong>Business Transfers</strong> – In the event of a merger, acquisition, or sale
                    of all or a portion of our business, your information may be transferred to the
                    acquiring organization as part of the transaction.
                  </li>
                  <li>
                    <strong>Protection of Rights</strong> – We may disclose information when we believe
                    it is necessary to protect the rights, property, or safety of U-Dig It Rentals, our
                    customers, or others.
                  </li>
                </ul>
                <p className="mb-6 text-gray-700">
                  We do not sell or rent your personal information to third parties for marketing
                  purposes.
                </p>

                {/* Cookies and Tracking Technologies */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  COOKIES AND TRACKING TECHNOLOGIES
                </h2>
                <p className="mb-4 text-gray-700">
                  Our website uses cookies and similar technologies to collect data about your browsing
                  behavior. Cookies are small text files placed on your device to help operate the site
                  and improve your experience. We use cookies to:
                </p>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>Remember your preferences and settings.</li>
                  <li>Understand how visitors use our website.</li>
                  <li>
                    Enable certain functionalities, such as secure login and reservation forms.
                  </li>
                </ul>
                <p className="mb-6 text-gray-700">
                  You can control or disable cookies through your browser settings, although doing so
                  may affect the functionality of our website. By continuing to use our site, you
                  consent to our use of cookies as described in this Policy.
                </p>

                {/* Data Security */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">DATA SECURITY</h2>
                <div className="mb-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-6">
                  <p className="font-semibold text-green-900">🔒 Your Data is Protected</p>
                  <p className="mt-2 text-gray-700">
                    We take the security of your personal information seriously. We use administrative,
                    technical, and physical safeguards designed to protect personal information from
                    unauthorized access, disclosure, alteration and destruction. While we strive to
                    protect your personal information, we cannot guarantee absolute security. You also
                    play a role in keeping your data secure; please use strong passwords and do not
                    share login details with others.
                  </p>
                </div>

                {/* Data Retention */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">DATA RETENTION</h2>
                <p className="mb-6 text-gray-700">
                  We will retain your personal information only as long as necessary to fulfill the
                  purposes for which it was collected and as required by law. When your personal
                  information is no longer needed, we will securely destroy or anonymize it.
                </p>

                {/* Your Rights and Choices */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  YOUR RIGHTS AND CHOICES
                </h2>
                <p className="mb-4 text-gray-700">
                  Depending on your jurisdiction, you may have the following rights regarding your
                  personal information:
                </p>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>Access</strong> – You can request access to the personal information we hold
                    about you.
                  </li>
                  <li>
                    <strong>Correction</strong> – You can request that we correct or update any
                    inaccurate or incomplete information.
                  </li>
                  <li>
                    <strong>Withdrawal of Consent</strong> – You may withdraw your consent to our use of
                    your personal information (subject to legal and contractual obligations).
                  </li>
                  <li>
                    <strong>Deletion</strong> – You can request that we delete your personal
                    information, provided it is no longer required for legal or legitimate business
                    purposes.
                  </li>
                  <li>
                    <strong>Marketing Opt-Out</strong> – You can opt out of receiving promotional emails
                    by following the unsubscribe instructions in the email or contacting us directly.
                  </li>
                </ul>
                <p className="mb-6 text-gray-700">
                  To exercise these rights, please contact us using the details provided below.
                </p>

                {/* Third-Party Links */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">THIRD-PARTY LINKS</h2>
                <p className="mb-6 text-gray-700">
                  Our website may contain links to third-party sites. We do not control and are not
                  responsible for the privacy practices of these sites. We encourage you to read the
                  privacy policies of any third-party sites you visit.
                </p>

                {/* Children's Privacy */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">CHILDREN'S PRIVACY</h2>
                <p className="mb-6 text-gray-700">
                  Our services are not intended for children under the age of 13. We do not knowingly
                  collect personal information from children. If we become aware that a child has
                  provided us with personal information, we will take steps to delete it promptly.
                  Parents or guardians who believe we might have data about a child should contact us
                  immediately.
                </p>

                {/* Changes to This Privacy Policy */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  CHANGES TO THIS PRIVACY POLICY
                </h2>
                <p className="mb-6 text-gray-700">
                  We may update this Privacy Policy from time to time to reflect changes in our
                  practices, legal requirements or operational needs. When we make changes, we will
                  update the "Last updated" date and post the revised policy on our website. We
                  encourage you to review this Policy periodically. Continued use of our services after
                  a change signifies your acceptance of the revised Policy.
                </p>

                {/* Contact Us */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">CONTACT US</h2>
                <p className="mb-4 text-gray-700">
                  If you have questions or concerns about this Privacy Policy, or if you wish to
                  exercise your rights regarding your personal information, please contact us at:
                </p>
                <div className="mb-8 rounded-lg bg-gray-50 p-6">
                  <p className="font-semibold text-gray-900">U-Dig It Rentals Inc.</p>
                  <p className="mt-2 text-gray-700">
                    <strong>Address:</strong> 945 Golden Grove Road, Saint John, New Brunswick, E2H 2X1,
                    Canada
                  </p>
                  <p className="mt-2 text-gray-700">
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

                {/* Questions Section */}
                <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <p className="font-semibold text-blue-900">💬 Questions About Your Privacy?</p>
                  <p className="mt-2 text-blue-800">
                    We're committed to transparency and protecting your personal information. If you have
                    any concerns or questions, please don't hesitate to reach out.
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
