'use client';

import { useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

import { logger } from '@/lib/logger';

export default function ContestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postalCode: '',
    city: '',
    referralCode: '',
    marketingConsent: false,
    rulesAccepted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [referralInfo, setReferralInfo] = useState({ code: '', link: '' });
  const [error, setError] = useState('');

  // Check for referral code in URL
  useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        setFormData((prev: unknown) => ({ ...prev, referralCode: refCode.toUpperCase() }));
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.rulesAccepted) {
      setError('You must accept the contest rules to enter');
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.postalCode) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call Edge Function
      const response = await fetch('/api/contest/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deviceFingerprint: await getDeviceFingerprint(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit entry');
        setIsSubmitting(false);
        return;
      }

      // Show success modal with referral info
      setReferralInfo({
        code: data.referralCode,
        link: data.referralLink,
      });
      setShowSuccess(true);

      logger.info('Contest entry submitted', {
        component: 'contest-page',
        action: 'entry_submitted',
        metadata: { email: formData.email },
      });
    } catch (err: unknown) {
      setError('Something went wrong. Please try again.');
      logger.error(
        'Contest entry error',
        {
          component: 'contest-page',
          action: 'entry_error',
        },
        err
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralInfo.link);
    alert('Referral link copied to clipboard!');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralInfo.link)}`;
    window.open(url, '_blank', 'width=600,height=400');
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

        {/* Hero Section - Premium Contest Theme */}
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

          {/* Multiple Logo Watermarks - Contest Theme - Responsive */}
          <div className="pointer-events-none absolute inset-0">
            {/* Desktop Watermarks - Original (hidden on mobile) */}
            <div className="hidden md:block">
              <div className="absolute left-12 top-8 rotate-[8deg] opacity-10">
                <div className="relative h-56 w-56">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals Contest - Win Free Equipment Rental"
                    fill
                    className="object-contain"
                    sizes="56px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute right-16 top-12 rotate-[-10deg] opacity-10">
                <div className="relative h-60 w-60">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Saint John Equipment Rental Contest - Monthly Giveaway"
                    fill
                    className="object-contain"
                    sizes="60px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute left-[15%] top-[22%] rotate-[-6deg] opacity-10">
                <div className="relative h-48 w-48">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Win Kubota Equipment - Professional Rental Contest"
                    fill
                    className="object-contain"
                    sizes="48px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute right-[18%] top-[24%] rotate-[12deg] opacity-10">
                <div className="relative h-52 w-52">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Monthly Contest - Free Machine Giveaway"
                    fill
                    className="object-contain"
                    sizes="52px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute right-0 top-[45%] translate-x-[35%] rotate-[15deg] transform opacity-10">
                <div className="relative h-80 w-80">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Community Contest - U-Dig It Rentals Gives Back"
                    fill
                    className="object-contain"
                    sizes="80px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute left-0 top-[48%] -translate-x-[35%] rotate-[-12deg] transform opacity-10">
                <div className="relative h-76 w-76">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Win Equipment Rental - Saint John Contest"
                    fill
                    className="object-contain"
                    sizes="76px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute bottom-[12%] left-[20%] rotate-[4deg] opacity-10">
                <div className="relative h-44 w-44">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Free Kubota Rental Contest - U-Dig It Giveaway"
                    fill
                    className="object-contain"
                    sizes="44px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute bottom-[10%] right-[22%] rotate-[-7deg] opacity-10">
                <div className="relative h-48 w-48">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Enter to Win - Monthly Equipment Rental Contest"
                    fill
                    className="object-contain"
                    sizes="48px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute left-[30%] top-[11%] rotate-[5deg] opacity-10">
                <div className="relative h-40 w-40">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Contest Giveaway - U-Dig It Equipment Rental"
                    fill
                    className="object-contain"
                    sizes="40px"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            {/* Mobile Only - More Watermarks for better coverage */}
            <div className="md:hidden">
              <div className="absolute left-[2%] top-[3%] opacity-10">
                <div className="relative h-20 w-20">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="20px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute right-[2%] top-[5%] rotate-12 opacity-10">
                <div className="relative h-18 w-18">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="18px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute left-[20%] top-[12%] rotate-[-8deg] opacity-10">
                <div className="relative h-16 w-16">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="16px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute right-[15%] top-[15%] rotate-[10deg] opacity-10">
                <div className="relative h-14 w-14">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="14px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute left-1/2 top-[2%] -translate-x-1/2 rotate-3 opacity-10">
                <div className="relative h-16 w-16">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="16px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute left-[5%] top-1/3 -rotate-6 opacity-10">
                <div className="relative h-24 w-24">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="24px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute right-[5%] top-[45%] rotate-[8deg] opacity-10">
                <div className="relative h-24 w-24">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="24px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute left-[10%] top-[50%] rotate-[5deg] opacity-10">
                <div className="relative h-18 w-18">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="18px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute right-[12%] top-[55%] -rotate-[7deg] opacity-10">
                <div className="relative h-16 w-16">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="16px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute bottom-[8%] left-[8%] rotate-6 opacity-10">
                <div className="relative h-20 w-20">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="20px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute bottom-[3%] right-[3%] -rotate-6 opacity-10">
                <div className="relative h-22 w-22">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="22px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute bottom-[15%] left-[25%] rotate-[4deg] opacity-10">
                <div className="relative h-14 w-14">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="14px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute bottom-[12%] right-[20%] -rotate-[5deg] opacity-10">
                <div className="relative h-16 w-16">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="16px"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute bottom-[2%] left-1/3 -rotate-3 opacity-10">
                <div className="relative h-18 w-18">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="18px"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="headline-3d text-center">
              <div className="mb-6 inline-block">
                <span className="rounded-full border border-[#E1BC56]/30 bg-[#E1BC56]/20 px-6 py-2 text-sm font-semibold tracking-wide text-[#E1BC56] backdrop-blur-sm">
                  🎉 MONTHLY CONTEST
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Win 4 Hours Of
                <br />
                Professional Equipment
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  + Operator Service!
                </span>
              </h1>
              <p className="mx-auto mb-4 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Enter & Refer a Friend for <span className="font-bold text-[#E1BC56]">TWO</span>{' '}
                Chances to Win
              </p>

              {/* Total Prize Pool Banner */}
              <div className="mx-auto mb-8 max-w-2xl">
                <div className="rounded-full border-2 border-[#E1BC56] bg-gradient-to-r from-[#E1BC56]/20 via-[#F4D03F]/20 to-[#E1BC56]/20 px-8 py-3 backdrop-blur-md">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-[#E1BC56] uppercase tracking-wide">
                      Total Monthly Prize Pool
                    </div>
                    <div className="text-3xl font-black text-white md:text-4xl">
                      $1,200 in Prizes
                    </div>
                    <div className="text-xs text-gray-300 mt-1">Two winners • $600 each</div>
                  </div>
                </div>
              </div>

              {/* Prize Cards */}
              <div className="mx-auto mb-8 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-[#E1BC56]/30 bg-white/10 p-6 backdrop-blur-md">
                  <div className="mb-3 text-5xl">🏆</div>
                  <div className="text-xl font-bold text-white">Grand Prize #1</div>
                  <div className="text-sm text-gray-300">All verified entries</div>
                  <div className="mt-3 text-3xl font-black text-[#E1BC56]">$600 Value</div>
                </div>
                <div className="rounded-xl border border-[#E1BC56]/30 bg-white/10 p-6 backdrop-blur-md">
                  <div className="mb-3 text-5xl">🎁</div>
                  <div className="text-xl font-bold text-white">Grand Prize #2</div>
                  <div className="text-sm text-gray-300">Referral pool only</div>
                  <div className="mt-3 text-3xl font-black text-[#E1BC56]">$600 Value</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href="#entry-form"
                  className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  Enter Now - It's Free!
                </a>
                <a
                  href="#how-it-works"
                  className="transform rounded-lg border-2 border-white bg-white/10 px-8 py-4 text-lg font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-gray-900"
                >
                  📖 See How It Works
                </a>
              </div>
            </div>
          </div>

          {/* Premium Gold Bottom Border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        </div>

        {/* Trust Bar */}
        <div className="border-b border-gray-200 bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">2</div>
                <div className="text-sm text-gray-600">Grand Prizes</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">$600</div>
                <div className="text-sm text-gray-600">Prize Value Each</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">4 Hours</div>
                <div className="text-sm text-gray-600">Machine + Operator</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">Free</div>
                <div className="text-sm text-gray-600">No Purchase Required</div>
              </div>
            </div>
          </div>
        </div>

        {/* Entry Form Section */}
        <div id="entry-form" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl bg-white p-8 shadow-2xl">
              <h2 className="mb-2 text-3xl font-bold text-gray-900">Enter to Win</h2>
              <p className="mb-6 text-gray-600">
                Free to enter • No purchase necessary • One entry per person
              </p>

              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e: unknown) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-yellow-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e: unknown) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-yellow-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e: unknown) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-yellow-500"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e: unknown) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-yellow-500"
                    placeholder="(506) 555-1234"
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e: unknown) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-yellow-500"
                      placeholder="Saint John"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={(e: unknown) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-yellow-500"
                      placeholder="E2L 0A1"
                    />
                  </div>
                </div>

                {/* Referral Code */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.referralCode}
                    onChange={(e: unknown) =>
                      setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 uppercase focus:border-transparent focus:ring-2 focus:ring-yellow-500"
                    placeholder="Enter friend's referral code"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    If a friend referred you, enter their code here
                  </p>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      required
                      checked={formData.rulesAccepted}
                      onChange={(e: unknown) =>
                        setFormData({ ...formData, rulesAccepted: e.target.checked })
                      }
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      I agree to the{' '}
                      <a
                        href="/contest/rules"
                        target="_blank"
                        className="text-yellow-600 hover:underline"
                      >
                        contest rules
                      </a>{' '}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>

                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.marketingConsent}
                      onChange={(e: unknown) =>
                        setFormData({ ...formData, marketingConsent: e.target.checked })
                      }
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      Yes, I want to receive equipment rental offers from U-Dig It Rentals
                      (optional)
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-yellow-600 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : "Enter Now - It's Free! 🎉"}
                </button>
              </form>

              {/* Privacy Note */}
              <p className="mt-6 text-center text-xs text-gray-500">
                Your information is protected. See our{' '}
                <a href="/privacy" className="text-yellow-600 hover:underline">
                  Privacy Policy
                </a>
                . Contest runs monthly from the 1st to the last day of each month.
              </p>
            </div>

            {/* How It Works */}
            <div id="how-it-works" className="mt-12 rounded-xl bg-white p-8 shadow-2xl">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">How to Enter</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500 font-bold text-white">
                    1
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Complete the Entry Form</h3>
                    <p className="text-gray-600">
                      Fill out your details above - takes less than 2 minutes!
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500 font-bold text-white">
                    2
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Verify Your Email</h3>
                    <p className="text-gray-600">
                      Check your inbox and click the verification link
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500 font-bold text-white">
                    3
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Share Your Referral Link</h3>
                    <p className="text-gray-600">
                      Get a unique link to share with friends. Each friend who enters using your
                      code gives you an additional entry in Grand Prize #2! Plus, they get entered
                      too. More referrals = more chances to win!
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500 font-bold text-white">
                    4
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Winners Announced</h3>
                    <p className="text-gray-600">
                      Winners drawn on the last day of the month. Check your email!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Prize Details */}
            <div className="mt-12 rounded-xl border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-8 shadow-2xl">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Prize Details</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-white p-6">
                  <div className="mb-3 text-4xl">🏆</div>
                  <h3 className="mb-2 text-lg font-bold">Grand Prize #1</h3>
                  <p className="mb-2 text-gray-700">One winner from ALL verified entries</p>
                  <div className="rounded-lg bg-yellow-100 px-4 py-2">
                    <div className="font-semibold text-yellow-900">Prize Value: $600</div>
                    <div className="text-sm text-yellow-800">4-hour machine + operator</div>
                  </div>
                </div>
                <div className="rounded-lg bg-white p-6">
                  <div className="mb-3 text-4xl">🎁</div>
                  <h3 className="mb-2 text-lg font-bold">Grand Prize #2 (Referral)</h3>
                  <p className="mb-2 text-gray-700">One winner from referral-validated entries</p>
                  <div className="rounded-lg bg-yellow-100 px-4 py-2">
                    <div className="font-semibold text-yellow-900">Prize Value: $600</div>
                    <div className="text-sm text-yellow-800">4-hour machine + operator</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 rounded-lg bg-white p-4">
                <p className="text-sm text-gray-600">
                  <strong>Includes:</strong> Kubota SVL-75 Compact Track Loader with professional
                  operator for 4 hours within our service area. Winner schedules service (subject to
                  availability). Blackout dates apply. Voucher valid 6 months. Cannot be exchanged
                  for cash.
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-12 rounded-xl bg-white p-8 shadow-2xl">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <details className="group">
                  <summary className="cursor-pointer text-lg font-semibold hover:text-yellow-600">
                    Who can enter?
                  </summary>
                  <p className="ml-4 mt-2 text-gray-600">
                    New Brunswick residents, 18 years or older. Employees and immediate family of
                    U-Dig It Rentals are not eligible. See full rules for details.
                  </p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer text-lg font-semibold hover:text-yellow-600">
                    How does the referral work?
                  </summary>
                  <p className="ml-4 mt-2 text-gray-600">
                    After you verify your email, you'll get a unique referral link. Share it with
                    friends. Each friend who enters and verifies using your link earns you an
                    additional entry in Grand Prize #2! Plus, they get entered in both prize draws
                    too. The more friends you refer, the more entries you get!
                  </p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer text-lg font-semibold hover:text-yellow-600">
                    When are winners selected?
                  </summary>
                  <p className="ml-4 mt-2 text-gray-600">
                    Winners are drawn on the last day of each month. Winners will be notified by
                    email and phone within 24 hours.
                  </p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer text-lg font-semibold hover:text-yellow-600">
                    What do I win?
                  </summary>
                  <p className="ml-4 mt-2 text-gray-600">
                    A voucher for 4 hours of Kubota SVL-75 service with a professional operator
                    (value: $600). Perfect for excavation, landscaping, or construction projects.
                    Voucher valid 6 months from issue date.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-8">
            <div className="text-center">
              <div className="mb-4 text-6xl">🎉</div>
              <h2 className="mb-2 text-3xl font-bold text-gray-900">You're Almost In!</h2>
              <p className="mb-6 text-gray-600">
                Check your email and click the verification link to confirm your entry.
              </p>

              <div className="mb-6 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6">
                <h3 className="mb-3 text-lg font-bold">🎁 Want Another Chance to Win?</h3>
                <p className="mb-4 text-sm text-gray-700">
                  Share your referral link! When friends enter using your code, you BOTH get entered
                  in the Referral Grand Prize draw.
                </p>
                <div className="mb-3 rounded border border-gray-300 bg-white px-4 py-2 font-mono text-sm">
                  {referralInfo.code}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyReferralLink}
                    className="flex-1 rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
                  >
                    📋 Copy Link
                  </button>
                  <button
                    onClick={shareToFacebook}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                  >
                    📱 Share
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowSuccess(false)}
                className="text-gray-600 underline hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper: Get device fingerprint for fraud detection
async function getDeviceFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
      return canvas.toDataURL();
    }
  } catch (e) {
    // Fallback
  }
  return `${navigator.userAgent}-${screen.width}x${screen.height}`;
}
