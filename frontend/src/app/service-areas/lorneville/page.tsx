import Footer from '@/components/Footer';
import { LocationWatermarkSet } from '@/components/GeoWatermark';
import Navigation from '@/components/Navigation';
import { NearbyServiceAreas } from '@/components/ServiceAreaLinks';
import { ImageObjectSchema, LocalBusinessSchema } from '@/components/StructuredData';
import { serviceAreaMetadata } from '@/lib/service-area-metadata';
import { CheckCircle, DollarSign, Mail, MapPin, Phone, Shield, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = serviceAreaMetadata.lorneville;

export default function LornevilleServiceAreaPage() {
  return (
    <>
      <LocalBusinessSchema name="U-Dig It Rentals Inc - Lorneville" url="https://udigit.ca/service-areas/lorneville" />

      {/* Image SEO Schema for Equipment Photo */}
      <ImageObjectSchema
        imageUrl="https://udigit.ca/images/kubota-svl-75-hero.png"
        name="Kubota SVL75-3 Track Loader Rental Lorneville NB"
        description="Professional Kubota SVL75-3 compact track loader rental in Lorneville, New Brunswick. Perfect for industrial site preparation, coastal excavation, and commercial grading for Bay of Fundy coast properties."
        location="Lorneville, New Brunswick"
        width={1200}
        height={800}
      />

      <style dangerouslySetInnerHTML={{ __html: `
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
      `}} />

      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
          <div className="absolute inset-0 opacity-10"><div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '48px 48px' }}></div></div>

          {/* SEO-Optimized Geo-Tagged Watermarks - Each with unique location-specific alt text */}
          <LocationWatermarkSet location="lorneville" />

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="headline-3d text-center">
              <div className="mb-6 inline-block"><span className="rounded-full border border-[#E1BC56]/30 bg-[#E1BC56]/20 px-6 py-2 text-sm font-semibold tracking-wide text-[#E1BC56] backdrop-blur-sm">SERVICE AREA</span></div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Equipment Rental in<br /><span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">Lorneville, NB</span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Professional Kubota SVL75-3 rental serving Lorneville's industrial and residential areas along the Bay of Fundy.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/book" className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl">Book Equipment Now</Link>
                <a href="tel:+15066431575" className="transform rounded-lg border-2 border-white bg-white/10 px-8 py-4 text-lg font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-gray-900">📞 (506) 643-1575</a>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        </div>

        <div className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            {/* Areas Served */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <MapPin className="h-8 w-8 text-[#E1BC56]" />
                <h2 className="text-3xl font-bold text-gray-900">Serving Lorneville & Area</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {['Lorneville', 'Mispec', 'Dipper Harbour', 'Chance Harbour'].map((area: any) => (
                  <div key={area} className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
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
                <h3 className="mb-2 text-lg font-bold text-gray-900">Quick Delivery</h3>
                <p className="text-sm text-gray-700">Close proximity to West Saint John</p>
              </div>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 text-center">
                <DollarSign className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Competitive Rates</h3>
                <p className="text-sm text-gray-700">$450/day | $2,700/week | $8,100/month</p>
              </div>
              <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6 text-center">
                <Shield className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Industrial Experience</h3>
                <p className="text-sm text-gray-700">Commercial and industrial project expertise</p>
              </div>
              <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6 text-center">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-purple-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">24/7 Support</h3>
                <p className="text-sm text-gray-700">Always available</p>
              </div>
            </div>

            {/* Equipment Section */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">Equipment Available in Lorneville</h2>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex-1">
                    <h3 className="mb-2 text-2xl font-bold text-gray-900">2025 Kubota SVL75-3</h3>
                    <p className="mb-4 text-gray-700">Compact Track Loader - Ideal for Lorneville's industrial, coastal, and residential projects.</p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span><strong>74.3 HP</strong> Kubota diesel engine</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span><strong>9,190 lb</strong> operating weight</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span><strong>68" width</strong> - fits through standard gates</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span><strong>3,200 lb</strong> rated operating capacity</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link href="/equipment" className="rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white hover:bg-blue-700">View Full Specs</Link>
                    <Link href="/book" className="rounded-lg border-2 border-blue-600 bg-white px-6 py-3 text-center font-semibold text-blue-600 hover:bg-blue-50">Check Availability</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Local Info */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">Equipment Rental in Lorneville</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Lorneville is a unique community combining industrial, residential, and coastal properties along the Bay of Fundy. Our Kubota SVL75-3 handles everything from industrial site work to waterfront residential projects.
                </p>
                <p>
                  Located in West Saint John near the Fundy shoreline, Lorneville features industrial operations, residential neighborhoods, and scenic coastal properties. Our equipment serves all of these diverse needs with professional service and reliable delivery.
                </p>
                <h3 className="pt-4 text-xl font-bold text-gray-900">Why Lorneville Customers Choose U-Dig It:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span><strong>Industrial expertise</strong> - experience with commercial and industrial site work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span><strong>Fast delivery</strong> - close proximity to West Saint John</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span><strong>Coastal property experience</strong> - Bay of Fundy waterfront projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span><strong>24/7 support</strong> - always available for equipment assistance</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Popular Projects */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">Common Projects in Lorneville</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🏗️ Industrial Site Work</h3>
                  <p className="text-sm text-gray-700">Commercial lot preparation, grading, and infrastructure development</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🌊 Coastal Properties</h3>
                  <p className="text-sm text-gray-700">Bay of Fundy waterfront landscaping and erosion control</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🏡 Residential Work</h3>
                  <p className="text-sm text-gray-700">Home foundations and yard development in Lorneville neighborhoods</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🚧 Access Roads</h3>
                  <p className="text-sm text-gray-700">Driveway and industrial access road construction</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🏢 Commercial Development</h3>
                  <p className="text-sm text-gray-700">Business site preparation and parking lot grading</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🛤️ Utility Work</h3>
                  <p className="text-sm text-gray-700">Trenching for water, sewer, and electrical services</p>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="mb-12 rounded-lg border-2 border-blue-200 bg-blue-50 p-8">
              <div className="mb-4 flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Delivery to Lorneville</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p><strong>Delivery fee:</strong> $150 each way (total $300 for delivery + pickup)</p>
                <p><strong>Typical delivery time:</strong> 15-20 minutes from Saint John to Lorneville</p>
                <p><strong>Service notes:</strong> Quick access from West Saint John. We serve industrial sites and residential properties throughout Lorneville.</p>
              </div>
            </div>

            {/* Nearby Service Areas - Internal Linking for SEO */}
            <div className="mb-12">
              <NearbyServiceAreas currentSlug="lorneville" />
            </div>

            {/* CTA */}
            <div className="rounded-lg bg-gradient-to-r from-[#A90F0F] to-[#8a0c0c] p-8 text-white">
              <h2 className="mb-4 text-3xl font-bold">Ready to Rent in Lorneville?</h2>
              <p className="mb-6 text-lg text-white/90">
                Get a free quote for your Lorneville project today. Serving industrial, commercial, and residential customers.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/book" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-bold text-[#A90F0F] shadow-xl hover:bg-gray-100"><span>📅</span><span>Book Online Now</span></Link>
                <a href="tel:+15066431575" className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 font-bold text-white shadow-xl hover:bg-white/10"><Phone className="h-5 w-5" /><span>Call (506) 643-1575</span></a>
                <a href="mailto:nickbaxter@udigit.ca" className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 font-bold text-white shadow-xl hover:bg-white/10"><Mail className="h-5 w-5" /><span>Email Quote Request</span></a>
              </div>
            </div>

          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
