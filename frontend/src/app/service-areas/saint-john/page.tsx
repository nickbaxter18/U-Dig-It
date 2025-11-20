import { CheckCircle, DollarSign, Mail, MapPin, Phone, Shield, Truck } from 'lucide-react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Footer from '@/components/Footer';
import { LocationWatermarkSet } from '@/components/GeoWatermark';
import Navigation from '@/components/Navigation';
import { NearbyServiceAreas } from '@/components/ServiceAreaLinks';
import { ImageObjectSchema, LocalBusinessSchema } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Kubota SVL75-3 Rental Saint John NB | Track Loader | U-Dig It',
  description:
    'Professional Kubota SVL75-3 track loader rental in Saint John, NB. $450/day with delivery. Serving Uptown, South End, Millidgeville, East & West. Call (506) 643-1575.',
  keywords:
    'kubota rental saint john, skid steer rental saint john nb, track loader rental saint john, equipment rental saint john new brunswick, excavation equipment saint john, construction equipment rental nb',
  openGraph: {
    title: 'Kubota SVL75-3 Rental Saint John NB | U-Dig It Rentals',
    description:
      'Professional track loader rental in Saint John with delivery. $450/day. Serving all Saint John neighborhoods. 24/7 support.',
    url: 'https://udigit.ca/service-areas/saint-john',
    type: 'website',
    images: [
      {
        url: 'https://udigit.ca/images/kubota-svl-75-hero.png',
        width: 1200,
        height: 630,
        alt: 'Kubota SVL75-3 Track Loader Rental Saint John NB',
      },
    ],
  },
  alternates: {
    canonical: 'https://udigit.ca/service-areas/saint-john',
  },
};

