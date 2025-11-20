import { CheckCircle, DollarSign, Mail, MapPin, Phone, Shield, Truck } from 'lucide-react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Footer from '@/components/Footer';
import { LocationWatermarkSet } from '@/components/GeoWatermark';
import Navigation from '@/components/Navigation';
import { NearbyServiceAreas } from '@/components/ServiceAreaLinks';
import { ImageObjectSchema, LocalBusinessSchema } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Kubota Rental Grand Bay-Westfield NB | Bay of Fundy | U-Dig It',
  description:
    'Kubota SVL75-3 rental in Grand Bay-Westfield, NB. $450/day with delivery. Serving Epworth Park, Hillandale, Ingleside. Bay of Fundy waterfront specialist. (506) 643-1575.',
  keywords:
    'equipment rental grand bay westfield, kubota rental westfield nb, track loader grand bay, waterfront equipment grand bay, bay of fundy equipment rental, westfield nb excavation',
  openGraph: {
    title: 'Equipment Rental Grand Bay-Westfield | Bay of Fundy | U-Dig It',
    description:
      'Professional equipment rental in Grand Bay-Westfield. Waterfront & coastal expertise. $450/day with delivery.',
    url: 'https://udigit.ca/service-areas/grand-bay-westfield',
    type: 'website',
  },
  alternates: {
    canonical: 'https://udigit.ca/service-areas/grand-bay-westfield',
  },
};

export default function GrandBayWestfieldServiceAreaPage() {
  return (
    <>
      <LocalBusinessSchema
        name="U-Dig It Rentals Inc - Grand Bay-Westfield"
        url="https://udigit.ca/service-areas/grand-bay-westfield"
      />

      {/* Image SEO Schema for Equipment Photo */}
      <ImageObjectSchema
        imageUrl="https://udigit.ca/images/kubota-svl-75-hero.png"
        name="Kubota SVL75-3 Track Loader Rental Grand Bay-Westfield NB"
        description="Professional Kubota SVL75-3 compact track loader rental in Grand Bay-Westfield, New Brunswick. Perfect for waterfront excavation, shoreline grading, coastal property development, and Bay of Fundy waterfront projects across Epworth Park, Hillandale, and Westfield."
        location="Grand Bay-Westfield, New Brunswick"
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
          <LocationWatermarkSet location="grand-bay-westfield" />

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
                  Grand Bay-Westfield, NB
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Professional Kubota SVL75-3 rental serving Grand Bay-Westfield and Bay of Fundy
                shoreline communities.
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

        <div className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <MapPin className="h-8 w-8 text-[#E1BC56]" />
                <h2 className="text-3xl font-bold text-gray-900">Communities We Serve</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  'Grand Bay',
                  'Westfield',
                  'Epworth Park',
                  'Acamac',
                  'Ingleside',
                  'Morna',
                  'Belyeas Cove',
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

            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
                <Truck className="mx-auto mb-3 h-12 w-12 text-green-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Delivery Available</h3>
                <p className="text-sm text-gray-700">
                  Professional delivery along Route 7 corridor
                </p>
              </div>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 text-center">
                <DollarSign className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Competitive Rates</h3>
                <p className="text-sm text-gray-700">$450/day | $2,700/week | $8,100/month</p>
              </div>
              <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6 text-center">
                <Shield className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Waterfront Experience</h3>
                <p className="text-sm text-gray-700">
                  Specialized in Bay of Fundy shoreline projects
                </p>
              </div>
              <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6 text-center">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-purple-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">24/7 Support</h3>
                <p className="text-sm text-gray-700">Always available</p>
              </div>
            </div>

            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                Equipment Available in Grand Bay-Westfield
              </h2>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex-1">
                    <h3 className="mb-2 text-2xl font-bold text-gray-900">2025 Kubota SVL75-3</h3>
                    <p className="mb-4 text-gray-700">
                      Compact Track Loader - Perfect for waterfront and residential projects in
                      Grand Bay-Westfield.
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

            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                About Grand Bay-Westfield Rentals
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Grand Bay-Westfield sits along the scenic Bay of Fundy coastline and Route 7
                  corridor. This community combines waterfront properties, residential developments,
                  and rural acreage, making it a diverse market for equipment rental.
                </p>
                <p>
                  From Epworth Park to Acamac, from coastal properties in Grand Bay to inland
                  developments in Westfield, our Kubota SVL75-3 serves all areas with professional
                  equipment and reliable service.
                </p>
                <h3 className="pt-4 text-xl font-bold text-gray-900">
                  Why Grand Bay-Westfield Customers Choose U-Dig It:
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>Waterfront expertise</strong> - experience with Bay of Fundy coastal
                      properties
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>Route 7 access</strong> - efficient delivery along the corridor
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>Coastal conditions</strong> - understanding of tidal and shoreline
                      challenges
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>24/7 support</strong> - always available for equipment assistance
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                Common Projects in Grand Bay-Westfield
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🌊 Waterfront Landscaping</h3>
                  <p className="text-sm text-gray-700">
                    Bay of Fundy property grading, retaining walls, erosion control
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🏡 Residential Development</h3>
                  <p className="text-sm text-gray-700">New home foundations and site preparation</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🚧 Driveway Projects</h3>
                  <p className="text-sm text-gray-700">Long rural driveways and access roads</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🌳 Land Clearing</h3>
                  <p className="text-sm text-gray-700">Tree clearing and lot preparation</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🏗️ Foundation Excavation</h3>
                  <p className="text-sm text-gray-700">
                    Basement and crawl space excavation for Route 7 homes
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🛤️ Shoreline Improvements</h3>
                  <p className="text-sm text-gray-700">
                    Coastal property stabilization and landscaping
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-12 rounded-lg border-2 border-blue-200 bg-blue-50 p-8">
              <div className="mb-4 flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Delivery to Grand Bay-Westfield
                </h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Delivery fee:</strong> $150 each way (total $300 for delivery + pickup)
                </p>
                <p>
                  <strong>Typical delivery time:</strong> 25-35 minutes via Route 7 from Saint John
                </p>
                <p>
                  <strong>Service notes:</strong> We serve all communities along the Route 7
                  corridor from Grand Bay to Westfield.
                </p>
              </div>
            </div>

            {/* Nearby Service Areas - Internal Linking for SEO */}
            <div className="mb-12">
              <NearbyServiceAreas currentSlug="grand-bay-westfield" />
            </div>

            <div className="rounded-lg bg-gradient-to-r from-[#A90F0F] to-[#8a0c0c] p-8 text-white">
              <h2 className="mb-4 text-3xl font-bold">Ready to Rent in Grand Bay-Westfield?</h2>
              <p className="mb-6 text-lg text-white/90">
                Get a free quote for your Grand Bay-Westfield project. We're ready to help with
                equipment selection and delivery!
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
                <a
                  href="mailto:nickbaxter@udigit.ca"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 font-bold text-white shadow-xl hover:bg-white/10"
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
