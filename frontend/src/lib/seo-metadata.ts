import { Metadata } from 'next';

/**
 * SEO-Optimized Metadata for all pages
 * Following 2025 SEO best practices
 */

const baseUrl = 'https://udigit.ca';
const businessName = 'U-Dig It Rentals Inc';
const location = 'Saint John, New Brunswick';
const phone = '(506) 643-1575';
const defaultImage = `${baseUrl}/images/udigit-logo.png`;

export const siteMetadata = {
  businessName,
  location,
  phone,
  email: 'nickbaxter@udigit.ca',
  address: '945 Golden Grove Road, Saint John, NB E2H 2X1',
  hours: 'Mon-Sun 7:00am - 7:00pm',
};

// Home Page
export const homeMetadata: Metadata = {
  title: `Kubota SVL75-3 Rental Saint John NB | Professional Equipment | ${businessName}`,
  description: `Professional Kubota SVL75-3 compact track loader rental in ${location}. $350/day, delivery included, 24/7 support. Book online or call ${phone} today!`,
  keywords: 'kubota svl75-3 rental, skid steer rental saint john, compact track loader nb, equipment rental new brunswick, excavation equipment saint john',
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: 'Kubota SVL75-3 Rental Saint John | U-Dig It Rentals',
    description: 'Professional track loader rental with delivery, insurance help & 24/7 support in Saint John, NB.',
    url: baseUrl,
    siteName: businessName,
    images: [{ url: defaultImage }],
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kubota SVL75-3 Rental Saint John',
    description: 'Professional equipment rental with delivery & support',
  },
};

// Equipment Page
export const equipmentMetadata: Metadata = {
  title: `2025 Kubota SVL75-3 Compact Track Loader | Rental Specs & Pricing | ${location}`,
  description: `Rent the 2025 Kubota SVL75-3: 74.3 HP, 9,190 lb, 68" width. $350/day in ${location}. Perfect for excavation, landscaping & construction. Call ${phone}.`,
  keywords: 'kubota svl75-3 specs, compact track loader rental, skid steer pricing saint john, equipment specifications nb',
  alternates: {
    canonical: `${baseUrl}/equipment`,
  },
  openGraph: {
    title: '2025 Kubota SVL75-3 Rental | Specs & Pricing',
    description: '74.3 HP compact track loader rental in Saint John, NB. Delivery available.',
    url: `${baseUrl}/equipment`,
  },
};

// Book Now Page
export const bookMetadata: Metadata = {
  title: `Book Equipment Rental Online | Instant Quote | ${businessName} ${location}`,
  description: `Book your Kubota SVL75-3 rental online in minutes. Real-time availability, instant pricing, flexible scheduling. Same-day delivery available. ${phone}`,
  keywords: 'book equipment rental saint john, online booking skid steer, rental quote nb, equipment reservation',
  alternates: {
    canonical: `${baseUrl}/book`,
  },
  openGraph: {
    title: 'Book Equipment Rental Online | U-Dig It',
    description: 'Instant quotes, real-time availability, same-day delivery',
    url: `${baseUrl}/book`,
  },
};

// Safety Page
export const safetyMetadata: Metadata = {
  title: `Equipment Safety Guide | Operator Requirements & PPE | WorkSafeNB Compliant`,
  description: `Complete safety guide for equipment rental in ${location}. PPE requirements, operating limits, pre-start checklists, utility locates. WorkSafeNB compliant. ${phone}`,
  keywords: 'equipment safety guide, skid steer operator requirements, worksafenb compliance, ppe equipment rental, utility locate new brunswick',
  alternates: {
    canonical: `${baseUrl}/safety`,
  },
  openGraph: {
    title: 'Equipment Safety Guide | U-Dig It Rentals',
    description: 'WorkSafeNB compliant safety guidance for equipment operators',
    url: `${baseUrl}/safety`,
  },
};

// Insurance Page
export const insuranceMetadata: Metadata = {
  title: `Equipment Rental Insurance Guide | COI Requirements ${location} | ${businessName}`,
  description: `How to get insurance for equipment rental in ${location}. COI requirements, local brokers, coverage limits, email templates. Get approved fast! ${phone}`,
  keywords: 'equipment rental insurance new brunswick, coi requirements saint john, rental liability insurance, construction insurance nb',
  alternates: {
    canonical: `${baseUrl}/insurance`,
  },
  openGraph: {
    title: 'Equipment Rental Insurance Guide | U-Dig It',
    description: 'COI requirements, local brokers & templates for Saint John, NB',
    url: `${baseUrl}/insurance`,
  },
};

// FAQ Page
export const faqMetadata: Metadata = {
  title: `Equipment Rental FAQ | Insurance, Safety, Pricing Answers | ${location}`,
  description: `34 answered questions about skid steer rental in ${location}. Insurance requirements, safety rules, pricing, delivery, returns. Find your answer fast! ${phone}`,
  keywords: 'equipment rental faq, skid steer questions saint john, rental insurance faq, equipment safety questions nb',
  alternates: {
    canonical: `${baseUrl}/faq`,
  },
  openGraph: {
    title: 'Equipment Rental FAQ | U-Dig It Rentals',
    description: 'Get answers about insurance, safety, pricing & delivery in Saint John',
    url: `${baseUrl}/faq`,
  },
};

// Contact Page
export const contactMetadata: Metadata = {
  title: `Contact U-Dig It Rentals | Equipment Rental ${location} | ${phone}`,
  description: `Contact us for equipment rental in ${location}. Phone, email, live chat. Mon-Sun 7am-7pm. 945 Golden Grove Rd. Same-day quotes. ${phone}`,
  keywords: 'contact equipment rental saint john, udigit rentals phone, rental company contact nb, equipment rental hours',
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
  openGraph: {
    title: 'Contact U-Dig It Rentals | Saint John, NB',
    description: 'Get in touch: Phone, email, or visit us. Mon-Sun 7am-7pm',
    url: `${baseUrl}/contact`,
  },
};

