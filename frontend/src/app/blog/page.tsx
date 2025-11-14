import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { LocalBusinessSchema } from '@/components/StructuredData';
import { ArrowRight, Calendar, Clock, User } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Equipment Rental Blog | Tips & Guides | U-Dig It Rentals NB',
  description: 'Expert equipment rental guides, safety tips, and local NB regulations. Learn about Kubota operation, insurance requirements, permits, and project planning in Saint John.',
  keywords: 'equipment rental guide, kubota tips, heavy equipment safety, excavation permits nb, construction equipment insurance, saint john rental advice',
  openGraph: {
    title: 'Equipment Rental Blog | Expert Tips & Guides | U-Dig It',
    description: 'Professional equipment rental guides for Saint John, NB. Safety tips, permits, insurance, and project planning advice.',
    url: 'https://udigit.ca/blog',
    type: 'website',
  },
  alternates: {
    canonical: 'https://udigit.ca/blog'
  }
};

const blogPosts = [
  {
    slug: 'equipment-rental-guide-saint-john-nb',
    title: 'Complete Guide to Renting Heavy Equipment in Saint John, NB',
    excerpt: 'Everything you need to know about renting construction equipment in Saint John - from choosing the right machine to delivery logistics, insurance, and permits.',
    author: 'U-Dig It Rentals Team',
    date: 'November 2, 2025',
    readTime: '8 min read',
    category: 'Guides',
    image: '/images/kubota-svl-75-hero.png',
    tags: ['Equipment Rental', 'Saint John', 'Beginner Guide', 'Kubota']
  },
  {
    slug: 'kubota-svl75-safety-operation-tips',
    title: 'How to Operate a Kubota Track Loader Safely: Complete Operator Guide',
    excerpt: 'Master safe operation of the Kubota SVL75-3 with our comprehensive guide covering pre-start checks, safety protocols, and expert operating tips.',
    author: 'U-Dig It Rentals Team',
    date: 'November 1, 2025',
    readTime: '10 min read',
    category: 'Safety',
    image: '/images/kubota-svl-75-hero.png',
    tags: ['Safety', 'Kubota SVL75-3', 'Operation Guide', 'Best Practices']
  },
  {
    slug: 'excavation-permits-insurance-requirements-nb',
    title: 'Excavation Permits & Insurance Requirements in New Brunswick: 2025 Guide',
    excerpt: 'Navigate NB regulations with confidence. Learn about excavation permits, utility locates, insurance requirements, and legal compliance for construction projects.',
    author: 'U-Dig It Rentals Team',
    date: 'October 30, 2025',
    readTime: '7 min read',
    category: 'Regulations',
    image: '/images/kubota-svl-75-hero.png',
    tags: ['Permits', 'Insurance', 'Regulations', 'New Brunswick']
  },
];

export default function BlogIndexPage() {
  return (
    <>
      <LocalBusinessSchema />

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

          {/* Multiple Logo Watermarks - SEO Optimized - Responsive */}
          <div className="pointer-events-none absolute inset-0">
            {/* Desktop Watermarks - Original (hidden on mobile) */}
            <div className="hidden md:block">
              <div className="absolute left-10 top-10 opacity-10"><div className="relative h-64 w-64"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals Blog - Equipment Rental Tips Saint John" fill className="object-contain" sizes="64px" unoptimized /></div></div>
              <div className="absolute right-20 top-20 rotate-12 opacity-10"><div className="relative h-48 w-48"><Image src="/images/udigit-logo.png" alt="Equipment Rental Guides - Kubota Safety Tips" fill className="object-contain" sizes="48px" unoptimized /></div></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 transform opacity-10"><div className="relative h-96 w-96"><Image src="/images/udigit-logo.png" alt="New Brunswick Equipment Rental Resources" fill className="object-contain" sizes="96px" unoptimized /></div></div>
              <div className="absolute left-0 top-1/3 -translate-x-1/4 -rotate-12 transform opacity-10"><div className="relative h-72 w-72"><Image src="/images/udigit-logo.png" alt="Construction Equipment Rental Blog NB" fill className="object-contain" sizes="72px" unoptimized /></div></div>
              <div className="absolute bottom-20 left-32 rotate-6 opacity-10"><div className="relative h-56 w-56"><Image src="/images/udigit-logo.png" alt="Heavy Equipment Operation Tips Saint John" fill className="object-contain" sizes="56px" unoptimized /></div></div>
              <div className="absolute bottom-10 right-10 -rotate-6 opacity-10"><div className="relative h-64 w-64"><Image src="/images/udigit-logo.png" alt="Excavation Permits NB - Rental Regulations" fill className="object-contain" sizes="64px" unoptimized /></div></div>
              <div className="absolute left-1/2 top-5 -translate-x-1/2 rotate-3 transform opacity-10"><div className="relative h-40 w-40"><Image src="/images/udigit-logo.png" alt="Professional Equipment Rental Advice" fill className="object-contain" sizes="40px" unoptimized /></div></div>
              <div className="absolute bottom-5 left-1/3 -rotate-3 opacity-10"><div className="relative h-52 w-52"><Image src="/images/udigit-logo.png" alt="Kubota Track Loader Resources" fill className="object-contain" sizes="52px" unoptimized /></div></div>
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

          <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="headline-3d text-center">
              <div className="mb-6 inline-block">
                <span className="rounded-full border border-[#E1BC56]/30 bg-[#E1BC56]/20 px-6 py-2 text-sm font-semibold tracking-wide text-[#E1BC56] backdrop-blur-sm">RESOURCE CENTER</span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Equipment Rental<br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">Blog & Guides</span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Expert tips, safety guides, and local regulations for equipment rental in New Brunswick
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        </div>

        {/* Blog Posts Grid */}
        <div className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post: any) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-lg transition-all hover:border-[#E1BC56] hover:shadow-2xl"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-gray-200">
                    <Image
                      src={post.image}
                      alt={`${post.title} - Equipment Rental Guide`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute right-3 top-3 rounded-full bg-[#E1BC56] px-3 py-1 text-xs font-bold text-black">
                      {post.category}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {post.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime}
                      </div>
                    </div>

                    <h2 className="mb-3 text-xl font-bold text-gray-900 group-hover:text-[#A90F0F]">
                      {post.title}
                    </h2>

                    <p className="mb-4 flex-1 text-gray-700">
                      {post.excerpt}
                    </p>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {post.tags.map((tag: any) => (
                        <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-[#A90F0F]">
                        Read More
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA Section */}
            <div className="mt-12 rounded-lg bg-gradient-to-r from-[#A90F0F] to-[#8a0c0c] p-8 text-white">
              <h2 className="mb-4 text-3xl font-bold">Ready to Rent Equipment?</h2>
              <p className="mb-6 text-lg text-white/90">
                Put your knowledge into action! Book professional Kubota equipment for your Saint John project today.
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
        </div>

        <Footer />
      </div>
    </>
  );
}

