import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { AlertTriangle, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How to Operate Kubota SVL75-3 Safely: Complete Guide 2025 | U-Dig It',
  description: 'Master safe operation of the Kubota SVL75-3 track loader. Complete guide covering pre-start checks, safety protocols, operating tips, and common mistakes to avoid. Expert advice from U-Dig It Rentals NB.',
  keywords: 'kubota svl75-3 operation, how to operate track loader, kubota safety guide, skid steer operation tips, heavy equipment safety nb, track loader training',
  openGraph: {
    title: 'How to Operate Kubota Track Loader Safely | Complete Guide',
    description: 'Expert safety & operation guide for Kubota SVL75-3. Pre-start checks, safety protocols, operating tips.',
    url: 'https://udigit.ca/blog/kubota-svl75-safety-operation-tips',
    type: 'article',
  },
  alternates: {
    canonical: 'https://udigit.ca/blog/kubota-svl75-safety-operation-tips'
  }
};

export default function KubotaSafetyBlogPost() {
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
              <span className="rounded-full border border-red-500/30 bg-red-500/20 px-4 py-2 text-sm font-semibold tracking-wide text-red-400">SAFETY GUIDE</span>
            </div>

            <h1 className="mb-6 text-3xl font-bold leading-tight text-white md:text-5xl">
              How to Operate a Kubota Track Loader Safely: Complete Operator Guide
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                November 1, 2025
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                10 min read
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

            <div className="rounded-lg border-l-4 border-red-600 bg-red-50 p-6 not-prose">
              <p className="text-lg text-gray-700">
                <strong>Safety First:</strong> The Kubota SVL75-3 is a powerful machine weighing over 9,000 pounds. Improper operation can result in serious injury, death, or property damage. This guide provides essential safety information, but is NOT a substitute for reading the complete Operator's Manual and receiving proper training.
              </p>
            </div>

            <h2 className="mt-12">Pre-Start Inspection Checklist (Every Day)</h2>

            <p>NEVER skip the pre-start inspection. 80% of equipment failures can be prevented with daily checks:</p>

            <div className="not-prose">
              <div className="my-6 space-y-3">
                {[
                  { item: 'Visual Walk-Around', check: 'Look for fluid leaks, damage, loose parts, debris' },
                  { item: 'Engine Oil Level', check: 'Check dipstick - add if low (10W-30 or 15W-40)' },
                  { item: 'Hydraulic Fluid', check: 'Check sight glass - should be at "FULL COLD" mark' },
                  { item: 'Coolant Level', check: 'Check overflow tank - fill to MAX line if needed' },
                  { item: 'Fuel Level', check: 'Start each day with full tank to avoid downtime' },
                  { item: 'Tire/Track Condition', check: 'Inspect tracks for damage, proper tension' },
                  { item: 'Safety Devices', check: 'Test seat belt, door locks, beacon (if equipped)' },
                  { item: 'Bucket/Attachment', check: 'Inspect cutting edge, teeth, pins, cylinders' },
                  { item: 'Operator Station', check: 'Clean windows, adjust mirrors, test controls' },
                  { item: 'Lights & Signals', check: 'Test headlights, work lights, backup alarm' },
                ].map((item: any, index: any) => (
                  <div key={index} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <div>
                      <strong className="text-gray-900">{item.item}:</strong>
                      <span className="text-gray-700"> {item.check}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="mt-12">Starting & Operating the Machine</h2>

            <h3 className="text-2xl font-bold">Startup Procedure</h3>

            <ol className="space-y-3">
              <li><strong>Adjust seat & controls</strong> - Position seat for comfort and full control reach</li>
              <li><strong>Fasten seat belt</strong> - REQUIRED before starting engine</li>
              <li><strong>Ensure controls in neutral</strong> - Travel levers centered, no attachment movement</li>
              <li><strong>Turn key to ON position</strong> - Wait for glow plug indicator (cold weather)</li>
              <li><strong>Start engine</strong> - Don't crank more than 10 seconds at a time</li>
              <li><strong>Warm up 5 minutes</strong> - Let hydraulic oil reach operating temperature</li>
              <li><strong>Test all functions</strong> - Slowly test travel, lift, tilt before work</li>
            </ol>

            <h3 className="text-2xl font-bold">Travel & Maneuverability</h3>

            <p><strong>The SVL75-3 uses ISO controls (industry standard):</strong></p>

            <div className="not-prose">
              <div className="my-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                <h4 className="mb-4 text-lg font-bold text-gray-900">Control Pattern (ISO Standard)</h4>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Left Lever:</strong> Forward/back = Left track | Left/right = Bucket tilt</li>
                  <li><strong>Right Lever:</strong> Forward/back = Right track | Left/right = Boom lift</li>
                  <li><strong>Both Levers Forward:</strong> Travel forward</li>
                  <li><strong>Both Levers Back:</strong> Travel backward</li>
                  <li><strong>Left Forward + Right Back:</strong> Turn right (counter-rotate)</li>
                  <li><strong>Right Forward + Left Back:</strong> Turn left (counter-rotate)</li>
                </ul>
              </div>
            </div>

            <div className="not-prose">
              <div className="my-6 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6">
                <div className="mb-4 flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 flex-shrink-0 text-yellow-600" />
                  <div>
                    <h4 className="mb-2 text-lg font-bold text-gray-900">⚠️ Travel Safety Rules</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>✓ Keep bucket LOW (6-12 inches off ground) when traveling</li>
                      <li>✓ Travel SLOWLY over rough terrain (2-3 mph)</li>
                      <li>✓ Go STRAIGHT up/down slopes - never traverse across</li>
                      <li>✓ Maximum slope: 25° (47% grade)</li>
                      <li>✓ Watch for soft ground, holes, ditches</li>
                      <li>✓ Clear overhead before raising boom</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="mt-12">Safety Rules You MUST Follow</h2>

            <h3 className="text-2xl font-bold">NEVER Do These Things</h3>

            <div className="not-prose">
              <div className="my-6 space-y-3">
                {[
                  'Never carry passengers or allow riders',
                  'Never lift people or use as aerial platform (without approved man-basket)',
                  'Never exceed 25° slope / 47% grade',
                  'Never travel with bucket raised high',
                  'Never operate under influence of alcohol, cannabis, or drugs',
                  'Never disable safety devices or warning decals',
                  'Never exceed rated operating capacity (3,200 lb)',
                  'Never use bucket for ramming or demolition beyond rated capability',
                ].map((rule: any, index: any) => (
                  <div key={index} className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <span className="font-medium text-gray-900">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="mt-12">Common Operating Mistakes & How to Avoid Them</h2>

            <h3 className="text-2xl font-bold">Mistake #1: Digging Too Deep Without Shoring</h3>
            <p><strong>Risk:</strong> Trench collapse can bury and kill you<br />
            <strong>Solution:</strong> NB regulations require trench shoring/sloping for depths over 1.2m (4 feet). For deep excavation, slope walls at 1:1 or use trench boxes.</p>

            <h3 className="text-2xl font-bold">Mistake #2: Operating on Excessive Slopes</h3>
            <p><strong>Risk:</strong> Tip-overs are the #1 cause of equipment rental fatalities<br />
            <strong>Solution:</strong> Use a clinometer app or 25° guide. If it feels steep, it probably is. When in doubt, find another approach.</p>

            <h3 className="text-2xl font-bold">Mistake #3: Not Calling for Utility Locates</h3>
            <p><strong>Risk:</strong> Hitting underground power, gas, or fiber optic can be fatal and costs $10,000-100,000+<br />
            <strong>Solution:</strong> ALWAYS call NB One Call (1-800-565-2754) at least 3 business days before digging. It's FREE and legally required.</p>

            <h3 className="text-2xl font-bold">Mistake #4: Overloading the Bucket</h3>
            <p><strong>Risk:</strong> Machine becomes unstable, reduced control, hydraulic strain<br />
            <strong>Solution:</strong> Rated operating capacity is 3,200 lb (about 1 cubic yard of packed clay). Take smaller bites if material is heavy.</p>

            <h2 className="mt-12">Daily Operation Best Practices</h2>

            <h3 className="text-2xl font-bold">Efficient Digging Technique</h3>

            <ol>
              <li><strong>Position correctly</strong> - Approach dig area straight-on for maximum reach and power</li>
              <li><strong>Curl bucket first</strong> - Start with bucket fully curled (teeth down)</li>
              <li><strong>Lower & crowd</strong> - Lower boom while crowding bucket into material</li>
              <li><strong>Curl to fill</strong> - Curl bucket to scoop and retain material</li>
              <li><strong>Lift & swing</strong> - Raise boom and rotate to dump location</li>
              <li><strong>Dump & return</strong> - Dump load, return to dig position, repeat</li>
            </ol>

            <h3 className="text-2xl font-bold">Grading & Fine Work</h3>

            <ul>
              <li>Use <strong>float mode</strong> for dragging/leveling - bucket follows ground contour</li>
              <li>Make <strong>multiple passes</strong> - Don't try to achieve final grade in one pass</li>
              <li>Work <strong>from high to low</strong> - Push material downhill when possible</li>
              <li><strong>Back-drag</strong> for finish grading - Pull bucket toward machine for smooth finish</li>
            </ul>

            <h2 className="mt-12">Emergency Procedures</h2>

            <h3 className="text-2xl font-bold">If You Hit a Utility Line</h3>

            <div className="not-prose">
              <div className="my-6 rounded-lg border-2 border-red-200 bg-red-50 p-6">
                <ol className="space-y-3 text-gray-700">
                  <li><strong>1. STOP IMMEDIATELY</strong> - Shut down engine if safe to do so</li>
                  <li><strong>2. Call 911</strong> - If gas, power, or injury involved</li>
                  <li><strong>3. Call utility company</strong> - Number on locate markers</li>
                  <li><strong>4. Call U-Dig It Rentals</strong> - (506) 643-1575</li>
                  <li><strong>5. Evacuate area</strong> - Gas line: 100m radius, Power line: Stay in cab or jump clear</li>
                  <li><strong>6. Document everything</strong> - Photos, witness names, exact location</li>
                </ol>
              </div>
            </div>

            <h3 className="text-2xl font-bold">If Machine Tips Over</h3>

            <ul>
              <li><strong>Stay in cab if possible</strong> - ROPS (roll-over protection) will protect you</li>
              <li><strong>Do NOT jump</strong> - Machine may roll onto you</li>
              <li><strong>After stabilized:</strong> Shut down engine, exit carefully uphill side</li>
              <li><strong>Call for help:</strong> Professional recovery required - don't attempt self-recovery</li>
            </ul>

            <h2 className="mt-12">End-of-Day Procedures</h2>

            <div className="not-prose">
              <div className="my-6 space-y-3">
                {[
                  'Park on level ground in secure location',
                  'Lower bucket flat to ground',
                  'Set parking brake',
                  'Shut down engine properly (idle 3-5 min before shutdown)',
                  'Remove key and secure',
                  'Close/lock cab doors and windows',
                  'Record hour meter reading',
                  'Clean radiator/engine area of debris',
                  'Top off fuel tank (prevents condensation)',
                  'Report any issues or damage immediately',
                ].map((step: any, index: any) => (
                  <div key={index} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#E1BC56] text-sm font-bold text-black">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="mt-12">When to Call for Help</h2>

            <p><strong>Contact U-Dig It Rentals immediately if:</strong></p>

            <ul>
              <li>Warning lights illuminate (especially hydraulic temp or engine)</li>
              <li>Unusual noises (grinding, knocking, squealing)</li>
              <li>Loss of power or hydraulic function</li>
              <li>Leaking fluids (oil, coolant, hydraulic)</li>
              <li>Any safety concern or uncertain situation</li>
            </ul>

            <p className="rounded-lg border-l-4 border-green-600 bg-green-50 p-6 font-medium text-green-900">
              <strong>24/7 Support:</strong> We're always available at <a href="tel:+15066431575" className="underline">(506) 643-1575</a>. If you're unsure about ANYTHING, call us. We'd rather answer questions than deal with accidents.
            </p>

            <h2 className="mt-12">Additional Resources</h2>

            <div className="not-prose">
              <div className="my-8 rounded-lg bg-gradient-to-r from-[#A90F0F] to-[#8a0c0c] p-8 text-white">
                <h3 className="mb-4 text-2xl font-bold">Need Equipment in Saint John?</h3>
                <p className="mb-6 text-lg text-white/90">
                  Rent the Kubota SVL75-3 with complete operator orientation, safety briefing, and 24/7 support.
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
                <Link href="/safety" className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E1BC56] hover:shadow-lg">
                  <h4 className="mb-2 font-bold text-gray-900 group-hover:text-[#A90F0F]">Safety Guidance →</h4>
                  <p className="text-sm text-gray-700">Complete safety protocols and checklists</p>
                </Link>
                <Link href="/equipment" className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E1BC56] hover:shadow-lg">
                  <h4 className="mb-2 font-bold text-gray-900 group-hover:text-[#A90F0F]">Kubota SVL75-3 Specs →</h4>
                  <p className="text-sm text-gray-700">Full technical specifications</p>
                </Link>
                <Link href="/blog" className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E1BC56] hover:shadow-lg">
                  <h4 className="mb-2 font-bold text-gray-900 group-hover:text-[#A90F0F]">All Blog Posts →</h4>
                  <p className="text-sm text-gray-700">More equipment rental guides and tips</p>
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

