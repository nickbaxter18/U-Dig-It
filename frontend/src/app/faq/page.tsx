'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { FAQSchema } from '@/components/StructuredData';
import { AlertTriangle, BookOpen, Check, ChevronDown, ChevronUp, Clipboard, Copy, DollarSign, FileText, HardHat, Mail, RotateCcw, Search, Shield, Truck, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ReactElement, useEffect, useRef, useState } from 'react';

interface FAQ {
  id: string;
  question: string;
  answer: string | ReactElement;
  section: string;
}

const faqs: FAQ[] = [
  // Booking & Eligibility (4)
  {
    id: 'who-can-rent',
    section: 'Booking & Eligibility',
    question: 'Who can rent from U‑Dig It Rentals?',
    answer: 'Any individual or business 21+ who is competent to operate the equipment and who meets our insurance requirements can rent. You must have a valid driver\'s license or government ID, provide the required Certificate of Insurance (COI), and sign our rental agreement. Commercial entities must be in good standing.'
  },
  {
    id: 'minimum-age',
    section: 'Booking & Eligibility',
    question: 'Is there a minimum age?',
    answer: 'Yes — 21 years old. The person signing the rental agreement must be at least 21 and must be competent to operate heavy equipment or ensure that only qualified operators use the machine.'
  },
  {
    id: 'multiple-operators',
    section: 'Booking & Eligibility',
    question: 'Can multiple people operate the machine?',
    answer: 'Yes, but all operators must be competent adults (21+) authorized by the renter. The renter remains fully responsible for all operators\' actions. Any operator impaired by alcohol, cannabis, or drugs is strictly prohibited.'
  },
  {
    id: 'ineligible-reasons',
    section: 'Booking & Eligibility',
    question: 'What could make me ineligible?',
    answer: 'Lack of required insurance, failure to provide a valid ID or COI, past rental violations, outstanding debts, or any indication of unsafe practices. We reserve the right to refuse rental at our discretion.'
  },

  // Insurance & Liability (3)
  {
    id: 'insurance-required',
    section: 'Insurance & Liability',
    question: 'Do I need insurance to rent the skid steer?',
    answer: (
      <div className="space-y-3">
        <p><strong>Yes — insurance is mandatory.</strong> You need a Certificate of Insurance (COI) showing:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Commercial General Liability (CGL):</strong> ≥ $2,000,000 per occurrence</li>
          <li><strong>U-Dig It Rentals Inc.</strong> listed as <strong>Additional Insured</strong> (primary & non-contributory)</li>
          <li><strong>Waiver of Subrogation</strong> in our favor</li>
          <li><strong>Rented/Leased Equipment coverage:</strong> ≥ full replacement value ($120,000+)</li>
          <li><strong>U-Dig It Rentals Inc.</strong> as <strong>Loss Payee</strong></li>
          <li><strong>Auto Liability:</strong> ≥ $1,000,000 if you transport the equipment</li>
        </ul>
        <p className="text-sm text-blue-700 font-semibold">
          Need help? See our <Link href="/insurance" className="underline">Getting Insurance Guide</Link> with local brokers and email templates.
        </p>
      </div>
    )
  },
  {
    id: 'no-policy',
    section: 'Insurance & Liability',
    question: 'I don\'t have a policy — can I still rent?',
    answer: (
      <div className="space-y-3">
        <p>Often, yes! Many renters get a <strong>short-term rental policy</strong> from a broker for as little as $150–$300 for a week. Check our <Link href="/insurance" className="underline font-semibold">Insurance Guide</Link> for local brokers who specialize in equipment rental coverage.</p>
        <p className="text-sm text-gray-600">Typical turnaround: 1-2 business days. We recommend getting your COI at least 3 days before your rental start date.</p>
      </div>
    )
  },
  {
    id: 'why-renter-insurance',
    section: 'Insurance & Liability',
    question: 'Why do you still ask for the renter\'s insurance if you carry loss‑of‑use coverage?',
    answer: 'Our coverage protects us for downtime and loss-of-use. Your liability insurance protects you (and us as Additional Insured) if the equipment causes third-party injury or property damage. It also covers the replacement value if the machine is totaled or stolen. Both coverages work together for complete protection.'
  },

  // Pricing, Deposits & Payments (2)
  {
    id: 'deposit-hold',
    section: 'Pricing, Deposits & Payments',
    question: 'Do you take a deposit/hold?',
    answer: (
      <div className="space-y-3">
        <p><strong>Yes — a $500 refundable security hold.</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>When:</strong> Placed 48 hours before your rental start date</li>
          <li><strong>How:</strong> Authorization (hold) on your saved credit/debit card — not an actual charge</li>
          <li><strong>Release:</strong> Automatically released within 24 hours when you return the equipment clean, refueled, and in good condition</li>
          <li><strong>Charges:</strong> The hold may be charged for damage beyond normal wear, failure to refuel ($100), or excessive cleaning ($100)</li>
        </ul>
        <p className="text-sm text-gray-600">The $500 hold is a temporary authorization and does not cap your liability for major damage, loss, or theft.</p>
      </div>
    )
  },
  {
    id: 'payment-methods',
    section: 'Pricing, Deposits & Payments',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit/debit cards (Visa, Mastercard, Amex) via Stripe. For large commercial bookings, we also accept Interac e-Transfer or invoicing with NET 7-14 day terms (subject to credit approval).'
  },

  // Delivery & Transport (2)
  {
    id: 'delivery-service',
    section: 'Delivery & Transport',
    question: 'Do you deliver?',
    answer: (
      <div className="space-y-3">
        <p><strong>Yes!</strong> We offer delivery and pickup within the Greater Saint John area.</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Fee:</strong> $150 each way (total $300 for delivery + pickup)</li>
          <li><strong>Service:</strong> We load, transport, and unload at your site</li>
          <li><strong>Requirements:</strong> Safe, level access for our trailer; clear path to work area</li>
          <li><strong>Distance:</strong> Pricing may vary for locations beyond 50 km from Saint John</li>
        </ul>
        <p className="text-sm text-gray-600">Delivery must be scheduled at booking. Last-minute requests subject to availability.</p>
      </div>
    )
  },
  {
    id: 'self-transport',
    section: 'Delivery & Transport',
    question: 'Can I tow or haul the skid steer myself?',
    answer: (
      <div className="space-y-3">
        <p><strong>Yes</strong>, if you have appropriate equipment and insurance:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Rated trailer (minimum 10,000 lb capacity)</li>
          <li>Properly rated hitch, safety chains, and tie-downs (minimum 4-point)</li>
          <li>Tow vehicle capable of 9,500+ lb load</li>
          <li>Auto Liability insurance ≥ $1,000,000 (required on your COI)</li>
          <li>Valid driver\'s license and registration</li>
        </ul>
        <p className="text-sm text-red-700 font-semibold">You are responsible for safe loading, tie-down, transport, and unloading. We recommend professional loading assistance. Never ride in the cab during loading/unloading.</p>
      </div>
    )
  },

  // Safety & Operation (4)
  {
    id: 'ppe-required',
    section: 'Safety & Operation',
    question: 'What safety gear (PPE) is required?',
    answer: (
      <div className="space-y-3">
        <p><strong>At minimum:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>CSA-approved safety boots (steel toe or composite)</li>
          <li>High-visibility vest or clothing</li>
          <li>Eye protection (safety glasses or goggles)</li>
          <li>Hearing protection (if operating for extended periods)</li>
          <li>Hard hat (where overhead hazards exist)</li>
          <li>Gloves (recommended for operating controls and attachments)</li>
        </ul>
        <p className="text-sm text-blue-700 font-semibold">
          See our <Link href="/safety" className="underline">Safety Guidance</Link> page for complete PPE and operating requirements.
        </p>
      </div>
    )
  },
  {
    id: 'training-required',
    section: 'Safety & Operation',
    question: 'Do I need training?',
    answer: 'You must be competent to operate the equipment. We provide basic orientation on controls and safety features at delivery/pickup. If you\'re new to skid steers, we strongly recommend seeking professional training or hiring an experienced operator. WorkSafeNB and other organizations offer operator certification courses.'
  },
  {
    id: 'operating-limits',
    section: 'Safety & Operation',
    question: 'Are there operating limits?',
    answer: (
      <div className="space-y-3">
        <p><strong>Yes. Critical limits include:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Max slope/grade:</strong> ≤ 25° — travel straight up/down, never side-hill</li>
          <li><strong>No riders:</strong> Operator only in the cab — never carry passengers</li>
          <li><strong>No lifting people:</strong> Never use as a man-lift or aerial platform</li>
          <li><strong>Rated capacity:</strong> Stay within manufacturer load ratings (see operator manual)</li>
          <li><strong>Prohibited uses:</strong> No demolition beyond rated capability, no hazmat, no saltwater operation</li>
        </ul>
        <p className="text-sm text-gray-600">See the Equipment Rider and Operator\'s Manual for complete operating limits.</p>
      </div>
    )
  },
  {
    id: 'utility-locates',
    section: 'Safety & Operation',
    question: 'Do I need utility locates?',
    answer: (
      <div className="space-y-3">
        <p className="font-bold text-red-700">YES — ALWAYS.</p>
        <p>Before any ground disturbance, you <strong>must</strong> have utility locates completed and marked on site. This includes:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Power lines (overhead and underground)</li>
          <li>Gas lines</li>
          <li>Water/sewer</li>
          <li>Telecom/internet cables</li>
          <li>Any other buried infrastructure</li>
        </ul>
        <p className="text-sm">In New Brunswick, contact <strong>Click Before You Dig (1-800-565-2345)</strong> at least 3 business days before digging.</p>
        <p className="text-sm font-semibold text-red-700">You are 100% responsible for utility strike damage, fines, and downtime. Failure to locate is a breach of the rental agreement.</p>
      </div>
    )
  },

  // Checklists & Daily Use (2)
  {
    id: 'daily-checklist',
    section: 'Checklists & Daily Use',
    question: 'What should I check before I start?',
    answer: (
      <div className="space-y-3">
        <p><strong>Daily Pre-Start Inspection (required):</strong></p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Walk around — check for leaks, damage, loose parts</li>
          <li>Check engine oil, hydraulic fluid, coolant levels</li>
          <li>Inspect tracks for damage, tension, and debris</li>
          <li>Test all lights, horn, backup alarm</li>
          <li>Check seat belt, ROPS/FOPS integrity</li>
          <li>Ensure no one is near the machine before starting</li>
          <li>Test all controls (lift, tilt, drive) before working</li>
          <li>Grease pivot points per manufacturer schedule</li>
        </ul>
        <p className="text-sm text-blue-700 font-semibold">
          Full checklist available in our <Link href="/safety" className="underline">Safety Guidance</Link> page.
        </p>
      </div>
    )
  },
  {
    id: 'slope-tips',
    section: 'Checklists & Daily Use',
    question: 'Any tips for working on slopes?',
    answer: (
      <div className="space-y-3">
        <p><strong>Maximum slope: 25° (46% grade).</strong> Best practices:</p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Travel <strong>straight up/down</strong> — never across the slope (side-hilling)</li>
          <li>Keep the bucket/attachment <strong>low and tilted back</strong> when traveling</li>
          <li>Drive slowly and maintain control at all times</li>
          <li>Avoid sudden movements or sharp turns on grades</li>
          <li>If the machine feels unstable, <strong>stop immediately</strong> and back down slowly</li>
          <li>Never load or unload on a slope</li>
        </ul>
        <p className="text-sm font-semibold text-red-700">If you\'re unsure about slope safety, don\'t risk it. Contact us for guidance.</p>
      </div>
    )
  },

  // Incidents & Emergencies (1)
  {
    id: 'accident-protocol',
    section: 'Incidents & Emergencies',
    question: 'What if there\'s an accident, utility strike, fire, or tip‑over?',
    answer: (
      <div className="space-y-3">
        <p className="font-bold text-red-700">Life-threatening emergency: Call 911 FIRST.</p>
        <p><strong>Then immediately contact U‑Dig It Rentals:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Phone: <a href="tel:+15066431575" className="text-blue-600 underline font-semibold">1-506-643-1575</a></li>
          <li>Email: <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 underline">nickbaxter@udigit.ca</a></li>
        </ul>
        <p><strong>For utility strikes:</strong> Also notify the utility company immediately.</p>
        <p><strong>For theft/vandalism:</strong> File a police report and provide us with the report number.</p>
        <p className="text-sm text-gray-600">Do NOT move the equipment after an incident unless it poses an immediate safety hazard. Take photos and document the scene.</p>
        <p className="text-sm font-semibold">Failure to report incidents promptly may affect your insurance claim and liability.</p>
      </div>
    )
  },

  // Returns & After‑Rental (2)
  {
    id: 'return-condition',
    section: 'Returns & After‑Rental',
    question: 'How should I return the equipment?',
    answer: (
      <div className="space-y-3">
        <p><strong>Return checklist:</strong></p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Park on level ground, bucket down, brake set</li>
          <li>Record hour meter reading (take photo)</li>
          <li>Clean radiator/engine bay of debris</li>
          <li>Remove mud/dirt from tracks and undercarriage</li>
          <li>Return all attachments, keys, manuals, and accessories</li>
          <li>Refuel to full (diesel) — or accept $100 refuel charge</li>
          <li>Notify us when ready for pickup (if delivery service) or bring to our yard during business hours</li>
        </ul>
        <p className="text-sm text-green-700 font-semibold">Equipment returned clean, refueled, and in good condition = $500 security hold released within 24 hours!</p>
      </div>
    )
  },
  {
    id: 'fuel-cleaning',
    section: 'Returns & After‑Rental',
    question: 'Fuel and cleaning?',
    answer: (
      <div className="space-y-3">
        <p><strong>Fuel:</strong> Return with a <strong>full tank of diesel</strong>. If not full, we charge a flat $100 refueling fee (or actual fuel cost + $50 service fee, whichever is greater).</p>
        <p><strong>Cleaning:</strong> Remove <strong>excessive mud, dirt, and debris</strong>. A quick wash-down is appreciated but not required. Heavy cleaning (caked mud, contamination) is billed at $100 flat rate.</p>
        <p className="text-sm text-gray-600">Normal job-site dirt is expected. We\'re looking for reasonable cleanliness, not showroom condition.</p>
      </div>
    )
  },

  // Policies & Legal (2)
  {
    id: 'full-terms',
    section: 'Policies & Legal',
    question: 'Where can I read the full terms and policies?',
    answer: (
      <div className="space-y-3">
        <p><strong>Key documents:</strong></p>
        <ul className="space-y-2">
          <li>
            <Link href="/terms" className="text-blue-600 hover:underline font-semibold flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Terms & Conditions (Master Agreement)
            </Link>
          </li>
          <li>
            <Link href="/equipment-rider" className="text-blue-600 hover:underline font-semibold flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Equipment Rider (SVL75-3 Specific Terms)
            </Link>
          </li>
          <li>
            <Link href="/safety" className="text-blue-600 hover:underline font-semibold flex items-center">
              <HardHat className="w-4 h-4 mr-2" />
              Safety Guidance & Operator Resources
            </Link>
          </li>
          <li>
            <Link href="/insurance" className="text-blue-600 hover:underline font-semibold flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Getting Insurance Guide
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="text-blue-600 hover:underline font-semibold flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/disclaimer" className="text-blue-600 hover:underline font-semibold flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Disclaimer & Liability Limits
            </Link>
          </li>
        </ul>
        <p className="text-sm text-gray-600 mt-3">Your signed rental agreement and equipment rider govern if there\'s any conflict with these FAQs.</p>
      </div>
    )
  },
  {
    id: 'governing-law',
    section: 'Policies & Legal',
    question: 'What law governs my rental?',
    answer: 'All rental agreements and disputes are governed by the laws of the Province of New Brunswick and the federal laws of Canada. Venue and jurisdiction lie with the courts of New Brunswick.'
  }
];

