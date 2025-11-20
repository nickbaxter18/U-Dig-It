'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function ContactPage() {
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What are your rental rates?',
      answer:
        'Our Kubota SVL-75 compact track loader rents for $450/day, with discounts for weekly ($2,500) and monthly ($8,000) rentals. Delivery and pickup are included within 50km of Saint John. Contact us for a detailed quote!',
    },
    {
      question: 'Do you deliver and pick up?',
      answer:
        "Yes! We provide free delivery and pickup within 50km of Saint John, including Rothesay, Quispamsis, and Hampton. For locations beyond 50km, a small delivery fee may apply. We'll bring the equipment right to your driveway!",
    },
    {
      question: "What if I've never operated heavy equipment?",
      answer:
        "No problem! We provide basic operation training with every rental. We'll walk you through all the controls, safety features, and best practices. Most customers are comfortable operating the equipment within 15-20 minutes. We're also just a phone call away if you need help!",
    },
    {
      question: "What's your cancellation policy?",
      answer:
        'We understand plans change. Cancel up to 48 hours before your rental start time for a full refund. Cancellations within 48 hours are subject to a 50% cancellation fee. Weather-related cancellations are handled case-by-case.',
    },
    {
      question: 'Do you require a deposit?',
      answer:
        "Yes, we require a $500 refundable security deposit, which is returned within 48 hours after equipment return, provided there's no damage. Payment can be made via credit card, debit, or e-transfer.",
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards (Visa, Mastercard, Amex), debit cards, e-transfer, and cash. Payment is due at the time of delivery. We also offer flexible payment plans for longer rentals.',
    },
    {
      question: 'Is insurance included?',
      answer:
        "Yes! Our equipment is fully insured. We recommend checking with your homeowner's insurance about coverage for equipment operation on your property. We can provide insurance documentation if needed.",
    },
    {
      question: "What's included with the rental?",
      answer:
        'Every rental includes: the Kubota SVL-75 with full fuel tank, basic operation training, safety instructions, delivery and pickup (within 50km), 24/7 emergency support, and comprehensive insurance coverage.',
    },
  ];

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

          {/* Multiple Logo Watermarks - SEO Optimized for Contact Page - Responsive */}
          <div className="pointer-events-none absolute inset-0">
            {/* Desktop Watermarks - Original (hidden on mobile) */}
            <div className="hidden md:block">
              <div className="absolute left-12 top-8 rotate-[8deg] opacity-10">
                <div className="relative h-56 w-56">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="U-Dig It Rentals - Contact Us Saint John NB Equipment Rental"
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
                    alt="Equipment Rental Customer Service Logo - Call 506-643-1575"
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
                    alt="24/7 Equipment Rental Support Saint John - U-Dig It Rentals"
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
                    alt="Get a Quote for Equipment Rental New Brunswick - U-Dig It"
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
                    alt="Responsive Equipment Rental Service - U-Dig It Contact Team"
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
                    alt="Kubota Equipment Questions Answered - U-Dig It Rentals Help"
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
                    alt="Book Equipment Rental Online Saint John - U-Dig It Contact"
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
                    alt="Equipment Rental Inquiries Welcome - U-Dig It Customer Service"
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
                    alt="Free Equipment Rental Consultation Saint John NB - U-Dig It"
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

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
            <div className="headline-3d text-center">
              <div className="mb-6 inline-block">
                <span className="rounded-full border border-[#E1BC56]/30 bg-[#E1BC56]/20 px-6 py-2 text-sm font-semibold tracking-wide text-[#E1BC56] backdrop-blur-sm">
                  WE'RE HERE TO HELP
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                Ready to{' '}
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Start Your Project?
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-200 md:text-2xl">
                Get in touch with Saint John's trusted equipment rental experts. We respond within 2
                hours!
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href="tel:+15066431575"
                  className="inline-flex transform items-center gap-2 rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-10 py-4 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Call (506) 643-1575
                </a>
                <Link
                  href="/book"
                  className="transform rounded-lg border-2 border-white bg-white/10 px-10 py-4 text-lg font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-gray-900"
                >
                  Book Equipment Now
                </Link>
              </div>
              <p className="mt-6 text-sm text-gray-300">
                📞 Available 7 days a week • ⚡ Same-day delivery available • ✓ No hidden fees
              </p>
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
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">2hrs</div>
                <div className="text-sm text-gray-600">Average Response Time</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">500+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">4.9★</div>
                <div className="text-sm text-gray-600">Customer Rating</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">24/7</div>
                <div className="text-sm text-gray-600">Emergency Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Contact Cards */}
        <div className="bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Phone Card */}
              <a
                href="tel:+15066431575"
                className="group transform rounded-xl border-t-4 border-[#E1BC56] bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E1BC56] to-[#d4af4a] transition-transform group-hover:scale-110">
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
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-gray-900">📞 Call Us</h3>
                <p className="mb-2 text-xl font-bold text-[#A90F0F]">(506) 643-1575</p>
                <p className="mb-3 text-sm text-gray-600">Available 7 days a week</p>
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Mon-Fri:</span>
                    <span className="font-medium">7AM-7PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sat:</span>
                    <span className="font-medium">8AM-6PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sun:</span>
                    <span className="font-medium">9AM-5PM</span>
                  </div>
                </div>
              </a>

              {/* Email Card */}
              <a
                href="mailto:info@udigit.ca"
                className="group transform rounded-xl border-t-4 border-[#A90F0F] bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A90F0F] to-[#7a0b0b] transition-transform group-hover:scale-110">
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
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-gray-900">📧 Email Us</h3>
                <p className="mb-2 break-all text-lg font-bold text-[#A90F0F]">info@udigit.ca</p>
                <p className="mb-3 text-sm text-gray-600">We respond within 2 hours</p>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Fastest response time in Saint John
                  </p>
                </div>
              </a>

              {/* Location Card */}
              <div className="rounded-xl border-t-4 border-[#E1BC56] bg-white p-8 shadow-lg transition-all hover:shadow-2xl">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E1BC56] to-[#d4af4a]">
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
                <h3 className="mb-2 text-2xl font-bold text-gray-900">📍 Visit Us</h3>
                <p className="mb-1 font-medium text-gray-900">945 Golden Grove Road</p>
                <p className="mb-3 font-medium text-gray-900">Saint John, NB</p>
                <p className="mb-3 text-sm text-gray-600">Serving 50km radius</p>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm font-medium text-blue-800">
                    ✓ Free delivery & pickup included
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              {/* Contact Form */}
              <div>
                <ContactForm />

                {/* What Happens Next */}
                <div className="mt-8 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
                  <h3 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    What Happens Next?
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        step: '1',
                        title: 'We receive your message',
                        desc: 'Instantly delivered to our team',
                        icon: '📨',
                      },
                      {
                        step: '2',
                        title: 'Quick response',
                        desc: 'We reply within 2 hours (usually faster!)',
                        icon: '⚡',
                      },
                      {
                        step: '3',
                        title: 'Free consultation',
                        desc: 'Discuss your project needs',
                        icon: '💬',
                      },
                      {
                        step: '4',
                        title: 'Get a quote',
                        desc: 'Transparent, no-obligation pricing',
                        icon: '💰',
                      },
                      {
                        step: '5',
                        title: 'Book & schedule',
                        desc: 'Choose your dates',
                        icon: '📅',
                      },
                      {
                        step: '6',
                        title: 'We deliver',
                        desc: 'Equipment arrives on time',
                        icon: '🚚',
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-1 font-semibold text-gray-900">
                            {item.icon} {item.title}
                          </h4>
                          <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - FAQ & Additional Info */}
              <div className="space-y-8">
                {/* FAQ Section */}
                <div className="rounded-xl bg-white p-8 shadow-lg">
                  <h3 className="mb-6 text-2xl font-bold text-gray-900">
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-4">
                    {faqs.map((faq: unknown, index: unknown) => (
                      <div
                        key={index}
                        className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                      >
                        <button
                          onClick={() => setSelectedFaq(selectedFaq === index ? null : index)}
                          className="flex w-full items-center justify-between gap-4 py-2 text-left transition-colors hover:text-[#A90F0F]"
                        >
                          <span className="font-semibold text-gray-900">{faq.question}</span>
                          <svg
                            className={`h-5 w-5 flex-shrink-0 transition-transform ${selectedFaq === index ? 'rotate-180' : ''}`}
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
                        {selectedFaq === index && (
                          <div className="mt-3 text-sm leading-relaxed text-gray-600">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency Support */}
                <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-600">
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 text-xl font-bold text-gray-900">
                        24/7 Emergency Support
                      </h3>
                      <p className="mb-4 text-gray-700">
                        Equipment issue during your rental? We're here to help anytime, day or
                        night.
                      </p>
                      <a
                        href="tel:+15066431575"
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition-colors hover:bg-red-700"
                      >
                        <svg
                          className="h-5 w-5"
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
                        Call Emergency Line
                      </a>
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="rounded-xl bg-white p-8 shadow-lg">
                  <h3 className="mb-6 text-xl font-bold text-gray-900">
                    Why Choose U-Dig It Rentals?
                  </h3>
                  <div className="space-y-4">
                    {[
                      { icon: '✓', text: 'Fully Licensed & Insured', color: 'text-green-600' },
                      { icon: '✓', text: '500+ Successful Projects', color: 'text-green-600' },
                      { icon: '✓', text: '4.9★ Customer Rating', color: 'text-green-600' },
                      { icon: '✓', text: 'Same-Day Delivery Available', color: 'text-green-600' },
                      {
                        icon: '✓',
                        text: 'Professional Training Included',
                        color: 'text-green-600',
                      },
                      { icon: '✓', text: 'Local Family-Owned Business', color: 'text-green-600' },
                    ].map((item: unknown, index: unknown) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className={`text-2xl ${item.color}`}>{item.icon}</span>
                        <span className="text-gray-700">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Service Area Map Section */}
            <div className="mt-16">
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                  Our Service Area
                </h2>
                <p className="text-xl text-gray-600">
                  We deliver throughout the Greater Saint John area and beyond
                </p>
              </div>

              {/* Service Areas Grid */}
              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {[
                  'Saint John',
                  'Rothesay',
                  'Quispamsis',
                  'Grand Bay-Westfield',
                  'Hampton',
                  'Kingston Peninsula',
                  'St. Martins',
                  'Sussex',
                  'Moncton',
                  'Fredericton',
                  'Miramichi',
                  'Other Areas',
                ].map((area) => (
                  <div
                    key={area}
                    className="rounded-lg border-t-2 border-[#E1BC56] bg-white p-4 text-center shadow-md transition-shadow hover:shadow-xl"
                  >
                    <div className="mb-2 text-2xl">📍</div>
                    <h3 className="text-sm font-semibold text-gray-900">{area}</h3>
                  </div>
                ))}
              </div>

              {/* Delivery Info */}
              <div className="rounded-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-8">
                <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3">
                  <div>
                    <div className="mb-2 text-4xl">🚚</div>
                    <h4 className="mb-2 font-bold text-gray-900">Free Delivery</h4>
                    <p className="text-sm text-gray-600">Within 50km of Saint John</p>
                  </div>
                  <div>
                    <div className="mb-2 text-4xl">⚡</div>
                    <h4 className="mb-2 font-bold text-gray-900">Same-Day Available</h4>
                    <p className="text-sm text-gray-600">Book before 10 AM</p>
                  </div>
                  <div>
                    <div className="mb-2 text-4xl">📞</div>
                    <h4 className="mb-2 font-bold text-gray-900">Custom Delivery</h4>
                    <p className="text-sm text-gray-600">Call for special arrangements</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="relative mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-[#E1BC56] via-[#d4af4a] to-[#A90F0F] p-12 text-center">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative">
                <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                  Still Have Questions?
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90">
                  We're here to help! Give us a call or send a message and we'll get back to you
                  right away.
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <a
                    href="tel:+15066431575"
                    className="inline-flex transform items-center justify-center gap-2 rounded-lg bg-white px-10 py-4 text-lg font-bold text-[#A90F0F] shadow-xl transition-all hover:scale-105 hover:bg-gray-100"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Call Now
                  </a>
                  <Link
                    href="/book"
                    className="transform rounded-lg border-2 border-white bg-[#A90F0F] px-10 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-[#8a0c0c]"
                  >
                    Book Equipment
                  </Link>
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
