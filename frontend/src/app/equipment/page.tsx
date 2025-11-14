'use client';

import { EquipmentSearch } from '@/components/EquipmentSearch';
import EquipmentShowcase from '@/components/EquipmentShowcase';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function EquipmentPage() {
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

          {/* Multiple Logo Watermarks - SEO Optimized for Equipment Page - Responsive */}
          <div className="pointer-events-none absolute inset-0">
            {/* Desktop Watermarks - Original (hidden on mobile) */}
            <div className="hidden md:block">
              <div className="absolute left-12 top-8 rotate-[8deg] opacity-10">
                <div className="relative h-56 w-56">
                  <Image src="/images/udigit-logo.png" alt="U-Dig It Rentals - Professional Equipment Rental Saint John NB" fill className="object-contain" sizes="56px" unoptimized />
                </div>
              </div>
              <div className="absolute right-16 top-12 rotate-[-10deg] opacity-10">
                <div className="relative h-60 w-60">
                  <Image src="/images/udigit-logo.png" alt="Kubota Equipment Rental Saint John - Professional Track Loaders" fill className="object-contain" sizes="60px" unoptimized />
                </div>
              </div>
              <div className="absolute left-[15%] top-[22%] rotate-[-6deg] opacity-10">
                <div className="relative h-48 w-48">
                  <Image src="/images/udigit-logo.png" alt="Heavy Equipment Rental New Brunswick - Construction Machinery" fill className="object-contain" sizes="48px" unoptimized />
                </div>
              </div>
              <div className="absolute right-[18%] top-[24%] rotate-[12deg] opacity-10">
                <div className="relative h-52 w-52">
                  <Image src="/images/udigit-logo.png" alt="Skid Steer Rental Saint John - Compact Track Loaders" fill className="object-contain" sizes="52px" unoptimized />
                </div>
              </div>
              <div className="absolute right-0 top-[45%] translate-x-[35%] rotate-[15deg] transform opacity-10">
                <div className="relative h-80 w-80">
                  <Image src="/images/udigit-logo.png" alt="Excavation Equipment Rental New Brunswick - Professional Service" fill className="object-contain" sizes="80px" unoptimized />
                </div>
              </div>
              <div className="absolute left-0 top-[48%] -translate-x-[35%] rotate-[-12deg] transform opacity-10">
                <div className="relative h-76 w-76">
                  <Image src="/images/udigit-logo.png" alt="Construction Equipment Rental Saint John - Kubota SVL-75" fill className="object-contain" sizes="76px" unoptimized />
                </div>
              </div>
              <div className="absolute bottom-[12%] left-[20%] rotate-[4deg] opacity-10">
                <div className="relative h-44 w-44">
                  <Image src="/images/udigit-logo.png" alt="Equipment Rental Solutions Saint John - Professional Service" fill className="object-contain" sizes="44px" unoptimized />
                </div>
              </div>
              <div className="absolute bottom-[10%] right-[22%] rotate-[-7deg] opacity-10">
                <div className="relative h-48 w-48">
                  <Image src="/images/udigit-logo.png" alt="Heavy Machinery Rental New Brunswick - U-Dig It Logo" fill className="object-contain" sizes="48px" unoptimized />
                </div>
              </div>
              <div className="absolute left-[30%] top-[11%] rotate-[5deg] opacity-10">
                <div className="relative h-40 w-40">
                  <Image src="/images/udigit-logo.png" alt="Professional Equipment Rental - U-Dig It Family Business" fill className="object-contain" sizes="40px" unoptimized />
                </div>
              </div>
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
                  PROFESSIONAL EQUIPMENT
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Premium Kubota
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Equipment Fleet
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Professional-grade Kubota SVL-75 compact track loaders. Powerful, reliable, and
                ready for your next construction or landscaping project.
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

        {/* Trust Bar */}
        <div className="border-b border-gray-200 bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">1</div>
                <div className="text-sm text-gray-600">Premium Equipment</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">500+</div>
                <div className="text-sm text-gray-600">Successful Rentals</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">4.9★</div>
                <div className="text-sm text-gray-600">Customer Rating</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">24/7</div>
                <div className="text-sm text-gray-600">Support Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Showcase Section - Fixed Background & Contrast */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white pt-8">
          {/* Subtle background pattern to match hero section */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, #E1BC56 1px, transparent 0)',
                backgroundSize: '48px 48px',
              }}
            ></div>
          </div>

          {/* Equipment Showcase with proper contrast */}
          <div className="relative pb-16">
            <EquipmentShowcase />
          </div>
        </div>

        {/* Equipment Search Section */}
        <div className="mx-auto mt-24 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Browse Our Equipment Fleet</h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-600">
              Search and filter through our complete inventory of professional-grade Kubota
              equipment. Find the perfect machine for your project with detailed specifications,
              availability, and pricing.
            </p>
          </div>

          <EquipmentSearch />
        </div>

        <Footer />
      </div>
    </>
  );
}
