import Footer from '@/components/Footer';
import { LocationWatermarkSet } from '@/components/GeoWatermark';
import Navigation from '@/components/Navigation';
import { NearbyServiceAreas } from '@/components/ServiceAreaLinks';
import { ImageObjectSchema, LocalBusinessSchema } from '@/components/StructuredData';
import { CheckCircle, DollarSign, Mail, MapPin, Phone, Shield, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Equipment Rental Hampton NB | Farm & Acreage Specialist | U-Dig It',
  description: 'Kubota SVL75-3 rental in Hampton, NB. $450/day with delivery. Serving Hampton Village, Station, Lakeside. Agricultural & acreage property specialist. (506) 643-1575.',
  keywords: 'equipment rental hampton nb, kubota rental hampton, farm equipment rental hampton, acreage excavation hampton, agricultural equipment hampton new brunswick, track loader hampton',
  openGraph: {
    title: 'Kubota Rental Hampton NB | Agricultural Equipment | U-Dig It',
    description: 'Professional equipment rental in Hampton. Farm & acreage expertise. $450/day with delivery. 24/7 support.',
    url: 'https://udigit.ca/service-areas/hampton',
    type: 'website',
  },
  alternates: {
    canonical: 'https://udigit.ca/service-areas/hampton'
  }
};

