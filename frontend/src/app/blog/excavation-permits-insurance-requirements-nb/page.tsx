import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { AlertTriangle, Calendar, CheckCircle, Clock, FileText, Shield, User } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Excavation Permits & Insurance Requirements in New Brunswick 2025 | Complete Guide',
  description: 'Navigate NB excavation regulations with confidence. Complete 2025 guide to permits, utility locates, insurance requirements, and legal compliance for construction projects in New Brunswick.',
  keywords: 'excavation permit new brunswick, nb utility locate requirements, construction insurance nb, building permit saint john, excavation regulations new brunswick, nb one call',
  openGraph: {
    title: 'NB Excavation Permits & Insurance Guide 2025 | U-Dig It',
    description: 'Complete guide to NB regulations: permits, utility locates, insurance requirements, legal compliance.',
    url: 'https://udigit.ca/blog/excavation-permits-insurance-requirements-nb',
    type: 'article',
  },
  alternates: {
    canonical: 'https://udigit.ca/blog/excavation-permits-insurance-requirements-nb'
  }
};

export default function PermitsInsuranceBlogPost() {
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
              <span className="rounded-full border border-[#E1BC56]/30 bg-[#E1BC56]/20 px-4 py-2 text-sm font-semibold tracking-wide text-[#E1BC56]">REGULATIONS</span>
            </div>

            <h1 className="mb-6 text-3xl font-bold leading-tight text-white md:text-5xl">
              Excavation Permits & Insurance Requirements in New Brunswick: 2025 Guide
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                October 30, 2025
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                7 min read
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

            <div className="rounded-lg border-l-4 border-[#E1BC56] bg-yellow-50 p-6 not-prose">
              <p className="text-lg text-gray-700">
                <strong>Planning an excavation project in New Brunswick?</strong> Understanding permit requirements and insurance obligations can save you from costly fines, project delays, and legal liability. This complete 2025 guide covers everything you need to know about excavation regulations, utility locates, building permits, and insurance requirements in NB.
              </p>
            </div>

            <h2 className="mt-12">1. Utility Locates: The #1 Legal Requirement</h2>

            <div className="not-prose">
              <div className="my-6 rounded-lg border-2 border-red-200 bg-red-50 p-6">
                <div className="mb-4 flex items-start gap-3">
                  <AlertTriangle className="h-8 w-8 flex-shrink-0 text-red-600" />
                  <div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">⚠️ LEGAL REQUIREMENT: Call Before You Dig</h3>
                    <div className="space-y-2 text-gray-700">
                      <p><strong>Service:</strong> NB One Call</p>
                      <p><strong>Phone:</strong> 1-800-565-2754</p>
                      <p><strong>Notice Required:</strong> Minimum 3 business days before digging</p>
                      <p><strong>Cost:</strong> FREE</p>
                      <p><strong>Coverage:</strong> All underground utilities (power, gas, telecom, water, sewer, fiber optic)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-red-100 p-4">
                  <p className="font-bold text-red-900">⚡ Penalties for not calling:</p>
                  <ul className="mt-2 space-y-1 text-sm text-red-900">
                    <li>• Fines up to $100,000 (Excavation Damage Prevention Act)</li>
                    <li>• Full liability for all damages and service disruption</li>
                    <li>• Potential criminal charges if injury or death occurs</li>
                    <li>• Insurance claims may be DENIED</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold">How Utility Locates Work</h3>

            <ol>
              <li><strong>Call NB One Call:</strong> Provide project address, dig area description, start date</li>
              <li><strong>Utility companies notified:</strong> NB Power, Enbridge Gas, Bell, Rogers, Saint John Water, etc.</li>
              <li><strong>Locators mark utilities:</strong> Colored flags/paint indicate buried lines</li>
              <li><strong>Wait 3 business days:</strong> All utilities must respond within this timeframe</li>
              <li><strong>Hand dig within 1 meter:</strong> Use hand tools (not machine) near marked utilities</li>
              <li><strong>Locate valid 21 days:</strong> If project delayed, must call again</li>
            </ol>

            <h2 className="mt-12">2. Municipal Building Permits (Saint John)</h2>

            <h3 className="text-2xl font-bold">When You Need a Building Permit</h3>

            <div className="not-prose">
              <div className="my-6 space-y-3">
                {[
                  { situation: 'New home foundation', required: true, details: 'Full building permit required' },
                  { situation: 'Home addition foundation', required: true, details: 'Building permit + structural drawings' },
                  { situation: 'In-ground pool', required: true, details: 'Pool permit from Planning & Development' },
                  { situation: 'Detached garage/shed foundation', required: true, details: 'If >10 m² (108 sq ft)' },
                  { situation: 'Landscaping/grading', required: false, details: 'Unless changing drainage patterns' },
                  { situation: 'Driveway (on your property)', required: false, details: 'No permit needed' },
                  { situation: 'Driveway (crossing sidewalk/street)', required: true, details: 'Right-of-Way permit required' },
                  { situation: 'Utility trench (private property)', required: false, details: 'Call utilities, get locates' },
                ].map((item: any, index: any) => (
                  <div key={index} className={`rounded-lg border-2 p-4 ${item.required ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                    <div className="flex items-start gap-3">
                      {item.required ? (
                        <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                      ) : (
                        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      )}
                      <div>
                        <strong className="text-gray-900">{item.situation}:</strong>
                        <span className={`ml-2 font-semibold ${item.required ? 'text-red-700' : 'text-green-700'}`}>
                          {item.required ? 'PERMIT REQUIRED' : 'No permit needed'}
                        </span>
                        <p className="mt-1 text-sm text-gray-700">{item.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-2xl font-bold">City of Saint John Contacts</h3>

            <ul>
              <li><strong>Planning & Development:</strong> (506) 658-2855</li>
              <li><strong>Building Inspections:</strong> (506) 658-2870</li>
              <li><strong>Engineering Services:</strong> (506) 658-2850</li>
              <li><strong>Address:</strong> City Hall, 15 Market Square, Saint John</li>
              <li><strong>Hours:</strong> Monday-Friday, 8:30 AM - 4:30 PM</li>
            </ul>

            <h2 className="mt-12">3. Insurance Requirements for Equipment Rental</h2>

            <p><strong>U-Dig It Rentals requires proof of insurance BEFORE equipment release. Here's exactly what you need:</strong></p>

            <h3 className="text-2xl font-bold">Required Coverage</h3>

            <div className="not-prose">
              <div className="my-6 space-y-4">
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <h4 className="text-lg font-bold text-gray-900">Commercial General Liability (CGL)</h4>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Limit:</strong> $2,000,000 per occurrence minimum</li>
                    <li>• <strong>Additional Insured:</strong> U-Dig It Rentals Inc. must be named</li>
                    <li>• <strong>Primary & Non-Contributory:</strong> Required endorsement</li>
                    <li>• <strong>Waiver of Subrogation:</strong> In favor of U-Dig It Rentals Inc.</li>
                    <li>• <strong>Coverage:</strong> Bodily injury, property damage, personal injury</li>
                  </ul>
                </div>

                <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-purple-600" />
                    <h4 className="text-lg font-bold text-gray-900">Rented/Leased Equipment Coverage</h4>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Limit:</strong> Full replacement value ($120,000 for SVL75-3)</li>
                    <li>• <strong>Loss Payee:</strong> U-Dig It Rentals Inc.</li>
                    <li>• <strong>Coverage:</strong> Physical damage, theft, fire, vandalism</li>
                    <li>• <strong>Deductible:</strong> Your responsibility</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold">How to Get Insurance in New Brunswick</h3>

            <p><strong>Option 1: Add to Existing Policy (Homeowners/Business)</strong></p>
            <ul>
              <li>Call your broker and request "equipment rental" or "rented equipment" endorsement</li>
              <li>Provide rental details (equipment value, rental dates, project description)</li>
              <li>Cost: Typically $150-400 for short-term rental</li>
              <li>Turnaround: 1-2 business days</li>
            </ul>

            <p><strong>Option 2: Short-Term Rental Policy</strong></p>
            <ul>
              <li>Designed specifically for equipment renters</li>
              <li>Covers both liability AND equipment</li>
              <li>Cost: $300-600 depending on project scope</li>
              <li>Turnaround: Same day or next day</li>
            </ul>

            <p><strong>Option 3: U-Dig It Referral Partners</strong></p>
            <p>We work with Saint John insurance brokers who specialize in equipment rental coverage and can provide same-day quotes. <Link href="/insurance" className="font-semibold text-[#A90F0F] underline">See our Insurance Guide</Link> for recommended brokers.</p>

            <div className="rounded-lg border-l-4 border-green-600 bg-green-50 p-6 not-prose">
              <p className="text-gray-700">
                <strong>💡 Pro Tip:</strong> Get your insurance quote BEFORE booking equipment to avoid delays. Most brokers can provide coverage certificates within 24 hours.
              </p>
            </div>

            <h2 className="mt-12">4. Provincial Regulations (All of NB)</h2>

            <h3 className="text-2xl font-bold">Environmental Regulations</h3>

            <p><strong>You need provincial approval for:</strong></p>

            <ul>
              <li><strong>Watercourse alteration:</strong> Any work within 30m of stream, river, or wetland</li>
              <li><strong>Fill placement:</strong> Dumping clean fill in wetlands or near water</li>
              <li><strong>Large excavations:</strong> Removal of &gt;1,000 cubic meters of material</li>
              <li><strong>Contaminated sites:</strong> Any site with known or suspected contamination</li>
            </ul>

            <p><strong>Contact:</strong> NB Department of Environment - Environmental Impact Assessment: 1-877-662-6800</p>

            <h3 className="text-2xl font-bold">WorkSafe NB Requirements</h3>

            <p>If you're hiring employees or subcontractors for your project:</p>

            <ul>
              <li><strong>WCB coverage required</strong> for all workers</li>
              <li><strong>Fall protection plan</strong> for excavations over 3m (10 feet) deep</li>
              <li><strong>Confined space procedures</strong> for deep pits or trenches</li>
              <li><strong>Traffic control plan</strong> if working near roads</li>
            </ul>

            <h2 className="mt-12">5. Municipality-Specific Rules</h2>

            <h3 className="text-2xl font-bold">Saint John</h3>
            <ul>
              <li>Excavation within 1m of property line requires Building Permit</li>
              <li>Driveway/sidewalk work requires Right-of-Way permit</li>
              <li>Storm water management plan for sites over 1 acre</li>
              <li><strong>Contact:</strong> (506) 658-2855</li>
            </ul>

            <h3 className="text-2xl font-bold">Rothesay</h3>
            <ul>
              <li>Building permit for all foundation work</li>
              <li>Pool permit with engineered drawings</li>
              <li>Strict setback requirements (contact Town before digging)</li>
              <li><strong>Contact:</strong> (506) 848-6600</li>
            </ul>

            <h3 className="text-2xl font-bold">Quispamsis</h3>
            <ul>
              <li>Building permit for pools, foundations, major grading</li>
              <li>Environmental assessment for wetland areas</li>
              <li>Erosion control required for large sites</li>
              <li><strong>Contact:</strong> (506) 849-5000</li>
            </ul>

            <h2 className="mt-12">6. Cost of Non-Compliance</h2>

            <p><strong>Real examples of what happens when regulations are ignored:</strong></p>

            <div className="not-prose">
              <div className="my-6 space-y-4">
                <div className="rounded-lg border border-red-300 bg-white p-6">
                  <h4 className="mb-2 font-bold text-red-900">❌ Scenario: Homeowner digs pool without permit (Rothesay)</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Stop-work order issued: $500 fine</li>
                    <li>• Building permit retroactively required: $400 application + $800 inspection fees</li>
                    <li>• Engineered drawings required after fact: $1,500-2,500</li>
                    <li>• <strong>Total cost: $3,200-4,400 + project delays</strong></li>
                  </ul>
                </div>

                <div className="rounded-lg border border-red-300 bg-white p-6">
                  <h4 className="mb-2 font-bold text-red-900">❌ Scenario: Contractor hits gas line without locate (Saint John)</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Fine from Enbridge Gas: $25,000-50,000</li>
                    <li>• Emergency response costs: $10,000-30,000</li>
                    <li>• Repair costs: $15,000-100,000+</li>
                    <li>• Liability for business disruption: $50,000-500,000</li>
                    <li>• <strong>Total cost: $100,000-680,000+</strong></li>
                  </ul>
                </div>

                <div className="rounded-lg border border-red-300 bg-white p-6">
                  <h4 className="mb-2 font-bold text-red-900">❌ Scenario: No insurance, equipment damaged</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Hydraulic line rupture repair: $3,500</li>
                    <li>• Downtime charges (3 days): $1,350</li>
                    <li>• Equipment recovery/transport: $800</li>
                    <li>• <strong>Total out-of-pocket: $5,650</strong></li>
                    <li>• <em>With insurance: $500-1,000 deductible only</em></li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="mt-12">7. Quick Reference Checklist</h2>

            <div className="not-prose">
              <div className="my-6 rounded-lg border-2 border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-xl font-bold text-gray-900">Before Starting ANY Excavation in NB:</h3>
                <div className="space-y-3">
                  {[
                    { task: 'Call NB One Call (1-800-565-2754)', deadline: '3+ business days before' },
                    { task: 'Check if building/pool permit needed', deadline: '2-4 weeks before (permit processing time)' },
                    { task: 'Obtain insurance coverage', deadline: '1-3 days before' },
                    { task: 'Submit insurance certificates to rental company', deadline: 'Before equipment release' },
                    { task: 'Wait for utility locates to be marked', deadline: 'Full 3 business days' },
                    { task: 'Photograph all locate markings', deadline: 'Before digging' },
                    { task: 'Hand-dig test holes within 1m of utilities', deadline: 'Before using machine' },
                  ].map((item: any, index: any) => (
                    <div key={index} className="flex items-start gap-3 rounded-md border border-gray-200 p-4">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#E1BC56] text-sm font-bold text-black">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.task}</div>
                        <div className="text-sm text-gray-600">{item.deadline}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="mt-12">8. U-Dig It Rentals: We Make Compliance Easy</h2>

            <p><strong>When you rent from us, we help with:</strong></p>

            <div className="not-prose">
              <div className="my-6 space-y-3">
                {[
                  'Insurance referrals to NB brokers who specialize in equipment rental',
                  'Permit guidance specific to your Saint John/NB municipality',
                  'Utility locate requirements and reminders',
                  'Safety briefing and operator orientation at delivery',
                  'Written safety checklists and operating guidelines',
                  'Equipment-specific safety decals and manuals',
                  '24/7 support if you encounter issues or have questions',
                ].map((service: any, index: any) => (
                  <div key={index} className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700">{service}</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="mt-12">Ready to Start Your Project Legally & Safely?</h2>

            <p>Compliance isn't complicated when you have the right guidance. U-Dig It Rentals provides professional equipment rental with complete regulatory support for Greater Saint John projects.</p>

            <div className="not-prose">
              <div className="my-8 rounded-lg bg-gradient-to-r from-[#A90F0F] to-[#8a0c0c] p-8 text-white">
                <h3 className="mb-4 text-2xl font-bold">Rent Equipment with Confidence</h3>
                <p className="mb-6 text-lg text-white/90">
                  We'll help you navigate permits, insurance, and safety requirements. Professional service with complete compliance support.
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

            <div className="mt-12 not-prose">
              <h3 className="mb-6 text-2xl font-bold text-gray-900">Related Resources</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Link href="/insurance" className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E1BC56] hover:shadow-lg">
                  <h4 className="mb-2 font-bold text-gray-900 group-hover:text-[#A90F0F]">Insurance Guide →</h4>
                  <p className="text-sm text-gray-700">How to get equipment rental insurance</p>
                </Link>
                <Link href="/safety" className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E1BC56] hover:shadow-lg">
                  <h4 className="mb-2 font-bold text-gray-900 group-hover:text-[#A90F0F]">Safety Guidance →</h4>
                  <p className="text-sm text-gray-700">Complete safety protocols</p>
                </Link>
                <Link href="/blog" className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E1BC56] hover:shadow-lg">
                  <h4 className="mb-2 font-bold text-gray-900 group-hover:text-[#A90F0F]">All Blog Posts →</h4>
                  <p className="text-sm text-gray-700">More equipment rental guides</p>
                </Link>
                <Link href="/faq" className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E1BC56] hover:shadow-lg">
                  <h4 className="mb-2 font-bold text-gray-900 group-hover:text-[#A90F0F]">FAQ →</h4>
                  <p className="text-sm text-gray-700">Frequently asked questions</p>
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

