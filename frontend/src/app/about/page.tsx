'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
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

          {/* Multiple Logo Watermarks - SEO Optimized for About Page - Responsive */}
          <div className="pointer-events-none absolute inset-0">
            {/* Desktop Watermarks - Original (hidden on mobile) */}
            <div className="hidden md:block">
              <div className="absolute left-12 top-8 rotate-[8deg] opacity-10"><div className="relative h-56 w-56"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals - Locally Owned Family Business Saint John NB" fill className="object-contain" sizes="56px" unoptimized /></div></div>
              <div className="absolute right-16 top-12 rotate-[-10deg] opacity-10"><div className="relative h-60 w-60"><Image src="/images/udigit-logo.png" alt="Saint John Equipment Rental Company Since 2019 - U-Dig It" fill className="object-contain" sizes="60px" unoptimized /></div></div>
              <div className="absolute left-[15%] top-[22%] rotate-[-6deg] opacity-10"><div className="relative h-48 w-48"><Image src="/images/udigit-logo.png" alt="Professional Kubota Rental Service New Brunswick - Local Experts" fill className="object-contain" sizes="48px" unoptimized /></div></div>
              <div className="absolute right-[18%] top-[24%] rotate-[12deg] opacity-10"><div className="relative h-52 w-52"><Image src="/images/udigit-logo.png" alt="Trusted Equipment Rental Company Saint John - U-Dig It Rentals" fill className="object-contain" sizes="52px" unoptimized /></div></div>
              <div className="absolute right-0 top-[45%] translate-x-[35%] rotate-[15deg] transform opacity-10"><div className="relative h-80 w-80"><Image src="/images/udigit-logo.png" alt="Community-Focused Equipment Rental Business New Brunswick" fill className="object-contain" sizes="80px" unoptimized /></div></div>
              <div className="absolute left-0 top-[48%] -translate-x-[35%] rotate-[-12deg] transform opacity-10"><div className="relative h-76 w-76"><Image src="/images/udigit-logo.png" alt="Family-Owned Kubota Equipment Rental Saint John Since 2019" fill className="object-contain" sizes="76px" unoptimized /></div></div>
              <div className="absolute bottom-[12%] left-[20%] rotate-[4deg] opacity-10"><div className="relative h-44 w-44"><Image src="/images/udigit-logo.png" alt="DIY Equipment Rental Solutions Saint John - U-Dig It Rentals" fill className="object-contain" sizes="44px" unoptimized /></div></div>
              <div className="absolute bottom-[10%] right-[22%] rotate-[-7deg] opacity-10"><div className="relative h-48 w-48"><Image src="/images/udigit-logo.png" alt="Homeowner Equipment Rental Specialists - U-Dig It Logo" fill className="object-contain" sizes="48px" unoptimized /></div></div>
              <div className="absolute left-[30%] top-[11%] rotate-[5deg] opacity-10"><div className="relative h-40 w-40"><Image src="/images/udigit-logo.png" alt="Passionate About Equipment Rental - U-Dig It Family Business" fill className="object-contain" sizes="40px" unoptimized /></div></div>
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
                  LOCALLY OWNED & OPERATED
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                From Sandbox Dreams
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  to Real Machines
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Empowering Saint John homeowners and DIYers to tackle big projects—without
                contractor prices.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  Book Your Equipment
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
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">5+</div>
                <div className="text-sm text-gray-600">Years Experience</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">500+</div>
                <div className="text-sm text-gray-600">Projects Completed</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">4.9★</div>
                <div className="text-sm text-gray-600">Customer Rating</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-bold text-[#A90F0F] md:text-4xl">100%</div>
                <div className="text-sm text-gray-600">Local & Family-Owned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Story - Part 1: Childhood Dreams */}
        <div className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">Our Story</h2>
              <p className="mx-auto max-w-3xl text-xl text-gray-600">
                Every great business starts with a dream. Ours started in a sandbox.
              </p>
            </div>

            <div className="mb-20 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 p-8 shadow-lg">
                  <div className="mb-6 inline-block rounded-full bg-[#E1BC56] px-4 py-2 text-sm font-semibold text-white">
                    CHAPTER 1: THE BEGINNING
                  </div>
                  <h3 className="mb-6 text-3xl font-bold text-gray-900">
                    It Started with Tonka Trucks
                  </h3>
                  <div className="prose prose-lg space-y-4 text-gray-700">
                    <p>
                      Like many kids, my love for heavy machinery started in a sandbox. Growing up
                      in Saint John, I would spend hours pushing my trusty{' '}
                      <strong>Tonka trucks</strong> through mounds of sand, building miniature
                      landscapes and imagining I was operating real construction equipment.
                    </p>
                    <p>
                      Those simple childhood games sparked a <strong>lifelong fascination</strong>{' '}
                      with machines and a deep appreciation for creating and transforming spaces.
                    </p>
                    <div className="mt-6 rounded-lg border-l-4 border-[#E1BC56] bg-white p-6">
                      <p className="text-lg font-medium italic text-gray-800">
                        &ldquo;Every big dream starts small. Mine started with a toy truck and a
                        pile of sand.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/images/kid-on-tractor.webp"
                    alt="Young child driving a green toy dump truck — early roots of U-Dig It Rentals"
                    width={800}
                    height={600}
                    className="h-auto w-full"
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <p className="text-sm font-medium text-white">
                      The early days: Where the passion for equipment began 🚜
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Our Story - Part 2: The Revelation */}
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/images/Father-Son-Bucket.webp"
                    alt="Father and child in excavator bucket — early inspiration for U-Dig It Rentals"
                    width={800}
                    height={600}
                    className="h-auto w-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <p className="text-sm font-medium text-white">
                      Creating memories and building dreams, one project at a time 👨‍👦
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 p-8 shadow-lg">
                  <div className="mb-6 inline-block rounded-full bg-[#A90F0F] px-4 py-2 text-sm font-semibold text-white">
                    CHAPTER 2: THE REVELATION
                  </div>
                  <h3 className="mb-6 text-3xl font-bold text-gray-900">
                    From Toys to the Real Thing
                  </h3>
                  <div className="prose prose-lg space-y-4 text-gray-700">
                    <p>
                      Fast-forward a couple of decades, and I finally had the chance to trade my toy
                      dump trucks for the real thing. When I rented my first machine—a{' '}
                      <strong>compact skid steer</strong>—for a DIY project filling potholes and
                      spreading gravel in my own driveway, it was a revelation.
                    </p>
                    <p>
                      I realized just how <strong>powerful, versatile, and easy to use</strong> this
                      equipment could be. Maneuvering it felt surprisingly intuitive and, quite
                      frankly, a lot of fun.
                    </p>
                    <div className="space-y-3 rounded-lg bg-white p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                          <span className="text-lg text-white">✓</span>
                        </div>
                        <p className="font-medium text-gray-800">
                          Saved thousands vs. hiring a contractor
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                          <span className="text-lg text-white">✓</span>
                        </div>
                        <p className="font-medium text-gray-800">Completed on my own schedule</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                          <span className="text-lg text-white">✓</span>
                        </div>
                        <p className="font-medium text-gray-800">
                          Felt genuine pride in the results
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Statement - Full Width Impact */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#A90F0F] to-[#7a0b0b] py-20">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-8 inline-block rounded-full bg-white/20 px-6 py-2 text-sm font-semibold tracking-wide text-white backdrop-blur-sm">
              OUR MISSION
            </div>
            <h2 className="mb-8 text-4xl font-bold leading-tight text-white md:text-5xl">
              Empowering You to Build Your Dreams
            </h2>
            <p className="mb-8 text-xl leading-relaxed text-white/90 md:text-2xl">
              That experience planted a seed: If renting a skid steer could empower me to handle
              projects efficiently and affordably,{' '}
              <strong className="text-yellow-200">
                why couldn&apos;t it help other homeowners and DIYers as well?
              </strong>
            </p>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md md:p-12">
              <p className="mb-6 text-2xl font-bold text-white md:text-3xl">
                &ldquo;We&apos;re more than a rental company&mdash;we&apos;re your partner in
                turning dreams into realities.&rdquo;
              </p>
              <p className="text-lg text-white/90">
                From delivering machines to your driveway to walking you through operation basics,
                we&apos;re here to help you{' '}
                <strong>dig in and build something you&apos;ll be proud of</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose Us - Enhanced */}
        <div className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
                Why Choose U-Dig It Rentals?
              </h2>
              <p className="mx-auto max-w-3xl text-xl text-gray-600">
                We&apos;re not just renting equipment&mdash;we&apos;re empowering you to succeed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-xl border-t-4 border-[#E1BC56] bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-bold text-gray-900">
                  Professional-Grade Equipment
                </h3>
                <p className="mb-4 text-gray-600">
                  Well-maintained <strong>Kubota SVL-75</strong> compact track loaders—the same
                  machines professional contractors use. Regularly inspected and serviced for peak
                  performance.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Regular maintenance & inspections
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Clean & ready to work
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Latest safety features
                  </li>
                </ul>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border-t-4 border-[#A90F0F] bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A90F0F] to-[#7a0b0b]">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-bold text-gray-900">Reliable & On-Time</h3>
                <p className="mb-4 text-gray-600">
                  We deliver and pick up <strong>exactly when we say we will</strong>. Your time is
                  valuable, and we respect that. No waiting around, no excuses.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Punctual delivery & pickup
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Flexible scheduling
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Weekend availability
                  </li>
                </ul>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border-t-4 border-[#E1BC56] bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-bold text-gray-900">Transparent Pricing</h3>
                <p className="mb-4 text-gray-600">
                  <strong>No hidden fees. No surprises.</strong> Our pricing is straightforward and
                  competitive. What you see is what you pay.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Clear upfront pricing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> No hidden charges
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Flexible rental periods
                  </li>
                </ul>
              </div>

              {/* Feature 4 */}
              <div className="rounded-xl border-t-4 border-[#A90F0F] bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A90F0F] to-[#7a0b0b]">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-bold text-gray-900">Expert Guidance</h3>
                <p className="mb-4 text-gray-600">
                  Never operated heavy equipment? <strong>No problem!</strong> We provide basic
                  operation training and are always a phone call away if you need help.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Basic operation training
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Safety instruction included
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 24/7 phone support
                  </li>
                </ul>
              </div>

              {/* Feature 5 */}
              <div className="rounded-xl border-t-4 border-[#E1BC56] bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
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
                <h3 className="mb-4 text-2xl font-bold text-gray-900">Local & Community-Focused</h3>
                <p className="mb-4 text-gray-600">
                  We&apos;re your <strong>Saint John neighbors</strong>. We understand local
                  terrain, weather conditions, and project requirements. Supporting local businesses
                  matters to us.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Family-owned & operated
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Local expertise
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Community committed
                  </li>
                </ul>
              </div>

              {/* Feature 6 */}
              <div className="rounded-xl border-t-4 border-[#A90F0F] bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A90F0F] to-[#7a0b0b]">
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-bold text-gray-900">Fully Insured & Licensed</h3>
                <p className="mb-4 text-gray-600">
                  <strong>Peace of mind included.</strong> We carry comprehensive insurance and all
                  necessary licenses. Your project is protected.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Fully insured equipment
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Licensed & certified
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Safety compliant
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Testimonials */}
        <div className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
                What Our Customers Say
              </h2>
              <p className="text-xl text-gray-600">
                Real reviews from real Saint John homeowners and contractors
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 p-8 shadow-lg">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-6 italic text-gray-700">
                  &ldquo;Saved me over $3,000 by doing my driveway myself! The machine was easy to
                  operate and the owner walked me through everything. Highly recommend!&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E1BC56] text-lg font-bold text-white">
                    JM
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">John M.</div>
                    <div className="text-sm text-gray-600">Homeowner, Quispamsis</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 p-8 shadow-lg">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-6 italic text-gray-700">
                  "Professional equipment, fair pricing, and excellent service. The Kubota SVL-75
                  handled my landscaping project perfectly. Will definitely rent again!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E1BC56] text-lg font-bold text-white">
                    ST
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sarah T.</div>
                    <div className="text-sm text-gray-600">Contractor, Saint John</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 p-8 shadow-lg">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-6 italic text-gray-700">
                  "First time renting heavy equipment and the owner made it so easy. Delivered on
                  time, showed me how to use it safely, and picked it up when promised. A+"
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E1BC56] text-lg font-bold text-white">
                    MB
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Mike B.</div>
                    <div className="text-sm text-gray-600">DIY Homeowner, Rothesay</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#E1BC56] via-[#d4af4a] to-[#A90F0F] py-20">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">
              Ready to Start Your Project?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-white/90">
              Join hundreds of satisfied customers who've saved thousands by renting with U-Dig It
              Rentals.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/book"
                className="transform rounded-lg bg-white px-10 py-5 text-xl font-bold text-[#A90F0F] shadow-2xl transition-all hover:scale-105 hover:bg-gray-100"
              >
                Book Your Equipment Now
              </Link>
              <a
                href="tel:+15066431575"
                className="transform rounded-lg border-2 border-white bg-[#A90F0F] px-10 py-5 text-xl font-bold text-white shadow-2xl transition-all hover:scale-105 hover:bg-[#8a0c0c]"
              >
                📞 Call (506) 643-1575
              </a>
            </div>
            <p className="mt-8 text-sm text-white/80">
              Available 7 days a week • Same-day delivery available • No hidden fees
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-xl bg-white p-8 text-center shadow-lg transition-shadow hover:shadow-xl">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E1BC56] to-[#d4af4a]">
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
                <h3 className="mb-3 text-xl font-bold text-gray-900">Phone</h3>
                <a
                  href="tel:+15066431575"
                  className="text-lg font-semibold text-[#A90F0F] hover:text-[#7a0b0b]"
                >
                  (506) 643-1575
                </a>
                <p className="mt-2 text-sm text-gray-600">Available 7 days a week</p>
              </div>

              <div className="rounded-xl bg-white p-8 text-center shadow-lg transition-shadow hover:shadow-xl">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A90F0F] to-[#7a0b0b]">
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
                <h3 className="mb-3 text-xl font-bold text-gray-900">Email</h3>
                <a
                  href="mailto:info@udigit.ca"
                  className="text-lg font-semibold text-[#A90F0F] hover:text-[#7a0b0b]"
                >
                  info@udigit.ca
                </a>
                <p className="mt-2 text-sm text-gray-600">We respond within 24 hours</p>
              </div>

              <div className="rounded-xl bg-white p-8 text-center shadow-lg transition-shadow hover:shadow-xl">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E1BC56] to-[#d4af4a]">
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
                <h3 className="mb-3 text-xl font-bold text-gray-900">Service Area</h3>
                <p className="text-lg font-semibold text-gray-900">Saint John, NB</p>
                <p className="mt-2 text-sm text-gray-600">& surrounding communities</p>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
