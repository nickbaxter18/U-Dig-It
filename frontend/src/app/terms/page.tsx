'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function TermsPage() {
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
                  alt="U-Dig It Rentals - Terms and Conditions Saint John NB"
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
                  alt="Equipment Rental Agreement Terms - U-Dig It Rentals"
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
                  alt="Rental Terms New Brunswick - Legal Compliance"
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
                  alt="Terms of Service Equipment Rental - U-Dig It Logo"
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
                  alt="Legal Terms Equipment Rental - Transparent Policies"
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
                  alt="Rental Agreement Policies - U-Dig It Rentals Inc"
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
                  alt="Fair Rental Terms Saint John - U-Dig It Service"
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
                  alt="Terms and Conditions Equipment Rental - U-Dig It Logo"
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
                  alt="Rental Policy Documentation - U-Dig It Rentals"
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
                  LEGAL & COMPLIANCE
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Terms And
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Conditions
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Clear, transparent rental terms for your peace of mind. Read carefully before booking.
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
                  Welcome to U-Dig It Rentals Inc. By renting equipment from us, you ("Customer")
                  agree to the following Terms and Conditions. Please read carefully before booking.
                  If you do not agree, you may not rent or use our equipment. <strong>Incorporation by
                  Reference.</strong> For rentals of specific units, the corresponding Equipment-Specific
                  Rider (see Schedule A) is incorporated into these Terms and the Rental Agreement. The
                  Rider governs unit-specific requirements (insurance, transport/tie-down, operating
                  limits, return condition, and financial terms) and is binding on the Renter.
                </p>

                {/* 1. Definitions */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">1. Definitions</h2>
                <ul className="mb-6 list-none space-y-2 text-gray-700">
                  <li>
                    <strong>"Company," "we," "us," or "our"</strong> means U-Dig It Rentals Inc.
                  </li>
                  <li>
                    <strong>"Customer," "you," or "your"</strong> means the individual or entity
                    renting equipment.
                  </li>
                  <li>
                    <strong>"Equipment"</strong> means any machinery, attachments, or accessories
                    provided by U-Dig It Rentals Inc., including but not limited to our Kubota SVL-75
                    compact track loader.
                  </li>
                  <li>
                    <strong>"Rental Agreement"</strong> means the written or electronic confirmation
                    of your booking, including dates, rates, deposits, and conditions.
                  </li>
                </ul>

                {/* 2. Eligibility */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">2. Eligibility</h2>
                <p className="mb-4 text-gray-700">To rent equipment, you must:</p>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>Be at least 21 years of age</li>
                  <li>Provide valid government-issued ID and accurate contact information</li>
                  <li>Have the legal capacity and authority to enter into contracts</li>
                  <li>
                    Eligibility requires proof of coverage (COI) or a same-day short-term binder
                    naming U-Dig It Rentals Inc. as Additional Insured and Loss Payee; with Waiver of
                    Subrogation in its favor. See <Link href="/insurance" className="text-blue-600 hover:underline">Getting Insurance</Link> for how to request it.
                  </li>
                  <li>
                    Valid credit card in the renter's name, refundable security hold of $500
                  </li>
                </ul>

                {/* 3. Rental Period and Availability */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  3. Rental Period and Availability
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>Reservations</strong> – Rentals are first-come, first-served. Once booked,
                    equipment is reserved exclusively for you.
                  </li>
                  <li>
                    <strong>Start/End Times</strong> – The rental period begins at delivery or pickup
                    and ends at return or collection.
                  </li>
                  <li>
                    <strong>Extensions</strong> – Requests must be made 24 hours in advance and are
                    subject to availability and extra charges.
                  </li>
                  <li>
                    <strong>Early Returns</strong> – No refunds are given for early returns unless
                    agreed in writing.
                  </li>
                </ul>

                {/* 4. Delivery and Pickup */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  4. Delivery and Pickup
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>Service Area</strong> – We deliver to Saint John, Rothesay, Quispamsis,
                    Grand Bay-Westfield, and Hampton. Additional fees may apply outside this area.
                  </li>
                  <li>
                    <strong>Delivery Conditions</strong> – Customer must provide safe and accessible
                    conditions for delivery and pickup. Extra charges may apply if access is unsafe or
                    blocked.
                  </li>
                  <li>
                    <strong>Inspection</strong> – Equipment will be inspected at delivery and pickup.
                    Acceptance of delivery means you agree the equipment is in good working condition.
                  </li>
                </ul>

                {/* 5. Fees, Payment, and Security Deposit */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  5. Fees, Payment, and Security Deposit
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>Rental Rates</strong> – As stated in your Rental Agreement, plus
                    applicable taxes.
                  </li>
                  <li>
                    <strong>Security Deposit</strong> – A refundable deposit may be required. It may
                    be applied toward unpaid fees, damages, late charges, or cleaning.
                  </li>
                  <li>
                    <strong>Payment</strong> – Full payment is due at booking unless otherwise agreed.
                    We accept credit cards and approved payment methods.
                  </li>
                  <li>
                    <strong>Late Return</strong> – Late returns without approval are charged at the
                    daily rate plus any lost bookings.
                  </li>
                  <li>
                    <strong>Late/Failed Payment</strong> – Failure to pay may result in cancellation
                    of the rental and forfeiture of the deposit.
                  </li>
                </ul>

                {/* 6. Security Deposit */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">6. Security Deposit</h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>Amount</strong> – A refundable security hold of $500 is required on a
                    valid credit card in the renter's name.
                  </li>
                  <li>
                    <strong>Timing</strong> – The deposit/hold must be authorized 1 week prior to
                    release of the equipment, or risk forfeiture of booking.
                  </li>
                  <li>
                    <strong>Application</strong> – The deposit may be applied toward unpaid fees,
                    damages, late charges, or cleaning as described in these Terms.
                  </li>
                  <li>
                    <strong>Refund</strong> – The deposit is refunded after return and inspection. If
                    amounts are owed under these Terms, those amounts may be deducted from the deposit.
                  </li>
                </ul>

                {/* 7. Fuel Policy */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">7. Fuel Policy</h2>
                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
                  <p className="font-semibold text-red-900">⚠️ CRITICAL: Diesel Fuel Only</p>
                  <p className="mt-2 text-gray-700">
                    <strong>Fuel Type</strong> – The equipment requires <strong>diesel fuel only</strong>.
                    Use of gasoline or any other improper fuel will cause severe damage. Customers who
                    use the wrong fuel will be held fully liable for all resulting repair costs, which
                    may include complete engine replacement and associated downtime charges.
                  </p>
                </div>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>Equipment must be returned with the same fuel level as provided.</li>
                  <li>
                    A refueling fee of <strong>$100 plus cost of fuel</strong> will apply if equipment
                    is returned with less fuel.
                  </li>
                </ul>

                {/* 8. Optional Damage Waiver */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  8. Optional Damage Waiver
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>Availability</strong> – Customers may purchase an optional Damage Waiver
                    for $25 per rental day. This must be selected and paid at the time of booking.
                  </li>
                  <li>
                    <strong>Coverage</strong> – The Damage Waiver covers minor accidental damage during
                    the rental period, such as:
                    <ul className="mt-2 list-circle pl-6">
                      <li>Small scratches, cosmetic marks, or minor dents</li>
                      <li>Minor hydraulic hose leaks or seal wear caused during use</li>
                      <li>
                        Slight damage to non-structural components that does not impair safe operation
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Exclusions</strong> – The Damage Waiver does not cover:
                    <ul className="mt-2 list-circle pl-6">
                      <li>Major damage (structural/frame, engine, or full track replacement)</li>
                      <li>
                        Damage from negligence, misuse, intoxication, overloading, or unsafe operation
                      </li>
                      <li>Theft, vandalism, fire, flood, or collision damage</li>
                      <li>Damage to third-party property or persons</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Maximum Coverage</strong> – Limits the Customer's responsibility for
                    covered minor damages up to $1,000 CAD per rental. Beyond this, Customer remains
                    responsible.
                  </li>
                  <li>
                    <strong>No Insurance</strong> – The Damage Waiver is not insurance and does not
                    replace liability, property, or personal injury insurance.
                  </li>
                </ul>

                {/* 9. Insurance and Liability */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  9. Insurance and Liability
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-6">
                  <p className="font-semibold text-yellow-900">🛡️ Insurance Requirements</p>
                  <p className="mt-2 text-gray-700">
                    For skid steer rentals (approximate replacement value $120,000), Renter must, at
                    Renter's expense, maintain for the entire rental period:
                  </p>
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700">
                    <li>
                      <strong>(a) Commercial General Liability</strong> insurance of not less than
                      $2,000,000 per occurrence naming U-Dig It Rentals Inc. as Additional Insured on a
                      primary and non-contributory basis (waiver of subrogation in our favor where
                      available)
                    </li>
                    <li>
                      <strong>(b) Equipment Coverage</strong> for its full replacement value (not less
                      than $120,000) naming U-Dig It Rentals Inc. as Loss Payee, with Waiver of
                      Subrogation in its favor
                    </li>
                    <li>
                      If Renter transports/tows the unit, <strong>Automobile Liability</strong> of not
                      less than $1,000,000 is required
                    </li>
                    <li>
                      If Renter has employees, <strong>Workers' Compensation</strong> coverage must be
                      in force
                    </li>
                  </ul>
                  <p className="mt-4 font-semibold text-yellow-900">
                    Evidence of coverage (certificate and applicable endorsements) must be delivered to
                    and approved by U-Dig It Rentals Inc. prior to release and kept current throughout
                    the rental.
                  </p>
                </div>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    Failure to maintain required insurance is a material breach and may result in
                    refusal to release, termination of the rental, and/or additional charges.
                  </li>
                  <li>
                    Any refundable security hold or Damage Waiver (if offered) is not a substitute for
                    the above liability coverages and does not cover third-party claims.
                  </li>
                  <li>
                    A broker-issued short-term binder that meets these requirements may be accepted at
                    our discretion.
                  </li>
                  <li>
                    Customers are fully responsible for third-party property damage caused by the
                    equipment.
                  </li>
                  <li>
                    Customers agree to indemnify and hold harmless U-Dig It Rentals Inc. from claims or
                    damages except where caused by our gross negligence.
                  </li>
                  <li>Our liability is limited to the total rental fees paid.</li>
                  <li>
                    If Renter does not currently carry this coverage, a same-day short-term binder can
                    typically be obtained through the Renter's broker; see our{' '}
                    <Link href="/insurance" className="text-blue-600 hover:underline">
                      Getting Insurance
                    </Link>{' '}
                    page for step-by-step guidance and a broker email template.
                  </li>
                </ul>

                {/* 10. Safety and Prohibited Use */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  10. Safety and Prohibited Use
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    Equipment must <strong>never be operated under the influence</strong> of alcohol,
                    drugs, or impairing substances. Doing so voids all waivers and protections.
                  </li>
                  <li>
                    Equipment may not be subleased, rented out, transported, or moved to another site
                    without written permission.
                  </li>
                  <li>
                    Equipment must not be left unattended in unsecured areas. Customers must take
                    reasonable steps to prevent theft or vandalism.
                  </li>
                </ul>

                {/* 11. Cleaning Policy */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">11. Cleaning Policy</h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    Equipment must be returned free of excessive dirt, mud, concrete, or corrosive
                    materials.
                  </li>
                  <li>
                    A cleaning fee will be charged if returned in unreasonable condition.
                  </li>
                  <li>
                    Customers may pre-pay a $100 Cleaning Waiver at booking to avoid cleaning charges.
                  </li>
                </ul>

                {/* 12. Mechanical Issues and Repairs */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  12. Mechanical Issues and Repairs
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>Report mechanical issues immediately.</li>
                  <li>Do not attempt repairs without written authorization.</li>
                  <li>
                    If a breakdown occurs through no fault of the Customer, charges will be adjusted.
                  </li>
                </ul>

                {/* 13. Weather Policy */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">13. Weather Policy</h2>
                <p className="mb-6 text-gray-700">
                  Rentals proceed in most conditions. However, the Company may delay or reschedule in
                  cases of unsafe weather or road conditions.
                </p>

                {/* 14. Cancellations and Refunds */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  14. Cancellations and Refunds
                </h2>
                <p className="mb-3 font-semibold text-gray-800">Customer Cancellations:</p>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>72+ hours before start time: Full refund / release of any deposit hold</li>
                  <li>
                    Between 72 and 24 hours before start time: Charge 50% of the first day's rental
                    rate
                  </li>
                  <li>
                    Less than 24 hours before start time or no-show: Charge one full day at the regular
                    rate
                  </li>
                </ul>
                <p className="mb-3 font-semibold text-gray-800">Company Cancellations:</p>
                <p className="mb-6 text-gray-700">
                  If we cannot fulfill due to breakdown, scheduling conflict, or force majeure, you may
                  reschedule or receive a refund.
                </p>
                <p className="mb-3 font-semibold text-gray-800">Force Majeure:</p>
                <p className="mb-6 text-gray-700">
                  We are not responsible for delays caused by circumstances outside our control (e.g.,
                  weather, accidents, road closures).
                </p>

                {/* 15. Termination of Agreement */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  15. Termination of Agreement
                </h2>
                <p className="mb-4 text-gray-700">We may terminate immediately if:</p>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>You breach these Terms.</li>
                  <li>The equipment is misused, unsafe, or endangered.</li>
                  <li>Payment is not made in full.</li>
                </ul>
                <p className="mb-6 text-gray-700">
                  Upon termination, equipment must be returned immediately. Outstanding fees and damages
                  remain due.
                </p>

                {/* 16. Media Policy */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">16. Media Policy</h2>
                <p className="mb-4 text-gray-700">
                  By renting from us, you grant permission for U-Dig It Rentals Inc. to take
                  before/after photos or videos of your project site that feature our equipment.
                </p>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    Media may be used for marketing, promotional, and educational purposes (website,
                    social media, advertising, print).
                  </li>
                  <li>
                    We will not disclose your name, address, or personal details without written
                    consent.
                  </li>
                  <li>Customers may opt out by notifying us in writing at booking.</li>
                </ul>

                {/* 17. Intellectual Property */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  17. Intellectual Property
                </h2>
                <p className="mb-6 text-gray-700">
                  All website content, including text, logos, and images, is the property of U-Dig It
                  Rentals Inc. and may not be copied or distributed without permission.
                </p>

                {/* 18. Privacy Policy */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">18. Privacy Policy</h2>
                <p className="mb-6 text-gray-700">
                  Your personal information will only be used for rental services and handled according
                  to our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>. We never sell or share your
                  information without consent.
                </p>

                {/* 19. Dispute Resolution & Collection Costs */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  19. Dispute Resolution & Collection Costs
                </h2>
                <p className="mb-6 text-gray-700">
                  In the event of unpaid charges or damages, U-Dig It Rentals Inc. reserves the right to
                  recover collection costs, interest, and reasonable legal fees.
                </p>

                {/* 20. Governing Law */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">20. Governing Law</h2>
                <p className="mb-6 text-gray-700">
                  These Terms are governed by the laws of New Brunswick and Canada. Disputes will be
                  resolved in the courts of New Brunswick.
                </p>

                {/* 21. Severability */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">21. Severability</h2>
                <p className="mb-6 text-gray-700">
                  If any part of these Terms is found unenforceable, the remaining provisions remain in
                  full effect.
                </p>

                {/* 22. Entire Agreement */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">22. Entire Agreement</h2>
                <p className="mb-6 text-gray-700">
                  These Terms, together with your Rental Agreement, constitute the entire agreement
                  between you and U-Dig It Rentals Inc., superseding all prior communications.
                </p>

                {/* 23. Modifications */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">23. Modifications</h2>
                <p className="mb-6 text-gray-700">
                  We may update these Terms at any time. Updated versions will be posted on our website
                  with a new revision date. Continued rentals after changes constitute acceptance.
                </p>

                {/* 24. Digital Agreement */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">24. Digital Agreement</h2>
                <p className="mb-6 text-gray-700">
                  By checking the box and submitting your booking online, you acknowledge that this
                  constitutes your digital signature and a legally binding acceptance of these Terms and
                  Conditions.
                </p>

                {/* 25. Contact Information */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  25. Contact Information
                </h2>
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <p className="font-semibold text-gray-900">U-Dig It Rentals Inc.</p>
                  <p className="mt-2 text-gray-700">945 Golden Grove Road</p>
                  <p className="text-gray-700">Saint John, New Brunswick, Canada, E2H 2X1</p>
                  <p className="mt-3 text-gray-700">
                    Phone:{' '}
                    <a href="tel:+15066431575" className="text-blue-600 hover:underline">
                      1 (506) 643-1575
                    </a>
                  </p>
                  <p className="text-gray-700">
                    Email:{' '}
                    <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                      nickbaxter@udigit.ca
                    </a>
                  </p>
                </div>

                {/* Schedule A — Equipment-Specific Rider */}
                <h2 className="mb-4 mt-12 border-t-2 border-gray-200 pt-8 text-3xl font-bold text-gray-900">
                  Schedule A — Equipment-Specific Rider
                  <br />
                  <span className="text-xl font-normal text-gray-600">
                    (Incorporation by Reference)
                  </span>
                </h2>
                <p className="mb-6 text-gray-700">
                  The Equipment-Specific Rider is incorporated into and forms part of these Terms &
                  Conditions and the Rental Agreement for all rentals of the identified unit(s). The
                  Rider contains unit-specific requirements, including (without limitation) insurance,
                  transport & tie-down, operating limits & safety, prohibited uses, damage/loss/theft &
                  environmental responsibilities, return condition, and financial terms (e.g., deposits,
                  refuel, cleaning, over-hours).
                </p>

                <h3 className="mb-3 mt-6 text-xl font-semibold text-gray-900">
                  Order of Precedence
                </h3>
                <p className="mb-6 text-gray-700">
                  If there is any conflict between these Terms & Conditions and the Equipment-Specific
                  Rider, the Rider controls for unit-specific matters (e.g., insurance limits, operating
                  limits, return condition, charges specific to the unit). For general matters not
                  addressed by the Rider, these Terms & Conditions control. Where a conflict cannot be
                  reconciled, the stricter term (greater safety/financial protection) applies unless
                  otherwise agreed in writing by U-Dig It Rentals Inc.
                </p>

                <h3 className="mb-3 mt-6 text-xl font-semibold text-gray-900">
                  Acceptance & Clickwrap
                </h3>
                <p className="mb-6 text-gray-700">
                  By submitting a booking request, signing the Rental Agreement, or taking possession of
                  the equipment, the Renter acknowledges having read and agreed to these Terms &
                  Conditions and the Equipment-Specific Rider. Online, Renter must affirmatively consent
                  (e.g., required checkbox) referencing this section and the Rider link. A printable
                  copy is available upon request.
                </p>

                <h3 className="mb-3 mt-6 text-xl font-semibold text-gray-900">Version in Effect</h3>
                <p className="mb-6 text-gray-700">
                  The version of the Equipment-Specific Rider in effect at the time of booking (or, if
                  no advance booking, at time of release) applies to that rental. U-Dig It Rentals Inc.
                  may update the Rider from time to time; updates do not apply retroactively to active
                  rentals without written consent.
                </p>

                <h3 className="mb-3 mt-6 text-xl font-semibold text-gray-900">Availability</h3>
                <p className="mb-6 text-gray-700">
                  Temporary unavailability of the Rider web page does not affect enforceability. If the
                  page is unavailable, U-Dig It Rentals Inc. will provide a copy by email or in print on
                  request.
                </p>

                {/* Important Notice */}
                <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <p className="font-semibold text-blue-900">📋 Questions?</p>
                  <p className="mt-2 text-blue-800">
                    Contact us directly for clarification on any terms or requirements. We're here to
                    help ensure a smooth rental experience.
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