export default function SaintJohnServiceAreaPage() {
  return (
    <>
      {/* Local Business Schema for Saint John */}
      <LocalBusinessSchema
        name="U-Dig It Rentals Inc - Saint John"
        url="https://udigit.ca/service-areas/saint-john"
      />

      {/* Image SEO Schema for Equipment Photo */}
      <ImageObjectSchema
        imageUrl="https://udigit.ca/images/kubota-svl-75-hero.png"
        name="Kubota SVL75-3 Track Loader Rental Saint John NB"
        description="Professional Kubota SVL75-3 compact track loader available for rental in Saint John, New Brunswick. Perfect for construction, excavation, landscaping, pool installation, and foundation work across Greater Saint John."
        location="Saint John, New Brunswick"
        width={1200}
        height={800}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
      `,
        }}
      />

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

          {/* SEO-Optimized Geo-Tagged Watermarks - Each with unique location-specific alt text */}
          <LocationWatermarkSet location="saint-john" />

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="headline-3d text-center">
              <div className="mb-6 inline-block">
                <span className="rounded-full border border-[#E1BC56]/30 bg-[#E1BC56]/20 px-6 py-2 text-sm font-semibold tracking-wide text-[#E1BC56] backdrop-blur-sm">
                  SERVICE AREA
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Equipment Rental in
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Saint John, NB
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Professional Kubota SVL75-3 rental serving all neighborhoods of Saint John with
                reliable delivery and expert support.
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
            {/* Neighborhoods Served */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <MapPin className="h-8 w-8 text-[#E1BC56]" />
                <h2 className="text-3xl font-bold text-gray-900">
                  Neighborhoods We Serve in Saint John
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  'East Saint John',
                  'West Saint John',
                  'South End',
                  'North End',
                  'Old North End',
                  'Millidgeville',
                  'One Mile House',
                  'Crescent Valley',
                  'Rockwood Park',
                  'Lorneville',
                  'Red Head',
                  'Morna Heights',
                ].map((area: unknown) => (
                  <div
                    key={area}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 p-3"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Choose Us for Saint John */}
            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
                <Truck className="mx-auto mb-3 h-12 w-12 text-green-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Delivery Available</h3>
                <p className="text-sm text-gray-700">
                  Professional delivery & pickup service within Saint John area
                </p>
              </div>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 text-center">
                <DollarSign className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Competitive Rates</h3>
                <p className="text-sm text-gray-700">$450/day | $2,700/week | $8,100/month</p>
              </div>
              <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6 text-center">
                <Shield className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Insurance Help</h3>
                <p className="text-sm text-gray-700">
                  We work with local Saint John brokers to get you covered
                </p>
              </div>
              <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6 text-center">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-purple-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">24/7 Support</h3>
                <p className="text-sm text-gray-700">Always available for equipment assistance</p>
              </div>
            </div>

            {/* Equipment Available */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                Equipment Available in Saint John
              </h2>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex-1">
                    <h3 className="mb-2 text-2xl font-bold text-gray-900">2025 Kubota SVL75-3</h3>
                    <p className="mb-4 text-gray-700">
                      Compact Track Loader - Perfect for construction, landscaping, and excavation
                      projects in Saint John.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>
                          <strong>74.3 HP</strong> Kubota diesel engine
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>
                          <strong>9,190 lb</strong> operating weight
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>
                          <strong>68" width</strong> - fits through standard gates
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>
                          <strong>3,200 lb</strong> rated operating capacity
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/equipment"
                      className="rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white hover:bg-blue-700"
                    >
                      View Full Specs
                    </Link>
                    <Link
                      href="/book"
                      className="rounded-lg border-2 border-blue-600 bg-white px-6 py-3 text-center font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      Check Availability
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Local Information */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                About Equipment Rental in Saint John
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>U-Dig It Rentals</strong> is proud to serve the entire Saint John area
                  with professional Kubota equipment rental services. Whether you're working on a
                  residential landscaping project in Rockwood Park, a commercial construction site
                  in the South End, or excavation work anywhere in Greater Saint John, we have the
                  equipment and expertise to support your project.
                </p>
                <p>
                  Our location at <strong>945 Golden Grove Road</strong> allows us to quickly serve
                  customers throughout Saint John, from East Saint John to West Saint John, and
                  everywhere in between.
                </p>
                <h3 className="text-xl font-bold text-gray-900">
                  Why Saint John Contractors Choose U-Dig It:
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>Local Saint John company</strong> - we know the terrain, soil
                      conditions, and building codes
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>Fast response times</strong> - typically 1-2 hours for delivery within
                      Saint John
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>24/7 emergency support</strong> - equipment issues? We're always
                      available
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>Insurance assistance</strong> - we work with Saint John-area brokers
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Popular Projects in Saint John */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                Common Equipment Rental Projects in Saint John
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🏗️ Foundation Excavation</h3>
                  <p className="text-sm text-gray-700">
                    Basement digs, crawl spaces, and foundation prep for new homes and additions
                    throughout Saint John.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🌳 Landscaping & Grading</h3>
                  <p className="text-sm text-gray-700">
                    Yard leveling, topsoil placement, driveway prep, and retaining wall
                    construction.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🏊 Pool Installation</h3>
                  <p className="text-sm text-gray-700">
                    Excavation for in-ground pools - a popular summer project in Saint John's
                    residential areas.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">❄️ Snow Removal</h3>
                  <p className="text-sm text-gray-700">
                    Winter equipment rental for commercial parking lots and large driveways in Saint
                    John.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🔧 Utility Trenching</h3>
                  <p className="text-sm text-gray-700">
                    Water line, sewer, electrical conduit trenching for Saint John homes and
                    businesses.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🚧 Site Preparation</h3>
                  <p className="text-sm text-gray-700">
                    Commercial lot clearing, grading, and prep for construction in Saint John's
                    business districts.
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="mb-12 rounded-lg border-2 border-blue-200 bg-blue-50 p-8">
              <div className="mb-4 flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Delivery in Saint John</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Delivery within Saint John:</strong> Professional equipment delivery and
                  pickup service available for all Saint John neighborhoods.
                </p>
                <p>
                  <strong>Delivery fee:</strong> $150 each way (total $300 for delivery + pickup)
                  within the Greater Saint John area.
                </p>
                <p>
                  <strong>Typical delivery times to Saint John neighborhoods:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>East Saint John: 15-30 minutes</li>
                  <li>West Saint John: 20-35 minutes</li>
                  <li>South End: 15-25 minutes</li>
                  <li>North End: 10-20 minutes</li>
                </ul>
              </div>
            </div>

            {/* Nearby Service Areas - Internal Linking for SEO */}
            <div className="mb-12">
              <NearbyServiceAreas currentSlug="saint-john" />
            </div>

            {/* Contact for Saint John */}
            <div className="rounded-lg bg-gradient-to-r from-[#A90F0F] to-[#8a0c0c] p-8 text-white">
              <h2 className="mb-4 text-3xl font-bold">Ready to Rent in Saint John?</h2>
              <p className="mb-6 text-lg text-white/90">
                Get a free quote for your Saint John project today. Our team is ready to help with
                equipment selection, delivery scheduling, and insurance requirements.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-bold text-[#A90F0F] shadow-xl transition-all hover:bg-gray-100"
                >
                  <span>📅</span>
                  <span>Book Online Now</span>
                </Link>
                <a
                  href="tel:+15066431575"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white bg-transparent px-8 py-4 font-bold text-white shadow-xl transition-all hover:bg-white/10"
                >
                  <Phone className="h-5 w-5" />
                  <span>Call (506) 643-1575</span>
                </a>
                <a
                  href="mailto:nickbaxter@udigit.ca"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white bg-transparent px-8 py-4 font-bold text-white shadow-xl transition-all hover:bg-white/10"
                >
                  <Mail className="h-5 w-5" />
                  <span>Email Quote Request</span>
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
