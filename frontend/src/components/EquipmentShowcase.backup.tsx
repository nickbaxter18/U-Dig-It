'use client';

import { useEffect, useState } from 'react';

import '../styles/equipment-showcase.css';

interface EquipmentShowcaseProps {
  className?: string;
}

export default function EquipmentShowcase({ className = '' }: EquipmentShowcaseProps) {
  const [activeView, setActiveView] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const equipmentViews = [
    {
      id: 'exterior',
      title: 'Kubota SVL-75',
      subtitle: 'Compact Track Loader',
      image: '/images/kubota-svl-75-hero.png',
      bgGradient: 'from-gray-900 via-gray-800 to-black',
      specs: [
        {
          label: 'Operating Weight',
          value: '9,420 lbs',
          icon: '⚖️',
          color: 'from-[#E1BC56] to-yellow-500',
        },
        {
          label: 'Horsepower',
          value: '74.3 HP',
          icon: '⚡',
          color: 'from-[#E1BC56] to-yellow-500',
        },
        {
          label: 'Fuel Capacity',
          value: '27.7 gal',
          icon: '⛽',
          color: 'from-[#E1BC56] to-yellow-500',
        },
      ],
      features: [
        { icon: '⚡', text: '74.3 HP Diesel Engine', color: 'text-yellow-400' },
        { icon: '🏗️', text: '9,420 lbs Operating Weight', color: 'text-blue-400' },
        { icon: '🔄', text: '360° Rotation Capability', color: 'text-green-400' },
        { icon: '🛡️', text: '$120K Insurance Coverage', color: 'text-red-400' },
      ],
    },
    {
      id: 'interior',
      title: 'Operator Cabin',
      subtitle: 'Comfort & Control',
      image: '/images/kubota-svl-75-hero.png',
      bgGradient: 'from-gray-900 via-gray-800 to-black',
      specs: [
        {
          label: 'Cab Type',
          value: 'Enclosed ROPS',
          icon: '🏠',
          color: 'from-[#E1BC56] to-yellow-500',
        },
        {
          label: 'Seat Type',
          value: 'Air Suspension',
          icon: '💺',
          color: 'from-[#E1BC56] to-yellow-500',
        },
        {
          label: 'Controls',
          value: 'Pilot Operated',
          icon: '🎛️',
          color: 'from-[#E1BC56] to-yellow-500',
        },
      ],
      features: [
        { icon: '🏠', text: 'Fully Enclosed ROPS Cabin', color: 'text-blue-400' },
        { icon: '💺', text: 'Premium Air Suspension Seat', color: 'text-green-400' },
        { icon: '🎛️', text: 'Intuitive Pilot Controls', color: 'text-purple-400' },
        { icon: '🌡️', text: 'Climate Control System', color: 'text-red-400' },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      subtitle: 'Power & Precision',
      image: '/images/kubota-svl-75-hero.png',
      bgGradient: 'from-gray-900 via-gray-800 to-black',
      specs: [
        {
          label: 'Lift Capacity',
          value: '2,690 lbs',
          icon: '🏋️',
          color: 'from-[#E1BC56] to-yellow-500',
        },
        { label: 'Dig Depth', value: '13.5 ft', icon: '⛏️', color: 'from-[#E1BC56] to-yellow-500' },
        {
          label: 'Travel Speed',
          value: '7.1 mph',
          icon: '💨',
          color: 'from-[#E1BC56] to-yellow-500',
        },
      ],
      features: [
        { icon: '🏋️', text: '2,690 lbs Lift Capacity', color: 'text-orange-400' },
        { icon: '⛏️', text: '13.5 ft Dig Depth', color: 'text-yellow-400' },
        { icon: '💨', text: '7.1 mph Travel Speed', color: 'text-blue-400' },
        { icon: '🎯', text: 'Precision Hydraulic Controls', color: 'text-green-400' },
      ],
    },
  ];

  // Auto-rotate through views
  useEffect(() => {
    if (!isAutoRotating) return;

    const interval = setInterval(() => {
      setActiveView((prev) => (prev + 1) % equipmentViews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoRotating, equipmentViews.length]);

  const currentView = equipmentViews[activeView];

  return (
    <div className={`equipment-showcase ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Enhanced with Modern Design */}
        <div className="relative mb-16 text-center">
          {/* Modern Background Effects */}
          <div className="from-[#E1BC56]/8 to-[#A90F0F]/8 absolute inset-0 scale-110 animate-pulse rounded-3xl bg-gradient-to-br blur-3xl"></div>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 to-transparent"></div>

          {/* Floating Elements */}
          <div
            className="absolute left-8 top-8 h-4 w-4 animate-bounce rounded-full bg-[#E1BC56] opacity-60"
            style={{ animationDelay: '0s', animationDuration: '3s' }}
          ></div>
          <div
            className="absolute right-12 top-16 h-3 w-3 animate-bounce rounded-full bg-white opacity-40"
            style={{ animationDelay: '1s', animationDuration: '4s' }}
          ></div>
          <div
            className="absolute bottom-12 left-16 h-2 w-2 animate-bounce rounded-full bg-[#A90F0F] opacity-50"
            style={{ animationDelay: '2s', animationDuration: '2.5s' }}
          ></div>

          <div className="relative">
            {/* Modern Badge */}
            <div className="hover-lift mb-8 inline-flex items-center rounded-full border border-red-400/20 bg-gradient-to-r from-brand-secondary to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg">
              <span className="mr-3 h-3 w-3 animate-pulse rounded-full bg-brand-primary"></span>
              <span className="font-medium">Available Now - Book Today!</span>
              <div className="ml-2 flex space-x-1">
                <div className="h-1 w-1 animate-pulse rounded-full bg-white"></div>
                <div
                  className="h-1 w-1 animate-pulse rounded-full bg-white"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="h-1 w-1 animate-pulse rounded-full bg-white"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            </div>

            <h1 className="mb-8 animate-fade-in text-5xl font-bold leading-tight text-white md:text-7xl">
              Rent the{' '}
              <span className="animate-pulse bg-gradient-to-r from-[#E1BC56] via-yellow-400 to-[#E1BC56] bg-clip-text font-black text-transparent">
                Kubota SVL-75
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-4xl text-xl font-light leading-relaxed text-gray-200">
              Professional compact track loader rental in{' '}
              <span className="rounded-md bg-[#E1BC56]/10 px-2 py-1 font-semibold text-[#E1BC56]">
                Saint John, New Brunswick
              </span>
              . Get the power and versatility you need for your next project.
            </p>

            {/* Real Kubota Image */}
            <div className="mx-auto mb-12 max-w-4xl">
              <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
                <img
                  src="/images/kubota-svl-75-hero.png"
                  alt="Kubota SVL-75 Compact Track Loader"
                  className="h-auto max-h-[500px] w-full bg-gray-50 object-contain"
                />
                <div className="p-8">
                  <h3 className="mb-4 text-3xl font-bold text-gray-900">
                    Kubota SVL-75 Compact Track Loader
                  </h3>
                  <p className="mb-6 text-lg text-gray-600">
                    Professional-grade equipment with 74.3 HP diesel engine, 9,420 lbs operating
                    weight, and 2,690 lbs lift capacity.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="rounded-lg bg-[#E1BC56]/10 p-4">
                      <div className="text-2xl font-bold text-[#E1BC56]">74.3 HP</div>
                      <div className="text-sm text-gray-600">Diesel Engine</div>
                    </div>
                    <div className="rounded-lg bg-[#E1BC56]/10 p-4">
                      <div className="text-2xl font-bold text-[#E1BC56]">$450/day</div>
                      <div className="text-sm text-gray-600">Starting Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mb-12 flex flex-wrap justify-center gap-6">
              <div className="flex items-center space-x-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <span className="status-dot success"></span>
                <span className="text-sm font-medium text-white">Fully Licensed</span>
              </div>
              <div className="flex items-center space-x-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <span className="status-dot success"></span>
                <span className="text-sm font-medium text-white">$120K Insurance</span>
              </div>
              <div className="flex items-center space-x-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <span className="status-dot info"></span>
                <span className="text-sm font-medium text-white">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Equipment Display - Enhanced Modern Design */}
        <div className="modern-card relative mb-16 overflow-hidden rounded-3xl border border-gray-600/70 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 shadow-2xl">
          {/* Modern Background Effects */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #E1BC56 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          ></div>

          {/* Animated Gradient Overlay */}
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-[#E1BC56]/5 to-transparent"></div>

          {/* Content */}
          <div className="relative p-8 md:p-16">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              {/* Left Side - Equipment Info */}
              <div className="animate-slide-in-left text-center lg:text-left">
                {/* Professional Equipment Image */}
                <div className="relative mb-12">
                  <div className="relative mx-auto h-48 w-64">
                    <img
                      src={currentView.image}
                      alt={currentView.title}
                      className="h-full w-full rounded-2xl border border-white/20 bg-white/10 object-contain shadow-2xl backdrop-blur-sm"
                    />
                    <div className="absolute -right-2 -top-2 h-6 w-6 animate-pulse rounded-full border-2 border-white bg-[#A90F0F]"></div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>

                <h2 className="mb-6 text-3xl font-bold leading-tight text-white drop-shadow-lg md:text-4xl">
                  {currentView.title}
                </h2>

                <p className="mb-10 text-lg font-medium leading-relaxed text-white drop-shadow-md">
                  {currentView.subtitle}
                </p>

                {/* Enhanced Key Specifications */}
                <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {currentView.specs.map((spec: unknown, index: unknown) => (
                    <div key={index} className="group">
                      <div className="modern-card flex min-h-[140px] flex-col justify-center border border-gray-500/60 bg-gradient-to-br from-gray-700/80 to-gray-800/80 p-6 backdrop-blur-sm hover:border-[#E1BC56]/70 hover:shadow-lg hover:shadow-[#E1BC56]/20">
                        <div className="mb-4 text-center text-3xl text-[#E1BC56] drop-shadow-md transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
                          {spec.icon}
                        </div>
                        <div className="mb-2 break-words text-center text-xl font-bold text-white drop-shadow-sm">
                          {spec.value}
                        </div>
                        <div className="text-center text-sm font-medium leading-tight text-gray-200 drop-shadow-sm">
                          {spec.label}
                        </div>

                        {/* Modern Progress Indicator */}
                        <div className="mt-3">
                          <div className="progress-modern">
                            <div
                              className="progress-fill-modern"
                              style={{
                                width: `${Math.min(100, (parseFloat(spec.value.replace(/[^\d.]/g, '')) / (index === 0 ? 100 : index === 1 ? 80 : 30)) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Enhanced Actions & Features */}
              <div className="animate-slide-in-right space-y-10">
                {/* Modern Action Buttons */}
                <div className="space-y-4">
                  <button className="btn-premium-gold group w-full rounded-2xl px-8 py-6 text-center text-xl font-bold">
                    <span className="flex items-center justify-center">
                      🚀 Book Now - Instant Quote
                      <svg
                        className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
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
                  </button>

                  <a
                    href="tel:+15066431575"
                    className="btn-premium-gold group block w-full rounded-2xl px-8 py-6 text-center text-xl font-bold"
                  >
                    <span className="flex items-center justify-center">
                      📞 Call (506) 643-1575
                      <svg
                        className="ml-2 h-5 w-5 transition-transform group-hover:scale-110"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </span>
                  </a>
                </div>

                {/* Enhanced Features Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {currentView.features.map((feature: unknown, index: unknown) => (
                    <div
                      key={index}
                      className="modern-card hover-lift group flex min-h-[70px] items-center border border-gray-500/50 bg-gray-700/60 p-4 transition-all duration-300 hover:border-gray-400/70 hover:bg-gray-700/80"
                    >
                      <div className="flex w-full items-start space-x-3">
                        <span
                          className={`${feature.color} mt-0.5 flex-shrink-0 text-lg drop-shadow-sm transition-transform group-hover:scale-110`}
                        >
                          {feature.icon}
                        </span>
                        <div className="break-words text-sm font-semibold leading-relaxed text-white drop-shadow-sm">
                          {feature.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Benefits */}
                <div className="space-y-4 rounded-2xl border border-gray-500/50 bg-gradient-to-r from-gray-700/50 to-gray-800/50 p-6">
                  <div className="flex items-center space-x-4 rounded-xl border border-[#E1BC56]/30 bg-[#E1BC56]/20 p-3 text-[#E1BC56]">
                    <span className="animate-pulse text-2xl drop-shadow-sm">✅</span>
                    <span className="text-lg font-bold text-white drop-shadow-sm">
                      Fully Licensed & Insured
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 rounded-xl border border-emerald-400/30 bg-emerald-500/20 p-3 text-emerald-300">
                    <span className="text-2xl drop-shadow-sm">🚚</span>
                    <span className="text-lg font-bold text-white drop-shadow-sm">
                      Same-Day Delivery Available
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 rounded-xl border border-blue-400/30 bg-blue-500/20 p-3 text-blue-300">
                    <span className="text-2xl drop-shadow-sm">🛠️</span>
                    <span className="text-lg font-bold text-white drop-shadow-sm">
                      24/7 Technical Support
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced View Selection - Modern Tabs */}
        <div className="flex justify-center">
          <div className="tabs-modern rounded-2xl border border-gray-500/60 bg-gray-700/60 p-2 shadow-lg backdrop-blur-sm">
            {equipmentViews.map((view: unknown, index: unknown) => (
              <button
                key={view.id}
                onClick={() => {
                  setActiveView(index);
                  setIsAutoRotating(false);
                }}
                className={`tab-modern group flex items-center space-x-3 rounded-xl px-6 py-3 transition-all duration-300 ${
                  activeView === index
                    ? 'active scale-105 transform bg-gradient-to-r from-[#E1BC56] to-yellow-500 font-bold text-black shadow-lg'
                    : 'hover:scale-102 font-semibold text-white hover:bg-gray-600/70 hover:text-white'
                }`}
              >
                <span
                  className={`text-xl transition-transform group-hover:scale-110 ${activeView === index ? 'animate-bounce' : ''}`}
                >
                  {index === 0 ? '🚜' : index === 1 ? '👨‍💼' : '💪'}
                </span>
                <span className="hidden font-medium sm:inline">{view.title.split(' ')[0]}</span>

                {/* Active Indicator */}
                {activeView === index && (
                  <div className="h-2 w-2 animate-pulse rounded-full bg-black"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-rotation Indicator */}
        <div className="mt-6 flex justify-center">
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${isAutoRotating ? 'animate-pulse bg-[#E1BC56] shadow-lg shadow-[#E1BC56]/50' : 'bg-gray-500'}`}
            ></div>
            <span className="font-medium">Auto-rotating views</span>
            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className="ml-2 rounded-full border border-gray-500 bg-gray-700/70 px-3 py-1 text-xs font-medium text-white transition-colors hover:border-gray-400 hover:bg-gray-600/70"
            >
              {isAutoRotating ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
