'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function EquipmentRiderPage() {
  return (
    <>
      <style jsx>{`
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
      `}</style>
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

          {/* Multiple Logo Watermarks - Responsive */}
          <div className="pointer-events-none absolute inset-0">
            {/* Desktop Watermarks - Original (hidden on mobile) */}
            <div className="hidden md:block">

            </div>

            {/* Mobile Only - More Watermarks for better coverage */}
            <div className="md:hidden">
              <div className="absolute left-[2%] top-[3%] opacity-10"><div className="relative h-20 w-20"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="20px" unoptimized /></div></div>
              <div className="absolute right-[2%] top-[5%] rotate-12 opacity-10"><div className="relative h-18 w-18"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="18px" unoptimized /></div></div>
              <div className="absolute left-[20%] top-[12%] rotate-[-8deg] opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute right-[15%] top-[15%] rotate-[10deg] opacity-10"><div className="relative h-14 w-14"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="14px" unoptimized /></div></div>
              <div className="absolute left-1/2 top-[2%] -translate-x-1/2 rotate-3 opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute left-[5%] top-1/3 -rotate-6 opacity-10"><div className="relative h-24 w-24"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="24px" unoptimized /></div></div>
              <div className="absolute right-[5%] top-[45%] rotate-[8deg] opacity-10"><div className="relative h-24 w-24"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="24px" unoptimized /></div></div>
              <div className="absolute left-[10%] top-[50%] rotate-[5deg] opacity-10"><div className="relative h-18 w-18"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="18px" unoptimized /></div></div>
              <div className="absolute right-[12%] top-[55%] -rotate-[7deg] opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute bottom-[8%] left-[8%] rotate-6 opacity-10"><div className="relative h-20 w-20"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="20px" unoptimized /></div></div>
              <div className="absolute bottom-[3%] right-[3%] -rotate-6 opacity-10"><div className="relative h-22 w-22"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="22px" unoptimized /></div></div>
              <div className="absolute bottom-[15%] left-[25%] rotate-[4deg] opacity-10"><div className="relative h-14 w-14"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="14px" unoptimized /></div></div>
              <div className="absolute bottom-[12%] right-[20%] -rotate-[5deg] opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute bottom-[2%] left-1/3 -rotate-3 opacity-10"><div className="relative h-18 w-18"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="18px" unoptimized /></div></div>
            </div>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="headline-3d text-center">
              <div className="mb-6 inline-block">
                <span className="rounded-full border border-[#E1BC56]/30 bg-[#E1BC56]/20 px-6 py-2 text-sm font-semibold tracking-wide text-[#E1BC56] backdrop-blur-sm">
                  EQUIPMENT-SPECIFIC RIDER
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                2025 Kubota
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  SVL75-3 Rider
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Equipment-specific terms, safety requirements, and operating limits for your rental.
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
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-white p-8 shadow-lg">
              <div className="prose prose-lg max-w-none">
                {/* Header */}
                <div className="mb-8 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
                  <p className="mb-2 text-sm text-gray-600">
                    This Rider is incorporated into and made part of the U-Dig It Rentals Inc. Rental Agreement. If there is any conflict, the stricter term (greater safety/financial protection) applies unless otherwise agreed in writing by U-Dig It Rentals Inc. ("Owner").
                  </p>
                </div>

                {/* Section 1: Unit Details */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">1) Unit Details</h2>
                <div className="mb-6 space-y-3 text-gray-700">
                  <p><strong>Equipment:</strong> 2025 Kubota SVL75-3 (Compact Track Loader)</p>
                  <p><strong>Serial/Unit ID:</strong> ____________________________________________</p>
                  <p><strong>Hours at Release:</strong> __________ h</p>
                  <p><strong>Replacement Value:</strong> $120,000 CAD (base unit w/ bucket; update if attachments are included)</p>
                  <p><strong>Operating Weight:</strong> 9,190 lb (4,169 kg) open cab / 9,420 lb (4,273 kg) closed cab</p>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="font-semibold mb-2">Transport Dimensions (machine only):</p>
                    <ul className="text-sm space-y-1">
                      <li>• Length (no bucket): 112 in (2,844 mm)</li>
                      <li>• Length (bucket on ground): 142.1 in (3,609 mm)</li>
                      <li>• Height (top of cab): 81.8 in (2,078 mm)</li>
                      <li>• Vehicle width: 65.9 in (1,675 mm) standard / 69.1 in (1,755 mm) wide</li>
                      <li>• Width with bucket: 68 in (1,727 mm)</li>
                    </ul>
                  </div>
                  <p><strong>Included Attachments:</strong> ____________________________________________</p>
                  <p><strong>Rental Start (date & time):</strong> ________________________________________________________________</p>
                  <p><strong>Rental End (date & time):</strong> ________________________________________________________________</p>
                  <p><strong>Included Hour Allowance:</strong> 8 engine-hours/day, 40/week; excess billed at $65/hr.</p>
                  <p><strong>Delivery/Pickup by Owner:</strong> [Yes/No]</p>
                  <p><strong>Customer Tow/Haul:</strong> [Yes/No]</p>
                  <p><strong>Float/Delivery Fee (if applicable):</strong> $150 each way (total $300).</p>
                </div>

                {/* Section 2: Insurance */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">2) Insurance (Required — "No COI, No Release")</h2>
                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
                  <p className="mb-4 text-gray-700">
                    Renter must maintain, at Renter's expense, and provide evidence (COI + endorsements) approved by Owner before release and continuous through the Rental Period:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span><strong>CGL:</strong> ≥ $2,000,000 per occurrence, U-Dig It Rentals Inc. as Additional Insured, primary & non-contributory, waiver of subrogation.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span><strong>Rented/Leased Equipment/Property:</strong> limit ≥ full replacement value above; U-Dig It Rentals Inc. as Loss Payee.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span><strong>Automobile Liability:</strong> ≥ $1,000,000 if Renter transports on public roads.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span><strong>Notice of Cancellation:</strong> insurer notice to Owner where available (e.g., 10–30 days).</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-sm font-semibold text-red-900">
                    Failure to maintain coverage is a material breach; Owner may refuse release or repossess at Renter's expense.
                  </p>
                  <p className="mt-2 text-sm text-red-800">
                    Need coverage? <Link href="/insurance" className="underline font-semibold">Getting Insurance</Link>
                  </p>
                </div>

                {/* Section 3: Transport & Tie-Down */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">3) Transport & Tie-Down</h2>
                <div className="mb-6 rounded-lg border-l-4 border-orange-500 bg-orange-50 p-6">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2 text-orange-600 font-bold">•</span>
                      <span>Professional loading/unloading only; no one in cab during load/unload.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-orange-600 font-bold">•</span>
                      <span>Trailer, hitch, tow vehicle, chains/binders & straps must be properly rated; minimum 4-point tie-down on the machine; secure attachments separately.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-orange-600 font-bold">•</span>
                      <span>Verify overhead/bridge/width/weight limits; obtain permits where required.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-orange-600 font-bold">•</span>
                      <span>No public-road operation of the machine unless legally permitted.</span>
                    </li>
                  </ul>
                </div>

                {/* Section 4: Operating Limits & Safety */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">4) Operating Limits & Safety</h2>
                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span><strong>Max grade/slope:</strong> ≤ 25°. Travel straight up/down; avoid side-hilling.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span>No riders; never lift/carry people; use manufacturer arm support/lock for work under raised arms.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span><strong>PPE:</strong> CSA boots, hi-viz, eye/ear protection; hard hat where overhead hazards exist.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span>Utility locates completed and on site before ground disturbance; maintain clearance from buried/overhead utilities.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span>Follow Operator's Manual, decals, and site rules; stop if unsafe and contact Owner.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span>No impairment (alcohol/cannabis/drugs); competent adult operators (21+) only.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span>No sub-rental or lending without Owner's written consent.</span>
                    </li>
                  </ul>
                </div>

                {/* Section 5: Prohibited Uses */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">5) Prohibited Uses</h2>
                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span>Demolition beyond rated capability; impact/ramming; lifting people or non-approved man-baskets.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span>Hazmat/contamination (fuel spills, sewage, creosote, asbestos, etc.).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span>Operation in saltwater/surf, deep mud beyond track height, or fire areas without written approval.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-600 font-bold">•</span>
                      <span>Alterations, disabling safety devices, or removing telematics/GPS.</span>
                    </li>
                  </ul>
                </div>

                {/* Section 6: Care & Maintenance */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">6) Care & Maintenance</h2>
                <div className="mb-6 text-gray-700">
                  <ul className="space-y-2">
                    <li>• Keep loads/attachments low and within rated capacity.</li>
                    <li>• Daily pre-start inspection; grease per manual; check fluids, tracks, safety devices.</li>
                    <li>• Report defects immediately; tag-out unsafe equipment—do not continue use.</li>
                    <li>• Renter responsible for fuel and basic cleaning.</li>
                  </ul>
                </div>

                {/* Section 7: Damage, Loss, Theft & Environmental */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">7) Damage, Loss, Theft & Environmental</h2>
                <div className="mb-6 rounded-lg border-l-4 border-orange-500 bg-orange-50 p-6">
                  <p className="mb-3 text-gray-700">
                    Renter is responsible for all damage, loss, theft, vandalism, contamination, recovery/winch-out, and down-time per the Rental Agreement.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Tracks, cutting edges, teeth, glass, hoses, lights, hydraulic couplers and cab interior are billable if beyond normal wear.</li>
                    <li>• <strong>Theft/vandalism:</strong> notify police and Owner <strong>Immediately</strong> & provide report number.</li>
                    <li>• <strong>Spills/contamination:</strong> immediate containment and cleanup at Renter's expense.</li>
                  </ul>
                </div>

                {/* Section 8: Financial Terms */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">8) Financial Terms</h2>
                <div className="mb-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">•</span>
                      <span><strong>Deposit / Pre-Authorization (Security Hold):</strong> $500 taken at booking/release; applied to fuel/cleaning/minor damage/consumables/overages; does not cap liability.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">•</span>
                      <span><strong>Fuel:</strong> return full; otherwise flat $100 refuel charge (or actual fuel + service, whichever is greater).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">•</span>
                      <span><strong>Cleaning:</strong> excessive mud/debris removal billed at $100 Flat Rate</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">•</span>
                      <span><strong>Delivery/Recovery/Standby:</strong> billed per posted rates; unsuccessful delivery due to site inaccessibility is billable.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">•</span>
                      <span><strong>Late Return/Holdover:</strong> additional day(s) automatically billed at current rates until returned.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">•</span>
                      <span><strong>Optional LDW (if offered):</strong> Limited Damage Waiver is not insurance, has exclusions/deductible, and does not replace required liability insurance.</span>
                    </li>
                  </ul>
                </div>

                {/* Section 9: Telematics, Photos & Privacy */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">9) Telematics, Photos & Privacy</h2>
                <div className="mb-6 text-gray-700">
                  <ul className="space-y-2">
                    <li>• Owner may use GPS/telematics/engine-hour data for location, hour tracking, diagnostics, and recovery.</li>
                    <li>• Renter consents to pre- and post-rental photos/video for condition documentation.</li>
                    <li>• (Optional) Media permission for marketing: [ ] Opt-in [ ] Decline</li>
                  </ul>
                </div>

                {/* Section 10: Site & Access */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">10) Site & Access</h2>
                <div className="mb-6 text-gray-700">
                  <ul className="space-y-2">
                    <li>• Renter provides safe, level access for delivery, operation, and pickup.</li>
                    <li>• Snow/ice/mud management is Renter's responsibility unless purchased as a service.</li>
                    <li>• Do not operate on newly poured asphalt/concrete without protection; surface damage is billable.</li>
                  </ul>
                </div>

                {/* Section 11: Return Condition */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">11) Return Condition</h2>
                <div className="mb-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-6">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Park level, bucket/attachment down, brake set; record hour meter.</li>
                    <li>• Clean radiator/engine bay of debris; remove mud from tracks/undercarriage.</li>
                    <li>• Return all attachments, keys, manuals, and accessories.</li>
                  </ul>
                </div>

                {/* Section 12: Remedies & Repossession */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">12) Remedies & Repossession</h2>
                <div className="mb-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-6">
                  <p className="mb-3 text-sm text-gray-700">
                    Upon breach or unsafe use, Owner may suspend operation and repossess immediately without notice.
                  </p>
                  <p className="text-sm text-gray-700">
                    Owner is not liable for consequential or incidental damages; total liability shall not exceed amounts received for the specific rental, except for damage caused by Owner's gross negligence or willful misconduct.
                  </p>
                </div>

                {/* Section 13: Governing Law */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">13) Governing Law</h2>
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <p className="text-gray-700">
                    This Rider and the Rental Agreement are governed by the laws of the Province of New Brunswick, Canada.
                  </p>
                </div>

                {/* Section 14: Acceptance & Authority to Charge */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">14) Acceptance & Authority to Charge</h2>
                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
                  <p className="mb-4 text-sm text-gray-700">
                    By signing below, Renter acknowledges and agrees that:
                  </p>
                  <ul className="space-y-2 text-xs text-gray-700">
                    <li>(i) the equipment has been received in good condition (unless noted on the Pre-Rental Condition Notes);</li>
                    <li>(ii) this Rider forms part of the Rental Agreement;</li>
                    <li>(iii) Renter has read this Rider and the Rental Agreement in full;</li>
                    <li>(iv) Renter understands the Insurance requirement ("No COI, No Release"), the Operating Limits & Safety rules (including max 25° slope and utility locates), and the Prohibited Uses;</li>
                    <li>(v) Renter is responsible for damage, loss, theft, contamination, and downtime as stated;</li>
                    <li>(vi) the $500 deposit is a pre-authorization and is not a cap on liability;</li>
                    <li>(vii) Renter authorizes U-Dig It Rentals Inc. to charge the card on file for fuel ($100 if not full), cleaning, over-hours, recovery, and any other amounts due under this Rider and the Rental Agreement; and</li>
                    <li>(viii) any optional LDW is not liability insurance and has exclusions.</li>
                  </ul>
                </div>

                {/* Signature Section */}
                <div className="mb-6 space-y-4 rounded-lg border-2 border-gray-300 bg-gray-50 p-6">
                  <p><strong>Pre-Rental Condition Notes (photos attached):</strong> ____________________________________________</p>
                  <p><strong>Renter Name:</strong> ____________________________________ Date: __________________</p>
                  <p><strong>Signature:</strong> _______________________________________ Phone: __________________</p>
                  <p><strong>Owner:</strong> U-Dig It Rentals Inc.    Date:________________</p>
                  <p><strong>Rep:</strong> __________________</p>
                  <p className="mt-4 text-xs text-gray-600">
                    Document ID: UDIR-SVL75-3-RIDER | Version: 1.0 | Effective: Aug 22, 2025
                  </p>
                </div>

                {/* Related Documents */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">Related Documents</h2>
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Link href="/terms" className="group rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-[#E1BC56] hover:bg-yellow-50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">Terms & Conditions</h3>
                        <p className="text-xs text-gray-600">Master rental agreement</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/safety" className="group rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-[#E1BC56] hover:bg-yellow-50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🦺</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">Safety Guidance</h3>
                        <p className="text-xs text-gray-600">Operator safety rules</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/insurance" className="group rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-[#E1BC56] hover:bg-yellow-50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🛡️</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">Insurance Guide</h3>
                        <p className="text-xs text-gray-600">Coverage requirements</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/disclaimer" className="group rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-[#E1BC56] hover:bg-yellow-50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚖️</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">Disclaimer</h3>
                        <p className="text-xs text-gray-600">Legal disclaimers</p>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Help Section */}
                <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <p className="font-semibold text-blue-900">⚠️ Questions About This Equipment Rider?</p>
                  <p className="mt-2 text-blue-800">
                    If you have questions about equipment-specific terms, safety requirements, or operating limits, please contact us. We're here to ensure your rental is safe and successful.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <a
                      href="tel:+15066431575"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      <span>📞</span>
                      <span>Call (506) 643-1575</span>
                    </a>
                    <a
                      href="mailto:nickbaxter@udigit.ca"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      <span>✉️</span>
                      <span>Email Us</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}