const sections = [
  { id: 'booking', name: 'Booking & Eligibility', icon: BookOpen, color: 'blue' },
  { id: 'insurance', name: 'Insurance & Liability', icon: Shield, color: 'green' },
  { id: 'pricing', name: 'Pricing, Deposits & Payments', icon: DollarSign, color: 'yellow' },
  { id: 'delivery', name: 'Delivery & Transport', icon: Truck, color: 'purple' },
  { id: 'safety', name: 'Safety & Operation', icon: HardHat, color: 'red' },
  { id: 'checklists', name: 'Checklists & Daily Use', icon: Clipboard, color: 'indigo' },
  { id: 'incidents', name: 'Incidents & Emergencies', icon: AlertTriangle, color: 'orange' },
  { id: 'returns', name: 'Returns & After‑Rental', icon: RotateCcw, color: 'teal' },
  { id: 'policies', name: 'Policies & Legal', icon: FileText, color: 'gray' },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(searchQuery.toLowerCase())) ||
    faq.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (id: string) => {
    const newOpen = new Set(openFAQs);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenFAQs(newOpen);
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/faq#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToSection = (sectionName: string) => {
    const element = sectionRefs.current[sectionName];
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;

      for (const section of sections) {
        const element = sectionRefs.current[section.name];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.name);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Open FAQ from URL hash
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      setOpenFAQs(new Set([id]));
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, []);

  // Prepare FAQ data for schema (text-only answers)
  const faqSchemaData = faqs
    .filter(faq => typeof faq.answer === 'string')
    .map(faq => ({
      question: faq.question,
      answer: faq.answer as string
    }));

  return (
    <>
      {/* FAQ Page Schema for Rich Snippets */}
      <FAQSchema faqs={faqSchemaData} />

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

        {/* Hero Section */}
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

          {/* Multiple Logo Watermarks - Responsive */}
          <div className="pointer-events-none absolute inset-0">
            {/* Desktop Watermarks - Original (hidden on mobile) */}
            <div className="hidden md:block">
            {/* Top Left Corner */}
            <div className="absolute left-12 top-8 rotate-[8deg] opacity-10">
              <div className="relative h-56 w-56">
                <Image
                  src="/images/udigit-logo.png"
                  alt="U-Dig It Rentals FAQ Saint John NB"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 40px, 56px"
                  unoptimized
                />
              </div>
            </div>

            {/* Top Right Corner */}
            <div className="absolute right-16 top-12 rotate-[-10deg] opacity-10">
              <div className="relative h-60 w-60">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Equipment Rental Help Center"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 44px, 60px"
                  unoptimized
                />
              </div>
            </div>

            {/* Upper Left */}
            <div className="absolute left-[15%] top-[22%] rotate-[-6deg] opacity-10">
              <div className="relative h-48 w-48">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Rental Questions & Answers"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 32px, 48px"
                  unoptimized
                />
              </div>
            </div>

            {/* Upper Right */}
            <div className="absolute right-[18%] top-[24%] rotate-[12deg] opacity-10">
              <div className="relative h-52 w-52">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Customer Support FAQ"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 36px, 52px"
                  unoptimized
                />
              </div>
            </div>

            {/* Center Right */}
            <div className="absolute right-0 top-[45%] translate-x-[35%] rotate-[15deg] transform opacity-10">
              <div className="relative h-80 w-80">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Heavy Equipment Rental FAQ"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 60px, 80px"
                  unoptimized
                />
              </div>
            </div>

            {/* Center Left */}
            <div className="absolute left-0 top-[48%] -translate-x-[35%] rotate-[-12deg] transform opacity-10">
              <div className="w-76 h-76 relative">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Skid Steer Rental Help"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 56px, 76px"
                  unoptimized
                />
              </div>
            </div>

            {/* Bottom Left */}
            <div className="absolute bottom-[12%] left-[20%] rotate-[4deg] opacity-10">
              <div className="relative h-44 w-44">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Booking Questions Answered"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 32px, 44px"
                  unoptimized
                />
              </div>
            </div>

            {/* Bottom Right */}
            <div className="absolute bottom-[10%] right-[22%] rotate-[-7deg] opacity-10">
              <div className="relative h-48 w-48">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Insurance & Safety FAQ"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 36px, 48px"
                  unoptimized
                />
              </div>
            </div>

            {/* Upper Center */}
            <div className="absolute left-[30%] top-[11%] rotate-[5deg] opacity-10">
              <div className="relative h-40 w-40">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Frequently Asked Questions"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 28px, 40px"
                  unoptimized
                />
              </div>
            </div>
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
                  HELP CENTER
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Frequently Asked
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Questions
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Quick answers about booking, insurance, safety, and everything you need to know.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  Book Equipment Now
                </Link>
                <Link
                  href="/contact"
                  className="transform rounded-lg border-2 border-white bg-white/10 px-8 py-4 text-lg font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-gray-900"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">

            {/* Sidebar Navigation - Desktop */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Quick Navigation</h2>
                <nav className="space-y-1">
                  {sections.map((section: any) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.name;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.name)}
                        className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-[#E1BC56] text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{section.name}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Contact Card */}
                <div className="mt-8 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Still Have Questions?</h3>
                  </div>
                  <p className="mb-3 text-sm text-blue-800">
                    Can't find what you're looking for? We're here to help!
                  </p>
                  <Link
                    href="/contact"
                    className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="lg:col-span-3">

              {/* Search Bar */}
              <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e: any) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 py-3 pl-12 pr-12 text-gray-900 placeholder-gray-500 focus:border-[#E1BC56] focus:outline-none focus:ring-2 focus:ring-[#E1BC56]/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <p className="mt-3 text-sm text-gray-600">
                    Found {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* FAQ Sections */}
              <div className="space-y-8">
                {sections.map((section: any) => {
                  const sectionFAQs = filteredFAQs.filter(faq => faq.section === section.name);
                  if (sectionFAQs.length === 0 && searchQuery) return null;

                  const Icon = section.icon;
                  const colorClasses = {
                    blue: 'border-blue-500 bg-blue-50',
                    green: 'border-green-500 bg-green-50',
                    yellow: 'border-yellow-500 bg-yellow-50',
                    purple: 'border-purple-500 bg-purple-50',
                    red: 'border-red-500 bg-red-50',
                    indigo: 'border-indigo-500 bg-indigo-50',
                    orange: 'border-orange-500 bg-orange-50',
                    teal: 'border-teal-500 bg-teal-50',
                    gray: 'border-gray-500 bg-gray-50',
                  };

                  return (
                    <section
                      key={section.id}
                      ref={(el: any) => { sectionRefs.current[section.name] = el; }}
                      className="rounded-lg bg-white shadow-md"
                    >
                      <div className={`flex items-center gap-3 rounded-t-lg border-l-4 p-6 ${colorClasses[section.color as keyof typeof colorClasses]}`}>
                        <Icon className="h-6 w-6 flex-shrink-0" />
                        <h2 className="text-2xl font-bold text-gray-900">
                          {section.name} ({sectionFAQs.length})
                        </h2>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {sectionFAQs.map((faq: any) => {
                          const isOpen = openFAQs.has(faq.id);
                          const isCopied = copiedId === faq.id;

                          return (
                            <div key={faq.id} id={faq.id} className="scroll-mt-24">
                              <div className="flex w-full items-start justify-between gap-4 p-6 transition-colors hover:bg-gray-50">
                                <button
                                  onClick={() => toggleFAQ(faq.id)}
                                  className="flex-1 text-left"
                                >
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {faq.question}
                                  </h3>
                                </button>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={(e: any) => {
                                      e.stopPropagation();
                                      copyLink(faq.id);
                                    }}
                                    className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                    title="Copy link"
                                  >
                                    {isCopied ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => toggleFAQ(faq.id)}
                                    className="p-2"
                                    aria-label={isOpen ? 'Collapse answer' : 'Expand answer'}
                                  >
                                    {isOpen ? (
                                      <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {isOpen && (
                                <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                                  <div className="prose prose-sm max-w-none text-gray-700">
                                    {typeof faq.answer === 'string' ? (
                                      <p>{faq.answer}</p>
                                    ) : (
                                      faq.answer
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>

              {/* No Results */}
              {searchQuery && filteredFAQs.length === 0 && (
                <div className="rounded-lg bg-white p-12 text-center shadow-md">
                  <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">No results found</h3>
                  <p className="mb-4 text-gray-600">
                    We couldn't find any questions matching "{searchQuery}"
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#A90F0F] px-6 py-3 font-semibold text-white hover:bg-[#8a0c0c]"
                  >
                    <Mail className="h-5 w-5" />
                    Ask Us Directly
                  </Link>
                </div>
              )}

              {/* Emergency Notice */}
              <div className="mt-8 rounded-lg border-2 border-red-200 bg-red-50 p-6">
                <div className="mb-3 flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-600" />
                  <h3 className="text-lg font-bold text-red-900">Emergency? Life-Threatening Situation?</h3>
                </div>
                <p className="mb-4 text-red-800">
                  <strong>Call 911 immediately.</strong> Then contact U‑Dig It Rentals at{' '}
                  <a href="tel:+15066431575" className="font-bold underline">1-506-643-1575</a>.
                </p>
                <p className="text-sm text-red-700">
                  For non-emergency issues during business hours, call us or email{' '}
                  <a href="mailto:nickbaxter@udigit.ca" className="underline">nickbaxter@udigit.ca</a>.
                </p>
              </div>

              {/* Contact Card - Mobile */}
              <div className="mt-8 rounded-lg border-2 border-blue-200 bg-blue-50 p-6 lg:hidden">
                <div className="mb-4 flex items-center gap-3">
                  <Mail className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Still Have Questions?</h3>
                </div>
                <p className="mb-4 text-blue-800">
                  Can't find what you're looking for? We're here to help!
                </p>
                <div className="space-y-3">
                  <a
                    href="tel:+15066431575"
                    className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white hover:bg-blue-700"
                  >
                    📞 Call (506) 643-1575
                  </a>
                  <Link
                    href="/contact"
                    className="block w-full rounded-lg border-2 border-blue-600 bg-white px-6 py-3 text-center font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    ✉️ Contact Form
                  </Link>
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

