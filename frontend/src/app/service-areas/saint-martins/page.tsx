import { CheckCircle, DollarSign, Mail, MapPin, Phone, Shield, Truck } from 'lucide-react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Footer from '@/components/Footer';
import { LocationWatermarkSet } from '@/components/GeoWatermark';
import Navigation from '@/components/Navigation';
import { NearbyServiceAreas } from '@/components/ServiceAreaLinks';
import { ImageObjectSchema, LocalBusinessSchema } from '@/components/StructuredData';

import { serviceAreaMetadata } from '@/lib/service-area-metadata';

export const metadata: Metadata = serviceAreaMetadata['saint-martins'];

export default function SaintMartinsServiceAreaPage() {
  return (
    <>
      <LocalBusinessSchema
        name="U-Dig It Rentals Inc - Saint Martins"
        url="https://udigit.ca/service-areas/saint-martins"
      />

      {/* Image SEO Schema for Equipment Photo */}
      <ImageObjectSchema
        imageUrl="https://udigit.ca/images/kubota-svl-75-hero.png"
        name="Kubota SVL75-3 Track Loader Rental Saint Martins NB"
        description="Professional Kubota SVL75-3 compact track loader rental in Saint Martins, New Brunswick. Perfect for coastal excavation, tourism property development, and waterfront grading along the Bay of Fundy."
        location="Saint Martins, New Brunswick"
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
          <LocationWatermarkSet location="saint-martins" />

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
                  Saint Martins, NB
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Professional Kubota SVL75-3 rental serving Saint Martins and the scenic Fundy coast.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  Book Equipment
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
                <h2 className="text-3xl font-bold text-gray-900">
                  Serving the Historic Village of Saint Martins
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {['Saint Martins Village', 'Fundy Coastal Area', 'Sea Caves Region'].map(
                  (area: unknown) => (
                    <div
                      key={area}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 p-3"
                    >
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700">{area}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
                <Truck className="mx-auto mb-3 h-12 w-12 text-green-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Coastal Delivery</h3>
                <p className="text-sm text-gray-700">Serving Saint Martins and Fundy coast</p>
              </div>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 text-center">
                <DollarSign className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Competitive Rates</h3>
                <p className="text-sm text-gray-700">$450/day | $2,700/week | $8,100/month</p>
              </div>
              <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6 text-center">
                <Shield className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Coastal Expertise</h3>
                <p className="text-sm text-gray-700">Experience with coastal properties</p>
              </div>
              <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6 text-center">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-purple-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">24/7 Support</h3>
                <p className="text-sm text-gray-700">Always available</p>
              </div>
            </div>

            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                Equipment Available in Saint Martins
              </h2>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex-1">
                    <h3 className="mb-2 text-2xl font-bold text-gray-900">2025 Kubota SVL75-3</h3>
                    <p className="mb-4 text-gray-700">
                      Compact Track Loader - Perfect for Saint Martins' coastal and tourism-related
                      projects.
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
              <h2 className="mb-6 text-3xl font-bold text-gray-900">About Saint Martins</h2>
              <p className="mb-4 text-gray-700">
                Saint Martins is a picturesque Bay of Fundy coastal village known for its historic
                covered bridges, sea caves, and scenic beauty. Our equipment handles waterfront
                projects, residential work, and tourism-related property development.
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="mb-1 font-semibold">🌊 Waterfront Projects</h4>
                  <p className="text-sm">Coastal property landscaping and erosion control</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="mb-1 font-semibold">🏡 Residential Development</h4>
                  <p className="text-sm">Home foundations and property improvements</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="mb-1 font-semibold">🏨 Tourism Properties</h4>
                  <p className="text-sm">B&B and vacation rental property development</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="mb-1 font-semibold">🌳 Land Clearing</h4>
                  <p className="text-sm">Site preparation and lot development</p>
                </div>
              </div>
            </div>

            <div className="mb-12 rounded-lg border-2 border-blue-200 bg-blue-50 p-8">
              <div className="mb-4 flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Delivery to Saint Martins</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Delivery fee:</strong> $150 each way (total $300 for delivery + pickup)
                </p>
                <p>
                  <strong>Service area:</strong> Saint Martins village and surrounding Fundy coastal
                  region
                </p>
              </div>
            </div>

            {/* Nearby Service Areas - Internal Linking for SEO */}
            <div className="mb-12">
              <NearbyServiceAreas currentSlug="saint-martins" />
            </div>

            <div className="rounded-lg bg-gradient-to-r from-[#A90F0F] to-[#8a0c0c] p-8 text-white">
              <h2 className="mb-4 text-3xl font-bold">Ready to Rent in Saint Martins?</h2>
              <p className="mb-6 text-lg">
                Serving the historic village and Fundy coastal community with professional
                equipment.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-bold text-[#A90F0F] hover:bg-gray-100"
                >
                  <span>📅</span>
                  <span>Book Now</span>
                </Link>
                <a
                  href="tel:+15066431575"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 font-bold text-white hover:bg-white/10"
                >
                  <Phone className="h-5 w-5" />
                  <span>Call Now</span>
                </a>
                <a
                  href="mailto:nickbaxter@udigit.ca"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 font-bold text-white hover:bg-white/10"
                >
                  <Mail className="h-5 w-5" />
                  <span>Email</span>
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
