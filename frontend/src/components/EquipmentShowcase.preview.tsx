'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

/**
 * PREMIUM REDESIGNED EquipmentShowcase Component
 *
 * Improvements:
 * ✨ Premium gold theme matching BookingWidget
 * 🎨 Sophisticated 3D card with metallic effects
 * 💫 Twinkling particles and shimmer animations
 * 📊 Enhanced stats panel with glass morphism
 * 🎯 Better visual hierarchy and spacing
 * ⚡ Smooth micro-interactions
 */

interface EquipmentShowcaseProps {
  className?: string;
}

export default function EquipmentShowcase({ className = '' }: EquipmentShowcaseProps) {
  const [activeSpec, setActiveSpec] = useState(0);

  const specs = [
    { label: 'Power', value: '74.3 HP', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { label: 'Lift Capacity', value: '2,750 lbs', icon: '🏋️', color: 'from-blue-400 to-blue-600' },
    { label: 'Weight', value: '8,818 lbs', icon: '⚖️', color: 'from-purple-400 to-purple-600' },
  ];

  const features = [
    {
      icon: '⚡',
      title: '74.3 HP Kubota Diesel Engine',
      desc: 'Powerful and fuel-efficient performance',
    },
    {
      icon: '🏋️',
      title: '2,750 lbs Rated Operating Capacity',
      desc: 'Handle heavy loads with ease',
    },
    { icon: '🎯', title: 'Precision Hydraulic Controls', desc: 'Smooth, responsive operation' },
    {
      icon: '🔧',
      title: 'Multiple Attachment Options',
      desc: 'Buckets, augers, grapples, and more',
    },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Section Header */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#E1BC56]/10 px-4 py-2">
          <svg className="h-5 w-5 text-[#E1BC56]" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-bold text-[#E1BC56]">Featured Equipment</span>
        </div>
        <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
          Kubota SVL-75 Compact Track Loader
        </h2>
        <p className="mx-auto max-w-3xl text-xl text-gray-600">
          Professional-grade equipment with the power and versatility for any construction or
          landscaping project.
        </p>
      </div>

      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* LEFT: Premium Equipment Showcase with 3D Effects */}
        <div className="group relative">
          {/* Background Glow - Pulsating Effect */}
          <div className="absolute -inset-6 animate-pulse rounded-3xl bg-gradient-to-r from-[#E1BC56]/30 via-[#F4D03F]/20 to-[#E1BC56]/30 opacity-50 blur-2xl transition-opacity duration-700 group-hover:opacity-70"></div>

          {/* Main Premium Card */}
          <div className="premium-form-container relative overflow-hidden rounded-3xl">
            {/* Premium Gold Header Strip */}
            <div className="premium-form-header py-3">
              {/* Twinkling Stars on Header */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-1 w-1 rounded-full bg-white"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${10 + Math.random() * 80}%`,
                      animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 2}s`,
                      opacity: 0.7,
                    }}
                  />
                ))}
              </div>
              <div className="relative z-10 text-center">
                <h3 className="text-xl font-bold text-black">Premium Equipment</h3>
              </div>
            </div>

            {/* Equipment Image Container */}
            <div className="relative bg-gradient-to-br from-white via-gray-50/50 to-white p-12">
              {/* Ambient Glow */}
              <div className="premium-form-ambient"></div>

              {/* Sophisticated Dot Pattern Background */}
              <div className="absolute inset-0 opacity-20">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, #E1BC56 1px, transparent 1px), radial-gradient(circle at 75% 75%, #E1BC56 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    backgroundPosition: '0 0, 20px 20px',
                  }}
                ></div>
              </div>

              {/* Equipment Image */}
              <div className="relative z-10">
                <Image
                  src="/images/kubota-svl-75-hero.png"
                  alt="Kubota SVL-75 Compact Track Loader"
                  width={800}
                  height={500}
                  className="h-auto w-full transform object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                  priority
                />
              </div>

              {/* Floating Price Badge */}
              <div className="absolute right-4 top-4 z-20">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-r from-[#E1BC56] to-[#F4D03F] opacity-60 blur-md"></div>
                  <div className="relative rounded-2xl border border-white/20 bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-6 py-3 shadow-xl">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
                      <span className="text-lg font-bold text-black">From $450/day</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Stats Panel - Floating at Bottom */}
            <div className="relative z-30 mx-6 -mt-8 mb-6">
              <div className="relative">
                {/* Panel Glow */}
                <div className="absolute inset-0 rounded-2xl bg-white opacity-90 blur-sm"></div>

                {/* Main Panel */}
                <div className="bg-white/98 relative rounded-2xl border border-gray-200/50 p-6 shadow-2xl backdrop-blur-xl">
                  <div className="mb-4 text-center">
                    <h4 className="text-base font-bold text-gray-800">Key Specifications</h4>
                    <div className="mx-auto mt-2 h-0.5 w-16 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {specs.map((spec: unknown, index: unknown) => (
                      <button
                        key={index}
                        onClick={() => setActiveSpec(index)}
                        className={`group cursor-pointer transition-all duration-300 ${
                          activeSpec === index ? 'scale-105 transform' : ''
                        }`}
                      >
                        <div
                          className={`relative rounded-xl p-4 ${
                            activeSpec === index
                              ? 'border-2 border-[#E1BC56]/50 bg-gradient-to-br from-[#E1BC56]/20 to-[#F4D03F]/10'
                              : 'border-2 border-transparent bg-gray-50 hover:border-[#E1BC56]/30'
                          } transition-all`}
                        >
                          <div className="mb-2 text-3xl transition-transform group-hover:scale-110">
                            {spec.icon}
                          </div>
                          <div
                            className={`mb-1 text-2xl font-bold ${
                              activeSpec === index
                                ? 'bg-gradient-to-r from-[#E1BC56] to-[#F4D03F] bg-clip-text text-transparent'
                                : 'text-gray-900'
                            }`}
                          >
                            {spec.value}
                          </div>
                          <div className="text-xs font-medium text-gray-600">{spec.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Equipment Details & CTA */}
        <div className="space-y-6 lg:pl-8">
          <h3 className="text-3xl font-bold text-gray-900">Built for Performance & Reliability</h3>
          <p className="text-lg leading-relaxed text-gray-600">
            The Kubota SVL-75 combines power, precision, and versatility in a compact design.
            Perfect for construction sites, landscaping projects, and excavation work where space is
            limited but performance cannot be compromised.
          </p>

          {/* Features List with Premium Styling */}
          <div className="space-y-3">
            {features.map((feature: unknown, index: unknown) => (
              <div
                key={index}
                className="group flex items-start gap-4 rounded-xl border-2 border-transparent bg-white p-4 shadow-md transition-all duration-300 hover:border-[#E1BC56]/30 hover:shadow-xl"
              >
                <div className="text-3xl transition-transform group-hover:scale-110">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="mb-1 font-bold text-gray-900">{feature.title}</div>
                  <div className="text-sm text-gray-600">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Premium CTA Buttons */}
          <div className="flex flex-col gap-4 pt-6 sm:flex-row">
            <Link
              href="/book"
              className="premium-button group relative inline-flex flex-1 transform items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-white/20 bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-5 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 -translate-x-full -skew-x-12 transform bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>

              <span className="relative flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Book This Equipment
              </span>
            </Link>
            <Link
              href="/equipment"
              className="group inline-flex flex-1 transform items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-8 py-5 text-lg font-bold text-gray-900 shadow-xl transition-all hover:scale-105 hover:border-[#E1BC56] hover:shadow-2xl"
            >
              <span className="flex items-center gap-2">
                View Full Specs
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-semibold text-green-900">Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
              <span className="text-sm font-semibold text-blue-900">Same-Day Delivery</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3">
              <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-semibold text-purple-900">Fully Insured</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3">
              <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-semibold text-orange-900">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Comparison: Before vs After */}
      <div className="mt-16 rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-8">
        <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">✨ What's Improved:</h3>
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-3 text-4xl">🎨</div>
            <h4 className="mb-2 font-bold text-gray-900">Premium Gold Theme</h4>
            <p className="text-sm text-gray-600">
              Matches your BookingWidget with twinkling stars, metallic shimmer, and 3D depth
              effects
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-3 text-4xl">💎</div>
            <h4 className="mb-2 font-bold text-gray-900">Enhanced Visual Hierarchy</h4>
            <p className="text-sm text-gray-600">
              Clean, modern card design with floating stats panel and glass morphism effects
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-3 text-4xl">⚡</div>
            <h4 className="mb-2 font-bold text-gray-900">Smooth Animations</h4>
            <p className="text-sm text-gray-600">
              Interactive spec cards, hover effects, and micro-interactions for premium feel
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-3 text-4xl">🎯</div>
            <h4 className="mb-2 font-bold text-gray-900">Better CTAs</h4>
            <p className="text-sm text-gray-600">
              Prominent booking buttons with trust badges for higher conversion
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
