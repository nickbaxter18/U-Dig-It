'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const hour = currentTime.getHours();
    const isBusinessHours = hour >= 7 && hour < 18;
    setIsOpen(isBusinessHours);

    return () => clearInterval(timer);
  }, [currentTime]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="hover:shadow-3xl back-to-top-btn group fixed bottom-6 right-6 z-50 transform rounded-full bg-gradient-to-r from-[#E1BC56] to-[#d4af4a] p-3 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:from-[#d4af4a] hover:to-[#E1BC56]"
        aria-label="Back to top"
      >
        <svg
          className="h-6 w-6 transition-transform group-hover:-translate-y-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>

      <footer className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        {/* Premium Gold Accent Strip at Top */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute left-10 top-10 h-32 w-32 animate-pulse rounded-full bg-[#E1BC56] blur-3xl"></div>
          <div className="absolute bottom-10 right-10 h-48 w-48 animate-pulse rounded-full bg-blue-500 blur-3xl delay-1000"></div>
          <div className="absolute left-1/2 top-1/2 h-24 w-24 animate-pulse rounded-full bg-green-500 blur-2xl delay-500"></div>
        </div>

        {/* Main Footer Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Premium Header Section */}
          <div className="border-b border-gray-700/50 py-16">
            <div className="mb-12 text-center">
              <h2 className="mb-4 bg-gradient-to-r from-white via-[#E1BC56] to-white bg-clip-text text-4xl font-bold text-transparent">
                Ready to Get Started?
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-300">
                Join hundreds of satisfied customers who trust U-Dig It Rentals for professional
                equipment and exceptional service.
              </p>
            </div>

            <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Trust Signals */}
              <div className="footer-trust-card rounded-2xl border border-gray-600/30 bg-gradient-to-r from-gray-800/50 to-gray-700/50 p-8 backdrop-blur-sm">
                <h3 className="mb-6 text-2xl font-bold text-[#E1BC56]">Why Choose Us?</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="group text-center">
                    <div className="footer-trust-icon mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#E1BC56] to-[#d4af4a] transition-transform duration-300 group-hover:scale-110">
                      <svg
                        className="h-8 w-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="mb-1 font-semibold">Fully Licensed</h4>
                    <p className="text-sm text-gray-400">NB Business License</p>
                  </div>
                  <div className="group text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110">
                      <svg
                        className="h-8 w-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <h4 className="mb-1 font-semibold">$120K Insurance</h4>
                    <p className="text-sm text-gray-400">Full Coverage</p>
                  </div>
                  <div className="group text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 transition-transform duration-300 group-hover:scale-110">
                      <svg
                        className="h-8 w-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h4 className="mb-1 font-semibold">Quality Equipment</h4>
                    <p className="text-sm text-gray-400">Well Maintained</p>
                  </div>
                  <div className="group text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110">
                      <svg
                        className="h-8 w-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="mb-1 font-semibold">24/7 Support</h4>
                    <p className="text-sm text-gray-400">Always Available</p>
                  </div>
                </div>
              </div>

              {/* Live Status & Contact */}
              <div className="footer-contact-card rounded-2xl border border-gray-600/30 bg-gradient-to-r from-gray-800/50 to-gray-700/50 p-8 backdrop-blur-sm">
                <h3 className="mb-6 text-2xl font-bold text-[#E1BC56]">Contact Information</h3>

                {/* Live Status */}
                <div className="mb-6 flex items-center">
                  <div
                    className={`mr-3 h-3 w-3 rounded-full ${isOpen ? 'animate-pulse bg-green-500' : 'bg-red-500'}`}
                  ></div>
                  <span className="text-lg font-semibold">
                    {isOpen ? 'Open Now' : 'Closed'} -{' '}
                    {isOpen ? '7:00 AM - 6:00 PM' : 'Opens at 7:00 AM'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="group flex items-center">
                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E1BC56] to-[#d4af4a] transition-transform duration-300 group-hover:scale-110">
                      <svg
                        className="h-6 w-6 text-white"
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
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Call Us</p>
                      <a
                        href="tel:+15066431575"
                        className="text-xl font-semibold transition-colors hover:text-[#E1BC56]"
                      >
                        (506) 643-1575
                      </a>
                    </div>
                  </div>

                  <div className="group flex items-center">
                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email Us</p>
                      <a
                        href="mailto:info@udigit.ca"
                        className="text-xl font-semibold transition-colors hover:text-[#E1BC56]"
                      >
                        info@udigit.ca
                      </a>
                    </div>
                  </div>

                  <div className="group flex items-center">
                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 transition-transform duration-300 group-hover:scale-110">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Location</p>
                      <p className="text-xl font-semibold">Saint John, NB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <nav>
                  <Link
                    href="/book"
                    className="btn-premium-gold inline-flex items-center gap-2 rounded-lg px-7 py-3.5 font-bold"
                    style={{ animationDelay: '1s' }}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Book Equipment Now
                  </Link>
                </nav>
                <a
                  href="tel:+15066431575"
                  className="flex transform items-center gap-2 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 px-8 py-4 font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-gray-600 hover:to-gray-500 hover:shadow-2xl"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Call (506) 643-1575
                </a>
              </div>
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="py-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Company Info */}
              <div className="lg:col-span-2">
                <Link href="/" className="group mb-6 flex w-fit items-center">
                  <div className="relative mr-4 h-16 w-16 transition-transform group-hover:scale-110">
                    <Image
                      src="/images/udigit-logo.png"
                      alt="U-Dig It Rentals Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-2xl font-bold transition-colors group-hover:text-[#E1BC56]">
                    U-Dig It Rentals
                  </span>
                </Link>
                <p className="mb-6 max-w-md text-lg leading-relaxed text-gray-300">
                  Professional Kubota SVL-75 equipment rental in Saint John, New Brunswick. Reliable
                  service for construction, landscaping, and excavation projects.
                </p>

                {/* Social Media */}
                <div className="mb-6 flex space-x-4">
                  <a
                    href="https://www.facebook.com/udigitrentals"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 transition-transform duration-300 hover:scale-110"
                  >
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/udigitrentals"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 transition-transform duration-300 hover:scale-110"
                  >
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.twitter.com/udigitrentals"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-500 transition-transform duration-300 hover:scale-110"
                  >
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.youtube.com/@udigitrentals"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 transition-transform duration-300 hover:scale-110"
                  >
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="mb-6 text-xl font-bold text-[#E1BC56]">Quick Links</h3>
                <ul className="space-y-3">
                  <li className="footer-link-item" style={{ animationDelay: '0.1s' }}>
                    <Link
                      href="/"
                      className="group flex items-center text-gray-300 transition-colors hover:text-[#E1BC56]"
                    >
                      <svg
                        className="mr-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      Home
                    </Link>
                  </li>
                  <li className="footer-link-item" style={{ animationDelay: '0.2s' }}>
                    <Link
                      href="/equipment"
                      className="group flex items-center text-gray-300 transition-colors hover:text-[#E1BC56]"
                    >
                      <svg
                        className="mr-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      Equipment
                    </Link>
                  </li>
                  <li className="footer-link-item" style={{ animationDelay: '0.3s' }}>
                    <Link
                      href="/book"
                      className="group flex items-center text-gray-300 transition-colors hover:text-[#E1BC56]"
                    >
                      <svg
                        className="mr-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      Book Now
                    </Link>
                  </li>
                  <li className="footer-link-item" style={{ animationDelay: '0.4s' }}>
                    <Link
                      href="/about"
                      className="group flex items-center text-gray-300 transition-colors hover:text-[#E1BC56]"
                    >
                      <svg
                        className="mr-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      About Us
                    </Link>
                  </li>
                  <li className="footer-link-item" style={{ animationDelay: '0.5s' }}>
                    <Link
                      href="/contact"
                      className="group flex items-center text-gray-300 transition-colors hover:text-[#E1BC56]"
                    >
                      <svg
                        className="mr-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      Contact
                    </Link>
                  </li>
                  <li className="footer-link-item" style={{ animationDelay: '0.6s' }}>
                    <Link
                      href="/support"
                      className="group flex items-center text-gray-300 transition-colors hover:text-[#E1BC56]"
                    >
                      <svg
                        className="mr-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      Support
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Service Areas */}
              <div>
                <h3 className="mb-6 text-xl font-bold text-[#E1BC56]">Service Areas</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300">
                    <svg
                      className="mr-2 h-4 w-4 text-[#E1BC56]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Saint John
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg
                      className="mr-2 h-4 w-4 text-[#E1BC56]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Rothesay
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg
                      className="mr-2 h-4 w-4 text-[#E1BC56]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Quispamsis
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg
                      className="mr-2 h-4 w-4 text-[#E1BC56]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Grand Bay-Westfield
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg
                      className="mr-2 h-4 w-4 text-[#E1BC56]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Hampton
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg
                      className="mr-2 h-4 w-4 text-[#E1BC56]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Other Areas
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700/50 pb-8 pt-8">
            <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">

              {/* Copyright */}
              <div className="text-center lg:text-left">
                <p className="text-sm text-gray-400">
                  © 2025 U-Dig It Rentals Inc. All rights reserved.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Professional equipment rental in Saint John, NB
                </p>
              </div>

              {/* Essential Links */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/terms"
                  className="text-sm text-gray-400 transition-colors hover:text-[#E1BC56]"
                >
                  Terms
                </Link>
                <span className="text-gray-700">•</span>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-400 transition-colors hover:text-[#E1BC56]"
                >
                  Privacy
                </Link>
                <span className="text-gray-700">•</span>
                <Link
                  href="/safety"
                  className="text-sm text-gray-400 transition-colors hover:text-[#E1BC56]"
                >
                  Safety
                </Link>
                <span className="text-gray-700">•</span>
                <Link
                  href="/blog"
                  className="text-sm text-gray-400 transition-colors hover:text-[#E1BC56]"
                >
                  Blog
                </Link>
                <span className="text-gray-700">•</span>
                <Link
                  href="/faq"
                  className="text-sm text-gray-400 transition-colors hover:text-[#E1BC56]"
                >
                  FAQ
                </Link>
                <span className="text-gray-700">•</span>
                <Link
                  href="/sitemap-page"
                  className="text-sm text-gray-400 transition-colors hover:text-[#E1BC56]"
                >
                  All Pages
                </Link>
              </div>

              {/* Support Contact */}
              <a
                href="tel:+15066431575"
                className="group flex items-center gap-2 rounded-lg border-2 border-green-500/50 bg-green-950/30 px-4 py-2 transition-all hover:border-green-500 hover:bg-green-950/50"
              >
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs font-medium text-green-400">Support</div>
                  <div className="text-sm font-bold text-white">(506) 643-1575</div>
                </div>
              </a>

            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
