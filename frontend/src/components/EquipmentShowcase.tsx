'use client';

import Image from 'next/image';
import Link from 'next/link';

/**
 * EquipmentShowcase - High-converting marketing component for Kubota SVL-75
 *
 * Designed to maximize bookings with:
 * - Premium gold styling matching BookingWidget
 * - Social proof and trust indicators
 * - Urgency elements
 * - Clear conversion path
 */

interface EquipmentShowcaseProps {
  className?: string;
}

export default function EquipmentShowcase({ className = '' }: EquipmentShowcaseProps) {
  return (
    <>
      <style jsx global>{`
        @keyframes continuousShine2 {
          0% {
            transform: translateX(-150%);
            opacity: 0.05;
          }
          20% {
            opacity: 0.25;
          }
          80% {
            opacity: 0.25;
          }
          100% {
            transform: translateX(150%);
            opacity: 0.05;
          }
        }

        @keyframes metalGlow {
          0% {
            opacity: 0.12;
          }
          25% {
            opacity: 0.22;
          }
          50% {
            opacity: 0.28;
          }
          75% {
            opacity: 0.22;
          }
          100% {
            opacity: 0.12;
          }
        }

        @keyframes metalGlow2 {
          0% {
            opacity: 0.08;
          }
          30% {
            opacity: 0.18;
          }
          70% {
            opacity: 0.18;
          }
          100% {
            opacity: 0.08;
          }
        }

        @keyframes subtleFlow {
          0% {
            transform: translateX(-130%) rotate(12deg);
            opacity: 0.08;
          }
          100% {
            transform: translateX(130%) rotate(12deg);
            opacity: 0.08;
          }
        }

        @keyframes subtleFlow2 {
          0% {
            transform: translateX(-140%) rotate(-8deg);
            opacity: 0.12;
          }
          100% {
            transform: translateX(140%) rotate(-8deg);
            opacity: 0.12;
          }
        }

        @keyframes twinkle1 {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.3);
          }
          3.7% {
            opacity: 0;
            transform: scale(0.3);
          }
          4.2% {
            opacity: 0.6;
            transform: scale(1);
          }
          4.6% {
            opacity: 1;
            transform: scale(1.2);
          }
          5.1% {
            opacity: 0.8;
            transform: scale(0.9);
          }
          5.6% {
            opacity: 0.4;
            transform: scale(0.6);
          }
          6.1% {
            opacity: 0;
            transform: scale(0.3);
          }
        }

        @keyframes twinkle2 {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.4);
          }
          23.7% {
            opacity: 0;
            transform: scale(0.4);
          }
          24.2% {
            opacity: 0.8;
            transform: scale(1.1);
          }
          24.6% {
            opacity: 1;
            transform: scale(1.4);
          }
          25.1% {
            opacity: 0.7;
            transform: scale(1);
          }
          25.6% {
            opacity: 0.3;
            transform: scale(0.7);
          }
          26.1% {
            opacity: 0;
            transform: scale(0.4);
          }
        }

        @keyframes twinkle3 {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.2);
          }
          43.7% {
            opacity: 0;
            transform: scale(0.2);
          }
          44.2% {
            opacity: 0.7;
            transform: scale(1.2);
          }
          44.6% {
            opacity: 1;
            transform: scale(1.6);
          }
          45.1% {
            opacity: 0.6;
            transform: scale(0.8);
          }
          45.6% {
            opacity: 0.2;
            transform: scale(0.5);
          }
          46.1% {
            opacity: 0;
            transform: scale(0.2);
          }
        }

        @keyframes twinkle4 {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.5);
          }
          63.7% {
            opacity: 0;
            transform: scale(0.5);
          }
          64.2% {
            opacity: 0.8;
            transform: scale(1);
          }
          64.6% {
            opacity: 1;
            transform: scale(1.3);
          }
          65.1% {
            opacity: 0.6;
            transform: scale(0.8);
          }
          65.6% {
            opacity: 0.3;
            transform: scale(0.6);
          }
          66.1% {
            opacity: 0;
            transform: scale(0.5);
          }
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
      <div className={className}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-6 pt-8">
            <div className="inline-flex items-center gap-2 bg-[#E1BC56]/10 px-4 py-2 rounded-full mb-3">
              <svg className="w-5 h-5 text-[#E1BC56]" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[#E1BC56] font-bold">Premium Equipment</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Kubota SVL-75 Compact Track Loader
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Professional-grade equipment with the power and versatility for any construction or
              landscaping project
            </p>
          </div>

          {/* Premium Marketing Card */}
          <div className="max-w-6xl mx-auto">
            <div
              className="bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden relative transition-all duration-300"
              style={{
                boxShadow: `
                  0 25px 50px -12px rgba(0, 0, 0, 0.25),
                  0 0 0 1px rgba(255, 255, 255, 0.05),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1),
                  0 0 0 2px rgba(0, 0, 0, 0.08),
                  0 0 0 3px rgba(255, 255, 255, 0.6),
                  0 0 0 4px rgba(0, 0, 0, 0.12)
                `,
                border: 'none',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255, 255, 255, 0.95)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}
            >
              {/* Premium Shimmer Header - Matching Book Your Equipment Style */}
              <div
                className="relative px-6 py-4 overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, #A68523 0%, #B8942A 20%, #CCA735 40%, #DDB83B 60%, #CCA735 80%, #B8942A 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'gradientShift 12s ease infinite',
                }}
              >
                {/* Continuous Shine Effect */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.25) 55%, rgba(255,255,255,0.15) 75%, transparent 100%)',
                    animation: 'continuousShine2 5.8s infinite linear',
                  }}
                />

                {/* Primary Metal Glow */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.12) 40%, transparent 70%)',
                    animation: 'metalGlow 7.3s infinite ease-in-out',
                  }}
                />

                {/* Secondary Overlapping Glow */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse at 30% 70%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 35%, transparent 65%)',
                    animation: 'metalGlow2 5.1s infinite ease-in-out',
                  }}
                />

                {/* Primary Flow Effect */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(45deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)',
                    animation: 'subtleFlow 6.7s infinite linear',
                  }}
                />

                {/* Secondary Overlapping Flow */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(-35deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
                    animation: 'subtleFlow2 4.9s infinite linear',
                  }}
                />

                {/* Constant Soft Top Highlight */}
                <div
                  className="absolute top-0 left-0 right-0 h-1/3"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  }}
                />

                <div className="relative z-10 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-white font-bold text-sm tracking-wide drop-shadow-md uppercase">
                      FEATURED EQUIPMENT
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                    Premium Kubota SVL-75
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="relative p-4">
                {/* Equipment Image with Price Badge */}
                <div className="relative mb-4 group">
                  <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-200/50">
                    {/* Dot Pattern Background */}
                    <div className="absolute inset-0 opacity-10">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `radial-gradient(circle at 25% 25%, #E1BC56 1px, transparent 1px), radial-gradient(circle at 75% 75%, #E1BC56 1px, transparent 1px)`,
                          backgroundSize: '40px 40px',
                          backgroundPosition: '0 0, 20px 20px',
                        }}
                      ></div>
                    </div>

                    <div className="relative max-h-64">
                      <Image
                        src="/images/kubota-svl-75-hero.png"
                        alt="Kubota SVL-75 Compact Track Loader"
                        width={800}
                        height={400}
                        className="w-full h-auto max-h-64 object-contain drop-shadow-xl"
                        priority
                      />
                    </div>

                    {/* Floating Price Badge */}
                    <div className="absolute top-4 right-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#E1BC56] to-[#F4D03F] rounded-2xl blur-md opacity-60"></div>
                        <div className="relative bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-6 py-3 rounded-2xl shadow-xl border border-white/20">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <span className="text-black font-bold text-lg">From $450/day</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Availability Badge */}
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-full shadow-lg">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                        <span className="text-white font-bold text-sm">Available Now</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Proof Bar */}
                <div className="flex items-center justify-center gap-6 mb-8 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-5 h-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-bold text-gray-900">4.9/5 Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-bold text-gray-900">500+ Rentals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-bold text-gray-900">$120K Insurance</span>
                  </div>
                </div>

                {/* Key Specifications Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { icon: '⚡', label: 'Power', value: '74.3 HP' },
                    { icon: '🏋️', label: 'Lift Capacity', value: '2,750 lbs' },
                    { icon: '⚖️', label: 'Weight', value: '8,818 lbs' },
                  ].map((spec: unknown, index: unknown) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-xl border-2 border-gray-200 hover:border-[#E1BC56] hover:shadow-lg transition-all duration-300"
                    >
                      <div className="text-3xl mb-2 text-center">{spec.icon}</div>
                      <div className="text-xl font-bold text-gray-900 mb-1 text-center">
                        {spec.value}
                      </div>
                      <div className="text-xs text-gray-600 text-center font-medium uppercase tracking-wide">
                        {spec.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feature Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {[
                    {
                      icon: '⚡',
                      title: '74.3 HP Kubota Diesel Engine',
                      desc: 'Powerful and fuel-efficient',
                    },
                    {
                      icon: '🏋️',
                      title: '2,750 lbs Operating Capacity',
                      desc: 'Handle heavy loads with ease',
                    },
                    {
                      icon: '🎯',
                      title: 'Precision Hydraulic Controls',
                      desc: 'Smooth, responsive operation',
                    },
                    {
                      icon: '🔧',
                      title: 'Multiple Attachment Options',
                      desc: 'Buckets, augers, grapples, and more',
                    },
                  ].map((feature: unknown, index: unknown) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-[#E1BC56]/30 transition-all"
                    >
                      <div className="text-2xl">{feature.icon}</div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm mb-1">{feature.title}</div>
                        <div className="text-xs text-gray-600">{feature.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Urgency Indicator */}
                <div className="flex items-center justify-center gap-2 mb-3 bg-red-50 border-2 border-red-200 px-4 py-2 rounded-xl">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-red-700 font-bold text-sm">
                    🔥 3 people viewing this equipment right now
                  </span>
                </div>

                {/* Primary CTA */}
                <Link
                  href="/book"
                  className="block w-full text-center px-6 py-3 rounded-xl font-bold text-base bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] text-black shadow-xl hover:shadow-2xl transition-all border-2 border-white/20 mb-3"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Book This Equipment Now
                  </span>
                </Link>

                {/* Secondary CTA */}
                <a
                  href="tel:+15066431575"
                  className="block w-full text-center px-6 py-3 rounded-xl font-bold text-base bg-white text-gray-900 shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 hover:border-[#E1BC56] mb-4"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Call (506) 643-1575
                  </span>
                </a>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t-2 border-gray-100">
                  <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <svg
                      className="w-6 h-6 text-green-600 mb-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-bold text-green-900 text-center">
                      Instant Confirmation
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <svg
                      className="w-6 h-6 text-blue-600 mb-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                    <span className="text-xs font-bold text-blue-900 text-center">
                      Same-Day Delivery
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <svg
                      className="w-6 h-6 text-purple-600 mb-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-bold text-purple-900 text-center">
                      Fully Insured
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <svg
                      className="w-6 h-6 text-orange-600 mb-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-bold text-orange-900 text-center">
                      24/7 Support
                    </span>
                  </div>
                </div>

                {/* Tertiary Link */}
                <div className="text-center pt-6">
                  <Link
                    href="/equipment"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
                  >
                    View Full Specifications
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
