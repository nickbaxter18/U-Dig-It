import { CheckCircle, DollarSign, MapPin, Phone, Shield, Truck } from 'lucide-react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Footer from '@/components/Footer';
import { LocationWatermarkSet } from '@/components/GeoWatermark';
import Navigation from '@/components/Navigation';
import { NearbyServiceAreas } from '@/components/ServiceAreaLinks';
import { ImageObjectSchema, LocalBusinessSchema } from '@/components/StructuredData';

import { serviceAreaMetadata } from '@/lib/service-area-metadata';

export const metadata: Metadata = serviceAreaMetadata.quispamsis;

export default function QuispamsisServiceAreaPage() {
  return (
    <>
      {/* Local Business Schema for Quispamsis */}
      <LocalBusinessSchema
        name="U-Dig It Rentals Inc - Quispamsis"
        url="https://udigit.ca/service-areas/quispamsis"
      />

      {/* Image SEO Schema for Equipment Photo */}
      <ImageObjectSchema
        imageUrl="https://udigit.ca/images/kubota-svl-75-hero.png"
        name="Kubota SVL75-3 Track Loader Rental Quispamsis NB"
        description="Professional Kubota SVL75-3 compact track loader rental in Quispamsis, New Brunswick. Perfect for residential landscaping, pool installation, new home foundations, and waterfront grading across Gondola Point, Keenan Drive, and Meenan's Cove."
        location="Quispamsis, New Brunswick"
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
          <LocationWatermarkSet location="quispamsis" />

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
                  Quispamsis, NB
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Professional Kubota SVL75-3 rental serving all Quispamsis neighborhoods. Delivery
                from Saint John in 25-35 minutes.
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
            {/* Communities Served */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <MapPin className="h-8 w-8 text-[#E1BC56]" />
                <h2 className="text-3xl font-bold text-gray-900">Areas We Serve in Quispamsis</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  'Quispamsis Town Center',
                  'Gondola Point',
                  'Keenan Drive',
                  "Meenan's Cove",
                  'Hampton Road',
                  'Pettingill Road Area',
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
            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
                <Truck className="mx-auto mb-3 h-12 w-12 text-green-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Quick Delivery</h3>
                <p className="text-sm text-gray-700">
                  25-35 minute delivery from Saint John to Quispamsis
                </p>
              </div>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 text-center">
                <DollarSign className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Affordable Pricing</h3>
                <p className="text-sm text-gray-700">$450/day | $2,700/week | $8,100/month</p>
              </div>
              <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6 text-center">
                <Shield className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Local Expertise</h3>
                <p className="text-sm text-gray-700">
                  We know Quispamsis terrain and property types
                </p>
              </div>
            </div>

            {/* About Quispamsis */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                Serving Quispamsis & the Kennebecasis Valley
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Quispamsis is a thriving community in the Kennebecasis Valley (KV Region), known
                  for its beautiful residential developments, waterfront properties, and growing
                  commercial sector. U-Dig It Rentals proudly serves Quispamsis homeowners,
                  contractors, and landscapers with professional Kubota equipment rental.
                </p>
                <p>
                  From Gondola Point's scenic waterfront lots to new subdivisions along Hampton
                  Road, our Kubota SVL75-3 handles Quispamsis projects with ease. The compact 68"
                  width fits through standard gates, making it ideal for established Quispamsis
                  neighborhoods with mature landscaping.
                </p>
                <h3 className="pt-4 text-xl font-bold text-gray-900">
                  Common Quispamsis Projects:
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-1 font-semibold text-gray-900">🏡 Residential Landscaping</h4>
                    <p className="text-sm">
                      Yard leveling, retaining walls, and drainage work for Quispamsis homes
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-1 font-semibold text-gray-900">🏊 Pool Excavation</h4>
                    <p className="text-sm">
                      In-ground pool installation - very popular in Quispamsis
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-1 font-semibold text-gray-900">🚧 New Construction</h4>
                    <p className="text-sm">
                      Foundation excavation for new homes in Quispamsis developments
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-1 font-semibold text-gray-900">🌊 Waterfront Projects</h4>
                    <p className="text-sm">
                      Kennebecasis River property improvements and erosion control
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nearby Service Areas - Internal Linking for SEO */}
            <div className="mb-12">
              <NearbyServiceAreas currentSlug="quispamsis" />
            </div>

            {/* CTA */}
            <div className="rounded-lg bg-gradient-to-r from-[#A90F0F] to-[#8a0c0c] p-8 text-white">
              <h2 className="mb-4 text-3xl font-bold">Ready to Rent in Quispamsis?</h2>
              <p className="mb-6 text-lg text-white/90">
                Get a free quote for your Quispamsis project. We're ready to help with equipment
                selection, delivery scheduling, and insurance requirements.
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