export default function HamptonServiceAreaPage() {
  return (
    <>
      <LocalBusinessSchema name="U-Dig It Rentals Inc - Hampton" url="https://udigit.ca/service-areas/hampton" />

      {/* Image SEO Schema for Equipment Photo */}
      <ImageObjectSchema
        imageUrl="https://udigit.ca/images/kubota-svl-75-hero.png"
        name="Kubota SVL75-3 Track Loader Rental Hampton NB"
        description="Professional Kubota SVL75-3 compact track loader rental in Hampton, New Brunswick. Perfect for farm drainage, acreage grading, barn preparation, and rural property development across Hampton Village, Hampton Station, and Lakeside."
        location="Hampton, New Brunswick"
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

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '48px 48px' }}></div>
          </div>

          {/* Watermarks */}
          {/* SEO-Optimized Geo-Tagged Watermarks - Each with unique location-specific alt text */}
          <LocationWatermarkSet location="hampton" />

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="headline-3d text-center">
              <div className="mb-6 inline-block">
                <span className="rounded-full border border-[#E1BC56]/30 bg-[#E1BC56]/20 px-6 py-2 text-sm font-semibold tracking-wide text-[#E1BC56] backdrop-blur-sm">SERVICE AREA</span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Equipment Rental in<br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">Hampton, NB</span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Professional Kubota SVL75-3 rental serving Hampton and surrounding rural areas. Perfect for acreage projects and agricultural work.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/book" className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl">Book Equipment Now</Link>
                <a href="tel:+15066431575" className="transform rounded-lg border-2 border-white bg-white/10 px-8 py-4 text-lg font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-gray-900">📞 (506) 643-1575</a>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        </div>

        {/* Content */}
        <div className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            {/* Areas Served */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <MapPin className="h-8 w-8 text-[#E1BC56]" />
                <h2 className="text-3xl font-bold text-gray-900">Serving Hampton & Surrounding Areas</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {['Hampton Village', 'Hampton Station', 'Lakeside Heights', 'Nauwigewauk', 'Smithtown', 'Bloomfield', 'Gondola Point Road'].map((area: any) => (
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
                <h3 className="mb-2 text-lg font-bold text-gray-900">Delivery Available</h3>
                <p className="text-sm text-gray-700">30-40 minute delivery from Saint John to Hampton</p>
              </div>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 text-center">
                <DollarSign className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Competitive Rates</h3>
                <p className="text-sm text-gray-700">$450/day | $2,700/week | $8,100/month</p>
              </div>
              <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6 text-center">
                <Shield className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">Rural Expertise</h3>
                <p className="text-sm text-gray-700">Experience with acreage and agricultural projects</p>
              </div>
              <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6 text-center">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-purple-600" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">24/7 Support</h3>
                <p className="text-sm text-gray-700">Always available for Hampton customers</p>
              </div>
            </div>

            {/* Equipment Section */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">Equipment Available in Hampton</h2>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex-1">
                    <h3 className="mb-2 text-2xl font-bold text-gray-900">2025 Kubota SVL75-3</h3>
                    <p className="mb-4 text-gray-700">Compact Track Loader - Ideal for Hampton's acreage, agricultural, and residential projects.</p>
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
              <h2 className="mb-6 text-3xl font-bold text-gray-900">Equipment Rental in Hampton</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Hampton and surrounding rural communities require specialized equipment for larger properties, acreage work, and agricultural projects. Our Kubota SVL75-3 is ideal for Hampton's mix of residential, agricultural, and commercial needs.
                </p>
                <p>
                  From large lot landscaping in Lakeside Heights to agricultural drainage in Smithtown and rural driveway construction in Bloomfield, we serve all of Hampton and the surrounding area with professional equipment and expert support.
                </p>
                <h3 className="pt-4 text-xl font-bold text-gray-900">Why Hampton Customers Choose U-Dig It:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span><strong>Rural expertise</strong> - we understand acreage projects and agricultural needs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span><strong>Fast delivery</strong> - typically 30-40 minutes from Saint John</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span><strong>Agricultural experience</strong> - field drainage, barn prep, and land management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span><strong>Insurance help</strong> - we work with local brokers</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Popular Projects */}
            <div className="mb-12 rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">Common Projects in Hampton</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🌾 Agricultural Drainage</h3>
                  <p className="text-sm text-gray-700">Field drainage, ditch maintenance, and water management for Hampton farms</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🏡 Acreage Landscaping</h3>
                  <p className="text-sm text-gray-700">Large property grading, tree clearing, and land preparation</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🚜 Barn & Outbuilding Prep</h3>
                  <p className="text-sm text-gray-700">Foundation excavation for agricultural buildings and equipment sheds</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🛤️ Driveway Construction</h3>
                  <p className="text-sm text-gray-700">Long rural driveways, culvert installation, and grading work</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🏗️ Foundation Work</h3>
                  <p className="text-sm text-gray-700">New home foundations and basement excavation in Hampton developments</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">🌳 Land Clearing</h3>
                  <p className="text-sm text-gray-700">Tree removal, brush clearing, and site preparation for rural properties</p>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="mb-12 rounded-lg border-2 border-blue-200 bg-blue-50 p-8">
              <div className="mb-4 flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Delivery to Hampton</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p><strong>Delivery fee:</strong> $150 each way (total $300 for delivery + pickup)</p>
                <p><strong>Typical delivery time:</strong> 30-40 minutes from our Saint John yard to Hampton</p>
                <p><strong>Service notes:</strong> We understand rural properties - call ahead if special access arrangements are needed for your Hampton property.</p>
              </div>
            </div>

            {/* CTA */}
            {/* Nearby Service Areas - Internal Linking for SEO */}
            <div className="mb-12">
              <NearbyServiceAreas currentSlug="hampton" />
            </div>

            <div className="rounded-lg bg-gradient-to-r from-[#A90F0F] to-[#8a0c0c] p-8 text-white">
              <h2 className="mb-4 text-3xl font-bold">Ready to Rent in Hampton?</h2>
              <p className="mb-6 text-lg text-white/90">
                Serving Hampton's rural and agricultural community with professional equipment. Get your free quote today!
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/book" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-bold text-[#A90F0F] shadow-xl hover:bg-gray-100"><span>📅</span><span>Book Online Now</span></Link>
                <a href="tel:+15066431575" className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 font-bold text-white shadow-xl hover:bg-white/10"><Phone className="h-5 w-5" /><span>Call (506) 643-1575</span></a>
                <a href="mailto:nickbaxter@udigit.ca" className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 font-bold text-white shadow-xl hover:bg-white/10"><Mail className="h-5 w-5" /><span>Email Quote</span></a>
              </div>
            </div>

          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
