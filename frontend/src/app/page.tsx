import BookingWidget from '@/components/BookingWidget';
import EquipmentShowcase from '@/components/EquipmentShowcase';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import HowItWorksSection from '@/components/HowItWorksSection';
import Navigation from '@/components/Navigation';
import SpecialOffersBanner from '@/components/SpecialOffersBanner';
import StructuredData, {
    organizationSchema,
    productSchema,
    serviceSchema,
} from '@/components/StructuredData';
import TestimonialsSection from '@/components/TestimonialsSection';
import TrustBadges from '@/components/TrustBadges';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data */}
      <StructuredData type="Organization" data={organizationSchema} />
      <StructuredData type="Product" data={productSchema} />
      <StructuredData type="Service" data={serviceSchema} />

      {/* Special Offers Banner */}
      <SpecialOffersBanner />

      <Navigation />

      {/* Hero Section with Booking Widget */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
        {/* Premium Gold Accent Strip at Top */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '48px 48px',
            }}
          ></div>
        </div>

        {/* Multiple Logo Watermarks - Beautiful Pattern - Responsive */}
        <div className="pointer-events-none absolute inset-0">
          {/* Top Left */}
          <div className="absolute left-[2%] top-[3%] opacity-10 md:left-10 md:top-10">
            <div className="relative h-20 w-20 md:h-64 md:w-64">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Top Right */}
          <div className="absolute right-[2%] top-[5%] rotate-12 opacity-10 md:right-20 md:top-20">
            <div className="relative h-18 w-18 md:h-48 md:w-48">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Center Large (Main) - Smaller on mobile */}
          <div className="absolute right-[5%] top-1/2 -translate-y-1/2 rotate-[8deg] opacity-10 md:right-0 md:translate-x-1/4 md:rotate-0">
            <div className="relative h-24 w-24 md:h-96 md:w-96">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Center Left - Smaller on mobile */}
          <div className="absolute left-[5%] top-1/3 -rotate-6 opacity-10 md:left-0 md:-translate-x-1/4 md:-rotate-12">
            <div className="relative h-24 w-24 md:h-72 md:w-72">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Bottom Left */}
          <div className="absolute bottom-[8%] left-[8%] rotate-6 opacity-10 md:bottom-20 md:left-32">
            <div className="relative h-20 w-20 md:h-56 md:w-56">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Bottom Right */}
          <div className="absolute bottom-[3%] right-[3%] -rotate-6 opacity-10 md:bottom-10 md:right-10">
            <div className="relative h-22 w-22 md:h-64 md:w-64">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Middle Top */}
          <div className="absolute left-1/2 top-[2%] -translate-x-1/2 rotate-3 transform opacity-10 md:top-5">
            <div className="relative h-16 w-16 md:h-40 md:w-40">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Middle Bottom */}
          <div className="absolute bottom-[2%] left-1/3 -rotate-3 opacity-10 md:bottom-5">
            <div className="relative h-18 w-18 md:h-52 md:w-52">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Additional Mobile Watermarks */}
          {/* Top Center-Left */}
          <div className="absolute left-[20%] top-[12%] rotate-[-8deg] opacity-10">
            <div className="relative h-16 w-16 md:h-36 md:w-36">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Top Center-Right */}
          <div className="absolute right-[15%] top-[15%] rotate-[10deg] opacity-10">
            <div className="relative h-14 w-14 md:h-32 md:w-32">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Middle Left */}
          <div className="absolute left-[10%] top-[45%] rotate-[5deg] opacity-10">
            <div className="relative h-18 w-18 md:h-44 md:w-44">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Middle Right */}
          <div className="absolute right-[12%] top-[50%] -rotate-[7deg] opacity-10">
            <div className="relative h-16 w-16 md:h-40 md:w-40">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Bottom Center-Left */}
          <div className="absolute bottom-[15%] left-[25%] rotate-[4deg] opacity-10">
            <div className="relative h-14 w-14 md:h-36 md:w-36">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Bottom Center-Right */}
          <div className="absolute bottom-[12%] right-[20%] -rotate-[5deg] opacity-10">
            <div className="relative h-16 w-16 md:h-38 md:w-38">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              {/* Availability Badge */}
              <div className="mb-6 inline-flex animate-pulse items-center gap-2 rounded-full bg-green-500 px-4 py-2 shadow-lg">
                <div className="h-3 w-3 rounded-full bg-white"></div>
                <span className="text-sm font-bold text-white">Available Now - Book Today!</span>
              </div>

              <h1
                className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl"
                style={{
                  textShadow: `
                    0 1px 0 rgba(255, 255, 255, 0.15),
                    0 2px 0 rgba(255, 255, 255, 0.1),
                    0 2px 4px rgba(0, 0, 0, 0.15),
                    0 4px 8px rgba(0, 0, 0, 0.1)
                  `.replace(/\s+/g, ' ').trim()
                }}
              >
                Professional Equipment Rental in Saint John
              </h1>
              <p className="mb-8 max-w-3xl text-xl leading-relaxed text-blue-100">
                Rent Kubota SVL-75 compact track loaders for construction, landscaping, and
                excavation projects. Professional service, competitive rates, same-day delivery.
              </p>

              {/* Trust Indicators */}
              <div className="mb-8 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                <div className="flex items-center gap-2 text-white">
                  <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-bold">4.9/5 Rating</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-bold">500+ Rentals</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <svg className="h-6 w-6 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-bold">$120K Insurance</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <a
                  href="tel:+15066431575"
                  className="btn-premium-gold inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-lg font-bold"
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
                  href="/equipment"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white hover:text-blue-600"
                >
                  View Equipment
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </div>

              {/* Urgency Indicator */}
              <div className="mt-8 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-500/20 px-4 py-2 text-white backdrop-blur-sm">
                <svg
                  className="h-5 w-5 animate-pulse text-red-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold">
                  🔥 3 people viewing this equipment right now
                </span>
              </div>
            </div>

            {/* Booking Widget */}
            <div className="lg:mt-0">
              <BookingWidget />
            </div>
          </div>
        </div>
        {/* Premium Gold Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
      </div>

      {/* Clean 1px Transition */}
      <div className="relative">
        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-[#E1BC56]/30 to-transparent"></div>
      </div>

      {/* Trust Badges */}
      <TrustBadges />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Clean 1px Transition */}
      <div className="relative">
        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-gray-200/30 to-transparent"></div>
      </div>

      {/* Equipment Showcase */}
      <EquipmentShowcase />

      {/* Clean 1px Transition */}
      <div className="relative">
        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-gray-200/30 to-transparent"></div>
      </div>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ */}
      <FAQSection />

      {/* Minimal Section Separator */}
      <div className="relative">
        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-gray-100/20 to-transparent"></div>
      </div>

      {/* Service Areas */}
      <div className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-bold text-blue-600">Service Areas</span>
            </div>
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Serving Saint John & Surrounding Areas
            </h2>
            <p className="text-xl text-gray-600">
              Fast, reliable delivery throughout New Brunswick
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              'Saint John',
              'Rothesay',
              'Quispamsis',
              'Grand Bay-Westfield',
              'Hampton',
              'Other Areas',
            ].map(area => (
              <div
                key={area}
                className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 text-center transition-shadow hover:border-[#E1BC56] hover:shadow-lg"
              >
                <div className="mb-2 text-2xl">📍</div>
                <h3 className="font-bold text-gray-900">{area}</h3>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="mb-4 text-gray-600">
              Don&apos;t see your area? <span className="font-semibold">Contact us!</span> We may be
              able to accommodate special delivery requests.
            </p>
            <a
              href="tel:+15066431575"
              className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700"
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

      {/* Clean 1px Transition */}
      <div className="relative">
        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-gray-200/30 to-transparent"></div>
      </div>

      {/* Final CTA */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
        {/* Premium Gold Accent Strip at Top */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '48px 48px',
            }}
          ></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">
              Ready to Get Your Project Started?
            </h2>
            <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-blue-100">
              Join hundreds of satisfied customers who trust U-Dig It Rentals for professional
              equipment and exceptional service. Book online or call us today!
            </p>
            <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
              <nav>
                <Link
                  href="/book"
                  className="btn-premium-gold inline-flex items-center justify-center gap-2 rounded-lg px-10 py-5 text-xl font-bold"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="btn-premium-gold inline-flex items-center justify-center gap-2 rounded-lg px-10 py-5 text-xl font-bold"
                style={{ animationDelay: '1s' }}
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
            </div>

            {/* Final Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-white">
              <div className="flex items-center gap-2">
                <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">Instant Confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">Same-Day Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">Fully Insured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean 1px Transition */}
      <div className="relative">
        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-gray-200/30 to-transparent"></div>
      </div>

      <Footer />
    </div>
  );
}