// About Page
export const aboutMetadata: Metadata = {
  title: `About U-Dig It Rentals | Local Equipment Rental Company ${location} | Our Story`,
  description: `Family-owned equipment rental in ${location} since 2020. Professional Kubota SVL75-3 rentals, 24/7 support, licensed & insured. Meet our team! ${phone}`,
  keywords: 'about u-dig it rentals, equipment rental company saint john, local rental business nb, kubota dealer new brunswick',
  alternates: {
    canonical: `${baseUrl}/about`,
  },
  openGraph: {
    title: 'About U-Dig It Rentals | Our Story',
    description: 'Family-owned equipment rental serving Saint John, NB since 2020',
    url: `${baseUrl}/about`,
  },
};

// Terms Page
export const termsMetadata: Metadata = {
  title: `Rental Terms & Conditions | Equipment Rental Agreement | ${businessName}`,
  description: `Complete rental terms for equipment in ${location}. Liability, insurance requirements, damage policy, payment terms. Read before booking. ${phone}`,
  keywords: 'equipment rental terms, rental agreement saint john, liability policy, rental conditions nb',
  alternates: {
    canonical: `${baseUrl}/terms`,
  },
};

// Privacy Page
export const privacyMetadata: Metadata = {
  title: `Privacy Policy | Data Protection & PIPEDA Compliance | ${businessName}`,
  description: `How we protect your data. PIPEDA compliant privacy policy for ${businessName}. Personal information, cookies, third-party services. ${location}`,
  keywords: 'privacy policy, data protection canada, pipeda compliance, rental privacy nb',
  alternates: {
    canonical: `${baseUrl}/privacy`,
  },
};

// Cookie Policy
export const cookieMetadata: Metadata = {
  title: `Cookie Policy | Tracking & Storage Explained | ${businessName}`,
  description: `How we use cookies and storage: Supabase auth, Stripe payments, analytics. Detailed cookie list, opt-out options. ${location}`,
  keywords: 'cookie policy, website cookies, tracking policy, data storage',
  alternates: {
    canonical: `${baseUrl}/cookies`,
  },
};

// Accessibility Page
export const accessibilityMetadata: Metadata = {
  title: `Accessibility Statement | WCAG 2.2 AA Commitment | ${businessName}`,
  description: `Our commitment to accessibility. WCAG 2.2 Level AA compliance, screen reader support, keyboard navigation. Report issues: ${phone}`,
  keywords: 'website accessibility, wcag compliance, accessible design, screen reader support',
  alternates: {
    canonical: `${baseUrl}/accessibility`,
  },
};

// Disclaimer Page
export const disclaimerMetadata: Metadata = {
  title: `Legal Disclaimer | Liability Limits & Equipment Use | ${businessName}`,
  description: `Important legal disclaimers about equipment use, liability limits, indemnity, warranties. Governed by New Brunswick law. ${location}`,
  keywords: 'legal disclaimer, liability limits, equipment rental disclaimer, indemnity agreement',
  alternates: {
    canonical: `${baseUrl}/disclaimer`,
  },
};

// Imprint Page
export const imprintMetadata: Metadata = {
  title: `Imprint | Legal Notice & Company Information | ${businessName}`,
  description: `Legal notice for ${businessName}. Corporate registration, tax IDs, responsible parties, contact for legal matters. ${location}`,
  keywords: 'imprint, legal notice, company information, corporate details',
  alternates: {
    canonical: `${baseUrl}/imprint`,
  },
};

// Equipment Rider Page
export const equipmentRiderMetadata: Metadata = {
  title: `SVL75-3 Equipment Rider | Specific Terms & Operating Limits | ${businessName}`,
  description: `Equipment-specific terms for 2025 Kubota SVL75-3. Operating limits, insurance requirements, financial terms, safety rules. ${location}`,
  keywords: 'equipment rider, svl75-3 terms, operating limits, rental specific terms',
  alternates: {
    canonical: `${baseUrl}/equipment-rider`,
  },
};

// Spin to Win Terms
export const spinToWinMetadata: Metadata = {
  title: `Spin to Win Terms | Prize Probabilities & Rules | ${businessName}`,
  description: `Official Spin to Win promotion terms. Win $50-$100 off! Prize probabilities, eligibility, redemption rules. First-time renters only. ${location}`,
  keywords: 'spin to win terms, rental promotion, discount terms, prize probabilities',
  alternates: {
    canonical: `${baseUrl}/spin-to-win-terms`,
  },
};

// Sitemap Page
export const sitemapMetadata: Metadata = {
  title: `Site Navigation | All Pages & Policies | ${businessName} ${location}`,
  description: `Complete site navigation for ${businessName}. Browse all pages, policies, resources & support. Find what you need quickly. ${phone}`,
  keywords: 'sitemap, site navigation, all pages, website index',
  alternates: {
    canonical: `${baseUrl}/sitemap-page`,
  },
};

// Support Page (if exists)
export const supportMetadata: Metadata = {
  title: `Customer Support | Help Center | ${businessName} ${location}`,
  description: `Get help with your equipment rental. Support center, contact options, hours. Available Mon-Sun 7am-7pm. ${phone}`,
  keywords: 'customer support, rental help, contact support, equipment rental assistance',
  alternates: {
    canonical: `${baseUrl}/support`,
  },
};


