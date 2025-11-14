'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function SpinToWinTermsPage() {
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
                  PROMOTION TERMS
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                🎰 Spin to Win
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Terms & Conditions
                </span>
              </h1>
              <p className="mx-auto mb-4 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Official terms, conditions, and prize probabilities for first-time renters.
              </p>
              <p className="text-sm text-gray-400">Effective Date: November 1, 2025 | Last Updated: November 1, 2025</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  Book Equipment Now
                </Link>
                <Link
                  href="/dashboard"
                  className="transform rounded-lg border-2 border-white bg-white/10 px-8 py-4 text-lg font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-gray-900"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Premium Gold Bottom Border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Quick Summary Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-green-500">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">✨</span>
            Quick Summary
          </h2>
          <div className="space-y-2 text-gray-700">
            <p className="flex items-start">
              <span className="text-green-600 mr-2 mt-1">✓</span>
              <span><strong>Everyone wins on their 3rd spin</strong> — guaranteed discount of $50, $75, or $100</span>
            </p>
            <p className="flex items-start">
              <span className="text-green-600 mr-2 mt-1">✓</span>
              <span><strong>One prize per customer</strong> — first-time renters only</span>
            </p>
            <p className="flex items-start">
              <span className="text-green-600 mr-2 mt-1">✓</span>
              <span><strong>48-hour validity</strong> — use your code within 2 days of winning</span>
            </p>
            <p className="flex items-start">
              <span className="text-green-600 mr-2 mt-1">✓</span>
              <span><strong>No purchase required to play</strong> — but discount only valid on first booking</span>
            </p>
            <p className="flex items-start">
              <span className="text-green-600 mr-2 mt-1">✓</span>
              <span><strong>Fully transparent</strong> — see exact win probabilities below</span>
            </p>
          </div>
        </div>

        {/* Prize Probabilities Section */}
        <section className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">📊</span>
            Prize Probabilities
          </h2>

          <p className="text-gray-700 mb-6 leading-relaxed">
            We believe in complete transparency. Here are the <strong>exact mathematical probabilities</strong> for each prize tier on your <strong>3rd and final spin</strong> (spins 1 and 2 always result in "Try Again"):
          </p>

          <div className="space-y-4 mb-6">
            {/* $50 Prize */}
            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold text-green-800">🥇 Gold Tier — $50 Off</h3>
                  <p className="text-sm text-green-700">Your unique code revealed upon winning</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">55%</div>
                  <div className="text-xs text-green-600">probability</div>
                </div>
              </div>
              <div className="mt-3 bg-white rounded p-3">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Mathematical Odds</span>
                  <span className="font-semibold">55 out of 100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '55%' }}></div>
                </div>
              </div>
            </div>

            {/* $75 Prize */}
            <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold text-orange-800">🥈 Super Tier — $75 Off</h3>
                  <p className="text-sm text-orange-700">Your unique code revealed upon winning</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-600">30%</div>
                  <div className="text-xs text-orange-600">probability</div>
                </div>
              </div>
              <div className="mt-3 bg-white rounded p-3">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Mathematical Odds</span>
                  <span className="font-semibold">30 out of 100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-orange-500 h-3 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>

            {/* $100 Prize */}
            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold text-red-800">🥉 Jackpot — $100 Off!</h3>
                  <p className="text-sm text-red-700">Your unique code revealed upon winning</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-600">15%</div>
                  <div className="text-xs text-red-600">probability</div>
                </div>
              </div>
              <div className="mt-3 bg-white rounded p-3">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Mathematical Odds</span>
                  <span className="font-semibold">15 out of 100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-red-500 h-3 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 leading-relaxed">
              <strong>🔐 Fairness Guarantee:</strong> Prize selection uses cryptographically secure random number generation
              (Node.js crypto.randomBytes) executed server-side. Client-side manipulation is impossible. Each spin outcome
              is logged with timestamp, IP address, and device fingerprint for audit trail purposes.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🎯</span>
            How It Works
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">1</span>
                Access the Game
              </h3>
              <p className="text-gray-700 ml-11 leading-relaxed">
                First-time customers see the "Spin to Win" offer on their dashboard upon login or signup.
                Click "Claim Offer" to open the game modal and start your chance to win.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">2</span>
                Three Spins Allowed
              </h3>
              <p className="text-gray-700 ml-11 leading-relaxed">
                You get <strong>3 attempts</strong> to win a discount. Spins 1 and 2 will result in "Try Again" to build anticipation.
                Spin 3 is <strong>guaranteed to win</strong> a discount of $50, $75, or $100 based on the probabilities listed above.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">3</span>
                Receive Your Code
              </h3>
              <p className="text-gray-700 ml-11 leading-relaxed">
                Once you win, your <strong>unique discount code is revealed and displayed on screen</strong>, automatically saved to your account.
                You can copy it to your clipboard with one click. The code format varies by prize tier (Gold, Super, or Jackpot) and is only shown to winners.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">4</span>
                Use Within 48 Hours
              </h3>
              <p className="text-gray-700 ml-11 leading-relaxed">
                Your discount code expires <strong>48 hours after you win it</strong>. A countdown timer shows exactly how much time you have left.
                Apply the code during checkout on your first booking to save instantly.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">5</span>
                Complete Your Booking
              </h3>
              <p className="text-gray-700 ml-11 leading-relaxed">
                Enter your discount code at checkout when booking the Kubota SVL-75. The discount applies immediately to your rental subtotal,
                and you'll see the savings reflected in your final total.
              </p>
            </div>
          </div>
        </section>

        {/* Eligibility Requirements */}
        <section className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">✅</span>
            Eligibility Requirements
          </h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-green-100 rounded-full p-2 mr-4 mt-1 flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">First-Time Customers Only</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  This promotion is exclusively for customers who have <strong>never completed a booking</strong> with U-Dig It Rentals.
                  Customers with previous completed bookings are not eligible.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-green-100 rounded-full p-2 mr-4 mt-1 flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Valid Account Required</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  You must have a registered U-Dig It Rentals account with a verified email address.
                  Guest spins are allowed but require email capture before prize claim.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-green-100 rounded-full p-2 mr-4 mt-1 flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">One Prize Per Customer</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Limit of <strong>one prize per customer, ever</strong>. Multiple accounts, devices, or attempts to circumvent this limit
                  will result in disqualification and code deactivation.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-green-100 rounded-full p-2 mr-4 mt-1 flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">First Booking Application</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Discount codes are <strong>only valid on your first booking</strong>. Subsequent bookings cannot use Spin to Win codes,
                  even if you won multiple times through separate accounts (which is prohibited).
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-green-100 rounded-full p-2 mr-4 mt-1 flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Saint John, NB Service Area</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Promotion valid only for equipment rentals within our service area (Saint John, Rothesay, Quispamsis, Grand Bay-Westfield, Hampton, and surrounding areas within 100km).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Code Redemption Rules */}
        <section className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🎫</span>
            Code Redemption Rules
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">⏰ Expiration Period</h3>
              <p className="text-gray-700 leading-relaxed">
                All Spin to Win discount codes expire <strong>48 hours (2 days) from the time you win</strong>.
                A real-time countdown timer displays in the win modal. Expired codes cannot be extended or reactivated under any circumstances.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 Discount Application</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Your discount applies to the <strong>rental subtotal</strong> (equipment + delivery + optional damage waiver)
                <strong>before taxes</strong>. HST (15%) is calculated on the discounted amount.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Equipment Rental:</span>
                    <span>$900.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery & Pickup:</span>
                    <span>$300.00</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-gray-300 pt-1 mt-1">
                    <span>Subtotal:</span>
                    <span>$1,200.00</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount (Jackpot Tier $100):</span>
                    <span>-$100.00</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                    <span>Subtotal After Discount:</span>
                    <span>$1,100.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HST (15%):</span>
                    <span>$165.00</span>
                  </div>
                  <div className="flex justify-between font-bold border-t-2 border-gray-400 pt-1 mt-1 text-lg">
                    <span>Total:</span>
                    <span>$1,265.00</span>
                  </div>
                  <div className="flex justify-between text-blue-600 text-xs mt-2">
                    <span>🎉 You Saved:</span>
                    <span className="font-semibold">$115.00 (including tax savings!)</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🚫 Non-Transferable</h3>
              <p className="text-gray-700 leading-relaxed">
                Discount codes are <strong>strictly non-transferable</strong>. The code is tied to the account that won it
                and can only be redeemed by that specific user. Sharing codes, selling codes, or attempting to use someone else's
                code will result in automatic rejection and potential account suspension.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔒 One-Time Use Only</h3>
              <p className="text-gray-700 leading-relaxed">
                Each discount code can be used <strong>exactly once</strong>. Once applied to a booking, the code is immediately deactivated
                and cannot be reused, even if the booking is subsequently cancelled.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">💵 No Cash Value</h3>
              <p className="text-gray-700 leading-relaxed">
                Discount codes have <strong>no cash value</strong> and cannot be exchanged for cash, credit, or refunds.
                Unused or expired codes have zero monetary value.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">📱 Cannot Be Combined</h3>
              <p className="text-gray-700 leading-relaxed">
                Spin to Win codes <strong>cannot be combined</strong> with any other promotional offers, discounts, or coupon codes.
                Only one discount code per booking is allowed.
              </p>
            </div>
          </div>
        </section>

        {/* Fraud Prevention */}
        <section className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🛡️</span>
            Fraud Prevention & Fair Play
          </h2>

          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              To ensure fair play for all customers, we implement the following security measures:
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Detection Systems
              </h3>
              <ul className="space-y-2 text-sm text-yellow-900">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Device Fingerprinting:</strong> We track device signatures to detect multiple account abuse</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>IP Address Monitoring:</strong> Suspicious IP patterns trigger manual review</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Email Verification:</strong> All accounts must verify email before code redemption</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Booking History Check:</strong> System automatically validates first-time customer status</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Session Token Validation:</strong> Each spin session is cryptographically signed and verified</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Prohibited Activities
              </h3>
              <ul className="space-y-2 text-sm text-red-900">
                <li className="flex items-start">
                  <span className="mr-2">❌</span>
                  <span>Creating multiple accounts to win multiple prizes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">❌</span>
                  <span>Using VPNs, proxies, or other tools to mask identity</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">❌</span>
                  <span>Sharing, selling, or transferring discount codes to other users</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">❌</span>
                  <span>Automated scripts, bots, or tools to manipulate the game</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">❌</span>
                  <span>Attempting to reverse-engineer or manipulate client-side code</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-800 leading-relaxed">
                <strong>⚖️ Enforcement:</strong> Violations of these terms will result in immediate disqualification,
                code deactivation, account suspension, and potential legal action for fraud. U-Dig It Rentals reserves
                the right to refuse service to anyone violating these terms.
              </p>
            </div>
          </div>
        </section>

        {/* Important Disclaimers */}
        <section className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">⚠️</span>
            Important Disclaimers
          </h2>

          <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📅 Promotion Period</h3>
              <p>
                This promotion is ongoing but may be modified or terminated at any time at U-Dig It Rentals' sole discretion.
                Active codes will be honored through their expiration date even if the promotion ends.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🏗️ Equipment Availability</h3>
              <p>
                Winning a discount code does <strong>not guarantee equipment availability</strong> for your desired rental dates.
                Equipment is subject to availability and must be booked through our standard reservation system.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">💳 Insurance Still Required</h3>
              <p>
                All standard rental requirements apply, including Certificate of Insurance ($2M CGL, $120K equipment coverage),
                valid driver's license, and security deposit ($500 refundable hold placed 48 hours before pickup).
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📄 Booking Terms Apply</h3>
              <p>
                By using a Spin to Win discount code, you agree to all standard U-Dig It Rentals
                <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline ml-1">Terms of Service</Link>,
                including cancellation policies, damage liability, and rental agreements.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🔄 Modifications & Cancellations</h3>
              <p>
                U-Dig It Rentals reserves the right to modify these terms, adjust prize probabilities, or cancel the
                promotion at any time without prior notice. Material changes will be posted on this page with an updated "Last Modified" date.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">⚖️ Governing Law</h3>
              <p>
                These terms are governed by the laws of New Brunswick, Canada. Any disputes arising from this promotion
                shall be resolved in the courts of New Brunswick.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy & Data Usage */}
        <section className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🔐</span>
            Privacy & Data Usage
          </h2>

          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              When you participate in Spin to Win, we collect and process the following information:
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">📊 Data We Collect</h3>
              <ul className="space-y-2 text-sm text-blue-900">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Account Information:</strong> Email address, name, phone number (if provided)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Session Data:</strong> Spin outcomes, timestamps, session tokens</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Device Information:</strong> IP address, user agent, device fingerprint hash</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Prize Information:</strong> Code awarded, prize amount, expiration date</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Redemption Data:</strong> Booking ID when code is used, redemption timestamp</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">✅ How We Use This Data</h3>
              <ul className="space-y-2 text-sm text-green-900">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Verify eligibility and prevent fraud/abuse</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Track prize distribution and ensure fair probability compliance</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Send email notifications about your prize and expiration reminders</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Analyze promotion performance and optimize user experience</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Comply with legal requirements and maintain audit trails</span>
                </li>
              </ul>
            </div>

            <p className="text-sm">
              For complete privacy details, see our
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline ml-1">Privacy Policy</Link>.
              We never sell your data and use it only for the purposes stated above.
            </p>
          </div>
        </section>

        {/* Technical Details */}
        <section className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">⚙️</span>
            Technical Details
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🎲 Random Number Generation</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Prize selection uses <strong>Node.js crypto.randomBytes()</strong>, a cryptographically secure pseudorandom number generator (CSPRNG)
                that meets NIST SP 800-90A standards. This ensures truly random outcomes that cannot be predicted or manipulated.
              </p>
              <div className="bg-gray-100 rounded p-3 font-mono text-xs">
                <code className="text-gray-800">
                  {`const randomBytes = crypto.randomBytes(4);`}<br/>
                  {`const randomValue = randomBytes.readUInt32BE(0) / 0xFFFFFFFF;`}<br/>
                  {`// Normalized to [0, 1] for probability distribution`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔒 Server-Side Execution</h3>
              <p className="text-gray-700 leading-relaxed">
                <strong>100% of game logic runs on our servers.</strong> The client (your browser) only displays the visual wheel animation.
                Prize outcomes are determined server-side and sent to your browser after verification. This prevents any client-side hacking or manipulation.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">📝 Audit Trail</h3>
              <p className="text-gray-700 leading-relaxed">
                Every spin session is logged with:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 ml-4">
                <li>• Session ID and creation timestamp</li>
                <li>• All 3 spin outcomes with timestamps</li>
                <li>• Prize awarded (if any) and expiration date</li>
                <li>• Device fingerprint hash and IP address</li>
                <li>• Code redemption details (booking ID, timestamp)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                This audit trail ensures accountability and allows us to investigate any disputes or suspicious activity.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">❓</span>
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Q: Is everyone guaranteed to win?</h3>
              <p className="text-gray-700">
                <strong>Yes!</strong> Your 3rd spin is guaranteed to win a discount of either $50, $75, or $100.
                Spins 1 and 2 always result in "Try Again" to build excitement.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Q: Can I spin again if I don't like my prize?</h3>
              <p className="text-gray-700">
                <strong>No.</strong> Once you complete your 3 spins and receive a prize, your session is permanently completed.
                You cannot spin again or exchange your prize for a different one.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Q: What if my code expires before I'm ready to book?</h3>
              <p className="text-gray-700">
                <strong>Expired codes cannot be reactivated.</strong> The 48-hour window is firm and starts immediately when you win.
                We recommend only playing Spin to Win when you're ready to book within 2 days.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Q: Can I share my code with a friend or family member?</h3>
              <p className="text-gray-700">
                <strong>No.</strong> Codes are strictly non-transferable and tied to your account. Attempting to share codes will result in automatic rejection and potential account suspension.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Q: What if I forget to use my code before it expires?</h3>
              <p className="text-gray-700">
                <strong>Unfortunately, we cannot extend or reissue expired codes.</strong> The 48-hour expiration is automated and cannot be overridden.
                We send email reminders 24 hours and 1 hour before expiration to help you remember.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Q: Does the discount apply to the security deposit?</h3>
              <p className="text-gray-700">
                <strong>No.</strong> The $500 security deposit (hold) is separate from your rental charges. Your discount applies only to
                the rental invoice (equipment + delivery + optional waiver). The security deposit is fully refundable when you return the equipment clean, refueled, and in good condition.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Q: Can I use my Spin to Win code with other promotions?</h3>
              <p className="text-gray-700">
                <strong>No.</strong> Spin to Win codes cannot be combined with any other promotional offers, seasonal discounts, or coupon codes.
                Only one discount per booking is allowed.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Q: Are the probabilities really accurate?</h3>
              <p className="text-gray-700">
                <strong>Absolutely.</strong> We use cryptographically secure random number generation with mathematically verified probability distribution.
                Over time, prize distribution will match the stated probabilities (55% $50, 30% $75, 15% $100) within statistical variance.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Q: What happens if there's a technical error during my spin?</h3>
              <p className="text-gray-700">
                If a technical error prevents your spin from completing, please contact our support team at
                <a href="tel:+15066431575" className="text-blue-600 hover:text-blue-700 underline ml-1">(506) 643-1575</a> or
                <a href="mailto:info@udigit.ca" className="text-blue-600 hover:text-blue-700 underline ml-1">info@udigit.ca</a>.
                We'll manually review your session logs and issue your prize or reset your spin attempt as appropriate.
              </p>
            </div>
          </div>
        </section>

        {/* Contact & Support */}
        <section className="bg-gradient-to-r from-[#E1BC56] to-[#D4A843] rounded-xl shadow-lg p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-4 flex items-center">
            <span className="text-3xl mr-3">📞</span>
            Questions or Issues?
          </h2>
          <p className="text-white/90 mb-6 leading-relaxed">
            If you have any questions about the Spin to Win promotion, encounter technical issues, or need assistance redeeming your prize,
            our team is here to help!
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="tel:+15066431575"
              className="bg-white text-gray-900 rounded-lg p-4 flex items-center hover:shadow-lg transition-shadow"
            >
              <svg className="w-6 h-6 text-[#A90F0F] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <div className="font-semibold">Call Us</div>
                <div className="text-sm text-gray-600">(506) 643-1575</div>
              </div>
            </a>
            <a
              href="mailto:info@udigit.ca"
              className="bg-white text-gray-900 rounded-lg p-4 flex items-center hover:shadow-lg transition-shadow"
            >
              <svg className="w-6 h-6 text-[#A90F0F] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-semibold">Email Us</div>
                <div className="text-sm text-gray-600">info@udigit.ca</div>
              </div>
            </a>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="text-center mt-12 pb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#A90F0F] hover:bg-[#8a0c0c] text-white font-semibold rounded-lg transition-colors shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>

      <Footer />
    </div>
    </>
  );
}
