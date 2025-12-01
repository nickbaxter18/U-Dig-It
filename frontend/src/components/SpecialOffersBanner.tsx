'use client';

import { useEffect, useState } from 'react';

export default function SpecialOffersBanner() {
  const [isVisible, setIsVisible] = useState(false); // Start hidden until we know the admin setting
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user previously dismissed the banner this session
    const dismissed = sessionStorage.getItem('bannerDismissed') === 'true';
    if (dismissed) {
      setIsDismissed(true);
      setIsLoading(false);
      return;
    }

    // Fetch the admin setting for banner visibility
    const fetchBannerConfig = async () => {
      try {
        const response = await fetch('/api/config/banner');
        const data = await response.json();
        setIsVisible(data.enabled === true);
      } catch {
        // If fetch fails, default to hidden to be safe
        setIsVisible(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBannerConfig();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('bannerDismissed', 'true');
  };

  // Don't show if loading, dismissed, or disabled by admin
  if (isLoading || isDismissed || !isVisible) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#A90F0F] via-red-600 to-[#8B0A0A] px-4 py-1 text-white shadow-[0_4px_20px_rgba(169,15,15,0.45),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.3)] transition-all duration-700 ease-out md:py-3">
      {/* Glossy Shine Effect - Top (More Refined) */}
      <div className="via-white/8 pointer-events-none absolute left-0 right-0 top-0 h-[45%] bg-gradient-to-b from-white/25 to-transparent transition-all duration-700 ease-out"></div>

      {/* Depth Shadow - Bottom Inner (More Refined) */}
      <div className="via-black/12 pointer-events-none absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-black/35 to-transparent transition-all duration-700 ease-out"></div>

      {/* Subtle Edge Highlights */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 ease-out"></div>

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile: Simple CTA button centered */}
          <div className="flex w-full items-center justify-center gap-3 md:hidden">
            <a
              href="/contest"
              className="btn-banner-clean inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1 text-xs font-bold shadow-lg transition-transform hover:scale-105"
            >
              <span className="text-sm">🎉</span>
              <span>Enter Contest!</span>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded-full p-0.5 transition-colors hover:bg-white/20"
              aria-label="Close banner"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Desktop: Original full content */}
          <div className="hidden flex-1 items-center gap-4 md:flex">
            {/* Flash Icon */}
            <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-yellow-400">
              <svg className="h-6 w-6 text-red-700" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {/* Offer Text */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-yellow-300">
                  🎉 Win Equipment Service Package:
                </span>
                <span className="text-base">
                  Enter our monthly contest for 4 hours of equipment + operator service!
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <a
              href="/contest"
              className="btn-banner-clean inline-flex items-center gap-2 whitespace-nowrap rounded-full px-6 py-2 font-bold"
            >
              <span>Enter Contest</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>

          {/* Close Button - Desktop only (mobile has it integrated above) */}
          <button
            onClick={handleDismiss}
            className="hidden flex-shrink-0 rounded-full p-1 transition-colors hover:bg-white/20 md:block"
            aria-label="Close banner"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
