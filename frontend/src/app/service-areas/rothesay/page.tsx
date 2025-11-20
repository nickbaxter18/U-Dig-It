import { CheckCircle, DollarSign, MapPin, Phone, Shield, Truck } from 'lucide-react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Footer from '@/components/Footer';
import { LocationWatermarkSet } from '@/components/GeoWatermark';
import Navigation from '@/components/Navigation';
import { NearbyServiceAreas } from '@/components/ServiceAreaLinks';
import { ImageObjectSchema, LocalBusinessSchema } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Kubota Rental Rothesay NB | Track Loader Rothesay | U-Dig It',
  description:
    'Professional Kubota SVL75-3 rental in Rothesay, NB. $450/day with delivery. Serving Renforth, Wells, Gondola Point, & all Rothesay estates. Call (506) 643-1575.',
  keywords:
    'kubota rental rothesay, equipment rental rothesay nb, track loader rothesay, skid steer rental rothesay, excavation equipment rothesay new brunswick, estate landscaping rothesay',
  openGraph: {
    title: 'Kubota SVL75-3 Rental Rothesay NB | U-Dig It Rentals',
    description:
      'Professional equipment rental in Rothesay with estate property expertise. $450/day with delivery. 24/7 support.',
    url: 'https://udigit.ca/service-areas/rothesay',
    type: 'website',
  },
  alternates: {
    canonical: 'https://udigit.ca/service-areas/rothesay',
  },
};

export default function RothesayServiceAreaPage() {
  return (
    <>
      {/* Local Business Schema for Rothesay */}
      <LocalBusinessSchema
        name="U-Dig It Rentals Inc - Rothesay"
        url="https://udigit.ca/service-areas/rothesay"
      />

      {/* Image SEO Schema for Equipment Photo */}
      <ImageObjectSchema
        imageUrl="https://udigit.ca/images/kubota-svl-75-hero.png"
        name="Kubota SVL75-3 Track Loader Rental Rothesay NB"
        description="Professional Kubota SVL75-3 compact track loader rental in Rothesay, New Brunswick. Perfect for estate landscaping, pool installation, waterfront retaining walls, and residential foundation work across Renforth, Wells, Fairvale, and Gondola Point."
        location="Rothesay, New Brunswick"
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
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>

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
          <LocationWatermarkSet location="rothesay" />

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
                  Rothesay, NB
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Professional Kubota SVL75-3 rental serving Rothesay, Renforth, Wells, and Fairvale
                with fast delivery from Saint John.
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

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        </div>

        {/* Main Content */}
        <div className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Areas Served */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <MapPin className="h-8 w-8 text-[#E1BC56]" />
                <h2 className="text-3xl font-bold text-gray-900">
                  Communities We Serve in Rothesay
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  'Rothesay (Town Center)',
                  'Renforth',
                  'Wells',
                  'Fairvale',
                  'Rothesay Park',
                  'Model Farm Road Area',
                  'Hampton Road Corridor',
                  'Rothesay Netherwood',
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

            {/* Benefits */}
            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
                <Truck className="mx-auto mb-3 h-12 w-12 text-green-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Fast Delivery</h3>
                <p className="text-sm text-gray-700">
                  20-30 minute delivery time from Saint John to Rothesay
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
                  We work with Rothesay-area insurance brokers
                </p>
              </div>
              <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6 text-center">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-purple-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">24/7 Support</h3>
                <p className="text-sm text-gray-700">Always available for Rothesay customers</p>
              </div>
            </div>

            {/* About Rothesay */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                Equipment Rental in Rothesay
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Rothesay is one of our most popular service areas, with many residential and
                  commercial projects requiring professional equipment. Our Kubota SVL75-3 is
                  perfect for Rothesay's typical projects: estate landscaping, pool installations,
                  driveway extensions, and new home foundation work.
                </p>
                <p>
                  With quick access via Route 100, we can deliver equipment to any Rothesay
                  neighborhood in under 30 minutes. Whether you're working on a waterfront property
                  in Renforth, a new development in Fairvale, or a renovation project near Rothesay
                  Netherwood, we provide the same professional service and equipment quality.
                </p>
                <h3 className="pt-4 text-xl font-bold text-gray-900">Popular Rothesay Projects:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>Estate Landscaping</strong> - Large residential properties with
                      extensive grading and topsoil work
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>In-Ground Pools</strong> - Popular in Rothesay's upscale neighborhoods
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>Driveway Extensions</strong> - Paving prep and grading for circular
                      drives
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>Waterfront Retaining Walls</strong> - Foundation work for Kennebecasis
                      River properties
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="mb-12 rounded-lg border-2 border-blue-200 bg-blue-50 p-8">
              <div className="mb-4 flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Delivery to Rothesay</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Delivery fee:</strong> $150 each way (total $300 for delivery + pickup)
                </p>
                <p>
                  <strong>Typical delivery time:</strong> 20-30 minutes from our Saint John yard to
                  Rothesay
                </p>
              </div>
            </div>

            {/* Nearby Service Areas - Internal Linking for SEO */}
            <div className="mb-12">
              <NearbyServiceAreas currentSlug="rothesay" />
            </div>

            {/* CTA */}
            <div className="rounded-lg bg-gradient-to-r from-[#A90F0F] to-[#8a0c0c] p-8 text-white">
              <h2 className="mb-4 text-3xl font-bold">Ready to Rent in Rothesay?</h2>
              <p className="mb-6 text-lg text-white/90">
                Serving Rothesay homeowners and contractors with professional equipment and reliable
                service. Get your free quote today!
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-bold text-[#A90F0F] shadow-xl hover:bg-gray-100"
                >
                  <span>📅</span>
                  <span>Book Online Now</span>
                </Link>
                <a
                  href="tel:+15066431575"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 font-bold text-white shadow-xl hover:bg-white/10"
                >
                  <Phone className="h-5 w-5" />
                  <span>Call (506) 643-1575</span>
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
