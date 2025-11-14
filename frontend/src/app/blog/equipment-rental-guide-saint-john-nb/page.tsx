import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { NearbyServiceAreas } from '@/components/ServiceAreaLinks';
import { AlertTriangle, Calendar, CheckCircle, Clock, User } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Complete Guide to Renting Heavy Equipment in Saint John NB 2025 | U-Dig It',
  description: 'Complete 2025 guide to renting construction equipment in Saint John, NB. Learn about choosing equipment, pricing, delivery, insurance, permits, and safety. Expert advice from U-Dig It Rentals.',
  keywords: 'equipment rental guide saint john, how to rent heavy equipment nb, construction equipment rental tips, kubota rental saint john, equipment delivery saint john, rental insurance new brunswick',
  openGraph: {
    title: 'Complete Guide: Renting Heavy Equipment in Saint John NB',
    description: 'Expert guide to equipment rental in Saint John. Pricing, insurance, permits, safety & more.',
    url: 'https://udigit.ca/blog/equipment-rental-guide-saint-john-nb',
    type: 'article',
  },
  alternates: {
    canonical: 'https://udigit.ca/blog/equipment-rental-guide-saint-john-nb'
  }
};

export default function EquipmentRentalGuideBlogPost() {
  return (
    <>
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

        {/* Article Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '48px 48px' }}></div>
          </div>

          <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-6 inline-block">
              <span className="rounded-full border border-[#E1BC56]/30 bg-[#E1BC56]/20 px-4 py-2 text-sm font-semibold tracking-wide text-[#E1BC56]">GUIDES</span>
            </div>

            <h1 className="mb-6 text-3xl font-bold leading-tight text-white md:text-5xl">
              Complete Guide to Renting Heavy Equipment in Saint John, NB
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                November 2, 2025
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                8 min read
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                U-Dig It Rentals Team
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        </div>

        {/* Article Content */}
        <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">

            {/* Introduction */}
            <div className="rounded-lg border-l-4 border-[#E1BC56] bg-yellow-50 p-6 not-prose">
              <p className="text-lg text-gray-700">
                <strong>Planning a construction, landscaping, or excavation project in Saint John?</strong> Renting heavy equipment can save thousands compared to hiring contractors. This complete guide walks you through everything you need to know about renting construction equipment in Saint John, NB - from choosing the right machine to navigating insurance, permits, and safety requirements.
              </p>
            </div>

            <h2 className="mt-12 text-3xl font-bold">1. Choosing the Right Equipment for Your Project</h2>

            <p>The most common mistake first-time renters make is choosing the wrong equipment for their project. Here's how to select the right machine:</p>

            <h3 className="text-2xl font-bold">Kubota SVL75-3 Track Loader - When to Choose It</h3>

            <div className="not-prose">
              <div className="my-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                <h4 className="mb-4 text-lg font-bold text-gray-900">Perfect for:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700"><strong>Foundation excavation</strong> - Basement digs up to 10 feet deep</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700"><strong>Landscaping & grading</strong> - Yard leveling, topsoil work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700"><strong>Pool installation</strong> - In-ground pool excavation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700"><strong>Driveway construction</strong> - Grading and paving prep</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700"><strong>Utility trenching</strong> - Water, sewer, electrical lines</span>
                  </li>
                </ul>
              </div>
            </div>

            <p><strong>Why the SVL75-3 is ideal for Saint John:</strong></p>
            <ul>
              <li><strong>68" width</strong> - Fits through standard residential gates in Rothesay, Quispamsis, and Saint John neighborhoods</li>
              <li><strong>9,190 lb weight</strong> - Heavy enough for serious work, light enough to avoid damaging lawns</li>
              <li><strong>Track system</strong> - Better weight distribution than wheeled skid steers, ideal for Saint John's soil conditions</li>
              <li><strong>3,200 lb capacity</strong> - Handles full buckets of dirt, topsoil, or gravel efficiently</li>
            </ul>

            <h2 className="mt-12">2. Understanding Rental Pricing in Saint John</h2>

            <p>Equipment rental pricing in New Brunswick follows a standard structure. Here's what to expect:</p>

            <div className="not-prose">
              <div className="my-6 overflow-hidden rounded-lg border-2 border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Rental Period</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Rate</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-white">
                      <td className="px-4 py-3 font-semibold text-gray-900">Daily</td>
                      <td className="px-4 py-3 text-gray-700">$450/day</td>
                      <td className="px-4 py-3 text-gray-700">Small projects (pool, trench)</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">Weekly</td>
                      <td className="px-4 py-3 text-gray-700">$2,700/week</td>
                      <td className="px-4 py-3 text-gray-700">Medium projects (foundation, grading)</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 font-semibold text-gray-900">Monthly</td>
                      <td className="px-4 py-3 text-gray-700">$8,100/month</td>
                      <td className="px-4 py-3 text-gray-700">Large projects (subdivision, commercial)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-2xl font-bold">Additional Costs to Budget</h3>

            <ul>
              <li><strong>Delivery & Pickup:</strong> $300 total ($150 each way) within Greater Saint John</li>
              <li><strong>Security Hold:</strong> $500 refundable (returned within 5-7 business days after return)</li>
              <li><strong>Fuel:</strong> $100 flat rate if not returned full (or actual fuel cost, whichever is greater)</li>
              <li><strong>Optional Damage Waiver:</strong> $45/day (reduces your liability for accidental damage)</li>
            </ul>

            <p className="rounded-lg bg-green-50 border-l-4 border-green-600 p-4 font-medium text-green-900">
              <strong>💡 Pro Tip:</strong> Weekly and monthly rentals offer significant savings. If your project will take 3+ days, consider booking a full week.
            </p>

            <h2 className="mt-12">3. Insurance Requirements in New Brunswick</h2>

            <p>This is where many first-time renters get confused. Here's exactly what you need:</p>

            <h3 className="text-2xl font-bold">Required Insurance Coverage</h3>

            <div className="not-prose">
              <div className="my-6 space-y-4">
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                  <h4 className="mb-3 text-lg font-bold text-gray-900">Commercial General Liability (CGL)</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span><strong>Minimum:</strong> $2,000,000 per occurrence</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span><strong>Requirement:</strong> U-Dig It Rentals Inc. as Additional Insured</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span><strong>Coverage:</strong> Bodily injury, property damage, third-party claims</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6">
                  <h4 className="mb-3 text-lg font-bold text-gray-900">Rented Equipment Coverage</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-600" />
                      <span><strong>Minimum:</strong> Full replacement value ($120,000 for SVL75-3)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-600" />
                      <span><strong>Requirement:</strong> U-Dig It Rentals Inc. as Loss Payee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-600" />
                      <span><strong>Coverage:</strong> Theft, damage, fire, vandalism</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <p><strong>Don't have insurance?</strong> No problem! We work with local Saint John insurance brokers who specialize in short-term equipment rental coverage. <Link href="/insurance" className="font-semibold text-[#A90F0F] underline">See our Insurance Guide</Link>.</p>

            <h2 className="mt-12">4. Permits & Utility Locates</h2>

            <p>Before you dig ANYWHERE in Saint John, you must:</p>

            <div className="not-prose">
              <div className="my-6 rounded-lg border-2 border-red-200 bg-red-50 p-6">
                <div className="mb-4 flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-600" />
                  <div>
                    <h4 className="mb-2 text-lg font-bold text-gray-900">⚠️ CRITICAL: Call Before You Dig</h4>
                    <p className="text-gray-700">
                      <strong>NB One Call:</strong> 1-800-565-2754<br />
                      <strong>Requirement:</strong> Call at least 3 business days before digging<br />
                      <strong>Cost:</strong> FREE service<br />
                      <strong>Penalty for not calling:</strong> Up to $100,000 fine + liability for damages
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold">When You Need a Permit in Saint John</h3>

            <ul>
              <li><strong>Excavation within 1m of property line:</strong> Require Building Permit from City of Saint John</li>
              <li><strong>Driveway work on municipal street:</strong> Require Right-of-Way permit</li>
              <li><strong>Work in wetlands or watercourses:</strong> Require provincial environmental permits</li>
              <li><strong>Commercial sites:</strong> May require site plan approval and erosion control plan</li>
            </ul>

            <p><strong>Contact:</strong> City of Saint John Planning & Development - (506) 658-2855</p>

            <h2 className="mt-12">5. Delivery & Site Preparation</h2>

            <p>Professional delivery is included in our service, but your site needs to be ready:</p>

            <h3 className="text-2xl font-bold">Site Requirements Checklist</h3>

            <div className="not-prose">
              <div className="my-6 space-y-3">
                {[
                  'Access route wide enough for 20-foot trailer (12+ feet wide)',
                  'Level loading/unloading area (max 5° slope)',
                  'No overhead obstructions (power lines, trees)',
                  'Ground firm enough to support 25,000 lb loaded trailer',
                  'Clear path to work area (gates opened, vehicles moved)',
                  'Utility locates completed and marked',
                ].map((item: any, index: any) => (
                  <div key={index} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="mt-12">6. Operating the Equipment Safely</h2>

            <p>You don't need a special license to operate a Kubota track loader in NB, but you MUST be competent. Here are the key safety rules:</p>

            <h3 className="text-2xl font-bold">Essential Safety Equipment (PPE)</h3>

            <ul>
              <li><strong>CSA-approved safety boots</strong> - Steel toe required</li>
              <li><strong>High-visibility vest</strong> - Fluorescent orange or lime</li>
              <li><strong>Safety glasses</strong> - Impact-rated</li>
              <li><strong>Gloves</strong> - For hand protection</li>
              <li><strong>Hard hat</strong> - Required if overhead hazards exist</li>
              <li><strong>Ear protection</strong> - Recommended for extended use</li>
            </ul>

            <h3 className="text-2xl font-bold">Operating Limits</h3>

            <div className="not-prose">
              <div className="my-6 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-600" />
                    <span className="text-gray-700"><strong>Maximum slope:</strong> 25° (47% grade) - Travel straight up/down only</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-600" />
                    <span className="text-gray-700"><strong>No passengers:</strong> Operator only, no riders ever</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-600" />
                    <span className="text-gray-700"><strong>Utility clearance:</strong> Stay 3+ meters from overhead power lines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-600" />
                    <span className="text-gray-700"><strong>Weight limits:</strong> Don't exceed 3,200 lb rated operating capacity</span>
                  </li>
                </ul>
              </div>
            </div>

            <h2 className="mt-12">7. Common Saint John Project Examples</h2>

            <h3 className="text-2xl font-bold">Residential Foundation (South End)</h3>
            <p><strong>Project:</strong> Basement excavation for new home addition<br />
            <strong>Duration:</strong> 3-4 days<br />
            <strong>Cost:</strong> $450/day × 4 days + $300 delivery = $2,100 total<br />
            <strong>Savings vs. contractor:</strong> ~$3,500</p>

            <h3 className="text-2xl font-bold">Pool Installation (Rothesay)</h3>
            <p><strong>Project:</strong> 16' × 32' in-ground pool excavation<br />
            <strong>Duration:</strong> 2 days<br />
            <strong>Cost:</strong> $450/day × 2 days + $300 delivery = $1,200 total<br />
            <strong>Savings vs. contractor:</strong> ~$2,200</p>

            <h3 className="text-2xl font-bold">Driveway Extension (Quispamsis)</h3>
            <p><strong>Project:</strong> 50-foot driveway extension, grading & paving prep<br />
            <strong>Duration:</strong> 5-6 days<br />
            <strong>Cost:</strong> Weekly rate $2,700 + $300 delivery = $3,000 total<br />
            <strong>Savings vs. contractor:</strong> ~$4,000</p>

            <h2 className="mt-12">8. Booking Process Step-by-Step</h2>

            <div className="not-prose">
              <div className="my-6 space-y-4">
                {[
                  { step: '1', title: 'Check Availability', description: 'Book online or call (506) 643-1575 to confirm equipment availability for your dates' },
                  { step: '2', title: 'Provide Insurance', description: 'Submit Certificate of Insurance or we can arrange coverage for you' },
                  { step: '3', title: 'Card Verification', description: '$500 hold placed on your card (not charged, just authorized)' },
                  { step: '4', title: 'Schedule Delivery', description: 'Choose delivery date/time convenient for you' },
                  { step: '5', title: 'Equipment Delivered', description: 'We deliver, provide orientation, answer questions' },
                  { step: '6', title: 'Complete Project', description: 'Use equipment for your project timeline' },
                  { step: '7', title: 'Return & Inspection', description: 'We pick up, inspect, and release your hold within 5-7 days' },
                ].map((item: any) => (
                  <div key={item.step} className="flex gap-4 rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#E1BC56] text-xl font-bold text-black">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="mb-2 text-lg font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-700">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="mt-12">9. Local Saint John Tips</h2>

            <h3 className="text-2xl font-bold">Soil Conditions</h3>
            <p>Saint John has varied soil types:</p>
            <ul>
              <li><strong>North End/Millidgeville:</strong> Heavy clay - digs well but sticky when wet</li>
              <li><strong>South End/Uptown:</strong> Rocky ledge - expect some rock, may need breaker</li>
              <li><strong>East Saint John:</strong> Sandy loam - easy digging, good drainage</li>
              <li><strong>West Saint John:</strong> Mixed - varies by neighborhood</li>
            </ul>

            <h3 className="text-2xl font-bold">Best Seasons for Projects</h3>
            <ul>
              <li><strong>April-June:</strong> Peak construction season - book 2-3 weeks ahead</li>
              <li><strong>July-September:</strong> Busy with landscaping - book 1-2 weeks ahead</li>
              <li><strong>October:</strong> Good availability, ideal for foundation work before freeze</li>
              <li><strong>November-March:</strong> Winter rentals available (snow removal, limited excavation)</li>
            </ul>

            <h2 className="mt-12">10. Frequently Asked Questions</h2>

            <h3 className="text-2xl font-bold">Do I need experience to rent?</h3>
            <p>You must be competent to operate the equipment. If you're unsure, we recommend hiring an operator or taking a training course. Many Saint John contractors offer day-rate operators ($250-400/day).</p>

            <h3 className="text-2xl font-bold">Can I rent for just half a day?</h3>
            <p>Our minimum rental is 1 full day (24 hours from delivery). For very small projects, consider hiring a contractor with equipment included.</p>

            <h3 className="text-2xl font-bold">What if it rains?</h3>
            <p>You&apos;re still responsible for the rental period. However, if severe weather (&gt;25mm rain) prevents work, we can sometimes adjust schedules - call us.</p>

            <h3 className="text-2xl font-bold">Can I tow it myself?</h3>
            <p>The SVL75-3 weighs 9,190 lb and requires a properly rated trailer, truck, and tie-downs. Unless you have commercial towing experience, we strongly recommend professional delivery.</p>

            <h2 className="mt-12">Ready to Start Your Saint John Project?</h2>

            <p>Now you have all the information you need to confidently rent heavy equipment in Saint John. Whether you're tackling a foundation in the South End, a pool in Rothesay, or land clearing in Quispamsis, proper planning ensures project success.</p>

            <div className="not-prose">
              <div className="my-8 rounded-lg bg-gradient-to-r from-[#A90F0F] to-[#8a0c0c] p-8 text-white">
                <h3 className="mb-4 text-2xl font-bold">Book Your Equipment Today</h3>
                <p className="mb-6 text-lg text-white/90">
                  Professional Kubota SVL75-3 rental with delivery, insurance help, and 24/7 support. Serving all of Greater Saint John.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href="/book" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-bold text-[#A90F0F] shadow-xl hover:bg-gray-100">
                    <span>📅</span><span>Book Equipment Now</span>
                  </Link>
                  <a href="tel:+15066431575" className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 font-bold text-white shadow-xl hover:bg-white/10">
                    <span>📞</span><span>Call (506) 643-1575</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Related Service Areas */}
            <div className="mt-12">
              <h3 className="mb-6 text-2xl font-bold text-gray-900">Service Areas Near Saint John</h3>
              <NearbyServiceAreas currentSlug="saint-john" />
            </div>

            {/* Related Links */}
            <div className="mt-12 not-prose">
              <h3 className="mb-6 text-2xl font-bold text-gray-900">Related Resources</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Link href="/safety" className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E1BC56] hover:shadow-lg">
                  <h4 className="mb-2 font-bold text-gray-900 group-hover:text-[#A90F0F]">Safety Guidance →</h4>
                  <p className="text-sm text-gray-700">Complete safety protocols and operator resources</p>
                </Link>
                <Link href="/insurance" className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E1BC56] hover:shadow-lg">
                  <h4 className="mb-2 font-bold text-gray-900 group-hover:text-[#A90F0F]">Insurance Guide →</h4>
                  <p className="text-sm text-gray-700">How to get equipment rental insurance in NB</p>
                </Link>
                <Link href="/faq" className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E1BC56] hover:shadow-lg">
                  <h4 className="mb-2 font-bold text-gray-900 group-hover:text-[#A90F0F]">FAQ →</h4>
                  <p className="text-sm text-gray-700">34 frequently asked questions answered</p>
                </Link>
                <Link href="/equipment" className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E1BC56] hover:shadow-lg">
                  <h4 className="mb-2 font-bold text-gray-900 group-hover:text-[#A90F0F]">Equipment Specs →</h4>
                  <p className="text-sm text-gray-700">Full Kubota SVL75-3 specifications</p>
                </Link>
              </div>
            </div>

          </div>
        </article>

        <Footer />
      </div>
    </>
  );
}

