'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';

import { useSpinWheel } from '@/hooks/useSpinWheel';

import NotificationCenter from './NotificationCenter';
import SpinWheel from './SpinWheel';

export default function Navigation() {
  const { user, role, loading: isLoading, signOut } = useAuth();
  const { isOpen: isSpinWheelOpen, openSpinWheel, closeSpinWheel } = useSpinWheel();

  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Debug profile dropdown state
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Profile dropdown state', {
        component: 'Navigation',
        action: 'debug',
      });
    }
    if (process.env.NODE_ENV === 'development') {
      logger.debug('User auth', { component: 'Navigation', action: 'debug' });
    }
  }, [isProfileDropdownOpen, user, isLoading]);

  // Handle clicking outside dropdown - SIMPLIFIED APPROACH
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside both button and dropdown
      if (
        isProfileDropdownOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Click outside detected, closing dropdown', {
            component: 'Navigation',
            action: 'debug',
          });
        }
        // Add a small delay to prevent immediate closure
        timeoutId = setTimeout(() => {
          setIsProfileDropdownOpen(false);
        }, 50);
      }
    };

    // Add listener to document
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isProfileDropdownOpen]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleProfileDropdown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Toggling profile dropdown', {
        component: 'Navigation',
        action: 'debug',
      });
    }
    setIsProfileDropdownOpen((prev) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Setting dropdown state', {
          component: 'Navigation',
          action: 'debug',
        });
      }
      return !prev;
    });
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const handleSpinWheelWin = useCallback(
    (prize: { percentage: number; promoCode: string }) => {
      // Close modal first to prevent state conflicts
      closeSpinWheel();
      // Then redirect to booking page with the promo code after a small delay
      setTimeout(() => {
        router.push(`/book?promo=${prize.promoCode}`);
      }, 100);
    },
    [router, closeSpinWheel]
  );

  const isActivePath = (path: string) => pathname === path;

  return (
    <>
      {/* Promotional Banner - Premium Polished Effect (Fixed at Top Only) */}
      <div className="relative z-30 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4 py-2.5 text-center text-white shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.6)] transition-all duration-700 ease-out">
        {/* Glossy Shine Effect - Top */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-[50%] bg-gradient-to-b from-white/15 via-white/5 to-transparent transition-all duration-700 ease-out"></div>

        {/* Depth Shadow - Bottom Inner */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/50 via-black/15 to-transparent transition-all duration-700 ease-out"></div>

        {/* Premium Edge Highlights */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E1BC56]/30 to-transparent transition-all duration-700 ease-out"></div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent transition-all duration-700 ease-out"></div>

        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-[#E1BC56] drop-shadow-[0_2px_8px_rgba(225,188,86,0.4)]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              <span className="text-[#E1BC56]">Special Offer:</span> Win Up To $100 Off Your First
              Rental
            </span>
          </div>
          <button
            onClick={openSpinWheel}
            className="btn-banner-clean rounded-md px-3 py-1.5 text-xs font-medium"
          >
            Claim Offer
          </button>
        </div>
      </div>

      {/* Main Navigation - Premium Effect with Solid Background */}
      <nav
        className={`sticky top-0 z-50 bg-white transition-all duration-700 ease-out ${
          isScrolled
            ? 'py-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.2),0_8px_20px_-6px_rgba(0,0,0,0.15),0_2px_8px_-2px_rgba(0,0,0,0.1),inset_0_2px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(0,0,0,0.06)]'
            : 'py-3 shadow-[0_14px_40px_-8px_rgba(0,0,0,0.15),0_8px_18px_-4px_rgba(0,0,0,0.12),0_4px_10px_-2px_rgba(0,0,0,0.08),inset_0_2px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.04)]'
        }`}
      >
        {/* Premium Glossy Shine Effect - Enhanced for Both States */}
        <div
          className={`pointer-events-none absolute left-0 right-0 top-0 transition-all duration-700 ease-out ${
            isScrolled
              ? 'h-[60%] bg-gradient-to-b from-white/60 via-white/20 to-transparent opacity-100'
              : 'via-white/18 h-[55%] bg-gradient-to-b from-white/55 to-transparent opacity-100'
          }`}
        ></div>

        {/* Enhanced Depth Shadow - Bottom Inner (Stronger When Docked) */}
        <div
          className={`pointer-events-none absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out ${
            isScrolled
              ? 'h-[30%] bg-gradient-to-t from-gray-300/50 via-gray-200/20 to-transparent'
              : 'via-gray-200/18 h-[28%] bg-gradient-to-t from-gray-300/45 to-transparent'
          }`}
        ></div>

        {/* Premium Edge Glow - Animated (Stronger When Docked) */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-400/60 to-transparent transition-all duration-700 ease-out ${
            isScrolled ? 'opacity-100' : 'opacity-90'
          }`}
        ></div>

        {/* Subtle Top Highlight for Extra Depth (Stronger When Docked) */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent transition-all duration-700 ease-out ${
            isScrolled ? 'opacity-100' : 'opacity-85'
          }`}
        ></div>

        {/* Additional Ambient Glow for Docked State */}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/30 via-transparent to-gray-50/20 transition-all duration-700 ease-out ${
            isScrolled ? 'opacity-0' : 'opacity-100'
          }`}
        ></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo - Professional and Clean, Simplified on Mobile */}
            <Link href="/" className="group flex flex-shrink-0 items-center">
              <div className="relative h-10 w-10 rounded-lg bg-gray-900 p-1.5 shadow-sm transition-transform duration-300 group-hover:scale-105 md:mr-3 md:h-11 md:w-11">
                <Image
                  src="/images/udigit-logo.png"
                  alt="U-Dig It Rentals Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="hidden flex-col md:flex">
                <span className="text-lg font-bold text-gray-900 transition-colors duration-200 group-hover:text-[#E1BC56]">
                  U-Dig It Rentals
                </span>
                <span className="text-xs font-medium text-gray-500">Saint John, NB</span>
              </div>
            </Link>

            {/* Desktop Navigation - Centered and Balanced */}
            <div className="hidden items-center space-x-2 lg:flex">
              <Link
                href="/"
                className={`relative px-5 py-2 text-base font-medium transition-colors duration-200 ${
                  isActivePath('/') ? 'text-[#E1BC56]' : 'text-gray-700 hover:text-[#E1BC56]'
                }`}
              >
                Home
                {isActivePath('/') && (
                  <span className="absolute bottom-0 left-1/2 h-px w-6 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-transparent via-[#E1BC56]/40 to-transparent"></span>
                )}
              </Link>

              <Link
                href="/equipment"
                className={`relative px-5 py-2 text-base font-medium transition-colors duration-200 ${
                  isActivePath('/equipment')
                    ? 'text-[#E1BC56]'
                    : 'text-gray-700 hover:text-[#E1BC56]'
                }`}
              >
                Equipment
                {isActivePath('/equipment') && (
                  <span className="absolute bottom-0 left-1/2 h-px w-6 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-transparent via-[#E1BC56]/40 to-transparent"></span>
                )}
              </Link>

              <Link
                href="/about"
                className={`relative px-5 py-2 text-base font-medium transition-colors duration-200 ${
                  isActivePath('/about') ? 'text-[#E1BC56]' : 'text-gray-700 hover:text-[#E1BC56]'
                }`}
              >
                About
                {isActivePath('/about') && (
                  <span className="absolute bottom-0 left-1/2 h-px w-6 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-transparent via-[#E1BC56]/40 to-transparent"></span>
                )}
              </Link>

              <Link
                href="/contact"
                className={`relative px-5 py-2 text-base font-medium transition-colors duration-200 ${
                  isActivePath('/contact') ? 'text-[#E1BC56]' : 'text-gray-700 hover:text-[#E1BC56]'
                }`}
              >
                Contact
                {isActivePath('/contact') && (
                  <span className="absolute bottom-0 left-1/2 h-px w-6 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-transparent via-[#E1BC56]/40 to-transparent"></span>
                )}
              </Link>
            </div>

            {/* Right Side - Professional Actions */}
            <div className="flex items-center space-x-2 md:space-x-4 lg:space-x-6">
              {/* Authentication - Clean */}
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-9 w-20 rounded-lg bg-gray-200"></div>
                </div>
              ) : user ? (
                <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
                  {/* Icon Group - Hidden on mobile for cleaner interface */}
                  <div className="hidden items-center space-x-1 md:flex">
                    <NotificationCenter userId={user?.id ?? undefined} showBadge={true} />

                    {/* Phone Icon */}
                    <a
                      href="tel:+15066431575"
                      className="group flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:text-[#E1BC56] md:h-10 md:w-10"
                      title="Call (506) 643-1575"
                    >
                      <svg
                        className="h-5 w-5 md:h-6 md:w-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </a>

                    {/* Email Icon */}
                    <a
                      href="mailto:info@udigit.ca"
                      className="group flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:text-[#E1BC56] md:h-10 md:w-10"
                      title="Email info@udigit.ca"
                    >
                      <svg
                        className="h-5 w-5 md:h-6 md:w-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </a>
                  </div>

                  {/* Book Now CTA - Compact on mobile, full on desktop */}
                  <Link
                    href="/book"
                    className="btn-premium-gold rounded-lg px-3 py-1.5 text-xs font-semibold md:px-6 md:py-2.5 md:text-sm"
                    aria-label="Book equipment now"
                  >
                    Book Now
                  </Link>

                  <div className="relative hidden lg:block" ref={dropdownRef}>
                    <button
                      ref={buttonRef}
                      onClick={toggleProfileDropdown}
                      className="flex items-center space-x-2 rounded-lg border border-gray-200 px-3 py-1.5 transition-colors hover:bg-gray-50"
                      aria-label="User menu"
                    >
                      <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-[#E1BC56] to-[#d4af4a]">
                        {user.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-sm font-semibold text-gray-900">
                              {user.user_metadata?.firstName?.charAt(0) ||
                                user.email?.charAt(0).toUpperCase() ||
                                'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {user.user_metadata?.firstName || 'User'}
                      </span>
                      <svg
                        className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                          isProfileDropdownOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isProfileDropdownOpen && (
                      <div
                        className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
                        style={{
                          zIndex: 9999,
                          position: 'absolute',
                          backgroundColor: 'white',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          boxShadow:
                            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        <div className="border-b border-gray-100 px-4 py-3">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {user?.user_metadata?.firstName || 'User'}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {user?.email || 'No email'}
                          </p>
                        </div>
                        <Link
                          href="/dashboard"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <svg
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                          <span>Dashboard</span>
                        </Link>
                        {/* Admin Dashboard link - only show for admin and super_admin */}
                        {role && (role === 'admin' || role === 'super_admin') && (
                          <Link
                            href="/admin/dashboard"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        <Link
                          href="/profile"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <svg
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/support"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <svg
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                          <span>Support</span>
                        </Link>
                        <Link
                          href="/safety"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <svg
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          <span>Safety</span>
                        </Link>
                        <Link
                          href="/insurance"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <svg
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>Insurance</span>
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Contact Icons - Hidden on mobile for cleaner interface */}
                  <div className="hidden items-center space-x-1 md:flex">
                    {/* Phone Icon */}
                    <a
                      href="tel:+15066431575"
                      className="group flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:text-[#E1BC56] md:h-10 md:w-10"
                      title="Call (506) 643-1575"
                    >
                      <svg
                        className="h-5 w-5 md:h-6 md:w-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </a>

                    {/* Email Icon */}
                    <a
                      href="mailto:info@udigit.ca"
                      className="group flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:text-[#E1BC56] md:h-10 md:w-10"
                      title="Email info@udigit.ca"
                    >
                      <svg
                        className="h-5 w-5 md:h-6 md:w-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </a>
                  </div>

                  {/* Book Now CTA - Compact on mobile, full on desktop */}
                  <Link
                    href="/book"
                    className="btn-premium-gold rounded-lg px-3 py-1.5 text-xs font-semibold md:px-6 md:py-2.5 md:text-sm"
                    aria-label="Book equipment now"
                  >
                    Book Now
                  </Link>

                  <div className="hidden items-center gap-2 md:flex">
                    <button
                      onClick={() => router.push('/auth/signin')}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => router.push('/auth/signup')}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                    >
                      Sign Up
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center space-x-2 lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                aria-label="Toggle mobile menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation - Clean and Organized */}
          {isMobileMenuOpen && (
            <div className="mt-4 border-t border-gray-100 pb-4 pt-4 lg:hidden">
              <div className="space-y-1">
                <Link
                  href="/"
                  className={`block rounded-lg px-4 py-2.5 text-base font-medium transition-colors ${
                    isActivePath('/')
                      ? 'bg-[#E1BC56]/10 text-[#E1BC56]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/equipment"
                  className={`block rounded-lg px-4 py-2.5 text-base font-medium transition-colors ${
                    isActivePath('/equipment')
                      ? 'bg-[#E1BC56]/10 text-[#E1BC56]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  Equipment
                </Link>
                <Link
                  href="/about"
                  className={`block rounded-lg px-4 py-2.5 text-base font-medium transition-colors ${
                    isActivePath('/about')
                      ? 'bg-[#E1BC56]/10 text-[#E1BC56]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className={`block rounded-lg px-4 py-2.5 text-base font-medium transition-colors ${
                    isActivePath('/contact')
                      ? 'bg-[#E1BC56]/10 text-[#E1BC56]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  Contact
                </Link>
                <Link
                  href="/safety"
                  className={`block rounded-lg px-4 py-2.5 text-base font-medium transition-colors ${
                    isActivePath('/safety')
                      ? 'bg-[#E1BC56]/10 text-[#E1BC56]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  Safety
                </Link>
                <Link
                  href="/insurance"
                  className={`block rounded-lg px-4 py-2.5 text-base font-medium transition-colors ${
                    isActivePath('/insurance')
                      ? 'bg-[#E1BC56]/10 text-[#E1BC56]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  Insurance
                </Link>

                {/* Mobile CTA */}
                <Link
                  href="/book"
                  className="btn-premium-gold mt-2 block rounded-lg px-4 py-3 text-center text-base font-semibold"
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  Book Now
                </Link>

                {/* Mobile Contact */}
                <a
                  href="tel:+15066431575"
                  className="mt-2 flex items-center justify-center space-x-2 rounded-lg bg-gray-50 px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span>(506) 643-1575</span>
                </a>

                {/* Mobile Authentication */}
                {user ? (
                  <div className="mt-4 space-y-1 border-t border-gray-100 pt-4">
                    <div className="mb-2 flex items-center rounded-lg bg-gray-50 px-4 py-3">
                      <div className="relative mr-3 h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-[#E1BC56] to-[#d4af4a]">
                        {user.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="font-semibold text-gray-900">
                              {user.user_metadata?.firstName?.charAt(0) ||
                                user.email?.charAt(0).toUpperCase() ||
                                'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {user.user_metadata?.firstName || 'User'}
                        </p>
                        <p className="truncate text-xs text-gray-500">{user.email || 'No email'}</p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block rounded-lg px-4 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {/* Admin Dashboard link - only show for admin and super_admin */}
                    {role && (role === 'admin' || role === 'super_admin') && (
                      <Link
                        href="/admin/dashboard"
                        className="block rounded-lg px-4 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="block rounded-lg px-4 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full rounded-lg px-4 py-2.5 text-left text-base font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                    <button
                      onClick={() => {
                        router.push('/auth/signin');
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full rounded-lg px-4 py-2.5 text-center text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        router.push('/auth/signin');
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full rounded-lg bg-gray-900 px-4 py-2.5 text-center text-base font-medium text-white transition-colors hover:bg-gray-800"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Spin Wheel Modal */}
      <SpinWheel isOpen={isSpinWheelOpen} onClose={closeSpinWheel} onWin={handleSpinWheelWin} />
    </>
  );
}
