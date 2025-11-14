'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function ContestRulesPage() {
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
                  alt="U-Dig It Rentals Contest - Monthly Equipment Giveaway Saint John"
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
                  alt="Free Equipment Rental Contest - Win Kubota Machinery"
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
                  alt="Contest Official Rules - Equipment Rental Saint John NB"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 32px, 48px"
                  unoptimized
                />
              </div>
            </div>

            {/* Center Background */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[4deg] opacity-10">
              <div className="relative h-80 w-80">
                <Image
                  src="/images/udigit-logo.png"
                  alt="U-Dig It Monthly Contest - Enter to Win Free Machine Time"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 56px, 80px"
                  unoptimized
                />
              </div>
            </div>

            {/* Upper Right */}
            <div className="absolute right-[20%] top-[28%] rotate-[7deg] opacity-10">
              <div className="relative h-52 w-52">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Win Free Half-Day Machine - Contest Terms and Conditions"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 36px, 52px"
                  unoptimized
                />
              </div>
            </div>

            {/* Bottom Left */}
            <div className="absolute bottom-12 left-[12%] rotate-[-8deg] opacity-10">
              <div className="relative h-64 w-64">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Legal Contest Rules - U-Dig It Rentals Prize Draw"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 44px, 64px"
                  unoptimized
                />
              </div>
            </div>

            {/* Bottom Right */}
            <div className="absolute bottom-16 right-[18%] rotate-[9deg] opacity-10">
              <div className="relative h-56 w-56">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Contest Eligibility Rules - New Brunswick Equipment Giveaway"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 40px, 56px"
                  unoptimized
                />
              </div>
            </div>

            {/* Far Left Middle */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 rotate-[-12deg] opacity-10">
              <div className="relative h-44 w-44">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Monthly Prize Draw - U-Dig It Equipment Rental Contest"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 28px, 44px"
                  unoptimized
                />
              </div>
            </div>

            {/* Far Right Middle */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 rotate-[11deg] opacity-10">
              <div className="relative h-48 w-48">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Contest Terms - Win Professional Operator Service"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 32px, 48px"
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

          {/* Hero Content */}
          <div className="container relative z-10 mx-auto px-4 py-24 sm:py-32">
            <div className="headline-3d mx-auto max-w-4xl text-center">
              <div className="mb-4 inline-block rounded-full bg-[#E1BC56]/10 px-6 py-2 backdrop-blur-sm">
                <span className="text-sm font-semibold uppercase tracking-wider text-[#E1BC56]">
                  Official Contest Rules
                </span>
              </div>

              <h1 className="mb-6 text-5xl font-bold leading-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
                Monthly Equipment Contest
                <span className="mt-2 block bg-gradient-to-r from-[#E1BC56] to-yellow-400 bg-clip-text text-transparent">
                  Terms & Conditions
                </span>
              </h1>

              <p className="mx-auto mb-10 max-w-3xl text-lg text-gray-300 sm:text-xl">
                Please read these official rules carefully before entering the U-Dig It Rentals Monthly Equipment Contest.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/contest"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#E1BC56] px-8 py-4 font-bold text-gray-900 shadow-2xl shadow-[#E1BC56]/30 transition-all hover:scale-105 hover:bg-yellow-400 hover:shadow-[#E1BC56]/50"
                >
                  <svg className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Contest
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Rules Content */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="rounded-2xl bg-white p-8 shadow-xl md:p-12">
              {/* Last Updated */}
              <div className="mb-8 rounded-lg bg-slate-100 p-4">
                <p className="text-sm text-slate-600">
                  <strong>Last Updated:</strong> November 2, 2025
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  <strong>Effective Date:</strong> November 1, 2025
                </p>
              </div>

              {/* Table of Contents */}
              <nav className="mb-12 rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900">Table of Contents</h2>
                <ol className="space-y-2 text-sm">
                  <li><a href="#sponsor" className="text-kubota-orange hover:underline">1. Sponsor</a></li>
                  <li><a href="#eligibility" className="text-kubota-orange hover:underline">2. Eligibility</a></li>
                  <li><a href="#contest-period" className="text-kubota-orange hover:underline">3. Contest Period</a></li>
                  <li><a href="#how-to-enter" className="text-kubota-orange hover:underline">4. How to Enter</a></li>
                  <li><a href="#referral-mechanic" className="text-kubota-orange hover:underline">5. Referral Mechanic</a></li>
                  <li><a href="#prizes" className="text-kubota-orange hover:underline">6. Prizes</a></li>
                  <li><a href="#winner-selection" className="text-kubota-orange hover:underline">7. Winner Selection</a></li>
                  <li><a href="#odds" className="text-kubota-orange hover:underline">8. Odds of Winning</a></li>
                  <li><a href="#winner-notification" className="text-kubota-orange hover:underline">9. Winner Notification</a></li>
                  <li><a href="#verification" className="text-kubota-orange hover:underline">10. Verification & Disqualification</a></li>
                  <li><a href="#prize-conditions" className="text-kubota-orange hover:underline">11. Prize Conditions & Restrictions</a></li>
                  <li><a href="#privacy" className="text-kubota-orange hover:underline">12. Privacy & Data Collection</a></li>
                  <li><a href="#publicity" className="text-kubota-orange hover:underline">13. Publicity Rights</a></li>
                  <li><a href="#liability" className="text-kubota-orange hover:underline">14. Limitation of Liability</a></li>
                  <li><a href="#disputes" className="text-kubota-orange hover:underline">15. Disputes & Governing Law</a></li>
                  <li><a href="#general" className="text-kubota-orange hover:underline">16. General Conditions</a></li>
                </ol>
              </nav>

              {/* Section 1: Sponsor */}
              <section id="sponsor" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">1. Sponsor</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    This contest (&quot;Contest&quot;) is sponsored by U-Dig It Rentals Inc. (&quot;Sponsor&quot;),
                    located in Saint John, New Brunswick, Canada. The Contest is subject to all applicable
                    federal, provincial, and local laws and regulations.
                  </p>
                  <p className="mt-4">
                    <strong>Sponsor Contact Information:</strong><br />
                    U-Dig It Rentals Inc.<br />
                    Saint John, NB, Canada<br />
                    Email: info@udigit.ca<br />
                    Phone: (506) 643-1575
                  </p>
                </div>
              </section>

              {/* Section 2: Eligibility */}
              <section id="eligibility" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">2. Eligibility</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    The Contest is open to legal residents of New Brunswick, Canada, who are 18 years
                    of age or older at the time of entry. Employees, officers, and directors of the
                    Sponsor, its affiliates, subsidiaries, advertising and promotion agencies, and their
                    immediate family members (spouse, parents, children, siblings, and their spouses)
                    and household members of each are not eligible to enter or win.
                  </p>
                  <p className="mt-4">
                    <strong>Age Verification:</strong> Winners may be required to provide proof of age
                    (valid government-issued photo ID) before prize fulfillment.
                  </p>
                  <p className="mt-4">
                    <strong>Geographic Limitation:</strong> Prizes are only redeemable within the
                    Sponsor&apos;s service area in the Greater Saint John region of New Brunswick. Entrants
                    must be able to receive service at their location to be eligible for prize redemption.
                    The standard service area is within 30 kilometers from the Sponsor&apos;s shop location.
                    Winners outside the 30km radius are still eligible but will be responsible for an overage
                    fee of CAD $3.00 per kilometer for the additional distance traveled (round-trip).
                  </p>
                </div>
              </section>

              {/* Section 3: Contest Period */}
              <section id="contest-period" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">3. Contest Period</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    The Contest runs on a monthly basis. Each monthly Contest period begins at 12:00:01 AM
                    Atlantic Time (AT) on the first day of the month and ends at 11:59:59 PM AT on the last
                    day of the same month (&quot;Contest Period&quot;).
                  </p>
                  <p className="mt-4">
                    <strong>Example:</strong> The November 2025 Contest Period runs from November 1, 2025
                    at 12:00:01 AM AT through November 30, 2025 at 11:59:59 PM AT.
                  </p>
                  <p className="mt-4">
                    Only entries received during the Contest Period will be eligible for that month&apos;s
                    prize drawing. The Sponsor&apos;s computer is the official time-keeping device for the Contest.
                  </p>
                </div>
              </section>

              {/* Section 4: How to Enter */}
              <section id="how-to-enter" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">4. How to Enter</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    <strong>No Purchase Necessary.</strong> To enter, visit{' '}
                    <a href="https://udigit.ca/contest" className="text-kubota-orange hover:underline">
                      udigit.ca/contest
                    </a>{' '}
                    during the Contest Period and complete the online entry form with the following required information:
                  </p>
                  <ul className="mt-4">
                    <li>First Name</li>
                    <li>Last Name</li>
                    <li>Valid Email Address</li>
                    <li>Postal Code</li>
                    <li>Agreement to these Official Rules</li>
                  </ul>
                  <p className="mt-4">
                    Optional information includes: Phone Number, City, and Referral Code (if referred by a friend).
                  </p>
                  <p className="mt-4">
                    <strong>Email Verification:</strong> Your entry will be recorded immediately upon submission.
                    However, to be eligible for prize drawings, you must have a verified email address associated
                    with your account. After submitting your entry, you will receive an email containing a verification
                    link. Click this link to verify your email address and ensure your eligibility for prize drawings.
                    Only entrants with verified email addresses will be included in the prize drawing.
                  </p>
                  <p className="mt-4">
                    <strong>Entry Limits:</strong> One (1) entry per person/email address per Contest Period.
                    Multiple entries from the same person or email address will be disqualified. Use of automated
                    entry systems, third-party entries, or other methods to obtain multiple entries is prohibited
                    and will result in disqualification.
                  </p>
                  <p className="mt-4">
                    <strong>Free Method of Entry:</strong> Completing the online entry form is free. Standard
                    internet access and data charges may apply depending on your service provider.
                  </p>
                </div>
              </section>

              {/* Section 5: Referral Mechanic */}
              <section id="referral-mechanic" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">5. Referral Mechanic</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    <strong>How Referrals Work:</strong> After submitting your entry and verifying your email,
                    you will receive a unique referral code and referral link. You may share this code/link with
                    friends and family.
                  </p>
                  <p className="mt-4">
                    <strong>Referral Entry Process:</strong> When a friend enters the Contest using your referral
                    code or link, they must:
                  </p>
                  <ul className="mt-4">
                    <li>Complete the entry form with their own unique information</li>
                    <li>Enter your referral code in the &quot;Referral Code&quot; field, OR</li>
                    <li>Use your unique referral link which pre-fills the code</li>
                    <li>Verify their email address via the verification link</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Referral Validation:</strong> A referral is considered &quot;validated&quot; only when BOTH:
                  </p>
                  <ol className="mt-4">
                    <li>The original entrant (referrer) has verified their email</li>
                    <li>The referred friend (referee) has verified their email</li>
                  </ol>
                  <p className="mt-4 rounded-lg bg-blue-50 p-4 border-l-4 border-blue-400">
                    <strong className="text-blue-900">Multiple Entry Bonus:</strong> Each validated referral earns you
                    an additional entry into Grand Prize #2 (Referral Pool). There is no limit to the number of bonus
                    entries you can earn - the more friends who enter using your code, the more chances you have to win!
                  </p>
                  <p className="mt-4">
                    Only validated referrals count toward eligibility and bonus entries for Grand Prize #2 (Referral Pool).
                    Each successfully validated referral = one additional entry.
                  </p>
                  <p className="mt-4">
                    <strong>Referral Restrictions:</strong>
                  </p>
                  <ul className="mt-4">
                    <li>Self-referrals are prohibited and will be disqualified</li>
                    <li>Each referee must have a unique, valid email address</li>
                    <li>Referrals from the same IP address may be flagged for review</li>
                    <li>Spam, fraudulent, or automated referrals will result in disqualification</li>
                    <li>You may refer unlimited people, but each referee can only be referred once</li>
                  </ul>
                </div>
              </section>

              {/* Section 6: Prizes */}
              <section id="prizes" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">6. Prizes</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    There are TWO (2) Grand Prizes available each Contest Period:
                  </p>

                  <div className="mt-6 rounded-lg bg-kubota-orange/5 p-6">
                    <h3 className="text-xl font-bold text-kubota-orange">Grand Prize #1 (All Entries Pool)</h3>
                    <p className="mt-2">
                      <strong>Prize:</strong> One (1) voucher valid for four (4) hours of Kubota SVL-75 Compact
                      Track Loader rental with professional operator service.
                    </p>
                    <p className="mt-2">
                      <strong>Approximate Retail Value (ARV):</strong> CAD $600
                    </p>
                    <p className="mt-2">
                      <strong>Eligibility Pool:</strong> All verified entries received during the Contest Period.
                    </p>
                  </div>

                  <div className="mt-6 rounded-lg bg-kubota-orange/5 p-6">
                    <h3 className="text-xl font-bold text-kubota-orange">Grand Prize #2 (Referral Pool)</h3>
                    <p className="mt-2">
                      <strong>Prize:</strong> One (1) voucher valid for four (4) hours of Kubota SVL-75 Compact
                      Track Loader rental with professional operator service.
                    </p>
                    <p className="mt-2">
                      <strong>Approximate Retail Value (ARV):</strong> CAD $600
                    </p>
                    <p className="mt-2">
                      <strong>Eligibility Pool:</strong> All verified entrants who either:
                    </p>
                    <ul className="mt-2">
                      <li>Successfully referred at least one (1) person who completed and verified their entry, OR</li>
                      <li>Were referred by someone and completed and verified their entry</li>
                    </ul>
                    <p className="mt-2 text-sm italic">
                      Note: Both the referrer and referee must have verified emails for the referral to count
                      toward Grand Prize #2 eligibility.
                    </p>
                    <p className="mt-4 rounded-lg bg-green-50 p-4 border-l-4 border-green-400">
                      <strong className="text-green-900">Bonus Entries:</strong> Each validated referral earns you an
                      additional entry into the Grand Prize #2 drawing. For example, if you refer 5 friends who all verify
                      their emails, you receive 5 additional entries (plus your original entry). More referrals = more chances to win!
                    </p>
                  </div>

                  <p className="mt-6">
                    <strong>Total ARV of All Prizes:</strong> CAD $1,200 per month (two prizes at CAD $600 each)
                  </p>

                  <p className="mt-4 rounded-lg bg-yellow-50 p-4 border-l-4 border-yellow-400">
                    <strong className="text-yellow-900">Total Monthly Prizes:</strong> $1,200 in total prizes awarded each month - with two separate winners each receiving a $600 machine + operator package valued at 4 hours of professional equipment service.
                  </p>

                  <p className="mt-4">
                    <strong>Prize Details:</strong> Each prize includes:
                  </p>
                  <ul className="mt-4">
                    <li>Four (4) hours of equipment rental time</li>
                    <li>Kubota SVL-75 Compact Track Loader</li>
                    <li>Professional certified operator</li>
                    <li>Standard equipment usage within Sponsor&apos;s service area</li>
                  </ul>

                  <p className="mt-4">
                    <strong>NOT Included:</strong>
                  </p>
                  <ul className="mt-4">
                    <li>Distance overage fees for locations beyond 30km from Sponsor&apos;s shop (CAD $3.00 per kilometer round-trip for additional distance)</li>
                    <li>Fuel costs</li>
                    <li>Permits or licenses required for work</li>
                    <li>Materials or supplies</li>
                    <li>Additional hours beyond the awarded 4 hours</li>
                    <li>Attachments or accessories beyond standard equipment</li>
                  </ul>
                </div>
              </section>

              {/* Section 7: Winner Selection */}
              <section id="winner-selection" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">7. Winner Selection</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    Winners will be selected in a random drawing conducted within seven (7) business days
                    following the end of each Contest Period.
                  </p>
                  <p className="mt-4">
                    <strong>Drawing Process:</strong>
                  </p>
                  <ol className="mt-4">
                    <li>
                      <strong>Grand Prize #1:</strong> One (1) winner will be randomly selected from all
                      verified entries received during the Contest Period.
                    </li>
                    <li className="mt-2">
                      <strong>Grand Prize #2:</strong> After Grand Prize #1 is awarded, one (1) winner will
                      be randomly selected from the pool of verified entrants with validated referrals (either
                      as referrer or referee).
                    </li>
                  </ol>
                  <p className="mt-4">
                    <strong>Random Selection Method:</strong> Winners will be selected using a secure cryptographic
                    random number generator. The drawing will be conducted by Sponsor or its designated representative.
                  </p>
                  <p className="mt-4">
                    <strong>Audit Trail:</strong> The Sponsor will maintain a complete audit log of all drawings,
                    including the date, time, random seed used, pool size, and winner selection.
                  </p>
                  <p className="mt-4">
                    <strong>Alternate Winners:</strong> If a potential winner cannot be contacted, does not respond
                    within the required time period, fails verification, or if the prize is returned as undeliverable,
                    an alternate winner may be selected from the remaining eligible entries.
                  </p>
                </div>
              </section>

              {/* Section 8: Odds */}
              <section id="odds" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">8. Odds of Winning</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    <strong>Grand Prize #1:</strong> The odds of winning depend on the total number of eligible,
                    verified entries received during the Contest Period.
                  </p>
                  <p className="mt-4">
                    <strong>Grand Prize #2:</strong> The odds of winning depend on the total number of eligible,
                    verified entrants with validated referrals during the Contest Period.
                  </p>
                  <p className="mt-4">
                    <strong>Example:</strong> If there are 500 verified entries and 100 of those have validated
                    referrals:
                  </p>
                  <ul className="mt-4">
                    <li>Grand Prize #1 odds: 1 in 500</li>
                    <li>Grand Prize #2 odds: 1 in 100</li>
                  </ul>
                  <p className="mt-4">
                    Actual odds will vary based on the number of eligible entries received each month.
                  </p>
                </div>
              </section>

              {/* Section 9: Winner Notification */}
              <section id="winner-notification" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">9. Winner Notification</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    Potential winners will be notified by email and telephone (if provided) within seven (7)
                    business days following the winner selection drawing.
                  </p>
                  <p className="mt-4">
                    <strong>Response Requirement:</strong> Potential winners must respond to the notification
                    within five (5) business days of the first notification attempt. Failure to respond within
                    this timeframe may result in disqualification and selection of an alternate winner.
                  </p>
                  <p className="mt-4">
                    <strong>Notification Method:</strong> The Sponsor will make up to three (3) attempts to
                    contact the potential winner via:
                  </p>
                  <ul className="mt-4">
                    <li>Email (to the address provided in the entry form)</li>
                    <li>Phone call (if phone number was provided)</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Information Accuracy:</strong> It is the entrant&apos;s responsibility to provide
                    accurate, current contact information. The Sponsor is not responsible for failed delivery
                    of notifications due to incorrect or outdated contact information, spam filters, or other
                    technical issues.
                  </p>
                </div>
              </section>

              {/* Section 10: Verification */}
              <section id="verification" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">10. Verification & Disqualification</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    <strong>Verification Requirements:</strong> Before receiving a prize, potential winners must:
                  </p>
                  <ol className="mt-4">
                    <li>Provide valid government-issued photo identification (driver&apos;s license, passport, etc.)</li>
                    <li>Provide proof of New Brunswick residency (utility bill, lease agreement, etc.)</li>
                    <li>Sign and return a Declaration of Eligibility and Liability/Publicity Release within five (5) business days</li>
                    <li>Complete any additional verification requested by Sponsor</li>
                  </ol>
                  <p className="mt-4">
                    <strong>Service Area Verification:</strong> Winners must confirm that they have a location
                    within the Greater Saint John region of New Brunswick where the prize can be redeemed.
                    Standard service is provided within 30 kilometers from the Sponsor&apos;s shop location at no
                    additional cost. Winners located beyond the 30km radius are still eligible to receive their prize
                    but will be responsible for paying an overage fee of CAD $3.00 per kilometer for the additional
                    distance traveled (calculated as round-trip distance). Winners must agree to any applicable
                    distance fees before scheduling their prize service.
                  </p>
                  <p className="mt-4">
                    <strong>Grounds for Disqualification:</strong> Sponsor reserves the right to disqualify any
                    entrant if it determines, in its sole discretion, that such entrant:
                  </p>
                  <ul className="mt-4">
                    <li>Provided false, incomplete, or misleading information</li>
                    <li>Violated these Official Rules</li>
                    <li>Used fraudulent methods to enter or increase chances of winning</li>
                    <li>Engaged in conduct deemed harmful to the Contest or Sponsor&apos;s reputation</li>
                    <li>Submitted multiple entries using different email addresses</li>
                    <li>Used automated systems, bots, or scripts to enter</li>
                    <li>Engaged in self-referral or referral fraud</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Anti-Fraud Measures:</strong> The Sponsor employs various anti-fraud technologies
                    including IP address tracking, device fingerprinting, and email verification. Suspicious
                    entries will be flagged for manual review.
                  </p>
                </div>
              </section>

              {/* Section 11: Prize Conditions */}
              <section id="prize-conditions" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">11. Prize Conditions & Restrictions</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    <strong>Prize Acceptance:</strong> Acceptance of prize constitutes permission for Sponsor
                    to use winner&apos;s name, city of residence, and likeness for advertising and promotional
                    purposes without additional compensation, except where prohibited by law.
                  </p>
                  <p className="mt-4">
                    <strong>Prize Scheduling:</strong>
                  </p>
                  <ul className="mt-4">
                    <li>Prize must be scheduled in advance subject to Sponsor&apos;s equipment and operator availability</li>
                    <li>Minimum 48 hours advance notice required</li>
                    <li>Prize must be redeemed within six (6) months from the date of voucher issuance</li>
                    <li>Weather-dependent; rescheduling may be required for unsafe conditions</li>
                    <li>Blackout dates apply (see below)</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Blackout Dates:</strong> Prizes cannot be redeemed on the following dates:
                  </p>
                  <ul className="mt-4">
                    <li>Statutory holidays in New Brunswick</li>
                    <li>December 24-26 and December 31-January 1</li>
                    <li>Other dates at Sponsor&apos;s discretion due to equipment maintenance or unavailability</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Service Area & Distance Restrictions:</strong>
                  </p>
                  <ul className="mt-4">
                    <li>Prizes are only redeemable within the Sponsor&apos;s service area in the Greater Saint John region of New Brunswick</li>
                    <li>Entrants must be able to receive service at their location to be eligible for prize redemption</li>
                    <li>Standard service area is within 30 kilometers (km) from the Sponsor&apos;s shop location</li>
                    <li>Winners located beyond the 30km radius are still eligible but will be required to pay an overage fee of CAD $3.00 per kilometer for the additional distance traveled (calculated as round-trip distance)</li>
                    <li>Distance is measured from Sponsor&apos;s shop address to the winner&apos;s service location using the most direct accessible route</li>
                    <li>Sponsor reserves the right to determine service area eligibility and calculate distance fees</li>
                    <li>Winners must confirm their service location and agree to any applicable distance fees prior to scheduling</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Work Site Requirements:</strong>
                  </p>
                  <ul className="mt-4">
                    <li>Work site must be safe and accessible for equipment operation</li>
                    <li>Winner responsible for obtaining all necessary permits and approvals</li>
                    <li>Winner must provide accurate site information and access instructions</li>
                    <li>Sponsor reserves the right to refuse service if site is deemed unsafe</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Liability Waiver:</strong> Winner (and any property owner if different from winner)
                    must sign Sponsor&apos;s standard equipment operation waiver and liability release before
                    service begins.
                  </p>
                  <p className="mt-4">
                    <strong>No Substitution or Transfer:</strong>
                  </p>
                  <ul className="mt-4">
                    <li>Prizes cannot be transferred, assigned, or redeemed for cash</li>
                    <li>No substitutions except at Sponsor&apos;s sole discretion</li>
                    <li>If advertised prize becomes unavailable, Sponsor reserves the right to substitute a prize of equal or greater value</li>
                    <li>Prizes have no cash redemption value</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Taxes:</strong> Winner is solely responsible for all applicable federal, provincial,
                    and local taxes on prizes. Sponsor may issue tax forms as required by law.
                  </p>
                  <p className="mt-4">
                    <strong>Unclaimed Prizes:</strong> Unclaimed or forfeited prizes will not be awarded.
                  </p>
                </div>
              </section>

              {/* Section 12: Privacy */}
              <section id="privacy" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">12. Privacy & Data Collection</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    <strong>Information Collection:</strong> By entering the Contest, you consent to the
                    collection, use, and disclosure of your personal information as described in these rules
                    and in the Sponsor&apos;s Privacy Policy.
                  </p>
                  <p className="mt-4">
                    <strong>Information Collected:</strong>
                  </p>
                  <ul className="mt-4">
                    <li>Required: First name, last name, email address, postal code</li>
                    <li>Optional: Phone number, city</li>
                    <li>Automatic: IP address, device fingerprint, user agent, entry timestamp</li>
                    <li>Referral data: Referral codes and relationships between entrants</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Use of Information:</strong> Your information will be used to:
                  </p>
                  <ul className="mt-4">
                    <li>Administer the Contest and select winners</li>
                    <li>Verify eligibility and prevent fraud</li>
                    <li>Contact potential winners</li>
                    <li>Fulfill prizes</li>
                    <li>Comply with legal obligations</li>
                    <li>Send promotional emails (if you opted in)</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Marketing Communications:</strong> During entry, you may opt-in to receive marketing
                    communications from Sponsor. This is optional and not required to enter or win. You may
                    unsubscribe at any time.
                  </p>
                  <p className="mt-4">
                    <strong>Data Retention:</strong> Entry information will be retained for the duration of the
                    Contest Period plus one (1) year for record-keeping purposes, or as required by law.
                  </p>
                  <p className="mt-4">
                    <strong>Data Security:</strong> Sponsor implements reasonable security measures to protect
                    your personal information. However, no internet transmission is 100% secure, and Sponsor
                    cannot guarantee absolute security.
                  </p>
                  <p className="mt-4">
                    <strong>Privacy Policy:</strong> For more information about how Sponsor collects, uses, and
                    protects your personal information, please see our{' '}
                    <Link href="/privacy" className="text-kubota-orange hover:underline">
                      Privacy Policy
                    </Link>.
                  </p>
                </div>
              </section>

              {/* Section 13: Publicity */}
              <section id="publicity" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">13. Publicity Rights</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    Except where prohibited by law, acceptance of a prize constitutes permission for Sponsor
                    and its designees to use winner&apos;s name, city of residence, photograph, likeness,
                    statements, and biographical information for advertising and promotional purposes in any
                    media now or hereafter known throughout the world in perpetuity, without additional review,
                    approval, notification, or compensation.
                  </p>
                  <p className="mt-4">
                    Winners may be asked to participate in promotional activities including:
                  </p>
                  <ul className="mt-4">
                    <li>Photos or videos during prize fulfillment</li>
                    <li>Social media posts and announcements</li>
                    <li>Website testimonials</li>
                    <li>Press releases or news articles</li>
                  </ul>
                  <p className="mt-4">
                    Participation in promotional activities is voluntary but may be requested as a condition
                    of accepting the prize.
                  </p>
                </div>
              </section>

              {/* Section 14: Liability */}
              <section id="liability" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">14. Limitation of Liability</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    <strong>Release:</strong> By entering, you agree to release, discharge, and hold harmless
                    the Sponsor, its affiliates, subsidiaries, and their respective officers, directors,
                    employees, and agents (collectively, &quot;Released Parties&quot;) from any and all liability,
                    loss, or damage incurred with respect to your participation in the Contest or the awarding,
                    receipt, possession, use, or misuse of any prize, including:
                  </p>
                  <ul className="mt-4">
                    <li>Personal injury, death, or property damage</li>
                    <li>Errors in the operation or transmission of entries</li>
                    <li>Technical failures of any kind</li>
                    <li>Unauthorized human intervention in the Contest</li>
                    <li>Incorrect or inaccurate capture of entry information</li>
                    <li>Failed, incomplete, or delayed electronic transmissions</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Equipment Operation:</strong> The prize includes operation of heavy equipment by
                    a certified operator. Winner acknowledges that equipment operation involves inherent risks
                    and agrees to comply with all safety instructions and requirements. Winner assumes all
                    responsibility for conditions at the work site and agrees to indemnify Sponsor for any
                    claims arising from site conditions.
                  </p>
                  <p className="mt-4">
                    <strong>No Warranty:</strong> Prizes are awarded &quot;AS IS&quot; without any warranty or guarantee,
                    either express or implied by Sponsor.
                  </p>
                  <p className="mt-4">
                    <strong>Force Majeure:</strong> Sponsor is not responsible for and may cancel, suspend, or
                    modify the Contest if fraud, technical failures, or any other factor beyond Sponsor&apos;s
                    reasonable control impairs the integrity or proper functioning of the Contest, as determined
                    by Sponsor in its sole discretion.
                  </p>
                  <p className="mt-4">
                    <strong>Limitation of Damages:</strong> In no event will Released Parties be liable for any
                    indirect, incidental, consequential, punitive, or special damages arising from the Contest
                    or any prize, even if advised of the possibility of such damages. Some jurisdictions do not
                    allow limitation of liability for incidental or consequential damages, so this limitation
                    may not apply to you.
                  </p>
                </div>
              </section>

              {/* Section 15: Disputes */}
              <section id="disputes" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">15. Disputes & Governing Law</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    <strong>Governing Law:</strong> This Contest and these Official Rules are governed by and
                    construed in accordance with the laws of the Province of New Brunswick and the federal laws
                    of Canada applicable therein, without regard to conflict of law principles.
                  </p>
                  <p className="mt-4">
                    <strong>Jurisdiction:</strong> By entering, you consent to the exclusive jurisdiction of the
                    courts of New Brunswick for any disputes arising out of or relating to the Contest or these
                    Official Rules.
                  </p>
                  <p className="mt-4">
                    <strong>Disputes:</strong> Except where prohibited, you agree that any and all disputes,
                    claims, and causes of action arising out of or connected with the Contest or any prize
                    awarded shall be resolved individually, without resort to any form of class action.
                  </p>
                  <p className="mt-4">
                    <strong>Sponsor&apos;s Decisions Final:</strong> All decisions made by Sponsor regarding the
                    interpretation of these Official Rules, eligibility, winner selection, and all other aspects
                    of the Contest are final and binding.
                  </p>
                </div>
              </section>

              {/* Section 16: General */}
              <section id="general" className="mb-12">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">16. General Conditions</h2>
                <div className="prose prose-slate max-w-none">
                  <p>
                    <strong>Official Rules:</strong> These Official Rules are available at{' '}
                    <a href="https://udigit.ca/contest/rules" className="text-kubota-orange hover:underline">
                      udigit.ca/contest/rules
                    </a>
                    .
                  </p>
                  <p className="mt-4">
                    <strong>Modifications:</strong> Sponsor reserves the right to modify, suspend, or terminate
                    the Contest, in whole or in part, if fraud, technical failures, or any other factor beyond
                    Sponsor&apos;s reasonable control impairs the integrity or proper functioning of the Contest.
                    In the event of modification, suspension, or termination, Sponsor will post notice on the
                    Contest website.
                  </p>
                  <p className="mt-4">
                    <strong>Winner List:</strong> For the names of winners, send a self-addressed, stamped
                    envelope to: U-Dig It Rentals Inc., Attn: Contest Winners, Saint John, NB, within sixty
                    (60) days after the end of the Contest Period.
                  </p>
                  <p className="mt-4">
                    <strong>Severability:</strong> If any provision of these Official Rules is found to be
                    invalid or unenforceable, that provision will be enforced to the maximum extent permissible
                    and the remainder of these Official Rules will remain in full force and effect.
                  </p>
                  <p className="mt-4">
                    <strong>Waiver:</strong> Sponsor&apos;s failure to enforce any term of these Official Rules
                    shall not constitute a waiver of that provision.
                  </p>
                  <p className="mt-4">
                    <strong>No Sponsor Affiliation:</strong> This promotion is in no way sponsored, endorsed,
                    administered by, or associated with Meta Platforms, Inc. (Facebook), Google, Twitter/X,
                    or any other social media platform. Entrants understand that they are providing information
                    to Sponsor and not to any social media platform. Any questions, comments, or complaints
                    regarding the Contest should be directed to Sponsor, not to any social media platform.
                  </p>
                  <p className="mt-4">
                    <strong>Internet/Technical Issues:</strong> Sponsor is not responsible for lost, late,
                    incomplete, damaged, misdirected, or illegible entries; or for any technical, network,
                    telephone equipment, electronic, computer, hardware or software malfunctions of any kind,
                    or inaccurate transmission of entries. Proof of sending or submitting an entry does not
                    constitute proof of receipt by Sponsor.
                  </p>
                </div>
              </section>

              {/* Contact Section */}
              <div className="mt-12 rounded-lg border-2 border-kubota-orange bg-kubota-orange/5 p-8">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">Questions?</h2>
                <p className="text-slate-700">
                  If you have any questions about these Official Rules or the Contest, please contact us:
                </p>
                <div className="mt-4 space-y-2">
                  <p><strong>Email:</strong>{' '}
                    <a href="mailto:info@udigit.ca" className="text-kubota-orange hover:underline">
                      info@udigit.ca
                    </a>
                  </p>
                  <p><strong>Phone:</strong>{' '}
                    <a href="tel:+15066431575" className="text-kubota-orange hover:underline">
                      (506) 643-1575
                    </a>
                  </p>
                  <p><strong>Hours:</strong> Monday-Saturday, 7:00 AM - 6:00 PM AT</p>
                </div>
              </div>

              {/* Back to Contest CTA */}
              <div className="mt-12 text-center">
                <Link
                  href="/contest"
                  className="inline-flex items-center gap-2 rounded-full bg-[#A90F0F] px-8 py-4 font-bold text-white shadow-lg shadow-[#A90F0F]/30 transition-all hover:scale-105 hover:bg-yellow-500 hover:shadow-xl hover:shadow-yellow-500/30"
                >
                  Enter the Contest Now
                </Link>
                <p className="mt-4 text-sm text-slate-600">
                  By entering, you agree to these Official Rules
                </p>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
