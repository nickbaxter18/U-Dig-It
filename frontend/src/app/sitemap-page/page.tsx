'use client';

import {
  Award,
  BookOpen,
  Calendar,
  FileText,
  HelpCircle,
  Home,
  Info,
  Lock,
  Mail,
  Map,
  Newspaper,
  Phone,
  Settings,
  Shield,
  TrendingUp,
  User,
  Wrench,
} from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function SitemapPage() {
  const siteStructure = {
    main: [
      { name: 'Home', href: '/', description: 'Welcome to U-Dig It Rentals', icon: Home },
      {
        name: 'Equipment',
        href: '/equipment',
        description: 'Browse our Kubota SVL-75 fleet',
        icon: Wrench,
      },
      {
        name: 'Book Now',
        href: '/book',
        description: 'Start your rental booking',
        icon: Calendar,
      },
      {
        name: 'About Us',
        href: '/about',
        description: 'Our story and mission',
        icon: Info,
      },
      {
        name: 'Contact',
        href: '/contact',
        description: 'Get in touch with our team',
        icon: Mail,
      },
    ],
    resources: [
      {
        name: 'Blog & Guides',
        href: '/blog',
        description: 'Expert tips, safety guides, and local regulations',
        icon: Newspaper,
      },
      {
        name: 'Monthly Contest',
        href: '/contest',
        description: 'Enter to win a machine + operator package',
        icon: Award,
      },
      {
        name: 'Contest Rules',
        href: '/contest/rules',
        description: 'Official rules and eligibility requirements',
        icon: FileText,
      },
    ],
    account: [
      {
        name: 'Sign In',
        href: '/auth/signin',
        description: 'Access your account',
        icon: User,
      },
      {
        name: 'Sign Up',
        href: '/auth/signup',
        description: 'Create a new account',
        icon: User,
      },
      {
        name: 'Dashboard',
        href: '/dashboard',
        description: 'View your bookings and activity',
        icon: TrendingUp,
      },
      {
        name: 'Profile',
        href: '/profile',
        description: 'Manage your personal information',
        icon: Settings,
      },
    ],
    policies: [
      {
        name: 'Terms of Service',
        href: '/terms',
        description: 'Rental terms and conditions',
        icon: FileText,
      },
      {
        name: 'Privacy Policy',
        href: '/privacy',
        description: 'How we protect your data',
        icon: Lock,
      },
      {
        name: 'Cookie Policy',
        href: '/cookies',
        description: 'How we use cookies and tracking',
        icon: Shield,
      },
      {
        name: 'Accessibility Statement',
        href: '/accessibility',
        description: 'Our commitment to accessibility',
        icon: Shield,
      },
      {
        name: 'Imprint / Legal Notice',
        href: '/imprint',
        description: 'Company and legal information',
        icon: FileText,
      },
      {
        name: 'Disclaimer',
        href: '/disclaimer',
        description: 'Liability and legal disclaimers',
        icon: Shield,
      },
      {
        name: 'Spin to Win Terms',
        href: '/spin-to-win-terms',
        description: 'Promotion rules and probabilities',
        icon: TrendingUp,
      },
      {
        name: 'Equipment Rider',
        href: '/equipment-rider',
        description: 'SVL75-3 specific terms and operating limits',
        icon: FileText,
      },
    ],
    support: [
      {
        name: 'Support Center',
        href: '/support',
        description: 'Get help with your rental',
        icon: HelpCircle,
      },
      {
        name: 'FAQ',
        href: '/faq',
        description: 'Frequently asked questions',
        icon: BookOpen,
      },
      {
        name: 'Safety Guidance',
        href: '/safety',
        description: 'Operator safety & best practices',
        icon: Shield,
      },
      {
        name: 'Insurance Guide',
        href: '/insurance',
        description: 'How to get insurance coverage',
        icon: Shield,
      },
    ],
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
                    alt="U-Dig It Rentals - Site Navigation Saint John NB"
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
                    alt="Equipment Rental Site Map - U-Dig It Pages"
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
                    alt="All Rental Pages Directory - U-Dig It Navigation"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 32px, 48px"
                    unoptimized
                  />
                </div>
              </div>

              {/* Upper Right */}
              <div className="absolute right-[18%] top-[24%] rotate-[12deg] opacity-10">
                <div className="relative h-52 w-52">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Website Directory - U-Dig It Logo"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 36px, 52px"
                    unoptimized
                  />
                </div>
              </div>

              {/* Center Right */}
              <div className="absolute right-0 top-[45%] translate-x-[35%] rotate-[15deg] transform opacity-10">
                <div className="relative h-80 w-80">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Complete Site Navigation - U-Dig It Sitemap"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 60px, 80px"
                    unoptimized
                  />
                </div>
              </div>

              {/* Center Left */}
              <div className="absolute left-0 top-[48%] -translate-x-[35%] rotate-[-12deg] transform opacity-10">
                <div className="w-76 h-76 relative">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Browse All Pages - U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 56px, 76px"
                    unoptimized
                  />
                </div>
              </div>

              {/* Bottom Left */}
              <div className="absolute bottom-[12%] left-[20%] rotate-[4deg] opacity-10">
                <div className="relative h-44 w-44">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Site Index Saint John - U-Dig It Pages"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 32px, 44px"
                    unoptimized
                  />
                </div>
              </div>

              {/* Bottom Right */}
              <div className="absolute bottom-[10%] right-[22%] rotate-[-7deg] opacity-10">
                <div className="relative h-48 w-48">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Page Directory - U-Dig It Logo"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 36px, 48px"
                    unoptimized
                  />
                </div>
              </div>

              {/* Upper center */}
              <div className="absolute left-[30%] top-[11%] rotate-[5deg] opacity-10">
                <div className="relative h-40 w-40">
                  <Image
                    src="/images/udigit-logo.png"
                    alt="Website Navigation - U-Dig It Rentals"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 28px, 40px"
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
                  SITE NAVIGATION
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Policies &
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Pages
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Easy access to all pages, policies, and resources in one place.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  Book Equipment Now
                </Link>
                <a
                  href="tel:+15066431575"
                  className="transform rounded-lg border-2 border-white bg-white/10 px-8 py-4 text-lg font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-gray-900"
                >
                  📞 (506) 643-1575
                </a>
              </div>
            </div>
          </div>

          {/* Premium Gold Bottom Border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        </div>

        {/* Main Content */}
        <div className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Quick Navigation Grid */}
            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
              <Link
                href="#main-pages"
                className="group rounded-lg border-2 border-[#E1BC56] bg-white p-6 text-center transition-all hover:border-[#D4A843] hover:shadow-lg"
              >
                <Map className="mx-auto mb-3 h-12 w-12 text-[#E1BC56] transition-colors group-hover:text-[#D4A843]" />
                <h3 className="text-lg font-bold text-gray-900">Main Pages</h3>
                <p className="mt-2 text-sm text-gray-600">Navigate core site pages</p>
              </Link>

              <Link
                href="#resources"
                className="group rounded-lg border-2 border-[#E1BC56] bg-white p-6 text-center transition-all hover:border-[#D4A843] hover:shadow-lg"
              >
                <Newspaper className="mx-auto mb-3 h-12 w-12 text-[#E1BC56] transition-colors group-hover:text-[#D4A843]" />
                <h3 className="text-lg font-bold text-gray-900">Resources</h3>
                <p className="mt-2 text-sm text-gray-600">Blog & contests</p>
              </Link>

              <Link
                href="#account-pages"
                className="group rounded-lg border-2 border-[#A90F0F] bg-white p-6 text-center transition-all hover:border-[#8a0c0c] hover:shadow-lg"
              >
                <User className="mx-auto mb-3 h-12 w-12 text-[#A90F0F] transition-colors group-hover:text-[#8a0c0c]" />
                <h3 className="text-lg font-bold text-gray-900">Account</h3>
                <p className="mt-2 text-sm text-gray-600">Manage your account</p>
              </Link>

              <Link
                href="#policies"
                className="group rounded-lg border-2 border-[#E1BC56] bg-white p-6 text-center transition-all hover:border-[#D4A843] hover:shadow-lg"
              >
                <FileText className="mx-auto mb-3 h-12 w-12 text-[#E1BC56] transition-colors group-hover:text-[#D4A843]" />
                <h3 className="text-lg font-bold text-gray-900">Policies</h3>
                <p className="mt-2 text-sm text-gray-600">Legal & privacy documents</p>
              </Link>

              <Link
                href="#support"
                className="group rounded-lg border-2 border-[#A90F0F] bg-white p-6 text-center transition-all hover:border-[#8a0c0c] hover:shadow-lg"
              >
                <HelpCircle className="mx-auto mb-3 h-12 w-12 text-[#A90F0F] transition-colors group-hover:text-[#8a0c0c]" />
                <h3 className="text-lg font-bold text-gray-900">Support</h3>
                <p className="mt-2 text-sm text-gray-600">Get help and answers</p>
              </Link>
            </div>

            {/* Main Pages Section */}
            <div id="main-pages" className="mb-12 scroll-mt-20 rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#E1BC56] to-[#D4A843]">
                  <Map className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Main Pages</h2>
                  <p className="text-sm text-gray-600">Core website navigation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {siteStructure.main.map((page: unknown) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group flex items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-[#E1BC56] hover:bg-yellow-50"
                  >
                    <page.icon className="mt-1 h-6 w-6 flex-shrink-0 text-gray-400 transition-colors group-hover:text-[#E1BC56]" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">
                        {page.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">{page.description}</p>
                    </div>
                    <svg
                      className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-[#E1BC56]"
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
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources Section */}
            <div id="resources" className="mb-12 scroll-mt-20 rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#E1BC56] to-[#D4A843]">
                  <Newspaper className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Resources & Content</h2>
                  <p className="text-sm text-gray-600">Blog, guides, and monthly contests</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {siteStructure.resources.map((page: unknown) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group flex items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-[#E1BC56] hover:bg-yellow-50"
                  >
                    <page.icon className="mt-1 h-6 w-6 flex-shrink-0 text-gray-400 transition-colors group-hover:text-[#E1BC56]" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">
                        {page.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">{page.description}</p>
                    </div>
                    <svg
                      className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-[#E1BC56]"
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
                  </Link>
                ))}
              </div>
            </div>

            {/* Account Pages Section */}
            <div
              id="account-pages"
              className="mb-12 scroll-mt-20 rounded-lg bg-white p-8 shadow-lg"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#A90F0F] to-[#7a0b0b]">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Account Pages</h2>
                  <p className="text-sm text-gray-600">Sign in and manage your account</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {siteStructure.account.map((page: unknown) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group flex items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-[#A90F0F] hover:bg-red-50"
                  >
                    <page.icon className="mt-1 h-6 w-6 flex-shrink-0 text-gray-400 transition-colors group-hover:text-[#A90F0F]" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">
                        {page.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">{page.description}</p>
                    </div>
                    <svg
                      className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-[#A90F0F]"
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
                  </Link>
                ))}
              </div>
            </div>

            {/* Policies Section */}
            <div id="policies" className="mb-12 scroll-mt-20 rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#E1BC56] to-[#D4A843]">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Policies & Legal</h2>
                  <p className="text-sm text-gray-600">Terms, privacy, and compliance documents</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {siteStructure.policies.map((page: unknown) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group flex items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-[#E1BC56] hover:bg-yellow-50"
                  >
                    <page.icon className="mt-1 h-6 w-6 flex-shrink-0 text-gray-400 transition-colors group-hover:text-[#E1BC56]" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">
                        {page.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">{page.description}</p>
                    </div>
                    <svg
                      className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-[#E1BC56]"
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
                  </Link>
                ))}
              </div>
            </div>

            {/* Support Section */}
            <div id="support" className="mb-12 scroll-mt-20 rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#A90F0F] to-[#7a0b0b]">
                  <HelpCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Support & Help</h2>
                  <p className="text-sm text-gray-600">Get assistance and find answers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {siteStructure.support.map((page: unknown) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group flex items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-[#A90F0F] hover:bg-red-50"
                  >
                    <page.icon className="mt-1 h-6 w-6 flex-shrink-0 text-gray-400 transition-colors group-hover:text-[#A90F0F]" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">
                        {page.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">{page.description}</p>
                    </div>
                    <svg
                      className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-[#A90F0F]"
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
                  </Link>
                ))}
              </div>
            </div>

            {/* Service Areas */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#E1BC56] to-[#D4A843]">
                  <Map className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Service Areas</h2>
                  <p className="text-sm text-gray-600">Where we deliver equipment</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {[
                  { name: 'Saint John', slug: 'saint-john' },
                  { name: 'Rothesay', slug: 'rothesay' },
                  { name: 'Quispamsis', slug: 'quispamsis' },
                  { name: 'Grand Bay-Westfield', slug: 'grand-bay-westfield' },
                  { name: 'Hampton', slug: 'hampton' },
                  { name: 'Lorneville', slug: 'lorneville' },
                  { name: 'Martinon', slug: 'martinon' },
                  { name: 'Kingston Peninsula', slug: 'kingston-peninsula' },
                  { name: 'Barnesville', slug: 'barnesville' },
                  { name: 'Norton', slug: 'norton' },
                  { name: 'Sussex', slug: 'sussex' },
                  { name: 'Baxters Corner', slug: 'baxters-corner' },
                  { name: 'Saint Martins', slug: 'saint-martins' },
                  { name: 'Willow Grove', slug: 'willow-grove' },
                  { name: 'French Village', slug: 'french-village' },
                ].map((area) => (
                  <Link
                    key={area.slug}
                    href={`/service-areas/${area.slug}`}
                    className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-gray-50 p-3 transition-all hover:border-[#E1BC56] hover:bg-yellow-50 hover:shadow-md"
                  >
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-[#E1BC56]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{area.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="rounded-lg border-2 border-[#E1BC56] bg-gradient-to-br from-yellow-50 to-orange-50 p-8 shadow-lg">
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-3xl font-bold text-gray-900">Need Help?</h2>
                <p className="text-lg text-gray-600">
                  Can't find what you're looking for? We're here to help!
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#E1BC56] to-[#D4A843]">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-2 font-bold text-gray-900">Phone</h3>
                  <a
                    href="tel:+15066431575"
                    className="text-lg font-semibold text-[#A90F0F] hover:text-[#8a0c0c]"
                  >
                    (506) 643-1575
                  </a>
                  <p className="mt-1 text-sm text-gray-600">Mon-Sun 7:00am - 7:00pm</p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#A90F0F] to-[#7a0b0b]">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-2 font-bold text-gray-900">Email</h3>
                  <a
                    href="mailto:info@udigit.ca"
                    className="text-lg font-semibold text-[#A90F0F] hover:text-[#8a0c0c]"
                  >
                    info@udigit.ca
                  </a>
                  <p className="mt-1 text-sm text-gray-600">24-hour response time</p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#E1BC56] to-[#D4A843]">
                    <Map className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-2 font-bold text-gray-900">Location</h3>
                  <p className="text-sm text-gray-700">945 Golden Grove Road</p>
                  <p className="text-sm text-gray-700">Saint John, NB E2H 2X1</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-center text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  📅 Book Equipment Now
                </Link>
                <a
                  href="tel:+15066431575"
                  className="transform rounded-lg border-2 border-[#A90F0F] bg-white px-8 py-4 text-center text-lg font-bold text-[#A90F0F] shadow-xl transition-all hover:scale-105 hover:bg-[#A90F0F] hover:text-white"
                >
                  📞 Call (506) 643-1575
                </a>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
